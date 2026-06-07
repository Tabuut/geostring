// @ts-nocheck
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════
   GEOSTRING — PREMIUM DARK TOKENS (v3)
   ══════════════════════════════════════════════ */
const C = {
  bg:         "#080c12",
  bg2:        "#0c1118",
  surface:    "#111827",
  surface2:   "#1a2235",
  border:     "#1e2d40",
  borderHover:"#2a3f58",
  gold:       "#f0c060",
  goldDim:    "#a07830",
  cyan:       "#38bdf8",
  cyanDim:    "#0e6e8e",
  green:      "#22d3a5",
  red:        "#ef4f4f",
  text:       "#e2e8f0",
  muted:      "#64748b",
  subtle:     "#334155",
  // Legacy aliases (some logic strings still reference these)
  card:       "#111827",
  bg2legacy:  "#0c1118",
};
const F = {
  ar:   "'Cairo','Tajawal',sans-serif",
  disp: "'Barlow Condensed',sans-serif",
  mono: "'JetBrains Mono','Courier New',monospace",
};

/* ══════════════════════════════════════════════
   AI (Gemini)
   ══════════════════════════════════════════════ */
async function askGemini(prompt, b64 = null, opts = {}) {
  const res = await fetch("/api/public/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      imageBase64: b64 || undefined,
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      responseMimeType: opts.responseMimeType,
    }),
  });

  const d = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = d?.error || `AI error ${res.status}`;
    if (res.status === 429) throw new Error("quota exceeded");
    if (res.status === 401 || res.status === 403) throw new Error(msg || "API key invalid");
    if (res.status === 500 && /GEMINI_API_KEY|not configured|غير مضاف/i.test(msg))
      throw new Error(msg);
    throw new Error(msg);
  }
  return d?.text || "لم أتمكن من الحصول على رد.";
}

async function analyzeImage(b64, lockedHints = []) {
  const lockBlock = lockedHints.length
    ? `\n\n⚠️ قيود المستخدم (يجب احترامها تماماً):\n${lockedHints.join("\n")}\n`
    : "";
  return askGemini(lockBlock + `أنت خبير عالمي في فن الأوتار (String Art) ونظام Geostring للتنفيذ على آلات CNC.
حلّل الصورة بدقة عالية وفكر خطوة بخطوة قبل اقتراح الإعدادات:

١) صنّف الموضوع: وجه بشري / حيوان / منظر طبيعي / مبنى / شعار أو نص / شكل هندسي / صورة معقدة عامة.
٢) قيّم: مستوى التباين، السطوع العام، كثافة التفاصيل والحواف، نظافة الخلفية، تمركز الموضوع.
٣) اختر الإعدادات الأمثل لتعطي أوضح وأجمل لوحة أوتار ممكنة على CNC.

أعد ردك **حصراً JSON صالح** بدون أي نص أو markdown:
{
  "suitable": true,
  "subject": "وصف موجز جداً (وجه/منظر/شعار...)",
  "analysis": {
    "contrastLevel": "low|medium|high",
    "brightnessLevel": "dark|balanced|bright",
    "detailDensity": "low|medium|high",
    "cleanBackground": true
  },
  "shape": "circle",
  "nails": 240,
  "threads": 4000,
  "minGap": 20,
  "lineWeight": 0.25,
  "contrast": 1.3,
  "brightness": 0.05,
  "threadColor": "#1a1a2e",
  "bgColor": "#ffffff",
  "reasoning": "شرح بالعربية (3-6 جمل) يربط كل قيمة بخصائص الصورة، مع نصائح تنفيذ على CNC."
}

قواعد دقيقة (التزم بها بصرامة):
• الشكل: "circle" للوجوه والحيوانات والمناظر والصور العضوية. "square" للشعارات/النصوص/الأشكال الهندسية.
• وجوه/بورتريه: nails 260-320، threads 4000-5500، minGap 18-24، lineWeight 0.18-0.24، خيط داكن (#0d0d0d - #1a1a2e) على خلفية فاتحة (#ffffff - #faf6ee).
• حيوانات/فراء/تفاصيل دقيقة: nails 300-360، threads 5500-7500، lineWeight 0.15-0.22.
• مناظر/تفاصيل عالية: nails 280-360، threads 5000-7000، minGap 15-22.
• شعارات/نصوص: shape "square"، nails 140-200، threads 1800-3000، minGap 25-40، lineWeight 0.25-0.35.
• أشكال هندسية نقية: nails 120-180، threads 1500-2500.
• صور داكنة: brightness 0.12-0.25. صور فاتحة جداً: brightness -0.15 إلى -0.05 و contrast 1.5-1.9.
• تباين منخفض: contrast 1.5-1.9. تباين عالي جداً: contrast 0.9-1.15.
• كثافة تفاصيل عالية: ارفع nails/threads نحو الحد الأعلى وقلل lineWeight.
• كثافة منخفضة: قلل threads (لتجنّب طمس النتيجة) وارفع lineWeight قليلاً.
• استخدم دائماً خيط داكن + خلفية فاتحة (إلا لصور مضيئة جداً على خلفية سوداء).
• اضمن: minGap < nails/6 و threads/nails بين 12 و 25.

النطاقات: nails 80-400، threads 500-8000، minGap 5-60، lineWeight 0.05-0.40، contrast 0.5-3.0، brightness -0.4 إلى 0.4.`, b64, { temperature: 0.25, maxOutputTokens: 3000, responseMimeType: "application/json" });
}

function extractJSON(txt){
  if(!txt) return null;
  const m=txt.match(/\{[\s\S]*\}/);
  if(!m) return null;
  try{ return JSON.parse(m[0]); }catch{ return null; }
}
function clamp(n,a,b){ n=+n; if(!isFinite(n)) return null; return Math.min(b,Math.max(a,n)); }
function validHex(s){ return typeof s==="string" && /^#[0-9a-fA-F]{6}$/.test(s); }

const toB64 = c => c.toDataURL("image/jpeg", 0.85).split(",")[1];

/* ══════════════════════════════════════════════
   STRING ART ALGORITHM (unchanged in PART 1)
   ══════════════════════════════════════════════ */
const SZ = 500;

function bresenham(x0,y0,x1,y1){
  const px=[];
  let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),
      sx=x0<x1?1:-1,sy=y0<y1?1:-1,
      err=dx-dy,x=x0,y=y0;
  while(true){
    px.push([x,y]);
    if(x===x1&&y===y1) break;
    const e=2*err;
    if(e>-dy){err-=dy;x+=sx;}
    if(e<dx){err+=dx;y+=sy;}
  }
  return px;
}

function buildNails(count,shape,size){
  const nls=[],cx=size/2,cy=size/2,r=size/2-5;
  if(shape==="circle"){
    for(let i=0;i<count;i++){
      const a=(2*Math.PI*i)/count-Math.PI/2;
      nls.push([Math.round(cx+r*Math.cos(a)),Math.round(cy+r*Math.sin(a))]);
    }
  } else {
    const ps=Math.floor(count/4),m=5,w=size-2*m;
    for(let i=0;i<ps;i++) nls.push([m+Math.round(w*i/ps),m]);
    for(let i=0;i<ps;i++) nls.push([size-m,m+Math.round(w*i/ps)]);
    for(let i=0;i<ps;i++) nls.push([size-m-Math.round(w*i/ps),size-m]);
    for(let i=0;i<ps;i++) nls.push([m,size-m-Math.round(w*i/ps)]);
  }
  return nls;
}

function toGray(data,size,contrast=1,brightness=0){
  const g=new Float32Array(size*size);
  for(let i=0;i<size*size;i++){
    let v=(0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2])/255;
    v=Math.min(1,Math.max(0,(v+brightness)*contrast));
    g[i]=1-v;
  }
  return g;
}

/* ── StringPhoto algorithm ──────────────────────────── */
function linePixelsSP(p1,p2){
  const points=[];
  const dx=Math.abs(p2[0]-p1[0]);
  const dy=-Math.abs(p2[1]-p1[1]);
  const sx=p1[0]<p2[0]?1:-1;
  const sy=p1[1]<p2[1]?1:-1;
  let e=dx+dy, px=p1[0], py=p1[1];
  while(px!==p2[0]||py!==p2[1]){
    points.push([px,py]);
    const e2=2*e;
    if(e2>dy){e+=dy;px+=sx;}
    if(e2<dx){e+=dx;py+=sy;}
  }
  return points;
}
function pinPair(a,b){return a<b?a+'-'+b:b+'-'+a;}
function lineScoreSP(pix,w,h,points){
  let s=0,n=0;
  for(let i=0;i<points.length;i++){
    const x=points[i][0]; let y=points[i][1];
    if(x<0||x>=w||y<0||y>=h){ if(y>=h) y=h-1; else continue; }
    s+=(255-pix[4*(y*w+x)]); n++;
  }
  return n? s/n : 0;
}
function reduceLineSP(pix,w,h,points,value){
  for(let i=0;i<points.length;i++){
    const x=points[i][0], y=points[i][1];
    if(x<0||x>=w||y<0||y>=h) continue;
    const c=4*(y*w+x);
    let v=pix[c]+value; if(v>255) v=255;
    pix[c]=pix[c+1]=pix[c+2]=v;
  }
}
function balanceColorSP(pix,w,h,picColorValue){
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2;
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){
    const a=4*(j*w+i);
    if((cx-i)*(cx-i)+(cy-j)*(cy-j)<=r*r){
      const low=picColorValue, high=255-picColorValue;
      const mapped=low+(pix[a]/255)*(high-low);
      pix[a]=pix[a+1]=pix[a+2]=mapped; pix[a+3]=255;
    } else { pix[a]=pix[a+1]=pix[a+2]=255; pix[a+3]=0; }
  }
}
function nextPinSP(current,used,pix,w,h,lines,nrPins,dist){
  let max=0, next=-1;
  for(let i=0;i<nrPins;i++){
    const df=Math.abs(current-i);
    if(df<dist||df>nrPins-dist) continue;
    if(used.has(pinPair(current,i))) continue;
    const sc=lineScoreSP(pix,w,h,lines[current*nrPins+i]);
    if(sc>max){max=sc;next=i;}
  }
  return next;
}

function* runAlgo(imgData,nails,maxL,gap,size,weight,contrast,brightness,cb){
  const NR=nails.length;
  // build RGBA grayscale working buffer with contrast/brightness applied
  const pix=new Uint8ClampedArray(size*size*4);
  for(let i=0;i<size*size;i++){
    let v=(0.299*imgData[i*4]+0.587*imgData[i*4+1]+0.114*imgData[i*4+2])/255;
    v=Math.min(1,Math.max(0,(v+brightness)*contrast));
    const g=Math.round(v*255);
    pix[i*4]=pix[i*4+1]=pix[i*4+2]=g; pix[i*4+3]=255;
  }
  // picColorValue derived from brightness slider; clamped to a sensible band
  const picColorValue=Math.max(10,Math.min(90,Math.round(40-brightness*100)));
  balanceColorSP(pix,size,size,picColorValue);

  // precompute every line's pixel path: lines[i*NR+j]
  const lines=new Array(NR*NR);
  for(let i=0;i<NR;i++){
    for(let j=i+1;j<NR;j++){
      const pts=linePixelsSP(nails[i],nails[j]);
      lines[i*NR+j]=pts; lines[j*NR+i]=pts;
    }
  }
  // lineFade derived from lineWeight slider (StringPhoto default ~50)
  const lineFade=Math.max(10,Math.min(120,Math.round(weight*200)));

  const used=new Set();
  const seq=[0]; let cur=0;
  cb(0,maxL,seq.slice());
  for(let s=0;s<maxL;){
    let chunk=0;
    while(s<maxL && chunk<10){
      const next=nextPinSP(cur,used,pix,size,size,lines,NR,gap);
      if(next<0){ cb(s,s,seq.slice()); return; }
      reduceLineSP(pix,size,size,lines[cur*NR+next],lineFade);
      used.add(pinPair(cur,next));
      seq.push(next); cur=next; s++; chunk++;
    }
    cb(s,maxL,seq.slice());
    yield;
  }
  cb(maxL,maxL,seq);
}

/* ══════════════════════════════════════════════
   GLOBAL CSS
   ══════════════════════════════════════════════ */
