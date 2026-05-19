import { useState, useRef, useEffect, useCallback } from "react";

/* ══════════════════════════════════════════════
   GEOSTRING BRAND TOKENS
   ══════════════════════════════════════════════ */
const C = {
  bg:    "#0d1117", bg2:  "#070e1a",
  navy:  "#0a0f1a", navy2:"#121a2b",
  card:  "#161b22", border:"#30363d",
  gold:  "#c9a84c", gold2:"#e0b85c",
  cyan:  "#5cbdb9", cyan2:"#3a9e9a",
  text:  "#c9d1d9", muted:"#8b949e",
};
const F = {
  ar:   "'Cairo','Tajawal',sans-serif",
  disp: "'Barlow Condensed',sans-serif",
  mono: "'JetBrains Mono','Courier New',monospace",
};

/* ══════════════════════════════════════════════
   GEMINI AI
   ══════════════════════════════════════════════ */
const GEMINI_KEY = "AIzaSyC-bWI_7YA3vZTP7NxfS7Utgl0lQhYJDQA";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

async function askGemini(prompt, b64 = null) {
  const parts = [];
  if (b64) parts.push({ inlineData: { mimeType: "image/jpeg", data: b64 } });
  parts.push({ text: prompt });
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
  });
  const d = await res.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || "لم أتمكن من الحصول على رد.";
}

async function analyzeImage(b64) {
  return askGemini(`أنت خبير في نظام Geostring للرسم الهندسي بالأوتار وآلات CNC.
حلل هذه الصورة وأعطني:
1. هل هي مناسبة لفن الخيوط؟ ولماذا؟
2. الإعدادات المثالية:
   - عدد المسامير (رقم بين 80-400)
   - عدد الخيوط (رقم بين 500-8000)
   - الشكل: دائري أم مربع
3. نصائح احترافية لأفضل نتيجة على آلة CNC
أجب بالعربية بشكل مختصر وواضح، ضع الأرقام صريحة.`, b64);
}

const toB64 = (canvas) => canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

/* ══════════════════════════════════════════════
   STRING ART ALGORITHM
   ══════════════════════════════════════════════ */
const SZ = 500;

function line(x0,y0,x1,y1){
  const px=[];let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0);
  let sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy,x=x0,y=y0;
  while(true){px.push([x,y]);if(x===x1&&y===y1)break;const e=2*err;if(e>-dy){err-=dy;x+=sx;}if(e<dx){err+=dx;y+=sy;}}
  return px;
}

function nailRing(count,shape,size){
  const n=[],cx=size/2,cy=size/2,r=size/2-4;
  if(shape==="circle"){
    for(let i=0;i<count;i++){const a=(2*Math.PI*i)/count-Math.PI/2;n.push([Math.round(cx+r*Math.cos(a)),Math.round(cy+r*Math.sin(a))]);}
  } else {
    const ps=Math.floor(count/4),m=4,w=size-2*m;
    for(let i=0;i<ps;i++) n.push([m+Math.round(w*i/ps),m]);
    for(let i=0;i<ps;i++) n.push([size-m,m+Math.round(w*i/ps)]);
    for(let i=0;i<ps;i++) n.push([size-m-Math.round(w*i/ps),size-m]);
    for(let i=0;i<ps;i++) n.push([m,size-m-Math.round(w*i/ps)]);
  }
  return n;
}

function toGray(data,size){
  const g=new Float32Array(size*size);
  for(let i=0;i<size*size;i++) g[i]=1-(0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2])/255;
  return g;
}

