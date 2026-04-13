// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_CATEGORIES = [
  { key: "ميداليات", icon: "🥇" },
  { key: "ملابس", icon: "👗" },
  { key: "حقائب", icon: "👜" },
  { key: "إكسسوارات", icon: "💎" },
  { key: "ديكور بيت", icon: "🏡" },
  { key: "منتجات شعر", icon: "🎀" },
];

const initialState = {
  categories: DEFAULT_CATEGORIES,
  products: [],
  materials: [],
  purchases: [],
  bazaars: [],
  sales: [],
  sessions: [],
  settings: { hourlyRate: 3000, currency: "ع.د" },
};

function loadData() {
  try {
    const s = localStorage.getItem("kokla_v5");
    return s ? { ...initialState, ...JSON.parse(s) } : initialState;
  } catch { return initialState; }
}
function saveData(d) { localStorage.setItem("kokla_v5", JSON.stringify(d)); }
function fmt(n) { return Number(n || 0).toLocaleString("ar-IQ"); }
function fmtTime(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function calcPrice(laborMinutes, materialCost, targetProfit, discount, hourlyRate) {
  const laborCost = (Number(laborMinutes || 0) / 60) * hourlyRate;
  const totalCost = laborCost + Number(materialCost || 0);
  const suggested = Math.ceil((totalCost * (1 + Number(targetProfit || 30) / 100)) / 250) * 250;
  const discounted = Math.round(suggested * (1 - Number(discount || 0) / 100));
  return { laborCost, totalCost, suggested, discounted };
}
function getMonth(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, "0")}`;
  return dateStr.substring(0, 7);
}
const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
function monthLabel(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${AR_MONTHS[parseInt(m) - 1]} ${y}`;
}
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// Format date as Arabic readable
function formatDateAr(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch { return dateStr; }
}

// Get today's date string YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Check if bazaar date has passed
function isBazaarPast(dateStr) {
  if (!dateStr) return false;
  const today = todayStr();
  return dateStr < today;
}

const TABS = [
  { key: "dashboard", label: "الرئيسية", icon: "📊" },
  { key: "products", label: "المنتجات", icon: "🧶" },
  { key: "session", label: "جلسة عمل", icon: "⏱️" },
  { key: "inventory", label: "المخزون", icon: "📦" },
  { key: "bazaars", label: "البازارات", icon: "🏪" },
  { key: "sales", label: "المبيعات", icon: "💰" },
  { key: "monthly", label: "إحصائيات", icon: "📅" },
  { key: "settings", label: "الإعدادات", icon: "⚙️" },
];

