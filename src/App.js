
import React,{useState,useEffect,useRef,useCallback}from"react";
const THEMES={pinkDark:{name:"وردي داكن",icon:"🌸",dark:true,bg:"#16002a",bgGrad:"linear-gradient(160deg,#1a0a2e,#16213e,#0f3460)",primary:"#ff6eb4",primaryGrad:"linear-gradient(135deg,#ff6eb4,#e0409a)",accent:"#ffb4dc",accentFaint:"rgba(255,180,220,0.18)",accentVeryFaint:"rgba(255,180,220,0.07)",card:"rgba(255,255,255,0.08)",cardBorder:"rgba(255,255,255,0.1)",navBg:"rgba(18,6,35,0.97)",headerBg:"rgba(18,6,35,0.85)",text:"#f0e6ff",textSub:"rgba(255,200,240,0.65)",textFaint:"rgba(255,200,240,0.38)",green:"#4ade80",greenFaint:"rgba(74,222,128,0.15)",blue:"#60a5fa",blueFaint:"rgba(96,165,250,0.15)",yellow:"#fbbf24",yellowFaint:"rgba(251,191,36,0.15)",red:"#f87171",redFaint:"rgba(248,113,113,0.15)",inputBg:"rgba(255,255,255,0.09)",inputBorder:"rgba(255,180,220,0.28)",separator:"rgba(255,255,255,0.08)"},pinkLight:{name:"وردي فاتح",icon:"🌷",dark:false,bg:"#fff0f8",bgGrad:"linear-gradient(160deg,#fff0f8,#fce4f4,#f8d0ee)",primary:"#d4308a",primaryGrad:"linear-gradient(135deg,#e0409a,#b02070)",accent:"#b02070",accentFaint:"rgba(176,32,112,0.12)",accentVeryFaint:"rgba(176,32,112,0.05)",card:"rgba(255,255,255,0.85)",cardBorder:"rgba(212,48,138,0.18)",navBg:"rgba(255,240,250,0.97)",headerBg:"rgba(255,240,250,0.9)",text:"#3a0028",textSub:"rgba(80,10,50,0.65)",textFaint:"rgba(80,10,50,0.4)",green:"#16a34a",greenFaint:"rgba(22,163,74,0.12)",blue:"#1d4ed8",blueFaint:"rgba(29,78,216,0.1)",yellow:"#b45309",yellowFaint:"rgba(180,83,9,0.1)",red:"#dc2626",redFaint:"rgba(220,38,38,0.1)",inputBg:"rgba(255,255,255,0.9)",inputBorder:"rgba(212,48,138,0.28)",separator:"rgba(0,0,0,0.07)"},blueDark:{name:"أزرق داكن",icon:"🌊",dark:true,bg:"#020d1f",bgGrad:"linear-gradient(160deg,#0a1628,#0d1f3c,#091525)",primary:"#3b82f6",primaryGrad:"linear-gradient(135deg,#3b82f6,#1d4ed8)",accent:"#93c5fd",accentFaint:"rgba(147,197,253,0.18)",accentVeryFaint:"rgba(147,197,253,0.07)",card:"rgba(255,255,255,0.07)",cardBorder:"rgba(147,197,253,0.12)",navBg:"rgba(2,13,31,0.97)",headerBg:"rgba(2,13,31,0.85)",text:"#e8f4ff",textSub:"rgba(147,197,253,0.7)",textFaint:"rgba(147,197,253,0.38)",green:"#34d399",greenFaint:"rgba(52,211,153,0.15)",blue:"#60a5fa",blueFaint:"rgba(96,165,250,0.15)",yellow:"#fbbf24",yellowFaint:"rgba(251,191,36,0.15)",red:"#f87171",redFaint:"rgba(248,113,113,0.15)",inputBg:"rgba(255,255,255,0.08)",inputBorder:"rgba(147,197,253,0.28)",separator:"rgba(255,255,255,0.07)"},blueLight:{name:"أزرق فاتح",icon:"☁️",dark:false,bg:"#f0f7ff",bgGrad:"linear-gradient(160deg,#eff6ff,#dbeafe,#e0f2fe)",primary:"#1d4ed8",primaryGrad:"linear-gradient(135deg,#2563eb,#1d4ed8)",accent:"#1d4ed8",accentFaint:"rgba(29,78,216,0.12)",accentVeryFaint:"rgba(29,78,216,0.05)",card:"rgba(255,255,255,0.88)",cardBorder:"rgba(29,78,216,0.15)",navBg:"rgba(240,247,255,0.97)",headerBg:"rgba(240,247,255,0.9)",text:"#0f2451",textSub:"rgba(15,36,81,0.65)",textFaint:"rgba(15,36,81,0.4)",green:"#16a34a",greenFaint:"rgba(22,163,74,0.1)",blue:"#1d4ed8",blueFaint:"rgba(29,78,216,0.1)",yellow:"#b45309",yellowFaint:"rgba(180,83,9,0.1)",red:"#dc2626",redFaint:"rgba(220,38,38,0.1)",inputBg:"rgba(255,255,255,0.92)",inputBorder:"rgba(29,78,216,0.25)",separator:"rgba(0,0,0,0.06)"}};
const DEFAULT_CATEGORIES=[{key:"ميداليات",icon:"🏅"},{key:"ملابس",icon:"👗"},{key:"حقائب",icon:"👜"},{key:"إكسسوارات",icon:"💎"},{key:"ديكور بيت",icon:"🏠"},{key:"منتجات شعر",icon:"💇"}];
const PRODUCT_STATUSES=["قيد العمل","مكتمل","مباع"];
const MAIN_TABS=[{key:"home",label:"الرئيسية",icon:"⊞"},{key:"products",label:"المنتجات",icon:"🧶"},{key:"sales",label:"المبيعات",icon:"💰"},{key:"bazaars",label:"البازارات",icon:"🛍️"},{key:"orders",label:"طلبات",icon:"📋"}];
const initialState={categories:DEFAULT_CATEGORIES,products:[],materials:[],purchases:[],bazaars:[],sales:[],sessions:[],customerOrders:[],settings:{hourlyRate:3000,currency:"د.ع"},ui:{theme:"pinkDark",fontSize:"medium",btnSize:"medium"}};
function loadData(){try{const s=localStorage.getItem("kokla_v7");return s?{...initialState,...JSON.parse(s)}:initialState;}catch{return initialState;}}
function saveData(d){try{localStorage.setItem("kokla_v7",JSON.stringify(d));}catch{}}
function fmt(n){return Number(n||0).toLocaleString("ar-IQ");}
function fmtTime(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
function calcPrice(mins,matCost,profit,discount,hr){const labor=(Number(mins||0)/60)*hr;const total=labor+Number(matCost||0);const sug=Math.ceil((total*(1+Number(profit||30)/100))/250)*250;const dis=Math.round(sug*(1-Number(discount||0)/100));return{laborCost:labor,totalCost:total,suggested:sug,discounted:dis};}
function todayStr(){return new Date().toLocaleDateString("ar-IQ");}
function confirmDel(msg,fn){if(window.confirm(msg||"تأكيد الحذف؟"))fn();}
function useSwipe(onLeft,onRight){const sx=useRef(null),sy=useRef(null);return{onTouchStart:e=>{sx.current=e.touches[0].clientX;sy.current=e.touches[0].clientY;},onTouchEnd:e=>{if(sx.current===null)return;const dx=e.changedTouches[0].clientX-sx.current;const dy=e.changedTouches[0].clientY-sy.current;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>55){dx>0?onRight():onLeft();}sx.current=null;}};}
const calcPriceFn=calcPrice;
const INS={width:"100%",background:"var(--inputBg,rgba(255,255,255,0.09))",border:"1px solid var(--inputBorder,rgba(255,180,220,0.28))",borderRadius:8,padding:"9px 11px",color:"var(--text,#f0e6ff)",fontFamily:"inherit",fontSize:16,boxSizing:"border-box"};

function CDS(T){return{background:T?.card||"rgba(255,255,255,0.07)",borderRadius:13,padding:13,border:`1px solid ${T?.cardBorder||"rgba(255,255,255,0.1)"}`,backdropFilter:"blur(10px)"};}
function BTS(bg,T){return{background:bg,border:"none",borderRadius:9,padding:"8px 14px",cursor:"pointer",color:bg===T?.card?"var(--text,#f0e6ff)":"#fff",fontFamily:"inherit",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4};}
function LB({T,children}){return React.createElement("div",{style:{fontSize:11,color:T?.textSub||"rgba(255,200,240,0.65)",marginBottom:3,fontWeight:500}},children);}
function IN({T,style,...p}){return React.createElement("input",{style:{...INS,...style},...p});}
function SL({T,children,style,...p}){return React.createElement("select",{style:{...INS,...style,cursor:"pointer"},...p},children);}
function RW({l,v,b,c,T}){return React.createElement("div",{style:{display:"flex",justifyContent:"space-between",padding:"3px 0"}},React.createElement("span",{style:{color:T?.textFaint||"rgba(255,200,240,0.38)",fontSize:11}},l),React.createElement("span",{style:{fontWeight:b?700:400,color:c||T?.text||"#f0e6ff",fontSize:11}},v));}