const CSS=`
*{box-sizing:border-box;}
.gs-root{font-size:13px;}
.gs-root ::-webkit-scrollbar{width:6px;height:6px;}
.gs-root ::-webkit-scrollbar-track{background:${C.border};border-radius:6px;}
.gs-root ::-webkit-scrollbar-thumb{background:${C.subtle};border-radius:6px;}
.gs-root ::-webkit-scrollbar-thumb:hover{background:${C.gold};}
.gs-root input[type=range]{
  -webkit-appearance:none; appearance:none;
  width:100%; height:4px; background:${C.surface2}; border-radius:4px; cursor:pointer;
}
.gs-root input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none; appearance:none;
  width:14px; height:14px; border-radius:50%;
  background:${C.gold}; border:2px solid ${C.bg};
  box-shadow:0 0 0 1px ${C.gold}, 0 0 12px rgba(240,192,96,.5);
  cursor:pointer; transition:transform .15s;
}
.gs-root input[type=range]::-webkit-slider-thumb:hover{ transform:scale(1.2); }
.gs-root input[type=range]::-moz-range-thumb{
  width:14px; height:14px; border-radius:50%;
  background:${C.gold}; border:2px solid ${C.bg};
  cursor:pointer;
}
.gs-root input[type=color]{cursor:pointer;border:none;padding:0;background:none;}
.gs-root button, .gs-root [role=button]{
  transition:all .2s cubic-bezier(.4,0,.2,1);
}
.gs-root button:focus-visible, .gs-root input:focus-visible{
  outline:2px solid rgba(240,192,96,.6); outline-offset:2px;
}
@keyframes gs-spin{to{transform:rotate(360deg)}}
@keyframes gs-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes gs-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes gs-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes gs-shine{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes gs-ringPulse{0%,100%{box-shadow:0 0 0 0 rgba(240,192,96,.5)}50%{box-shadow:0 0 0 14px rgba(240,192,96,0)}}
@keyframes gs-glow{from{box-shadow:0 0 0 1px rgba(240,192,96,.12),0 0 60px rgba(240,192,96,.08),0 0 120px rgba(56,189,248,.05)}to{box-shadow:0 0 0 1px rgba(56,189,248,.25),0 0 70px rgba(56,189,248,.12),0 0 140px rgba(240,192,96,.06)}}
@keyframes gs-dashShift{to{stroke-dashoffset:-20}}
@keyframes gs-progressShim{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.gs-up{animation:gs-fadeUp .25s ease forwards;}
.gs-drop{transition:all .25s; position:relative;}
.gs-drop:hover{border-color:${C.gold}!important;background:rgba(240,192,96,.05)!important;}
.gs-drop.drag{border-color:${C.gold}!important;background:rgba(240,192,96,.1)!important;}
.gs-drop:hover .gs-drop-svg circle{stroke-dashoffset:0;}
.gs-tab:hover{color:${C.text}!important;}
.gs-pill:hover{background:${C.surface2}!important;}
.gs-btn-shimmer{position:relative; overflow:hidden;}
.gs-btn-shimmer::after{
  content:""; position:absolute; inset:0;
  background:linear-gradient(90deg,transparent,rgba(240,192,96,.18),transparent);
  transform:translateX(-100%); transition:transform .6s;
}
.gs-btn-shimmer:hover::after{transform:translateX(100%);}
.gs-canvas-bg{
  background:
    radial-gradient(rgba(30,45,64,.5) 1px, transparent 1px),
    radial-gradient(ellipse at center, #0a1020 0%, ${C.bg} 100%);
  background-size: 24px 24px, 100% 100%;
}
.gs-progress-track{
  position:absolute; left:0; right:0; bottom:0; height:2px;
  background:rgba(240,192,96,.08); overflow:hidden;
}
.gs-progress-bar{
  height:100%; background:linear-gradient(90deg,${C.goldDim},${C.gold},${C.goldDim});
  background-size:200% 100%;
  animation:gs-shimmer 2s linear infinite;
  transition:width .4s ease;
}
.gs-swatch{transition:transform .15s, box-shadow .15s;}
.gs-swatch:hover{transform:scale(1.08); box-shadow:0 0 0 2px rgba(240,192,96,.5);}
.gs-swatch.active{transform:scale(1.1); box-shadow:0 0 0 2px ${C.gold}, 0 0 16px rgba(240,192,96,.4);}
.gs-shape-card{transition:all .15s;}
.gs-shape-card:hover{border-color:${C.borderHover}!important;}
.gs-shape-card.active{border-color:${C.gold}!important; background:${C.surface2}!important;}
`;

/* ══════════════════════════════════════════════
   HOOK: viewport (SSR-safe)
   ══════════════════════════════════════════════ */