function* run(gray,nails,maxL,gap,size,cb){
  const d=new Float32Array(gray);const seq=[0];let cur=0;
  for(let s=0;s<maxL;s++){
    let best=-Infinity,bn=-1;
    for(let n=0;n<nails.length;n++){
      if(n===cur) continue;
      const df=Math.abs(n-cur);if(df<gap||df>nails.length-gap) continue;
      const px=line(nails[cur][0],nails[cur][1],nails[n][0],nails[n][1]);
      let sc=0;for(const[x,y] of px) if(x>=0&&x<size&&y>=0&&y<size) sc+=d[y*size+x];
      sc/=px.length;if(sc>best){best=sc;bn=n;}
    }
    if(bn===-1||best<0.01) break;
    const px=line(nails[cur][0],nails[cur][1],nails[bn][0],nails[bn][1]);
    for(const[x,y] of px) if(x>=0&&x<size&&y>=0&&y<size) d[y*size+x]=Math.max(0,d[y*size+x]-0.15);
    seq.push(bn);cur=bn;
    if(s%20===0){cb(s,maxL,seq.slice());yield;}
  }
  cb(maxL,maxL,seq);
}

/* ══════════════════════════════════════════════
   CSS INJECTION
   ══════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&family=Barlow+Condensed:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0d1117;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:#30363d;border-radius:4px;}
input[type=range]{accent-color:#c9a84c;width:100%;cursor:pointer;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes orb{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-18px)}}
.gs-up{animation:fadeUp .3s ease;}
.gs-sc:hover{border-color:rgba(201,168,76,.5)!important;}
`;

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function GeoStringApp() {
  const [image,setImage]=useState(null);
  const [imgData,setImgData]=useState(null);
  const [nails,setNails]=useState(200);
  const [lines,setLines]=useState(3000);
  const [shape,setShape]=useState("circle");
  const [gap,setGap]=useState(20);
  const [status,setStatus]=useState("idle");
  const [prog,setProg]=useState(0);
  const [seq,setSeq]=useState([]);
  const [tab,setTab]=useState("preview");
  // AI
  const [aiLoad,setAiLoad]=useState(false);
  const [aiRes,setAiRes]=useState(null);
  const [chat,setChat]=useState([]);
  const [chatIn,setChatIn]=useState("");
  const [chatBusy,setChatBusy]=useState(false);
  const chatEnd=useRef(null);
  const cvs=useRef(null);const orig=useRef(null);const fRef=useRef(null);const anim=useRef(null);

  useEffect(()=>{
    const el=document.createElement("style");el.textContent=CSS;document.head.appendChild(el);
    return()=>document.head.removeChild(el);
  },[]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[chat]);

  const loadImg=useCallback((src)=>{
    const img=new window.Image();
    img.onload=()=>{
      const c=document.createElement("canvas");c.width=c.height=SZ;
      const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,SZ,SZ);
      const s=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,SZ,SZ);
      setImgData(ctx.getImageData(0,0,SZ,SZ).data);
      if(orig.current) orig.current.getContext("2d").drawImage(c,0,0,SZ,SZ);
    };img.src=src;
  },[]);

  const onFile=(e)=>{
    const f=e.target.files[0];if(!f) return;
    const r=new FileReader();
    r.onload=(ev)=>{setImage(ev.target.result);loadImg(ev.target.result);setStatus("idle");setSeq([]);setProg(0);setAiRes(null);};
    r.readAsDataURL(f);
  };

  const draw=useCallback((s,nl)=>{
    const c=cvs.current;if(!c) return;
    const ctx=c.getContext("2d");
    ctx.fillStyle="#fff";ctx.fillRect(0,0,SZ,SZ);
    ctx.strokeStyle="rgba(10,15,26,0.18)";ctx.lineWidth=0.55;ctx.beginPath();
    for(let i=1;i<s.length;i++){const[x0,y0]=nl[s[i-1]],[x1,y1]=nl[s[i]];ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);}
    ctx.stroke();
    ctx.fillStyle=C.gold;
    for(const[x,y] of nl){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}
  },[]);

  const generate=useCallback(()=>{
    if(!imgData) return;
    setStatus("processing");setSeq([]);setProg(0);
    if(anim.current) cancelAnimationFrame(anim.current);
    const gray=toGray(imgData,SZ);const nl=nailRing(nails,shape,SZ);
    const ctx=cvs.current?.getContext("2d");if(ctx){ctx.fillStyle="#fff";ctx.fillRect(0,0,SZ,SZ);}
    const gen=run(gray,nl,lines,gap,SZ,(step,total,s)=>{
      setProg(Math.round(step/total*100));setSeq([...s]);draw(s,nl);
      if(step>=total) setStatus("done");
    });
    function tick(){const r=gen.next();if(!r.done) anim.current=requestAnimationFrame(tick);else setStatus("done");}
    anim.current=requestAnimationFrame(tick);
  },[imgData,nails,shape,lines,gap,draw]);

  const stop=()=>{if(anim.current) cancelAnimationFrame(anim.current);setStatus("done");};
  const exportPNG=()=>{const a=document.createElement("a");a.download="geostring_art.png";a.href=cvs.current.toDataURL("image/png");a.click();};
  const exportTXT=()=>{
    if(!seq.length) return;
    const txt=["GEOSTRING SYSTEM — NAIL SEQUENCE","","// Generated by Geostring String Art Engine","",`NAILS: ${nails} | THREADS: ${seq.length-1} | SHAPE: ${shape}`,"",...seq.slice(1).map((n,i)=>`${String(i+1).padStart(4,"0")}: ${seq[i]} → ${n}`)].join("\n");
    const a=document.createElement("a");a.download="geostring_sequence.txt";a.href=URL.createObjectURL(new Blob([txt],{type:"text/plain"}));a.click();
  };

  const runAI=useCallback(async()=>{
    if(!orig.current) return;
    setAiLoad(true);setAiRes(null);setTab("ai");
    try{
      const b64=toB64(orig.current);const res=await analyzeImage(b64);setAiRes(res);
      const nm=res.match(/(\d{2,3})\s*مسمار/);const lm=res.match(/(\d{3,4})\s*خيط/);
      if(nm) setNails(Math.min(400,Math.max(80,+nm[1])));
      if(lm) setLines(Math.min(8000,Math.max(500,+lm[1])));
      if(res.includes("مربع")) setShape("square");else if(res.includes("دائري")) setShape("circle");
    }catch{setAiRes("خطأ في الاتصال بـ Gemini AI.");}
    setAiLoad(false);
  },[]);

  const sendChat=useCallback(async()=>{
    const msg=chatIn.trim();if(!msg||chatBusy) return;
    setChatIn("");setChatBusy(true);
    const nc=[...chat,{r:"user",t:msg}];setChat(nc);
    try{
      const ctx2=`أنت مساعد نظام Geostring للرسم الهندسي بالأوتار CNC. الإعدادات الحالية: ${nails} مسمار، ${lines} خيط، شكل ${shape==="circle"?"دائري":"مربع"}. `;
      const b64=orig.current?toB64(orig.current):null;
      const reply=await askGemini(ctx2+msg,b64);
      setChat([...nc,{r:"ai",t:reply}]);
    }catch{setChat([...nc,{r:"ai",t:"عذراً، حدث خطأ."}]);}
    setChatBusy(false);
  },[chatIn,chat,chatBusy,nails,lines,shape]);

  const nl=nailRing(nails,shape,SZ);

  return(
    <div style={{fontFamily:F.ar,background:C.bg,minHeight:"100vh",color:C.text,display:"flex",flexDirection:"column",direction:"rtl"}}>

      {/* ── HEADER ── */}
      <header style={{position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)",background:"rgba(13,17,23,0.88)",borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:60,display:"flex",alignItems:"center",gap:16}}>
        <Logo/>
        <div style={{display:"flex",alignItems:"center",gap:6,marginRight:"auto"}}>
          <Dot animate/><span style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:"0.5px"}}>STRING ART ENGINE · v2.0</span>
        </div>
        {status==="processing"&&(
          <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:F.mono,fontSize:10,color:C.gold}}>
            <Spin size={11} color={C.gold}/> GENERATING {prog}%
          </div>
        )}
      </header>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── SIDEBAR ── */}
        <aside style={{width:268,flexShrink:0,background:C.bg2,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflowY:"auto"}}>

          <Block tag="01 — IMAGE" title="الصورة المدخلة">
            <Dropzone image={image} onClick={()=>fRef.current?.click()}/>
            <input ref={fRef} type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/>
            {image&&(
              <Btn onClick={runAI} disabled={aiLoad} variant="gold" icon={aiLoad?<Spin size={11} color={C.bg}/>:"✦"}>
                {aiLoad?"جاري التحليل...":"تحليل بـ Gemini AI"}
              </Btn>
            )}
          </Block>

          <Block tag="02 — PARAMETERS" title="معاملات التوليد">
            <Slider label="عدد المسامير" val={nails} min={80} max={400} step={10} set={setNails}/>
            <Slider label="كثافة الخيط"  val={lines} min={500} max={8000} step={100} set={setLines}/>
            <Slider label="فجوة دنيا"     val={gap}   min={5} max={50} set={setGap}/>
            <div>
              <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginBottom:8,letterSpacing:"0.5px"}}>BOARD SHAPE</div>
              <div style={{display:"flex",gap:8}}>
                {[["circle","⊙ دائري"],["square","⬛ مربع"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setShape(v)} style={{flex:1,padding:"7px 0",borderRadius:6,background:shape===v?"rgba(201,168,76,0.12)":"transparent",color:shape===v?C.gold:C.muted,border:`1px solid ${shape===v?C.gold:C.border}`,cursor:"pointer",fontSize:12,fontFamily:F.ar,fontWeight:600,transition:"all .15s"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </Block>

          <Block tag="03 — EXECUTE" title="التنفيذ">
            {status==="processing"?(
              <>
                <div style={{height:3,borderRadius:3,background:C.border,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${prog}%`,background:`linear-gradient(90deg,${C.gold},${C.gold2})`,transition:"width .3s",borderRadius:3}}/>
                </div>
                <Btn onClick={stop} variant="outline-cyan">⏹ إيقاف التوليد</Btn>
              </>
            ):(
              <Btn onClick={generate} disabled={!imgData} variant={imgData?"primary":"disabled"} icon="◈">
                {status==="done"?"◈ إعادة التوليد":"◈ توليد الأوتار"}
              </Btn>
            )}
            {status==="done"&&(
              <div style={{display:"flex",gap:8}}>
                <Btn onClick={exportPNG} variant="outline-gold" style={{flex:1}}>⤓ PNG</Btn>
                <Btn onClick={exportTXT} variant="outline-gold" style={{flex:1}}>⤓ TXT</Btn>
              </div>
            )}
          </Block>

          {seq.length>1&&(
            <Block tag="04 — STATS" title="الإحصائيات">
              {[["THREADS",seq.length-1],["NAILS",nails],["SHAPE",shape==="circle"?"CIRCLE":"SQUARE"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid rgba(48,54,61,.6)`}}>
                  <span style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:"0.5px"}}>{l}</span>
                  <span style={{fontFamily:F.disp,fontSize:14,color:C.gold,fontWeight:700}}>{typeof v==="number"?v.toLocaleString():v}</span>
                </div>
              ))}
            </Block>
          )}

          <div style={{marginTop:"auto",padding:"12px 14px",borderTop:`1px solid ${C.border}`}}>
            <div style={{fontFamily:F.mono,fontSize:8,color:"rgba(48,54,61,0.8)",letterSpacing:"1px"}}>GEOSTRING SYSTEM © 2025</div>
            <div style={{fontFamily:F.mono,fontSize:8,color:"rgba(48,54,61,0.8)",marginTop:2}}>CNC · POLAR GEOMETRY · STRING ART</div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{flex:1,display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden"}}>

          {/* Tabs */}
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.bg2,padding:"0 20px"}}>
            {[["preview","◈ المعاينة"],["original","⊡ الأصلية"],["steps","≡ الخطوات"],["ai","✦ الذكاء الاصطناعي"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setTab(id)} style={{background:"none",border:"none",color:tab===id?C.gold:C.muted,borderBottom:`2px solid ${tab===id?C.gold:"transparent"}`,padding:"12px 16px",cursor:"pointer",fontSize:12,fontFamily:F.ar,fontWeight:600,marginBottom:-1,transition:"color .15s"}}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:28,overflowY:"auto",position:"relative"}}>

            {tab==="preview"&&(<>
              <Orb style={{top:"15%",right:"20%",background:"rgba(92,189,185,.07)"}}/>
              <Orb style={{bottom:"10%",left:"20%",background:"rgba(201,168,76,.07)",animationDelay:"2s"}}/>
              <div style={{position:"relative"}}>
                <canvas ref={cvs} width={SZ} height={SZ} style={{borderRadius:shape==="circle"?"50%":10,border:`1px solid ${C.border}`,boxShadow:`0 0 60px rgba(92,189,185,.12)`,maxWidth:"100%",maxHeight:"62vh",display:"block"}}/>
                {status==="idle"&&!seq.length&&(
                  <Placeholder shape={shape}/>
                )}
                {status==="processing"&&(
                  <div style={{position:"absolute",top:10,left:10,background:"rgba(13,17,23,.92)",border:`1px solid ${C.gold}`,borderRadius:20,padding:"4px 12px",fontFamily:F.mono,fontSize:10,color:C.gold,display:"flex",alignItems:"center",gap:7}}>
                    <Spin size={9} color={C.gold}/>{prog}%
                  </div>
                )}
                <div style={{position:"absolute",bottom:10,right:10,background:"rgba(13,17,23,.85)",border:`1px solid ${C.border}`,borderRadius:5,padding:"3px 10px",fontFamily:F.mono,fontSize:9,color:C.muted}}>
                  {nails} NAILS
                </div>
              </div>
            </>)}

            {tab==="original"&&(
              <div style={{position:"relative"}}>
                <canvas ref={orig} width={SZ} height={SZ} style={{borderRadius:10,border:`1px solid ${C.border}`,maxWidth:"100%",maxHeight:"62vh",display:"block"}}/>
                {!image&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(13,17,23,.8)",borderRadius:10,fontFamily:F.mono,fontSize:11,color:C.muted}}>لا توجد صورة</div>}
              </div>
            )}

            {tab==="steps"&&<StepsView seq={seq}/>}
            {tab==="ai"&&<AiView aiLoad={aiLoad} aiRes={aiRes} chat={chat} chatIn={chatIn} setChatIn={setChatIn} chatBusy={chatBusy} sendChat={sendChat} onKey={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} chatEnd={chatEnd} hasImg={!!image} runAI={runAI}/>}
          </div>
        </main>
      </div>

      {/* STATUS BAR */}
      <div style={{height:26,background:C.bg2,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:20}}>
        <span style={{fontFamily:F.mono,fontSize:8,color:"rgba(48,54,61,.7)",letterSpacing:"0.5px"}}>GEOSTRING STRING ART ENGINE · منظومة هندسة الأوتار</span>
        {seq.length>1&&<span style={{fontFamily:F.mono,fontSize:8,color:C.gold}}>{seq.length-1} THREADS</span>}
        <span style={{marginRight:"auto",fontFamily:F.mono,fontSize:8,color:"rgba(48,54,61,.7)"}}>POWERED BY GEMINI AI</span>
      </div>
    </div>
  );
}