export default function App(){
  const[data,setData]=useState(loadData);
  const[tab,setTab]=useState("home");
  const[menuOpen,setMenuOpen]=useState(false);
  const[bazaarMode,setBazaarMode]=useState(null);
  const[timerSec,setTimerSec]=useState(0);
  const[running,setRunning]=useState(false);
  const[paused,setPaused]=useState(false);
  const[activeSession,setActiveSession]=useState(null);
  const timerRef=useRef(null);
  useEffect(()=>{saveData(data);},[data]);
  useEffect(()=>{if(running&&!paused)timerRef.current=setInterval(()=>setTimerSec(s=>s+1),1000);else clearInterval(timerRef.current);return()=>clearInterval(timerRef.current);},[running,paused]);
  const update=useCallback(fn=>setData(p=>fn(p)),[]);
  const cur=data.settings.currency;
  const hr=data.settings.hourlyRate||3000;
  const ui=data.ui||initialState.ui;
  const T=THEMES[ui.theme]||THEMES.pinkDark;
  const fScale=ui.fontSize==="large"?1.12:ui.fontSize==="small"?0.88:1;
  const bScale=ui.btnSize==="large"?1.18:ui.btnSize==="small"?0.85:1;
  const catIcon=key=>(data.categories||DEFAULT_CATEGORIES).find(c=>c.key===key)?.icon||"🧶";
  const alerts=[];
  (data.materials||[]).forEach(m=>{if(Number(m.quantity)<=Number(m.minAlert||0))alerts.push({type:"stock",msg:`مخزون "${m.name}" قارب على النفاد`,color:T.red});});
  (data.products||[]).forEach(p=>{if(p.totalCost>0&&p.suggestedPrice>0&&p.suggestedPrice<p.totalCost*1.1)alerts.push({type:"margin",msg:`"${p.name}" هامش ربحه منخفض`,color:T.yellow});});
  const pm={};data.sales.forEach(s=>{const id=s.productId||s.productName;if(!pm[id])pm[id]={name:s.productName,qty:0,profit:0};pm[id].qty+=Number(s.qty||1);pm[id].profit+=Number(s.totalProfit||0);});
  const pa=Object.values(pm);
  const stats={totalSales:data.sales.reduce((s,x)=>s+Number(x.total||0),0),totalProfit:data.sales.reduce((s,x)=>s+Number(x.totalProfit||0),0),totalMaterials:data.purchases.reduce((s,x)=>s+Number(x.totalCost||0),0),readyTotal:(data.products||[]).reduce((s,p)=>s+Number(p.readyCount||0),0),bestQty:pa.sort((a,b)=>b.qty-a.qty)[0],bestProfit:[...pa].sort((a,b)=>b.profit-a.profit)[0]};
  const SWIPE_TABS=MAIN_TABS.map(t=>t.key);
  const swipeH=useSwipe(()=>setTab(t=>{const i=SWIPE_TABS.indexOf(t);return i<SWIPE_TABS.length-1?SWIPE_TABS[i+1]:t;}),()=>setTab(t=>{const i=SWIPE_TABS.indexOf(t);return i>0?SWIPE_TABS[i-1]:t;}));
  const cssVars={"--bg":T.bg,"--primary":T.primary,"--accent":T.accent,"--card":T.card,"--cardBorder":T.cardBorder,"--text":T.text,"--textSub":T.textSub,"--textFaint":T.textFaint,"--inputBg":T.inputBg,"--inputBorder":T.inputBorder,"--sep":T.separator,"--green":T.green,"--blue":T.blue,"--yellow":T.yellow,"--red":T.red,"--greenFaint":T.greenFaint,"--blueFaint":T.blueFaint,"--yellowFaint":T.yellowFaint,"--redFaint":T.redFaint,"--accentFaint":T.accentFaint,"--accentVF":T.accentVeryFaint};
  if(bazaarMode){const baz=data.bazaars.find(b=>b.id===bazaarMode);if(baz)return <BazaarMode baz={baz} data={data} update={update} T={T} cur={cur} catIcon={catIcon} cssVars={cssVars} fScale={fScale} onExit={()=>setBazaarMode(null)}/>;}
  return(
    <div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Tajawal','Cairo',sans-serif",direction:"rtl",color:T.text,fontSize:`${fScale}rem`,...cssVars}}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet"/>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
      <div style={{background:T.headerBg,backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.accentFaint}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div onClick={()=>setTab("home")} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}}>
          <span style={{fontSize:26}}>🧶</span>
          <div><div style={{fontWeight:800,fontSize:20,color:T.accent,lineHeight:1}}>كوكله</div><div style={{fontSize:9,color:T.textFaint}}>مدير أعمالك الذكي ✨</div></div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {alerts.length>0&&<div onClick={()=>setTab("alerts")} style={{background:T.redFaint,border:`1px solid ${T.red}60`,borderRadius:16,padding:"4px 10px",fontSize:11,color:T.red,cursor:"pointer"}}>🔔 {alerts.length}</div>}
          {running&&<div style={{background:paused?T.yellowFaint:T.redFaint,border:`1px solid ${paused?T.yellow:T.red}60`,borderRadius:16,padding:"4px 10px",fontSize:12,color:paused?T.yellow:T.red,display:"flex",alignItems:"center",gap:4}}><span style={{animation:paused?"none":"pulse 1s infinite"}}>{paused?"⏸":"⏱"}</span>{fmtTime(timerSec)}</div>}
          <div style={{position:"relative"}}>
            <button onClick={()=>setMenuOpen(o=>!o)} style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"8px 10px",cursor:"pointer",color:T.text,display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
              <div style={{width:16,height:2,background:T.text,borderRadius:2}}/><div style={{width:16,height:2,background:T.text,borderRadius:2}}/><div style={{width:16,height:2,background:T.text,borderRadius:2}}/>
            </button>
            {menuOpen&&<div style={{position:"absolute",top:"110%",left:0,background:T.navBg,backdropFilter:"blur(20px)",border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"6px",zIndex:300,minWidth:170,boxShadow:"0 10px 40px rgba(0,0,0,0.4)"}}>
              {[{key:"inventory",label:"المخزون",icon:"📦"},{key:"session",label:"جلسة عمل",icon:"⏱"},{key:"monthly",label:"الإحصائيات",icon:"📅"},{key:"settings",label:"الإعدادات",icon:"⚙️"}].map(t=>(
                <button key={t.key} onClick={()=>{setTab(t.key);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 13px",background:tab===t.key?T.accentFaint:"transparent",border:"none",borderRadius:10,cursor:"pointer",color:T.text,fontFamily:"inherit",fontSize:13,fontWeight:tab===t.key?700:400}}>
                  <span style={{fontSize:17}}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>}
          </div>
        </div>
      </div>
      <div style={{paddingBottom:90,...(MAIN_TABS.some(t=>t.key===tab)?swipeH:{})}} onClick={()=>menuOpen&&setMenuOpen(false)}>
        <div style={{padding:"16px 14px",maxWidth:900,margin:"0 auto"}}>
          {tab==="home"&&<Dashboard stats={stats} data={data} cur={cur} catIcon={catIcon} T={T} setTab={setTab} alerts={alerts} setBazaarMode={setBazaarMode}/>}
          {tab==="products"&&<Products data={data} update={update} cur={cur} hr={hr} catIcon={catIcon} T={T}/>}
          {tab==="sales"&&<Sales data={data} update={update} cur={cur} catIcon={catIcon} T={T}/>}
          {tab==="bazaars"&&<Bazaars data={data} update={update} cur={cur} T={T} setBazaarMode={setBazaarMode}/>}
          {tab==="orders"&&<CustomerOrders data={data} update={update} T={T}/>}
          {tab==="inventory"&&<Inventory data={data} update={update} cur={cur} T={T}/>}
          {tab==="session"&&<Session data={data} update={update} cur={cur} hr={hr} catIcon={catIcon} T={T} timerSec={timerSec} running={running} paused={paused} setRunning={setRunning} setPaused={setPaused} setTimerSec={setTimerSec} activeSession={activeSession} setActiveSession={setActiveSession}/>}
          {tab==="monthly"&&<Monthly data={data} cur={cur} T={T}/>}
          {tab==="settings"&&<Settings data={data} update={update} T={T} ui={ui} fScale={fScale} bScale={bScale}/>}
          {tab==="alerts"&&<AlertsPage alerts={alerts} T={T}/>}
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,right:0,left:0,background:T.navBg,backdropFilter:"blur(20px)",borderTop:`1px solid ${T.accentFaint}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {MAIN_TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,background:"transparent",border:"none",padding:"10px 4px 8px",cursor:"pointer",color:tab===t.key?T.primary:T.textFaint,fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:tab===t.key?24:20}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:tab===t.key?700:400}}>{t.label}</span>
            {tab===t.key&&<div style={{width:4,height:4,borderRadius:"50%",background:T.primary}}/>}
          </button>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:var(--primary);border-radius:3px}input,select,textarea{outline:none;font-size:16px!important;color:var(--text)!important;background:var(--inputBg)!important;border-color:var(--inputBorder)!important;}select option{background:${T.dark?"#0a0a1a":"#fff"};color:var(--text)}button:active{transform:scale(0.95)}h2{color:var(--accent)!important}`}</style>
    </div>
  );
}

function PricePreview({totalGiven,totalCost,totalItems,T,cur}){
  if(!totalGiven) return null;
  const given=Number(totalGiven);
  const rem=given-totalCost;
  const ppp=totalItems>0?rem/totalItems:0;
  return(
    <div style={{marginTop:8,padding:"9px 11px",background:ppp>=0?T.greenFaint:T.redFaint,borderRadius:9,fontSize:12,border:`1px solid ${ppp>=0?T.green:T.red}25`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:T.textFaint}}>تكلفة المواد الكلية</span><span style={{fontWeight:600}}>{fmt(Math.round(totalCost))} {cur}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:T.textFaint}}>ربح/قطعة</span><span style={{color:ppp>=0?T.green:T.red,fontWeight:700}}>{fmt(Math.round(ppp))} {cur}</span></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textFaint}}>إجمالي الربح</span><span style={{color:ppp>=0?T.green:T.red,fontWeight:800}}>{fmt(Math.round(ppp*totalItems))} {cur}</span></div>
    </div>
  );
}

function BazaarMode({baz,data,update,T,cur,catIcon,cssVars,fScale,onExit}){
  const[phase,setPhase]=useState("sell");
  const[selProduct,setSelProduct]=useState(null);
  const[cart,setCart]=useState([]);
  const[totalGiven,setTotalGiven]=useState("");
  const[flash,setFlash]=useState(null);
  const[search,setSearch]=useState("");
  const available=(data.products||[]).filter(p=>Number(p.readyCount||0)>0&&(!search||p.name.includes(search)));
  const bSales=data.sales.filter(s=>s.bazaarId===baz.id);
  const revenue=bSales.reduce((s,x)=>s+Number(x.total||0),0);
  const costs=Number(baz.totalCost||0);
  const addToCart=(p)=>{const ex=cart.find(x=>x.id===p.id);if(ex)setCart(c=>c.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x));else setCart(c=>[...c,{id:p.id,name:p.name,image:p.image,categoryKey:p.categoryKey,suggestedPrice:p.suggestedPrice,totalCost:p.totalCost,readyCount:p.readyCount,qty:1}]);setSelProduct(null);};
  const removeFromCart=(id)=>setCart(c=>c.filter(x=>x.id!==id));
  const changeQty=(id,q)=>setCart(c=>c.map(x=>x.id===id?{...x,qty:Math.max(1,Number(q)||1)}:x));
  const totalItems=cart.reduce((s,x)=>s+x.qty,0);
  const totalCost=cart.reduce((s,x)=>s+x.totalCost*x.qty,0);
  const confirmSale=()=>{
    const given=Number(totalGiven)||cart.reduce((s,x)=>s+x.suggestedPrice*x.qty,0);
    const remaining=given-totalCost;
    const profitPerPiece=totalItems>0?remaining/totalItems:0;
    const saleId=Date.now().toString();
    const sales=cart.map((item,i)=>{
      const unitPrice=item.totalCost+profitPerPiece;
      const total=unitPrice*item.qty;
      const profit=profitPerPiece*item.qty;
      return{id:`${saleId}-${i}`,productId:item.id,productName:item.name,bazaarId:baz.id,qty:item.qty,unitPrice:Math.round(unitPrice),total:Math.round(total),totalProfit:Math.round(profit),channel:"بازار",date:todayStr(),unitCost:item.totalCost,isBundle:cart.length>1};
    });
    update(prev=>({...prev,products:prev.products.map(p=>{const ci=cart.find(x=>x.id===p.id);if(!ci)return p;return{...p,readyCount:Math.max(0,(Number(p.readyCount)||0)-ci.qty),soldCount:(Number(p.soldCount)||0)+ci.qty};}),sales:[...prev.sales,...sales]}));
    setFlash({items:cart.length,total:given,qty:totalItems});
    setCart([]);setTotalGiven("");setSearch("");
    setTimeout(()=>setFlash(null),2500);
  };
  const summary=[];
  if(phase==="summary"){
    (data.products||[]).forEach(p=>{
      const sold=bSales.filter(s=>s.productId===p.id).reduce((s,x)=>s+Number(x.qty||1),0);
      if(sold>0||(data.sales.filter(s=>s.bazaarId===baz.id&&s.productId===p.id).length>0))
        summary.push({id:p.id,name:p.name,image:p.image,catIcon:catIcon(p.categoryKey),sold,ready:Number(p.readyCount||0)});
    });
  }
  return(
    <div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Tajawal','Cairo',sans-serif",direction:"rtl",color:T.text,fontSize:`${fScale}rem`,...cssVars}}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet"/>
      {flash&&<div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:T.green,color:"#fff",borderRadius:20,padding:"20px 32px",fontSize:18,fontWeight:800,zIndex:500,textAlign:"center",animation:"slideUp 0.3s ease",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>✅ تم البيع!<br/><span style={{fontSize:13,fontWeight:400}}>{flash.qty} قطعة — {fmt(flash.total)} {cur}</span></div>}
      <div style={{background:T.headerBg,backdropFilter:"blur(20px)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.accentFaint}`,position:"sticky",top:0,zIndex:100}}>
        <div><div style={{fontWeight:800,fontSize:17,color:T.accent}}>🛍️ {baz.name}</div><div style={{fontSize:10,color:T.textFaint}}>وضع البازار النشط</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{background:T.greenFaint,border:`1px solid ${T.green}40`,borderRadius:10,padding:"5px 11px",textAlign:"center"}}>
            <div style={{fontSize:9,color:T.textFaint}}>المبيعات</div>
            <div style={{fontSize:14,fontWeight:800,color:T.green}}>{fmt(revenue)} {cur}</div>
          </div>
          <button onClick={()=>setPhase(p=>p==="sell"?"summary":"sell")} style={{...BTS(T.blue,T),fontSize:11,padding:"6px 10px"}}>{phase==="sell"?"📊 ملخص":"← بيع"}</button>
          <button onClick={onExit} style={{...BTS(T.red,T),fontSize:11,padding:"6px 10px"}}>✕ خروج</button>
        </div>
      </div>
      {phase==="sell"&&(
        <div style={{padding:"12px 14px",maxWidth:700,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:14}}>
            <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:11,padding:"9px",textAlign:"center"}}><div style={{fontSize:17,fontWeight:800,color:T.green}}>{bSales.length}</div><div style={{fontSize:9,color:T.textFaint}}>مبيعة</div></div>
            <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:11,padding:"9px",textAlign:"center"}}><div style={{fontSize:17,fontWeight:800,color:revenue-costs>=0?T.green:T.red}}>{fmt(revenue-costs)}</div><div style={{fontSize:9,color:T.textFaint}}>صافي ربح</div></div>
            <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:11,padding:"9px",textAlign:"center"}}><div style={{fontSize:17,fontWeight:800,color:T.blue}}>{bSales.reduce((s,x)=>s+Number(x.qty||1),0)}</div><div style={{fontSize:9,color:T.textFaint}}>قطعة</div></div>
          </div>
          {cart.length>0&&(
            <div style={{...CDS(T),marginBottom:12,border:`1px solid ${T.yellow}40`}}>
              <div style={{fontWeight:700,fontSize:13,color:T.yellow,marginBottom:9}}>🛒 سلة الزبون ({totalItems} قطعة)</div>
              {cart.map(item=>(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.separator}`}}>
                  {item.image?<img src={item.image} style={{width:32,height:32,borderRadius:6,objectFit:"cover",flexShrink:0}} alt=""/>:<span style={{fontSize:18,flexShrink:0}}>{catIcon(item.categoryKey)}</span>}
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600}}>{item.name}</div><div style={{fontSize:10,color:T.textFaint}}>{fmt(item.suggestedPrice)} {cur}/قطعة</div></div>
                  <input type="number" min="1" value={item.qty} onChange={e=>changeQty(item.id,e.target.value)} style={{...INS,width:50,padding:"4px 6px",fontSize:14}}/>
                  <button onClick={()=>removeFromCart(item.id)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:16,padding:"4px"}}>✕</button>
                </div>
              ))}
              <div style={{marginTop:10}}>
                <LB T={T}>السعر الكلي اللي أعطاكِ (اتركي فارغ للمقترح)</LB>
                <IN type="number" value={totalGiven} onChange={e=>setTotalGiven(e.target.value)} placeholder={String(cart.reduce((s,x)=>s+x.suggestedPrice*x.qty,0))} T={T}/>
              </div>
              <PricePreview totalGiven={totalGiven} totalCost={totalCost} totalItems={totalItems} T={T} cur={cur}/>
              <button onClick={confirmSale} style={{...BTS(T.green,T),width:"100%",justifyContent:"center",padding:"13px",fontSize:15,fontWeight:800,marginTop:11}}>✅ تأكيد البيع</button>
            </div>
          )}
          <div style={{marginBottom:9}}><IN value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 ابحثي عن منتج..." T={T}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {available.map((p,pi)=>(
              <div key={p.id} onClick={()=>addToCart(p)} style={{background:T.card,border:`1px solid ${cart.find(x=>x.id===p.id)?T.yellow:T.cardBorder}`,borderRadius:13,padding:"11px",cursor:"pointer",position:"relative",animation:"slideUp 0.2s ease"}}>
                {cart.find(x=>x.id===p.id)&&<div style={{position:"absolute",top:7,left:7,background:T.yellow,color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{cart.find(x=>x.id===p.id).qty}</div>}
                {p.image?<img src={p.image} style={{width:"100%",height:85,objectFit:"cover",borderRadius:8,marginBottom:7}} alt=""/>:<div style={{width:"100%",height:65,background:T.accentVeryFaint,borderRadius:8,marginBottom:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{catIcon(p.categoryKey)}</div>}
                <div style={{fontSize:9,color:T.primary,fontWeight:700,marginBottom:1}}>{`K${String(pi+1).padStart(3,"0")}`}</div>
                <div style={{fontWeight:700,fontSize:12,marginBottom:3}}>{p.name}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:T.yellow,fontWeight:700}}>{fmt(p.suggestedPrice)} {cur}</span>
                  <span style={{fontSize:10,background:T.greenFaint,color:T.green,borderRadius:5,padding:"1px 5px"}}>✅{p.readyCount}</span>
                </div>
              </div>
            ))}
          </div>
          {!available.length&&<div style={{textAlign:"center",padding:40,color:T.textFaint}}><div style={{fontSize:44}}>📦</div><div style={{marginTop:8}}>ما في قطع جاهزة</div></div>}
        </div>
      )}
      {phase==="summary"&&(
        <div style={{padding:"14px",maxWidth:700,margin:"0 auto"}}>
          <div style={{...CDS(T),marginBottom:12,border:`1px solid ${T.green}40`}}>
            <div style={{fontWeight:800,fontSize:15,color:T.green,marginBottom:10}}>📊 ملخص البازار</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
              <RW l="إجمالي المبيعات" v={`${fmt(revenue)} ${cur}`} c={T.green} b T={T}/>
              <RW l="مصاريف البازار" v={`${fmt(costs)} ${cur}`} c={T.red} T={T}/>
              <RW l="صافي الربح" v={`${fmt(Math.round(revenue-costs))} ${cur}`} c={revenue-costs>=0?T.green:T.red} b T={T}/>
              <RW l="عدد المبيعات" v={bSales.length} T={T}/>
            </div>
          </div>
          {summary.length>0&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:T.accent,fontWeight:700,marginBottom:9}}>📦 أداء المنتجات</div>
              {summary.map((p,i)=>{
                const total=p.sold+p.ready;
                const pct=total>0?Math.round((p.sold/total)*100):0;
                const barColor=pct>=70?T.green:pct>=40?T.yellow:T.red;
                return(
                  <div key={i} style={{...CDS(T),marginBottom:8,border:`1px solid ${barColor}30`}}>
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
                      {p.image?<img src={p.image} style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0}} alt=""/>:<span style={{fontSize:22,flexShrink:0}}>{p.catIcon}</span>}
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{p.name}</div>
                        <div style={{display:"flex",gap:10,fontSize:11}}>
                          <span style={{color:T.green}}>✅ انباع: <strong>{p.sold}</strong></span>
                          <span style={{color:T.textFaint}}>📦 باقي: <strong>{p.ready}</strong></span>
                          <span style={{color:T.textSub}}>من {total}</span>
                        </div>
                      </div>
                      <div style={{textAlign:"center",minWidth:44}}><div style={{fontSize:17,fontWeight:800,color:barColor}}>{pct}%</div></div>
                    </div>
                    <div style={{background:T.separator,borderRadius:4,height:7,overflow:"hidden",marginBottom:5}}><div style={{width:`${pct}%`,height:"100%",background:barColor,borderRadius:4}}/></div>
                    {pct>=70&&<div style={{fontSize:11,color:T.green,fontWeight:600}}>⭐ طلب عالي — احضري أكثر المرة الجاية!</div>}
                    {pct<30&&p.sold>0&&<div style={{fontSize:11,color:T.yellow}}>💡 مبيعات قليلة — قللي الكمية المرة الجاية</div>}
                    {pct===0&&<div style={{fontSize:11,color:T.red}}>⚠️ ما انباع منه شي</div>}
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={onExit} style={{...BTS(T.primary,T),width:"100%",justifyContent:"center",padding:"14px",fontSize:15,fontWeight:800}}>✅ إنهاء البازار والرجوع للقائمة</button>
        </div>
      )}
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}*{box-sizing:border-box}input,select{outline:none;font-size:16px!important;}button:active{transform:scale(0.95)}`}</style>
    </div>
  );
}

function Dashboard({stats,data,cur,catIcon,T,setTab,alerts,setBazaarMode}){
  const parseDate2=d=>{if(!d)return 0;const p=d.split("/");if(p.length===3&&p[2].length===4)return new Date(`${p[2]}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}`).getTime();return new Date(d).getTime()||0;};
  const recent=[...data.sales].sort((a,b)=>{const dd=parseDate2(b.date)-parseDate2(a.date);return dd!==0?dd:(b.id||"").localeCompare(a.id||"");}).slice(0,5);
  const activeBazaars=data.bazaars.filter(b=>{if(!b.date)return false;const bd=new Date(b.date.split("/").reverse().join("-"));const today=new Date();today.setHours(0,0,0,0);bd.setHours(0,0,0,0);return bd>=today;});
  return(
    <div>
      <h2 style={{marginBottom:14,fontWeight:800}}>الرئيسية ⊞</h2>
      {alerts.length>0&&<div onClick={()=>setTab("alerts")} style={{background:T.redFaint,border:`1px solid ${T.red}40`,borderRadius:12,padding:"10px 14px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>🔔</span><span style={{fontSize:13,color:T.red,fontWeight:600}}>{alerts.length} تنبيه يحتاج انتباهك</span><span style={{color:T.textFaint,marginRight:"auto",fontSize:12}}>←</span></div>}
      {activeBazaars.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:12,color:T.textFaint,fontWeight:600,marginBottom:7}}>🛍️ بازارات اليوم</div>{activeBazaars.map(b=><div key={b.id} onClick={()=>setBazaarMode(b.id)} style={{background:`linear-gradient(135deg,${T.primary}22,${T.primary}10)`,border:`1px solid ${T.primary}40`,borderRadius:14,padding:"12px 14px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontWeight:700,fontSize:14,color:T.accent}}>🏪 {b.name}</div><div style={{fontSize:11,color:T.textFaint}}>اضغطي لدخول وضع البازار</div></div><div style={{background:T.primary,borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700}}>دخول ←</div></div>)}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
        {[{l:"إجمالي المبيعات",v:`${fmt(stats.totalSales)} ${cur}`,icon:"💰",c:T.green,tab:"sales"},{l:"إجمالي الأرباح",v:`${fmt(stats.totalProfit)} ${cur}`,icon:"📈",c:T.blue,tab:"monthly"},{l:"تكلفة المواد",v:`${fmt(stats.totalMaterials)} ${cur}`,icon:"🧵",c:T.accent,tab:"inventory"},{l:"قطع جاهزة",v:stats.readyTotal,icon:"📦",c:T.yellow,tab:"products"}].map(c=><div key={c.l} onClick={()=>setTab(c.tab)} style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:13,padding:"12px",cursor:"pointer"}}><div style={{fontSize:18,marginBottom:4}}>{c.icon}</div><div style={{fontSize:15,fontWeight:800,color:c.c}}>{c.v}</div><div style={{fontSize:10,color:T.textFaint,marginTop:2}}>{c.l}</div></div>)}
      </div>
      {stats.bestQty&&<div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:13,padding:"12px",marginBottom:12}}><div style={{fontWeight:700,marginBottom:8,fontSize:13,color:T.accent}}>🏆 أبرز المنتجات</div>{stats.bestQty&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.separator}`,fontSize:12}}><span style={{color:T.textSub}}>🥇 أكثر مبيعاً</span><span style={{color:T.green,fontWeight:600}}>{stats.bestQty.name}</span></div>}{stats.bestProfit&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:12}}><span style={{color:T.textSub}}>💰 أربح منتج</span><span style={{color:T.blue,fontWeight:600}}>{stats.bestProfit.name}</span></div>}</div>}
      {recent.length>0&&<div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:13,padding:"12px"}}><div style={{fontWeight:700,marginBottom:8,fontSize:13,color:T.accent}}>🕐 آخر المبيعات</div>{recent.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.separator}`,fontSize:12}}><div><span style={{fontWeight:600}}>{s.productName}</span>{s.qty>1&&<span style={{color:T.yellow,marginRight:4,fontSize:11}}>×{s.qty}</span>}<span style={{color:T.textFaint,fontSize:10,marginRight:6}}>{s.date}</span></div><span style={{color:T.green,fontWeight:700}}>{fmt(s.total)} {cur}</span></div>)}</div>}
      {!data.sales.length&&!data.products?.length&&<div style={{textAlign:"center",padding:50,color:T.textFaint}}><div style={{fontSize:60}}>🧶</div><div style={{fontSize:16,marginTop:12,color:T.accent}}>أهلاً بكِ بكوكله!</div><div style={{fontSize:12,marginTop:6}}>ابدئي بإضافة منتجاتك 🌸</div></div>}
    </div>
  );
}