// Confirm dialog component
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "#1e1035", border: "1px solid rgba(255,100,180,0.3)",
        borderRadius: 16, padding: 24, maxWidth: 320, width: "100%", textAlign: "center"
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: "#f0e6ff", fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ ...Bs("rgba(255,255,255,0.12)"), flex: 1, padding: 12, fontSize: 14 }}>
            إلغاء
          </button>
          <button onClick={onConfirm} style={{ ...Bs("#f87171"), flex: 1, padding: 12, fontSize: 14 }}>
            🗑️ حذف
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("dashboard");
  const [timerSec, setTimerSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => {
    if (running && !paused) timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running, paused]);

  // Swipe navigation
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only swipe if horizontal movement is dominant
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const currentIdx = TABS.findIndex(t => t.key === tab);
    if (dx < 0 && currentIdx < TABS.length - 1) {
      setTab(TABS[currentIdx + 1].key);
    } else if (dx > 0 && currentIdx > 0) {
      setTab(TABS[currentIdx - 1].key);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [tab]);

  const update = fn => setData(prev => fn(prev));
  const cur = data.settings.currency;
  const hr = data.settings.hourlyRate || 3000;

  const stats = (() => {
    const totalSales = data.sales.reduce((s, x) => s + Number(x.total || 0), 0);
    const totalMaterials = data.purchases.reduce((s, x) => s + Number(x.totalCost || 0), 0);
    const totalProfit = data.sales.reduce((s, x) => s + Number(x.totalProfit || 0), 0);
    const readyTotal = (data.products || []).reduce((s, p) => s + Number(p.readyCount || 0), 0);
    return { totalSales, totalMaterials, totalProfit, readyTotal };
  })();

  const catIcon = key => (data.categories || DEFAULT_CATEGORIES).find(c => c.key === key)?.icon || "🧶";

  return (
    <div
      style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0a2e 0%,#16213e 50%,#0f3460 100%)", fontFamily: "'Tajawal', sans-serif", direction: "rtl" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,180,220,0.1)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div onClick={() => setTab("dashboard")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <span style={{ fontSize: 28 }}>🧶</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#ffb4dc", lineHeight: 1 }}>كوكله</div>
            <div style={{ fontSize: 10, color: "rgba(255,180,220,0.5)" }}>مدير أعمالك الذكي</div>
          </div>
        </div>
        {running && (
          <div style={{ background: paused ? "rgba(255,180,0,0.2)" : "rgba(255,100,100,0.2)", border: `1px solid ${paused ? "rgba(255,180,0,0.4)" : "rgba(255,100,100,0.4)"}`, borderRadius: 10, padding: "6px 12px", fontSize: 15, fontWeight: 700, color: paused ? "#fbbf24" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ animation: paused ? "none" : "pulse 1s infinite" }}>{paused ? "⏸️" : "⏱️"}</span>
            {" "}{fmtTime(timerSec)}
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", overflowX: "auto", padding: "10px 12px", gap: 7, background: "rgba(0,0,0,0.2)", scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "linear-gradient(135deg,#ff6eb4,#ff4d9e)" : running && t.key === "session" ? "rgba(255,100,100,0.2)" : "rgba(255,255,255,0.07)",
            border: "none", borderRadius: 18, padding: "8px 14px", cursor: "pointer",
            color: tab === t.key ? "#fff" : "#e8c8f0",
            fontFamily: "inherit", fontSize: 13, fontWeight: tab === t.key ? 700 : 400, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
          }}>
            {t.icon} {t.label}
            {t.key === "session" && running && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", animation: "pulse 1s infinite" }} />}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 13px", maxWidth: 900, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard stats={stats} data={data} cur={cur} catIcon={catIcon} setTab={setTab} />}
        {tab === "products" && <Products data={data} update={update} cur={cur} hr={hr} catIcon={catIcon} />}
        {tab === "session" && <Session data={data} update={update} cur={cur} hr={hr} catIcon={catIcon} timerSec={timerSec} running={running} paused={paused} setRunning={setRunning} setPaused={setPaused} setTimerSec={setTimerSec} activeSession={activeSession} setActiveSession={setActiveSession} />}
        {tab === "inventory" && <Inventory data={data} update={update} cur={cur} />}
        {tab === "bazaars" && <Bazaars data={data} update={update} cur={cur} catIcon={catIcon} />}
        {tab === "sales" && <Sales data={data} update={update} cur={cur} catIcon={catIcon} />}
        {tab === "monthly" && <Monthly data={data} cur={cur} />}
        {tab === "settings" && <Settings data={data} update={update} />}
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:rgba(255,100,180,0.4);border-radius:3px}
        input,select,textarea{outline:none}
        button:active{transform:scale(0.96)}
        select option{background:#1a1035;color:#f0e6ff}
      `}</style>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ stats, data, cur, catIcon, setTab }) {
  const cards = [
    { label: "إجمالي المبيعات", value: `${fmt(stats.totalSales)} ${cur}`, icon: "💰", color: "#4ade80", tab: "sales" },
    { label: "إجمالي الأرباح", value: `${fmt(stats.totalProfit)} ${cur}`, icon: "📈", color: "#60a5fa", tab: "monthly" },
    { label: "تكلفة المواد", value: `${fmt(stats.totalMaterials)} ${cur}`, icon: "🧵", color: "#c084fc", tab: "inventory" },
    { label: "قطع جاهزة", value: stats.readyTotal, icon: "📦", color: "#fb923c", tab: "products" },
  ];
  const recent = [...data.sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  return (
    <div>
      <h2 style={{ color: "#ffb4dc", marginBottom: 14, fontWeight: 800 }}>لوحة التحكم</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 18 }}>
        {cards.map(c => (
          <div key={c.label} onClick={() => setTab(c.tab)} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 13, padding: 14, border: "1px solid rgba(255,180,220,0.1)", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>{c.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
      </div>
      {recent.length > 0 && (
        <div style={Cs}>
          <div style={{ color: "#ffb4dc", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>آخر المبيعات</div>
          {recent.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <span style={{ fontWeight: 600 }}>{s.productName}</span>
                {s.qty > 1 && <span style={{ color: "#fbbf24", fontSize: 11, marginRight: 5 }}>×{s.qty}</span>}
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginRight: 8 }}>{s.date}</span>
              </div>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(s.total)} {cur}</span>
            </div>
          ))}
        </div>
      )}
      {!data.sales.length && !(data.products || []).length && (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 55 }}>🧶</div>
          <div style={{ fontSize: 15, marginTop: 10 }}>أهلاً بكِ بكوكله!</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>ابدئي بإضافة منتجاتك</div>
        </div>
      )}
    </div>
  );
}

// ── Products ──────────────────────────────────────────────────────────────────
function Products({ data, update, cur, hr, catIcon }) {
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const ef = () => ({ name: "", categoryKey: (data.categories || DEFAULT_CATEGORIES)[0]?.key || "", laborMinutes: 0, materialUsage: [], targetProfit: 30, discount: 0, notes: "", image: "", suggestedPrice: 0, discountedPrice: 0, totalCost: 0, readyCount: 0, soldCount: 0 });
  const [form, setForm] = useState(ef);
  const imgRef = useRef();

  const matCost = form.materialUsage.reduce((s, r) => {
    const m = data.materials.find(x => x.id === r.materialId);
    if (!m) return s;
    const unitCost = m.priceUnit === "100g" ? Number(m.costPer100 || 0) / 100 : Number(m.costPerUnit || 0);
    return s + Number(r.qty || 0) * unitCost;
  }, 0);
  const { laborCost, totalCost, suggested, discounted } = calcPrice(form.laborMinutes, matCost, form.targetProfit, form.discount, hr);

  const addMat = () => setForm(f => ({ ...f, materialUsage: [...f.materialUsage, { materialId: "", qty: 1 }] }));
  const remMat = i => setForm(f => ({ ...f, materialUsage: f.materialUsage.filter((_, idx) => idx !== i) }));
  const updMat = (i, field, val) => setForm(f => ({ ...f, materialUsage: f.materialUsage.map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setForm(f => ({ ...f, image: b64 }));
  };

  const save = () => {
    if (!form.name.trim()) return;
    const prod = { ...form, id: editId || Date.now().toString(), name: form.name.trim(), materialCost: matCost, laborCost: Math.round(laborCost), totalCost: Math.round(totalCost), suggestedPrice: suggested, discountedPrice: discounted };
    update(prev => ({ ...prev, products: editId ? prev.products.map(p => p.id === editId ? prod : p) : [...(prev.products || []), prod] }));
    setForm(ef()); setEditId(null); setView("list");
  };

  const addReady = (id, count) => {
    update(prev => ({ ...prev, products: prev.products.map(p => p.id === id ? { ...p, readyCount: (Number(p.readyCount) || 0) + Number(count) } : p) }));
  };

  const del = id => {
    setConfirmDel(id);
  };

  const confirmDelete = () => {
    update(prev => ({ ...prev, products: prev.products.filter(p => p.id !== confirmDel) }));
    setConfirmDel(null);
  };

  return (
    <div>
      {confirmDel && <ConfirmDialog message="تريدين تحذفين هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه." onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ color: "#ffb4dc", fontWeight: 800 }}>🧶 المنتجات</h2>
        <button onClick={() => { setView(view === "add" ? "list" : "add"); setForm(ef()); setEditId(null); }} style={Bs("#ff6eb4")}>
          {view === "add" ? "← القائمة" : "+ منتج جديد"}
        </button>
      </div>

      {view === "add" && (
        <div style={Cs}>
          <h3 style={{ color: "#ffb4dc", marginBottom: 12 }}>{editId ? "تعديل المنتج" : "منتج جديد"}</h3>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => imgRef.current.click()} style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed rgba(255,180,220,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
              {form.image ? <img src={form.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <div style={{ textAlign: "center", color: "rgba(255,180,220,0.5)", fontSize: 11 }}>📷<br />صورة</div>}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#ffb4dc", marginBottom: 4 }}>صورة المنتج (اختياري)</div>
              {form.image && <button onClick={() => setForm(f => ({ ...f, image: "" }))} style={{ fontSize: 11, ...Bs("#f87171"), padding: "3px 8px" }}>حذف</button>}
            </div>
            <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            <div style={{ gridColumn: "span 2" }}><Lb>اسم المنتج</Lb><In value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثلاً: ميدالية وردة" /></div>
            <div><Lb>النوع</Lb><Sl value={form.categoryKey} onChange={e => setForm(f => ({ ...f, categoryKey: e.target.value }))}>{(data.categories || DEFAULT_CATEGORIES).map(c => <option key={c.key} value={c.key}>{c.icon} {c.key}</option>)}</Sl></div>
            <div><Lb>وقت الصنع (دقيقة/قطعة)</Lb><In type="number" value={form.laborMinutes} onChange={e => setForm(f => ({ ...f, laborMinutes: e.target.value }))} /></div>
          </div>
          <div style={{ marginTop: 12, padding: 11, background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ color: "#ffb4dc", fontWeight: 700, fontSize: 12 }}>🧵 المواد المستخدمة/قطعة</div>
              <button onClick={addMat} style={{ ...Bs("#60a5fa"), fontSize: 11, padding: "4px 9px" }}>+ مادة</button>
            </div>
            {!form.materialUsage.length && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>لا توجد مواد مضافة</div>}
            {form.materialUsage.map((r, i) => {
              const m = data.materials.find(x => x.id === r.materialId);
              const unitLabel = m ? (m.priceUnit === "100g" ? "100غم" : m.unit) : "وحدة";
              const unitPrice = m ? (m.priceUnit === "100g" ? Number(m.costPer100 || 0) : Number(m.costPerUnit || 0)) : 0;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px auto", gap: 6, marginBottom: 6 }}>
                  <Sl value={r.materialId} onChange={e => updMat(i, "materialId", e.target.value)}>
                    <option value="">اختاري مادة...</option>
                    {data.materials.map(m => <option key={m.id} value={m.id}>{m.name} ({fmt(unitPrice)}/{unitLabel})</option>)}
                  </Sl>
                  <In type="number" value={r.qty} onChange={e => updMat(i, "qty", e.target.value)} placeholder="الكمية" />
                  <button onClick={() => remMat(i)} style={{ ...Bs("#f87171"), padding: "6px 10px", fontSize: 16 }}>×</button>
                </div>
              );
            })}
            {form.materialUsage.length > 0 && <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>التكلفة: {fmt(Math.round(matCost))} {cur}/قطعة</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 10 }}>
            <div><Lb>هامش الربح (%)</Lb><In type="number" value={form.targetProfit} onChange={e => setForm(f => ({ ...f, targetProfit: e.target.value }))} /></div>
            <div><Lb>تخفيض (%)</Lb><In type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} /></div>
          </div>
          <div style={{ marginTop: 8 }}><Lb>ملاحظات</Lb><In value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div style={{ marginTop: 12, background: "rgba(74,222,128,0.08)", borderRadius: 11, padding: 11 }}>
            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 7, fontSize: 12 }}>📊 حساب السعر</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              <Rw l="تكلفة العمل/قطعة" v={`${fmt(Math.round(laborCost))} ${cur}`} />
              <Rw l="تكلفة المواد/قطعة" v={`${fmt(Math.round(matCost))} ${cur}`} />
              <Rw l="التكلفة الكلية/قطعة" v={`${fmt(Math.round(totalCost))} ${cur}`} b />
              <Rw l="السعر المقترح" v={`${fmt(suggested)} ${cur}`} c="#fbbf24" b />
              {form.discount > 0 && <Rw l={`بعد تخفيض ${form.discount}%`} v={`${fmt(discounted)} ${cur}`} c="#60a5fa" b />}
            </div>
          </div>
          <button onClick={save} style={{ ...Bs("#ff6eb4"), width: "100%", marginTop: 12, padding: 12, fontSize: 14, fontWeight: 700 }}>
            {editId ? "💾 حفظ التعديلات" : "✅ إضافة المنتج"}
          </button>
        </div>
      )}

      {view === "list" && (
        <div>
          {!(data.products || []).length && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>لا توجد منتجات بعد</div>}
          {(data.products || []).map(p => (
            <ProductCard key={p.id} p={p} cur={cur} catIcon={catIcon}
              onEdit={() => { setForm({ ...p, materialUsage: p.materialUsage || [] }); setEditId(p.id); setView("add"); }}
              onDel={() => del(p.id)}
              onAddReady={addReady}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ p, cur, catIcon, onEdit, onDel, onAddReady }) {
  const [addCount, setAddCount] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showImg, setShowImg] = useState(false);
  return (
    <div style={{ ...Cs, marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        {p.image && (
          <div onClick={() => setShowImg(!showImg)} style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
            <img src={p.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
            {!p.image && <span style={{ fontSize: 18 }}>{catIcon(p.categoryKey)}</span>}
            <span style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</span>
            {Number(p.readyCount) > 0 && <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", borderRadius: 8, padding: "2px 7px", fontSize: 11 }}>جاهز: {p.readyCount}</span>}
            {Number(p.soldCount) > 0 && <span style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", borderRadius: 8, padding: "2px 7px", fontSize: 11 }}>مباع: {p.soldCount}</span>}
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 11, color: "rgba(255,255,255,0.5)", flexWrap: "wrap" }}>
            <span>⏱️ {p.laborMinutes || 0} د/قطعة</span>
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>💰 {fmt(p.suggestedPrice)} {cur}</span>
            {p.discount > 0 && <span style={{ color: "#60a5fa" }}>-{p.discount}% = {fmt(p.discountedPrice)} {cur}</span>}
            <span style={{ color: "rgba(255,255,255,0.35)" }}>تكلفة: {fmt(Math.round(p.totalCost))} {cur}</span>
          </div>
        </div>
        {/* Larger buttons - feature #3 */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button onClick={() => setShowAdd(!showAdd)} style={{ ...Bs("#4ade80"), fontSize: 18, padding: "8px 12px", minWidth: 44, minHeight: 44 }}>➕</button>
          <button onClick={onEdit} style={{ ...Bs("rgba(255,255,255,0.12)"), fontSize: 18, padding: "8px 12px", minWidth: 44, minHeight: 44 }}>✏️</button>
          <button onClick={onDel} style={{ ...Bs("#f87171"), fontSize: 18, padding: "8px 12px", minWidth: 44, minHeight: 44 }}>🗑️</button>
        </div>
      </div>
      {showImg && p.image && (
        <div onClick={() => setShowImg(false)} style={{ marginTop: 10, borderRadius: 10, overflow: "hidden" }}>
          <img src={p.image} style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} alt="" />
        </div>
      )}
      {showAdd && (
        <div style={{ marginTop: 10, display: "flex", gap: 7, alignItems: "center", padding: "9px 11px", background: "rgba(74,222,128,0.08)", borderRadius: 10 }}>
          <span style={{ fontSize: 12, color: "#4ade80" }}>إضافة يدوية:</span>
          <input type="number" min="1" value={addCount} onChange={e => setAddCount(e.target.value)} style={{ ...Ns, width: 60, textAlign: "center", padding: "6px 8px" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>قطعة</span>
          <button onClick={() => { onAddReady(p.id, addCount); setShowAdd(false); setAddCount(1); }} style={{ ...Bs("#4ade80"), padding: "8px 14px", fontSize: 13 }}>✅ إضافة</button>
        </div>
      )}
    </div>
  );
}

// ── Session ───────────────────────────────────────────────────────────────────
function Session({ data, update, cur, hr, catIcon, timerSec, running, paused, setRunning, setPaused, setTimerSec, activeSession, setActiveSession }) {
  const [step, setStep] = useState(1);
  const [selProds, setSelProds] = useState([]);
  const [extraNote, setExtraNote] = useState("");
  const [addToReady, setAddToReady] = useState([]);

  const toggle = pid => setSelProds(prev => prev.find(x => x.id === pid) ? prev.filter(x => x.id !== pid) : [...prev, { id: pid, qty: 1 }]);
  const setQty = (pid, qty) => setSelProds(prev => prev.map(x => x.id === pid ? { ...x, qty: Number(qty) || 1 } : x));
  const totalPcs = selProds.reduce((s, x) => s + Number(x.qty || 1), 0);
  const costPerPc = totalPcs > 0 ? Math.round((timerSec / 3600) * hr / totalPcs) : 0;

  const start = () => {
    if (!selProds.length) return;
    setActiveSession({ prods: selProds });
    setRunning(true); setPaused(false); setStep(2);
  };
  const togglePause = () => setPaused(p => !p);
  const finish = () => { setRunning(false); setPaused(false); setStep(3); };
  const cancel = () => { setRunning(false); setPaused(false); setTimerSec(0); setActiveSession(null); setStep(1); setSelProds([]); };

  const saveSession = () => {
    const totalMins = Math.round(timerSec / 60);
    const minsPerPc = totalPcs > 0 ? Math.round(totalMins / totalPcs) : 0;
    update(prev => ({
      ...prev,
      products: prev.products.map(p => {
        const sel = activeSession.prods.find(x => x.id === p.id);
        if (!sel) return p;
        const addQty = addToReady.includes(p.id) ? Number(sel.qty || 1) : 0;
        return { ...p, readyCount: (Number(p.readyCount) || 0) + addQty };
      }),
      sessions: [...(prev.sessions || []), { id: Date.now().toString(), date: new Date().toLocaleDateString("ar-IQ"), totalPcs, totalMins, minsPerPc, note: extraNote, prods: activeSession.prods }],
    }));
    setTimerSec(0); setActiveSession(null); setSelProds([]); setExtraNote(""); setAddToReady([]); setStep(1);
  };

  return (
    <div>
      <h2 style={{ color: "#ffb4dc", fontWeight: 800, marginBottom: 14 }}>⏱️ جلسة العمل</h2>
      {step === 1 && (
        <div>
          <div style={{ ...Cs, marginBottom: 13 }}>
            <div style={{ color: "#ffb4dc", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>اختاري المنتجات للجلسة</div>
            {!(data.products || []).length && <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.3)" }}>أضيفي منتجات أولاً</div>}
            {(data.products || []).map(p => {
              const sel = selProds.find(x => x.id === p.id);
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {p.image && <img src={p.image} style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover" }} alt="" />}
                  <div onClick={() => toggle(p.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? "#ff6eb4" : "rgba(255,255,255,0.2)"}`, background: sel ? "#ff6eb4" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {sel && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => toggle(p.id)}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{!p.image && catIcon(p.categoryKey)} {p.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>⏱️ {p.readyCount || 0} جاهزة</div>
                  </div>
                  {sel && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>عدد:</span>
                      <input type="number" min="1" value={sel.qty} onClick={e => e.stopPropagation()} onChange={e => setQty(p.id, e.target.value)} style={{ ...Ns, width: 55, padding: "4px 6px", textAlign: "center" }} />
                    </div>
                  )}
                </div>
              );
            })}
            {selProds.length > 0 && <div style={{ marginTop: 9, padding: 9, background: "rgba(255,110,180,0.1)", borderRadius: 9, fontSize: 12, color: "#ffb4dc" }}>✅ {selProds.length} منتج · {totalPcs} قطعة إجمالاً</div>}
          </div>
          <button onClick={start} disabled={!selProds.length} style={{ ...Bs(selProds.length ? "#ff6eb4" : "rgba(255,255,255,0.1)"), width: "100%", padding: 14, fontSize: 15, fontWeight: 700 }}>
            ▶️ بدء الجلسة
          </button>
          {(data.sessions || []).length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ color: "#ffb4dc", fontWeight: 700, marginBottom: 9, fontSize: 13 }}>آخر الجلسات</div>
              {[...(data.sessions || [])].reverse().slice(0, 5).map(s => (
                <div key={s.id} style={{ ...Cs, marginBottom: 7 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>🧶 {s.totalPcs} قطعة · {s.totalMins} دقيقة</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>📅 {s.date} · {s.minsPerPc} د/قطعة</div>
                  {s.note && <div style={{ fontSize: 10, color: "rgba(255,180,220,0.6)", marginTop: 3 }}>{s.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div style={{ ...Cs, textAlign: "center", border: "1px solid rgba(255,100,100,0.25)" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 7 }}>لصنع {totalPcs} قطعة</div>
          <div style={{ fontSize: 54, fontWeight: 800, color: paused ? "#fbbf24" : "#f87171", fontVariantNumeric: "tabular-nums", marginBottom: 10 }}>{fmtTime(timerSec)}</div>
          {paused && <div style={{ fontSize: 12, color: "#fbbf24", marginBottom: 7 }}>⏸️ إيقاف مؤقت</div>}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: 12, marginBottom: 14 }}>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>🧶 {totalPcs} قطعة</span>
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>{fmt(costPerPc)} {cur}/قطعة</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={togglePause} style={{ ...Bs(paused ? "#4ade80" : "#fbbf24"), padding: "12px 20px", fontSize: 14 }}>{paused ? "▶️ استمرار" : "⏸️ إيقاف"}</button>
            <button onClick={finish} style={{ ...Bs("#60a5fa"), padding: "12px 20px", fontSize: 14 }}>✅ إنهاء</button>
            <button onClick={cancel} style={{ ...Bs("#f87171"), padding: "12px 20px", fontSize: 14 }}>❌ إلغاء</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={Cs}>
          <div style={{ color: "#4ade80", fontWeight: 800, fontSize: 15, marginBottom: 12 }}>🎉 انتهت الجلسة!</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
            <Rw l="إجمالي الوقت" v={`${Math.round(timerSec / 60)} دقيقة`} b />
            <Rw l="القطع" v={totalPcs} b />
            <Rw l="دقيقة/قطعة" v={totalPcs > 0 ? Math.round((timerSec / 60) / totalPcs) : 0} b />
            <Rw l="تكلفة وقت/قطعة" v={`${fmt(costPerPc)} ${cur}`} c="#fbbf24" b />
          </div>
          <div style={{ marginBottom: 12, padding: 11, background: "rgba(74,222,128,0.08)", borderRadius: 10 }}>
            <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>أضيفي للمخزون الجاهز؟</div>
            {selProds.map(s => {
              const p = data.products.find(x => x.id === s.id);
              if (!p) return null;
              const checked = addToReady.includes(p.id);
              return (
                <div key={p.id} onClick={() => setAddToReady(prev => checked ? prev.filter(x => x !== p.id) : [...prev, p.id])} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? "#4ade80" : "rgba(255,255,255,0.2)"}`, background: checked ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {checked && <span style={{ color: "#000", fontSize: 12 }}>✓</span>}
                  </div>
                  {p.image && <img src={p.image} style={{ width: 24, height: 24, borderRadius: 5, objectFit: "cover" }} alt="" />}
                  <span style={{ fontSize: 12 }}>{p.name} × {s.qty} قطعة</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginBottom: 12 }}>
            <Lb>ملاحظات إضافية (اختياري)</Lb>
            <textarea value={extraNote} onChange={e => setExtraNote(e.target.value)} style={{ ...Ns, minHeight: 60, resize: "vertical", padding: 9 }} placeholder="مثلاً: استخدمت خيط جديد..." />
          </div>
          <button onClick={saveSession} style={{ ...Bs("#ff6eb4"), width: "100%", padding: 12, fontSize: 14, fontWeight: 700 }}>💾 حفظ الجلسة</button>
        </div>
      )}
    </div>
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────
function Inventory({ data, update, cur }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "غرام", priceUnit: "unit", quantity: 0, costPerUnit: 0, totalPurchasePrice: 0, minAlert: 0 });
  const [confirmDel, setConfirmDel] = useState(null);

  const addPurchase = () => {
    if (!form.name.trim()) return;
    const costPerUnit = form.priceUnit === "100g"
      ? (Number(form.quantity) > 0 ? Number(form.totalPurchasePrice) / Number(form.quantity) : 0)
      : Number(form.costPerUnit || 0);
    const costPer100 = costPerUnit * 100;
    const totalCost = form.priceUnit === "100g" ? Number(form.totalPurchasePrice) : Number(form.costPerUnit || 0) * Number(form.quantity || 0);
    const existIdx = data.materials.findIndex(m => m.name === form.name.trim());
    update(prev => {
      let materials;
      if (existIdx >= 0) {
        materials = prev.materials.map((m, i) => i === existIdx ? { ...m, quantity: Number(m.quantity) + Number(form.quantity), costPerUnit, costPer100 } : m);
      } else {
        materials = [...prev.materials, { ...form, id: Date.now().toString(), costPerUnit, costPer100 }];
      }
      return { ...prev, materials, purchases: [...prev.purchases, { ...form, id: Date.now().toString(), totalCost, date: new Date().toLocaleDateString("ar-IQ") }] };
    });
    setForm({ name: "", unit: "غرام", priceUnit: "unit", quantity: 0, costPerUnit: 0, totalPurchasePrice: 0, minAlert: 0 });
    setShowAdd(false);
  };

  const deduct = (id, amount) => update(prev => ({ ...prev, materials: prev.materials.map(m => m.id === id ? { ...m, quantity: Math.max(0, Number(m.quantity) - Number(amount)) } : m) }));

  const delMaterial = id => setConfirmDel(id);
  const confirmDelete = () => {
    update(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== confirmDel) }));
    setConfirmDel(null);
  };

  return (
    <div>
      {confirmDel && <ConfirmDialog message="تريدين حذف هذه المادة من المخزون؟" onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ color: "#ffb4dc", fontWeight: 800 }}>📦 المخزون</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={Bs("#ff6eb4")}>{showAdd ? "← إلغاء" : "+ شراء مواد"}</button>
      </div>
      {showAdd && (
        <div style={{ ...Cs, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            <div style={{ gridColumn: "span 2" }}><Lb>اسم المادة</Lb><In value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثلاً: خيط قطني" /></div>
            <div><Lb>الوحدة</Lb><Sl value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}><option>غرام</option><option>متر</option><option>حبة</option><option>لفة</option><option>كيلو</option></Sl></div>
            <div><Lb>الكمية</Lb><In type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div style={{ gridColumn: "span 2" }}>
              <Lb>طريقة التسعير</Lb>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                <button onClick={() => setForm(f => ({ ...f, priceUnit: "unit" }))} style={{ ...Bs(form.priceUnit === "unit" ? "#ff6eb4" : "rgba(255,255,255,0.07)"), padding: 10 }}>سعر الوحدة<br /><span style={{ fontSize: 10, opacity: 0.7 }}>غرام/حبة</span></button>
                <button onClick={() => setForm(f => ({ ...f, priceUnit: "100g" }))} style={{ ...Bs(form.priceUnit === "100g" ? "#ff6eb4" : "rgba(255,255,255,0.07)"), padding: 10 }}>السعر الكلي<br /><span style={{ fontSize: 10, opacity: 0.7 }}>500غم بـ 6000</span></button>
              </div>
            </div>
            {form.priceUnit === "unit" && <div style={{ gridColumn: "span 2" }}><Lb>سعر الوحدة ({cur})</Lb><In type="number" value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))} /></div>}
            {form.priceUnit === "100g" && (
              <div style={{ gridColumn: "span 2" }}>
                <Lb>السعر الكلي للكمية ({cur})</Lb>
                <In type="number" value={form.totalPurchasePrice} onChange={e => setForm(f => ({ ...f, totalPurchasePrice: e.target.value }))} />
                {Number(form.quantity) > 0 && Number(form.totalPurchasePrice) > 0 && (
                  <div style={{ marginTop: 5, fontSize: 12, color: "#60a5fa" }}>
                    سعر كل 100 {form.unit}: {fmt(Math.round(Number(form.totalPurchasePrice) / Number(form.quantity) * 100))} {cur}
                  </div>
                )}
              </div>
            )}
            <div><Lb>تنبيه عند كمية</Lb><In type="number" value={form.minAlert} onChange={e => setForm(f => ({ ...f, minAlert: e.target.value }))} /></div>
          </div>
          <button onClick={addPurchase} style={{ ...Bs("#ff6eb4"), width: "100%", marginTop: 11, padding: 12 }}>✅ إضافة للمخزون</button>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 9 }}>
        {data.materials.map(m => {
          const low = Number(m.quantity) <= Number(m.minAlert);
          const priceLabel = m.priceUnit === "100g" ? `${fmt(Math.round(m.costPer100 || 0))} ${cur}/100${m.unit}` : `${fmt(m.costPerUnit || 0)} ${cur}/${m.unit}`;
          return (
            <div key={m.id} style={{ ...Cs, border: low ? "1px solid rgba(248,113,113,0.4)" : undefined }}>
              {low && <div style={{ color: "#f87171", fontSize: 10, marginBottom: 5 }}>⚠️ مخزون منخفض</div>}
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: low ? "#f87171" : "#4ade80" }}>{fmt(m.quantity)}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{priceLabel}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                <input id={`d-${m.id}`} type="number" placeholder="خصم" style={{ ...Ns, flex: 1, fontSize: 11, padding: "6px 8px" }} />
                <button onClick={() => { const el = document.getElementById(`d-${m.id}`); deduct(m.id, el.value); el.value = ""; }} style={{ ...Bs("#fbbf24"), fontSize: 13, padding: "6px 10px" }}>−</button>
                <button onClick={() => delMaterial(m.id)} style={{ ...Bs("#f87171"), fontSize: 13, padding: "6px 10px", minWidth: 36, minHeight: 36 }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
      {!data.materials.length && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>لا توجد مواد في المخزون</div>}
      {data.purchases.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ color: "#ffb4dc", fontWeight: 700, marginBottom: 9, fontSize: 13 }}>سجل المشتريات</div>
          {[...data.purchases].reverse().map(p => (
            <div key={p.id} style={{ ...Cs, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{p.quantity} {p.unit} · {p.date}</div></div>
              <div style={{ color: "#f87171", fontWeight: 700, fontSize: 13 }}>{fmt(p.totalCost)} {cur}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Bazaars ───────────────────────────────────────────────────────────────────
function Bazaars({ data, update, cur, catIcon }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", location: "", tableCost: 0, transportCost: 0, otherCosts: 0, notes: "" });
  const [confirmDel, setConfirmDel] = useState(null);
  const [expandedBazaar, setExpandedBazaar] = useState(null);

  const saveBazaar = () => {
    if (!form.name.trim()) return;
    const totalCost = Number(form.tableCost) + Number(form.transportCost) + Number(form.otherCosts);
    update(prev => ({ ...prev, bazaars: [...prev.bazaars, { ...form, id: Date.now().toString(), totalCost }] }));
    setForm({ name: "", date: "", location: "", tableCost: 0, transportCost: 0, otherCosts: 0, notes: "" });
    setShowAdd(false);
  };

  const delBazaar = id => setConfirmDel(id);
  const confirmDelete = () => {
    update(prev => ({ ...prev, bazaars: prev.bazaars.filter(b => b.id !== confirmDel) }));
    setConfirmDel(null);
  };

  // Feature #9: Sort bazaars by date (nearest first)
  const sortedBazaars = [...data.bazaars].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div>
      {confirmDel && <ConfirmDialog message="تريدين حذف هذا البازار وكل سجلاته؟" onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ color: "#ffb4dc", fontWeight: 800 }}>🏪 البازارات</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={Bs("#ff6eb4")}>{showAdd ? "← إلغاء" : "+ بازار جديد"}</button>
      </div>
      {showAdd && (
        <div style={{ ...Cs, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            <div style={{ gridColumn: "span 2" }}><Lb>اسم البازار</Lb><In value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثلاً: بازار رمضان 2025" /></div>
            <div><Lb>التاريخ</Lb><In type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Lb>المكان</Lb><In value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><Lb>إيجار الطاولة ({cur})</Lb><In type="number" value={form.tableCost} onChange={e => setForm(f => ({ ...f, tableCost: e.target.value }))} /></div>
            <div><Lb>المواصلات ({cur})</Lb><In type="number" value={form.transportCost} onChange={e => setForm(f => ({ ...f, transportCost: e.target.value }))} /></div>
            <div><Lb>مصاريف أخرى ({cur})</Lb><In type="number" value={form.otherCosts} onChange={e => setForm(f => ({ ...f, otherCosts: e.target.value }))} /></div>
            <div><Lb>ملاحظات</Lb><In value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <button onClick={saveBazaar} style={{ ...Bs("#ff6eb4"), width: "100%", marginTop: 11, padding: 12 }}>✅ حفظ البازار</button>
        </div>
      )}
      {sortedBazaars.map(b => {
        const bSales = data.sales.filter(s => s.bazaarId === b.id);
        const revenue = bSales.reduce((s, x) => s + Number(x.total || 0), 0);
        const grossProfit = bSales.reduce((s, x) => s + Number(x.totalProfit || 0), 0);
        const netProfit = grossProfit - Number(b.totalCost || 0);
        const roi = b.totalCost > 0 ? (netProfit / Number(b.totalCost)) * 100 : 0;
        const recommended = roi >= 100;
        const isPast = isBazaarPast(b.date);

        // Feature #6: Top 5 best selling products in this bazaar
        const prodSalesMap = {};
        bSales.forEach(s => {
          if (!prodSalesMap[s.productId]) prodSalesMap[s.productId] = { name: s.productName, qty: 0, profit: 0 };
          prodSalesMap[s.productId].qty += Number(s.qty || 1);
          prodSalesMap[s.productId].profit += Number(s.totalProfit || 0);
        });
        const top5 = Object.values(prodSalesMap)
          .sort((a, b) => b.qty !== a.qty ? b.qty - a.qty : b.profit - a.profit)
          .slice(0, 5);

        const isExpanded = expandedBazaar === b.id;

        return (
          <div key={b.id} style={{ ...Cs, marginBottom: 10, border: `1px solid ${recommended ? "rgba(74,222,128,0.3)" : roi >= 50 ? "rgba(251,191,36,0.3)" : roi < 0 ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.1)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>🏪 {b.name}</span>
                  {isPast && recommended && <span style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 7, padding: "2px 8px", fontSize: 10 }}>⭐ ممتاز</span>}
                  {isPast && !recommended && roi >= 50 && <span style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: 7, padding: "2px 8px", fontSize: 10 }}>👍 جيد</span>}
                  {isPast && roi < 0 && <span style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 7, padding: "2px 8px", fontSize: 10 }}>📉 خسارة</span>}
                  {/* Feature #7: Show "closed" badge if bazaar date has passed */}
                  {isPast && <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", borderRadius: 7, padding: "2px 8px", fontSize: 10 }}>🔒 منتهي</span>}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 9 }}>
                  📅 {b.date ? formatDateAr(b.date) : "بدون تاريخ"} {b.location ? `· 📍 ${b.location}` : ""}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  <Rw l="مصاريف البازار" v={`${fmt(b.totalCost)} ${cur}`} />
                  <Rw l="إيرادات" v={`${fmt(revenue)} ${cur}`} c="#4ade80" />
                  <Rw l="ربح القطع (قبل مصاريف)" v={`${fmt(Math.round(grossProfit))} ${cur}`} />
                  <Rw l="صافي الربح الكلي" v={`${fmt(Math.round(netProfit))} ${cur}`} c={netProfit >= 0 ? "#4ade80" : "#f87171"} />
                  <Rw l="العائد على الاستثمار" v={`${Math.round(roi)}%`} c={recommended ? "#4ade80" : roi >= 50 ? "#fbbf24" : "#f87171"} />
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{bSales.length} عملية بيع</div>

                {/* Feature #6: Top 5 button */}
                {bSales.length > 0 && (
                  <button
                    onClick={() => setExpandedBazaar(isExpanded ? null : b.id)}
                    style={{ ...Bs("rgba(255,180,220,0.12)"), marginTop: 10, fontSize: 12, padding: "7px 14px", border: "1px solid rgba(255,180,220,0.2)" }}
                  >
                    {isExpanded ? "▲ إخفاء" : "▼ إظهار المزيد.. (أكثر مبيعاً)"}
                  </button>
                )}

                {isExpanded && top5.length > 0 && (
                  <div style={{ marginTop: 10, padding: 10, background: "rgba(255,180,220,0.06)", borderRadius: 10 }}>
                    <div style={{ color: "#ffb4dc", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>🏆 أكثر 5 منتجات مبيعاً</div>
                    {top5.map((p, i) => (
                      <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>ربح: {fmt(Math.round(p.profit))} {cur}</div>
                        </div>
                        <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>{p.qty} قطعة</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => delBazaar(b.id)} style={{ ...Bs("#f87171"), padding: "10px 12px", fontSize: 18, minWidth: 44, minHeight: 44, marginRight: 4 }}>🗑️</button>
            </div>
          </div>
        );
      })}
      {!data.bazaars.length && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>لا توجد بازارات مسجلة</div>}
    </div>
  );
}

// ── Sales ─────────────────────────────────────────────────────────────────────
function Sales({ data, update, cur, catIcon }) {
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  // Feature #8: bundle sale
  const [saleMode, setSaleMode] = useState("single"); // "single" | "bundle"
  const [form, setForm] = useState({ productId: "", bazaarId: "", qty: 1, customPrice: "", discount: 0, channel: "بازار", notes: "" });
  // Bundle: list of {productId, qty}
  const [bundleItems, setBundleItems] = useState([{ productId: "", qty: 1 }]);
  const [bundlePrice, setBundlePrice] = useState("");
  const [bundleBazaarId, setBundleBazaarId] = useState("");
  const [bundleChannel, setBundleChannel] = useState("بازار");

  const prod = (data.products || []).find(p => p.id === form.productId);
  const basePrice = prod?.suggestedPrice || 0;
  const unitPrice = form.customPrice ? Number(form.customPrice) : Math.round(basePrice * (1 - Number(form.discount || 0) / 100));
  const qty = Number(form.qty || 1);
  const total = unitPrice * qty;
  const unitCost = prod?.totalCost || 0;
  const totalProfit = (unitPrice - unitCost) * qty;
  const available = (data.products || []).filter(p => Number(p.readyCount || 0) > 0);

  // Feature #7: Filter bazaars - only allow non-past ones for sales
  const activeBazaars = data.bazaars.filter(b => !isBazaarPast(b.date));
  const allBazaars = data.bazaars; // for display in existing records

  const saveSingle = () => {
    if (!form.productId || !total) return;
    // Feature #7: Block adding sales to past bazaars
    if (form.bazaarId) {
      const selectedBazaar = data.bazaars.find(b => b.id === form.bazaarId);
      if (selectedBazaar && isBazaarPast(selectedBazaar.date)) {
        alert("⚠️ لا يمكن إضافة مبيعات لبازار منتهي!");
        return;
      }
    }
    update(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === form.productId ? { ...p, readyCount: Math.max(0, (Number(p.readyCount) || 0) - qty), soldCount: (Number(p.soldCount) || 0) + qty } : p),
      sales: [...prev.sales, { ...form, id: Date.now().toString(), productName: prod.name, unitPrice, total, totalProfit, qty, date: new Date().toLocaleDateString("ar-IQ"), dateISO: new Date().toISOString().split("T")[0] }],
    }));
    setForm({ productId: "", bazaarId: "", qty: 1, customPrice: "", discount: 0, channel: "بازار", notes: "" });
    setShowAdd(false);
  };

  // Feature #8: save bundle sale
  const saveBundle = () => {
    const price = Number(bundlePrice);
    if (!price || !bundleItems.some(i => i.productId)) return;
    if (bundleBazaarId) {
      const selectedBazaar = data.bazaars.find(b => b.id === bundleBazaarId);
      if (selectedBazaar && isBazaarPast(selectedBazaar.date)) {
        alert("⚠️ لا يمكن إضافة مبيعات لبازار منتهي!");
        return;
      }
    }
    const validItems = bundleItems.filter(i => i.productId);
    const totalQty = validItems.reduce((s, i) => s + Number(i.qty || 1), 0);
    const totalCostBundle = validItems.reduce((s, i) => {
      const p = data.products.find(x => x.id === i.productId);
      return s + (p?.totalCost || 0) * Number(i.qty || 1);
    }, 0);
    const bundleProfit = price - totalCostBundle;
    const names = validItems.map(i => {
      const p = data.products.find(x => x.id === i.productId);
      return `${p?.name || "?"} ×${i.qty}`;
    }).join(" + ");

    update(prev => ({
      ...prev,
      products: prev.products.map(p => {
        const item = validItems.find(i => i.productId === p.id);
        if (!item) return p;
        return { ...p, readyCount: Math.max(0, (Number(p.readyCount) || 0) - Number(item.qty || 1)), soldCount: (Number(p.soldCount) || 0) + Number(item.qty || 1) };
      }),
      sales: [...prev.sales, {
        id: Date.now().toString(),
        productId: "bundle",
        productName: `مجموعة: ${names}`,
        unitPrice: price,
        total: price,
        totalProfit: bundleProfit,
        qty: totalQty,
        bazaarId: bundleBazaarId,
        channel: bundleChannel,
        date: new Date().toLocaleDateString("ar-IQ"),
        dateISO: new Date().toISOString().split("T")[0],
        isBundle: true,
        bundleItems: validItems,
      }],
    }));
    setBundleItems([{ productId: "", qty: 1 }]);
    setBundlePrice("");
    setBundleBazaarId("");
    setShowAdd(false);
  };

  const del = id => setConfirmDel(id);
  const confirmDelete = () => {
    // Feature #4: return qty to product when deleting sale
    const sale = data.sales.find(s => s.id === confirmDel);
    update(prev => ({
      ...prev,
      products: prev.products.map(p => {
        if (sale?.isBundle) {
          const item = (sale.bundleItems || []).find(i => i.productId === p.id);
          if (!item) return p;
          return { ...p, readyCount: (Number(p.readyCount) || 0) + Number(item.qty || 1), soldCount: Math.max(0, (Number(p.soldCount) || 0) - Number(item.qty || 1)) };
        }
        if (p.id !== sale?.productId) return p;
        return { ...p, readyCount: (Number(p.readyCount) || 0) + Number(sale.qty || 1), soldCount: Math.max(0, (Number(p.soldCount) || 0) - Number(sale.qty || 1)) };
      }),
      sales: prev.sales.filter(s => s.id !== confirmDel),
    }));
    setConfirmDel(null);
  };

  // Feature #5: Group sales by date
  const salesByDate = {};
  [...data.sales].reverse().forEach(s => {
    const key = s.dateISO || s.date || "بدون تاريخ";
    if (!salesByDate[key]) salesByDate[key] = [];
    salesByDate[key].push(s);
  });
  const sortedDateKeys = Object.keys(salesByDate).sort((a, b) => b > a ? 1 : -1);

  return (
    <div>
      {confirmDel && <ConfirmDialog message="تريدين حذف هذه المبيعة؟ القطع راح ترجع للمخزون تلقائياً." onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ color: "#ffb4dc", fontWeight: 800 }}>💰 المبيعات</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={Bs("#ff6eb4")}>{showAdd ? "← إلغاء" : "+ تسجيل بيع"}</button>
      </div>

      {showAdd && (
        <div style={{ ...Cs, marginBottom: 14 }}>
          {/* Feature #8: Mode toggle */}
          <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
            <button onClick={() => setSaleMode("single")} style={{ ...Bs(saleMode === "single" ? "#ff6eb4" : "rgba(255,255,255,0.07)"), flex: 1, padding: 10 }}>قطعة واحدة / عدة قطع من نفس المنتج</button>
            <button onClick={() => setSaleMode("bundle")} style={{ ...Bs(saleMode === "bundle" ? "#60a5fa" : "rgba(255,255,255,0.07)"), flex: 1, padding: 10 }}>🎁 مجموعة بسعر واحد</button>
          </div>

          {saleMode === "single" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <Lb>المنتج المباع</Lb>
                  <Sl value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
                    <option value="">اختاري...</option>
                    {available.map(p => <option key={p.id} value={p.id}>{catIcon(p.categoryKey)} {p.name} (متوفر: {p.readyCount})</option>)}
                  </Sl>
                </div>
                <div><Lb>عدد القطع</Lb><In type="number" min="1" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></div>
                <div><Lb>قناة البيع</Lb><Sl value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}><option>بازار</option><option>إنستغرام</option><option>واتساب</option><option>يد بيد</option><option>أخرى</option></Sl></div>
                <div>
                  <Lb>البازار</Lb>
                  <Sl value={form.bazaarId} onChange={e => setForm(f => ({ ...f, bazaarId: e.target.value }))}>
                    <option value="">بدون بازار</option>
                    {activeBazaars.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Sl>
                </div>
                <div><Lb>تخفيض (%)</Lb><In type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} /></div>
                <div><Lb>سعر القطعة ({cur})</Lb><In type="number" value={form.customPrice} onChange={e => setForm(f => ({ ...f, customPrice: e.target.value }))} placeholder={`تلقائي: ${fmt(unitPrice)}`} /></div>
              </div>
              {prod && (
                <div style={{ marginTop: 10, padding: 10, background: "rgba(74,222,128,0.08)", borderRadius: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                    <Rw l="سعر/قطعة" v={`${fmt(unitPrice)} ${cur}`} />
                    <Rw l="الكمية" v={qty} />
                    <Rw l="الإجمالي" v={`${fmt(total)} ${cur}`} c="#fbbf24" b />
                    <Rw l="صافي الربح" v={`${fmt(Math.round(totalProfit))} ${cur}`} c={totalProfit >= 0 ? "#4ade80" : "#f87171"} b />
                  </div>
                </div>
              )}
              <button onClick={saveSingle} style={{ ...Bs("#4ade80"), width: "100%", marginTop: 11, padding: 12, fontSize: 14, fontWeight: 700 }}>💰 تسجيل البيع</button>
            </div>
          )}

          {/* Feature #8: Bundle sale form */}
          {saleMode === "bundle" && (
            <div>
              <Lb>🎁 محتويات المجموعة</Lb>
              {bundleItems.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px auto", gap: 7, marginBottom: 7 }}>
                  <Sl value={item.productId} onChange={e => setBundleItems(prev => prev.map((x, idx) => idx === i ? { ...x, productId: e.target.value } : x))}>
                    <option value="">اختاري منتج...</option>
                    {(data.products || []).map(p => <option key={p.id} value={p.id}>{catIcon(p.categoryKey)} {p.name} (متوفر: {p.readyCount || 0})</option>)}
                  </Sl>
                  <In type="number" min="1" value={item.qty} onChange={e => setBundleItems(prev => prev.map((x, idx) => idx === i ? { ...x, qty: e.target.value } : x))} />
                  <button onClick={() => setBundleItems(prev => prev.filter((_, idx) => idx !== i))} style={{ ...Bs("#f87171"), fontSize: 16, padding: "6px 10px" }}>×</button>
                </div>
              ))}
              <button onClick={() => setBundleItems(prev => [...prev, { productId: "", qty: 1 }])} style={{ ...Bs("rgba(255,255,255,0.07)"), width: "100%", marginBottom: 12, padding: 9, fontSize: 12 }}>+ إضافة منتج للمجموعة</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <Lb>سعر المجموعة الكلي ({cur})</Lb>
                  <In type="number" value={bundlePrice} onChange={e => setBundlePrice(e.target.value)} placeholder="مثلاً: 15000" style={{ fontSize: 16, fontWeight: 700 }} />
                </div>
                <div><Lb>قناة البيع</Lb><Sl value={bundleChannel} onChange={e => setBundleChannel(e.target.value)}><option>بازار</option><option>إنستغرام</option><option>واتساب</option><option>يد بيد</option><option>أخرى</option></Sl></div>
                <div>
                  <Lb>البازار</Lb>
                  <Sl value={bundleBazaarId} onChange={e => setBundleBazaarId(e.target.value)}>
                    <option value="">بدون بازار</option>
                    {activeBazaars.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Sl>
                </div>
              </div>
              {bundlePrice && (
                <div style={{ marginTop: 10, padding: 10, background: "rgba(96,165,250,0.08)", borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: "#60a5fa" }}>
                    💰 سعر المجموعة: {fmt(Number(bundlePrice))} {cur} · {bundleItems.filter(i => i.productId).length} منتجات
                  </div>
                </div>
              )}
              <button onClick={saveBundle} style={{ ...Bs("#60a5fa"), width: "100%", marginTop: 11, padding: 12, fontSize: 14, fontWeight: 700 }}>🎁 تسجيل بيع المجموعة</button>
            </div>
          )}
        </div>
      )}

      {/* Feature #5: Sales grouped by date with separator */}
      {sortedDateKeys.map(dateKey => (
        <div key={dateKey}>
          {/* Date separator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 8px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,180,220,0.15)" }} />
            <div style={{ background: "rgba(255,100,180,0.12)", border: "1px solid rgba(255,100,180,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#ffb4dc", fontWeight: 700, whiteSpace: "nowrap" }}>
              📅 {formatDateAr(dateKey) || dateKey}
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,180,220,0.15)" }} />
          </div>
          {salesByDate[dateKey].map(s => {
            const p = (data.products || []).find(x => x.id === s.productId);
            const baz = allBazaars.find(b => b.id === s.bazaarId);
            return (
              <div key={s.id} style={{ ...Cs, marginBottom: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  {p?.image && <img src={p.image} style={{ width: 36, height: 36, borderRadius: 7, objectFit: "cover", marginLeft: 8 }} alt="" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                      {s.isBundle && <span style={{ fontSize: 11, background: "rgba(96,165,250,0.15)", color: "#60a5fa", borderRadius: 6, padding: "1px 6px", marginLeft: 5 }}>🎁 مجموعة</span>}
                      {s.productName}
                      {s.qty > 1 && !s.isBundle && <span style={{ fontSize: 11, color: "#fbbf24", marginRight: 6 }}>×{s.qty}</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>
                      {s.channel}{baz ? ` · ${baz.name}` : ""}
                    </div>
                    <div style={{ display: "flex", gap: 10, fontSize: 12 }}>
                      <span style={{ color: "#4ade80", fontWeight: 700 }}>💰 {fmt(s.total || 0)} {cur}</span>
                      <span style={{ color: (s.totalProfit || 0) >= 0 ? "#60a5fa" : "#f87171" }}>ربح: {fmt(Math.round(s.totalProfit || 0))} {cur}</span>
                    </div>
                  </div>
                  <button onClick={() => del(s.id)} style={{ ...Bs("#f87171"), padding: "10px 12px", fontSize: 18, minWidth: 44, minHeight: 44 }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {!data.sales.length && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>لا توجد مبيعات بعد</div>}
    </div>
  );
}

// ── Monthly ───────────────────────────────────────────────────────────────────
function Monthly({ data, cur }) {
  const monthly = {};
  data.sales.forEach(s => {
    const m = getMonth(s.date);
    if (!m) return;
    if (!monthly[m]) monthly[m] = { sales: 0, profit: 0, count: 0 };
    monthly[m].sales += Number(s.total || 0);
    monthly[m].profit += Number(s.totalProfit || 0);
    monthly[m].count += Number(s.qty || 1);
  });
  const months = Object.keys(monthly).sort().reverse();
  const maxSales = Math.max(...months.map(m => monthly[m].sales), 1);
  return (
    <div>
      <h2 style={{ color: "#ffb4dc", fontWeight: 800, marginBottom: 14 }}>📅 الإحصائيات الشهرية</h2>
      {!months.length && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>لا توجد مبيعات بعد</div>}
      {months.map(m => {
        const d = monthly[m];
        const barW = Math.round((d.sales / maxSales) * 100);
        const isPeak = d.sales === maxSales && months.length > 1;
        return (
          <div key={m} style={{ ...Cs, marginBottom: 9, border: isPeak ? "1px solid rgba(74,222,128,0.3)" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {monthLabel(m)}
                {isPeak && <span style={{ fontSize: 11, color: "#4ade80", marginRight: 8 }}>🏆 ذروة</span>}
              </div>
              <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>{fmt(d.sales)} {cur}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 6, height: 8, marginBottom: 10 }}>
              <div style={{ width: `${barW}%`, height: "100%", background: isPeak ? "linear-gradient(90deg,#4ade80,#22d3ee)" : "linear-gradient(90deg,#ff6eb4,#a855f7)", borderRadius: 6 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <Rw l="المبيعات" v={`${fmt(d.sales)} ${cur}`} />
              <Rw l="الأرباح" v={`${fmt(Math.round(d.profit))} ${cur}`} c="#60a5fa" />
              <Rw l="عدد القطع" v={d.count} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Settings({ data, update }) {
  const [rate, setRate] = useState(data.settings.hourlyRate);
  const [currency, setCurrency] = useState(data.settings.currency);
  const [cats, setCats] = useState(data.categories || DEFAULT_CATEGORIES);
  const [newCat, setNewCat] = useState({ key: "", icon: "🧶" });

  const save = () => { update(prev => ({ ...prev, settings: { hourlyRate: Number(rate), currency }, categories: cats })); alert("✅ تم حفظ الإعدادات!"); };
  const addCat = () => { if (!newCat.key.trim()) return; setCats(c => [...c, { key: newCat.key.trim(), icon: newCat.icon }]); setNewCat({ key: "", icon: "🧶" }); };
  const delCat = key => setCats(c => c.filter(x => x.key !== key));
  const exportData = () => { const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "kokla-backup.json"; a.click(); };

  return (
    <div>
      <h2 style={{ color: "#ffb4dc", fontWeight: 800, marginBottom: 14 }}>⚙️ الإعدادات</h2>
      <div style={Cs}>
        <div style={{ color: "#ffb4dc", fontWeight: 700, marginBottom: 10 }}>💰 سعر ساعة العمل</div>
        <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 10 }}>
          <In type="number" value={rate} onChange={e => setRate(e.target.value)} style={{ flex: 1 }} />
          <Sl value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: "auto" }}>
            <option>ع.د</option><option>$</option><option>€</option>
          </Sl>
        </div>
        <div style={{ padding: 9, background: "rgba(255,180,220,0.07)", borderRadius: 9, fontSize: 12 }}>
          {[15, 30, 60, 120].map(m => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>{m} دقيقة</span><span style={{ color: "#fbbf24" }}>{fmt(Math.round((m / 60) * Number(rate)))} {currency}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...Cs, marginTop: 12 }}>
        <div style={{ color: "#ffb4dc", fontWeight: 700, marginBottom: 10 }}>📦 أنواع المنتجات</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 11 }}>
          {cats.map(c => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "5px 10px" }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#e8c8f0" }}>{c.key}</span>
              <button onClick={() => delCat(c.key)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <In value={newCat.icon} onChange={e => setNewCat(f => ({ ...f, icon: e.target.value }))} style={{ width: 50, textAlign: "center" }} />
          <In value={newCat.key} onChange={e => setNewCat(f => ({ ...f, key: e.target.value }))} placeholder="اسم النوع الجديد" />
          <button onClick={addCat} style={{ ...Bs("#ff6eb4"), padding: "8px 12px" }}>+</button>
        </div>
      </div>
      <div style={{ ...Cs, marginTop: 12 }}>
        <div style={{ color: "#ffb4dc", fontWeight: 700, marginBottom: 9 }}>📊 بياناتك</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, marginBottom: 12 }}>
          <Rw l="المنتجات" v={(data.products || []).length} />
          <Rw l="المواد" v={data.materials.length} />
          <Rw l="البازارات" v={data.bazaars.length} />
          <Rw l="المبيعات" v={data.sales.length} />
          <Rw l="الجلسات" v={(data.sessions || []).length} />
        </div>
        <button onClick={exportData} style={{ ...Bs("#60a5fa"), width: "100%", marginBottom: 8, padding: 11 }}>📤 تصدير البيانات</button>
        <button onClick={save} style={{ ...Bs("#ff6eb4"), width: "100%", padding: 11, fontWeight: 700 }}>💾 حفظ الإعدادات</button>
      </div>
    </div>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────────
const Cs = { background: "rgba(255,255,255,0.06)", borderRadius: 13, padding: 13, border: "1px solid rgba(255,255,255,0.08)" };
const Ns = { width: "100%", background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,180,220,0.15)", borderRadius: 9, padding: "9px 11px", color: "#f0e6ff", fontFamily: "'Tajawal', sans-serif", fontSize: 14, boxSizing: "border-box" };
function Bs(bg) { return { background: bg, border: "none", borderRadius: 9, padding: "8px 14px", cursor: "pointer", color: "#fff", fontFamily: "'Tajawal', sans-serif", fontSize: 13, fontWeight: 600, transition: "opacity 0.15s" }; }
function Lb({ children }) { return <div style={{ fontSize: 11, color: "rgba(255,200,240,0.7)", marginBottom: 4, marginTop: 2 }}>{children}</div>; }
function In({ style, ...p }) { return <input style={{ ...Ns, ...style }} {...p} />; }
function Sl({ children, style, ...p }) { return <select style={{ ...Ns, ...style, cursor: "pointer" }} {...p}>{children}</select>; }
function Rw({ l, v, b, c }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 7px", background: "rgba(255,255,255,0.03)", borderRadius: 7 }}><span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{l}</span><span style={{ fontWeight: b ? 700 : 500, color: c || "#f0e6ff", fontSize: 12 }}>{v}</span></div>; }