/* ══════ ATOMS ══════ */
function Logo(){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:34,height:34,borderRadius:8,background:`linear-gradient(135deg,${C.gold},${C.gold2})`,display:"flex",alignItems:"center",justifyContent:"center",color:C.bg,fontFamily:F.disp,fontWeight:800,fontSize:19,flexShrink:0}}>G</div>
      <div>
        <div style={{fontFamily:F.disp,fontWeight:700,fontSize:15,letterSpacing:"0.12em",color:C.text}}>GEOSTRING<span style={{color:C.gold}}>.</span></div>
        <div style={{fontFamily:F.mono,fontSize:8,color:C.muted,letterSpacing:"0.04em"}}>STRING ART GENERATOR</div>
      </div>
    </div>
  );
}
function Dot({animate}){return <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e",animation:animate?"pulse 2s infinite":undefined}}/>;}
function Spin({size=14,color=C.gold}){return <div style={{width:size,height:size,border:"2px solid rgba(255,255,255,.1)",borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>;}
function Orb({style}){return <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",filter:"blur(60px)",animation:"orb 9s ease-in-out infinite",pointerEvents:"none",...style}}/>;}

function Block({tag,title,children}){
  return(
    <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontFamily:F.mono,fontSize:8,color:C.cyan,letterSpacing:"1px",marginBottom:3}}>{tag}</div>
      <div style={{fontFamily:F.disp,fontSize:13,fontWeight:700,color:C.text,marginBottom:12,letterSpacing:"0.05em"}}>{title}</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>{children}</div>
    </div>
  );
}

function Dropzone({image,onClick}){
  return(
    <div onClick={onClick} className="gs-sc" style={{border:`1px dashed ${image?C.gold:C.border}`,borderRadius:8,padding:"13px 10px",textAlign:"center",cursor:"pointer",background:image?"rgba(201,168,76,.04)":"transparent",transition:"all .2s"}}>
      {image?(
        <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
          <img src={image} alt="" style={{width:40,height:40,objectFit:"cover",borderRadius:4,border:`1px solid ${C.gold}`}}/>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.gold}}>IMAGE LOADED ✓</span>
        </div>
      ):(
        <>
          <div style={{fontFamily:F.disp,fontSize:28,color:C.border,marginBottom:4}}>⊡</div>
          <div style={{fontSize:12,color:C.muted}}>ارفع صورتك</div>
          <div style={{fontFamily:F.mono,fontSize:9,color:C.border,marginTop:3}}>PNG / JPG</div>
        </>
      )}
    </div>
  );
}