function ProdCard({p,T,cur,catIcon,onEdit,onDel,onAddReady}){
  const[showAdd,setShowAdd]=useState(false);
  const[addCount,setAddCount]=useState(1);
  const st=p.status||"قيد العمل";
  const sc=st==="مكتمل"?T.green:st==="مباع"?T.blue:T.yellow;
  return(
    <div style={{...CDS(T),marginBottom:8}}>
      <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
        {p.image&&<img src={p.image} style={{width:52,height:52,borderRadius:9,objectFit:"cover",flexShrink:0}} alt=""/>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
            {!p.image&&<span style={{fontSize:16}}>{catIcon(p.categoryKey)}</span>}
            <span style={{fontWeight:800,fontSize:14}}>{p.name}</span>
            <span style={{background:`${sc}20`,color:sc,borderRadius:6,padding:"1px 7px",fontSize:10,fontWeight:600}}>{st}</span>
            {Number(p.readyCount)>0&&<span style={{background:T.greenFaint,color:T.green,borderRadius:6,padding:"1px 7px",fontSize:10,fontWeight:700}}>✅{p.readyCount}</span>}
          </div>
          <div style={{display:"flex",gap:8,fontSize:10,color:T.textFaint,flexWrap:"wrap"}}>
            <span>⏱{p.laborMinutes||0}د</span>
            <span style={{color:T.yellow,fontWeight:600}}>🏷{fmt(p.suggestedPrice)} {cur}</span>
            <span>تكلفة:{fmt(Math.round(p.totalCost||0))}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          <button onClick={()=>setShowAdd(!showAdd)} style={{...BTS(T.green,T),padding:"6px 10px",fontSize:13}}>+</button>
          <button onClick={onEdit} style={{...BTS(T.card,T),padding:"6px 10px",fontSize:13,border:`1px solid ${T.cardBorder}`}}>✏️</button>
          <button onClick={onDel} style={{...BTS(T.red,T),padding:"6px 10px",fontSize:13}}>🗑</button>
        </div>
      </div>
      {showAdd&&<div style={{marginTop:9,padding:"9px 10px",background:T.greenFaint,borderRadius:9,border:`1px solid ${T.green}30`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={{fontSize:12,color:T.green}}>إضافة للجاهز:</span><input type="number" min="1" value={addCount} onChange={e=>setAddCount(e.target.value)} style={{...INS,width:60,fontSize:14,padding:"5px 8px"}}/><span style={{fontSize:11,color:T.textFaint}}>قطعة</span><button onClick={()=>{onAddReady(p.id,addCount);setShowAdd(false);setAddCount(1);}} style={{...BTS(T.green,T),fontSize:11,padding:"5px 12px"}}>✓</button></div>}
    </div>
  );
}

function Products({data,update,cur,hr,catIcon,T}){
  const[view,setView]=useState("list");
  const[editId,setEditId]=useState(null);
  const[search,setSearch]=useState("");
  const[filterSt,setFilterSt]=useState("الكل");
  const imgRef=useRef();
  const ef=()=>({name:"",categoryKey:(data.categories||DEFAULT_CATEGORIES)[0]?.key||"ميداليات",targetProfit:30,discount:0,laborMinutes:0,materialUsage:[],notes:"",image:"",status:"قيد العمل"});
  const[form,setForm]=useState(ef);
  const matCost=form.materialUsage.reduce((s,r)=>{const m=data.materials.find(x=>x.id===r.materialId);if(!m)return s;return s+Number(r.qty||0)*Number(m.costPerUnit||0);},0);
  const{laborCost,totalCost,suggested,discounted}=calcPrice(form.laborMinutes,matCost,form.targetProfit,form.discount,hr);
  const handleImg=async e=>{const file=e.target.files[0];if(!file)return;const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const canvas=document.createElement("canvas");const max=400;let w=img.width,h=img.height;if(w>max){h=Math.round(h*max/w);w=max;}if(h>max){w=Math.round(w*max/h);h=max;}canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);setForm(f=>({...f,image:canvas.toDataURL("image/jpeg",0.7)}));URL.revokeObjectURL(url);};img.src=url;};
  const save=()=>{if(!form.name.trim())return;const prod={...form,id:editId||Date.now().toString(),name:form.name.trim(),materialCost:matCost,laborCost,totalCost,suggestedPrice:suggested,discountedPrice:discounted,readyCount:editId?(data.products.find(p=>p.id===editId)?.readyCount||0):0,soldCount:editId?(data.products.find(p=>p.id===editId)?.soldCount||0):0};update(prev=>({...prev,products:editId?prev.products.map(p=>p.id===editId?prod:p):[...(prev.products||[]),prod]}));setForm(ef());setEditId(null);setView("list");};
  const addReady=(id,count)=>update(prev=>{const prod=prev.products.find(p=>p.id===id);const qty=Number(count)||1;let materials=[...prev.materials];if(prod?.materialUsage){prod.materialUsage.forEach(u=>{const mi=materials.findIndex(m=>m.id===u.materialId);if(mi<0)return;materials=materials.map((m,i)=>i===mi?{...m,quantity:Math.max(0,Number(m.quantity)-Number(u.qty||0)*qty)}:m);});}return{...prev,materials,products:prev.products.map(p=>p.id===id?{...p,readyCount:(Number(p.readyCount)||0)+qty,status:"مكتمل"}:p)};});
  const del=id=>confirmDel("حذف هذا المنتج؟",()=>update(prev=>({...prev,products:prev.products.filter(p=>p.id!==id)})));
  const filtered=(data.products||[]).filter(p=>(!search||p.name.includes(search))&&(filterSt==="الكل"||(p.status||"قيد العمل")===filterSt));
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{margin:0,fontWeight:800}}>المنتجات 🧶</h2><button onClick={()=>{setView(view==="add"?"list":"add");setForm(ef());setEditId(null);}} style={BTS(T.primary,T)}>{view==="add"?"← القائمة":"+ جديد"}</button></div>
      {view==="add"&&<div style={{...CDS(T),marginBottom:12}}>
        <div style={{color:T.accent,fontWeight:700,marginBottom:12,fontSize:15}}>{editId?"تعديل":"منتج جديد"}</div>
        <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          <div onClick={()=>imgRef.current.click()} style={{width:70,height:70,borderRadius:11,border:`2px dashed ${T.accentFaint}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",background:T.accentVeryFaint,flexShrink:0}}>{form.image?<img src={form.image} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<div style={{textAlign:"center",color:T.textFaint,fontSize:10}}><div style={{fontSize:22}}>📷</div>صورة</div>}</div>
          {form.image&&<button onClick={()=>setForm(f=>({...f,image:""}))} style={{fontSize:11,color:T.red,background:"none",border:"none",cursor:"pointer"}}>✕ حذف</button>}
          <input ref={imgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImg}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{gridColumn:"span 2"}}><LB T={T}>اسم المنتج</LB><IN value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="مثال: ميدالية قلب" T={T}/></div>
          <div><LB T={T}>النوع</LB><SL value={form.categoryKey} onChange={e=>setForm(f=>({...f,categoryKey:e.target.value}))} T={T}>{(data.categories||DEFAULT_CATEGORIES).map(c=><option key={c.key} value={c.key}>{c.icon} {c.key}</option>)}</SL></div>
          <div><LB T={T}>الحالة</LB><SL value={form.status||"قيد العمل"} onChange={e=>setForm(f=>({...f,status:e.target.value}))} T={T}>{PRODUCT_STATUSES.map(s=><option key={s}>{s}</option>)}</SL></div>
          <div style={{gridColumn:"span 2"}}><LB T={T}>وقت الصنع (دقيقة/قطعة)</LB><IN type="number" value={form.laborMinutes} onChange={e=>setForm(f=>({...f,laborMinutes:e.target.value}))} T={T}/></div>
        </div>
        <div style={{marginTop:11,padding:10,background:T.accentVeryFaint,borderRadius:10,border:`1px solid ${T.accentFaint}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:12,fontWeight:700,color:T.accent}}>🧵 المواد/قطعة</div><button onClick={()=>setForm(f=>({...f,materialUsage:[...f.materialUsage,{materialId:"",qty:0}]}))} style={{...BTS(T.blue,T),fontSize:10,padding:"3px 8px"}}>+ مادة</button></div>
          {form.materialUsage.map((r,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 70px auto",gap:5,marginBottom:5,alignItems:"center"}}><SL value={r.materialId} onChange={e=>setForm(f=>({...f,materialUsage:f.materialUsage.map((rr,idx)=>idx===i?{...rr,materialId:e.target.value}:rr)}))} T={T}><option value="">اختاري...</option>{data.materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</SL><IN type="number" value={r.qty} onChange={e=>setForm(f=>({...f,materialUsage:f.materialUsage.map((rr,idx)=>idx===i?{...rr,qty:e.target.value}:rr)}))} T={T}/><button onClick={()=>setForm(f=>({...f,materialUsage:f.materialUsage.filter((_,idx)=>idx!==i)}))} style={{...BTS(T.red,T),padding:"5px 8px",fontSize:11}}>✕</button></div>)}
          {form.materialUsage.length>0&&<div style={{fontSize:11,color:T.yellow,fontWeight:600,marginTop:6}}>تكلفة: {fmt(Math.round(matCost))} {cur}/قطعة</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:9}}>
          <div><LB T={T}>هامش الربح (%)</LB><IN type="number" value={form.targetProfit} onChange={e=>setForm(f=>({...f,targetProfit:e.target.value}))} T={T}/></div>
          <div><LB T={T}>تخفيض (%)</LB><IN type="number" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} T={T}/></div>
        </div>
        <div style={{marginTop:9,background:T.greenFaint,borderRadius:10,padding:"10px 12px",border:`1px solid ${T.green}30`}}>
          <div style={{fontSize:12,fontWeight:700,color:T.green,marginBottom:6}}>🧮 ملخص السعر/قطعة</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            <RW l="تكلفة العمل" v={`${fmt(Math.round(laborCost))} ${cur}`} T={T}/>
            <RW l="تكلفة المواد" v={`${fmt(Math.round(matCost))} ${cur}`} T={T}/>
            <RW l="التكلفة الكلية" v={`${fmt(Math.round(totalCost))} ${cur}`} b T={T}/>
            <RW l="السعر المقترح" v={`${fmt(suggested)} ${cur}`} c={T.yellow} b T={T}/>
            {form.discount>0&&<RW l={`بعد خصم ${form.discount}%`} v={`${fmt(discounted)} ${cur}`} c={T.blue} b T={T}/>}
          </div>
        </div>
        <button onClick={save} style={{...BTS(T.primary,T),width:"100%",marginTop:12,padding:"12px",fontSize:15,justifyContent:"center"}}>💾 حفظ</button>
      </div>}
      {view==="list"&&<div>
        <IN value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 بحث..." style={{marginBottom:8,width:"100%"}} T={T}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>{["الكل",...PRODUCT_STATUSES].map(s=><button key={s} onClick={()=>setFilterSt(s)} style={{...BTS(filterSt===s?T.primary:T.card,T),fontSize:10,padding:"4px 10px",border:`1px solid ${filterSt===s?"transparent":T.cardBorder}`}}>{s}</button>)}</div>
        {!filtered.length&&<div style={{textAlign:"center",padding:35,color:T.textFaint}}><div style={{fontSize:44}}>🧶</div><div style={{marginTop:8}}>ما في منتجات</div></div>}
        {filtered.map(p=><ProdCard key={p.id} p={p} T={T} cur={cur} catIcon={catIcon} onEdit={()=>{setForm({...p,materialUsage:p.materialUsage||[]});setEditId(p.id);setView("add");}} onDel={()=>del(p.id)} onAddReady={addReady}/>)}
      </div>}
    </div>
  );
}

