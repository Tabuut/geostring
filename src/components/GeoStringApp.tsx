// @ts-nocheck
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════
   GEOSTRING BRAND TOKENS
   ══════════════════════════════════════════════ */
const C = {
  bg:"#0d1117", bg2:"#070e1a", navy:"#0a0f1a", navy2:"#121a2b",
  card:"#161b22", border:"#30363d",
  gold:"#c9a84c", gold2:"#e0b85c",
  cyan:"#5cbdb9", cyan2:"#3a9e9a",
  text:"#c9d1d9", muted:"#8b949e",
};
const F = {
  ar:"'Cairo','Tajawal',sans-serif",
  disp:"'Barlow Condensed',sans-serif",
  mono:"'JetBrains Mono','Courier New',monospace",
};

/* ══════════════════════════════════════════════
   AI (Artificial Intelligence)
   ══════════════════════════════════════════════ */
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyC-bWI_7YA3vZTP7NxfS7Utgl0lQhYJDQA`;

async function askGemini(prompt, b64 = null, opts = {}) {
  const parts = [];
  if (b64) parts.push({ inlineData: { mimeType: "image/jpeg", data: b64 } });
  parts.push({ text: prompt });
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents:[{parts}],
      generationConfig:{
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxOutputTokens ?? 1024,
        ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {})
      }
    }),
  });
  const d = await res.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || "لم أتمكن من الحصول على رد.";
}

async function analyzeImage(b64) {
  return askGemini(`أنت خبير عالمي في فن الأوتار (String Art) ونظام Geostring للتنفيذ على آلات CNC.
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

