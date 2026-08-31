#!/usr/bin/env python3
import io,json,math,os,time
from collections import Counter,defaultdict
from pathlib import Path
import requests,torch
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import service_account
from PIL import Image,ImageDraw,ImageFont
from transformers import AutoModelForZeroShotObjectDetection,AutoProcessor,Sam2Model,Sam2Processor

FOLDER=os.getenv('GLOWCAST_REFERENCE_FOLDER_ID','154_ygM9h5WUEI_HfRPW6FqkCM5ILh5Z6')
OUT=Path(os.getenv('GLOWCAST_BENCHMARK_OUT','private-benchmark-evidence'))
DINO_ID=os.getenv('GLOWCAST_DINO_MODEL','IDEA-Research/grounding-dino-tiny')
SAM2_ID=os.getenv('GLOWCAST_SAM2_MODEL','facebook/sam2.1-hiera-tiny')
BOX=float(os.getenv('GLOWCAST_BOX_THRESHOLD','0.28'))
TEXT=float(os.getenv('GLOWCAST_TEXT_THRESHOLD','0.27'))
NMS_IOU=float(os.getenv('GLOWCAST_NMS_IOU','0.52'))
CROSS_ALIAS_IOU=float(os.getenv('GLOWCAST_CROSS_ALIAS_IOU','0.90'))
MAX_WINDOW_AREA=float(os.getenv('GLOWCAST_MAX_WINDOW_AREA','0.55'))
MAX_GARAGE_AREA=float(os.getenv('GLOWCAST_MAX_GARAGE_AREA','0.55'))
PROMPTS=['window','door','garage door','garage opening','storefront window','storefront door','archway','architectural arch','column','glass panel']

def drive_token():
 token=os.getenv('GOOGLE_OAUTH_ACCESS_TOKEN','')
 if token:return token
 raw=os.getenv('GLOWCAST_GDRIVE_SERVICE_ACCOUNT_JSON','')
 if not raw:return ''
 creds=service_account.Credentials.from_service_account_info(json.loads(raw),scopes=['https://www.googleapis.com/auth/drive.readonly'])
 creds.refresh(GoogleAuthRequest()); return creds.token
TOKEN=drive_token()
if not TOKEN:raise SystemExit('Drive authentication is required')
OUT.mkdir(parents=True,exist_ok=True)
S=requests.Session(); S.headers.update({'Authorization':f'Bearer {TOKEN}'})

def get_json(url):
 r=S.get(url,timeout=60); r.raise_for_status(); return r.json()
def get_bytes(fid):
 r=S.get(f'https://www.googleapis.com/drive/v3/files/{fid}?alt=media',timeout=120); r.raise_for_status(); return r.content
def children(folder):
 q=requests.utils.quote(f"'{folder}' in parents and trashed = false"); fields=requests.utils.quote('nextPageToken,files(id,name,mimeType,size)'); out=[]; tok=''
 while True:
  u=f'https://www.googleapis.com/drive/v3/files?q={q}&pageSize=1000&fields={fields}'+(f'&pageToken={requests.utils.quote(tok)}' if tok else '')
  page=get_json(u); out+=page.get('files',[]); tok=page.get('nextPageToken','')
  if not tok:return out

def cls(label):
 s=label.lower()
 if 'garage' in s:return 'garage_doors'
 if 'window' in s or 'glass panel' in s:return 'windows'
 if 'door' in s:return 'doors'
 if 'arch' in s:return 'arches'
 if 'column' in s:return 'columns'
 return 'other'
def area(box):
 x1,y1,x2,y2=box; return max(0,x2-x1)*max(0,y2-y1)
def iou(a,b):
 ax1,ay1,ax2,ay2=a; bx1,by1,bx2,by2=b
 ix=max(0,min(ax2,bx2)-max(ax1,bx1)); iy=max(0,min(ay2,by2)-max(ay1,by1)); inter=ix*iy
 union=area(a)+area(b)-inter
 return inter/union if union else 0.0
def sanitize_label(label):
 return ' '.join(str(label).lower().replace('architectural ','').split())
def is_cross_alias(a,b):
 classes={a['class'],b['class']}
 if classes=={'arches','windows'}:
  return 'windows' if a['class']=='windows' else 'arches'
 if classes=={'garage_doors','doors'}:
  garage=a if a['class']=='garage_doors' else b
  if 'front door' in garage['label'].replace('doorfront','front door').replace('openingfront','opening front') or 'storefront door' in garage['label']:
   return 'doors' if a['class']=='doors' else 'garage_doors'
 return None