function Sales({data,update,cur,catIcon,T}){
  const[showAdd,setShowAdd]=useState(false);
  const[editSale,setEditSale]=useState(null);
  const[form,setForm]=useState({productId:"",bazaarId:"",qty:1,customPrice:"",discount:0,channel:"بازار",notes:"",isBundle:false});
  const[prodSearch,setProdSearch]=useState("");
  const[showSug,setShowSug]=useState(false);
  const available=(data.products||[]).filter(p=>Number(p.readyCount||0)>0);
  const suggestions=available.filter(p=>!prodSearch||p.name.includes(prodSearch)).slice(0,6);
  const prod=(data.products||[]).find(p=>p.id===form.productId);
  const qty=Number(form.qty||1);
  const raw=form.customPrice?Number(form.customPrice):Math.round((prod?.suggestedPrice||0)*(1-Number(form.discount||0)/100));
  const unitPrice=form.isBundle&&form.customPrice?Math.round(Number(form.customPrice)/qty):raw;
  const total=form.isBundle&&form.customPrice?Number(form.customPrice):unitPrice*qty;
  const profit=(unitPrice-(prod?.totalCost||0))*qty;
  const openAdd=()=>{setEditSale(null);setForm({productId:"",bazaarId:"",qty:1,customPrice:"",discount:0,channel:"بازار",notes:"",isBundle:false});setProdSearch("");setShowAdd(true);};
  const openEdit=s=>{setEditSale(s);setForm({productId:s.productId||"",bazaarId:s.bazaarId||"",qty:s.qty||1,customPrice:s.unitPrice||"",discount:s.discount||0,channel:s.channel||"بازار",notes:s.notes||"",isBundle:s.isBundle||false});setProdSearch(s.productName||"");setShowAdd(true);};
  const todayBazaars=data.bazaars.filter(b=>{if(!b.date)return true;const bd=new Date(b.date.split("/").reverse().join("-"));const today=new Date();today.setHours(0,0,0,0);bd.setHours(0,0,0,0);return bd>=today;});
  const save=()=>{
    if(!form.productId||!total)return;
    if(editSale){const oldQty=Number(editSale.qty||1);update(prev=>({...prev,products:prev.products.map(p=>{if(p.id!==form.productId)return p;const adj=oldQty-qty;return{...p,readyCount:Math.max(0,(Number(p.readyCount)||0)+adj),soldCount:Math.max(0,(Number(p.soldCount)||0)-oldQty+qty)};}),sales:prev.sales.map(s=>s.id===editSale.id?{...s,...form,productName:prod?.name||s.productName,unitPrice,total,totalProfit:profit,qty,unitCost:prod?.totalCost||0}:s)}));}
    else{update(prev=>({...prev,products:prev.products.map(p=>p.id===form.productId?{...p,readyCount:Math.max(0,(Number(p.readyCount)||0)-qty),soldCount:(Number(p.soldCount)||0)+qty}:p),sales:[...prev.sales,{...form,id:Date.now().toString(),productName:prod?.name||"",unitPrice,total,totalProfit:profit,qty,date:todayStr(),unitCost:prod?.totalCost||0}]}));}
    setShowAdd(false);setEditSale(null);setProdSearch("");
  };
  const del=id=>confirmDel("حذف المبيعة؟ ستعود القطع للمخزون",()=>{const s=data.sales.find(x=>x.id===id);update(prev=>({...prev,sales:prev.sales.filter(x=>x.id!==id),products:prev.products.map(p=>p.id===s?.productId?{...p,readyCount:(Number(p.readyCount)||0)+Number(s.qty||1),soldCount:Math.max(0,(Number(p.soldCount)||0)-Number(s.qty||1))}:p)}));});
  // Parse Arabic date DD/MM/YYYY → sortable timestamp
  const parseDate=d=>{if(!d)return 0;const p=d.split("/");if(p.length===3&&p[2].length===4)return new Date(`${p[2]}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}`).getTime();return new Date(d).getTime()||0;};
  const sorted=[...data.sales].sort((a,b)=>{const dd=parseDate(b.date)-parseDate(a.date);return dd!==0?dd:(b.id||"").localeCompare(a.id||"");});
  const grouped={};sorted.forEach(s=>{const d=s.date||"بدون تاريخ";if(!grouped[d])grouped[d]=[];grouped[d].push(s);});
  const days=Object.keys(grouped).sort((a,b)=>parseDate(b)-parseDate(a));
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{margin:0,fontWeight:800}}>المبيعات 💰</h2><button onClick={openAdd} style={BTS(T.primary,T)}>+ تسجيل بيع</button></div>
      {showAdd&&<div style={{...CDS(T),marginBottom:12}}>
        <div style={{color:T.accent,fontWeight:700,marginBottom:10}}>{editSale?"تعديل":"بيع جديد"}</div>
        <div style={{position:"relative",marginBottom:8}}>
          <LB T={T}>المنتج</LB>
          <input value={prod?prod.name:prodSearch} onChange={e=>{setProdSearch(e.target.value);setForm(f=>({...f,productId:""}));setShowSug(true);}} onFocus={()=>setShowSug(true)} placeholder="ابحثي باسم المنتج..." style={{...INS,width:"100%"}}/>
          {showSug&&suggestions.length>0&&<div style={{position:"absolute",top:"100%",right:0,left:0,background:T.navBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,zIndex:50,maxHeight:200,overflowY:"auto"}}>{suggestions.map(p=><div key={p.id} onMouseDown={()=>{setForm(f=>({...f,productId:p.id,customPrice:""}));setProdSearch(p.name);setShowSug(false);}} style={{padding:"9px 12px",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${T.separator}`,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,color:T.accent}}>{catIcon(p.categoryKey)} {p.name}</span><span style={{color:T.textFaint,fontSize:10}}>{p.readyCount} جاهز · {fmt(p.suggestedPrice)} {cur}</span></div>)}</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><LB T={T}>العدد</LB><IN type="number" min="1" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} T={T}/></div>
          <div><LB T={T}>القناة</LB><SL value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))} T={T}><option>بازار</option><option>أونلاين</option><option>مباشر</option><option>هدية</option></SL></div>
          <div><LB T={T}>البازار</LB><SL value={form.bazaarId} onChange={e=>setForm(f=>({...f,bazaarId:e.target.value}))} T={T}><option value="">بدون بازار</option>{todayBazaars.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</SL></div>
          <div><LB T={T}>تخفيض (%)</LB><IN type="number" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value,customPrice:""}))} T={T}/></div>
          <div style={{gridColumn:"span 2"}}><LB T={T}>سعر مخصص ({cur})</LB><IN type="number" value={form.customPrice} onChange={e=>setForm(f=>({...f,customPrice:e.target.value}))} placeholder="فارغ = المقترح" T={T}/></div>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:T.textSub,marginTop:8,marginBottom:8}}><input type="checkbox" checked={form.isBundle} onChange={e=>setForm(f=>({...f,isBundle:e.target.checked}))} style={{width:16,height:16,accentColor:T.yellow}}/>🎁 حزمة — السعر للمجموعة كلها</label>
        {prod&&<div style={{padding:"9px 12px",background:T.greenFaint,borderRadius:9,border:`1px solid ${T.green}25`,marginBottom:9}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}><RW l="سعر/قطعة" v={`${fmt(unitPrice)} ${cur}`} T={T}/><RW l="الكمية" v={qty} T={T}/><RW l="الإجمالي" v={`${fmt(total)} ${cur}`} c={T.yellow} b T={T}/><RW l="الربح" v={`${fmt(Math.round(profit))} ${cur}`} c={profit>=0?T.green:T.red} b T={T}/></div></div>}
        <div style={{display:"flex",gap:8}}><button onClick={save} style={{...BTS(T.green,T),flex:1,justifyContent:"center",padding:"11px"}}>💰 {editSale?"حفظ":"تسجيل"}</button><button onClick={()=>{setShowAdd(false);setEditSale(null);}} style={{...BTS(T.red,T),padding:"11px 14px"}}>✕</button></div>
      </div>}
      {days.map(day=>(
        <div key={day}>
          <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0 8px"}}><div style={{flex:1,height:1,background:T.separator}}/><div style={{fontSize:11,color:T.accent,fontWeight:600,background:T.accentVeryFaint,padding:"3px 10px",borderRadius:10,border:`1px solid ${T.accentFaint}`}}>{day}</div><div style={{flex:1,height:1,background:T.separator}}/></div>
          {grouped[day].map(s=>{const p=(data.products||[]).find(x=>x.id===s.productId);return(
            <div key={s.id} style={{...CDS(T),marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                {p?.image&&<img src={p.image} style={{width:38,height:38,borderRadius:8,objectFit:"cover",flexShrink:0}} alt=""/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{s.productName}{s.qty>1&&<span style={{color:T.yellow,marginRight:4,fontSize:11}}>×{s.qty}</span>}{s.isBundle&&<span style={{fontSize:10,background:T.yellowFaint,color:T.yellow,borderRadius:5,padding:"1px 5px",marginRight:4}}>حزمة</span>}<span style={{fontSize:10,background:T.accentVeryFaint,color:T.accent,borderRadius:5,padding:"1px 5px",marginRight:4}}>{s.channel}</span></div>
                  {s.bazaarId&&<div style={{fontSize:10,color:T.textFaint,marginBottom:3}}>🏪 {data.bazaars.find(b=>b.id===s.bazaarId)?.name||""}</div>}
                  <div style={{display:"flex",gap:8,fontSize:11}}><span style={{color:T.green,fontWeight:700}}>💰 {fmt(s.total||0)} {cur}</span><span style={{color:(s.totalProfit||0)>=0?T.blue:T.red}}>ربح: {fmt(Math.round(s.totalProfit||0))} {cur}</span></div>
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <button onClick={()=>openEdit(s)} style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:8,padding:"7px 11px",cursor:"pointer",color:T.text,fontSize:13}}>✏️</button>
                  <button onClick={()=>del(s.id)} style={{...BTS(T.red,T),padding:"7px 11px",fontSize:13}}>🗑</button>
                </div>
              </div>
            </div>
          );})}
        </div>
      ))}
      {!data.sales.length&&<div style={{textAlign:"center",padding:40,color:T.textFaint}}><div style={{fontSize:44}}>💰</div><div style={{marginTop:8}}>ما في مبيعات بعد</div></div>}
    </div>
  );
}

function BazaarCard({b,data,T,cur,onEdit,onDel,setBazaarMode}){
  const[showTop,setShowTop]=useState(false);
  const bs=data.sales.filter(s=>s.bazaarId===b.id);
  const rev=bs.reduce((s,x)=>s+Number(x.total||0),0);
  const gross=bs.reduce((s,x)=>s+Number(x.totalProfit||0),0);
  const net=gross-Number(b.totalCost||0);
  const roi=b.totalCost>0?(net/Number(b.totalCost))*100:0;
  const rec=roi>=100;
  const today=new Date();today.setHours(0,0,0,0);
  const bd=b.date?new Date(b.date.split("/").reverse().join("-")):null;
  if(bd)bd.setHours(0,0,0,0);
  const isToday=bd&&bd.getTime()===today.getTime();
  const pm={};bs.forEach(s=>{const id=s.productId||s.productName;if(!pm[id])pm[id]={name:s.productName,qty:0,profit:0};pm[id].qty+=Number(s.qty||1);pm[id].profit+=Number(s.totalProfit||0);});
  const top=Object.values(pm).sort((a,b2)=>b2.qty!==a.qty?b2.qty-a.qty:b2.profit-a.profit).slice(0,5);
  return(
    <div style={{...CDS(T),marginBottom:10,border:`1px solid ${rec?T.green+"50":roi<0?T.red+"35":T.cardBorder}`,position:"relative"}}>
      {isToday&&<button onClick={()=>setBazaarMode(b.id)} style={{position:"absolute",top:12,left:12,...BTS(T.primary,T),fontSize:11,padding:"5px 10px",zIndex:1}}>🚀 دخول البازار</button>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{paddingLeft:isToday?110:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:4}}>
            <span style={{fontWeight:700,fontSize:14}}>🏪 {b.name}</span>
            {rec&&<span style={{background:T.greenFaint,color:T.green,fontSize:10,borderRadius:6,padding:"1px 7px",fontWeight:700}}>⭐ ينصح</span>}
            {!rec&&roi>=50&&<span style={{background:T.yellowFaint,color:T.yellow,fontSize:10,borderRadius:6,padding:"1px 7px"}}>👍 مقبول</span>}
            {roi<0&&bs.length>0&&<span style={{background:T.redFaint,color:T.red,fontSize:10,borderRadius:6,padding:"1px 7px"}}>⚠️ خسارة</span>}
          </div>
          <div style={{fontSize:11,color:T.textFaint}}>📅 {b.date}{b.location&&` · 📍 ${b.location}`}</div>
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={()=>onEdit(b)} style={{background:T.yellowFaint,border:`1px solid ${T.yellow}40`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:T.yellow,fontSize:13}}>✏️</button>
          <button onClick={()=>onDel(b.id)} style={{...BTS(T.red,T),padding:"6px 10px",fontSize:13}}>🗑</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:9}}>
        <RW l="مصاريف" v={`${fmt(b.totalCost)} ${cur}`} T={T}/>
        <RW l="إيرادات" v={`${fmt(rev)} ${cur}`} c={T.green} T={T}/>
        <RW l="ربح القطع" v={`${fmt(Math.round(gross))} ${cur}`} c={T.yellow} T={T}/>
        <RW l="صافي الربح" v={`${fmt(Math.round(net))} ${cur}`} c={net>=0?T.green:T.red} b T={T}/>
        <RW l="العائد" v={`${Math.round(roi)}%`} c={rec?T.green:roi<0?T.red:T.yellow} b T={T}/>
        <RW l="القطع" v={bs.reduce((s,x)=>s+Number(x.qty||1),0)} T={T}/>
      </div>
      <button onClick={()=>setShowTop(!showTop)} style={{background:T.accentVeryFaint,border:`1px solid ${T.accentFaint}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:T.textSub,fontFamily:"inherit",fontSize:11,width:"100%"}}>{showTop?"↑ إخفاء":"↓ أكثر المنتجات مبيعاً"}</button>
      {showTop&&top.length>0&&<div style={{marginTop:8,padding:"10px",background:T.accentVeryFaint,borderRadius:9}}>{top.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.separator}`,alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:7}}><span style={{color:i===0?T.yellow:i===1?"#9ca3af":"#cd7c2f",fontWeight:800,fontSize:12,minWidth:18}}>#{i+1}</span><span style={{fontSize:12,fontWeight:600}}>{p.name}</span></div><div style={{textAlign:"left"}}><div style={{fontSize:11,color:T.green,fontWeight:600}}>{p.qty} قطعة</div><div style={{fontSize:10,color:T.textFaint}}>{fmt(Math.round(p.profit))} {cur}</div></div></div>)}</div>}
    </div>
  );
}

function Bazaars({data,update,cur,T,setBazaarMode}){
  const[showAdd,setShowAdd]=useState(false);
  const[editBaz,setEditBaz]=useState(null);
  const ef=()=>({name:"",date:"",location:"",tableCost:0,transportCost:0,otherCosts:0,notes:""});
  const[form,setForm]=useState(ef);
  const save=()=>{if(!form.name.trim())return;const tc=Number(form.tableCost||0)+Number(form.transportCost||0)+Number(form.otherCosts||0);if(editBaz)update(prev=>({...prev,bazaars:prev.bazaars.map(b=>b.id===editBaz.id?{...form,id:editBaz.id,totalCost:tc}:b)}));else update(prev=>({...prev,bazaars:[...prev.bazaars,{...form,id:Date.now().toString(),totalCost:tc}]}));setForm(ef());setEditBaz(null);setShowAdd(false);};
  const del=id=>confirmDel("حذف البازار؟",()=>update(prev=>({...prev,bazaars:prev.bazaars.filter(b=>b.id!==id)})));
  const openEdit=b=>{setForm({name:b.name,date:b.date||"",location:b.location||"",tableCost:b.tableCost||0,transportCost:b.transportCost||0,otherCosts:b.otherCosts||0,notes:b.notes||""});setEditBaz(b);setShowAdd(true);};
  const sorted=[...data.bazaars].sort((a,b)=>{const da=a.date?new Date(a.date.split("/").reverse().join("-")):new Date(0);const db=b.date?new Date(b.date.split("/").reverse().join("-")):new Date(0);return db-da;});
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{margin:0,fontWeight:800}}>البازارات 🛍️</h2><button onClick={()=>{setShowAdd(!showAdd);setEditBaz(null);setForm(ef());}} style={BTS(T.primary,T)}>{showAdd?"← إغلاق":"+ بازار"}</button></div>
      {showAdd&&<div style={{...CDS(T),marginBottom:12,border:editBaz?`1px solid ${T.yellow}40`:undefined}}>
        {editBaz&&<div style={{color:T.yellow,fontWeight:700,marginBottom:8,fontSize:13}}>✏️ تعديل: {editBaz.name}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{gridColumn:"span 2"}}><LB T={T}>اسم البازار</LB><IN value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="مثال: بازار العيد" T={T}/></div>
          <div><LB T={T}>التاريخ</LB><IN type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} T={T}/></div>
          <div><LB T={T}>المكان</LB><IN value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} T={T}/></div>
          <div><LB T={T}>إيجار الطاولة</LB><IN type="number" value={form.tableCost} onChange={e=>setForm(f=>({...f,tableCost:e.target.value}))} T={T}/></div>
          <div><LB T={T}>المواصلات</LB><IN type="number" value={form.transportCost} onChange={e=>setForm(f=>({...f,transportCost:e.target.value}))} T={T}/></div>
          <div><LB T={T}>مصاريف أخرى</LB><IN type="number" value={form.otherCosts} onChange={e=>setForm(f=>({...f,otherCosts:e.target.value}))} T={T}/></div>
          <div><LB T={T}>ملاحظات</LB><IN value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} T={T}/></div>
        </div>
        <button onClick={save} style={{...BTS(T.primary,T),width:"100%",marginTop:10}}>💾 حفظ</button>
      </div>}
      {sorted.map(b=><BazaarCard key={b.id} b={b} data={data} T={T} cur={cur} onEdit={openEdit} onDel={del} setBazaarMode={setBazaarMode}/>)}
      {!data.bazaars.length&&<div style={{textAlign:"center",padding:40,color:T.textFaint}}><div style={{fontSize:44}}>🛍️</div><div style={{marginTop:8}}>ما في بازارات بعد</div></div>}
    </div>
  );
}

function Inventory({data,update,cur,T}){
  const[showAdd,setShowAdd]=useState(false);
  const[editMat,setEditMat]=useState(null);
  const ef=()=>({name:"",unit:"غرام",totalPurchasePrice:0,quantity:0,minAlert:10});
  const[form,setForm]=useState(ef);
  const[nameSug,setNameSug]=useState([]);
  const handleName=val=>{setForm(f=>({...f,name:val}));if(val.length>0)setNameSug(data.materials.filter(m=>m.name.includes(val)).slice(0,5));else setNameSug([]);};
  const selectSug=m=>{setForm(f=>({...f,name:m.name,unit:m.unit,minAlert:m.minAlert||10}));setNameSug([]);};
  const add=()=>{
    if(!form.name.trim()||!Number(form.quantity))return;
    const tc=Number(form.totalPurchasePrice||0);const qty=Number(form.quantity);const cpu=qty>0&&tc>0?tc/qty:0;
    const ei=data.materials.findIndex(m=>m.name===form.name.trim());
    update(prev=>{
      let mats;
      if(ei>=0){const ex=prev.materials[ei];const oldTotal=Number(ex.totalCost||0);const newTotal=oldTotal+tc;const newQty=Number(ex.quantity)+qty;const newCpu=newQty>0?newTotal/newQty:cpu;mats=prev.materials.map((m,i)=>i===ei?{...m,quantity:newQty,totalCost:newTotal,costPerUnit:newCpu,costPer100:newCpu*100}:m);}
      else mats=[...prev.materials,{...form,id:Date.now().toString(),costPerUnit:cpu,costPer100:cpu*100,totalCost:tc}];
      return{...prev,materials:mats,purchases:[...prev.purchases,{...form,id:Date.now().toString(),costPerUnit:cpu,totalCost:tc,date:todayStr()}]};
    });
    setForm(ef());setNameSug([]);setShowAdd(false);
  };
  const saveEdit=()=>{if(!editMat)return;const tc=Number(editMat.totalCost||0);const qty=Number(editMat.quantity||0);const cpu=qty>0&&tc>0?tc/qty:Number(editMat.costPerUnit||0);update(prev=>({...prev,materials:prev.materials.map(m=>m.id===editMat.id?{...editMat,costPerUnit:cpu,costPer100:cpu*100}:m)}));setEditMat(null);};
  const deduct=(id,amt)=>update(prev=>({...prev,materials:prev.materials.map(m=>m.id===id?{...m,quantity:Math.max(0,Number(m.quantity)-Number(amt))}:m)}));
  const delMat=id=>confirmDel("حذف هذه المادة؟",()=>update(prev=>({...prev,materials:prev.materials.filter(m=>m.id!==id)})));
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{margin:0,fontWeight:800}}>المخزون 📦</h2><button onClick={()=>{setShowAdd(!showAdd);setEditMat(null);}} style={BTS(T.primary,T)}>{showAdd?"← إغلاق":"+ شراء مواد"}</button></div>
      {showAdd&&!editMat&&<div style={{...CDS(T),marginBottom:12}}>
        <div style={{position:"relative",marginBottom:9}}>
          <LB T={T}>اسم المادة</LB>
          <IN value={form.name} onChange={e=>handleName(e.target.value)} placeholder="مثال: صوف أكريليك" T={T}/>
          {nameSug.length>0&&<div style={{position:"absolute",top:"100%",right:0,left:0,background:T.navBg,border:`1px solid ${T.cardBorder}`,borderRadius:9,zIndex:50,overflow:"hidden"}}>{nameSug.map(m=><div key={m.id} onClick={()=>selectSug(m)} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${T.separator}`,display:"flex",justifyContent:"space-between"}}><span style={{color:T.accent,fontWeight:600}}>{m.name}</span><span style={{color:T.textFaint,fontSize:10}}>{fmt(m.quantity)} {m.unit} متوفر</span></div>)}</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><LB T={T}>الوحدة</LB><SL value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} T={T}><option>غرام</option><option>كيلو</option><option>متر</option><option>حبة</option><option>لفة</option><option>علبة</option></SL></div>
          <div><LB T={T}>الكمية</LB><IN type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} T={T}/></div>
          <div style={{gridColumn:"span 2"}}>
            <LB T={T}>السعر الكلي ({cur})</LB>
            <IN type="number" value={form.totalPurchasePrice} onChange={e=>setForm(f=>({...f,totalPurchasePrice:e.target.value}))} placeholder="مثال: 6000" T={T}/>
            {Number(form.quantity)>0&&Number(form.totalPurchasePrice)>0&&<div style={{marginTop:5,fontSize:11,color:T.blue}}>سعر الوحدة: {(Number(form.totalPurchasePrice)/Number(form.quantity)).toFixed(2)} {cur}/{form.unit}</div>}
          </div>
          <div><LB T={T}>تنبيه عند</LB><IN type="number" value={form.minAlert} onChange={e=>setForm(f=>({...f,minAlert:e.target.value}))} T={T}/></div>
        </div>
        {data.materials.find(m=>m.name===form.name.trim())&&nameSug.length===0&&<div style={{marginTop:6,fontSize:11,color:T.green}}>✅ ستُضاف للمخزون الحالي لـ "{form.name}"</div>}
        <button onClick={add} style={{...BTS(T.primary,T),width:"100%",marginTop:10}}>💾 تسجيل الشراء</button>
      </div>}
      {editMat&&<div style={{...CDS(T),marginBottom:12,border:`1px solid ${T.yellow}40`}}>
        <div style={{color:T.yellow,fontWeight:700,marginBottom:10}}>✏️ تعديل: {editMat.name}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{gridColumn:"span 2"}}><LB T={T}>الاسم</LB><IN value={editMat.name} onChange={e=>setEditMat(m=>({...m,name:e.target.value}))} T={T}/></div>
          <div><LB T={T}>الوحدة</LB><SL value={editMat.unit} onChange={e=>setEditMat(m=>({...m,unit:e.target.value}))} T={T}><option>غرام</option><option>كيلو</option><option>متر</option><option>حبة</option><option>لفة</option><option>علبة</option></SL></div>
          <div><LB T={T}>الكمية</LB><IN type="number" value={editMat.quantity} onChange={e=>setEditMat(m=>({...m,quantity:e.target.value}))} T={T}/></div>
          <div style={{gridColumn:"span 2"}}><LB T={T}>إجمالي التكلفة ({cur})</LB><IN type="number" value={editMat.totalCost||0} onChange={e=>setEditMat(m=>({...m,totalCost:e.target.value}))} T={T}/></div>
          <div><LB T={T}>تنبيه عند</LB><IN type="number" value={editMat.minAlert||0} onChange={e=>setEditMat(m=>({...m,minAlert:e.target.value}))} T={T}/></div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:10}}><button onClick={saveEdit} style={{...BTS(T.green,T),flex:1,justifyContent:"center"}}>💾 حفظ</button><button onClick={()=>setEditMat(null)} style={{...BTS(T.red,T),padding:"7px 14px"}}>✕</button></div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:9}}>
        {data.materials.map(m=>{const low=Number(m.quantity)<=Number(m.minAlert||0);const cpu=Number(m.costPerUnit||0);const cp100=Number(m.costPer100||cpu*100||0);return(
          <div key={m.id} style={{...CDS(T),border:low?`1px solid ${T.red}45`:undefined}}>
            {low&&<div style={{color:T.red,fontSize:10,marginBottom:4}}>⚠️ منخفض</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
              <div style={{fontWeight:700,fontSize:12}}>{m.name}</div>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>{setEditMat({...m});setShowAdd(false);}} style={{background:"none",border:"none",color:T.yellow,cursor:"pointer",fontSize:14,padding:0}}>✏️</button>
                <button onClick={()=>delMat(m.id)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:14,padding:0}}>🗑</button>
              </div>
            </div>
            <div style={{fontSize:19,fontWeight:800,color:low?T.red:T.green}}>{fmt(m.quantity)}<span style={{fontSize:10}}> {m.unit}</span></div>
            <div style={{fontSize:10,color:T.textFaint,marginTop:2}}>{cp100>0?`${fmt(Math.round(cp100))} ${cur}/100${m.unit}`:`${fmt(cpu)} ${cur}/${m.unit}`}</div>
            <div style={{display:"flex",gap:4,marginTop:8}}>
              <input type="number" placeholder="خصم" style={{...INS,flex:1,fontSize:14,padding:"4px 6px"}} id={`d-${m.id}`}/>
              <button onClick={()=>{const el=document.getElementById(`d-${m.id}`);deduct(m.id,el.value);el.value="";}} style={{...BTS(T.red,T),padding:"4px 8px",fontSize:11}}>-</button>
            </div>
          </div>
        );})}
      </div>
      {!data.materials.length&&<div style={{textAlign:"center",padding:35,color:T.textFaint}}><div style={{fontSize:44}}>📦</div><div style={{marginTop:8}}>ما في مواد بعد</div></div>}
      {data.purchases.length>0&&<div style={{marginTop:16}}><div style={{fontSize:12,color:T.textFaint,fontWeight:600,marginBottom:8}}>🧾 سجل المشتريات</div>{[...data.purchases].reverse().map(p=><div key={p.id} style={{...CDS(T),marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:12}}>{p.name}</div><div style={{fontSize:10,color:T.textFaint}}>{p.date} · {p.quantity} {p.unit}</div></div><div style={{color:T.red,fontWeight:700,fontSize:12}}>{fmt(p.totalCost)} {cur}</div></div>)}</div>}
    </div>
  );
}

