// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useCallback } from "react";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const DEFAULT_CATEGORIES = [
  { key:"ميداليات", icon:"🏅" },
  { key:"ملابس", icon:"👗" },
  { key:"حقائب", icon:"👜" },
  { key:"إكسسوارات", icon:"💎" },
  { key:"ديكور بيت", icon:"🏠" },
  { key:"منتجات شعر", icon:"💇" },
];

const PRODUCT_STATUSES = ["قيد العمل","مكتمل","مباع"];

const initialState = {
  categories: DEFAULT_CATEGORIES,
  products: [],
  materials: [],
  purchases: [],
  bazaars: [],
  sales: [],
  sessions: [],
  customerOrders: [],
  settings: { hourlyRate:3000, currency:"د.ع" },
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function loadData() {
  try { const s=localStorage.getItem("kokla_v6"); return s?{...initialState,...JSON.parse(s)}:initialState; }
  catch { return initialState; }
}
function saveData(d) { localStorage.setItem("kokla_v6",JSON.stringify(d)); }
function fmt(n) { return Number(n||0).toLocaleString("ar-IQ"); }
function fmtTime(sec) {
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function calcPrice(laborMinutes,materialCost,targetProfit,discount,hourlyRate) {
  const laborCost=(Number(laborMinutes||0)/60)*hourlyRate;
  const totalCost=laborCost+Number(materialCost||0);
  const suggested=Math.ceil((totalCost*(1+Number(targetProfit||30)/100))/250)*250;
  const discounted=Math.round(suggested*(1-Number(discount||0)/100));
  return {laborCost,totalCost,suggested,discounted};
}
function getMonth(d) {
  if(!d) return "";
  const p=d.split("/");
  if(p.length===3){
    // Arabic locale gives DD/MM/YYYY
    const yr=p[2].length===4?p[2]:p[0];
    const mo=p[2].length===4?p[1]:p[0];
    return `${yr}-${mo.padStart(2,"0")}`;
  }
  return d.substring(0,7);
}
const MONTH_AR=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
function monthLabel(ym) {
  if(!ym||!ym.includes("-")) return ym||"";
  const parts=ym.split("-");
  if(parts.length<2) return ym;
  const y=parts[0], m=parseInt(parts[1]);
  if(isNaN(m)||m<1||m>12) return ym;
  return MONTH_AR[m-1]+" "+y;
}
// eslint-disable-next-line no-unused-vars
function fileToBase64(file) { return new Promise(r=>{const rd=new FileReader();rd.onload=e=>r(e.target.result);rd.readAsDataURL(file);}); }

/* ─── App ────────────────────────────────────────────────────────────────────── */
const TABS=["dashboard","products","session","inventory","bazaars","sales","monthly","orders","settings"];

function useSwipe(onLeft,onRight){
  const startX=useRef(null);
  const startY=useRef(null);
  return {
    onTouchStart:e=>{startX.current=e.touches[0].clientX;startY.current=e.touches[0].clientY;},
    onTouchEnd:e=>{
      if(startX.current===null) return;
      const dx=e.changedTouches[0].clientX-startX.current;
      const dy=e.changedTouches[0].clientY-startY.current;
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50){
        if(dx<0) onLeft(); else onRight();
      }
      startX.current=null;
    }
  };
}

function confirmDel(msg,fn){ if(window.confirm(msg||"تأكيد الحذف؟")) fn(); }

const calcPriceFn=calcPrice;
export default function App() {
  const [data,setData]=useState(loadData);
  const [tab,setTab]=useState("dashboard");
  const [timerSec,setTimerSec]=useState(0);
  const [running,setRunning]=useState(false);
  const [paused,setPaused]=useState(false);
  const [activeSession,setActiveSession]=useState(null);
  const timerRef=useRef(null);

  useEffect(()=>{saveData(data);},[data]);
  useEffect(()=>{
    if(running&&!paused) timerRef.current=setInterval(()=>setTimerSec(s=>s+1),1000);
    else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  },[running,paused]);

  const update=useCallback(fn=>setData(prev=>fn(prev)),[]);
  const cur=data.settings.currency;
  const hr=data.settings.hourlyRate||3000;
  const catIcon=key=>(data.categories||DEFAULT_CATEGORIES).find(c=>c.key===key)?.icon||"🧶";

  // Smart alerts
  const alerts=[];
  (data.materials||[]).forEach(m=>{ if(Number(m.quantity)<=Number(m.minAlert)) alerts.push({type:"stock",msg:`مخزون "${m.name}" قارب على النفاد`,color:"#f87171"}); });
  (data.products||[]).forEach(p=>{ if(p.totalCost>0&&p.suggestedPrice>0&&p.suggestedPrice<p.totalCost*1.1) alerts.push({type:"margin",msg:`"${p.name}" هامش ربحه منخفض جداً`,color:"#fbbf24"}); });

  const stats=(()=>{
    const totalSales=data.sales.reduce((s,x)=>s+Number(x.total||0),0);
    const totalProfit=data.sales.reduce((s,x)=>s+Number(x.totalProfit||0),0);
    const totalMaterials=data.purchases.reduce((s,x)=>s+Number(x.totalCost||0),0);
    const readyTotal=(data.products||[]).reduce((s,p)=>s+Number(p.readyCount||0),0);
    // Best/worst products
    const prodSales={};
    data.sales.forEach(s=>{ if(!prodSales[s.productId]) prodSales[s.productId]={name:s.productName,qty:0,profit:0}; prodSales[s.productId].qty+=Number(s.qty||1); prodSales[s.productId].profit+=Number(s.totalProfit||0); });
    const prodArr=Object.values(prodSales);
    const bestQty=prodArr.sort((a,b)=>b.qty-a.qty)[0];
    const bestProfit=[...prodArr].sort((a,b)=>b.profit-a.profit)[0];
    const worstProfit=[...prodArr].sort((a,b)=>a.profit-b.profit)[0];
    return {totalSales,totalProfit,totalMaterials,readyTotal,bestQty,bestProfit,worstProfit};
  })();

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a0a2e 0%,#16213e 50%,#0f3460 100%)",fontFamily:"'Tajawal','Cairo',sans-serif",direction:"rtl",color:"#f0e6ff"}}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet"/>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>

      {/* Header */}
      <div style={{background:"rgba(255,255,255,0.05)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,180,220,0.2)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div onClick={()=>setTab("dashboard")} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}}>
          <span style={{fontSize:24}}>🧶</span>
          <div>
            <div style={{fontWeight:800,fontSize:20,color:"#ffb4dc",lineHeight:1}}>كوكله</div>
            <div style={{fontSize:9,color:"rgba(255,180,220,0.5)"}}>مدير أعمالك الذكي ✨</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {alerts.length>0&&<div style={{background:"rgba(248,113,113,0.2)",border:"1px solid rgba(248,113,113,0.4)",borderRadius:16,padding:"4px 10px",fontSize:11,color:"#f87171",cursor:"pointer"}} onClick={()=>setTab("alerts")}>🔔 {alerts.length}</div>}
          {running&&<div style={{background:paused?"rgba(255,180,0,0.2)":"rgba(255,100,100,0.2)",border:`1px solid ${paused?"rgba(255,180,0,0.4)":"rgba(255,100,100,0.4)"}`,borderRadius:16,padding:"4px 10px",fontSize:12,color:paused?"#fbbf24":"#ff9090",display:"flex",alignItems:"center",gap:4}}>
            <span style={{animation:paused?"none":"pulse 1s infinite"}}>{paused?"⏸":"⏱"}</span>{fmtTime(timerSec)}
          </div>}
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",overflowX:"auto",padding:"8px 10px",gap:6,background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.05)",WebkitOverflowScrolling:"touch"}}>
        {[
          {key:"dashboard",label:"الرئيسية",icon:"📊"},
          {key:"products",label:"المنتجات",icon:"🧶"},
          {key:"session",label:"جلسة",icon:"⏱"},
          {key:"inventory",label:"المخزون",icon:"📦"},
          {key:"bazaars",label:"البازارات",icon:"🛍️"},
          {key:"sales",label:"المبيعات",icon:"💰"},
          {key:"monthly",label:"إحصائيات",icon:"📅"},
          {key:"orders",label:"طلبات",icon:"📋"},
          {key:"settings",label:"الإعدادات",icon:"⚙️"},
        ].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            background:tab===t.key?"linear-gradient(135deg,#ff6eb4,#ff4d9e)":running&&t.key==="session"?"rgba(255,100,100,0.25)":"rgba(255,255,255,0.07)",
            border:"none",borderRadius:16,padding:"6px 11px",cursor:"pointer",
            color:tab===t.key?"#fff":"#e8c8f0",fontFamily:"inherit",fontSize:11,
            fontWeight:tab===t.key?700:400,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4,flexShrink:0,
          }}>
            {t.icon} {t.label}
            {t.key==="session"&&running&&<span style={{width:5,height:5,borderRadius:"50%",background:paused?"#fbbf24":"#f87171",animation:"pulse 1s infinite"}}/>}
          </button>
        ))}
      </div>

      <div style={{padding:"14px 12px",maxWidth:900,margin:"0 auto"}} {...useSwipe(
        ()=>setTab(t=>{const i=TABS.indexOf(t);return i<TABS.length-1?TABS[i+1]:t;}),
        ()=>setTab(t=>{const i=TABS.indexOf(t);return i>0?TABS[i-1]:t;})
      )}>
        {tab==="dashboard" && <Dashboard stats={stats} data={data} cur={cur} catIcon={catIcon} setTab={setTab} alerts={alerts}/>}
        {tab==="products"  && <Products data={data} update={update} cur={cur} hr={hr} catIcon={catIcon}/>}
        {tab==="session"   && <Session data={data} update={update} cur={cur} hr={hr} catIcon={catIcon} timerSec={timerSec} running={running} paused={paused} setRunning={setRunning} setPaused={setPaused} setTimerSec={setTimerSec} activeSession={activeSession} setActiveSession={setActiveSession}/>}
        {tab==="inventory" && <Inventory data={data} update={update} cur={cur}/>}
        {tab==="bazaars"   && <Bazaars data={data} update={update} cur={cur}/>}
        {tab==="sales"     && <Sales data={data} update={update} cur={cur} catIcon={catIcon}/>}
        {tab==="monthly"   && <Monthly data={data} cur={cur}/>}
        {tab==="orders"    && <CustomerOrders data={data} update={update}/>}
        {tab==="alerts"    && <Alerts alerts={alerts}/>}
        {tab==="settings"  && <Settings data={data} update={update}/>}
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,100,180,0.4);border-radius:3px}
        input,select,textarea{outline:none;font-size:16px!important;}
        button:active{transform:scale(0.96)}
        select option{background:#1a1035;color:#f0e6ff}
        @media(max-width:600px){
          input,select,textarea{font-size:16px!important;}
        }
      `}</style>
    </div>
  );
}

/* ─── Alerts Page ────────────────────────────────────────────────────────────── */
function Alerts({alerts}) {
  return (
    <div>
      <h2 style={{color:"#ffb4dc",fontWeight:800,marginBottom:14}}>التنبيهات الذكية 🔔</h2>
      {!alerts.length&&<div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:48}}>✅</div><div style={{marginTop:10}}>كل شي تمام! ما في تنبيهات</div></div>}
      {alerts.map((a,i)=>(
        <div key={i} style={{...Cs,marginBottom:9,border:`1px solid ${a.color}40`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:22}}>{a.type==="stock"?"📦":"⚠️"}</div>
          <div style={{color:a.color,fontWeight:600,fontSize:13}}>{a.msg}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────────── */
function Dashboard({stats,data,cur,catIcon,setTab,alerts}) {
  const cards=[
    {label:"إجمالي المبيعات",value:`${fmt(stats.totalSales)} ${cur}`,icon:"💰",color:"#4ade80",tab:"sales"},
    {label:"إجمالي الأرباح",value:`${fmt(stats.totalProfit)} ${cur}`,icon:"📈",color:"#60a5fa",tab:"monthly"},
    {label:"تكلفة المواد",value:`${fmt(stats.totalMaterials)} ${cur}`,icon:"🧵",color:"#f472b6",tab:"inventory"},
    {label:"قطع جاهزة",value:stats.readyTotal,icon:"📦",color:"#fb923c",tab:"products"},
  ];
  const recent=[...data.sales].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  return (
    <div>
      <h2 style={{color:"#ffb4dc",marginBottom:12,fontWeight:800}}>لوحة التحكم 📊</h2>

      {alerts.length>0&&(
        <div onClick={()=>setTab("alerts")} style={{...Cs,marginBottom:12,border:"1px solid rgba(248,113,113,0.35)",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🔔</span>
          <span style={{fontSize:13,color:"#f87171",fontWeight:600}}>{alerts.length} تنبيه يحتاج انتباهك</span>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginRight:"auto"}}>←</span>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {cards.map(c=>(
          <div key={c.label} onClick={()=>setTab(c.tab)} style={{background:"rgba(255,255,255,0.07)",borderRadius:13,border:`1px solid ${c.color}35`,padding:12,cursor:"pointer"}}>
            <div style={{fontSize:18,marginBottom:4}}>{c.icon}</div>
            <div style={{fontSize:15,fontWeight:800,color:c.color}}>{c.value}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Best/Worst */}
      {stats.bestQty&&(
        <div style={{...Cs,marginBottom:12}}>
          <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:10,fontSize:13}}>🏆 إحصائيات المنتجات</div>
          {stats.bestQty&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",fontSize:12}}><span style={{color:"rgba(255,255,255,0.5)"}}>🥇 أكثر مبيعاً</span><span style={{color:"#4ade80",fontWeight:600}}>{stats.bestQty.name} ({stats.bestQty.qty} قطعة)</span></div>}
          {stats.bestProfit&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",fontSize:12}}><span style={{color:"rgba(255,255,255,0.5)"}}>💰 أربح منتج</span><span style={{color:"#60a5fa",fontWeight:600}}>{stats.bestProfit.name}</span></div>}
          {stats.worstProfit&&stats.worstProfit!==stats.bestProfit&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12}}><span style={{color:"rgba(255,255,255,0.5)"}}>⚠️ أقل ربحاً</span><span style={{color:"#f87171",fontWeight:600}}>{stats.worstProfit.name}</span></div>}
        </div>
      )}

      {recent.length>0&&(
        <div style={Cs}>
          <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:9,fontSize:13}}>🕐 آخر المبيعات</div>
          {recent.map(s=>(
            <div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",fontSize:12}}>
              <div><span style={{fontWeight:600}}>{s.productName}</span>{s.qty>1&&<span style={{color:"#fbbf24",fontSize:11,marginRight:4}}>×{s.qty}</span>}<span style={{color:"rgba(255,255,255,0.4)",fontSize:10,marginRight:6}}>{s.date}</span></div>
              <span style={{color:"#4ade80",fontWeight:700}}>{fmt(s.total)} {cur}</span>
            </div>
          ))}
        </div>
      )}
      {!data.sales.length&&!(data.products||[]).length&&(
        <div style={{textAlign:"center",padding:40,color:"rgba(255,255,255,0.3)"}}>
          <div style={{fontSize:55}}>🧶</div>
          <div style={{fontSize:15,marginTop:10}}>أهلاً بكِ بكوكله!</div>
          <div style={{fontSize:12,marginTop:6}}>ابدئي بإضافة منتجاتك 🌸</div>
        </div>
      )}
    </div>
  );
}

/* ─── Products ───────────────────────────────────────────────────────────────── */
function Products({data,update,cur,hr,catIcon}) {
  const [view,setView]=useState("list");
  const [editId,setEditId]=useState(null);
  const [search,setSearch]=useState("");
  const [filterStatus,setFilterStatus]=useState("الكل");
  const imgRef=useRef();
  const ef=()=>({name:"",categoryKey:(data.categories||DEFAULT_CATEGORIES)[0]?.key||"ميداليات",targetProfit:30,discount:0,laborMinutes:0,materialUsage:[],notes:"",image:"",status:"قيد العمل"});
  const [form,setForm]=useState(ef);

  const matCost=form.materialUsage.reduce((s,r)=>{
    const m=data.materials.find(x=>x.id===r.materialId);
    if(!m) return s;
    const uc=m.priceUnit==="100g"?Number(m.costPer100||0)/100:Number(m.costPerUnit||0);
    return s+Number(r.qty||0)*uc;
  },0);
  const {laborCost,totalCost,suggested,discounted}=calcPrice(form.laborMinutes,matCost,form.targetProfit,form.discount,hr);

  const addMat=()=>setForm(f=>({...f,materialUsage:[...f.materialUsage,{materialId:"",qty:0}]}));
  const remMat=i=>setForm(f=>({...f,materialUsage:f.materialUsage.filter((_,idx)=>idx!==i)}));
  const updMat=(i,field,val)=>setForm(f=>({...f,materialUsage:f.materialUsage.map((r,idx)=>idx===i?{...r,[field]:val}:r)}));

  const handleImg=async e=>{
    const file=e.target.files[0];
    if(!file) return;
    // resize before storing
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      const canvas=document.createElement("canvas");
      const max=400;
      let w=img.width,h=img.height;
      if(w>max){h=Math.round(h*max/w);w=max;}
      if(h>max){w=Math.round(w*max/h);h=max;}
      canvas.width=w;canvas.height=h;
      canvas.getContext("2d").drawImage(img,0,0,w,h);
      setForm(f=>({...f,image:canvas.toDataURL("image/jpeg",0.7)}));
      URL.revokeObjectURL(url);
    };
    img.src=url;
  };

  const save=()=>{
    if(!form.name.trim()) return;
    const prod={...form,id:editId||Date.now().toString(),name:form.name.trim(),materialCost:matCost,laborCost,totalCost,suggestedPrice:suggested,discountedPrice:discounted,
      readyCount:editId?(data.products.find(p=>p.id===editId)?.readyCount||0):0,
      soldCount:editId?(data.products.find(p=>p.id===editId)?.soldCount||0):0};
    update(prev=>({...prev,products:editId?prev.products.map(p=>p.id===editId?prod:p):[...(prev.products||[]),prod]}));
    setForm(ef());setEditId(null);setView("list");
  };

  const addReady=(id,count)=>update(prev=>{
    const prod=prev.products.find(p=>p.id===id);
    const qty=Number(count)||1;
    let materials=[...prev.materials];
    if(prod?.materialUsage){
      prod.materialUsage.forEach(usage=>{
        const matIdx=materials.findIndex(m=>m.id===usage.materialId);
        if(matIdx<0) return;
        const deductAmt=Number(usage.qty||0)*qty;
        materials=materials.map((m,i)=>i===matIdx?{...m,quantity:Math.max(0,Number(m.quantity)-deductAmt)}:m);
      });
    }
    return {...prev,materials,products:prev.products.map(p=>p.id===id?{...p,readyCount:(Number(p.readyCount)||0)+qty,status:"مكتمل"}:p)};
  });
  const del=id=>confirmDel("تأكيد حذف هذا المنتج؟",()=>update(prev=>({...prev,products:prev.products.filter(p=>p.id!==id)})));
  const changeStatus=(id,status)=>update(prev=>({...prev,products:prev.products.map(p=>p.id===id?{...p,status}:p)}));

  const filtered=(data.products||[]).filter(p=>{
    const matchSearch=!search||p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus=filterStatus==="الكل"||(p.status||"قيد العمل")===filterStatus;
    return matchSearch&&matchStatus;
  });

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{color:"#ffb4dc",fontWeight:800}}>المنتجات 🧶</h2>
        <button onClick={()=>{setView(view==="add"?"list":"add");setForm(ef());setEditId(null);}} style={Bs("#ff6eb4")}>{view==="add"?"← القائمة":"+ جديد"}</button>
      </div>

      {view==="add"&&(
        <div style={Cs}>
          <h3 style={{color:"#ffb4dc",marginBottom:12}}>{editId?"تعديل":"منتج جديد"}</h3>
          {/* Image */}
          <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
            <div onClick={()=>imgRef.current.click()} style={{width:70,height:70,borderRadius:11,border:"2px dashed rgba(255,180,220,0.35)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",background:"rgba(255,255,255,0.04)",flexShrink:0}}>
              {form.image?<img src={form.image} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<div style={{textAlign:"center",color:"rgba(255,180,220,0.5)",fontSize:10}}><div style={{fontSize:22}}>📷</div>صورة</div>}
            </div>
            <div>
              <div style={{fontSize:12,color:"#ffb4dc",marginBottom:3}}>صورة المنتج (اختياري)</div>
              {form.image&&<button onClick={()=>setForm(f=>({...f,image:""}))} style={{fontSize:11,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:0}}>✕ حذف</button>}
            </div>
            <input ref={imgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImg}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{gridColumn:"span 2"}}><Lb>اسم المنتج</Lb><In value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="مثال: ميدالية قلب"/></div>
            <div><Lb>النوع</Lb><Sl value={form.categoryKey} onChange={e=>setForm(f=>({...f,categoryKey:e.target.value}))}>{(data.categories||DEFAULT_CATEGORIES).map(c=><option key={c.key} value={c.key}>{c.icon} {c.key}</option>)}</Sl></div>
            <div><Lb>الحالة</Lb><Sl value={form.status||"قيد العمل"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{PRODUCT_STATUSES.map(s=><option key={s}>{s}</option>)}</Sl></div>
            <div style={{gridColumn:"span 2"}}><Lb>وقت الصنع (دقيقة/قطعة)</Lb><In type="number" value={form.laborMinutes} onChange={e=>setForm(f=>({...f,laborMinutes:e.target.value}))}/></div>
          </div>

          {/* Materials */}
          <div style={{marginTop:11,padding:10,background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{color:"#ffb4dc",fontWeight:700,fontSize:12}}>🧵 المواد/قطعة</div>
              <button onClick={addMat} style={{...Bs("#60a5fa"),fontSize:11,padding:"3px 8px"}}>+ مادة</button>
            </div>
            {!form.materialUsage.length&&<div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>لا توجد مواد مضافة</div>}
            {form.materialUsage.map((r,i)=>{
              const m=data.materials.find(x=>x.id===r.materialId);
              const ul=m?(m.priceUnit==="100g"?"100غم":m.unit):"وحدة";
              const up=m?(m.priceUnit==="100g"?Number(m.costPer100||0):Number(m.costPerUnit||0)):0;
              return (
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 70px auto",gap:5,marginBottom:5,alignItems:"center"}}>
                  <Sl value={r.materialId} onChange={e=>updMat(i,"materialId",e.target.value)}>
                    <option value="">اختاري...</option>
                    {data.materials.map(m=><option key={m.id} value={m.id}>{m.name} ({fmt(up)}/{ul})</option>)}
                  </Sl>
                  <In type="number" value={r.qty} onChange={e=>updMat(i,"qty",e.target.value)} placeholder={m?m.unit:"ك"}/>
                  <button onClick={()=>remMat(i)} style={{...Bs("#f87171"),padding:"5px 8px",fontSize:11}}>✕</button>
                </div>
              );
            })}
            {form.materialUsage.length>0&&<div style={{fontSize:11,color:"#fbbf24",fontWeight:600,marginTop:6}}>تكلفة: {fmt(Math.round(matCost))} {cur}/قطعة</div>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:9}}>
            <div><Lb>هامش الربح (%)</Lb><In type="number" value={form.targetProfit} onChange={e=>setForm(f=>({...f,targetProfit:e.target.value}))}/></div>
            <div><Lb>تخفيض (%)</Lb><In type="number" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value}))}/></div>
          </div>
          <div style={{marginTop:7}}><Lb>ملاحظات</Lb><In value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="أي تفاصيل..."/></div>

          <div style={{marginTop:11,background:"rgba(74,222,128,0.08)",borderRadius:10,padding:10,border:"1px solid rgba(74,222,128,0.18)"}}>
            <div style={{color:"#4ade80",fontWeight:700,marginBottom:6,fontSize:12}}>🧮 ملخص السعر/قطعة</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              <Rw l="تكلفة العمل" v={`${fmt(Math.round(laborCost))} ${cur}`}/>
              <Rw l="تكلفة المواد" v={`${fmt(Math.round(matCost))} ${cur}`}/>
              <Rw l="التكلفة الكلية" v={`${fmt(Math.round(totalCost))} ${cur}`} b/>
              <Rw l="السعر المقترح" v={`${fmt(suggested)} ${cur}`} c="#fbbf24" b/>
              {form.discount>0&&<Rw l={`بعد تخفيض ${form.discount}%`} v={`${fmt(discounted)} ${cur}`} c="#60a5fa" b/>}
            </div>
          </div>
          <button onClick={save} style={{...Bs("#ff6eb4"),width:"100%",marginTop:11,padding:11,fontSize:14,justifyContent:"center"}}>💾 حفظ المنتج</button>
        </div>
      )}

      {view==="list"&&(
        <div>
          {/* Search + Filter */}
          <div style={{marginBottom:11}}>
            <In value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 بحث عن منتج..." style={{marginBottom:7}}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["الكل",...PRODUCT_STATUSES].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)} style={{...Bs(filterStatus===s?"#ff6eb4":"rgba(255,255,255,0.08)"),fontSize:11,padding:"4px 10px",border:filterStatus===s?"none":"1px solid rgba(255,255,255,0.15)"}}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {!filtered.length&&<div style={{textAlign:"center",padding:30,color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:40}}>🧶</div><div style={{marginTop:8,fontSize:13}}>{search?"ما في نتائج للبحث":"ما في منتجات بعد!"}</div></div>}
          {filtered.map(p=>(
            <ProductCard key={p.id} p={p} cur={cur} catIcon={catIcon}
              onEdit={()=>{setForm({...p,materialUsage:p.materialUsage||[]});setEditId(p.id);setView("add");}}
              onDel={()=>del(p.id)} onAddReady={addReady} onChangeStatus={changeStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({p,cur,catIcon,onEdit,onDel,onAddReady,onChangeStatus}) {
  const [addCount,setAddCount]=useState(1);
  const [showAdd,setShowAdd]=useState(false);
  const [showImg,setShowImg]=useState(false);
  const status=p.status||"قيد العمل";
  const statusColor=status==="مكتمل"?"#4ade80":status==="مباع"?"#60a5fa":"#fb923c";
  return (
    <div style={{...Cs,marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
        {p.image&&<div onClick={()=>setShowImg(!showImg)} style={{width:48,height:48,borderRadius:9,overflow:"hidden",flexShrink:0,cursor:"pointer",border:"1px solid rgba(255,180,220,0.25)"}}><img src={p.image} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/></div>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
            {!p.image&&<span style={{fontSize:16}}>{catIcon(p.categoryKey)}</span>}
            <span style={{fontWeight:800,fontSize:14}}>{p.name}</span>
            <span style={{background:`${statusColor}20`,color:statusColor,borderRadius:7,padding:"1px 7px",fontSize:10,fontWeight:600}}>{status}</span>
            {Number(p.readyCount)>0&&<span style={{background:"rgba(74,222,128,0.15)",color:"#4ade80",borderRadius:7,padding:"1px 7px",fontSize:10,fontWeight:700}}>✅ {p.readyCount}</span>}
            {Number(p.soldCount)>0&&<span style={{background:"rgba(96,165,250,0.15)",color:"#60a5fa",borderRadius:7,padding:"1px 7px",fontSize:10}}>💰 {p.soldCount}</span>}
          </div>
          <div style={{display:"flex",gap:8,fontSize:10,color:"rgba(255,255,255,0.45)",flexWrap:"wrap"}}>
            <span>⏱{p.laborMinutes||0}د</span>
            <span style={{color:"#fbbf24",fontWeight:600}}>🏷{fmt(p.suggestedPrice)} {cur}</span>
            {p.discount>0&&<span style={{color:"#60a5fa"}}>-{p.discount}%={fmt(p.discountedPrice)}</span>}
            <span>تكلفة:{fmt(Math.round(p.totalCost||0))}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={()=>setShowAdd(!showAdd)} style={{...Bs("#4ade80"),fontSize:10,padding:"3px 6px"}}>+</button>
          <button onClick={onEdit} style={{...Bs("rgba(255,255,255,0.12)"),fontSize:10,padding:"3px 6px"}}>✏️</button>
          <button onClick={onDel} style={{...Bs("#f87171"),fontSize:10,padding:"3px 6px"}}>🗑</button>
        </div>
      </div>

      {showImg&&p.image&&<div onClick={()=>setShowImg(false)} style={{marginTop:8,borderRadius:9,overflow:"hidden",cursor:"pointer"}}><img src={p.image} style={{width:"100%",maxHeight:180,objectFit:"cover"}} alt=""/></div>}

      {showAdd&&(
        <div style={{marginTop:8,padding:"8px 10px",background:"rgba(74,222,128,0.08)",borderRadius:8,border:"1px solid rgba(74,222,128,0.2)"}}>
          <div style={{fontSize:11,color:"#4ade80",marginBottom:6,fontWeight:600}}>إضافة للمخزون الجاهز</div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <input type="number" min="1" value={addCount} onChange={e=>setAddCount(e.target.value)} style={{...Ns,width:60,fontSize:14,padding:"5px 8px"}}/>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>قطعة</span>
            <button onClick={()=>{onAddReady(p.id,addCount);setShowAdd(false);setAddCount(1);}} style={{...Bs("#4ade80"),fontSize:11,padding:"5px 10px"}}>✓ إضافة</button>
          </div>
          <div style={{marginTop:7,fontSize:11,color:"rgba(255,255,255,0.4)"}}>تغيير الحالة:</div>
          <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
            {PRODUCT_STATUSES.map(s=><button key={s} onClick={()=>onChangeStatus(p.id,s)} style={{...Bs((p.status||"قيد العمل")===s?"#ff6eb4":"rgba(255,255,255,0.1)"),fontSize:10,padding:"3px 8px"}}>{s}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Session ────────────────────────────────────────────────────────────────── */
function Session({data,update,cur,hr,catIcon,timerSec,running,paused,setRunning,setPaused,setTimerSec,activeSession,setActiveSession}) {
  const [mode,setMode]=useState("session"); // "session" | "newProduct"
  const [step,setStep]=useState(1);
  const [selProds,setSelProds]=useState([]);
  const [extraNote,setExtraNote]=useState("");
  const [addToReady,setAddToReady]=useState([]);
  // New product from session
  const [npForm,setNpForm]=useState(null);
  const npImgRef=useRef();

  const toggle=pid=>setSelProds(prev=>prev.find(x=>x.id===pid)?prev.filter(x=>x.id!==pid):[...prev,{id:pid,qty:1}]);
  const setQty=(pid,qty)=>setSelProds(prev=>prev.map(x=>x.id===pid?{...x,qty:Number(qty)||1}:x));
  const totalPcs=selProds.reduce((s,x)=>s+Number(x.qty||1),0);
  const costPerPc=totalPcs>0?Math.round((timerSec/3600)*hr/totalPcs):0;

  const start=()=>{
    if(!selProds.length) return;
    setActiveSession({prods:selProds});
    setRunning(true);setPaused(false);setStep(2);
  };
  const togglePause=()=>setPaused(p=>!p);
  const finish=()=>{setRunning(false);setPaused(false);setStep(3);};
  const cancel=()=>{setRunning(false);setPaused(false);setTimerSec(0);setActiveSession(null);setStep(1);setSelProds([]);};

  const saveSession=()=>{
    const totalMins=Math.round(timerSec/60);
    const minsPerPc=totalPcs>0?Math.round(totalMins/totalPcs):0;
    update(prev=>{
      // Deduct materials from inventory for products marked ready
      let materials=[...prev.materials];
      selProds.forEach(sel=>{
        if(!addToReady.includes(sel.id)) return;
        const prod=prev.products.find(p=>p.id===sel.id);
        if(!prod||!prod.materialUsage) return;
        const qty=Number(sel.qty||1);
        prod.materialUsage.forEach(usage=>{
          const matIdx=materials.findIndex(m=>m.id===usage.materialId);
          if(matIdx<0) return;
          const deductAmt=Number(usage.qty||0)*qty;
          materials=materials.map((m,i)=>i===matIdx?{...m,quantity:Math.max(0,Number(m.quantity)-deductAmt)}:m);
        });
      });
products: prev.products.map(p => {
  const sel = activeSession.prods.find(x => x.id === p.id);
  if (!sel) return p;

  const addQty = addToReady.includes(p.id) ? Number(sel.qty || 1) : 0;

  // تحديث وقت العمل
  const updatedLabor = minsPerPc > 0 ? minsPerPc : p.laborMinutes;

  const newMatCost = Number(p.materialCost || 0);

  const newCalc = calcPriceFn(
    updatedLabor,
    newMatCost,
    p.targetProfit || 30,
    p.discount || 0,
    prev.settings.hourlyRate || 3000
  );

  return {
    ...p,
    readyCount: (Number(p.readyCount) || 0) + addQty,
    status: addQty > 0 ? "مكتمل" : p.status,
    laborMinutes: updatedLabor,

    ...newCalc,
    suggestedPrice: newCalc.suggested,
    discountedPrice: newCalc.discounted,
    totalCost: newCalc.totalCost,
    laborCost: newCalc.laborCost
  };
}),
    setTimerSec(0);setActiveSession(null);setSelProds([]);setExtraNote("");setAddToReady([]);setStep(1);


  // New product timer
  const [npRunning,setNpRunning]=useState(false);
  const [npPaused,setNpPaused]=useState(false);
  const [npSec,setNpSec]=useState(0);
  const npRef=useRef();
  useEffect(()=>{
    if(npRunning&&!npPaused) npRef.current=setInterval(()=>setNpSec(s=>s+1),1000);
    else clearInterval(npRef.current);
    return ()=>clearInterval(npRef.current);
  },[npRunning,npPaused]);

  const startNpTimer=()=>{setNpRunning(true);setNpPaused(false);};
  const pauseNpTimer=()=>setNpPaused(p=>!p);
  const finishNpTimer=()=>{
    setNpRunning(false);
    const mins=Math.round(npSec/60);
    setNpForm(f=>({...f,laborMinutes:mins}));
  };
  const resetNpTimer=()=>{setNpRunning(false);setNpPaused(false);setNpSec(0);};

  const initNpForm=()=>({name:"",categoryKey:(data.categories||DEFAULT_CATEGORIES)[0]?.key||"ميداليات",targetProfit:30,discount:0,laborMinutes:0,materialUsage:[],notes:"",image:"",status:"قيد العمل"});

  const npMatCost=(npForm?.materialUsage||[]).reduce((s,r)=>{
    const m=data.materials.find(x=>x.id===r.materialId);
    if(!m) return s;
    const uc=m.priceUnit==="100g"?Number(m.costPer100||0)/100:Number(m.costPerUnit||0);
    return s+Number(r.qty||0)*uc;
  },0);
  const npCalc=npForm?calcPrice(npForm.laborMinutes,npMatCost,npForm.targetProfit,npForm.discount,hr):{};

  const saveNewProduct=()=>{
    if(!npForm?.name?.trim()) return;
    const prod={...npForm,id:Date.now().toString(),name:npForm.name.trim(),materialCost:npMatCost,...npCalc,suggestedPrice:npCalc.suggested,discountedPrice:npCalc.discounted,readyCount:0,soldCount:0};
    update(prev=>({...prev,products:[...(prev.products||[]),prod]}));
    setNpForm(null);setNpSec(0);setNpRunning(false);setNpPaused(false);setMode("session");
  };

  const handleNpImg=async e=>{
    const file=e.target.files[0];if(!file) return;
    const img=new Image();const url=URL.createObjectURL(file);
    img.onload=()=>{const canvas=document.createElement("canvas");const max=400;let w=img.width,h=img.height;if(w>max){h=Math.round(h*max/w);w=max;}if(h>max){w=Math.round(w*max/h);h=max;}canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);setNpForm(f=>({...f,image:canvas.toDataURL("image/jpeg",0.7)}));URL.revokeObjectURL(url);};
    img.src=url;
  };

  return (
    <div>
      <h2 style={{color:"#ffb4dc",fontWeight:800,marginBottom:12}}>جلسة العمل 🪡</h2>

      {/* Mode toggle */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
        <button onClick={()=>setMode("session")} style={{...Bs(mode==="session"?"#ff6eb4":"rgba(255,255,255,0.08)"),justifyContent:"center",padding:"10px",fontSize:13,border:mode==="session"?"none":"1px solid rgba(255,255,255,0.15)"}}>⏱ جلسة عمل</button>
        <button onClick={()=>{setMode("newProduct");if(!npForm)setNpForm(initNpForm());}} style={{...Bs(mode==="newProduct"?"#60a5fa":"rgba(255,255,255,0.08)"),justifyContent:"center",padding:"10px",fontSize:13,border:mode==="newProduct"?"none":"1px solid rgba(255,255,255,0.15)"}}>🆕 منتج جديد بمؤقت</button>
      </div>

      {/* ── New Product with timer ── */}
      {mode==="newProduct"&&npForm&&(
        <div>
          {/* Timer */}
          <div style={{...Cs,marginBottom:12,textAlign:"center",border:"1px solid rgba(96,165,250,0.3)"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:5}}>⏱ مؤقت وقت الصنع</div>
            <div style={{fontSize:46,fontWeight:800,color:npRunning?(npPaused?"#fbbf24":"#60a5fa"):"rgba(255,255,255,0.6)",fontVariantNumeric:"tabular-nums",marginBottom:10}}>{fmtTime(npSec)}</div>
            {!npRunning&&npSec===0&&<button onClick={startNpTimer} style={{...Bs("#60a5fa"),padding:"9px 20px",fontSize:13,justifyContent:"center"}}>▶ ابدئي التوقيت</button>}
            {npRunning&&(
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                <button onClick={pauseNpTimer} style={{...Bs(npPaused?"#4ade80":"#fbbf24"),padding:"8px 16px",fontSize:12}}>{npPaused?"▶ استئناف":"⏸ إيقاف"}</button>
                <button onClick={finishNpTimer} style={{...Bs("#4ade80"),padding:"8px 16px",fontSize:12}}>✓ انتهيت</button>
                <button onClick={resetNpTimer} style={{...Bs("#f87171"),padding:"8px 16px",fontSize:12}}>↺</button>
              </div>
            )}
            {!npRunning&&npSec>0&&(
              <div>
                <div style={{color:"#4ade80",fontSize:13,fontWeight:700,marginBottom:8}}>✅ {Math.round(npSec/60)} دقيقة مسجلة</div>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  <button onClick={startNpTimer} style={{...Bs("#60a5fa"),padding:"7px 14px",fontSize:12}}>▶ متابعة</button>
                  <button onClick={resetNpTimer} style={{...Bs("rgba(255,255,255,0.12)"),padding:"7px 14px",fontSize:12}}>↺ إعادة</button>
                </div>
              </div>
            )}
          </div>

          {/* Product form */}
          <div style={Cs}>
            <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:10,fontSize:13}}>تفاصيل المنتج الجديد</div>
            <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:9}}>
              <div onClick={()=>npImgRef.current.click()} style={{width:55,height:55,borderRadius:9,border:"2px dashed rgba(255,180,220,0.35)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",background:"rgba(255,255,255,0.04)",flexShrink:0}}>
                {npForm.image?<img src={npForm.image} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<div style={{textAlign:"center",color:"rgba(255,180,220,0.5)",fontSize:10}}><div style={{fontSize:18}}>📷</div></div>}
              </div>
              <input ref={npImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleNpImg}/>
              <div style={{flex:1}}><Lb>اسم المنتج</Lb><In value={npForm.name} onChange={e=>setNpForm(f=>({...f,name:e.target.value}))} placeholder="اسم المنتج"/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div><Lb>النوع</Lb><Sl value={npForm.categoryKey} onChange={e=>setNpForm(f=>({...f,categoryKey:e.target.value}))}>{(data.categories||DEFAULT_CATEGORIES).map(c=><option key={c.key} value={c.key}>{c.icon} {c.key}</option>)}</Sl></div>
              <div><Lb>وقت الصنع (دقيقة)</Lb><In type="number" value={npForm.laborMinutes} onChange={e=>setNpForm(f=>({...f,laborMinutes:e.target.value}))} placeholder={Math.round(npSec/60)||0}/></div>
            </div>

            {/* Materials */}
            <div style={{padding:9,background:"rgba(255,255,255,0.04)",borderRadius:9,border:"1px solid rgba(255,255,255,0.07)",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                <div style={{color:"#ffb4dc",fontSize:11,fontWeight:700}}>🧵 المواد</div>
                <button onClick={()=>setNpForm(f=>({...f,materialUsage:[...f.materialUsage,{materialId:"",qty:0}]}))} style={{...Bs("#60a5fa"),fontSize:10,padding:"2px 7px"}}>+</button>
              </div>
              {npForm.materialUsage.map((r,i)=>{
                const m=data.materials.find(x=>x.id===r.materialId);
                return (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 60px auto",gap:5,marginBottom:5,alignItems:"center"}}>
                    <Sl value={r.materialId} onChange={e=>setNpForm(f=>({...f,materialUsage:f.materialUsage.map((rr,idx)=>idx===i?{...rr,materialId:e.target.value}:rr)}))}>
                      <option value="">اختاري...</option>{data.materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </Sl>
                    <In type="number" value={r.qty} onChange={e=>setNpForm(f=>({...f,materialUsage:f.materialUsage.map((rr,idx)=>idx===i?{...rr,qty:e.target.value}:rr)}))} placeholder={m?.unit||"ك"}/>
                    <button onClick={()=>setNpForm(f=>({...f,materialUsage:f.materialUsage.filter((_,idx)=>idx!==i)}))} style={{...Bs("#f87171"),padding:"5px 7px",fontSize:11}}>✕</button>
                  </div>
                );
              })}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div><Lb>هامش الربح (%)</Lb><In type="number" value={npForm.targetProfit} onChange={e=>setNpForm(f=>({...f,targetProfit:e.target.value}))}/></div>
              <div><Lb>تخفيض (%)</Lb><In type="number" value={npForm.discount} onChange={e=>setNpForm(f=>({...f,discount:e.target.value}))}/></div>
            </div>
            <div style={{marginBottom:9}}><Lb>ملاحظات</Lb><In value={npForm.notes} onChange={e=>setNpForm(f=>({...f,notes:e.target.value}))} placeholder="أي تفاصيل..."/></div>

            {npCalc.suggested>0&&(
              <div style={{padding:9,background:"rgba(74,222,128,0.08)",borderRadius:9,border:"1px solid rgba(74,222,128,0.18)",marginBottom:10}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                  <Rw l="التكلفة" v={`${fmt(Math.round(npCalc.totalCost||0))} ${cur}`} b/>
                  <Rw l="السعر المقترح" v={`${fmt(npCalc.suggested||0)} ${cur}`} c="#fbbf24" b/>
                </div>
              </div>
            )}
            <button onClick={saveNewProduct} style={{...Bs("#ff6eb4"),width:"100%",padding:11,fontSize:14,justifyContent:"center"}}>💾 حفظ المنتج</button>
          </div>
        </div>
      )}

      {/* ── Session flow ── */}
      {mode==="session"&&(
        <div>
          {step===1&&(
            <div>
              <div style={{...Cs,marginBottom:11}}>
                <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:9,fontSize:13}}>اختاري المنتجات والكميات</div>
                {!(data.products||[]).length&&<div style={{textAlign:"center",padding:16,color:"rgba(255,255,255,0.35)",fontSize:12}}>ما في منتجات — أضيفي أول!</div>}
                {(data.products||[]).filter(p=>(p.status||"قيد العمل")!=="مباع").map(p=>{
                  const sel=selProds.find(x=>x.id===p.id);
                  return (
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 9px",borderRadius:8,marginBottom:4,background:sel?"rgba(255,110,180,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${sel?"rgba(255,110,180,0.35)":"rgba(255,255,255,0.07)"}`}}>
                      {p.image&&<img src={p.image} style={{width:28,height:28,borderRadius:6,objectFit:"cover",flexShrink:0}} alt=""/>}
                      <div onClick={()=>toggle(p.id)} style={{width:17,height:17,borderRadius:4,border:`2px solid ${sel?"#ff6eb4":"rgba(255,255,255,0.35)"}`,background:sel?"#ff6eb4":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,flexShrink:0,cursor:"pointer"}}>{sel&&"✓"}</div>
                      <div style={{flex:1,cursor:"pointer"}} onClick={()=>toggle(p.id)}>
                        <div style={{fontWeight:600,fontSize:12}}>{!p.image&&catIcon(p.categoryKey)} {p.name}</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>✅{p.readyCount||0} · {fmt(p.suggestedPrice)} {cur}</div>
                      </div>
                      {sel&&<input type="number" min="1" value={sel.qty} onClick={e=>e.stopPropagation()} onChange={e=>setQty(p.id,e.target.value)} style={{...Ns,width:48,fontSize:14,padding:"3px 5px"}}/>}
                    </div>
                  );
                })}
                {selProds.length>0&&<div style={{marginTop:8,padding:8,background:"rgba(255,110,180,0.08)",borderRadius:8,fontSize:11,color:"#ffb4dc",textAlign:"center"}}>✅ {selProds.length} منتج · {totalPcs} قطعة</div>}
              </div>
              <button onClick={start} disabled={!selProds.length} style={{...Bs(selProds.length?"#ff6eb4":"rgba(255,255,255,0.1)"),width:"100%",padding:12,fontSize:14,justifyContent:"center",opacity:selProds.length?1:0.5}}>▶ ابدئي الجلسة</button>
              {(data.sessions||[]).length>0&&(
                <div style={{marginTop:14}}>
                  <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:8,fontSize:12}}>📋 آخر الجلسات</div>
                  {[...(data.sessions||[])].reverse().slice(0,4).map(s=>(
                    <div key={s.id} style={{...Cs,marginBottom:6}}>
                      <div style={{fontSize:11,fontWeight:600,marginBottom:2}}>🪡 {s.totalPcs} قطعة · {s.totalMins} دقيقة</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>📅 {s.date} · {s.minsPerPc}د/قطعة</div>
                      {s.note&&<div style={{fontSize:10,color:"rgba(255,180,220,0.6)",marginTop:2}}>📝 {s.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step===2&&(
            <div style={{...Cs,textAlign:"center",border:"1px solid rgba(255,100,100,0.25)"}}>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:5}}>🪡 جلسة الصنع</div>
              <div style={{fontSize:50,fontWeight:800,color:paused?"#fbbf24":"#f87171",fontVariantNumeric:"tabular-nums",marginBottom:5}}>{fmtTime(timerSec)}</div>
              {paused&&<div style={{fontSize:11,color:"#fbbf24",marginBottom:5}}>⏸ إيقاف مؤقت</div>}
              <div style={{display:"flex",justifyContent:"center",gap:12,fontSize:11,marginBottom:12}}>
                <span style={{color:"rgba(255,255,255,0.45)"}}>🧶 {totalPcs} قطعة</span>
                <span style={{color:"#fbbf24",fontWeight:600}}>{fmt(costPerPc)} {cur}/قطعة</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",marginBottom:14}}>
                {selProds.map(s=>{const p=data.products.find(x=>x.id===s.id);return p?<span key={s.id} style={{fontSize:10,background:"rgba(255,110,180,0.12)",border:"1px solid rgba(255,110,180,0.25)",borderRadius:6,padding:"2px 8px",color:"#ffb4dc",display:"flex",alignItems:"center",gap:4}}>{p.image&&<img src={p.image} style={{width:14,height:14,borderRadius:3,objectFit:"cover"}} alt=""/>}{p.name} ×{s.qty}</span>:null;})}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={togglePause} style={{...Bs(paused?"#4ade80":"#fbbf24"),padding:"9px 16px",fontSize:12}}>{paused?"▶ استئناف":"⏸ إيقاف"}</button>
                <button onClick={finish} style={{...Bs("#60a5fa"),padding:"9px 16px",fontSize:12}}>⏹ إنهاء</button>
                <button onClick={cancel} style={{...Bs("#f87171"),padding:"9px 16px",fontSize:12}}>✕ إلغاء</button>
              </div>
            </div>
          )}

          {step===3&&(
            <div style={Cs}>
              <div style={{color:"#4ade80",fontWeight:800,fontSize:14,marginBottom:10}}>✅ انتهت الجلسة!</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                <Rw l="الوقت" v={`${Math.round(timerSec/60)} دقيقة`} b/>
                <Rw l="القطع" v={totalPcs} b/>
                <Rw l="دقيقة/قطعة" v={totalPcs>0?Math.round((timerSec/60)/totalPcs):0} b/>
                <Rw l="تكلفة/قطعة" v={`${fmt(costPerPc)} ${cur}`} c="#fbbf24" b/>
              </div>
              <div style={{marginBottom:11,padding:10,background:"rgba(74,222,128,0.08)",borderRadius:9,border:"1px solid rgba(74,222,128,0.15)"}}>
                <div style={{color:"#4ade80",fontWeight:700,fontSize:12,marginBottom:7}}>📦 أضيفي للمخزون الجاهز؟</div>
                {selProds.map(s=>{const p=data.products.find(x=>x.id===s.id);if(!p) return null;const checked=addToReady.includes(p.id);return(
                  <div key={p.id} onClick={()=>setAddToReady(prev=>checked?prev.filter(x=>x!==p.id):[...prev,p.id])} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 0",cursor:"pointer"}}>
                    <div style={{width:15,height:15,borderRadius:4,border:`2px solid ${checked?"#4ade80":"rgba(255,255,255,0.35)"}`,background:checked?"#4ade80":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0}}>{checked&&"✓"}</div>
                    {p.image&&<img src={p.image} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}} alt=""/>}
                    <span style={{fontSize:12}}>{p.name} × {s.qty}</span>
                  </div>
                );})}
              </div>
              <div style={{marginBottom:10}}><Lb>ملاحظات إضافية</Lb><textarea value={extraNote} onChange={e=>setExtraNote(e.target.value)} placeholder="أي شي إضافي..." style={{...Ns,width:"100%",minHeight:50,resize:"vertical"}}/></div>
              <button onClick={saveSession} style={{...Bs("#ff6eb4"),width:"100%",padding:11,fontSize:13,justifyContent:"center"}}>💾 حفظ الجلسة</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
},

/* ─── Inventory ──────────────────────────────────────────────────────────────── */
function Inventory({data,update,cur}) {
  const [showAdd,setShowAdd]=useState(false);
  const [editMat,setEditMat]=useState(null);
  const emptyForm=()=>({name:"",unit:"غرام",totalPurchasePrice:0,quantity:0,minAlert:10});
  const [form,setForm]=useState(emptyForm);
  const [nameSug,setNameSug]=useState([]);

  // Autocomplete for material name
  const handleNameChange=(val)=>{
    setForm(f=>({...f,name:val}));
    if(val.length>0){
      const matches=data.materials.filter(m=>m.name.includes(val)||m.name.startsWith(val));
      setNameSug(matches.slice(0,4));
    } else setNameSug([]);
  };

  const selectSug=(m)=>{
    // Fill form with existing material data for adding more stock
    setForm({name:m.name,unit:m.unit,totalPurchasePrice:0,quantity:0,minAlert:m.minAlert||10});
    setNameSug([]);
  };

  const add=()=>{
    if(!form.name.trim()||!Number(form.quantity)) return;
    const tc=Number(form.totalPurchasePrice||0);
    const qty=Number(form.quantity);
    // cost per unit = total price / quantity
    const cpu=qty>0&&tc>0?tc/qty:0;
    const cp100=cpu*100;
    const ei=data.materials.findIndex(m=>m.name===form.name.trim());
    update(prev=>{
      let mats;
      if(ei>=0){
        const existing=prev.materials[ei];
        const oldTotal=Number(existing.totalCost)||0;
        const newTotal=oldTotal+tc;
        const newQty=Number(existing.quantity)+qty;
        // weighted average cost per unit
        const newCpu=newQty>0?newTotal/newQty:cpu;
        mats=prev.materials.map((m,i)=>i===ei?{...m,quantity:newQty,totalCost:newTotal,costPerUnit:newCpu,costPer100:newCpu*100}:m);
      } else {
        mats=[...prev.materials,{...form,id:Date.now().toString(),costPerUnit:cpu,costPer100:cp100,totalCost:tc}];
      }
      return {...prev,materials:mats,purchases:[...prev.purchases,{...form,id:Date.now().toString(),costPerUnit:cpu,totalCost:tc,date:new Date().toLocaleDateString("ar-IQ")}]};
    });
    setForm(emptyForm());setNameSug([]);setShowAdd(false);
  };

  const saveEdit=()=>{
    if(!editMat) return;
    const tc=Number(editMat.totalCost||0);
    const qty=Number(editMat.quantity||0);
    const cpu=qty>0&&tc>0?tc/qty:Number(editMat.costPerUnit||0);
    update(prev=>({...prev,materials:prev.materials.map(m=>m.id===editMat.id?{...editMat,costPerUnit:cpu,costPer100:cpu*100}:m)}));
    setEditMat(null);
  };

  const deduct=(id,amt)=>update(prev=>({...prev,materials:prev.materials.map(m=>m.id===id?{...m,quantity:Math.max(0,Number(m.quantity)-Number(amt))}:m)}));
  const delMat=(id)=>confirmDel("تأكيد حذف هذه المادة؟",()=>update(prev=>({...prev,materials:prev.materials.filter(m=>m.id!==id)})));

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{color:"#ffb4dc",fontWeight:800}}>المخزون 📦</h2>
        <button onClick={()=>{setShowAdd(!showAdd);setEditMat(null);}} style={Bs("#ff6eb4")}>{showAdd?"← إغلاق":"+ شراء مواد"}</button>
      </div>

      {/* Add form */}
      {showAdd&&!editMat&&(
        <div style={{...Cs,marginBottom:12}}>
          <div style={{marginBottom:8,position:"relative"}}>
            <Lb>اسم المادة</Lb>
            <In value={form.name} onChange={e=>handleNameChange(e.target.value)} placeholder="مثال: صوف أكريليك"/>
            {nameSug.length>0&&(
              <div style={{position:"absolute",top:"100%",right:0,left:0,background:"#1e1040",border:"1px solid rgba(255,180,220,0.3)",borderRadius:8,zIndex:50,overflow:"hidden"}}>
                {nameSug.map(m=>(
                  <div key={m.id} onClick={()=>selectSug(m)} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{color:"#ffb4dc",fontWeight:600}}>{m.name}</span>
                    <span style={{color:"rgba(255,255,255,0.45)",fontSize:10}}>{fmt(m.quantity)} {m.unit} متوفر</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><Lb>الوحدة</Lb><Sl value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}><option>غرام</option><option>كيلو</option><option>متر</option><option>حبة</option><option>لفة</option><option>علبة</option></Sl></div>
            <div><Lb>الكمية المشتراة</Lb><In type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}/></div>
            <div style={{gridColumn:"span 2"}}>
              <Lb>السعر الكلي للكمية ({cur})</Lb>
              <In type="number" value={form.totalPurchasePrice} onChange={e=>setForm(f=>({...f,totalPurchasePrice:e.target.value}))} placeholder="مثال: 6000"/>
              {Number(form.quantity)>0&&Number(form.totalPurchasePrice)>0&&(
                <div style={{marginTop:4,fontSize:11,color:"#60a5fa"}}>
                  سعر الوحدة: {(Number(form.totalPurchasePrice)/Number(form.quantity)).toFixed(2)} {cur}/{form.unit}
                  &nbsp;·&nbsp; لكل 100 {form.unit}: {fmt(Math.round(Number(form.totalPurchasePrice)/Number(form.quantity)*100))} {cur}
                </div>
              )}
            </div>
            <div><Lb>تنبيه عند كمية</Lb><In type="number" value={form.minAlert} onChange={e=>setForm(f=>({...f,minAlert:e.target.value}))}/></div>
          </div>
          <button onClick={add} style={{...Bs("#ff6eb4"),width:"100%",marginTop:10}}>💾 تسجيل الشراء</button>
        </div>
      )}

      {/* Edit material */}
      {editMat&&(
        <div style={{...Cs,marginBottom:12,border:"1px solid rgba(251,191,36,0.35)"}}>
          <div style={{color:"#fbbf24",fontWeight:700,marginBottom:10,fontSize:13}}>✏️ تعديل: {editMat.name}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{gridColumn:"span 2"}}><Lb>اسم المادة</Lb><In value={editMat.name} onChange={e=>setEditMat(m=>({...m,name:e.target.value}))}/></div>
            <div><Lb>الوحدة</Lb><Sl value={editMat.unit} onChange={e=>setEditMat(m=>({...m,unit:e.target.value}))}><option>غرام</option><option>كيلو</option><option>متر</option><option>حبة</option><option>لفة</option><option>علبة</option></Sl></div>
            <div><Lb>الكمية الحالية</Lb><In type="number" value={editMat.quantity} onChange={e=>setEditMat(m=>({...m,quantity:e.target.value}))}/></div>
            <div style={{gridColumn:"span 2"}}><Lb>إجمالي التكلفة ({cur})</Lb><In type="number" value={editMat.totalCost||0} onChange={e=>setEditMat(m=>({...m,totalCost:e.target.value}))}/></div>
            <div><Lb>تنبيه عند كمية</Lb><In type="number" value={editMat.minAlert||0} onChange={e=>setEditMat(m=>({...m,minAlert:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={saveEdit} style={{...Bs("#4ade80"),flex:1,justifyContent:"center"}}>💾 حفظ التعديل</button>
            <button onClick={()=>setEditMat(null)} style={{...Bs("#f87171"),padding:"7px 14px"}}>✕</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:8}}>
        {data.materials.map(m=>{
          const low=Number(m.quantity)<=Number(m.minAlert);
          const cpu=Number(m.costPerUnit||0);
          const cp100=Number(m.costPer100||cpu*100||0);
          return (
            <div key={m.id} style={{...Cs,border:low?"1px solid rgba(248,113,113,0.4)":undefined}}>
              {low&&<div style={{color:"#f87171",fontSize:10,marginBottom:4}}>⚠️ منخفض</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2}}>
                <div style={{fontWeight:700,fontSize:12}}>{m.name}</div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>{setEditMat({...m});setShowAdd(false);}} style={{background:"none",border:"none",color:"#fbbf24",cursor:"pointer",fontSize:13,padding:0}}>✏️</button>
                  <button onClick={()=>delMat(m.id)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:13,padding:0}}>🗑</button>
                </div>
              </div>
              <div style={{fontSize:18,fontWeight:800,color:low?"#f87171":"#4ade80"}}>{fmt(m.quantity)}<span style={{fontSize:10}}> {m.unit}</span></div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2}}>
                {cp100>0?`${fmt(Math.round(cp100))} ${cur}/100${m.unit}`:`${fmt(cpu)} ${cur}/${m.unit}`}
              </div>
              <div style={{display:"flex",gap:4,marginTop:7}}>
                <input type="number" placeholder="خصم" style={{...Ns,flex:1,fontSize:14,padding:"4px 6px"}} id={`d-${m.id}`}/>
                <button onClick={()=>{const el=document.getElementById(`d-${m.id}`);deduct(m.id,el.value);el.value="";}} style={{...Bs("#f87171"),padding:"4px 7px",fontSize:11}}>-</button>
              </div>
            </div>
          );
        })}
      </div>
      {!data.materials.length&&<div style={{textAlign:"center",padding:35,color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:44}}>📦</div><div style={{marginTop:8}}>ما في مواد بعد</div></div>}
      {data.purchases.length>0&&(
        <div style={{marginTop:16}}>
          <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:8,fontSize:12}}>🧾 سجل المشتريات</div>
          {[...data.purchases].reverse().map(p=>(
            <div key={p.id} style={{...Cs,marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:600,fontSize:12}}>{p.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{p.date} · {p.quantity} {p.unit}</div></div>
              <div style={{color:"#f87171",fontWeight:700,fontSize:12}}>{fmt(p.totalCost)} {cur}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Bazaars ────────────────────────────────────────────────────────────────── */
function Bazaars({data,update,cur}) {
  const [showAdd,setShowAdd]=useState(false);
  const [editBaz,setEditBaz]=useState(null);
  const emptyForm=()=>({name:"",date:"",location:"",tableCost:0,transportCost:0,otherCosts:0,notes:""});
  const [form,setForm]=useState(emptyForm);
  const save=()=>{
    if(!form.name.trim()) return;
    const tc=Number(form.tableCost)+Number(form.transportCost)+Number(form.otherCosts);
    if(editBaz) {
      update(prev=>({...prev,bazaars:prev.bazaars.map(b=>b.id===editBaz.id?{...form,id:editBaz.id,totalCost:tc}:b)}));
      setEditBaz(null);
    } else {
      update(prev=>({...prev,bazaars:[...prev.bazaars,{...form,id:Date.now().toString(),totalCost:tc}]}));
    }
    setForm(emptyForm());setShowAdd(false);
  };
  const openEdit=(b)=>{setForm({name:b.name,date:b.date||"",location:b.location||"",tableCost:b.tableCost||0,transportCost:b.transportCost||0,otherCosts:b.otherCosts||0,notes:b.notes||""});setEditBaz(b);setShowAdd(true);};
  const del=id=>confirmDel("تأكيد حذف هذا البازار؟",()=>update(prev=>({...prev,bazaars:prev.bazaars.filter(b=>b.id!==id)})));
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{color:"#ffb4dc",fontWeight:800}}>البازارات 🛍️</h2>
        <button onClick={()=>{setShowAdd(!showAdd);setEditBaz(null);setForm(emptyForm());}} style={Bs("#ff6eb4")}>{showAdd?"← إغلاق":"+ بازار"}</button>
      </div>
      {showAdd&&(
        <div style={{...Cs,marginBottom:12,border:editBaz?"1px solid rgba(251,191,36,0.35)":undefined}}>
          {editBaz&&<div style={{color:"#fbbf24",fontWeight:700,marginBottom:8,fontSize:13}}>✏️ تعديل: {editBaz.name}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{gridColumn:"span 2"}}><Lb>اسم البازار</Lb><In value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="بازار العيد"/></div>
            <div><Lb>التاريخ</Lb><In type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <div><Lb>المكان</Lb><In value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/></div>
            <div><Lb>إيجار الطاولة</Lb><In type="number" value={form.tableCost} onChange={e=>setForm(f=>({...f,tableCost:e.target.value}))}/></div>
            <div><Lb>المواصلات</Lb><In type="number" value={form.transportCost} onChange={e=>setForm(f=>({...f,transportCost:e.target.value}))}/></div>
            <div><Lb>مصاريف أخرى</Lb><In type="number" value={form.otherCosts} onChange={e=>setForm(f=>({...f,otherCosts:e.target.value}))}/></div>
            <div><Lb>ملاحظات</Lb><In value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
          </div>
          <button onClick={save} style={{...Bs("#ff6eb4"),width:"100%",marginTop:10}}>💾 حفظ</button>
        </div>
      )}
      {[...data.bazaars].sort((a,b)=>{
        const da=a.date?new Date(a.date.split("/").reverse().join("-")):new Date(0);
        const db=b.date?new Date(b.date.split("/").reverse().join("-")):new Date(0);
        return db-da;
      }).map(b=>{
        const bs=data.sales.filter(s=>s.bazaarId===b.id);
        const rev=bs.reduce((s,x)=>s+Number(x.total||0),0);
        const gross=bs.reduce((s,x)=>s+Number(x.totalProfit||0),0);
        const net=gross-Number(b.totalCost||0);
        const roi=b.totalCost>0?(net/Number(b.totalCost))*100:0;
        const rec=roi>=100;
        return (
          <div key={b.id} style={{...Cs,marginBottom:9,border:`1px solid ${rec?"rgba(74,222,128,0.45)":roi<0?"rgba(248,113,113,0.35)":"rgba(255,255,255,0.08)"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13}}>🏪 {b.name}</span>
                  {rec&&<span style={{background:"rgba(74,222,128,0.2)",color:"#4ade80",fontSize:10,borderRadius:6,padding:"1px 7px",fontWeight:700}}>⭐ ينصح به</span>}
                  {!rec&&roi>=50&&<span style={{background:"rgba(251,191,36,0.15)",color:"#fbbf24",fontSize:10,borderRadius:6,padding:"1px 7px"}}>👍 مقبول</span>}
                  {roi<0&&<span style={{background:"rgba(248,113,113,0.2)",color:"#f87171",fontSize:10,borderRadius:6,padding:"1px 7px"}}>⚠️ خسارة</span>}
                </div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",marginBottom:7}}>📅 {b.date} {b.location&&`· 📍 ${b.location}`}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                  <Rw l="مصاريف" v={`${fmt(b.totalCost)} ${cur}`}/>
                  <Rw l="إيرادات" v={`${fmt(rev)} ${cur}`} c="#4ade80"/>
                  <Rw l="ربح القطع" v={`${fmt(Math.round(gross))} ${cur}`} c="#fbbf24"/>
                  <Rw l="صافي الربح" v={`${fmt(Math.round(net))} ${cur}`} c={net>=0?"#4ade80":"#f87171"} b/>
                  <Rw l="العائد" v={`${Math.round(roi)}%`} c={rec?"#4ade80":roi<0?"#f87171":"#fbbf24"} b/>
                </div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:5}}>{bs.length} عملية · {bs.reduce((s,x)=>s+Number(x.qty||1),0)} قطعة</div>
              </div>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>openEdit(b)} style={{...Bs("rgba(255,191,36,0.3)"),padding:"3px 6px",fontSize:10,border:"1px solid rgba(251,191,36,0.4)"}}>✏️</button>
                <button onClick={()=>del(b.id)} style={{...Bs("#f87171"),padding:"3px 6px",fontSize:10}}>🗑</button>
              </div>
            </div>
            <BazaarTopProducts sales={bs} cur={cur}/>
          </div>
        );
      })}
      {!data.bazaars.length&&<div style={{textAlign:"center",padding:35,color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:44}}>🛍️</div><div style={{marginTop:8}}>ما في بازارات بعد</div></div>}
    </div>
  );
}

/* ─── BazaarTopProducts ──────────────────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
function BazaarTopProducts2({sales,cur}) {
  const [show,setShow]=useState(false);
  if(!sales.length) return null;

  const prodMap={};
  sales.forEach(s=>{
    const pid=s.productId||s.productName;
    if(!prodMap[pid]) prodMap[pid]={name:s.productName,qty:0,profit:0};
    prodMap[pid].qty+=Number(s.qty||1);
    prodMap[pid].profit+=Number(s.totalProfit||0);
  });
  const top=Object.values(prodMap).sort((a,b)=>b.qty!==a.qty?b.qty-a.qty:b.profit-a.profit).slice(0,5);

  return (
    <div style={{marginTop:8}}>
      <button onClick={()=>setShow(!show)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"rgba(255,180,220,0.7)",fontFamily:"inherit",fontSize:11,width:"100%"}}>
        {show?"↑ إخفاء":"↓ أكثر المنتجات مبيعاً"}
      </button>
      {show&&(
        <div style={{marginTop:7,padding:10,background:"rgba(255,255,255,0.04)",borderRadius:9}}>
          {top.map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{color:i===0?"#fbbf24":i===1?"#9ca3af":i===2?"#cd7c2f":"rgba(255,255,255,0.4)",fontWeight:800,fontSize:12,minWidth:18}}>#{i+1}</span>
                <span style={{fontSize:12,fontWeight:600}}>{p.name}</span>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:11,color:"#4ade80",fontWeight:600}}>{p.qty} قطعة</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{fmt(Math.round(p.profit))} {cur}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── BazaarTopProducts ──────────────────────────────────────────────────────── */
function BazaarTopProducts({sales,cur}) {
  const [show,setShow]=useState(false);
  if(!sales.length) return null;
  const prodMap={};
  sales.forEach(s=>{
    const pid=s.productId||s.productName;
    if(!prodMap[pid]) prodMap[pid]={name:s.productName,qty:0,profit:0};
    prodMap[pid].qty+=Number(s.qty||1);
    prodMap[pid].profit+=Number(s.totalProfit||0);
  });
  const top=Object.values(prodMap).sort((a,b)=>b.qty!==a.qty?b.qty-a.qty:b.profit-a.profit).slice(0,5);
  return (
    <div style={{marginTop:8}}>
      <button onClick={()=>setShow(!show)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"rgba(255,180,220,0.7)",fontFamily:"inherit",fontSize:11,width:"100%"}}>
        {show?"↑ إخفاء":"↓ أكثر المنتجات مبيعاً"}
      </button>
      {show&&(
        <div style={{marginTop:7,padding:10,background:"rgba(255,255,255,0.04)",borderRadius:9}}>
          {top.map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{color:i===0?"#fbbf24":i===1?"#9ca3af":i===2?"#cd7c2f":"rgba(255,255,255,0.4)",fontWeight:800,fontSize:12,minWidth:18}}>#{i+1}</span>
                <span style={{fontSize:12,fontWeight:600}}>{p.name}</span>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:11,color:"#4ade80",fontWeight:600}}>{p.qty} قطعة</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{fmt(Math.round(p.profit))} {cur}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sales ──────────────────────────────────────────────────────────────────── */
function Sales({data,update,cur,catIcon}) {
  const [showAdd,setShowAdd]=useState(false);
  const [editSale,setEditSale]=useState(null);
  const [form,setForm]=useState({productId:"",bazaarId:"",qty:1,customPrice:"",discount:0,channel:"بازار",notes:"",isBundle:false});

  const prod=(data.products||[]).find(p=>p.id===form.productId);
  const base=prod?.suggestedPrice||0;
  const unitPrice=form.customPrice?Number(form.customPrice):Math.round(base*(1-Number(form.discount)/100));
  const qty=Number(form.qty||1);
  const total=unitPrice*qty;
  const unitCost=prod?.totalCost||0;
  const totalProfit=(unitPrice-unitCost)*qty;
  const available=(data.products||[]).filter(p=>Number(p.readyCount||0)>0);

  const openAdd=()=>{setEditSale(null);setForm({productId:"",bazaarId:"",qty:1,customPrice:"",discount:0,channel:"بازار",notes:"",isBundle:false});setShowAdd(true);};
  const openEdit=(s)=>{
    setEditSale(s);
    setForm({productId:s.productId||"",bazaarId:s.bazaarId||"",qty:s.qty||1,customPrice:s.unitPrice||"",discount:s.discount||0,channel:s.channel||"بازار",notes:s.notes||""});
    setShowAdd(true);
  };

  const save=()=>{
    if(!form.productId||!total) return;
    // Check bazaar date not passed
    if(form.bazaarId&&!editSale){
      const baz=data.bazaars.find(b=>b.id===form.bazaarId);
      if(baz&&baz.date){
        const bazDate=new Date(baz.date);
        const today=new Date(); today.setHours(0,0,0,0); bazDate.setHours(0,0,0,0);
        if(bazDate<today){if(!window.confirm("تاريخ هذا البازار انتهى. هل تريدين إضافة المبيعة رغم ذلك؟")) return;}
      }
    }
    if(editSale) {
      // undo old sale effect
      const oldQty=Number(editSale.qty||1);
      const newQty=qty;
      update(prev=>({
        ...prev,
        products:prev.products.map(p=>{
          if(p.id!==form.productId) return p;
          const readyAdj=oldQty-newQty; // if newQty<oldQty, return some to ready
          return {...p,readyCount:Math.max(0,(Number(p.readyCount)||0)+readyAdj),soldCount:Math.max(0,(Number(p.soldCount)||0)-oldQty+newQty)};
        }),
        sales:prev.sales.map(s=>s.id===editSale.id?{...s,...form,productName:prod.name,unitPrice,total,totalProfit,qty,date:s.date,unitCost}:s)
      }));
    } else {
      update(prev=>({
        ...prev,
        products:prev.products.map(p=>p.id===form.productId?{...p,readyCount:Math.max(0,(Number(p.readyCount)||0)-qty),soldCount:(Number(p.soldCount)||0)+qty,status:"مباع"}:p),
        sales:[...prev.sales,{...form,id:Date.now().toString(),productName:prod.name,unitPrice,total,totalProfit,qty,date:new Date().toLocaleDateString("ar-IQ"),unitCost}]
      }));
    }
    setShowAdd(false);setEditSale(null);
    setForm({productId:"",bazaarId:"",qty:1,customPrice:"",discount:0,channel:"بازار",notes:"",isBundle:false});
  };

  const del=id=>confirmDel("تأكيد حذف هذه المبيعة؟ ستعود القطع للمخزون",()=>{
    const s=data.sales.find(x=>x.id===id);
    update(prev=>({
      ...prev,
      sales:prev.sales.filter(x=>x.id!==id),
      products:prev.products.map(p=>p.id===s?.productId?{...p,readyCount:(Number(p.readyCount)||0)+Number(s.qty||1),soldCount:Math.max(0,(Number(p.soldCount)||0)-Number(s.qty||1))}:p)
    }));
  });

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{color:"#ffb4dc",fontWeight:800}}>المبيعات 💰</h2>
        <button onClick={openAdd} style={Bs("#ff6eb4")}>+ تسجيل بيع</button>
      </div>

      {showAdd&&(
        <div style={{...Cs,marginBottom:12}}>
          <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:10,fontSize:13}}>{editSale?"تعديل عملية بيع":"تسجيل بيع جديد"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{gridColumn:"span 2",position:"relative"}}>
              <Lb>المنتج (ابحثي بالاسم)</Lb>
              <SalesSearch available={available} editSale={editSale} form={form} setForm={setForm} catIcon={catIcon} cur={cur} fmt={fmt}/>
            </div>
            <div><Lb>عدد القطع</Lb><In type="number" min="1" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))}/></div>
            <div><Lb>قناة البيع</Lb><Sl value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))}><option>بازار</option><option>أونلاين</option><option>مباشر</option><option>هدية</option></Sl></div>
            <div><Lb>البازار</Lb><Sl value={form.bazaarId} onChange={e=>setForm(f=>({...f,bazaarId:e.target.value}))}><option value="">بدون بازار</option>{data.bazaars.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</Sl></div>
            <div><Lb>تخفيض (%)</Lb><In type="number" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value,customPrice:""}))}/></div>
            <div><Lb>سعر القطعة ({cur})</Lb><In type="number" value={form.customPrice} onChange={e=>setForm(f=>({...f,customPrice:e.target.value}))} placeholder="فارغ=المقترح"/></div>
            <div style={{gridColumn:"span 2"}}>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:"rgba(255,200,240,0.7)"}}>
                <input type="checkbox" checked={form.isBundle||false} onChange={e=>setForm(f=>({...f,isBundle:e.target.checked}))} style={{width:16,height:16,accentColor:"#fbbf24"}}/>
                <span>🎁 بيع حزمة (مجموعة منتجات بسعر واحد)</span>
              </label>
            </div>
          </div>
          {prod&&(
            <div style={{marginTop:9,padding:9,background:"rgba(74,222,128,0.08)",borderRadius:8,border:"1px solid rgba(74,222,128,0.18)"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
                <Rw l="سعر/قطعة" v={`${fmt(unitPrice)} ${cur}`}/>
                <Rw l="الكمية" v={qty}/>
                <Rw l="الإجمالي" v={`${fmt(total)} ${cur}`} c="#fbbf24" b/>
                <Rw l="الربح" v={`${fmt(Math.round(totalProfit))} ${cur}`} c={totalProfit>=0?"#4ade80":"#f87171"} b/>
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={save} style={{...Bs("#4ade80"),flex:1,justifyContent:"center",padding:"10px"}}>💰 {editSale?"حفظ التعديل":"تسجيل"}</button>
            <button onClick={()=>{setShowAdd(false);setEditSale(null);}} style={{...Bs("#f87171"),padding:"10px 14px"}}>✕</button>
          </div>
        </div>
      )}

      <SalesByDate sales={data.sales} bazaars={data.bazaars} products={data.products} cur={cur} onEdit={openEdit} onDel={del}/>
      {!data.sales.length&&<div style={{textAlign:"center",padding:35,color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:44}}>💰</div><div style={{marginTop:8}}>ما في مبيعات بعد</div></div>}
    </div>
  );
}

/* ─── Monthly ─────────────────────────────────────────────────────────────────── */
function Monthly({data,cur}) {
  const monthly={};
  data.sales.forEach(s=>{
    const m=getMonth(s.date);if(!m) return;
    if(!monthly[m]) monthly[m]={sales:0,profit:0,count:0};
    monthly[m].sales+=Number(s.total||0);monthly[m].profit+=Number(s.totalProfit||0);monthly[m].count+=Number(s.qty||1);
  });
  const months=Object.keys(monthly).sort().reverse();
  const maxS=Math.max(...months.map(m=>monthly[m].sales),1);
  return (
    <div>
      <h2 style={{color:"#ffb4dc",fontWeight:800,marginBottom:12}}>الإحصائيات الشهرية 📅</h2>
      {!months.length&&<div style={{textAlign:"center",padding:35,color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:44}}>📅</div><div style={{marginTop:8}}>ما في بيانات بعد</div></div>}
      {months.map(m=>{
        const d=monthly[m];const bw=Math.round((d.sales/maxS)*100);const ip=d.sales===maxS&&months.length>1;
        return (
          <div key={m} style={{...Cs,marginBottom:8,border:ip?"1px solid rgba(74,222,128,0.4)":"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontWeight:700,fontSize:13}}>{monthLabel(m)}{ip&&<span style={{fontSize:10,color:"#4ade80",marginRight:7}}>🏆 ذروة</span>}</div>
              <div style={{fontSize:12,color:"#4ade80",fontWeight:700}}>{fmt(d.sales)} {cur}</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.07)",borderRadius:5,height:7,marginBottom:7,overflow:"hidden"}}><div style={{width:`${bw}%`,height:"100%",background:ip?"linear-gradient(90deg,#4ade80,#22d3ee)":"linear-gradient(90deg,#ff6eb4,#ff4d9e)",borderRadius:5}}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
              <Rw l="المبيعات" v={`${fmt(d.sales)} ${cur}`}/><Rw l="الأرباح" v={`${fmt(Math.round(d.profit))} ${cur}`} c="#60a5fa"/><Rw l="القطع" v={d.count}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Settings ───────────────────────────────────────────────────────────────── */
function Settings({data,update}) {
  const [rate,setRate]=useState(data.settings.hourlyRate);
  const [currency,setCurrency]=useState(data.settings.currency);
  const [cats,setCats]=useState(data.categories||DEFAULT_CATEGORIES);
  const [newCat,setNewCat]=useState({key:"",icon:"🧶"});
  const [mergeStatus,setMergeStatus]=useState(null);
  const importRef=useRef();

  const save=()=>{update(prev=>({...prev,settings:{hourlyRate:Number(rate),currency},categories:cats}));alert("تم الحفظ ✅");};
  const addCat=()=>{if(!newCat.key.trim()) return;setCats(c=>[...c,{key:newCat.key.trim(),icon:newCat.icon||"🧶"}]);setNewCat({key:"",icon:"🧶"});};
  const delCat=key=>setCats(c=>c.filter(x=>x.key!==key));

  const exportData=(label="backup")=>{
    const b=new Blob([JSON.stringify({...data,_exportedAt:new Date().toISOString(),_device:label},null,2)],{type:"application/json"});
    const u=URL.createObjectURL(b);const a=document.createElement("a");
    a.href=u;a.download=`kokla_${label}_${new Date().toLocaleDateString("ar-IQ").replace(/\//g,"-")}.json`;a.click();URL.revokeObjectURL(u);
  };

  const mergeIncoming=(incoming,current)=>{
    const ma=(c,i)=>{if(!Array.isArray(i)) return c;const ids=new Set((c||[]).map(x=>x.id));const n=i.filter(x=>x.id&&!ids.has(x.id));return[...(c||[]),...n];};
    const mp=ma(current.products,incoming.products);const mm=ma(current.materials,incoming.materials);
    const mpu=ma(current.purchases,incoming.purchases);const mb=ma(current.bazaars,incoming.bazaars);
    const ms=ma(current.sales,incoming.sales);const mse=ma(current.sessions,incoming.sessions);
    const eck=new Set((current.categories||[]).map(c=>c.key));
    const nc=(incoming.categories||[]).filter(c=>!eck.has(c.key));
    const mc=[...(current.categories||DEFAULT_CATEGORIES),...nc];
    const added={products:mp.length-(current.products||[]).length,materials:mm.length-(current.materials||[]).length,purchases:mpu.length-(current.purchases||[]).length,bazaars:mb.length-(current.bazaars||[]).length,sales:ms.length-(current.sales||[]).length,sessions:mse.length-(current.sessions||[]).length};
    return {merged:{...current,products:mp,materials:mm,purchases:mpu,bazaars:mb,sales:ms,sessions:mse,categories:mc},added,totalAdded:Object.values(added).reduce((s,v)=>s+v,0)};
  };

  const handleImport=e=>{
    const file=e.target.files[0];if(!file) return;setMergeStatus(null);
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const inc=JSON.parse(ev.target.result);
        if(!inc||typeof inc!=="object"){setMergeStatus({error:"الملف غير صالح"});return;}
        const {merged,added,totalAdded}=mergeIncoming(inc,data);
        update(()=>merged);setMergeStatus({added,totalAdded});
      }catch(err){setMergeStatus({error:"خطأ: "+err.message});}
      e.target.value="";
    };
    r.readAsText(file);
  };

  return (
    <div>
      <h2 style={{color:"#ffb4dc",fontWeight:800,marginBottom:12}}>الإعدادات ⚙️</h2>

      {/* Sync */}
      <div style={{...Cs,marginBottom:11,border:"1px solid rgba(96,165,250,0.35)"}}>
        <div style={{color:"#60a5fa",fontWeight:800,marginBottom:4,fontSize:14}}>📲 نقل البيانات</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginBottom:12,lineHeight:1.7}}>موبايل → تصدير → أرسلي الملف → لابتوب → استيراد ودمج ✅</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
          <button onClick={()=>exportData("mobile")} style={{...Bs("#60a5fa"),justifyContent:"center",padding:"9px",fontSize:12}}>📱 تصدير موبايل</button>
          <button onClick={()=>exportData("laptop")} style={{...Bs("rgba(96,165,250,0.25)"),justifyContent:"center",padding:"9px",fontSize:12,border:"1px solid rgba(96,165,250,0.4)"}}>💻 نسخة احتياطية</button>
        </div>
        <button onClick={()=>importRef.current.click()} style={{...Bs("#4ade80"),width:"100%",justifyContent:"center",padding:"10px",fontSize:13}}>🔀 استيراد ودمج</button>
        <input ref={importRef} type="file" accept=".json" style={{display:"none"}} onChange={handleImport}/>
        {mergeStatus&&(
          <div style={{marginTop:10,padding:10,borderRadius:9,background:mergeStatus.error?"rgba(248,113,113,0.12)":"rgba(74,222,128,0.12)",border:`1px solid ${mergeStatus.error?"rgba(248,113,113,0.35)":"rgba(74,222,128,0.35)"}`}}>
            {mergeStatus.error?<div style={{color:"#f87171",fontSize:12}}>❌ {mergeStatus.error}</div>:(
              <div>
                <div style={{color:"#4ade80",fontWeight:700,fontSize:12,marginBottom:6}}>✅ تم الدمج! +{mergeStatus.totalAdded} عنصر جديد</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,fontSize:11}}>
                  {Object.entries(mergeStatus.added).map(([k,v])=>v>0&&<div key={k} style={{color:"rgba(255,255,255,0.65)"}}>+{v} {k==="products"?"منتج":k==="sales"?"بيعة":k==="bazaars"?"بازار":k==="materials"?"مادة":k==="sessions"?"جلسة":"شراء"}</div>)}
                  {mergeStatus.totalAdded===0&&<div style={{color:"rgba(255,255,255,0.4)",gridColumn:"span 2"}}>كل البيانات موجودة أصلاً</div>}
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{marginTop:11,padding:9,background:"rgba(255,255,255,0.04)",borderRadius:8,fontSize:10,color:"rgba(255,255,255,0.4)",lineHeight:1.9}}>
          <div style={{color:"rgba(255,180,220,0.7)",fontWeight:600,marginBottom:3}}>للنقل من اللابتوب للفون:</div>
          <div>1️⃣ اللابتوب: تصدير → "نسخة احتياطية"</div>
          <div>2️⃣ أرسلي الملف للفون (واتساب/ايميل)</div>
          <div>3️⃣ الفون: افتحي الملف → "استيراد ودمج"</div>
        </div>
      </div>

      {/* Rate */}
      <div style={Cs}>
        <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:9}}>💰 سعر ساعة العمل</div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:9}}>
          <In type="number" value={rate} onChange={e=>setRate(e.target.value)} style={{flex:1}}/>
          <Sl value={currency} onChange={e=>setCurrency(e.target.value)} style={{width:"auto"}}><option>د.ع</option><option>$</option><option>€</option></Sl>
        </div>
        <div style={{padding:8,background:"rgba(255,180,220,0.07)",borderRadius:8,fontSize:11}}>
          {[15,30,60,120].map(m=><div key={m} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)"}}><span>{m} دقيقة</span><span style={{color:"#fbbf24"}}>{fmt(Math.round((m/60)*Number(rate)))} {currency}</span></div>)}
        </div>
      </div>

      {/* Categories */}
      <div style={{...Cs,marginTop:10}}>
        <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:9}}>🗂 أنواع المنتجات</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {cats.map(c=><div key={c.key} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"4px 9px"}}><span style={{fontSize:15}}>{c.icon}</span><span style={{fontSize:11,fontWeight:600,color:"#e8c8f0"}}>{c.key}</span><button onClick={()=>delCat(c.key)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:12,padding:0}}>✕</button></div>)}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <In value={newCat.icon} onChange={e=>setNewCat(f=>({...f,icon:e.target.value}))} style={{width:42}} placeholder="🧶"/>
          <In value={newCat.key} onChange={e=>setNewCat(f=>({...f,key:e.target.value}))} placeholder="اسم النوع الجديد" style={{flex:1}}/>
          <button onClick={addCat} style={{...Bs("#ff6eb4"),padding:"7px 11px"}}>+</button>
        </div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:6}}>💡 لا تنسي الحفظ بعد التعديل</div>
      </div>

      {/* Stats */}
      <div style={{...Cs,marginTop:10}}>
        <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:8}}>🗂 بياناتك</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,fontSize:11,marginBottom:10}}>
          <Rw l="المنتجات" v={(data.products||[]).length}/><Rw l="المواد" v={data.materials.length}/>
          <Rw l="البازارات" v={data.bazaars.length}/><Rw l="المبيعات" v={data.sales.length}/>
          <Rw l="الجلسات" v={(data.sessions||[]).length}/>
        </div>
        <button onClick={save} style={{...Bs("#ff6eb4"),width:"100%"}}>💾 حفظ الإعدادات</button>
      </div>
    </div>
  );
}