def semantic_filter(dets,w,h):
 image_area=float(w*h); staged=[]; rejected=[]
 for d in sorted(dets,key=lambda x:x['score'],reverse=True):
  ratio=area(d['box'])/image_area if image_area else 1.0
  if d['class']=='windows' and ratio>MAX_WINDOW_AREA:
   rejected.append({**d,'reject':'scene_wide_window','area_ratio':ratio}); continue
  if d['class']=='garage_doors' and ratio>MAX_GARAGE_AREA:
   rejected.append({**d,'reject':'scene_wide_garage','area_ratio':ratio}); continue
  dup=next((k for k in staged if k['class']==d['class'] and iou(k['box'],d['box'])>=NMS_IOU),None)
  if dup:
   rejected.append({**d,'reject':'duplicate_iou','area_ratio':ratio}); continue
  staged.append({**d,'area_ratio':ratio})
 keep=[True]*len(staged)
 for i,a in enumerate(staged):
  if not keep[i]:continue
  for j in range(i+1,len(staged)):
   if not keep[j]:continue
   b=staged[j]
   if iou(a['box'],b['box'])<CROSS_ALIAS_IOU:continue
   loser=is_cross_alias(a,b)
   if not loser:continue
   if a['class']==loser:
    keep[i]=False; rejected.append({**a,'reject':'cross_class_alias'}); break
   if b['class']==loser:
    keep[j]=False; rejected.append({**b,'reject':'cross_class_alias'})
 kept=[d for n,d in enumerate(staged) if keep[n]][:16]
 return kept,rejected

def score(expected,counts):
 expected=expected or {}
 if not expected:
  fp=sum(counts.values()); return {'expected_total':0,'matched_by_count':0,'count_recall':1.0 if fp==0 else 0.0,'false_positive_count':fp,'exact_count_pass':fp==0}
 total=sum(expected.values()); matched=sum(min(expected.get(k,0),counts.get(k,0)) for k in set(expected)|set(counts)); fp=sum(max(0,v-expected.get(k,0)) for k,v in counts.items())
 exact=all(counts.get(k,0)==v for k,v in expected.items()) and all(k in expected or v==0 for k,v in counts.items())
 return {'expected_total':total,'matched_by_count':matched,'count_recall':matched/total if total else None,'false_positive_count':fp,'exact_count_pass':exact}
def mask_for(masks,i):
 m=masks
 while m.ndim>3 and m.shape[0]==1:m=m[0]
 if m.ndim==4:m=m[i] if m.shape[0]>i else m[:,i]
 if m.ndim==3:m=m[i] if m.shape[0]>i and m.shape[1]>8 and m.shape[2]>8 else m[0]
 return (m.detach().cpu().numpy()>0) if m.ndim==2 else None