function Session({data,update,cur,hr,catIcon,T,timerSec,running,paused,setRunning,setPaused,setTimerSec,activeSession,setActiveSession}){
  const[mode,setMode]=useState("session");
  const[step,setStep]=useState(1);
  const[selProds,setSelProds]=useState([]);
  const[sessionSearch,setSessionSearch]=useState("");
  const[extraNote,setExtraNote]=useState("");
  const[addToReady,setAddToReady]=useState([]);
  const[npForm,setNpForm]=useState(null);
  const[npSec,setNpSec]=useState(0);
  const[npRunning,setNpRunning]=useState(false);
  const[npPaused,setNpPaused]=useState(false);
  const npRef=useRef();
  const npImgRef=useRef();
  useEffect(()=>{if(npRunning&&!npPaused)npRef.current=setInterval(()=>setNpSec(s=>s+1),1000);else clearInterval(npRef.current);return()=>clearInterval(npRef.current);},[npRunning,npPaused]);
  const toggle=pid=>setSelProds(prev=>prev.find(x=>x.id===pid)?prev.filter(x=>x.id!==pid):[...prev,{id:pid,qty:1}]);
  const setQty=(pid,qty)=>setSelProds(prev=>prev.map(x=>x.id===pid?{...x,qty:Number(qty)||1}:x));
  const totalPcs=selProds.reduce((s,x)=>s+Number(x.qty||1),0);
  const costPerPc=totalPcs>0?Math.round((timerSec/3600)*hr/totalPcs):0;
  const start=()=>{if(!selProds.length)return;setActiveSession({prods:selProds});setRunning(true);setPaused(false);setStep(2);};
  const finish=()=>{setRunning(false);setPaused(false);setStep(3);};
  const cancel=()=>{setRunning(false);setPaused(false);setTimerSec(0);setActiveSession(null);setStep(1);setSelProds([]);};
  const saveSession=()=>{
    const totalMins=Math.round(timerSec/60);
    const minsPerPc=totalPcs>0?Math.round(totalMins/totalPcs):0;
    update(prev=>{
      let materials=[...prev.materials];
      selProds.forEach(sel=>{
        if(!addToReady.includes(sel.id))return;
        const prod=prev.products.find(p=>p.id===sel.id);
        if(!prod?.materialUsage)return;
        const qty=Number(sel.qty||1);
        prod.materialUsage.forEach(u=>{const mi=materials.findIndex(m=>m.id===u.materialId);if(mi<0)return;materials=materials.map((m,i)=>i===mi?{...m,quantity:Math.max(0,Number(m.quantity)-Number(u.qty||0)*qty)}:m);});
      });
      return{...prev,materials,
        products:prev.products.map(p=>{
          const sel=activeSession.prods.find(x=>x.id===p.id);if(!sel)return p;
          const addQty=addToReady.includes(p.id)?Number(sel.qty||1):0;
          const updatedLabor=minsPerPc>0?minsPerPc:p.laborMinutes;
          const newCalc=calcPriceFn(updatedLabor,Number(p.materialCost||0),p.targetProfit||30,p.discount||0,prev.settings.hourlyRate||3000);
          return{...p,readyCount:(Number(p.readyCount)||0)+addQty,status:addQty>0?"مكتمل":p.status,laborMinutes:updatedLabor,...newCalc,suggestedPrice:newCalc.suggested,discountedPrice:newCalc.discounted,totalCost:newCalc.totalCost,laborCost:newCalc.laborCost};
        }),
        sessions:[...(prev.sessions||[]),{id:Date.now().toString(),date:todayStr(),prods:activeSession.prods,totalMins,minsPerPc,totalPcs,note:extraNote}]
      };
    });
    setTimerSec(0);setActiveSession(null);setSelProds([]);setExtraNote("");setAddToReady([]);setStep(1);
  };
  const npMatCost=(npForm?.materialUsage||[]).reduce((s,r)=>{const m=data.materials.find(x=>x.id===r.materialId);if(!m)return s;return s+Number(r.qty||0)*Number(m.costPerUnit||0);},0);
  const npCalc=npForm?calcPrice(npForm.laborMinutes||Math.round(npSec/60),npMatCost,npForm.targetProfit||30,npForm.discount||0,hr):{};
  const saveNewProduct=()=>{
    if(!npForm?.name?.trim())return;
    const mins=npForm.laborMinutes||Math.round(npSec/60);
    const prod={...npForm,id:Date.now().toString(),name:npForm.name.trim(),materialCost:npMatCost,...npCalc,suggestedPrice:npCalc.suggested,discountedPrice:npCalc.discounted,readyCount:0,soldCount:0,laborMinutes:mins};
    update(prev=>({...prev,products:[...(prev.products||[]),prod]}));
    setNpForm(null);setNpSec(0);setNpRunning(false);setNpPaused(false);setMode("session");
  };
  const handleNpImg=async e=>{const file=e.target.files[0];if(!file)return;const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const canvas=document.createElement("canvas");const max=400;let w=img.width,h=img.height;if(w>max){h=Math.round(h*max/w);w=max;}if(h>max){w=Math.round(w*max/h);h=max;}canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);setNpForm(f=>({...f,image:canvas.toDataURL("image/jpeg",0.7)}));URL.revokeObjectURL(url);};img.src=url;};
  return(
    <div>
      <h2 style={{marginBottom:12,fontWeight:800}}>جلسة العمل 🪡</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
        <button onClick={()=>setMode("session")} style={{...BTS(mode==="session"?T.primary:T.card,T),justifyContent:"center",padding:"10px",border:mode==="session"?"none":`1px solid ${T.cardBorder}`}}>⏱ جلسة عمل</button>
        <button onClick={()=>{setMode("newProduct");if(!npForm)setNpForm({name:"",categoryKey:(data.categories||DEFAULT_CATEGORIES)[0]?.key,targetProfit:30,discount:0,laborMinutes:0,materialUsage:[],notes:"",image:"",status:"قيد العمل"});}} style={{...BTS(mode==="newProduct"?T.blue:T.card,T),justifyContent:"center",padding:"10px",border:mode==="newProduct"?"none":`1px solid ${T.cardBorder}`}}>🆕 منتج جديد بمؤقت</button>
      </div>
      {mode==="newProduct"&&npForm&&<div>
        <div style={{...CDS(T),marginBottom:12,textAlign:"center",border:`1px solid ${T.blue}40`}}>
          <div style={{fontSize:11,color:T.textFaint,marginBottom:5}}>⏱ مؤقت وقت الصنع</div>
          <div style={{fontSize:48,fontWeight:800,color:npRunning?(npPaused?T.yellow:T.blue):T.textSub,fontVariantNumeric:"tabular-nums",marginBottom:10}}>{fmtTime(npSec)}</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {!npRunning&&npSec===0&&<button onClick={()=>{setNpRunning(true);setNpPaused(false);}} style={{...BTS(T.blue,T),padding:"9px 20px",fontSize:13}}>▶ ابدئي</button>}
            {npRunning&&<><button onClick={()=>setNpPaused(p=>!p)} style={{...BTS(npPaused?T.green:T.yellow,T),padding:"8px 16px",fontSize:12}}>{npPaused?"▶":"⏸"}</button><button onClick={()=>{setNpRunning(false);setNpPaused(false);setNpForm(f=>({...f,laborMinutes:Math.round(npSec/60)}));}} style={{...BTS(T.green,T),padding:"8px 16px",fontSize:12}}>✓ انتهيت</button><button onClick={()=>{setNpRunning(false);setNpPaused(false);setNpSec(0);}} style={{...BTS(T.red,T),padding:"8px 14px",fontSize:12}}>↺</button></>}
            {!npRunning&&npSec>0&&<div style={{color:T.green,fontSize:13,fontWeight:700}}>{Math.round(npSec/60)} دقيقة ✅</div>}
          </div>
        </div>
        <div style={CDS(T)}>
          <div style={{marginBottom:10,display:"flex",gap:9,alignItems:"center"}}>
            <div onClick={()=>npImgRef.current.click()} style={{width:55,height:55,borderRadius:9,border:`2px dashed ${T.accentFaint}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",background:T.accentVeryFaint,flexShrink:0}}>{npForm.image?<img src={npForm.image} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<div style={{fontSize:18,color:T.textFaint}}>📷</div>}</div>
            <input ref={npImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleNpImg}/>
            <div style={{flex:1}}><LB T={T}>اسم المنتج</LB><IN value={npForm.name} onChange={e=>setNpForm(f=>({...f,name:e.target.value}))} placeholder="اسم المنتج" T={T}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div><LB T={T}>النوع</LB><SL value={npForm.categoryKey} onChange={e=>setNpForm(f=>({...f,categoryKey:e.target.value}))} T={T}>{(data.categories||DEFAULT_CATEGORIES).map(c=><option key={c.key} value={c.key}>{c.icon} {c.key}</option>)}</SL></div>
            <div><LB T={T}>دقيقة الصنع</LB><IN type="number" value={npForm.laborMinutes||Math.round(npSec/60)} onChange={e=>setNpForm(f=>({...f,laborMinutes:e.target.value}))} T={T}/></div>
            <div><LB T={T}>هامش الربح (%)</LB><IN type="number" value={npForm.targetProfit} onChange={e=>setNpForm(f=>({...f,targetProfit:e.target.value}))} T={T}/></div>
            <div><LB T={T}>تخفيض (%)</LB><IN type="number" value={npForm.discount} onChange={e=>setNpForm(f=>({...f,discount:e.target.value}))} T={T}/></div>
          </div>
          {npCalc.suggested>0&&<div style={{padding:"9px 12px",background:T.greenFaint,borderRadius:9,border:`1px solid ${T.green}25`,marginBottom:10}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}><RW l="التكلفة" v={`${fmt(Math.round(npCalc.totalCost||0))} ${cur}`} b T={T}/><RW l="السعر المقترح" v={`${fmt(npCalc.suggested||0)} ${cur}`} c={T.yellow} b T={T}/></div></div>}
          <button onClick={saveNewProduct} style={{...BTS(T.primary,T),width:"100%",padding:11,fontSize:14,justifyContent:"center"}}>💾 حفظ المنتج</button>
        </div>
      </div>}
      {mode==="session"&&<div>
        {step===1&&<div>
          <div style={CDS(T)}>
            <div style={{fontWeight:700,marginBottom:9,fontSize:13,color:T.accent}}>اختاري المنتجات</div>
            <IN value={sessionSearch} onChange={e=>setSessionSearch(e.target.value)} placeholder="🔍 بحث..." style={{marginBottom:8,width:"100%"}} T={T}/>
            {(data.products||[]).filter(p=>(p.status||"قيد العمل")!=="مباع"&&(!sessionSearch||p.name.includes(sessionSearch))).map(p=>{
              const sel=selProds.find(x=>x.id===p.id);
              return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 9px",borderRadius:9,marginBottom:5,background:sel?T.accentVeryFaint:"transparent",border:`1px solid ${sel?T.accentFaint:T.separator}`}}>
                {p.image&&<img src={p.image} style={{width:28,height:28,borderRadius:6,objectFit:"cover",flexShrink:0}} alt=""/>}
                <div onClick={()=>toggle(p.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${sel?T.primary:T.textFaint}`,background:sel?T.primary:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,flexShrink:0,cursor:"pointer",color:"#fff"}}>{sel&&"✓"}</div>
                <div style={{flex:1,cursor:"pointer"}} onClick={()=>toggle(p.id)}><div style={{fontWeight:600,fontSize:12}}>{!p.image&&catIcon(p.categoryKey)} {p.name}</div><div style={{fontSize:10,color:T.textFaint}}>✅{p.readyCount||0} · {fmt(p.suggestedPrice)} {cur}</div></div>
                {sel&&<input type="number" min="1" value={sel.qty} onClick={e=>e.stopPropagation()} onChange={e=>setQty(p.id,e.target.value)} style={{...INS,width:48,fontSize:14,padding:"3px 5px"}}/>}
              </div>);
            })}
            {selProds.length>0&&<div style={{marginTop:8,padding:8,background:T.accentVeryFaint,borderRadius:8,fontSize:11,color:T.accent,textAlign:"center"}}>✅ {selProds.length} منتج · {totalPcs} قطعة</div>}
          </div>
          <button onClick={start} disabled={!selProds.length} style={{...BTS(selProds.length?T.primary:T.card,T),width:"100%",padding:13,fontSize:14,justifyContent:"center",marginTop:11,opacity:selProds.length?1:0.5}}>▶ ابدئي الجلسة</button>
        </div>}
        {step===2&&<div style={{...CDS(T),textAlign:"center",border:`1px solid ${T.red}30`}}>
          <div style={{fontSize:52,fontWeight:800,color:paused?T.yellow:T.red,fontVariantNumeric:"tabular-nums",marginBottom:5}}>{fmtTime(timerSec)}</div>
          <div style={{display:"flex",justifyContent:"center",gap:14,fontSize:12,marginBottom:12}}><span style={{color:T.textFaint}}>🧶 {totalPcs} قطعة</span><span style={{color:T.yellow,fontWeight:600}}>{fmt(costPerPc)} {cur}/قطعة</span></div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>setPaused(p=>!p)} style={{...BTS(paused?T.green:T.yellow,T),padding:"10px 18px",fontSize:13}}>{paused?"▶ استئناف":"⏸ إيقاف"}</button>
            <button onClick={finish} style={{...BTS(T.blue,T),padding:"10px 18px",fontSize:13}}>⏹ إنهاء</button>
            <button onClick={cancel} style={{...BTS(T.red,T),padding:"10px 18px",fontSize:13}}>✕ إلغاء</button>
          </div>
        </div>}
        {step===3&&<div style={CDS(T)}>
          <div style={{color:T.green,fontWeight:800,fontSize:15,marginBottom:12}}>✅ انتهت الجلسة!</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            <RW l="الوقت" v={`${Math.round(timerSec/60)} دقيقة`} b T={T}/>
            <RW l="القطع" v={totalPcs} b T={T}/>
            <RW l="دقيقة/قطعة" v={totalPcs>0?Math.round((timerSec/60)/totalPcs):0} b T={T}/>
            <RW l="تكلفة/قطعة" v={`${fmt(costPerPc)} ${cur}`} c={T.yellow} b T={T}/>
          </div>
          <div style={{marginBottom:11,padding:10,background:T.greenFaint,borderRadius:9,border:`1px solid ${T.green}25`}}>
            <div style={{color:T.green,fontWeight:700,fontSize:12,marginBottom:7}}>📦 أضيفي للمخزون الجاهز؟</div>
            {selProds.map(s=>{const p=data.products.find(x=>x.id===s.id);if(!p)return null;const ch=addToReady.includes(p.id);return(<div key={p.id} onClick={()=>setAddToReady(prev=>ch?prev.filter(x=>x!==p.id):[...prev,p.id])} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",cursor:"pointer"}}><div style={{width:16,height:16,borderRadius:4,border:`2px solid ${ch?T.green:T.textFaint}`,background:ch?T.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0,color:"#fff"}}>{ch&&"✓"}</div>{p.image&&<img src={p.image} style={{width:20,height:20,borderRadius:4,objectFit:"cover"}} alt=""/>}<span style={{fontSize:12}}>{p.name} × {s.qty}</span></div>);})}
          </div>
          <div style={{marginBottom:10}}><LB T={T}>ملاحظات</LB><textarea value={extraNote} onChange={e=>setExtraNote(e.target.value)} placeholder="أي شي إضافي..." style={{...INS,minHeight:50,resize:"vertical"}}/></div>
          <button onClick={saveSession} style={{...BTS(T.primary,T),width:"100%",padding:12,fontSize:14,justifyContent:"center"}}>💾 حفظ الجلسة</button>
        </div>}
      </div>}
    </div>
  );
}

function Monthly({data,cur,T}){
  const monthly={};
  data.sales.forEach(s=>{
    if(!s.date)return;
    const p=s.date.split("/");
    let ym="";
    if(p.length===3&&p[2].length===4)ym=`${p[2]}-${p[1].padStart(2,"0")}`;
    else if(p.length===3&&p[0].length===4)ym=`${p[0]}-${p[1].padStart(2,"0")}`;
    else ym=s.date.substring(0,7);
    if(!ym)return;
    if(!monthly[ym])monthly[ym]={sales:0,profit:0,count:0};
    monthly[ym].sales+=Number(s.total||0);monthly[ym].profit+=Number(s.totalProfit||0);monthly[ym].count+=Number(s.qty||1);
  });
  const MONTH_AR=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const ml=ym=>{if(!ym||!ym.includes("-"))return ym||"";const[y,m]=ym.split("-");const mi=parseInt(m);if(isNaN(mi)||mi<1||mi>12)return ym;return`${MONTH_AR[mi-1]} ${y}`;};
  const months=Object.keys(monthly).sort().reverse();
  const maxS=Math.max(...months.map(m=>monthly[m].sales),1);
  return(
    <div>
      <h2 style={{marginBottom:12,fontWeight:800}}>الإحصائيات 📅</h2>
      {!months.length&&<div style={{textAlign:"center",padding:35,color:T.textFaint}}><div style={{fontSize:44}}>📅</div><div style={{marginTop:8}}>ما في بيانات بعد</div></div>}
      {months.map(m=>{const d=monthly[m];const bw=Math.round((d.sales/maxS)*100);const ip=d.sales===maxS&&months.length>1;return(
        <div key={m} style={{...CDS(T),marginBottom:9,border:ip?`1px solid ${T.green}50`:undefined}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><div style={{fontWeight:700,fontSize:13}}>{ml(m)}{ip&&<span style={{fontSize:10,color:T.green,marginRight:7}}>🏆 ذروة</span>}</div><div style={{fontSize:13,color:T.green,fontWeight:700}}>{fmt(d.sales)} {cur}</div></div>
          <div style={{background:T.separator,borderRadius:5,height:7,marginBottom:8,overflow:"hidden"}}><div style={{width:`${bw}%`,height:"100%",background:ip?T.green:T.primary,borderRadius:5}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}><RW l="المبيعات" v={`${fmt(d.sales)} ${cur}`} T={T}/><RW l="الأرباح" v={`${fmt(Math.round(d.profit))} ${cur}`} c={T.blue} T={T}/><RW l="القطع" v={d.count} T={T}/></div>
        </div>
      );})}
    </div>
  );
}

function CustomerOrders({data,update,T}){
  const[form,setForm]=useState({text:"",type:"طلب زبون",priority:"عادي"});
  const orders=data.customerOrders||[];
  const add=()=>{if(!form.text.trim())return;update(prev=>({...prev,customerOrders:[...(prev.customerOrders||[]),{id:Date.now().toString(),...form,done:false,date:todayStr()}]}));setForm({text:"",type:"طلب زبون",priority:"عادي"});};
  const toggle=id=>update(prev=>({...prev,customerOrders:(prev.customerOrders||[]).map(o=>o.id===id?{...o,done:!o.done}:o)}));
  const del=id=>confirmDel("حذف هذا الطلب؟",()=>update(prev=>({...prev,customerOrders:(prev.customerOrders||[]).filter(o=>o.id!==id)})));
  const pending=orders.filter(o=>!o.done).sort((a,b)=>a.priority==="عاجل"?-1:b.priority==="عاجل"?1:a.priority==="مهم"?-1:1);
  const done=orders.filter(o=>o.done);
  return(
    <div>
      <h2 style={{marginBottom:12,fontWeight:800}}>طلبات الزبائن 📋</h2>
      <div style={{...CDS(T),marginBottom:12}}>
        <IN value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} placeholder="طلب أو فكرة أو ريستوك..." style={{marginBottom:8,width:"100%"}} T={T}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:9}}>
          <div><LB T={T}>النوع</LB><SL value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} T={T}><option>طلب زبون</option><option>إعادة ستوك</option><option>فكرة منتج</option><option>ملاحظة</option></SL></div>
          <div><LB T={T}>الأولوية</LB><SL value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} T={T}><option>عادي</option><option>مهم</option><option>عاجل</option></SL></div>
        </div>
        <button onClick={add} style={{...BTS(T.primary,T),width:"100%",justifyContent:"center"}}>+ إضافة</button>
      </div>
      {pending.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:12,color:T.textFaint,fontWeight:600,marginBottom:8}}>⏳ قيد التنفيذ ({pending.length})</div>{pending.map(o=><div key={o.id} style={{...CDS(T),marginBottom:7,border:`1px solid ${o.priority==="عاجل"?T.red+"45":o.priority==="مهم"?T.yellow+"35":T.cardBorder}`}}><div style={{display:"flex",alignItems:"center",gap:9}}><div onClick={()=>toggle(o.id)} style={{width:22,height:22,borderRadius:6,border:`2px solid ${T.textFaint}`,background:"transparent",cursor:"pointer",flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{o.text}</div><div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}><span style={{fontSize:10,background:T.accentVeryFaint,color:T.accent,borderRadius:5,padding:"1px 6px"}}>{o.type}</span>{o.priority!=="عادي"&&<span style={{fontSize:10,background:o.priority==="عاجل"?T.redFaint:T.yellowFaint,color:o.priority==="عاجل"?T.red:T.yellow,borderRadius:5,padding:"1px 6px"}}>{o.priority}</span>}<span style={{fontSize:10,color:T.textFaint}}>{o.date}</span></div></div><button onClick={()=>del(o.id)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:17,padding:"4px"}}>🗑</button></div></div>)}</div>}
      {done.length>0&&<div><div style={{fontSize:12,color:T.textFaint,fontWeight:600,marginBottom:8}}>✅ منجز ({done.length})</div>{done.map(o=><div key={o.id} style={{...CDS(T),marginBottom:6,opacity:0.5}}><div style={{display:"flex",alignItems:"center",gap:9}}><div onClick={()=>toggle(o.id)} style={{width:22,height:22,borderRadius:6,border:`2px solid ${T.green}`,background:T.green,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,color:"#fff"}}>✓</div><div style={{flex:1,textDecoration:"line-through",fontSize:12,color:T.textFaint}}>{o.text}</div><button onClick={()=>del(o.id)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:15,padding:"4px"}}>🗑</button></div></div>)}</div>}
      {!orders.length&&<div style={{textAlign:"center",padding:35,color:T.textFaint}}><div style={{fontSize:44}}>📋</div><div style={{marginTop:8}}>ما في طلبات بعد</div></div>}
    </div>
  );
}