function useViewport(){
  const [w,setW]=useState(1200); // stable for SSR
  useEffect(()=>{
    const onR=()=>setW(window.innerWidth);
    onR();
    window.addEventListener("resize",onR);
    return()=>window.removeEventListener("resize",onR);
  },[]);
  return { isMobile: w<860 };
}

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */
export default function GeoStringApp(){
  const { isMobile } = useViewport();
  // Image state
  const [image,setImage]=useState(null);
  const [imgData,setImgData]=useState(null);
  // Generation params
  const [nailCnt,setNailCnt]=useState(240);
  const [threadCnt,setThreadCnt]=useState(3500);
  const [shape,setShape]=useState("circle");
  const [minGap,setMinGap]=useState(20);
  const [threadColor,setThreadColor]=useState("#1a1a2e");
  const [bgColor,setBgColor]=useState("#ffffff");
  const [lineWeight,setLineWeight]=useState(0.25);
  const [contrast,setContrast]=useState(1.0);
  const [brightness,setBrightness]=useState(0.0);
  // Status
  const [status,setStatus]=useState("idle");
  const [prog,setProg]=useState(0);
  const [seq,setSeq]=useState([]);
  const [liveCount,setLiveCount]=useState(0);
  // UI
  const [tab,setTab]=useState("preview");
  const [sideTab,setSideTab]=useState("image");
  const [sidebarOpen,setSidebarOpen]=useState(false);
  // AI
  const [aiLoad,setAiLoad]=useState(false);
  const [aiRes,setAiRes]=useState(null);
  const [aiSuggestion,setAiSuggestion]=useState(null);
  const [chat,setChat]=useState([]);
  const [chatIn,setChatIn]=useState("");
  const [chatBusy,setChatBusy]=useState(false);
  // Drag
  const [dragging,setDragging]=useState(false);
  const [toast,setToast]=useState(null);
  // Lockable AI params
  const [lockedParams,setLockedParams]=useState({shape:false,nails:false,threads:false,colors:false});
  const toggleLock=(k)=>setLockedParams(p=>({...p,[k]:!p[k]}));
  // UX state
  const [nailPulse,setNailPulse]=useState(false);
  const [fabOpen,setFabOpen]=useState(false);
  const beforeSnapshot=useRef(null);

  const chatEndRef=useRef(null);
  const cvsRef=useRef(null);
  const origRef=useRef(null);
  const hidOrigRef=useRef(null);
  const fileRef=useRef(null);
  const animRef=useRef(null);
  const seqLinesRef=useRef([]);
  const generateRef=useRef(null);

  useEffect(()=>{
    const el=document.createElement("style");el.textContent=CSS;document.head.appendChild(el);
    return()=>{try{document.head.removeChild(el);}catch{}}
  },[]);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chat]);

  const nails=useMemo(()=>buildNails(nailCnt,shape,SZ),[nailCnt,shape]);

  const loadImage=useCallback((src)=>{
    const img=new window.Image();
    img.onload=()=>{
      const c=document.createElement("canvas");c.width=c.height=SZ;
      const ctx=c.getContext("2d");
      ctx.fillStyle="#fff";ctx.fillRect(0,0,SZ,SZ);
      const s=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,SZ,SZ);
      setImgData(ctx.getImageData(0,0,SZ,SZ).data);
      [origRef.current,hidOrigRef.current].forEach(cv=>{if(cv) cv.getContext("2d").drawImage(c,0,0,SZ,SZ);});
    };
    img.src=src;
  },[]);

  const processFile=useCallback((f)=>{
    if(!f?.type.startsWith("image/")) return;
    const r=new FileReader();
    r.onload=ev=>{
      setImage(ev.target.result);loadImage(ev.target.result);
      setStatus("idle");setSeq([]);setProg(0);setLiveCount(0);setAiRes(null);setAiSuggestion(null);seqLinesRef.current=[];
    };
    r.readAsDataURL(f);
  },[loadImage]);

  const onFile=e=>processFile(e.target.files[0]);

  const onDragOver=e=>{e.preventDefault();setDragging(true);};
  const onDragLeave=()=>setDragging(false);
  const onDrop=e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0]);};

  const drawnCountRef=useRef(0);

  const draw=useCallback((s,nl,tColor,bgCol,isReset=false)=>{
    const c=cvsRef.current;if(!c) return;
    const ctx=c.getContext("2d");
    if(isReset){
      ctx.fillStyle=bgCol;ctx.fillRect(0,0,SZ,SZ);
      drawnCountRef.current=0;
      ctx.fillStyle=C.gold;
      for(const[x,y] of nl){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}
      return;
    }
    const from=drawnCountRef.current;
    if(s.length<=from+1) return;
    const r=parseInt(tColor.slice(1,3),16);
    const g=parseInt(tColor.slice(3,5),16);
    const b=parseInt(tColor.slice(5,7),16);
    ctx.strokeStyle=`rgba(${r},${g},${b},0.55)`;
    ctx.lineWidth=0.7;
    ctx.lineCap="round";
    ctx.beginPath();
    const newLines=[];
    for(let i=Math.max(1,from);i<s.length;i++){
      const[x0,y0]=nl[s[i-1]],[x1,y1]=nl[s[i]];
      ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);
      newLines.push([x0,y0,x1,y1]);
    }
    ctx.stroke();
    seqLinesRef.current=[...seqLinesRef.current,...newLines];
    drawnCountRef.current=s.length;
  },[]);

  const generate=useCallback(()=>{
    if(!imgData) return;
    setStatus("processing");setSeq([]);setProg(0);setLiveCount(0);seqLinesRef.current=[];
    if(animRef.current) cancelAnimationFrame(animRef.current);
    const nl=nails;
    draw([0],nl,threadColor,bgColor,true);
    const gen=runAlgo(imgData,nl,threadCnt,minGap,SZ,lineWeight,contrast,brightness,(step,total,s)=>{
      const p=Math.round(step/total*100);
      setProg(p);setSeq([...s]);setLiveCount(s.length-1);
      draw(s,nl,threadColor,bgColor,false);
      if(step>=total){
        setStatus("done");
        const c=cvsRef.current;if(c){
          const ctx=c.getContext("2d");
          ctx.fillStyle=C.gold;
          for(const[x,y] of nl){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}
        }
      }
    });
    function tick(){const r=gen.next();if(!r.done) animRef.current=requestAnimationFrame(tick);else setStatus("done");}
    animRef.current=requestAnimationFrame(tick);
  },[imgData,nails,threadCnt,minGap,lineWeight,contrast,brightness,threadColor,bgColor,draw]);

  useEffect(()=>{ generateRef.current=generate; },[generate]);

  const stop=()=>{if(animRef.current) cancelAnimationFrame(animRef.current);setStatus("done");};

  useEffect(()=>{
    if(status==="done" && seq.length>1){
      setToast(`✓ تم توليد ${(seq.length-1).toLocaleString()} خيط — جاهز للتصدير`);
      const t=setTimeout(()=>setToast(null),3500);
      return ()=>clearTimeout(t);
    }
  },[status,seq.length]);

  useEffect(()=>{
    const handler=(e)=>{
      if((e.ctrlKey||e.metaKey) && e.key==="Enter"){ e.preventDefault(); generateRef.current?.(); }
      else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="s"){ e.preventDefault(); exportPNG(); }
      else if(e.key==="Escape" && status==="processing"){ stop(); }
    };
    document.addEventListener("keydown",handler);
    return()=>document.removeEventListener("keydown",handler);
  },[status]);

  // Live nail-frame preview when nailCnt/shape/bgColor change (idle only)
  useEffect(()=>{
    if(status==="processing") return;
    const c=cvsRef.current; if(!c) return;
    const ctx=c.getContext("2d");
    if(seq.length>1){
      // overlay nails on existing result
      ctx.fillStyle=C.gold;
      for(const[x,y] of nails){ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill();}
    } else {
      ctx.fillStyle=bgColor; ctx.fillRect(0,0,SZ,SZ);
      ctx.fillStyle=C.gold;
      for(const[x,y] of nails){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
    }
  },[nails,bgColor,status]); // eslint-disable-line

  // Auto-close mobile FAB during processing
  useEffect(()=>{ if(status==="processing") setFabOpen(false); },[status]);

  const exportPNG=()=>{
    if(!cvsRef.current) return;
    const a=document.createElement("a");a.download="geostring_art.png";
    a.href=cvsRef.current.toDataURL("image/png");a.click();
  };

  const exportSVG=()=>{
    const lns=seqLinesRef.current;if(!lns.length) return;
    const paths=lns.map(([x0,y0,x1,y1])=>`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${threadColor}" stroke-opacity="0.55" stroke-width="0.7" stroke-linecap="round"/>`).join("\n");
    const nailDots=nails.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2" fill="${C.gold}"/>`).join("");
    const svg=`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SZ}" height="${SZ}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SZ}" height="${SZ}" fill="${bgColor}"/>
  ${paths}
  ${nailDots}
</svg>`;
    const a=document.createElement("a");a.download="geostring_art.svg";
    a.href=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));a.click();
  };

  const exportTXT=()=>{
    if(!seq.length) return;
    const txt=["GEOSTRING SYSTEM — NAIL SEQUENCE","// Generated by Geostring String Art Engine v2.0","",
      `NAILS: ${nailCnt} | THREADS: ${seq.length-1} | SHAPE: ${shape.toUpperCase()}`,
      `THREAD COLOR: ${threadColor} | LINE WEIGHT: ${lineWeight}`,
      "",...seq.slice(1).map((n,i)=>`${String(i+1).padStart(5,"0")}: nail[${seq[i]}] → nail[${n}]`)].join("\n");
    const a=document.createElement("a");a.download="geostring_sequence.txt";
    a.href=URL.createObjectURL(new Blob([txt],{type:"text/plain"}));a.click();
  };

  const exportArduino=()=>{
    if(seq.length<2) return;
    const pinSequence=seq.slice(1);
    const dataArray=pinSequence.join(",");
    const dataSize=pinSequence.length;
    const degs=Array.from({length:nailCnt},(_,i)=>((360/nailCnt)*i).toFixed(2)).join(",");
    const stepsPerPin=(12800/nailCnt).toFixed(3);
    const code=`#include <Stepper.h>
#include <Servo.h>
#include <SoftwareSerial.h>

// كود مُولَّد تلقائياً بواسطة GeoString
// المسامير: ${nailCnt} | الخيوط: ${dataSize} | الشكل: ${shape}

#define STEPPER_DIR_PIN  8
#define STEPPER_STEP_PIN 9
#define STEPPER_ENA_PIN  10
#define SERVO_PIN1       5
#define SERVO_PIN2       6
#define SWITCH_PIN       11
#define CELL_PIN         3

#define CIRCLE_DIVISION  ${nailCnt}
#define STEPS_PER_PIN    ${stepsPerPin}
#define DEFAULT_DELAY    1450
#define SERVO_DELAY      100
#define SERVO_INNER_POS  90
#define SERVO_OUTER_POS  150
#define SERVO_TOP_POS    90
#define SERVO_BOTTOM_POS 50

const int pulseWidth = 20;
Servo servo;
Servo servo1;

struct { int outStart=0,inStart=0,upStart=0,downStart=0,nowDeg=SERVO_INNER_POS,nowHigh=SERVO_TOP_POS,outleng=0,inleng=86,upleng=0,downleng=75; } position;
struct { unsigned long thisMillis_old,allMillis; } timing;

int num[CIRCLE_DIVISION] = {0};
int k = -1, idxplus = 0;
bool drc = HIGH;

const float deg[] PROGMEM = { ${degs} };
const uint16_t data[] PROGMEM = { ${dataArray} };
int dataSize = ${dataSize};

void cRotate(bool direc,float spr){
  int steps=(int)spr; if(steps<=0) return;
  digitalWrite(STEPPER_DIR_PIN,!direc); digitalWrite(STEPPER_ENA_PIN,LOW);
  for(int i=0;i<steps;i++){ digitalWrite(STEPPER_STEP_PIN,HIGH); delayMicroseconds(pulseWidth);
    digitalWrite(STEPPER_STEP_PIN,LOW); delayMicroseconds(1200); }
}
void oneStepM(bool dic){
  digitalWrite(STEPPER_DIR_PIN,dic); digitalWrite(STEPPER_ENA_PIN,LOW);
  digitalWrite(STEPPER_STEP_PIN,HIGH); delayMicroseconds(DEFAULT_DELAY);
  digitalWrite(STEPPER_STEP_PIN,LOW); delayMicroseconds(DEFAULT_DELAY); delay(500);
}
void sawing(bool drc){
  delay(80); servo.write(position.outleng); delay(80);
  servo1.write(position.upleng); delay(50);
  cRotate(drc,STEPS_PER_PIN); delay(80);
  servo.write(position.inleng); delay(20);
  servo1.write(position.downleng); delay(100);
}
int index_arr(int* arr,int size,int val){ for(int i=0;i<size;i++) if(arr[i]==val) return i; return -1; }
int arr_check(int* arr,int start,int end,int val){ for(int i=start;i<end;i++) if(arr[i]==val) return 1; return -1; }
void reverseArr(int arr[],int start,int end){ int t; end--; while(start<end){ t=arr[start]; arr[start]=arr[end]; arr[end]=t; start++; end--; } }
void shiftLeft(int arr[],int d,int n){ reverseArr(arr,0,d); reverseArr(arr,d,n); reverseArr(arr,0,n); }

void setup(){
  Serial.begin(9600);
  Serial.println(F("GeoString Ready"));
  Serial.print(F("Nails: ")); Serial.println(CIRCLE_DIVISION);
  Serial.print(F("Threads: ")); Serial.println(dataSize);
  pinMode(LED_BUILTIN,OUTPUT); pinMode(SWITCH_PIN,INPUT_PULLUP);
  pinMode(STEPPER_ENA_PIN,OUTPUT); pinMode(STEPPER_STEP_PIN,OUTPUT); pinMode(STEPPER_DIR_PIN,OUTPUT);
  pinMode(CELL_PIN,INPUT_PULLUP); digitalWrite(STEPPER_ENA_PIN,LOW);
  pinMode(A5,INPUT_PULLUP); pinMode(A4,INPUT_PULLUP); pinMode(A0,INPUT_PULLUP);
  pinMode(A1,INPUT_PULLUP); pinMode(A2,INPUT_PULLUP); pinMode(A3,INPUT_PULLUP);
  servo.attach(SERVO_PIN1); servo1.attach(SERVO_PIN2);
  for(int i=0;i<CIRCLE_DIVISION;i++) num[i]=i;
}

void loop(){
  if(digitalRead(SWITCH_PIN)==LOW){
    digitalWrite(LED_BUILTIN,HIGH); digitalWrite(STEPPER_ENA_PIN,HIGH);
    if(k<0) k=0; timing.thisMillis_old=millis();
    int outS=analogRead(A3), inS=analogRead(A0), upS=analogRead(A2), dnS=analogRead(A1);
    if(inS<900) position.nowDeg++; if(outS<900) position.nowDeg--;
    if(dnS<900) position.nowHigh++; if(upS<900) position.nowHigh--;
    servo1.write(position.nowHigh); servo.write(position.nowDeg); delay(5);
    position.downleng=position.nowHigh; position.inleng=position.nowDeg;
    position.outleng=position.inleng+80; position.upleng=position.downleng+50;
    if(analogRead(A5)<900 && analogRead(A4)>900) oneStepM(HIGH);
    if(analogRead(A4)<900 && analogRead(A5)>900) oneStepM(LOW);
    if(analogRead(A1)<900 && analogRead(A3)<900){
      for(int i=0;i<CIRCLE_DIVISION;i++){ if(analogRead(A0)<900) break; cRotate(drc,STEPS_PER_PIN); delay(300); }
    }
  } else {
    digitalWrite(LED_BUILTIN,LOW);
    if(k>=0 && k<=dataSize){
      digitalWrite(STEPPER_ENA_PIN,LOW);
      if(k!=0 && k%200==0){ position.upleng--; position.downleng--; }
      Serial.print(pgm_read_word_near(&(data[k]))); Serial.print(F(", "));
      Serial.print(k); Serial.print(F("/")); Serial.println(dataSize);
      int idx=index_arr(num,CIRCLE_DIVISION,pgm_read_word_near(&(data[k])));
      shiftLeft(num,idx,CIRCLE_DIVISION);
      int halfCircle=CIRCLE_DIVISION/2;
      if(idx==halfCircle){
        drc=LOW;
        if(arr_check(num,(CIRCLE_DIVISION-idx),CIRCLE_DIVISION,pgm_read_word_near(&(data[k+1])))>0){
          cRotate(drc,((idx+idxplus)-1)*STEPS_PER_PIN); sawing(drc); idxplus=0;
        } else { cRotate(drc,(idx+idxplus)*STEPS_PER_PIN); sawing(!drc); idxplus=1; delay(50); }
      } else {
        if(1.0f/sin(radians(pgm_read_float_near(&(deg[idx]))))>0){
          drc=LOW;
          if(arr_check(num,(CIRCLE_DIVISION-idx),CIRCLE_DIVISION,pgm_read_word_near(&(data[k+1])))>0){
            cRotate(drc,((idx+idxplus)-1)*STEPS_PER_PIN); sawing(drc); idxplus=0;
          } else { cRotate(drc,(idx+idxplus)*STEPS_PER_PIN); idxplus=1; sawing(!drc); delay(50); }
        } else {
          drc=HIGH;
          if(arr_check(num,0,CIRCLE_DIVISION-idx,pgm_read_word_near(&(data[k+1])))>0){
            cRotate(drc,(CIRCLE_DIVISION-(idx+idxplus))*STEPS_PER_PIN); sawing(drc); idxplus=1; delay(50);
          } else { cRotate(drc,((CIRCLE_DIVISION-(idx+idxplus))+1)*STEPS_PER_PIN); sawing(!drc); idxplus=0; }
        }
      }
      k++;
    }
    if(k>dataSize){
      k=-1; Serial.println(F("=== DONE ==="));
      for(int i=0;i<2;i++){ delay(300); sawing(HIGH); cRotate(LOW,STEPS_PER_PIN); }
      delay(300); sawing(LOW); cRotate(HIGH,STEPS_PER_PIN); sawing(LOW);
    }
  }
}
`;
    const blob=new Blob([code],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`geostring_${nailCnt}pins_${dataSize}threads.ino`;
    a.click(); URL.revokeObjectURL(url);
    setToast("✓ تم تصدير كود الأردوينو");
    setTimeout(()=>setToast(null),3500);
  };

  const [showArduinoModal,setShowArduinoModal]=useState(false);
  const [arduinoPass,setArduinoPass]=useState("");
  const [passError,setPassError]=useState("");
  const [passAttempts,setPassAttempts]=useState(0);
  const [passLockUntil,setPassLockUntil]=useState(0);
  const [passLockCountdown,setPassLockCountdown]=useState(0);
  useEffect(()=>{
    if(passLockUntil<=0) return;
    const interval=setInterval(()=>{
      const remaining=Math.ceil((passLockUntil-Date.now())/1000);
      if(remaining<=0){ setPassLockUntil(0); setPassLockCountdown(0); setPassAttempts(0); clearInterval(interval); }
      else setPassLockCountdown(remaining);
    },1000);
    return ()=>clearInterval(interval);
  },[passLockUntil]);
  const handleArduinoExport=()=>{
    if(passLockUntil>Date.now()) return;
    if(arduinoPass!=="THABIT1234"){
      const attempts=passAttempts+1;
      setPassAttempts(attempts); setArduinoPass("");
      if(attempts>=3){ setPassLockUntil(Date.now()+60000); setPassError("تم تجاوز عدد المحاولات. انتظر 60 ثانية."); }
      else setPassError("كلمة المرور غير صحيحة");
      return;
    }
    setPassError(""); setShowArduinoModal(false); setArduinoPass(""); setPassAttempts(0);
    exportArduino();
  };

  const applySuggestion=useCallback((s)=>{
    if(!s) return;
    if(!lockedParams.nails){ const n=clamp(s.nails,80,400); if(n!=null) setNailCnt(Math.round(n)); }
    if(!lockedParams.threads){ const t=clamp(s.threads,500,8000); if(t!=null) setThreadCnt(Math.round(t)); }
    const g=clamp(s.minGap,5,60); if(g!=null) setMinGap(Math.round(g));
    const lw=clamp(s.lineWeight,0.05,0.4); if(lw!=null) setLineWeight(+lw.toFixed(2));
    const c=clamp(s.contrast,0.5,3); if(c!=null) setContrast(+c.toFixed(2));
    const b=clamp(s.brightness,-0.4,0.4); if(b!=null) setBrightness(+b.toFixed(2));
    if(!lockedParams.shape && (s.shape==="circle"||s.shape==="square")) setShape(s.shape);
    if(!lockedParams.colors && validHex(s.threadColor)) setThreadColor(s.threadColor.toLowerCase());
    if(!lockedParams.colors && validHex(s.bgColor)) setBgColor(s.bgColor.toLowerCase());
  },[lockedParams]);

  const runAI=useCallback(async()=>{
    const src=hidOrigRef.current||origRef.current;if(!src||!image) return;
    // Snapshot BEFORE values for before/after table
    beforeSnapshot.current={nailCnt,threadCnt,shape,threadColor,bgColor,minGap,lineWeight,contrast,brightness};
    setAiLoad(true);setAiRes(null);setAiSuggestion(null);setTab("ai");
    try{
      const b64=toB64(src);
      const lockedHints=[];
      if(lockedParams.shape) lockedHints.push(`الشكل محدد مسبقاً: "${shape}" — لا تغيره`);
      if(lockedParams.nails) lockedHints.push(`عدد المسامير محدد مسبقاً: ${nailCnt} — أبقه كما هو`);
      if(lockedParams.threads) lockedHints.push(`عدد الخيوط محدد مسبقاً: ${threadCnt} — أبقه كما هو`);
      if(lockedParams.colors) lockedHints.push(`الألوان محددة مسبقاً: خيط ${threadColor} + خلفية ${bgColor} — لا تغيرهما`);
      const res=await analyzeImage(b64, lockedHints);
      const parsed=extractJSON(res);
      if(parsed){
        setAiSuggestion(parsed);
        applySuggestion(parsed);
        const a=parsed.analysis||{};
        const analysisLine=a.contrastLevel?`\n◆ تحليل الصورة: تباين ${a.contrastLevel} • سطوع ${a.brightnessLevel} • تفاصيل ${a.detailDensity}${a.cleanBackground===false?" • خلفية معقدة":""}`:"";
        const summary=`✦ تحليل الصورة\n${parsed.subject?`الموضوع: ${parsed.subject}\n`:""}${parsed.reasoning||""}${analysisLine}`;
        setAiRes(summary);
        setTimeout(()=>{ try{ generateRef.current?.(); }catch{} }, 200);
      } else {
        setAiRes("⚠️ لم يتمكن الذكاء الاصطناعي من تحليل الصورة بشكل صحيح. حاول مرة أخرى.");
      }
    }catch(e){
      const msg=String(e?.message||"");
      let errText="⚠️ خطأ غير متوقع — حاول مرة أخرى";
      if(msg.includes("quota")||msg.includes("429")) errText="⚠️ تجاوزت الحد اليومي لـ Gemini AI";
      else if(msg.includes("API Key")||msg.includes("GEMINI_API_KEY")||msg.includes("AIza")||msg.includes("غير صحيح")) errText=`⚠️ ${msg}`;
      else if(msg.includes("network")||msg.includes("fetch")||msg.includes("Failed")) errText="⚠️ تحقق من اتصالك بالإنترنت";
      else if(msg) errText=`⚠️ ${msg}`;
      setAiRes(errText);
    }
    setAiLoad(false);
  },[image,applySuggestion,lockedParams,nailCnt,threadCnt,shape,threadColor,bgColor]);


  const sendChat=useCallback(async()=>{
    const msg=chatIn.trim();if(!msg||chatBusy) return;
    setChatIn("");setChatBusy(true);
    const nc=[...chat,{r:"user",t:msg}];setChat(nc);
    try{
      const ctx2=`أنت مساعد نظام Geostring للرسم الهندسي بالأوتار وآلات CNC. الإعدادات الحالية: ${nailCnt} مسمار، ${threadCnt} خيط، شكل ${shape==="circle"?"دائري":"مربع"}، لون الخيط ${threadColor}. `;
      const src=hidOrigRef.current||origRef.current;
      const b64=src&&image?toB64(src):null;
      const reply=await askGemini(ctx2+msg,b64);
      setChat([...nc,{r:"ai",t:reply}]);
    }catch(e){
      const msg=String(e?.message||"").trim();
      setChat([...nc,{r:"ai",t:msg?`⚠️ ${msg}`:"عذراً، حدث خطأ. حاول مجدداً."}]);
    }
    setChatBusy(false);
  },[chatIn,chat,chatBusy,nailCnt,threadCnt,shape,threadColor,image]);

  /* ══════ RENDER ══════ */
  const sidebarVisible = !isMobile || sidebarOpen;

  return(
    <>
    <div className="gs-root" style={{fontFamily:F.ar,background:C.bg,minHeight:"100vh",height:isMobile?"auto":"100vh",color:C.text,display:"flex",flexDirection:"column",direction:"rtl",overflow:isMobile?"auto":"hidden"}}>

      <canvas ref={hidOrigRef} width={SZ} height={SZ} style={{display:"none"}}/>

      {/* ── HEADER ── */}
      <header style={{flexShrink:0,position:"sticky",top:0,zIndex:50,backdropFilter:"blur(24px) saturate(180%)",WebkitBackdropFilter:"blur(24px) saturate(180%)",background:"rgba(8,12,18,0.92)",borderBottom:`1px solid rgba(30,45,64,0.8)`,height:isMobile?48:52,display:"flex",alignItems:"center",padding:isMobile?"0 12px":"0 20px",gap:12,position:"sticky"}}>
        <GSLogo small={isMobile}/>
        {!isMobile && <div style={{width:1,height:22,background:C.border}}/>}
        {!isMobile && (
          <span style={{fontFamily:F.mono,fontSize:9,color:C.gold,letterSpacing:"0.1em"}}>
            STRING ART ENGINE v2.0
          </span>
        )}
        <div style={{marginRight:"auto"}}/>

        {/* Status badges */}
        {status==="processing" && (
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(240,192,96,.1)",border:`1px solid rgba(240,192,96,.25)`,borderRadius:999,padding:"4px 12px",fontFamily:F.mono,fontSize:10,color:C.gold,letterSpacing:"0.05em"}}>
            <Spin size={10} color={C.gold}/>{prog}% · {liveCount.toLocaleString()}
          </div>
        )}
        {status==="done" && seq.length>1 && (
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(34,211,165,.1)",border:`1px solid rgba(34,211,165,.25)`,borderRadius:999,padding:"4px 12px",fontFamily:F.mono,fontSize:10,color:C.green,letterSpacing:"0.05em"}}>
            ✓ {(seq.length-1).toLocaleString()} THREAD
          </div>
        )}
        {status==="idle" && !isMobile && (
          <span style={{fontFamily:F.mono,fontSize:9,color:C.subtle,letterSpacing:"0.1em"}}>v2.0</span>
        )}

        {isMobile && (
          <button
            onClick={()=>setSidebarOpen(o=>!o)}
            aria-label="toggle controls"
            style={{background:sidebarOpen?"rgba(240,192,96,.18)":"transparent",border:`1px solid ${C.gold}`,color:C.gold,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontFamily:F.mono,fontSize:14,fontWeight:700,lineHeight:1}}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        )}

        {/* progress shimmer line spanning bottom */}
        {status==="processing" && (
          <div className="gs-progress-track">
            <div className="gs-progress-bar" style={{width:`${prog}%`}}/>
          </div>
        )}
      </header>

      <div style={{display:"flex",flex:1,flexDirection:isMobile?"column":"row",overflow:isMobile?"visible":"hidden"}}>

        {/* ══ SIDEBAR ══ */}
        {sidebarVisible && (
        <aside style={{
          width:isMobile?"100%":280,
          flexShrink:0,
          background:C.bg2,
          borderLeft:isMobile?"none":`1px solid ${C.border}`,
          borderBottom:isMobile?`1px solid ${C.border}`:"none",
          display:"flex",flexDirection:"column",overflow:"hidden",
          maxHeight:isMobile?"70vh":"none",
          ...(isMobile?{position:"fixed",bottom:0,left:0,right:0,zIndex:45,borderRadius:"18px 18px 0 0",boxShadow:"0 -20px 60px rgba(0,0,0,.6)"}:{}),
        }}>

          {isMobile && (
            <div style={{display:"flex",justifyContent:"center",padding:"8px 0 4px"}}>
              <div style={{width:32,height:4,borderRadius:2,background:C.subtle}}/>
            </div>
          )}

          {/* Pill tab navigation */}
          <div style={{padding:"12px 14px 8px",display:"flex",gap:4,background:C.bg2,flexShrink:0}}>
            {[["image","⊡ الصورة"],["params","⚙ الإعدادات"],["export","⤓ التصدير"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setSideTab(id)}
                style={{
                  flex:1,
                  background:sideTab===id?C.gold:"transparent",
                  color:sideTab===id?C.bg:C.muted,
                  border:"none",
                  borderRadius:999,
                  padding:"8px 4px",
                  cursor:"pointer",
                  fontSize:10,
                  fontFamily:F.mono,
                  fontWeight:700,
                  letterSpacing:"0.05em",
                  textTransform:"uppercase",
                }}>
                {lbl}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"6px 14px 16px"}}>

            {sideTab==="image" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <SLabel tag="01" text="الصورة المدخلة"/>
                <div
                  onClick={()=>fileRef.current?.click()}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                  className={`gs-drop${dragging?" drag":""}`}
                  style={{border:`1.5px dashed ${image?C.gold:C.borderHover}`,borderRadius:10,padding:"18px 12px",textAlign:"center",cursor:"pointer",background:image?"rgba(240,192,96,.04)":"transparent",minHeight:image?90:120,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}
                >
                  {image?(
                    <div style={{display:"flex",alignItems:"center",gap:12,width:"100%",justifyContent:"center"}}>
                      <img src={image} alt="" style={{width:64,height:64,objectFit:"cover",borderRadius:8,boxShadow:`0 0 0 2px ${C.gold}, 0 4px 12px rgba(0,0,0,.4)`}}/>
                      <div style={{textAlign:"right"}}>
                        <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(34,211,165,.12)",border:`1px solid rgba(34,211,165,.3)`,color:C.green,borderRadius:999,padding:"3px 9px",fontFamily:F.mono,fontSize:9,letterSpacing:"0.05em"}}>
                          ✓ جاهز
                        </div>
                        <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginTop:5}}>انقر للتغيير</div>
                      </div>
                    </div>
                  ):(
                    <>
                      <svg className="gs-drop-svg" width="44" height="44" viewBox="0 0 44 44" fill="none">
                        <rect x="6" y="6" width="32" height="32" rx="6" stroke={C.borderHover} strokeWidth="1.5" strokeDasharray="4 3" style={{transition:"stroke-dashoffset .4s"}}/>
                        <path d="M22 16v12M16 22h12" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <div style={{fontSize:13,color:C.text,fontWeight:600}}>اسحب صورتك هنا أو انقر</div>
                      <div style={{fontFamily:F.mono,fontSize:9,color:C.subtle,letterSpacing:"0.08em"}}>PNG / JPG / WEBP</div>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/>

                {image && (
                  <button
                    onClick={runAI}
                    disabled={aiLoad}
                    className="gs-btn-shimmer"
                    style={{
                      width:"100%",height:44,borderRadius:8,border:"none",
                      background:`linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
                      color:"#0d0d0d",fontFamily:F.ar,fontWeight:700,fontSize:13,
                      cursor:aiLoad?"wait":"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      boxShadow:"0 4px 16px rgba(240,192,96,.25)",
                      opacity:aiLoad?.7:1,
                    }}
                  >
                    {aiLoad ? <Spin size={14} color="#0d0d0d"/> : <span style={{fontSize:15}}>✦</span>}
                    {aiLoad?"جاري التحليل...":"تحليل بالذكاء الاصطناعي"}
                  </button>
                )}

                {image && (
                  <>
                    <Divider/>
                    <SLabel tag="02" text="إعدادات مقيّدة للذكاء الاصطناعي"/>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {[
                        {k:"shape",label:"الشكل",val:shape==="circle"?"دائري":"مربع"},
                        {k:"nails",label:"المسامير",val:nailCnt},
                        {k:"threads",label:"الخيوط",val:threadCnt.toLocaleString()},
                        {k:"colors",label:"الألوان",val:null},
                      ].map(({k,label,val})=>{
                        const on=lockedParams[k];
                        return (
                          <div key={k} onClick={()=>toggleLock(k)}
                            style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:8,
                              background:on?"rgba(240,192,96,.07)":C.surface,
                              border:`1px solid ${on?C.gold:C.border}`,cursor:"pointer",transition:"all .15s"}}>
                            <div style={{width:22,height:22,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
                              background:on?C.gold:"transparent",border:`1px solid ${on?C.gold:C.border}`,
                              color:on?C.bg:C.muted,fontSize:11,flexShrink:0}}>
                              {on?"🔒":"🔓"}
                            </div>
                            <span style={{flex:1,fontFamily:F.ar,fontSize:12,color:on?C.gold:C.text,fontWeight:600}}>{label}</span>
                            {k==="colors" ? (
                              <div style={{display:"flex",gap:3}}>
                                <div style={{width:14,height:14,borderRadius:3,background:threadColor,border:`1px solid ${C.border}`}}/>
                                <div style={{width:14,height:14,borderRadius:3,background:bgColor,border:`1px solid ${C.border}`}}/>
                              </div>
                            ) : (
                              <span style={{fontFamily:F.mono,fontSize:10,color:on?C.gold:C.muted}}>{val}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <Divider/>
                <SLabel tag="02" text="معالجة مسبقة"/>
                <SRow label="التباين" val={contrast.toFixed(1)}>
                  <input type="range" min={0.5} max={3} step={0.1} value={contrast} onChange={e=>setContrast(+e.target.value)}/>
                </SRow>
                <SRow label="السطوع" val={brightness>0?`+${brightness.toFixed(2)}`:brightness.toFixed(2)}>
                  <input type="range" min={-0.4} max={0.4} step={0.05} value={brightness} onChange={e=>setBrightness(+e.target.value)}/>
                </SRow>

                <Divider/>
                <SLabel tag="03" text="التنفيذ"/>
                {status==="processing"?(
                  <GenerationProgress prog={prog} liveCount={liveCount} threadCnt={threadCnt} onStop={stop}/>
                ):(
                  <button
                    onClick={imgData?generate:undefined}
                    disabled={!imgData}
                    className="gs-btn-shimmer"
                    style={{
                      width:"100%",height:48,borderRadius:8,
                      background:C.surface2,
                      border:`1.5px solid ${imgData?C.gold:C.border}`,
                      color:imgData?C.gold:C.subtle,
                      fontFamily:F.ar,fontWeight:700,fontSize:13,
                      cursor:imgData?"pointer":"not-allowed",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      letterSpacing:"0.02em",
                    }}
                  >
                    <span style={{fontSize:15}}>◈</span>
                    {status==="done"?"إعادة التوليد":"توليد الأوتار"}
                  </button>
                )}
              </div>
            )}

            {sideTab==="params" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <SLabel tag="01" text="معاملات الهندسة"/>

                <NumSlider label="عدد المسامير" suffix="مسمار" value={nailCnt} min={80} max={400} step={1} onChange={(v)=>{setNailCnt(v); setNailPulse(true); setTimeout(()=>setNailPulse(false),600);}} big pulse={nailPulse}/>
                <div style={{display:"flex",gap:4,marginTop:-6,flexWrap:"wrap"}}>
                  {[120,180,240,280,312,320,360].map(n=>(
                    <button key={n} onClick={()=>{setNailCnt(n); setNailPulse(true); setTimeout(()=>setNailPulse(false),600);}}
                      style={{
                        padding:"4px 8px",borderRadius:5,
                        background:nailCnt===n?"rgba(201,168,76,.2)":C.surface,
                        border:`1px solid ${nailCnt===n?C.gold:C.border}`,
                        color:nailCnt===n?C.gold:C.muted,cursor:"pointer",
                        fontFamily:F.mono,fontSize:10,fontWeight:nailCnt===n?700:400,
                        position:"relative",transition:"all .15s",
                      }}>
                      {n}
                      {n===312 && <span style={{position:"absolute",top:-4,insetInlineEnd:-4,width:10,height:10,borderRadius:"50%",background:C.gold,color:"#070e1a",fontSize:7,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>★</span>}
                    </button>
                  ))}
                </div>
                {nailCnt===312 && (
                  <div style={{fontFamily:F.mono,fontSize:9,color:"rgba(201,168,76,.8)",padding:"5px 8px",background:"rgba(201,168,76,.05)",borderRadius:5,border:"1px solid rgba(201,168,76,.15)",marginTop:-6}}>
                    ★ مُحسَّن لآلتك — TMC2225 @ 41 خطوة/مسمار
                  </div>
                )}
                <NumSlider label="كثافة الخيوط" suffix="خيط" value={threadCnt} min={500} max={8000} step={100} onChange={setThreadCnt} format={v=>v.toLocaleString("ar-EG")}/>
                <NumSlider label="فجوة دنيا" suffix="" value={minGap} min={5} max={60} step={1} onChange={setMinGap}/>
                <NumSlider label="وزن الخط" suffix="" value={lineWeight} min={0.05} max={0.4} step={0.01} onChange={setLineWeight} format={v=>(+v).toFixed(2)}/>

                <Divider/>
                <SLabel tag="02" text="شكل اللوح"/>
                <div style={{display:"flex",gap:10}}>
                  {[
                    ["circle","دائري", <circle key="c" cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.6" fill="none"/>],
                    ["square","مربع", <rect key="s" x="5" y="5" width="22" height="22" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>],
                  ].map(([v,l,svg])=>(
                    <button key={v} onClick={()=>setShape(v)}
                      className={`gs-shape-card ${shape===v?"active":""}`}
                      style={{
                        flex:1,height:80,
                        background:shape===v?C.surface2:C.surface,
                        border:`2px solid ${shape===v?C.gold:C.border}`,
                        borderRadius:10,
                        color:shape===v?C.gold:C.muted,
                        cursor:"pointer",
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
                        fontFamily:F.ar,fontWeight:700,fontSize:13,
                      }}>
                      <svg width="32" height="32" viewBox="0 0 32 32">{svg}</svg>
                      {l}
                    </button>
                  ))}
                </div>

                <Divider/>
                <SLabel tag="03" text="الألوان"/>
                <ColorRow label="لون الخيط" value={threadColor} onChange={setThreadColor}/>
                <ColorRow label="لون الخلفية" value={bgColor} onChange={setBgColor}/>

                <div>
                  <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginBottom:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>PRESETS</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                    {[
                      ["#1a1a2e","#ffffff"],
                      ["#ffffff","#0d1117"],
                      ["#f0c060","#0a0f1a"],
                      ["#38bdf8","#0a0f1a"],
                      ["#22d3a5","#0a0f1a"],
                      ["#ef4f4f","#ffffff"],
                      ["#0d0d0d","#faf6ee"],
                      ["#1a1a2e","#f0c060"],
                    ].map(([tc,bc])=>{
                      const active=threadColor===tc&&bgColor===bc;
                      return (
                        <button key={tc+bc} onClick={()=>{setThreadColor(tc);setBgColor(bc);}}
                          className={`gs-swatch ${active?"active":""}`}
                          aria-label={`${tc} on ${bc}`}
                          style={{
                            width:40,height:40,borderRadius:"50%",
                            background:bc,
                            border:`1px solid ${C.border}`,
                            cursor:"pointer",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            padding:0,
                          }}>
                          <div style={{width:18,height:18,borderRadius:"50%",background:tc,boxShadow:`0 0 0 1px rgba(0,0,0,.2)`}}/>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Divider/>
                <button
                  onClick={()=>{
                    setNailCnt(240);setThreadCnt(3500);setShape("circle");
                    setMinGap(20);setLineWeight(0.25);setContrast(1.0);
                    setBrightness(0.0);setThreadColor("#1a1a2e");setBgColor("#ffffff");
                  }}
                  style={{
                    width:"100%",height:36,borderRadius:8,
                    background:"transparent",
                    border:`1px solid ${C.border}`,
                    color:C.muted,fontFamily:F.ar,fontWeight:600,fontSize:12,
                    cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                  }}>
                  ↺ إعادة الضبط
                </button>
              </div>
            )}

            {sideTab==="export" && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <SLabel tag="01" text="تصدير الملفات"/>
                {seq.length>1?(
                  <>
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                      {[["THREADS",(seq.length-1).toLocaleString()],["NAILS",nailCnt],["SHAPE",shape.toUpperCase()],["THREAD",threadColor.toUpperCase()],["BG",bgColor.toUpperCase()]].map(([l,v],i)=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:i%2===0?C.surface:C.surface2}}>
                          <span style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>{l}</span>
                          <span style={{fontFamily:F.mono,fontSize:13,color:C.gold,fontWeight:700}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <ExportBtn onClick={exportPNG} variant="gold">⤓ تصدير PNG</ExportBtn>
                    <ExportBtn onClick={exportSVG} variant="cyan">⤓ تصدير SVG</ExportBtn>
                    <ExportBtn onClick={exportTXT} variant="subtle">⤓ تصدير تسلسل المسامير</ExportBtn>
                    <button
                      onClick={()=>{ setShowArduinoModal(true); setPassError(""); setPassAttempts(0); setArduinoPass(""); }}
                      style={{
                        width:"100%",padding:"11px 14px",borderRadius:8,
                        background:"rgba(201,168,76,.08)",
                        border:`1px solid rgba(201,168,76,.35)`,
                        color:C.gold,cursor:"pointer",
                        fontFamily:F.ar,fontSize:13,fontWeight:700,
                        display:"flex",alignItems:"center",gap:8,transition:"all .2s",marginTop:4,
                      }}>
                      <span style={{fontSize:14}}>⚙</span>
                      <span>تصدير كود الأردوينو</span>
                      <span style={{marginInlineStart:"auto",fontFamily:F.mono,fontSize:8,color:C.muted,background:C.surface2,border:`1px solid ${C.border}`,padding:"1px 5px",borderRadius:3}}>🔒 .ino</span>
                    </button>
                  </>
                ):(
                  <div style={{textAlign:"center",padding:"36px 0",color:C.muted}}>
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" style={{margin:"0 auto",display:"block",animation:"gs-pulse 2.5s ease-in-out infinite",opacity:.7}}>
                      <circle cx="50" cy="50" r="40" stroke={C.border} strokeWidth="1"/>
                      {Array.from({length:24}).map((_,i)=>{
                        const a=(i/24)*Math.PI*2;
                        const x=50+Math.cos(a)*40, y=50+Math.sin(a)*40;
                        return <circle key={i} cx={x} cy={y} r="1.4" fill={C.gold}/>;
                      })}
                      {[[0,8],[2,15],[5,18],[10,20],[3,12],[7,16]].map(([a,b],i)=>{
                        const aa=(a/24)*Math.PI*2, bb=(b/24)*Math.PI*2;
                        return <line key={i} x1={50+Math.cos(aa)*40} y1={50+Math.sin(aa)*40} x2={50+Math.cos(bb)*40} y2={50+Math.sin(bb)*40} stroke={C.goldDim} strokeWidth=".6" opacity=".5"/>;
                      })}
                    </svg>
                    <div style={{fontFamily:F.ar,fontSize:13,color:C.muted,marginTop:10}}>قم بالتوليد أولاً</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{flexShrink:0,padding:"10px 14px",borderTop:`1px solid ${C.border}`,background:C.bg2}}>
            <div style={{fontFamily:F.mono,fontSize:8,color:C.subtle,letterSpacing:"0.15em"}}>GEOSTRING SYSTEM © 2025</div>
            <div style={{fontFamily:F.mono,fontSize:8,color:C.subtle,marginTop:2,letterSpacing:"0.1em"}}>CNC · POLAR GEOMETRY · STRING ART</div>
          </div>
        </aside>
        )}

        {/* ══ MAIN AREA ══ */}
        <main style={{flex:1,display:"flex",flexDirection:"column",background:C.bg,overflow:isMobile?"visible":"hidden",minHeight:isMobile?"60vh":undefined}}>

          {/* Floating pill tab bar */}
          <div style={{padding:isMobile?"12px 12px 4px":"16px 20px 6px",display:"flex",justifyContent:"center",flexShrink:0,...(isMobile?{position:"fixed",bottom:0,left:0,right:0,zIndex:40,background:"rgba(8,12,18,.92)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,padding:"10px 12px"}:{})}}>
            <div style={{
              display:"flex",
              background:C.surface,
              border:`1px solid ${C.borderHover}`,
              borderRadius:999,
              padding:4,
              height:40,
              maxWidth:380,
              width:"100%",
            }}>
              {[["preview","◈ المعاينة"],["original","⊡ الأصلية"],["sim3d","◉ 3D"],["steps","≡ الخطوات"],["ai","✦ AI"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setTab(id)} className="gs-pill" style={{
                  flex:1,
                  background:tab===id?C.gold:"transparent",
                  color:tab===id?C.bg:C.muted,
                  border:"none",
                  borderRadius:999,
                  padding:"0 8px",
                  cursor:"pointer",
                  fontSize:12,
                  fontFamily:F.ar,
                  fontWeight:600,
                  position:"relative",
                  whiteSpace:"nowrap",
                }}>
                  {lbl}
                  {id==="ai"&&<span style={{position:"absolute",top:4,left:4,width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:`0 0 6px ${C.green}`,animation:"gs-pulse 2s infinite"}}/>}
                </button>
              ))}
            </div>
          </div>

          <div className="gs-canvas-bg" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"12px 12px 80px":24,overflowY:"auto",position:"relative"}}>

            {tab==="preview"&&(
              <div style={{position:"relative",display:"inline-block",maxWidth:"100%"}}>
                <canvas ref={cvsRef} width={SZ} height={SZ} style={{
                  borderRadius:shape==="circle"?"50%":6,
                  border:`1px solid rgba(240,192,96,.12)`,
                  boxShadow:status==="done"
                    ? undefined
                    : `0 0 0 1px rgba(240,192,96,.12), 0 0 60px rgba(240,192,96,.06), 0 0 120px rgba(56,189,248,.04)`,
                  animation:status==="done"?"gs-glow 3s ease-in-out infinite alternate":undefined,
                  maxWidth:"100%",height:"auto",
                  maxHeight:isMobile?"75vw":"63vh",
                  display:"block",
                  transition:"border-radius .3s",
                  background:bgColor,
                }}/>
                {status==="idle"&&!seq.length&&<EmptyCanvas shape={shape}/>}
                {status==="processing"&&(
                  <ProgressOverlay prog={prog} liveCount={liveCount} threadCnt={threadCnt} shape={shape}/>
                )}
                <div style={{position:"absolute",bottom:10,right:10,background:"rgba(8,12,18,.85)",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:"0.08em",backdropFilter:"blur(8px)"}}>
                  {nailCnt} NAILS
                </div>
                {seq.length>0&&(
                  <div style={{position:"absolute",bottom:10,left:10,display:"flex",gap:4,alignItems:"center",background:"rgba(8,12,18,.85)",border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",backdropFilter:"blur(8px)"}}>
                    <div style={{width:12,height:12,borderRadius:3,background:threadColor,border:`1px solid ${C.border}`}}/>
                    <div style={{width:12,height:12,borderRadius:3,background:bgColor,border:`1px solid ${C.border}`}}/>
                  </div>
                )}
              </div>
            )}

            {tab==="original"&&(
              <div style={{position:"relative",display:"inline-block",maxWidth:"100%"}}>
                <canvas ref={origRef} width={SZ} height={SZ} style={{
                  borderRadius:6,
                  border:`1px solid ${C.border}`,
                  boxShadow:`0 0 0 1px rgba(240,192,96,.08), 0 20px 40px rgba(0,0,0,.5)`,
                  maxWidth:"100%",height:"auto",
                  maxHeight:isMobile?"75vw":"63vh",display:"block",
                  background:C.surface,
                }}/>
                {!image&&(
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(8,12,18,.92)",borderRadius:6,fontFamily:F.mono,fontSize:11,color:C.muted,flexDirection:"column",gap:10}}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="6" y="6" width="36" height="36" rx="4" stroke={C.subtle} strokeWidth="1.5" strokeDasharray="4 3"/>
                    </svg>
                    لا توجد صورة مرفوعة
                  </div>
                )}
              </div>
            )}

            {tab==="sim3d"&&<Sim3DPanel seq={seq} nails={nails} shape={shape} bgColor={bgColor} threadColor={threadColor} lineWeight={lineWeight}/>}
            {tab==="steps"&&<StepsPanel seq={seq} nailCnt={nailCnt} shape={shape} nails={nails}/>}
            {tab==="ai"&&<AiPanel aiLoad={aiLoad} aiRes={aiRes} aiSuggestion={aiSuggestion} applySuggestion={applySuggestion} generate={generate} chat={chat} chatIn={chatIn} setChatIn={setChatIn} chatBusy={chatBusy} sendChat={sendChat} onKey={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} chatEndRef={chatEndRef} hasImg={!!image} runAI={runAI} lockedParams={lockedParams} before={beforeSnapshot.current}/>}
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast&&(
        <div className="gs-up" style={{position:"fixed",bottom:isMobile?80:30,left:"50%",transform:"translateX(-50%)",zIndex:100,background:"rgba(8,12,18,.95)",backdropFilter:"blur(16px)",border:`1px solid ${C.gold}`,borderRadius:999,padding:"10px 22px",fontFamily:F.ar,fontSize:13,fontWeight:600,color:C.gold,whiteSpace:"nowrap",boxShadow:`0 8px 32px rgba(240,192,96,.2)`,pointerEvents:"none",minWidth:220,textAlign:"center"}}>
          {toast}
        </div>
      )}

      {/* Mobile FAB group */}
      {isMobile && status!=="processing" && !sidebarOpen && (
        <div style={{position:"fixed",bottom:78,left:16,zIndex:42,display:"flex",flexDirection:"column-reverse",alignItems:"center",gap:10}}>
          <button
            onClick={()=> imgData ? setFabOpen(o=>!o) : fileRef.current?.click()}
            title={imgData?"أوامر سريعة":"ارفع صورة"}
            style={{width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,border:"none",color:"#0d0d0d",fontSize:22,cursor:"pointer",boxShadow:`0 6px 24px rgba(240,192,96,.45)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,transform:fabOpen?"rotate(45deg)":"none",transition:"transform .25s cubic-bezier(.34,1.56,.64,1)"}}
          >
            {imgData?(fabOpen?"✕":"◈"):"⊡"}
          </button>
          {fabOpen && imgData && (
            <>
              {[
                {icon:"▶",label:"توليد",color:C.gold,action:()=>{generate();setFabOpen(false);}},
                {icon:"✦",label:"AI",color:C.cyan,action:()=>{runAI();setFabOpen(false);}},
                {icon:"⤓",label:"PNG",color:C.green,action:()=>{exportPNG();setFabOpen(false);}},
              ].map(({icon,label,color,action})=>(
                <div key={label} className="gs-up" style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:F.ar,fontSize:11,fontWeight:700,color:C.text,background:"rgba(8,12,18,.92)",padding:"3px 10px",borderRadius:12,border:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{label}</span>
                  <button onClick={action} style={{width:44,height:44,borderRadius:"50%",background:"rgba(8,12,18,.92)",border:`1.5px solid ${color}`,color:color,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 12px rgba(0,0,0,.4)`}}>{icon}</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>

    {showArduinoModal && (
      <div onClick={(e)=>{ if(e.target===e.currentTarget){ setShowArduinoModal(false); setArduinoPass(""); setPassError(""); }}}
        style={{position:"fixed",inset:0,zIndex:200,background:"rgba(7,14,26,0.92)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{background:"#0c1118",border:"1px solid #1e2d40",borderRadius:14,padding:"28px 32px",width:340,boxShadow:"0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(201,168,76,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <div style={{width:38,height:38,borderRadius:10,background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔒</div>
            <div>
              <div style={{fontFamily:F.ar,fontSize:15,fontWeight:700,color:"#e2e8f0",letterSpacing:"0.5px"}}>ARDUINO EXPORT</div>
              <div style={{fontFamily:F.mono,fontSize:9,color:"#64748b",marginTop:1}}>أدخل كلمة المرور للمتابعة</div>
            </div>
            <button onClick={()=>{setShowArduinoModal(false);setArduinoPass("");setPassError("");}}
              style={{marginInlineStart:"auto",background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:18,lineHeight:1}}>✕</button>
          </div>
          <div style={{background:"rgba(201,168,76,.05)",border:"1px solid rgba(201,168,76,.15)",borderRadius:8,padding:"10px 14px",marginBottom:16}}>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.gold,marginBottom:4}}>⚙ MACHINE CONFIG</div>
            <div style={{fontFamily:F.ar,fontSize:11,color:"#8b949e",lineHeight:1.6}}>
              المسامير: <span style={{color:C.gold}}>{nailCnt}</span> · الخيوط: <span style={{color:C.gold}}>{Math.max(0,seq.length-1)}</span> · الشكل: <span style={{color:C.gold}}>{shape==="circle"?"دائري":"مربع"}</span>
            </div>
          </div>
          <div style={{marginBottom:passError?8:16}}>
            <div style={{fontFamily:F.mono,fontSize:9,color:"#64748b",marginBottom:6,letterSpacing:"0.5px"}}>PASSWORD</div>
            <input type="password" value={arduinoPass}
              onChange={e=>{setArduinoPass(e.target.value); setPassError("");}}
              onKeyDown={e=>{ if(e.key==="Enter") handleArduinoExport(); }}
              disabled={passLockUntil>Date.now()}
              placeholder="أدخل كلمة المرور..." autoFocus
              style={{width:"100%",padding:"11px 14px",background:"#111827",border:`1px solid ${passError?"#ff6b6b":"#1e2d40"}`,borderRadius:8,color:"#e2e8f0",fontFamily:F.mono,fontSize:13,outline:"none",letterSpacing:"0.1em",direction:"ltr"}}/>
          </div>
          {passError && (
            <div style={{fontFamily:F.ar,fontSize:11,color:"#ff6b6b",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
              <span>⚠</span><span>{passError}</span>
              {passLockUntil>Date.now() && <span style={{fontFamily:F.mono,marginInlineStart:"auto",color:"#ff9999"}}>{passLockCountdown}ث</span>}
            </div>
          )}
          {passAttempts>0 && passAttempts<3 && (
            <div style={{display:"flex",gap:4,marginBottom:12}}>
              {[1,2,3].map(i=>(<div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=passAttempts?"#ff6b6b":"#1e2d40"}}/>))}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowArduinoModal(false);setArduinoPass("");setPassError("");}}
              style={{flex:1,padding:"10px",borderRadius:8,background:"transparent",border:"1px solid #1e2d40",color:"#64748b",cursor:"pointer",fontFamily:F.ar,fontSize:12,fontWeight:600}}>إلغاء</button>
            <button onClick={handleArduinoExport}
              disabled={!arduinoPass || passLockUntil>Date.now()}
              style={{flex:2,padding:"10px",borderRadius:8,
                background:(!arduinoPass||passLockUntil>Date.now())?"rgba(201,168,76,.2)":`linear-gradient(135deg,${C.gold},${C.goldDim})`,
                border:"none",
                color:(!arduinoPass||passLockUntil>Date.now())?"#64748b":"#070e1a",
                cursor:(!arduinoPass||passLockUntil>Date.now())?"not-allowed":"pointer",
                fontFamily:F.ar,fontSize:13,fontWeight:700}}>
              {passLockUntil>Date.now()?`انتظر ${passLockCountdown} ث`:"⤓ تصدير كود الأردوينو"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

/* ══════════════════════════════════════════════
   ATOMS
   ══════════════════════════════════════════════ */
function GSLogo({small=false}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <div style={{width:small?28:32,height:small?28:32,borderRadius:8,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#0d0d0d",fontFamily:F.disp,fontWeight:800,fontSize:small?15:18,boxShadow:`0 0 16px rgba(240,192,96,.3)`}}>G</div>
      {!small && (
        <div>
          <div style={{fontFamily:F.disp,fontWeight:800,fontSize:15,letterSpacing:"0.12em",color:C.text,lineHeight:1}}>GEOSTRING<span style={{color:C.gold}}>.</span></div>
          <div style={{fontFamily:F.mono,fontSize:8,color:C.muted,letterSpacing:"0.08em",marginTop:2}}>STRING ART GENERATOR</div>
        </div>
      )}
    </div>
  );
}
function PulseDot(){return <div style={{width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:`0 0 6px ${C.green}`,animation:"gs-pulse 2.5s infinite"}}/>;}
function Spin({size=14,color=C.gold}){return <div style={{width:size,height:size,border:"2px solid rgba(255,255,255,.1)",borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"gs-spin .7s linear infinite",flexShrink:0}}/>;}
function Divider(){return <div style={{height:1,background:C.border,margin:"6px 0"}}/>;}

function SLabel({tag,text}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontFamily:F.mono,fontSize:9,color:C.cyan,letterSpacing:"0.1em"}}>{tag}</span>
      <span style={{fontFamily:F.disp,fontSize:13,fontWeight:700,color:C.text,letterSpacing:"0.08em",textTransform:"uppercase"}}>{text}</span>
    </div>
  );
}

function SRow({label,val,children}){
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:12,color:C.muted}}>{label}</span>
        <span style={{fontFamily:F.mono,fontSize:11,color:C.gold,background:C.surface,padding:"2px 8px",borderRadius:999,border:`1px solid ${C.border}`,fontWeight:600}}>{val}</span>
      </div>
      {children}
    </div>
  );
}

function NumSlider({label,suffix,value,min,max,step,onChange,format,big=false,pulse=false}){
  const display=format?format(value):value;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:12,color:C.muted}}>{label}</span>
        <span style={{
          fontFamily:F.mono,
          fontSize:big?14:12,
          color:C.gold,
          background:C.surface,
          padding:big?"4px 12px":"3px 10px",
          borderRadius:8,
          border:`1px solid ${pulse?C.gold:C.border}`,
          boxShadow:pulse?`0 0 0 3px rgba(240,192,96,.18)`:undefined,
          transition:"box-shadow .25s, border-color .25s",
          fontWeight:700,
        }}>
          {display}{suffix?` ${suffix}`:""}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)}
        style={{background:`linear-gradient(to left, ${C.gold} 0%, ${C.gold} ${((value-min)/(max-min))*100}%, ${C.surface2} ${((value-min)/(max-min))*100}%, ${C.surface2} 100%)`}}
      />
    </div>
  );
}

function ColorRow({label,value,onChange}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
      <span style={{fontSize:12,color:C.muted,flexShrink:0}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{value.toUpperCase()}</span>
        <label style={{position:"relative",width:36,height:36,borderRadius:8,background:value,border:`2px solid ${C.border}`,cursor:"pointer",boxShadow:"inset 0 0 0 1px rgba(0,0,0,.2)"}}>
          <input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer"}}/>
        </label>
      </div>
    </div>
  );
}

function ExportBtn({onClick,variant,children}){
  const styles={
    gold:   {color:C.gold,border:`1px solid rgba(240,192,96,.35)`,bg:"rgba(240,192,96,.04)"},
    cyan:   {color:C.cyan,border:`1px solid rgba(56,189,248,.35)`,bg:"rgba(56,189,248,.04)"},
    subtle: {color:C.muted,border:`1px solid ${C.border}`,bg:"transparent"},
  }[variant]||{color:C.text,border:`1px solid ${C.border}`,bg:"transparent"};
  return(
    <button onClick={onClick} style={{
      width:"100%",height:40,borderRadius:8,
      background:styles.bg,border:styles.border,color:styles.color,
      fontFamily:F.ar,fontWeight:600,fontSize:12,
      cursor:"pointer",
      display:"flex",alignItems:"center",justifyContent:"flex-start",
      padding:"0 16px",gap:10,
    }}>
      {children}
    </button>
  );
}

function EmptyCanvas({shape}){
  return(
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(8,12,18,.92)",borderRadius:shape==="circle"?"50%":6,pointerEvents:"none",gap:14}}>
      <div style={{
        width:140,height:140,borderRadius:"50%",
        border:`2px solid ${C.gold}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        animation:"gs-ringPulse 2.5s ease-in-out infinite",
        position:"relative",
      }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <rect x="10" y="10" width="36" height="36" rx="4" stroke={C.gold} strokeWidth="1.6"/>
          <path d="M28 20v16M20 28h16" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{fontFamily:F.ar,fontSize:15,fontWeight:600,color:C.text,textAlign:"center",padding:"0 20px"}}>اسحب صورتك هنا أو اختر من جهازك</div>
      <div style={{fontFamily:F.mono,fontSize:11,color:C.muted,letterSpacing:"0.1em"}}>PNG / JPG / WEBP</div>
    </div>
  );
}

/* ══════ PROGRESS OVERLAY ══════ */
function ProgressOverlay({prog,liveCount,threadCnt,shape}){
  const R=44, C2=2*Math.PI*R;
  const dash=C2*(prog/100);
  return(
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(8,12,18,.7)",borderRadius:shape==="circle"?"50%":6,pointerEvents:"none",backdropFilter:"blur(2px)",gap:10}}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{transform:"rotate(-90deg)"}}>
        <circle cx="55" cy="55" r={R} stroke={C.border} strokeWidth="3" fill="none"/>
        <circle cx="55" cy="55" r={R} stroke={C.gold} strokeWidth="3" fill="none"
          strokeDasharray={`${dash} ${C2}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray .4s",filter:`drop-shadow(0 0 6px ${C.gold})`}}
        />
      </svg>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,calc(-50% - 28px))",fontFamily:F.mono,fontSize:24,color:C.gold,fontWeight:700}}>{prog}%</div>
      <div style={{fontFamily:F.mono,fontSize:11,color:C.text,letterSpacing:"0.05em"}}>
        <span style={{color:C.gold}}>{liveCount.toLocaleString()}</span>
        <span style={{color:C.muted}}> / {threadCnt.toLocaleString()} خيط</span>
      </div>
    </div>
  );
}

/* ══════ INLINE GENERATION PROGRESS (sidebar) ══════ */
function GenerationProgress({prog,liveCount,threadCnt,onStop}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{height:6,borderRadius:6,background:C.surface2,overflow:"hidden",position:"relative"}}>
        <div style={{height:"100%",width:`${prog}%`,background:`linear-gradient(90deg,${C.goldDim},${C.gold})`,borderRadius:6,transition:"width .4s",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent 0%,rgba(255,255,255,.4) 50%,transparent 100%)",backgroundSize:"200% 100%",animation:"gs-shine 1.5s linear infinite"}}/>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:F.mono,fontSize:10,color:C.muted}}>
        <span style={{color:C.gold}}>{liveCount.toLocaleString()}</span>
        <span>/ {threadCnt.toLocaleString()} thread</span>
        <span style={{color:C.gold,fontWeight:700}}>{prog}%</span>
      </div>
      <button onClick={onStop} style={{
        width:"100%",height:38,borderRadius:8,
        background:"rgba(239,79,79,.08)",
        border:`1px solid rgba(239,79,79,.4)`,
        color:C.red,fontFamily:F.ar,fontWeight:700,fontSize:12,
        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
      }}>⏹ إيقاف</button>
    </div>
  );
}

/* ══════ 3D SIMULATION PANEL (Reference site embed) ══════ */
function Sim3DPanel({seq,nails,shape,bgColor,threadColor,lineWeight}){
  const empty=!seq.length||!nails.length;

  // Build payload compatible with the reference site (stringphotokr).
  // Reference reads from localStorage keys: pinsdata, data, SIZE, framecolor, pincovercolor.
  // We mirror those into the URL hash so the reference page (or a fork of it) can rehydrate.
  const payload = useMemo(()=>{
    if(empty) return null;
    const cdiv = nails.length;
    // degrees for circular nail layout (reference format)
    const deg = Array.from({length:cdiv},(_,i)=>+(i*360/cdiv).toFixed(2));
    return {
      pdata: seq,            // thread sequence (nail indexes)
      cdiv,                  // total nails
      deg,                   // degrees
      pinsdata: nails.map(n=>({x:+n.x.toFixed(2),y:+n.y.toFixed(2)})),
      SIZE: 600,
      shape,
      framecolor: bgColor,
      pincovercolor: threadColor,
      threadColor,
      lineWeight,
    };
  },[empty,seq,nails,shape,bgColor,threadColor,lineWeight]);

  const refUrl = useMemo(()=>{
    const base = "https://stringphotokr.dothome.co.kr/indexmaking.html";
    if(!payload) return base;
    try{
      const encoded = encodeURIComponent(JSON.stringify(payload));
      return `${base}#geostring=${encoded}`;
    }catch{ return base; }
  },[payload]);

  // Try to also push to localStorage of the reference site via window.open + postMessage fallback.
  const openInNewTab=()=>{
    if(!payload) return;
    window.open(refUrl, "_blank", "noopener,noreferrer");
  };

  return(
    <div style={{width:"100%",maxWidth:760,display:"flex",flexDirection:"column",gap:14,alignItems:"center"}} className="gs-up">
      {empty?(
        <div style={{
          width:"100%",aspectRatio:"16/10",maxWidth:680,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          gap:12,color:C.muted,fontFamily:F.ar,fontSize:13,textAlign:"center",padding:20,
          borderRadius:12,border:`1px dashed ${C.border}`,
          background:`radial-gradient(circle at 50% 40%, rgba(240,192,96,.06), transparent 70%)`,
        }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{opacity:.55}}>
            <ellipse cx="36" cy="36" rx="28" ry="10" stroke={C.gold} strokeWidth="1.4" opacity=".5"/>
            <ellipse cx="36" cy="36" rx="28" ry="10" stroke={C.cyan} strokeWidth="1.2" opacity=".4" transform="rotate(60 36 36)"/>
            <ellipse cx="36" cy="36" rx="28" ry="10" stroke={C.gold} strokeWidth="1.2" opacity=".4" transform="rotate(120 36 36)"/>
            <circle cx="36" cy="36" r="3" fill={C.gold}/>
          </svg>
          <div style={{fontWeight:600,color:C.text}}>محاكاة ثلاثية الأبعاد — العارض المرجعي</div>
          <div style={{fontSize:11,fontFamily:F.mono,color:C.muted,letterSpacing:".08em"}}>
            قم بتوليد لوحتك أولاً لعرض المجسم في العارض الأصلي
          </div>
        </div>
      ):(
        <>
          <div style={{
            width:"100%",aspectRatio:"4/3",maxWidth:720,
            borderRadius:12,overflow:"hidden",
            border:`1px solid ${C.border}`,
            background:"#000",position:"relative",
          }}>
            <iframe
              src={refUrl}
              title="String Photo 3D Viewer"
              style={{width:"100%",height:"100%",border:0,display:"block"}}
              allow="accelerometer; gyroscope; xr-spatial-tracking; fullscreen"
              referrerPolicy="no-referrer"
            />
          </div>

          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",width:"100%"}}>
            <button onClick={openInNewTab} style={ctrlBtn(true)}>
              ⤴ فتح العارض الأصلي في نافذة جديدة
            </button>
            <button
              onClick={()=>{ try{ navigator.clipboard.writeText(refUrl); }catch{} }}
              style={ctrlBtn(false)}
            >
              ⧉ نسخ رابط المجسم
            </button>
          </div>

          <div style={{
            width:"100%",maxWidth:680,padding:"10px 14px",
            borderRadius:8,border:`1px dashed ${C.border}`,
            background:"rgba(240,192,96,.04)",
            fontFamily:F.ar,fontSize:11,color:C.muted,lineHeight:1.8,textAlign:"center",
          }}>
            يتم إعادة توجيه العارض إلى رابط المجسم الأصلي مع تمرير بيانات المسامير ({nails.length}) وتسلسل الخيط ({(seq.length-1).toLocaleString()} خط) عبر الـ <span style={{color:C.gold,fontFamily:F.mono}}>#hash</span>.
          </div>
        </>
      )}
    </div>
  );
}
function ctrlBtn(active){
  return{
    height:36,padding:"0 14px",borderRadius:999,
    background:active?C.gold:"transparent",
    color:active?C.bg:C.text,
    border:`1px solid ${active?C.gold:C.border}`,
    fontFamily:F.ar,fontSize:12,fontWeight:600,cursor:"pointer",
  };
}

/* ══════ STEPS PANEL ══════ */

function StepsPanel({seq,nailCnt,shape,nails}){
  const [search,setSearch]=useState("");
  const [copied,setCopied]=useState(false);
  const [showAll,setShowAll]=useState(false);
  if(!seq.length) return(
    <div style={{textAlign:"center",color:C.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:40}}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{opacity:.5}}>
        <line x1="20" y1="20" x2="60" y2="20" stroke={C.subtle} strokeWidth="1.5"/>
        <line x1="20" y1="32" x2="50" y2="32" stroke={C.subtle} strokeWidth="1.5"/>
        <line x1="20" y1="44" x2="58" y2="44" stroke={C.subtle} strokeWidth="1.5"/>
        <line x1="20" y1="56" x2="45" y2="56" stroke={C.subtle} strokeWidth="1.5"/>
      </svg>
      <div style={{fontFamily:F.ar,fontSize:13}}>قم بالتوليد أولاً لعرض الخطوات</div>
    </div>
  );
  const limit=showAll?seq.length-1:50;
  const filtered=search
    ? seq.slice(1).reduce((acc,n,i)=>{
        if(String(seq[i]).includes(search)||String(n).includes(search)) acc.push([i,seq[i],n]);
        return acc;
      },[]).slice(0,400)
    : seq.slice(1,limit+1).map((n,i)=>[i,seq[i],n]);

  const copyAll=async()=>{
    const txt=seq.slice(1).map((n,i)=>`${i+1}: ${seq[i]} → ${n}`).join("\n");
    try{ await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(()=>setCopied(false),2000); }catch{}
  };

  return(
    <div style={{width:"100%",maxWidth:580,display:"flex",flexDirection:"column",gap:14}} className="gs-up">
      <div style={{display:"flex",gap:10}}>
        {[["THREADS",(seq.length-1).toLocaleString()],["NAILS",nailCnt],["SHAPE",shape.toUpperCase()]].map(([l,v])=>(
          <div key={l} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginBottom:4,letterSpacing:"0.1em"}}>{l}</div>
            <div style={{fontFamily:F.mono,fontSize:16,color:C.gold,fontWeight:700}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input
          value={search}
          onChange={e=>setSearch(e.target.value.replace(/[^0-9]/g,""))}
          placeholder="ابحث عن رقم مسمار..."
          style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 14px",color:C.text,fontFamily:F.mono,fontSize:12,outline:"none",direction:"rtl"}}
        />
        <button onClick={copyAll} style={{
          fontFamily:F.mono,fontSize:11,color:copied?C.green:C.gold,
          background:copied?"rgba(34,211,165,.08)":"rgba(240,192,96,.06)",
          border:`1px solid ${copied?C.green:C.gold}`,
          borderRadius:8,padding:"8px 14px",cursor:"pointer",whiteSpace:"nowrap",fontWeight:600
        }}>
          {copied?"✓ تم النسخ":"⎘ نسخ الكل"}
        </button>
      </div>

      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.bg2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:F.disp,fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:C.text,textTransform:"uppercase"}}>Nail Sequence</span>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.gold}}>
            {search?`${filtered.length} MATCH`:`${filtered.length} / ${seq.length-1}`}
          </span>
        </div>
        <div style={{maxHeight:420,overflowY:"auto",position:"relative"}}>
          {/* Timeline connector */}
          <div style={{position:"absolute",top:0,bottom:0,right:54,width:1,background:`linear-gradient(${C.gold}33, transparent)`,opacity:.4,pointerEvents:"none"}}/>
          {filtered.map(([i,a,b])=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 16px",borderBottom:`1px solid rgba(30,45,64,.4)`,position:"relative"}}>
              <span style={{fontFamily:F.mono,fontSize:10,color:C.gold,width:38,textAlign:"center",fontWeight:600,letterSpacing:"0.05em"}}>{String(i+1).padStart(3,"0")}</span>
              <NailTag n={a}/>
              <span style={{color:C.subtle,fontFamily:F.mono,fontSize:11}}>→</span>
              <NailTag n={b} accent/>
              <span style={{fontFamily:F.mono,fontSize:9,color:C.subtle,marginRight:"auto"}}>#{i+2}</span>
            </div>
          ))}
          {!search && !showAll && seq.length-1 > 50 && (
            <button onClick={()=>setShowAll(true)} style={{
              width:"100%",padding:"12px",
              background:"transparent",
              border:"none",
              borderTop:`1px solid ${C.border}`,
              color:C.gold,fontFamily:F.ar,fontSize:12,fontWeight:600,
              cursor:"pointer",
            }}>
              عرض المزيد ▾ ({(seq.length-1-50).toLocaleString()} خطوة)
            </button>
          )}
          {search&&filtered.length===0&&(
            <div style={{padding:"24px",fontFamily:F.ar,fontSize:12,color:C.muted,textAlign:"center"}}>لا توجد نتائج</div>
          )}
        </div>
      </div>
    </div>
  );
}

function NailTag({n,accent=false}){
  return <div style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${accent?C.gold:C.border}`,background:accent?"rgba(240,192,96,.1)":C.surface2,fontFamily:F.mono,fontSize:10,color:accent?C.gold:C.text,minWidth:44,textAlign:"center",fontWeight:accent?700:500}}>{n}</div>;
}

/* ══════ AI PANEL ══════ */
function AiPanel({aiLoad,aiRes,aiSuggestion,applySuggestion,generate,chat,chatIn,setChatIn,chatBusy,sendChat,onKey,chatEndRef,hasImg,runAI,lockedParams={},before=null}){
  const anyLocked=lockedParams && (lockedParams.shape||lockedParams.nails||lockedParams.threads||lockedParams.colors);
  return(
    <div style={{width:"100%",maxWidth:680,display:"flex",flexDirection:"column",gap:14,height:"100%",maxHeight:"100%"}} className="gs-up">

      {/* Header card with gradient border */}
      <div style={{
        padding:1.5,borderRadius:12,
        background:`linear-gradient(135deg, ${C.gold}, ${C.cyan})`,
        flexShrink:0,
      }}>
        <div style={{background:C.surface,borderRadius:11,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${C.cyan},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.disp,fontWeight:800,fontSize:20,color:"#0d0d0d",flexShrink:0,boxShadow:`0 0 18px rgba(56,189,248,.3)`}}>✦</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:F.disp,fontSize:13,fontWeight:700,letterSpacing:"0.12em",color:C.gold,textTransform:"uppercase"}}>Geostring AI Assistant</div>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginTop:3,letterSpacing:"0.05em"}}>محلل صور + مستشار فن الأوتار</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <PulseDot/><span style={{fontFamily:F.mono,fontSize:9,color:C.green,letterSpacing:"0.1em"}}>ONLINE</span>
          </div>
        </div>
      </div>

      {!hasImg&&!aiRes&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:28,textAlign:"center",flexShrink:0}}>
          <div style={{fontFamily:F.disp,fontSize:36,color:C.subtle,marginBottom:10}}>⊡</div>
          <div style={{fontFamily:F.ar,fontSize:13,color:C.muted}}>ارفع صورة من الشريط الجانبي لبدء التحليل</div>
        </div>
      )}

      {hasImg&&!aiRes&&!aiLoad&&(
        <div style={{background:C.surface,border:`1px solid rgba(240,192,96,.25)`,borderRadius:10,padding:"22px",textAlign:"center",flexShrink:0}}>
          <div style={{fontFamily:F.disp,fontSize:32,color:C.gold,marginBottom:10}}>◈</div>
          <div style={{fontFamily:F.ar,fontSize:13,color:C.muted,marginBottom:16}}>اضغط لتحليل الصورة واقتراح أفضل الإعدادات تلقائياً</div>
          <button onClick={runAI} style={{
            background:`linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
            color:"#0d0d0d",border:"none",borderRadius:8,padding:"10px 26px",
            fontFamily:F.ar,fontWeight:700,fontSize:13,cursor:"pointer",
            boxShadow:"0 4px 16px rgba(240,192,96,.3)",
            display:"inline-flex",alignItems:"center",gap:8,
          }}>✦ تحليل الصورة الآن</button>
        </div>
      )}

      {aiLoad&&(
        <div style={{background:C.surface,border:`1px solid rgba(240,192,96,.2)`,borderRadius:10,padding:28,textAlign:"center",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Spin size={28} color={C.gold}/></div>
          <div style={{fontFamily:F.disp,fontSize:13,letterSpacing:"0.12em",color:C.gold,textTransform:"uppercase"}}>Analyzing Image</div>
          <div style={{fontFamily:F.ar,fontSize:12,color:C.muted,marginTop:6}}>الذكاء الاصطناعي يفحص الصورة...</div>
        </div>
      )}

      {aiRes&&(
        <div style={{background:C.surface,border:`1px solid rgba(56,189,248,.25)`,borderRadius:10,padding:"14px 16px",flexShrink:0,display:"flex",flexDirection:"column",gap:12}} className="gs-up">
          <div style={{fontFamily:F.mono,fontSize:10,color:C.cyan,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600}}>◈ AI Analysis</div>

          {anyLocked && (
            <div style={{padding:"8px 12px",background:"rgba(240,192,96,.05)",border:`1px solid rgba(240,192,96,.2)`,borderRadius:8,fontFamily:F.mono,fontSize:10,color:C.gold,display:"flex",flexWrap:"wrap",gap:10}}>
              <span style={{color:C.muted}}>إعدادات مقيّدة:</span>
              {lockedParams.shape && <span>🔒 الشكل</span>}
              {lockedParams.nails && <span>🔒 المسامير</span>}
              {lockedParams.threads && <span>🔒 الخيوط</span>}
              {lockedParams.colors && <span>🔒 الألوان</span>}
            </div>
          )}

          {aiSuggestion && before && (
            <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",padding:"8px 12px",background:C.bg2,fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:"0.1em"}}>
                <span>المعامل</span><span>قبل</span><span>بعد (AI)</span>
              </div>
              {[
                {k:"nails",label:"المسامير",b:before.nailCnt,a:aiSuggestion.nails,locked:lockedParams.nails},
                {k:"threads",label:"الخيوط",b:before.threadCnt?.toLocaleString(),a:aiSuggestion.threads?.toLocaleString?.()||aiSuggestion.threads,locked:lockedParams.threads},
                {k:"shape",label:"الشكل",b:before.shape==="circle"?"دائري":"مربع",a:aiSuggestion.shape==="circle"?"دائري":"مربع",locked:lockedParams.shape},
                {k:"thread",label:"لون الخيط",b:before.threadColor,a:aiSuggestion.threadColor,swatch:true,locked:lockedParams.colors},
                {k:"bg",label:"الخلفية",b:before.bgColor,a:aiSuggestion.bgColor,swatch:true,locked:lockedParams.colors},
              ].map((row,i)=>{
                const same=String(row.b)===String(row.a);
                return (
                  <div key={row.k} style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",alignItems:"center",padding:"9px 12px",borderTop:`1px solid ${C.border}`,background:i%2?"rgba(255,255,255,.015)":"transparent"}}>
                    <span style={{fontFamily:F.ar,fontSize:12,color:C.text}}>{row.label}</span>
                    {row.swatch ? (
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:16,height:16,borderRadius:4,background:row.b,border:`1px solid ${C.border}`}}/>
                        <span style={{fontFamily:F.mono,fontSize:9,color:C.muted}}>{row.b}</span>
                      </div>
                    ) : (
                      <span style={{fontFamily:F.mono,fontSize:12,color:same?C.muted:C.text}}>{row.b}</span>
                    )}
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{color:C.gold,fontFamily:F.mono,fontSize:11}}>→</span>
                      {row.swatch ? (
                        <>
                          <div style={{width:16,height:16,borderRadius:4,background:row.a,border:`1px solid ${C.border}`}}/>
                          <span style={{fontFamily:F.mono,fontSize:9,color:row.locked?C.gold:C.text}}>{row.a}</span>
                        </>
                      ) : (
                        <span style={{fontFamily:F.mono,fontSize:12,color:row.locked?C.gold:(same?C.muted:C.text),fontWeight:row.locked?700:500}}>{row.a}</span>
                      )}
                      {row.locked && <span style={{fontSize:10}}>🔒</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{
            borderRight:`4px solid ${C.gold}`,
            background:C.bg2,
            borderRadius:6,
            padding:"12px 14px",
            fontSize:13,
            color:C.text,
            lineHeight:1.9,
            whiteSpace:"pre-wrap",
            fontFamily:F.ar,
            fontStyle:"italic",
          }}>{aiRes}</div>
          {aiSuggestion && (
            <div style={{marginTop:10,padding:"8px 12px",background:"rgba(34,211,165,.08)",border:`1px solid rgba(34,211,165,.25)`,borderRadius:6,fontFamily:F.ar,fontSize:11,color:C.green}}>
              ✓ تم تطبيق الإعدادات المقترحة تلقائياً
            </div>
          )}
          {aiSuggestion && (
            <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
              <button onClick={()=>{applySuggestion(aiSuggestion); setTimeout(()=>generate&&generate(),200);}}
                style={{flex:1,minWidth:170,height:44,borderRadius:8,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"#0d0d0d",border:"none",fontFamily:F.ar,fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 14px rgba(240,192,96,.25)"}}>
                ◈ تطبيق الإعدادات ←
              </button>
              <button onClick={runAI} style={{flex:"0 0 auto",height:44,padding:"0 18px",borderRadius:8,background:"transparent",color:C.gold,border:`1px solid ${C.gold}`,fontFamily:F.ar,fontWeight:600,fontSize:12,cursor:"pointer"}}>
                ✦ إعادة التحليل
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      <div style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:200}}>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:"0.1em",flexShrink:0,textTransform:"uppercase"}}>
          Chat · اسأل المساعد
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
          {!chat.length&&(
            <div style={{color:C.subtle,fontFamily:F.ar,fontSize:12,textAlign:"center",marginTop:18,lineHeight:1.9}}>
              جرّب: "كيف أضع المسامير على اللوح؟"<br/>"ما أفضل نوع خيط للـ CNC؟"<br/>"كيف أحسّن وضوح الصورة الناتجة؟"
            </div>
          )}
          {chat.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-start":"flex-end"}} className="gs-up">
              <div style={{
                maxWidth:"80%",
                padding:"10px 14px",
                borderRadius:m.r==="user"
                  ? "14px 14px 14px 4px"   // RTL user (visually right when dir=rtl)
                  : "14px 14px 4px 14px",  // AI
                background:m.r==="user"?C.surface2:"rgba(56,189,248,.08)",
                border:`1px solid ${m.r==="user"?C.borderHover:"rgba(56,189,248,.2)"}`,
                fontSize:13,color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:F.ar,
              }}>
                {m.r==="ai"&&<div style={{fontFamily:F.mono,fontSize:8,color:C.cyan,marginBottom:5,letterSpacing:"0.1em"}}>◈ GEOSTRING AI</div>}
                {m.t}
              </div>
            </div>
          ))}
          {chatBusy&&(
            <div style={{display:"flex",justifyContent:"flex-end"}} className="gs-up">
              <div style={{padding:"10px 16px",borderRadius:"14px 14px 4px 14px",background:"rgba(56,189,248,.08)",border:`1px solid rgba(56,189,248,.2)`,display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.cyan,animation:`gs-pulse 1.2s ${i*.22}s ease-in-out infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>
        <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,flexShrink:0,alignItems:"center",background:C.bg2}}>
          <div style={{flex:1,display:"flex",alignItems:"center",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:999,padding:"4px 6px 4px 16px"}}>
            <input
              value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={onKey}
              placeholder="اكتب سؤالك ثم اضغط Enter..."
              style={{flex:1,background:"transparent",border:"none",color:C.text,fontSize:13,outline:"none",fontFamily:F.ar,direction:"rtl",padding:"6px 4px"}}
            />
            <button onClick={sendChat} disabled={!chatIn.trim()||chatBusy}
              style={{
                width:32,height:32,borderRadius:"50%",
                background:chatIn.trim()&&!chatBusy?`linear-gradient(135deg,${C.gold},${C.goldDim})`:C.border,
                color:chatIn.trim()&&!chatBusy?"#0d0d0d":C.subtle,
                border:"none",
                cursor:chatIn.trim()&&!chatBusy?"pointer":"not-allowed",
                fontSize:14,fontWeight:700,
                display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0,
              }}>
              {chatBusy?<Spin size={12} color="#0d0d0d"/>:"↑"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