النطاقات: nails 80-400، threads 500-8000، minGap 5-60، lineWeight 0.05-0.40، contrast 0.5-3.0، brightness -0.4 إلى 0.4.`, b64, { temperature: 0.25, maxOutputTokens: 1400, responseMimeType: "application/json" });
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
   STRING ART ALGORITHM
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

function* runAlgo(gray,nails,maxL,gap,size,weight,cb){
  const dark=new Float32Array(gray);
  const seq=[0];let cur=0;
  const w=Math.min(weight*0.35, 0.06);
  for(let s=0;s<maxL;s++){
    let best=-Infinity,bn=-1;
    for(let n=0;n<nails.length;n++){
      if(n===cur) continue;
      const df=Math.abs(n-cur);
      if(df<gap||df>nails.length-gap) continue;
      const px=bresenham(nails[cur][0],nails[cur][1],nails[n][0],nails[n][1]);
      let sc=0;
      for(const[x,y] of px) if(x>=0&&x<size&&y>=0&&y<size) sc+=dark[y*size+x];
      sc/=px.length;
      if(sc>best){best=sc;bn=n;}
    }
    if(bn===-1||best<0.001) break;
    const px=bresenham(nails[cur][0],nails[cur][1],nails[bn][0],nails[bn][1]);
    for(const[x,y] of px)
      if(x>=0&&x<size&&y>=0&&y<size) dark[y*size+x]=Math.max(0,dark[y*size+x]-w);
    seq.push(bn); cur=bn;
    if(s%40===0){cb(s,maxL,seq.slice()); yield;}
  }
  cb(maxL,maxL,seq);
}

/* ══════════════════════════════════════════════
   GLOBAL CSS
   ══════════════════════════════════════════════ */
const CSS=`
*{box-sizing:border-box;}
.gs-root ::-webkit-scrollbar{width:4px;}
.gs-root ::-webkit-scrollbar-thumb{background:#30363d;border-radius:4px;}
.gs-root input[type=range]{accent-color:#c9a84c;width:100%;cursor:pointer;height:3px;}
.gs-root input[type=color]{cursor:pointer;border:none;padding:0;background:none;}
@keyframes gs-spin{to{transform:rotate(360deg)}}
@keyframes gs-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes gs-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes gs-orbFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-20px) scale(1.05)}}
@keyframes gs-shimmer{0%{opacity:.4}50%{opacity:.9}100%{opacity:.4}}
.gs-up{animation:gs-fadeUp .25s ease forwards;}
.gs-drop:hover{border-color:rgba(201,168,76,.6)!important;background:rgba(201,168,76,.04)!important;}
.gs-drop.drag{border-color:#c9a84c!important;background:rgba(201,168,76,.08)!important;}
.gs-tab:hover{color:#c9d1d9!important;}
.gs-sb-btn:hover{border-color:rgba(201,168,76,.4)!important;color:#c9a84c!important;}
`;

function useViewport(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{
    const onR=()=>setW(window.innerWidth);
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
  const [nailCnt,setNailCnt]=useState(200);
  const [threadCnt,setThreadCnt]=useState(3000);
  const [shape,setShape]=useState("circle");
  const [minGap,setMinGap]=useState(20);
  const [threadColor,setThreadColor]=useState("#1a1a2e");
  const [bgColor,setBgColor]=useState("#ffffff");
  const [lineWeight,setLineWeight]=useState(0.3);
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
      for(const[x,y] of nl){ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill();}
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
    const gray=toGray(imgData,SZ,contrast,brightness);
    const nl=nails;
    draw([0],nl,threadColor,bgColor,true);
    const gen=runAlgo(gray,nl,threadCnt,minGap,SZ,lineWeight,(step,total,s)=>{
      const p=Math.round(step/total*100);
      setProg(p);setSeq([...s]);setLiveCount(s.length-1);
      draw(s,nl,threadColor,bgColor,false);
      if(step>=total){
        setStatus("done");
        const c=cvsRef.current;if(c){
          const ctx=c.getContext("2d");
          ctx.fillStyle=C.gold;
          for(const[x,y] of nl){ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill();}
        }
      }
    });
    function tick(){const r=gen.next();if(!r.done) animRef.current=requestAnimationFrame(tick);else setStatus("done");}
    animRef.current=requestAnimationFrame(tick);
  },[imgData,nails,threadCnt,minGap,lineWeight,contrast,brightness,threadColor,bgColor,draw]);

  useEffect(()=>{ generateRef.current=generate; },[generate]);

  const stop=()=>{if(animRef.current) cancelAnimationFrame(animRef.current);setStatus("done");};

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

  const applySuggestion=useCallback((s)=>{
    if(!s) return;
    const n=clamp(s.nails,80,400); if(n!=null) setNailCnt(Math.round(n));
    const t=clamp(s.threads,500,8000); if(t!=null) setThreadCnt(Math.round(t));
    const g=clamp(s.minGap,5,60); if(g!=null) setMinGap(Math.round(g));
    const lw=clamp(s.lineWeight,0.05,0.4); if(lw!=null) setLineWeight(+lw.toFixed(2));
    const c=clamp(s.contrast,0.5,3); if(c!=null) setContrast(+c.toFixed(2));
    const b=clamp(s.brightness,-0.4,0.4); if(b!=null) setBrightness(+b.toFixed(2));
    if(s.shape==="circle"||s.shape==="square") setShape(s.shape);
    if(validHex(s.threadColor)) setThreadColor(s.threadColor.toLowerCase());
    if(validHex(s.bgColor)) setBgColor(s.bgColor.toLowerCase());
  },[]);

  const runAI=useCallback(async()=>{
    const src=hidOrigRef.current||origRef.current;if(!src||!image) return;
    setAiLoad(true);setAiRes(null);setAiSuggestion(null);setTab("ai");
    try{
      const b64=toB64(src);
      const res=await analyzeImage(b64);
      const parsed=extractJSON(res);
      if(parsed){
        setAiSuggestion(parsed);
        applySuggestion(parsed);
        const a=parsed.analysis||{};
        const analysisLine=a.contrastLevel?`\n◆ تحليل الصورة: تباين ${a.contrastLevel} • سطوع ${a.brightnessLevel} • تفاصيل ${a.detailDensity}${a.cleanBackground===false?" • خلفية معقدة":""}`:"";
        const summary=`✦ تحليل الصورة\n${parsed.subject?`الموضوع: ${parsed.subject}\n`:""}${parsed.reasoning||""}${analysisLine}\n\n◈ الإعدادات المُطبَّقة تلقائياً:\n• الشكل: ${parsed.shape==="square"?"مربع":"دائري"}\n• المسامير: ${parsed.nails}\n• الخيوط: ${parsed.threads}\n• الفجوة الدنيا: ${parsed.minGap}\n• وزن الخط: ${parsed.lineWeight}\n• التباين: ${parsed.contrast}  •  السطوع: ${parsed.brightness}\n• لون الخيط: ${parsed.threadColor}  •  الخلفية: ${parsed.bgColor}`;
        setAiRes(summary);
        setTimeout(()=>{ try{ generate&&generate(); }catch{} }, 80);
      } else {
        setAiRes(res||"لم يتمكن الذكاء الاصطناعي من إنتاج إعدادات صالحة. حاول مرة أخرى.");
      }
    }catch(e){setAiRes("خطأ في الاتصال بالذكاء الاصطناعي. تحقق من الاتصال.");}
    setAiLoad(false);
  },[image,applySuggestion]);


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
    }catch{setChat([...nc,{r:"ai",t:"عذراً، حدث خطأ. حاول مجدداً."}]);}
    setChatBusy(false);
  },[chatIn,chat,chatBusy,nailCnt,threadCnt,shape,threadColor,image]);

  /* ══════ RENDER ══════ */
  const sidebarVisible = !isMobile || sidebarOpen;

  return(
    <div className="gs-root" style={{fontFamily:F.ar,background:C.bg,minHeight:"100vh",height:isMobile?"auto":"100vh",color:C.text,display:"flex",flexDirection:"column",direction:"rtl",overflow:isMobile?"auto":"hidden"}}>

      <canvas ref={hidOrigRef} width={SZ} height={SZ} style={{display:"none"}}/>

      {/* ── HEADER ── */}
      <header style={{flexShrink:0,position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)",background:"rgba(7,14,26,0.95)",borderBottom:`1px solid ${C.border}`,padding:isMobile?"8px 12px":"0 20px",minHeight:56,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <GSLogo/>
        {!isMobile && <div style={{width:1,height:24,background:C.border}}/>}
        {!isMobile && (
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <PulseDot/><span style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:"0.5px"}}>STRING ART ENGINE · v2.0</span>
          </div>
        )}
        <div style={{marginRight:"auto"}}/>
        {status==="processing"&&(
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(201,168,76,.08)",border:`1px solid rgba(201,168,76,.2)`,borderRadius:20,padding:"4px 10px",fontFamily:F.mono,fontSize:10,color:C.gold}}>
            <Spin size={10} color={C.gold}/> {prog}% · {liveCount.toLocaleString()}
          </div>
        )}
        {status==="done"&&(
          <div style={{display:"flex",alignItems:"center",gap:6,fontFamily:F.mono,fontSize:10,color:C.cyan}}>
            <span style={{color:C.cyan}}>✓</span> {seq.length-1} THREADS
          </div>
        )}
        {isMobile && (
          <button
            onClick={()=>setSidebarOpen(o=>!o)}
            aria-label="toggle controls"
            style={{background:sidebarOpen?"rgba(201,168,76,.15)":"transparent",border:`1px solid ${C.gold}`,color:C.gold,borderRadius:6,padding:"6px 12px",cursor:"pointer",fontFamily:F.mono,fontSize:11,fontWeight:700}}
          >
            {sidebarOpen ? "✕ إغلاق" : "☰ التحكم"}
          </button>
        )}
      </header>

      <div style={{display:"flex",flex:1,flexDirection:isMobile?"column":"row",overflow:isMobile?"visible":"hidden"}}>

        {/* ══ SIDEBAR ══ */}
        {sidebarVisible && (
          <aside style={{width:isMobile?"100%":260,flexShrink:0,background:C.bg2,borderLeft:isMobile?"none":`1px solid ${C.border}`,borderBottom:isMobile?`1px solid ${C.border}`:"none",display:"flex",flexDirection:"column",overflow:"hidden",maxHeight:isMobile?"auto":"none"}}>

          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            {[["image","⊡ صورة"],["params","⚙ معاملات"],["export","⤓ تصدير"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setSideTab(id)} style={{flex:1,background:"none",border:"none",borderBottom:`2px solid ${sideTab===id?C.gold:"transparent"}`,color:sideTab===id?C.gold:C.muted,padding:"10px 4px",cursor:"pointer",fontSize:10,fontFamily:F.mono,fontWeight:600,marginBottom:-1,transition:"color .15s",letterSpacing:"0.3px"}}>
                {lbl}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"14px"}}>

            {sideTab==="image"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <SLabel tag="01" text="الصورة المدخلة"/>
                <div
                  onClick={()=>fileRef.current?.click()}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                  className={`gs-drop${dragging?" drag":""}`}
                  style={{border:`1.5px dashed ${image?C.gold:C.border}`,borderRadius:8,padding:"16px 10px",textAlign:"center",cursor:"pointer",background:image?"rgba(201,168,76,.04)":"transparent",transition:"all .2s",minHeight:80,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}
                >
                  {image?(
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <img src={image} alt="" style={{width:44,height:44,objectFit:"cover",borderRadius:5,border:`1px solid ${C.gold}`}}/>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:F.mono,fontSize:10,color:C.gold}}>IMAGE LOADED ✓</div>
                        <div style={{fontFamily:F.mono,fontSize:8,color:C.muted,marginTop:2}}>انقر للتغيير</div>
                      </div>
                    </div>
                  ):(
                    <>
                      <div style={{fontFamily:F.disp,fontSize:30,color:C.border,lineHeight:1}}>⊡</div>
                      <div style={{fontSize:11,color:C.muted}}>اسحب صورتك هنا أو انقر</div>
                      <div style={{fontFamily:F.mono,fontSize:9,color:C.border}}>PNG / JPG / WEBP</div>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/>

                {image&&(
                  <GBtn onClick={runAI} disabled={aiLoad} variant="gold" icon={aiLoad?<Spin size={11} color={C.bg}/>:"✦"}>
                    {aiLoad?"جاري التحليل...":"تحليل بالذكاء الاصطناعي"}
                  </GBtn>
                )}

                <div style={{height:1,background:C.border,margin:"4px 0"}}/>
                <SLabel tag="02" text="معالجة مسبقة"/>
                <SRow label="التباين" val={contrast.toFixed(1)}>
                  <input type="range" min={0.5} max={3} step={0.1} value={contrast} onChange={e=>setContrast(+e.target.value)}/>
                </SRow>
                <SRow label="السطوع" val={brightness>0?`+${brightness.toFixed(1)}`:brightness.toFixed(1)}>
                  <input type="range" min={-0.4} max={0.4} step={0.05} value={brightness} onChange={e=>setBrightness(+e.target.value)}/>
                </SRow>

                <div style={{height:1,background:C.border,margin:"4px 0"}}/>
                <SLabel tag="03" text="التنفيذ"/>
                {status==="processing"?(
                  <>
                    <div style={{height:4,borderRadius:4,background:C.border,overflow:"hidden",margin:"2px 0"}}>
                      <div style={{height:"100%",width:`${prog}%`,background:`linear-gradient(90deg,${C.gold},${C.gold2})`,transition:"width .4s",borderRadius:4}}/>
                    </div>
                    <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,textAlign:"center"}}>{liveCount.toLocaleString()} / {threadCnt.toLocaleString()} threads</div>
                    <GBtn onClick={stop} variant="outline-cyan">⏹ إيقاف</GBtn>
                  </>
                ):(
                  <GBtn onClick={generate} disabled={!imgData} variant={imgData?"primary":"disabled"} icon="◈">
                    {status==="done"?"◈ إعادة التوليد":"◈ توليد الأوتار"}
                  </GBtn>
                )}
              </div>
            )}

            {sideTab==="params"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <SLabel tag="01" text="معاملات الهندسة"/>
                <SRow label="عدد المسامير" val={nailCnt}>
                  <input type="range" min={80} max={400} step={10} value={nailCnt} onChange={e=>setNailCnt(+e.target.value)}/>
                </SRow>
                <SRow label="كثافة الخيوط" val={threadCnt.toLocaleString()}>
                  <input type="range" min={500} max={8000} step={100} value={threadCnt} onChange={e=>setThreadCnt(+e.target.value)}/>
                </SRow>
                <SRow label="فجوة دنيا" val={minGap}>
                  <input type="range" min={5} max={60} value={minGap} onChange={e=>setMinGap(+e.target.value)}/>
                </SRow>
                <SRow label="وزن الخط" val={lineWeight.toFixed(2)}>
                  <input type="range" min={0.05} max={0.4} step={0.01} value={lineWeight} onChange={e=>setLineWeight(+e.target.value)}/>
                </SRow>

                <div style={{height:1,background:C.border,margin:"4px 0"}}/>
                <SLabel tag="02" text="شكل اللوح"/>
                <div style={{display:"flex",gap:8}}>
                  {[["circle","⊙ دائري"],["square","⬛ مربع"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setShape(v)} style={{flex:1,padding:"8px 0",borderRadius:6,background:shape===v?"rgba(201,168,76,.12)":"transparent",color:shape===v?C.gold:C.muted,border:`1px solid ${shape===v?C.gold:C.border}`,cursor:"pointer",fontSize:11,fontFamily:F.ar,fontWeight:700,transition:"all .15s"}}>
                      {l}
                    </button>
                  ))}
                </div>

                <div style={{height:1,background:C.border,margin:"4px 0"}}/>
                <SLabel tag="03" text="الألوان"/>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.muted}}>لون الخيط</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:20,height:20,borderRadius:4,background:threadColor,border:`1px solid ${C.border}`}}/>
                      <input type="color" value={threadColor} onChange={e=>setThreadColor(e.target.value)} style={{width:28,height:28,borderRadius:4,border:`1px solid ${C.border}`,cursor:"pointer"}}/>
                      <span style={{fontFamily:F.mono,fontSize:9,color:C.muted}}>{threadColor}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.muted}}>لون الخلفية</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:20,height:20,borderRadius:4,background:bgColor,border:`1px solid ${C.border}`}}/>
                      <input type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)} style={{width:28,height:28,borderRadius:4,border:`1px solid ${C.border}`,cursor:"pointer"}}/>
                      <span style={{fontFamily:F.mono,fontSize:9,color:C.muted}}>{bgColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{fontFamily:F.mono,fontSize:8,color:C.muted,marginBottom:6,letterSpacing:"0.5px"}}>PRESETS</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {[["#1a1a2e","#ffffff","داكن"],["#ffffff","#0d1117","فاتح"],["#c9a84c","#0a0f1a","ذهبي"],["#5cbdb9","#0a0f1a","سماوي"],["#e05252","#ffffff","أحمر"]].map(([tc,bc,l])=>(
                      <button key={l} onClick={()=>{setThreadColor(tc);setBgColor(bc);}} style={{padding:"4px 8px",borderRadius:5,background:bc,border:`1px solid ${threadColor===tc&&bgColor===bc?C.gold:C.border}`,cursor:"pointer",fontFamily:F.mono,fontSize:8,color:tc,transition:"all .15s",fontWeight:600}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sideTab==="export"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <SLabel tag="01" text="تصدير الملفات"/>
                {seq.length>1?(
                  <>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px",display:"flex",flexDirection:"column",gap:6}}>
                      {[["THREADS",seq.length-1],["NAILS",nailCnt],["SHAPE",shape.toUpperCase()],["THREAD COLOR",threadColor],["BG COLOR",bgColor]].map(([l,v])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid rgba(48,54,61,.5)`}}>
                          <span style={{fontFamily:F.mono,fontSize:8,color:C.muted,letterSpacing:"0.3px"}}>{l}</span>
                          <span style={{fontFamily:F.disp,fontSize:13,color:C.gold,fontWeight:700}}>{typeof v==="number"?v.toLocaleString():v}</span>
                        </div>
                      ))}
                    </div>
                    <GBtn onClick={exportPNG} variant="outline-gold" icon="⤓">تصدير PNG</GBtn>
                    <GBtn onClick={exportSVG} variant="outline-cyan" icon="⤓">تصدير SVG</GBtn>
                    <GBtn onClick={exportTXT} variant="outline-gold" icon="⤓">تصدير تسلسل المسامير</GBtn>
                  </>
                ):(
                  <div style={{textAlign:"center",padding:"30px 0",color:C.muted,fontFamily:F.mono,fontSize:10}}>
                    <div style={{fontFamily:F.disp,fontSize:32,color:C.border,marginBottom:8}}>⤓</div>
                    قم بالتوليد أولاً
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{flexShrink:0,padding:"10px 14px",borderTop:`1px solid ${C.border}`,background:C.bg2}}>
            <div style={{fontFamily:F.mono,fontSize:7,color:"rgba(48,54,61,.9)",letterSpacing:"1px"}}>GEOSTRING SYSTEM © 2025</div>
            <div style={{fontFamily:F.mono,fontSize:7,color:"rgba(48,54,61,.9)",marginTop:1}}>CNC · POLAR GEOMETRY · STRING ART</div>
          </div>
        </aside>
        )}

        {/* ══ MAIN AREA ══ */}
        <main style={{flex:1,display:"flex",flexDirection:"column",background:C.bg,overflow:isMobile?"visible":"hidden",minHeight:isMobile?"60vh":undefined}}>

          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.bg2,padding:isMobile?"0 8px":"0 20px",flexShrink:0,overflowX:"auto"}}>
            {[["preview","◈ المعاينة"],["original","⊡ الأصلية"],["steps","≡ الخطوات"],["ai","✦ AI"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTab(id)} className="gs-tab" style={{background:"none",border:"none",color:tab===id?C.gold:C.muted,borderBottom:`2px solid ${tab===id?C.gold:"transparent"}`,padding:"11px 14px",cursor:"pointer",fontSize:11,fontFamily:F.ar,fontWeight:600,marginBottom:-1,transition:"color .15s",position:"relative",whiteSpace:"nowrap",flexShrink:0}}>
                {lbl}
                {id==="ai"&&<span style={{position:"absolute",top:8,left:6,width:5,height:5,borderRadius:"50%",background:"#22c55e",animation:"gs-pulse 2s infinite"}}/>}
              </button>
            ))}
          </div>

          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?12:24,overflowY:"auto",position:"relative",background:C.bg}}>

            {(tab==="preview"||tab==="original")&&!isMobile&&<>
              <div style={{position:"absolute",width:320,height:320,borderRadius:"50%",background:"rgba(92,189,185,.05)",filter:"blur(70px)",top:"10%",right:"15%",animation:"gs-orbFloat 10s ease-in-out infinite",pointerEvents:"none"}}/>
              <div style={{position:"absolute",width:320,height:320,borderRadius:"50%",background:"rgba(201,168,76,.05)",filter:"blur(70px)",bottom:"10%",left:"15%",animation:"gs-orbFloat 13s ease-in-out infinite reverse",pointerEvents:"none"}}/>
            </>}

            {tab==="preview"&&(
              <div style={{position:"relative",display:"inline-block",maxWidth:"100%"}}>
                <canvas ref={cvsRef} width={SZ} height={SZ} style={{borderRadius:shape==="circle"?"50%":12,border:`1px solid ${C.border}`,boxShadow:`0 0 80px rgba(92,189,185,.1)`,maxWidth:"100%",height:"auto",maxHeight:isMobile?"75vw":"63vh",display:"block",transition:"border-radius .3s"}}/>
                {status==="idle"&&!seq.length&&<EmptyCanvas shape={shape}/>}
                {status==="processing"&&(
                  <div style={{position:"absolute",top:12,left:12,background:"rgba(7,14,26,.95)",border:`1px solid ${C.gold}`,borderRadius:20,padding:"4px 12px",fontFamily:F.mono,fontSize:10,color:C.gold,display:"flex",alignItems:"center",gap:7,boxShadow:`0 0 15px rgba(201,168,76,.2)`}}>
                    <Spin size={9} color={C.gold}/>{prog}%
                  </div>
                )}
                <div style={{position:"absolute",bottom:12,right:12,background:"rgba(7,14,26,.85)",border:`1px solid ${C.border}`,borderRadius:5,padding:"3px 10px",fontFamily:F.mono,fontSize:9,color:C.muted}}>
                  {nailCnt} NAILS
                </div>
                {seq.length>0&&(
                  <div style={{position:"absolute",bottom:12,left:12,display:"flex",gap:4,alignItems:"center",background:"rgba(7,14,26,.85)",border:`1px solid ${C.border}`,borderRadius:5,padding:"3px 8px"}}>
                    <div style={{width:10,height:10,borderRadius:2,background:threadColor,border:`1px solid ${C.border}`}}/>
                    <div style={{width:10,height:10,borderRadius:2,background:bgColor,border:`1px solid ${C.border}`}}/>
                  </div>
                )}
              </div>
            )}

            {tab==="original"&&(
              <div style={{position:"relative",display:"inline-block",maxWidth:"100%"}}>
                <canvas ref={origRef} width={SZ} height={SZ} style={{borderRadius:12,border:`1px solid ${C.border}`,boxShadow:`0 0 40px rgba(0,0,0,.5)`,maxWidth:"100%",height:"auto",maxHeight:isMobile?"75vw":"63vh",display:"block"}}/>
                {!image&&(
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(13,17,23,.85)",borderRadius:12,fontFamily:F.mono,fontSize:11,color:C.muted,flexDirection:"column",gap:8}}>
                    <span style={{fontFamily:F.disp,fontSize:32,color:C.border}}>⊡</span>
                    لا توجد صورة مرفوعة
                  </div>
                )}
              </div>
            )}

            {tab==="steps"&&<StepsPanel seq={seq} nailCnt={nailCnt} shape={shape}/>}
            {tab==="ai"&&<AiPanel aiLoad={aiLoad} aiRes={aiRes} aiSuggestion={aiSuggestion} applySuggestion={applySuggestion} generate={generate} chat={chat} chatIn={chatIn} setChatIn={setChatIn} chatBusy={chatBusy} sendChat={sendChat} onKey={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} chatEndRef={chatEndRef} hasImg={!!image} runAI={runAI}/>}
          </div>
        </main>
      </div>

      {/* ── STATUS BAR ── */}
      {!isMobile && (
        <div style={{flexShrink:0,height:24,background:C.bg2,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 16px",gap:16}}>
          <span style={{fontFamily:F.mono,fontSize:7,color:"rgba(48,54,61,.8)",letterSpacing:"0.5px"}}>GEOSTRING STRING ART ENGINE · منظومة هندسة الأوتار</span>
          {seq.length>1&&<><span style={{fontFamily:F.mono,fontSize:7,color:C.gold}}>✓ {seq.length-1} THREADS</span><span style={{fontFamily:F.mono,fontSize:7,color:C.cyan}}>· {nailCnt} NAILS</span></>}
          <span style={{marginRight:"auto",fontFamily:F.mono,fontSize:7,color:"rgba(48,54,61,.8)"}}>POWERED BY ARTIFICIAL INTELLIGENCE · GEOSTRING © 2025</span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   ATOMS
   ══════════════════════════════════════════════ */
function GSLogo(){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <div style={{width:32,height:32,borderRadius:7,background:`linear-gradient(135deg,${C.gold},${C.gold2})`,display:"flex",alignItems:"center",justifyContent:"center",color:C.bg,fontFamily:F.disp,fontWeight:800,fontSize:18,boxShadow:`0 0 15px rgba(201,168,76,.25)`}}>G</div>
      <div>
        <div style={{fontFamily:F.disp,fontWeight:700,fontSize:14,letterSpacing:"0.12em",color:C.text,lineHeight:1}}>GEOSTRING<span style={{color:C.gold}}>.</span></div>
        <div style={{fontFamily:F.mono,fontSize:7,color:C.muted,letterSpacing:"0.04em"}}>STRING ART GENERATOR</div>
      </div>
    </div>
  );
}
function PulseDot(){return <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e",animation:"gs-pulse 2.5s infinite"}}/>;}
function Spin({size=14,color=C.gold}){return <div style={{width:size,height:size,border:"2px solid rgba(255,255,255,.1)",borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"gs-spin .7s linear infinite",flexShrink:0}}/>;}

function SLabel({tag,text}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:-2}}>
      <span style={{fontFamily:F.mono,fontSize:8,color:C.cyan,letterSpacing:"0.8px"}}>{tag}</span>
      <span style={{fontFamily:F.disp,fontSize:12,fontWeight:700,color:C.text,letterSpacing:"0.05em"}}>{text}</span>
    </div>
  );
}

function SRow({label,val,children}){
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:11,color:C.muted}}>{label}</span>
        <span style={{fontFamily:F.mono,fontSize:10,color:C.gold}}>{val}</span>
      </div>
      {children}
    </div>
  );
}