function AlertsPage({alerts,T}){
  return(
    <div>
      <h2 style={{marginBottom:12,fontWeight:800}}>التنبيهات 🔔</h2>
      {!alerts.length&&<div style={{textAlign:"center",padding:40,color:T.textFaint}}><div style={{fontSize:48}}>✅</div><div style={{marginTop:10}}>كل شي تمام!</div></div>}
      {alerts.map((a,i)=><div key={i} style={{...CDS(T),marginBottom:9,border:`1px solid ${a.color}40`,display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:22}}>{a.type==="stock"?"📦":"⚠️"}</div><div style={{color:a.color,fontWeight:600,fontSize:13}}>{a.msg}</div></div>)}
    </div>
  );
}
// eslint-disable-next-line no-unused-vars
function Settings({data,update,T,ui,fScale,bScale}){
  const[rate,setRate]=useState(data.settings.hourlyRate);
  const[currency,setCurrency]=useState(data.settings.currency);
  const[cats,setCats]=useState(data.categories||DEFAULT_CATEGORIES);
  const[newCat,setNewCat]=useState({key:"",icon:"🧶"});
  const[mergeStatus,setMergeStatus]=useState(null);
  const importRef=useRef();
  const curUi=data.ui||initialState.ui;
  const saveUi=(key,val)=>update(prev=>({...prev,ui:{...initialState.ui,...(prev.ui||{}),[key]:val}}));
  const save=()=>{update(prev=>({...prev,settings:{hourlyRate:Number(rate),currency},categories:cats}));alert("تم الحفظ ✅");};
  const addCat=()=>{if(!newCat.key.trim())return;setCats(c=>[...c,{key:newCat.key.trim(),icon:newCat.icon||"🧶"}]);setNewCat({key:"",icon:"🧶"});};
  const delCat=key=>setCats(c=>c.filter(x=>x.key!==key));
  const exportData=(label="backup")=>{const b=new Blob([JSON.stringify({...data,_exportedAt:new Date().toISOString(),_device:label},null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`kokla_${label}_${todayStr().replace(/\//g,"-")}.json`;a.click();URL.revokeObjectURL(u);};
  const mergeArr=(c,i)=>{if(!Array.isArray(i))return c;const ids=new Set((c||[]).map(x=>x.id));return[...(c||[]),...i.filter(x=>x.id&&!ids.has(x.id))];};
  const handleImport=e=>{const file=e.target.files[0];if(!file)return;setMergeStatus(null);const r=new FileReader();r.onload=ev=>{try{const inc=JSON.parse(ev.target.result);if(!inc||typeof inc!=="object"){setMergeStatus({error:"الملف غير صالح"});return;}const merged={...data,products:mergeArr(data.products,inc.products),materials:mergeArr(data.materials,inc.materials),purchases:mergeArr(data.purchases,inc.purchases),bazaars:mergeArr(data.bazaars,inc.bazaars),sales:mergeArr(data.sales,inc.sales),sessions:mergeArr(data.sessions,inc.sessions),customerOrders:mergeArr(data.customerOrders,inc.customerOrders)};const added={products:merged.products.length-data.products.length,sales:merged.sales.length-data.sales.length,bazaars:merged.bazaars.length-data.bazaars.length,materials:merged.materials.length-data.materials.length};update(()=>merged);setMergeStatus({added,total:Object.values(added).reduce((s,v)=>s+v,0)});}catch(err){setMergeStatus({error:"خطأ: "+err.message});}e.target.value="";};r.readAsText(file);};
  const downloadProductList=()=>{
    const prods=data.products||[];
    const rows=prods.map((p,i)=>{
      const code=`K${String(i+1).padStart(3,"0")}`;
      const catObj=(data.categories||DEFAULT_CATEGORIES).find(x=>x.key===p.categoryKey);
      const img=p.image?`<img src="${p.image}" style="width:55px;height:55px;object-fit:cover;border-radius:7px;border:1px solid #ddd"/>`:`<div style="width:55px;height:55px;background:#f3e8ff;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:22px">${catObj?.icon||"🧶"}</div>`;
      const stColor=p.status==="مكتمل"?"#16a34a":p.status==="مباع"?"#1d4ed8":"#d97706";
      return `<tr><td style="padding:8px;text-align:center;font-weight:800;color:#7c3aed;font-size:15px">${code}</td><td style="padding:8px">${img}</td><td style="padding:8px;font-weight:700">${p.name}</td><td style="padding:8px">${catObj?.icon||""} ${p.categoryKey||""}</td><td style="padding:8px;font-weight:700;color:#15803d">${Number(p.suggestedPrice||0).toLocaleString("ar-IQ")} ${data.settings.currency}</td><td style="padding:8px;text-align:center"><span style="background:${stColor}22;color:${stColor};padding:3px 8px;border-radius:6px;font-size:11px">${p.status||"قيد العمل"}</span></td><td style="padding:8px;text-align:center;color:#16a34a;font-weight:700">${Number(p.readyCount||0)}</td></tr>`;
    }).join("");
    const html=`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>قائمة منتجات كوكله</title><style>body{font-family:Arial,sans-serif;padding:20px;direction:rtl}h1{color:#7c3aed;text-align:center}.sub{text-align:center;color:#888;margin-bottom:20px;font-size:13px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f3e8ff;color:#7c3aed;padding:10px 8px;border-bottom:2px solid #c084fc;font-weight:700}tr:nth-child(even){background:#faf5ff}button{display:block;margin:0 auto 16px;padding:10px 24px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px}@media print{button{display:none}}</style></head><body><h1>🧶 كوكله — قائمة المنتجات</h1><div class="sub">تاريخ الطباعة: ${todayStr()} — ${prods.length} منتج</div><button onclick="window.print()">🖨️ طباعة</button><table><thead><tr><th>الكود</th><th>الصورة</th><th>الاسم</th><th>النوع</th><th>السعر</th><th>الحالة</th><th>جاهز</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`kokla_products_${todayStr().replace(/\//g,"-")}.html`;a.click();URL.revokeObjectURL(url);
  };
  return(
    <div>
      <h2 style={{marginBottom:12,fontWeight:800}}>الإعدادات ⚙️</h2>
      <div style={{...CDS(T),marginBottom:10,border:`1px solid ${T.blue}35`}}>
        <div style={{color:T.blue,fontWeight:800,marginBottom:4,fontSize:14}}>📲 نقل البيانات</div>
        <div style={{fontSize:11,color:T.textFaint,marginBottom:11,lineHeight:1.7}}>موبايل → تصدير → أرسلي الملف → لابتوب → استيراد ✅</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:9}}>
          <button onClick={()=>exportData("mobile")} style={{...BTS(T.blue,T),justifyContent:"center",padding:"9px",fontSize:12}}>📱 تصدير موبايل</button>
          <button onClick={()=>exportData("laptop")} style={{background:T.blueFaint,border:`1px solid ${T.blue}40`,borderRadius:9,padding:"9px",cursor:"pointer",color:T.blue,fontFamily:"inherit",fontSize:12,fontWeight:600,display:"flex",justifyContent:"center"}}>💻 نسخة احتياطية</button>
        </div>
        <button onClick={()=>importRef.current.click()} style={{...BTS(T.green,T),width:"100%",justifyContent:"center",padding:"10px",fontSize:13}}>🔀 استيراد ودمج</button>
        <input ref={importRef} type="file" accept=".json" style={{display:"none"}} onChange={handleImport}/>
        {mergeStatus&&<div style={{marginTop:9,padding:10,borderRadius:9,background:mergeStatus.error?T.redFaint:T.greenFaint,border:`1px solid ${mergeStatus.error?T.red:T.green}35`}}>{mergeStatus.error?<div style={{color:T.red,fontSize:12}}>❌ {mergeStatus.error}</div>:<div><div style={{color:T.green,fontWeight:700,fontSize:12,marginBottom:5}}>✅ تم الدمج! +{mergeStatus.total} عنصر</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,fontSize:11}}>{Object.entries(mergeStatus.added).map(([k,v])=>v>0&&<div key={k} style={{color:T.textSub}}>+{v} {k==="products"?"منتج":k==="sales"?"بيعة":k==="bazaars"?"بازار":"مادة"}</div>)}</div></div>}</div>}
      </div>
      <div style={{...CDS(T),marginBottom:10}}>
        <div style={{fontWeight:700,marginBottom:9,color:T.accent}}>💰 سعر ساعة العمل</div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:9}}><IN type="number" value={rate} onChange={e=>setRate(e.target.value)} style={{flex:1}} T={T}/><SL value={currency} onChange={e=>setCurrency(e.target.value)} style={{width:"auto"}} T={T}><option>د.ع</option><option>$</option><option>€</option></SL></div>
        <div style={{padding:9,background:T.accentVeryFaint,borderRadius:9,fontSize:12}}>{[15,30,60,120].map(m=><div key={m} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.separator}`,color:T.textSub}}><span>{m} دقيقة</span><span style={{color:T.yellow}}>{fmt(Math.round((m/60)*Number(rate)))} {currency}</span></div>)}</div>
      </div>
      <div style={{...CDS(T),marginBottom:10}}>
        <div style={{fontWeight:700,marginBottom:9,color:T.accent}}>🗂 أنواع المنتجات</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{cats.map(c=><div key={c.key} style={{display:"flex",alignItems:"center",gap:4,background:T.accentVeryFaint,borderRadius:8,padding:"4px 9px",border:`1px solid ${T.accentFaint}`}}><span style={{fontSize:14}}>{c.icon}</span><span style={{fontSize:11,fontWeight:600,color:T.text}}>{c.key}</span><button onClick={()=>delCat(c.key)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:12,padding:0}}>✕</button></div>)}</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}><IN value={newCat.icon} onChange={e=>setNewCat(f=>({...f,icon:e.target.value}))} style={{width:42}} placeholder="🧶" T={T}/><IN value={newCat.key} onChange={e=>setNewCat(f=>({...f,key:e.target.value}))} placeholder="اسم النوع الجديد" style={{flex:1}} T={T}/><button onClick={addCat} style={{...BTS(T.primary,T),padding:"8px 11px"}}>+</button></div>
        <div style={{fontSize:10,color:T.textFaint,marginTop:6}}>💡 لا تنسي الحفظ</div>
      </div>
      <div style={{...CDS(T),marginBottom:10,border:`1px solid ${T.accentFaint}`}}>
        <div style={{fontWeight:800,marginBottom:10,fontSize:14,color:T.accent}}>🎨 مظهر التطبيق</div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:T.textFaint,marginBottom:7,fontWeight:600}}>الثيم</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{Object.entries(THEMES).map(([key,th])=><button key={key} onClick={()=>saveUi("theme",key)} style={{background:th.bgGrad,border:`2px solid ${curUi.theme===key?th.primary:"rgba(255,255,255,0.1)"}`,borderRadius:11,padding:"11px 8px",cursor:"pointer",color:th.text,fontFamily:"inherit",fontSize:12,fontWeight:curUi.theme===key?700:400,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}><span style={{fontSize:18}}>{th.icon}</span><div style={{textAlign:"right"}}><div>{th.name}</div><div style={{fontSize:9,opacity:0.6}}>{th.dark?"🌙 داكن":"☀️ فاتح"}</div></div>{curUi.theme===key&&<span style={{color:th.primary,fontSize:16,marginRight:"auto"}}>✓</span>}</button>)}</div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:T.textFaint,marginBottom:6,fontWeight:600}}>حجم الخط</div>
          <div style={{display:"flex",gap:6}}>{[{val:"small",label:"صغير",s:11},{val:"medium",label:"متوسط",s:13},{val:"large",label:"كبير",s:16}].map(f=><button key={f.val} onClick={()=>saveUi("fontSize",f.val)} style={{flex:1,background:curUi.fontSize===f.val?T.primary:T.card,border:`1px solid ${curUi.fontSize===f.val?"transparent":T.cardBorder}`,borderRadius:8,padding:"8px 4px",cursor:"pointer",color:curUi.fontSize===f.val?"#fff":T.text,fontFamily:"inherit",fontSize:f.s,fontWeight:curUi.fontSize===f.val?700:400}}>{f.label}</button>)}</div>
        </div>
        <div>
          <div style={{fontSize:11,color:T.textFaint,marginBottom:6,fontWeight:600}}>حجم الأزرار</div>
          <div style={{display:"flex",gap:6}}>{[{val:"small",label:"صغير",p:"5px 4px"},{val:"medium",label:"متوسط",p:"8px 4px"},{val:"large",label:"كبير",p:"13px 4px"}].map(b=><button key={b.val} onClick={()=>saveUi("btnSize",b.val)} style={{flex:1,background:curUi.btnSize===b.val?T.primary:T.card,border:`1px solid ${curUi.btnSize===b.val?"transparent":T.cardBorder}`,borderRadius:8,padding:b.p,cursor:"pointer",color:curUi.btnSize===b.val?"#fff":T.text,fontFamily:"inherit",fontSize:12,fontWeight:curUi.btnSize===b.val?700:400}}>{b.label}</button>)}</div>
        </div>
      </div>
      <div style={{...CDS(T),marginBottom:10}}>
        <div style={{fontWeight:700,marginBottom:8,color:T.accent}}>🗂 بياناتك</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,fontSize:11,marginBottom:10}}>
          <RW l="المنتجات" v={(data.products||[]).length} T={T}/>
          <RW l="المواد" v={data.materials.length} T={T}/>
          <RW l="البازارات" v={data.bazaars.length} T={T}/>
          <RW l="المبيعات" v={data.sales.length} T={T}/>
          <RW l="الجلسات" v={(data.sessions||[]).length} T={T}/>
        </div>
        <button onClick={save} style={{...BTS(T.primary,T),width:"100%",marginBottom:8}}>💾 حفظ الإعدادات</button>
      </div>
      <div style={{...CDS(T)}}>
        <div style={{fontWeight:700,marginBottom:6,color:T.accent}}>📄 قائمة المنتجات للطباعة</div>
        <div style={{fontSize:11,color:T.textFaint,marginBottom:10,lineHeight:1.7}}>تحميل قائمة بكل منتجاتك مع الكود والصورة والسعر — افتحيها بالمتصفح واطبعيها 🖨️</div>
        <button onClick={downloadProductList} style={{...BTS(T.primary,T),width:"100%",justifyContent:"center",padding:"11px",fontSize:13}}>📄 تحميل قائمة المنتجات</button>
      </div>
    </div>
  );
}