def overlay(img,dets,masks):
 base=img.convert('RGBA'); tint=Image.new('RGBA',img.size,(255,255,255,0))
 if masks is not None:
  for i in range(len(dets)):
   a=mask_for(masks,i)
   if a is None:continue
   mi=Image.fromarray((a.astype('uint8')*90),'L'); layer=Image.new('RGBA',img.size,(255,255,255,0)); layer.putalpha(mi); tint=Image.alpha_composite(tint,layer)
  base=Image.alpha_composite(base,tint)
 d=ImageDraw.Draw(base); f=ImageFont.load_default()
 for x in dets:
  x1,y1,x2,y2=x['box']; d.rectangle((x1,y1,x2,y2),outline='white',width=max(2,img.width//500)); d.text((x1+3,max(0,y1-12)),f"{x['class']} {x['score']:.2f}",fill='white',font=f,stroke_width=2,stroke_fill='black')
 return base.convert('RGB')
def contact(records):
 cols,tw,th=4,420,280; rows=math.ceil(len(records)/cols); sheet=Image.new('RGB',(cols*tw,rows*th),'black'); d=ImageDraw.Draw(sheet); f=ImageFont.load_default()
 for n,r in enumerate(records):
  im=Image.open(OUT/r['overlay']).convert('RGB'); im.thumbnail((tw-12,th-46)); x=(n%cols)*tw+(tw-im.width)//2; y=(n//cols)*th+32; sheet.paste(im,(x,y)); d.text(((n%cols)*tw+6,(n//cols)*th+7),f"T{r['tier']} {r['file']} | masks {r['mask_count']} rej {r['rejected_count']}"[:72],fill='white',font=f)
 sheet.save(OUT/'00-SUMMARY-CONTACT-SHEET.png')

def main():
 start=time.time(); files=children(FOLDER); by={f['name']:f for f in files}; mf=by.get('benchmark_manifest_v2.json')
 if not mf:raise RuntimeError('benchmark_manifest_v2.json missing')
 manifest=json.loads(get_bytes(mf['id'])); entries=manifest.get('images',[])
 if len(entries)!=24:raise RuntimeError(f'Expected 24 manifest images, found {len(entries)}')
 dev='cuda' if torch.cuda.is_available() else 'cpu'; print('Loading',DINO_ID,'and',SAM2_ID,'on',dev,flush=True)
 dp=AutoProcessor.from_pretrained(DINO_ID); dm=AutoModelForZeroShotObjectDetection.from_pretrained(DINO_ID).to(dev).eval(); sp=Sam2Processor.from_pretrained(SAM2_ID); sm=Sam2Model.from_pretrained(SAM2_ID).to(dev).eval()
 records=[]; tiers=defaultdict(lambda:{'images':0,'masks':0,'rejected':0,'controlled_expected':0,'controlled_matched':0,'false_positives':0})
 for i,e in enumerate(entries,1):
  name=e['file']; meta=by.get(name)
  if not meta:raise RuntimeError(f'Manifest image missing: {name}')
  img=Image.open(io.BytesIO(get_bytes(meta['id']))).convert('RGB'); t=time.time(); inp=dp(images=img,text=[PROMPTS],return_tensors='pt').to(dev)
  with torch.inference_mode():out=dm(**inp)
  p=dp.post_process_grounded_object_detection(out,threshold=BOX,text_threshold=TEXT,target_sizes=[(img.height,img.width)])[0]; labels=p.get('text_labels',p.get('labels',[])); raw=[]
  for boxv,sv,lv in zip(p['boxes'],p['scores'],labels):
   label=sanitize_label(lv); key=cls(label)
   if key!='other':raw.append({'label':label,'class':key,'score':float(sv.item()),'box':[float(v) for v in boxv.tolist()]})
  dets,rejected=semantic_filter(raw,img.width,img.height); masks=None
  if dets:
   sinp=sp(images=img,input_boxes=[[d['box'] for d in dets]],return_tensors='pt').to(dev)
   with torch.inference_mode():sout=sm(**sinp,multimask_output=False)
   masks=sp.post_process_masks(sout.pred_masks.cpu(),sinp['original_sizes'])[0]
  counts=Counter(d['class'] for d in dets); sc=score(e.get('expected'),counts); on=f'{i:02d}-{Path(name).stem}-overlay.png'; overlay(img,dets,masks).save(OUT/on)
  rec={'index':i,'file':name,'drive_file_id':meta['id'],'tier':int(e.get('tier',0)),'kind':e.get('kind'),'purpose':e.get('purpose'),'expected':e.get('expected'),'detected_counts':dict(counts),'mask_count':len(dets),'rejected_count':len(rejected),'detections':dets,'rejected_detections':rejected,'score':sc,'elapsed_seconds':round(time.time()-t,3),'overlay':on}; records.append(rec); (OUT/f'{i:02d}-{Path(name).stem}.json').write_text(json.dumps(rec,indent=2))
  st=tiers[rec['tier']]; st['images']+=1; st['masks']+=len(dets); st['rejected']+=len(rejected); st['controlled_expected']+=sc['expected_total']; st['controlled_matched']+=sc['matched_by_count']; st['false_positives']+=sc['false_positive_count']; print(f'[{i:02d}/24] {name}: kept={dict(counts)} rejected={len(rejected)}',flush=True)
 contact(records); expected=sum(r['score']['expected_total'] for r in records); matched=sum(r['score']['matched_by_count'] for r in records); t5=[r for r in records if r['tier']==5]
 card={'status':'EXECUTED_24_LOCAL_GROUNDED_SAM2','benchmark':manifest.get('benchmark'),'manifest_version':manifest.get('version'),'image_count':len(records),'actual_benchmark_overlays':len(records),'all_24_actual_manifest_images_executed':len(records)==24,'semantic_engine':{'detector':DINO_ID,'segmenter':SAM2_ID,'device':dev,'box_threshold':BOX,'text_threshold':TEXT,'nms_iou':NMS_IOU,'cross_alias_iou':CROSS_ALIAS_IOU,'max_window_area':MAX_WINDOW_AREA,'max_garage_area':MAX_GARAGE_AREA,'execution':'GitHub Actions local open-source inference; no production URL required'},'controlled_count_recall':matched/expected if expected else None,'controlled_exact_count_passes':sum(1 for r in records if r.get('expected') is not None and r['score']['exact_count_pass']),'controlled_cases':sum(1 for r in records if r.get('expected') is not None),'tier5_texture_false_positive_masks':sum(r['mask_count'] for r in t5),'tier5_zero_mask_passes':sum(1 for r in t5 if r['mask_count']==0),'tier5_cases':len(t5),'total_rejected_candidates':sum(r['rejected_count'] for r in records),'tiers':{str(k):v for k,v in sorted(tiers.items())},'limitations':['Count recall is computed only for manifest cases with explicit expected counts.','Realistic-generated cases require visual overlay review until object-level ground truth is added.'],'elapsed_seconds':round(time.time()-start,3),'results':records}; (OUT/'00-RUN-SCORECARD.json').write_text(json.dumps(card,indent=2)); print(json.dumps({k:v for k,v in card.items() if k!='results'},indent=2))
main()