function GBtn({onClick,disabled,variant="primary",icon,children,style:ex={}}){
  const V={
    primary:       {bg:`linear-gradient(135deg,${C.gold},${C.gold2})`,color:C.bg,border:"none"},
    gold:          {bg:`linear-gradient(135deg,${C.gold},${C.gold2})`,color:C.bg,border:"none"},
    "outline-gold":{bg:"transparent",color:C.gold,border:`1px solid rgba(201,168,76,.4)`},
    "outline-cyan":{bg:"transparent",color:C.cyan,border:`1px solid rgba(92,189,185,.4)`},
    disabled:      {bg:C.card,color:C.border,border:`1px solid ${C.border}`},
  };
  const v=V[variant]||V.primary;
  return(
    <button onClick={disabled?undefined:onClick} style={{width:"100%",padding:"9px 12px",borderRadius:7,cursor:disabled?"not-allowed":"pointer",fontSize:11,fontFamily:F.ar,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .15s",opacity:disabled?.5:1,background:v.bg,color:v.color,border:v.border,...ex}}>
      {icon&&<span style={{display:"flex",alignItems:"center"}}>{icon}</span>}{children}
    </button>
  );
}

function EmptyCanvas({shape}){
  return(
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(13,17,23,.88)",borderRadius:shape==="circle"?"50%":12,pointerEvents:"none"}}>
      <div style={{fontFamily:F.disp,fontSize:72,color:C.gold,lineHeight:1,marginBottom:6,opacity:.8,animation:"gs-shimmer 3s ease-in-out infinite"}}>G</div>
      <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:"1px"}}>GEOSTRING · READY</div>
    </div>
  );
}