/* ─── SalesByDate ─────────────────────────────────────────────────────────────── */
function SalesByDate({sales,bazaars,products,cur,onEdit,onDel}) {
  const sorted=[...sales].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const grouped={};
  sorted.forEach(s=>{
    const d=s.date||"بدون تاريخ";
    if(!grouped[d]) grouped[d]=[];
    grouped[d].push(s);
  });
  const days=Object.keys(grouped);
  return (
    <div>
      {days.map((day,di)=>(
        <div key={day}>
          {/* Date separator */}
          <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0 8px"}}>
            <div style={{flex:1,height:1,background:"rgba(255,180,220,0.2)"}}/>
            <div style={{fontSize:11,color:"#ffb4dc",fontWeight:600,background:"rgba(255,180,220,0.1)",padding:"3px 10px",borderRadius:10}}>{day}</div>
            <div style={{flex:1,height:1,background:"rgba(255,180,220,0.2)"}}/>
          </div>
          {grouped[day].map(s=>{
            const p=products.find(x=>x.id===s.productId);
            return (
              <div key={s.id} style={{...Cs,marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:7}}>
                  {p?.image&&<img src={p.image} style={{width:36,height:36,borderRadius:7,objectFit:"cover",flexShrink:0}} alt=""/>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>
                      {s.productName}{s.qty>1&&<span style={{fontSize:11,color:"#fbbf24",marginRight:4}}>×{s.qty}</span>}
                      {s.isBundle&&<span style={{fontSize:10,background:"rgba(251,191,36,0.2)",color:"#fbbf24",borderRadius:5,padding:"1px 5px",marginRight:4}}>حزمة</span>}
                      <span style={{fontSize:10,background:"rgba(255,180,220,0.12)",color:"#ffb4dc",borderRadius:5,padding:"1px 5px",marginRight:4}}>{s.channel}</span>
                    </div>
                    {s.bazaarId&&<div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:3}}>🏪 {bazaars.find(b=>b.id===s.bazaarId)?.name||""}</div>}
                    <div style={{display:"flex",gap:8,fontSize:11}}>
                      <span style={{color:"#4ade80",fontWeight:700}}>💰 {fmt(s.total||0)} {cur}</span>
                      <span style={{color:(s.totalProfit||0)>=0?"#60a5fa":"#f87171"}}>ربح: {fmt(Math.round(s.totalProfit||0))} {cur}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    <button onClick={()=>onEdit(s)} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:"#fff",fontSize:13}}>✏️</button>
                    <button onClick={()=>onDel(s.id)} style={{background:"#f87171",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:"#fff",fontSize:13}}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── CustomerOrders ──────────────────────────────────────────────────────────── */
function CustomerOrders({data,update}) {
  const [form,setForm]=useState({text:"",type:"طلب",priority:"عادي"});
  const orders=data.customerOrders||[];

  const add=()=>{
    if(!form.text.trim()) return;
    update(prev=>({...prev,customerOrders:[...(prev.customerOrders||[]),{id:Date.now().toString(),text:form.text.trim(),type:form.type,priority:form.priority,done:false,date:new Date().toLocaleDateString("ar-IQ")}]}));
    setForm({text:"",type:"طلب",priority:"عادي"});
  };
  const toggle=id=>update(prev=>({...prev,customerOrders:(prev.customerOrders||[]).map(o=>o.id===id?{...o,done:!o.done}:o)}));
  const del=id=>confirmDel("حذف هذا الطلب؟",()=>update(prev=>({...prev,customerOrders:(prev.customerOrders||[]).filter(o=>o.id!==id)})));

  const pending=orders.filter(o=>!o.done);
  const done=orders.filter(o=>o.done);

  return (
    <div>
      <h2 style={{color:"#ffb4dc",fontWeight:800,marginBottom:12}}>طلبات الزبائن 📋</h2>

      <div style={{...Cs,marginBottom:12}}>
        <div style={{marginBottom:8}}><Lb>الطلب أو الاقتراح</Lb><In value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} placeholder="مثال: ميدالية باللون الأزرق، إعادة ستوك المداليات..."/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><Lb>النوع</Lb>
            <Sl value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
              <option>طلب زبون</option><option>إعادة ستوك</option><option>فكرة منتج جديد</option><option>ملاحظة</option>
            </Sl>
          </div>
          <div><Lb>الأولوية</Lb>
            <Sl value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
              <option>عادي</option><option>مهم</option><option>عاجل</option>
            </Sl>
          </div>
        </div>
        <button onClick={add} style={{...Bs("#ff6eb4"),width:"100%",justifyContent:"center"}}>+ إضافة</button>
      </div>

      {pending.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{color:"#ffb4dc",fontWeight:700,marginBottom:8,fontSize:12}}>⏳ قيد التنفيذ ({pending.length})</div>
          {pending.sort((a,b)=>a.priority==="عاجل"?-1:b.priority==="عاجل"?1:a.priority==="مهم"?-1:1).map(o=>(
            <div key={o.id} style={{...Cs,marginBottom:7,border:o.priority==="عاجل"?"1px solid rgba(248,113,113,0.45)":o.priority==="مهم"?"1px solid rgba(251,191,36,0.35)":undefined}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div onClick={()=>toggle(o.id)} style={{width:20,height:20,borderRadius:6,border:"2px solid rgba(255,180,220,0.45)",background:"transparent",cursor:"pointer",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{o.text}</div>
                  <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,background:"rgba(255,180,220,0.12)",color:"#ffb4dc",borderRadius:5,padding:"1px 6px"}}>{o.type}</span>
                    {o.priority!=="عادي"&&<span style={{fontSize:10,background:o.priority==="عاجل"?"rgba(248,113,113,0.2)":"rgba(251,191,36,0.2)",color:o.priority==="عاجل"?"#f87171":"#fbbf24",borderRadius:5,padding:"1px 6px"}}>{o.priority}</span>}
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{o.date}</span>
                  </div>
                </div>
                <button onClick={()=>del(o.id)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:16,padding:"4px",flexShrink:0}}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {done.length>0&&(
        <div>
          <div style={{color:"rgba(255,255,255,0.35)",fontWeight:700,marginBottom:8,fontSize:12}}>✅ منجز ({done.length})</div>
          {done.map(o=>(
            <div key={o.id} style={{...Cs,marginBottom:6,opacity:0.5}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div onClick={()=>toggle(o.id)} style={{width:20,height:20,borderRadius:6,border:"2px solid #4ade80",background:"#4ade80",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,color:"#fff"}}>✓</div>
                <div style={{flex:1,textDecoration:"line-through",fontSize:12,color:"rgba(255,255,255,0.5)"}}>{o.text}</div>
                <button onClick={()=>del(o.id)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:14,padding:"4px",flexShrink:0}}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!orders.length&&<div style={{textAlign:"center",padding:35,color:"rgba(255,255,255,0.3)"}}><div style={{fontSize:44}}>📋</div><div style={{marginTop:8}}>ما في طلبات بعد</div></div>}
    </div>
  );
}

/* ─── SalesSearch ────────────────────────────────────────────────────────────── */
function SalesSearch({available,editSale,form,setForm,catIcon,cur,fmt}) {
  const [query,setQuery]=useState("");
  const [showSug,setShowSug]=useState(false);
  const selectedProd=available.find(p=>p.id===form.productId);

  const filtered=available.filter(p=>!query||p.name.includes(query)||p.name.toLowerCase().includes(query.toLowerCase()));

  const select=(p)=>{
    setForm(f=>({...f,productId:p.id,customPrice:""}));
    setQuery(p.name);
    setShowSug(false);
  };

  return (
    <div style={{position:"relative"}}>
      <input
        value={selectedProd?selectedProd.name:query}
        onChange={e=>{setQuery(e.target.value);setForm(f=>({...f,productId:"",customPrice:""}));setShowSug(true);}}
        onFocus={()=>setShowSug(true)}
        placeholder="ابحثي باسم المنتج..."
        style={{...Ns,width:"100%"}}
      />
      {showSug&&filtered.length>0&&(
        <div style={{position:"absolute",top:"100%",right:0,left:0,background:"#1e1040",border:"1px solid rgba(255,180,220,0.3)",borderRadius:8,zIndex:50,maxHeight:200,overflowY:"auto"}}>
          {filtered.slice(0,6).map(p=>(
            <div key={p.id} onMouseDown={()=>select(p)} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#ffb4dc",fontWeight:600}}>{catIcon(p.categoryKey)} {p.name}</span>
              <span style={{color:"rgba(255,255,255,0.45)",fontSize:10}}>{p.readyCount} جاهز · {fmt(p.suggestedPrice)} {cur}</span>
            </div>
          ))}
        </div>
      )}
      {editSale&&!available.find(p=>p.id===editSale.productId)&&(
        <div style={{fontSize:11,color:"#fbbf24",marginTop:4}}>المنتج: {editSale.productName}</div>
      )}
    </div>
  );
}

/* ─── Shared styles ───────────────────────────────────────────────────────────── */
const Cs={background:"rgba(255,255,255,0.06)",borderRadius:12,padding:12,border:"1px solid rgba(255,255,255,0.08)",backdropFilter:"blur(10px)"};
const Ns={width:"100%",background:"rgba(255,255,255,0.09)",border:"1px solid rgba(255,180,220,0.25)",borderRadius:8,padding:"8px 10px",color:"#f0e6ff",fontFamily:"inherit",fontSize:16,boxSizing:"border-box"};
function Bs(bg){return{background:bg,border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4};}
function Lb({children}){return <div style={{fontSize:11,color:"rgba(255,200,240,0.7)",marginBottom:3,fontWeight:500}}>{children}</div>;}
function In({style,...p}){return <input style={{...Ns,...style}} {...p}/>;}
function Sl({children,style,...p}){return <select style={{...Ns,...style,cursor:"pointer"}} {...p}>{children}</select>;}
function Rw({l,v,b,c}){return <div style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}><span style={{color:"rgba(255,200,240,0.5)",fontSize:11}}>{l}</span><span style={{fontWeight:b?700:400,color:c||"#f0e6ff",fontSize:11}}>{v}</span></div>;}