function Slider({label,val,min,max,step=1,set}){
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:11,color:C.muted}}>{label}</span>
        <span style={{fontFamily:F.mono,fontSize:11,color:C.gold}}>{val.toLocaleString()}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={e=>set(+e.target.value)}/>
    </div>
  );
}

function Btn({onClick,disabled,variant="primary",icon,children,style:ex={}}){
  const V={
    primary:     {bg:`linear-gradient(135deg,${C.gold},${C.gold2})`,color:C.bg,border:"none"},
    gold:        {bg:`linear-gradient(135deg,${C.gold},${C.gold2})`,color:C.bg,border:"none"},
    "outline-gold":{bg:"transparent",color:C.gold,border:`1px solid rgba(201,168,76,.45)`},
    "outline-cyan":{bg:"transparent",color:C.cyan,border:`1px solid rgba(92,189,185,.4)`},
    disabled:    {bg:C.card,color:C.border,border:`1px solid ${C.border}`},
  };
  const v=V[variant]||V.primary;
  return(
    <button onClick={disabled?undefined:onClick} style={{width:"100%",padding:"9px 14px",borderRadius:7,cursor:disabled?"not-allowed":"pointer",fontSize:12,fontFamily:F.ar,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all .15s",opacity:disabled?.55:1,background:v.bg,color:v.color,border:v.border,...ex}}>
      {icon&&<span>{icon}</span>}{children}
    </button>
  );
}

function Placeholder({shape}){
  return(
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(13,17,23,.85)",borderRadius:shape==="circle"?"50%":10}}>
      <div style={{fontFamily:F.disp,fontSize:60,color:C.gold,lineHeight:1,marginBottom:8}}>G</div>
      <div style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>ارفع صورة وابدأ التوليد</div>
    </div>
  );
}

function StepsView({seq}){
  if(!seq.length) return(
    <div style={{textAlign:"center",color:C.muted,fontFamily:F.mono,fontSize:11}}>
      <div style={{fontSize:44,marginBottom:12,color:C.border}}>≡</div>قم بالتوليد أولاً
    </div>
  );
  return(
    <div style={{width:"100%",maxWidth:560}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,background:C.bg2,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:F.disp,fontSize:13,fontWeight:700,letterSpacing:"0.08em",color:C.text}}>NAIL SEQUENCE</span>
          <span style={{fontFamily:F.mono,fontSize:9,color:C.gold}}>{seq.length-1} STEPS</span>
        </div>
        <div style={{maxHeight:490,overflowY:"auto"}}>
          {seq.slice(1,201).map((n,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 16px",borderBottom:`1px solid rgba(48,54,61,.4)`,background:i%2?"transparent":"rgba(255,255,255,.01)"}}>
              <span style={{fontFamily:F.mono,fontSize:9,color:C.border,width:30}}>{String(i+1).padStart(3,"0")}</span>
              <Tag num={seq[i]}/><span style={{color:C.border,fontFamily:F.mono,fontSize:11}}>→</span><Tag num={n} accent/>
            </div>
          ))}
          {seq.length>201&&<div style={{padding:"10px 16px",fontFamily:F.mono,fontSize:9,color:C.muted,textAlign:"center"}}>+ {seq.length-201} خطوة — حمّل الملف لرؤية الكل</div>}
        </div>
      </div>
    </div>
  );
}

function Tag({num,accent=false}){
  return <div style={{padding:"2px 10px",borderRadius:4,border:`1px solid ${accent?C.gold:C.border}`,background:accent?"rgba(201,168,76,.1)":"transparent",fontFamily:F.mono,fontSize:11,color:accent?C.gold:C.muted,minWidth:40,textAlign:"center"}}>{num}</div>;
}

function AiView({aiLoad,aiRes,chat,chatIn,setChatIn,chatBusy,sendChat,onKey,chatEnd,hasImg,runAI}){
  return(
    <div style={{width:"100%",maxWidth:650,display:"flex",flexDirection:"column",gap:14,height:"100%"}} className="gs-up">

      {/* Header */}
      <div style={{background:C.navy2,border:`1px solid rgba(201,168,76,.3)`,borderRadius:10,padding:"13px 18px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:40,height:40,borderRadius:8,background:`linear-gradient(135deg,${C.cyan},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.disp,fontWeight:800,fontSize:20,color:C.bg,flexShrink:0}}>✦</div>
        <div>
          <div style={{fontFamily:F.disp,fontSize:13,fontWeight:700,letterSpacing:"0.12em",color:C.gold}}>GEOSTRING AI ASSISTANT</div>
          <div style={{fontFamily:F.mono,fontSize:8,color:C.muted,marginTop:2}}>مدعوم بـ Google Gemini · محلل صور + مستشار فن الأوتار</div>
        </div>
        <div style={{marginRight:"auto",display:"flex",alignItems:"center",gap:6}}><Dot animate/><span style={{fontFamily:F.mono,fontSize:8,color:"#22c55e"}}>ONLINE</span></div>
      </div>

      {!hasImg&&!aiRes&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:24,textAlign:"center"}}>
          <div style={{fontFamily:F.disp,fontSize:36,color:C.border,marginBottom:8}}>⊡</div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>ارفع صورة لبدء التحليل الذكي</div>
        </div>
      )}
      {hasImg&&!aiRes&&!aiLoad&&(
        <div style={{background:C.card,border:`1px solid rgba(201,168,76,.2)`,borderRadius:10,padding:20,textAlign:"center"}}>
          <div style={{fontFamily:F.disp,fontSize:36,color:C.gold,marginBottom:8}}>◈</div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,marginBottom:14}}>اضغط لتحليل الصورة واقتراح الإعدادات المثلى</div>
          <Btn onClick={runAI} variant="gold" icon="✦" style={{width:"auto",padding:"9px 28px",display:"inline-flex"}}>تحليل الآن</Btn>
        </div>
      )}
      {aiLoad&&(
        <div style={{background:C.card,border:`1px solid rgba(201,168,76,.2)`,borderRadius:10,padding:28,textAlign:"center"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Spin size={32} color={C.gold}/></div>
          <div style={{fontFamily:F.disp,fontSize:14,letterSpacing:"0.1em",color:C.gold}}>ANALYZING IMAGE</div>
          <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginTop:6}}>Gemini يفحص الصورة ويحضّر التوصيات...</div>
        </div>
      )}
      {aiRes&&(
        <div style={{background:"rgba(10,28,18,.7)",border:`1px solid rgba(92,189,185,.3)`,borderRadius:10,padding:"14px 18px"}} className="gs-up">
          <div style={{fontFamily:F.mono,fontSize:8,color:C.cyan,letterSpacing:"1px",marginBottom:8}}>◈ AI ANALYSIS RESULT</div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:F.ar}}>{aiRes}</div>
          <div style={{marginTop:10,padding:"5px 10px",background:"rgba(92,189,185,.07)",border:`1px solid rgba(92,189,185,.2)`,borderRadius:5,fontFamily:F.mono,fontSize:8,color:C.cyan2}}>
            ✓ تم تطبيق الإعدادات المقترحة تلقائياً على الشريط الجانبي
          </div>
        </div>
      )}

      {/* Chat */}
      <div style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:200}}>
        <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`,fontFamily:F.mono,fontSize:8,color:C.muted,letterSpacing:"0.5px"}}>CHAT · اسأل المساعد عن نظام Geostring</div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
          {!chat.length&&<div style={{color:C.border,fontFamily:F.mono,fontSize:9,textAlign:"center",marginTop:12}}>مثال: "كيف أضع المسامير على اللوح؟" أو "ما أفضل نوع خيط للـ CNC؟"</div>}
          {chat.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-start":"flex-end"}} className="gs-up">
              <div style={{maxWidth:"80%",padding:"9px 13px",borderRadius:m.r==="user"?"10px 10px 10px 3px":"10px 10px 3px 10px",background:m.r==="user"?"rgba(201,168,76,.1)":"rgba(92,189,185,.07)",border:`1px solid ${m.r==="user"?"rgba(201,168,76,.3)":"rgba(92,189,185,.22)"}`,fontSize:12,color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:F.ar}}>
                {m.r==="ai"&&<div style={{fontFamily:F.mono,fontSize:7,color:C.cyan,marginBottom:4,letterSpacing:"1px"}}>◈ GEOSTRING AI</div>}
                {m.t}
              </div>
            </div>
          ))}
          {chatBusy&&<div style={{display:"flex",justifyContent:"flex-end"}} className="gs-up"><div style={{padding:"9px 16px",borderRadius:"10px 10px 3px 10px",background:"rgba(92,189,185,.07)",border:`1px solid rgba(92,189,185,.2)`,display:"flex",gap:5,alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.cyan,animation:`pulse 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</div></div>}
          <div ref={chatEnd}/>
        </div>
        <div style={{padding:"9px 10px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={onKey} placeholder="اكتب سؤالك..."
            style={{flex:1,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",color:C.text,fontSize:12,outline:"none",fontFamily:F.ar,direction:"rtl"}}/>
          <button onClick={sendChat} disabled={!chatIn.trim()||chatBusy} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${chatIn.trim()&&!chatBusy?C.gold:C.border}`,background:chatIn.trim()&&!chatBusy?"rgba(201,168,76,.12)":"transparent",color:chatIn.trim()&&!chatBusy?C.gold:C.border,cursor:chatIn.trim()&&!chatBusy?"pointer":"not-allowed",fontSize:14,transition:"all .15s"}}>
            {chatBusy?<Spin size={12} color={C.gold}/>:"↑"}
          </button>
        </div>
      </div>
    </div>
  );
}