/* ══════ STEPS PANEL ══════ */
function StepsPanel({seq,nailCnt,shape}){
  if(!seq.length) return(
    <div style={{textAlign:"center",color:C.muted,fontFamily:F.mono,fontSize:10,flexDirection:"column",display:"flex",alignItems:"center",gap:8}}>
      <div style={{fontFamily:F.disp,fontSize:48,color:C.border}}>≡</div>
      قم بالتوليد أولاً لعرض الخطوات
    </div>
  );
  return(
    <div style={{width:"100%",maxWidth:560,display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",gap:8}}>
        {[["STEPS",(seq.length-1).toLocaleString()],["NAILS",nailCnt],["SHAPE",shape.toUpperCase()]].map(([l,v])=>(
          <div key={l} style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
            <div style={{fontFamily:F.mono,fontSize:8,color:C.muted,marginBottom:3}}>{l}</div>
            <div style={{fontFamily:F.disp,fontSize:16,color:C.gold,fontWeight:700}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,background:C.bg2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:F.disp,fontSize:12,fontWeight:700,letterSpacing:"0.08em",color:C.text}}>NAIL SEQUENCE</span>
          <span style={{fontFamily:F.mono,fontSize:9,color:C.gold}}>{seq.length-1} STEPS (SHOWING FIRST 200)</span>
        </div>
        <div style={{maxHeight:440,overflowY:"auto"}}>
          {seq.slice(1,201).map((n,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 16px",borderBottom:`1px solid rgba(48,54,61,.35)`,background:i%2===0?"transparent":"rgba(255,255,255,.01)"}}>
              <span style={{fontFamily:F.mono,fontSize:8,color:C.border,width:32,textAlign:"center"}}>{String(i+1).padStart(3,"0")}</span>
              <NailTag n={seq[i]}/><span style={{color:C.border,fontFamily:F.mono,fontSize:10}}>→</span><NailTag n={n} accent/>
              <span style={{fontFamily:F.mono,fontSize:8,color:C.border,marginRight:"auto"}}>#{i+2}</span>
            </div>
          ))}
          {seq.length>201&&(
            <div style={{padding:"10px",fontFamily:F.mono,fontSize:9,color:C.muted,textAlign:"center",borderTop:`1px solid ${C.border}`}}>
              + {(seq.length-201).toLocaleString()} خطوة إضافية — صدّر الملف النصي للعرض الكامل
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NailTag({n,accent=false}){
  return <div style={{padding:"2px 10px",borderRadius:4,border:`1px solid ${accent?C.gold:C.border}`,background:accent?"rgba(201,168,76,.1)":"transparent",fontFamily:F.mono,fontSize:10,color:accent?C.gold:C.muted,minWidth:42,textAlign:"center"}}>{n}</div>;
}

/* ══════ AI PANEL ══════ */
function AiPanel({aiLoad,aiRes,aiSuggestion,applySuggestion,generate,chat,chatIn,setChatIn,chatBusy,sendChat,onKey,chatEndRef,hasImg,runAI}){
  return(
    <div style={{width:"100%",maxWidth:660,display:"flex",flexDirection:"column",gap:12,height:"100%",maxHeight:"100%"}} className="gs-up">

      <div style={{background:C.navy2,border:`1px solid rgba(201,168,76,.25)`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{width:38,height:38,borderRadius:8,background:`linear-gradient(135deg,${C.cyan},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.disp,fontWeight:800,fontSize:18,color:C.bg,flexShrink:0,boxShadow:`0 0 15px rgba(92,189,185,.25)`}}>✦</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:F.disp,fontSize:13,fontWeight:700,letterSpacing:"0.1em",color:C.gold}}>GEOSTRING AI ASSISTANT</div>
          <div style={{fontFamily:F.mono,fontSize:8,color:C.muted,marginTop:2}}>محلل صور + مستشار فن الأوتار · Artificial Intelligence</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <PulseDot/><span style={{fontFamily:F.mono,fontSize:8,color:"#22c55e"}}>ONLINE</span>
        </div>
      </div>

      {!hasImg&&!aiRes&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:24,textAlign:"center",flexShrink:0}}>
          <div style={{fontFamily:F.disp,fontSize:36,color:C.border,marginBottom:8}}>⊡</div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>ارفع صورة من الشريط الجانبي لبدء التحليل</div>
        </div>
      )}

      {hasImg&&!aiRes&&!aiLoad&&(
        <div style={{background:C.card,border:`1px solid rgba(201,168,76,.2)`,borderRadius:10,padding:"18px",textAlign:"center",flexShrink:0}}>
          <div style={{fontFamily:F.disp,fontSize:32,color:C.gold,marginBottom:6}}>◈</div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,marginBottom:12}}>اضغط لتحليل الصورة واقتراح أفضل الإعدادات تلقائياً</div>
          <GBtn onClick={runAI} variant="gold" icon="✦" style={{width:"auto",padding:"8px 24px",display:"inline-flex",margin:"0 auto"}}>تحليل الصورة الآن</GBtn>
        </div>
      )}

      {aiLoad&&(
        <div style={{background:C.card,border:`1px solid rgba(201,168,76,.15)`,borderRadius:10,padding:24,textAlign:"center",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Spin size={28} color={C.gold}/></div>
          <div style={{fontFamily:F.disp,fontSize:13,letterSpacing:"0.1em",color:C.gold}}>ANALYZING IMAGE</div>
          <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginTop:5}}>الذكاء الاصطناعي يفحص الصورة ويحضّر التوصيات...</div>
        </div>
      )}

      {aiRes&&(
        <div style={{background:"rgba(8,22,14,.8)",border:`1px solid rgba(92,189,185,.25)`,borderRadius:10,padding:"12px 16px",flexShrink:0}} className="gs-up">
          <div style={{fontFamily:F.mono,fontSize:8,color:C.cyan,letterSpacing:"0.8px",marginBottom:8}}>◈ AI ANALYSIS RESULT</div>
          <div style={{fontSize:12,color:C.text,lineHeight:1.85,whiteSpace:"pre-wrap",fontFamily:F.ar}}>{aiRes}</div>
          {aiSuggestion && (
            <div style={{marginTop:10,padding:"6px 10px",background:"rgba(92,189,185,.06)",border:`1px solid rgba(92,189,185,.18)`,borderRadius:5,fontFamily:F.mono,fontSize:8,color:C.cyan2}}>
              ✓ تم تطبيق الإعدادات المقترحة على شريط المعاملات تلقائياً
            </div>
          )}
          {aiSuggestion && (
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
              <GBtn onClick={()=>{applySuggestion(aiSuggestion);generate&&generate();}} variant="gold" icon="◈" style={{flex:1,minWidth:160}}>
                تطبيق وتوليد بأفضل إعدادات
              </GBtn>
              <GBtn onClick={()=>applySuggestion(aiSuggestion)} variant="outline-cyan" icon="↻" style={{flex:1,minWidth:140}}>
                إعادة تطبيق الإعدادات
              </GBtn>
              <GBtn onClick={runAI} variant="outline-gold" icon="✦" style={{flex:1,minWidth:140}}>
                إعادة التحليل
              </GBtn>
            </div>
          )}
        </div>
      )}

      <div style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:180}}>
        <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`,fontFamily:F.mono,fontSize:8,color:C.muted,letterSpacing:"0.4px",flexShrink:0}}>
          CHAT · اسأل المساعد عن نظام Geostring وفن الأوتار
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
          {!chat.length&&(
            <div style={{color:C.border,fontFamily:F.mono,fontSize:9,textAlign:"center",marginTop:16,lineHeight:1.7}}>
              جرّب: "كيف أضع المسامير على اللوح؟"<br/>"ما أفضل نوع خيط للـ CNC؟"<br/>"كيف أحسّن وضوح الصورة الناتجة؟"
            </div>
          )}
          {chat.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-end":"flex-start"}} className="gs-up">
              <div style={{maxWidth:"82%",padding:"9px 13px",borderRadius:m.r==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",background:m.r==="user"?"rgba(201,168,76,.1)":"rgba(92,189,185,.07)",border:`1px solid ${m.r==="user"?"rgba(201,168,76,.28)":"rgba(92,189,185,.2)"}`,fontSize:12,color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:F.ar}}>
                {m.r==="ai"&&<div style={{fontFamily:F.mono,fontSize:7,color:C.cyan,marginBottom:4,letterSpacing:"0.8px"}}>◈ GEOSTRING AI</div>}
                {m.t}
              </div>
            </div>
          ))}
          {chatBusy&&(
            <div style={{display:"flex",justifyContent:"flex-start"}} className="gs-up">
              <div style={{padding:"10px 16px",borderRadius:"12px 12px 12px 4px",background:"rgba(92,189,185,.07)",border:`1px solid rgba(92,189,185,.2)`,display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.cyan,animation:`gs-pulse 1.2s ${i*.22}s ease-in-out infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>
        <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`,display:"flex",gap:7,flexShrink:0}}>
          <input
            value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={onKey}
            placeholder="اكتب سؤالك ثم اضغط Enter..."
            style={{flex:1,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 12px",color:C.text,fontSize:11,outline:"none",fontFamily:F.ar,direction:"rtl",transition:"border-color .15s"}}
          />
          <button onClick={sendChat} disabled={!chatIn.trim()||chatBusy} style={{padding:"8px 14px",borderRadius:7,border:`1px solid ${chatIn.trim()&&!chatBusy?C.gold:C.border}`,background:chatIn.trim()&&!chatBusy?"rgba(201,168,76,.12)":"transparent",color:chatIn.trim()&&!chatBusy?C.gold:C.border,cursor:chatIn.trim()&&!chatBusy?"pointer":"not-allowed",fontSize:14,transition:"all .15s",display:"flex",alignItems:"center"}}>
            {chatBusy?<Spin size={12} color={C.gold}/>:"↑"}
          </button>
        </div>
      </div>
    </div>
  );
}
