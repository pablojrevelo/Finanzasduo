// FinanzasDuo PWA — app.jsx
// ─────────────────────────────────────────────────────────────────────────────

const { useState, useEffect, useCallback, useRef } = React;

// ── Storage ───────────────────────────────────────────────────────────────────
const SK = "finanzasduo_v3";
function load() { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch { return null; } }
function persist(d) { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} }

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
function mkKey(m, y) { return `${y}-${String(m).padStart(2,"0")}`; }
function nowMY() { const d = new Date(); return { month: d.getMonth() + 1, year: d.getFullYear() }; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

// ── Default data ──────────────────────────────────────────────────────────────
const DEF_CATS = [
  {id:"c1",  name:"Renta / Hipoteca",         type:"Gasto Fijo",    owner:"Compartido"},
  {id:"c2",  name:"Servicios (Agua/Luz/Gas)",  type:"Gasto Fijo",    owner:"Compartido"},
  {id:"c3",  name:"Internet / Teléfono",       type:"Gasto Fijo",    owner:"Compartido"},
  {id:"c4",  name:"Seguro Médico",             type:"Gasto Fijo",    owner:"Compartido"},
  {id:"c5",  name:"Transporte / Gasolina",     type:"Gasto Fijo",    owner:"Individual"},
  {id:"c6",  name:"Retiro de Efectivo",        type:"Gasto Fijo",    owner:"Individual"},
  {id:"c7",  name:"Suscripciones",             type:"Gasto Fijo",    owner:"Compartido"},
  {id:"c8",  name:"Supermercado / Comida",     type:"Gasto Variable",owner:"Compartido"},
  {id:"c9",  name:"Restaurantes / Salidas",    type:"Gasto Variable",owner:"Compartido"},
  {id:"c10", name:"Ropa y Personal",           type:"Gasto Variable",owner:"Individual"},
  {id:"c11", name:"Entretenimiento",           type:"Gasto Variable",owner:"Compartido"},
  {id:"c12", name:"Salud / Farmacia",          type:"Gasto Variable",owner:"Compartido"},
  {id:"c13", name:"Imprevistos",               type:"Gasto Variable",owner:"Compartido"},
  {id:"c14", name:"Otro",                      type:"Gasto Variable",owner:"Individual"},
];
const DEF_INC_CATS = ["Salario","Horas Extras","Freelance / Extra","Otro"];
const DEF_SAV_GOALS = [
  {id:"s1", name:"Fondo de Emergencia", owner:"Compartido"},
  {id:"s2", name:"Vacaciones",          owner:"Compartido"},
  {id:"s3", name:"Proyecto Especial",   owner:"Compartido"},
  {id:"s4", name:"Ahorro Personal",     owner:"Individual"},
];
const USERS = [
  {id:"pablo", name:"Pablo", pin:"1234", color:"#4f8ef7"},
  {id:"sofia",  name:"Sofía",  pin:"5678", color:"#f472b6"},
];

function initState() {
  return {
    categories: DEF_CATS,
    incomeCategories: DEF_INC_CATS,
    savingsGoals: DEF_SAV_GOALS,
    incomes: [], expenses: [], savings: [], budgets: [], settlements: [],
    lastExport: null,
  };
}

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#0f1117", surface:"#181c27", card:"#1e2336", border:"#2a3050",
  accent:"#4f8ef7", green:"#36d399", red:"#f87272", yellow:"#fbbd23",
  purple:"#a78bfa", text:"#e8eaf6", muted:"#7986b0",
  pablo:"#4f8ef7", sofia:"#f472b6",
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
const iS = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"10px 12px", width:"100%", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
const lS = { color:C.muted, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:4, display:"block", textTransform:"uppercase" };

function btnP(color) { return { background:color||C.accent, color:"#fff", border:"none", borderRadius:10, padding:"13px 20px", fontSize:15, fontWeight:700, cursor:"pointer", width:"100%", fontFamily:"inherit", transition:"opacity .15s" }; }
const btnSec = { background:"transparent", color:C.muted, border:`1px solid ${C.border}`, borderRadius:10, padding:"13px 20px", fontSize:15, fontWeight:600, cursor:"pointer", width:"100%", fontFamily:"inherit" };

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={lS}>{label}</label>
      {children}
      {hint && <div style={{ color:C.muted, fontSize:11, marginTop:4 }}>{hint}</div>}
    </div>
  );
}

function Pill({ label, color }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>;
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value/max)*100, 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div style={{ background:C.border, borderRadius:4, height:7, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${pct}%`, height:"100%", background:over?C.red:color, borderRadius:4, transition:"width .4s" }}/>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#000c", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:0 }} onClick={onClose}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:560, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 -20px 60px #000c" }} onClick={e => e.stopPropagation()}>
        <div style={{ width:40, height:4, background:C.border, borderRadius:4, margin:"0 auto 20px" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ color:C.text, fontSize:18, fontFamily:"'Playfair Display',serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background:C.surface, border:"none", color:C.muted, fontSize:20, cursor:"pointer", width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, sub, small }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:small?"12px 14px":"14px 16px" }}>
      <div style={{ fontSize:small?18:22, marginBottom:4 }}>{icon}</div>
      <div style={{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:3 }}>{label}</div>
      <div style={{ color:color||C.text, fontSize:small?16:18, fontWeight:700 }}>{fmt(value)}</div>
      {sub && <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:10, marginTop:22, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>{children}</div>;
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", background:C.green, color:"#0f1117", padding:"10px 20px", borderRadius:30, fontWeight:700, fontSize:14, zIndex:2000, boxShadow:"0 4px 20px #0006", whiteSpace:"nowrap" }}>
      ✓ {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);

  function tryLogin() {
    const u = USERS.find(x => x.id === sel);
    if (pin === u.pin) { onLogin(u.id); }
    else { setErr("PIN incorrecto"); setPin(""); }
  }

  if (!sel) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28 }}>
      <div style={{ textAlign:"center", marginBottom:44 }}>
        <div style={{ fontSize:56, marginBottom:14 }}>💰</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:C.text, fontWeight:700 }}>FinanzasDuo</div>
        <div style={{ color:C.muted, fontSize:14, marginTop:6 }}>Control financiero en pareja</div>
      </div>
      <div style={{ width:"100%", maxWidth:360 }}>
        <div style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:2, textAlign:"center", marginBottom:18 }}>¿QUIÉN ERES?</div>
        {USERS.map(u => (
          <button key={u.id} onClick={() => setSel(u.id)} style={{ width:"100%", background:C.card, border:`2px solid ${C.border}`, borderRadius:16, padding:"20px 22px", marginBottom:14, cursor:"pointer", display:"flex", alignItems:"center", gap:18 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:u.color+"22", border:`2px solid ${u.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:u.color, flexShrink:0 }}>{u.name[0]}</div>
            <span style={{ color:C.text, fontSize:19, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{u.name}</span>
            <span style={{ marginLeft:"auto", color:C.muted, fontSize:20 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  const u = USERS.find(x => x.id === sel);
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28 }}>
      <div style={{ width:"100%", maxWidth:360 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:u.color+"22", border:`2px solid ${u.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, fontWeight:700, color:u.color, margin:"0 auto 14px" }}>{u.name[0]}</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:C.text }}>Hola, {u.name}</div>
          <div style={{ color:C.muted, fontSize:14, marginTop:6 }}>Ingresa tu PIN</div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:26 }}>
          <Field label="PIN de acceso">
            <div style={{ position:"relative" }}>
              <input type={show?"text":"password"} maxLength={8} value={pin}
                onChange={e => { setPin(e.target.value); setErr(""); }}
                onKeyDown={e => e.key==="Enter" && tryLogin()}
                style={{ ...iS, letterSpacing:8, fontSize:22, textAlign:"center", paddingRight:44 }}
                placeholder="••••" autoFocus/>
              <button onClick={() => setShow(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:18, padding:4 }}>
                {show?"🙈":"👁"}
              </button>
            </div>
          </Field>
          {err && <div style={{ color:C.red, fontSize:13, textAlign:"center", marginBottom:14 }}>⚠️ {err}</div>}
          <button onClick={tryLogin} style={btnP(u.color)}>Entrar</button>
          <button onClick={() => { setSel(null); setPin(""); setErr(""); }} style={{ ...btnSec, marginTop:10 }}>← Cambiar usuario</button>
        </div>
        <div style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:16 }}>PIN por defecto — Pablo: 1234 · Sofía: 5678</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SYNC SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function SyncScreen({ state, setState, onClose, me }) {
  const [tab, setTab] = useState("export");
  const [imported, setImported] = useState(false);
  const fileRef = useRef();

  function doExport() {
    const payload = {
      exportedBy: me.id,
      exportedAt: new Date().toISOString(),
      version: 3,
      data: state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finanzasduo-${new Date().toLocaleDateString("es")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const payload = JSON.parse(ev.target.result);
        if (!payload.data) { alert("Archivo no válido"); return; }

        // Merge strategy: combine records, deduplicate by id
        const merge = (arrA, arrB) => {
          const map = {};
          [...(arrA||[]), ...(arrB||[])].forEach(x => { map[x.id] = x; });
          return Object.values(map);
        };

        const merged = {
          ...state,
          categories:      [...new Map([...state.categories, ...payload.data.categories].map(x=>[x.id,x])).values()],
          savingsGoals:    [...new Map([...state.savingsGoals, ...payload.data.savingsGoals].map(x=>[x.id,x])).values()],
          incomeCategories:[...new Set([...state.incomeCategories, ...payload.data.incomeCategories])],
          incomes:   merge(state.incomes,   payload.data.incomes),
          expenses:  merge(state.expenses,  payload.data.expenses),
          savings:   merge(state.savings,   payload.data.savings),
          budgets:   merge(state.budgets,   payload.data.budgets),
          settlements: merge(state.settlements, payload.data.settlements),
        };

        setState(merged);
        persist(merged);
        setImported(true);
      } catch { alert("Error al leer el archivo. Asegúrate de que sea un archivo válido de FinanzasDuo."); }
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"#000d", zIndex:900, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", width:"100%", maxHeight:"85vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:40, height:4, background:C.border, borderRadius:4, margin:"0 auto 20px" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18 }}>🔄 Sincronizar datos</h3>
          <button onClick={onClose} style={{ background:C.surface, border:"none", color:C.muted, fontSize:20, cursor:"pointer", width:36, height:36, borderRadius:"50%" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, background:C.surface, borderRadius:10, padding:4, marginBottom:20 }}>
          {[["export","📤 Exportar"],["import","📥 Importar"],["guide","📖 Guía"]].map(([id,label]) => (
            <button key={id} onClick={()=>setTab(id)} style={{ flex:1, background:tab===id?C.card:"transparent", color:tab===id?me.color:C.muted, border:"none", borderRadius:8, padding:"9px 6px", fontSize:13, fontWeight:700, cursor:"pointer" }}>{label}</button>
          ))}
        </div>

        {tab==="export" && (
          <div>
            <div style={{ background:C.surface, borderRadius:12, padding:16, marginBottom:18 }}>
              <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>
                Exporta todos los datos de la app como un archivo. Luego <b>envíaselo a Sofía</b> (por WhatsApp, email, etc.) para que ella lo importe y tenga los datos actualizados.
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
              {[
                {label:"Ingresos", val:state.incomes.length, icon:"💵"},
                {label:"Gastos",   val:state.expenses.length, icon:"💸"},
                {label:"Ahorros",  val:state.savings.length, icon:"🏦"},
              ].map(k=>(
                <div key={k.label} style={{ background:C.card, borderRadius:10, padding:12, textAlign:"center" }}>
                  <div style={{ fontSize:20 }}>{k.icon}</div>
                  <div style={{ color:me.color, fontWeight:700, fontSize:18 }}>{k.val}</div>
                  <div style={{ color:C.muted, fontSize:11 }}>{k.label}</div>
                </div>
              ))}
            </div>
            <button onClick={doExport} style={btnP(me.color)}>📤 Descargar archivo de datos</button>
          </div>
        )}

        {tab==="import" && (
          <div>
            {imported ? (
              <div style={{ textAlign:"center", padding:"30px 0" }}>
                <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
                <div style={{ color:C.green, fontWeight:700, fontSize:18, marginBottom:8 }}>¡Datos importados!</div>
                <div style={{ color:C.muted, fontSize:13 }}>Los datos se combinaron con los tuyos correctamente.</div>
                <button onClick={onClose} style={{ ...btnP(C.green), marginTop:20 }}>Continuar</button>
              </div>
            ) : (
              <div>
                <div style={{ background:C.surface, borderRadius:12, padding:16, marginBottom:18 }}>
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>
                    Importa el archivo que <b>te envió tu pareja</b>. Los datos se combinarán con los tuyos — no perderás nada.
                  </div>
                </div>
                <input ref={fileRef} type="file" accept=".json" onChange={doImport} style={{ display:"none" }}/>
                <button onClick={()=>fileRef.current.click()} style={btnP(me.color)}>📂 Seleccionar archivo</button>
              </div>
            )}
          </div>
        )}

        {tab==="guide" && (
          <div>
            <div style={{ color:C.text, fontSize:14, lineHeight:1.8 }}>
              <div style={{ marginBottom:16 }}>
                <div style={{ color:me.color, fontWeight:700, marginBottom:6 }}>¿Cómo funciona la sincronización?</div>
                <div style={{ color:C.muted }}>La app guarda los datos en tu celular. Para compartirlos con Sofía, se usa un archivo que van intercambiando.</div>
              </div>
              {[
                ["1️⃣","Pablo registra sus gastos e ingresos del mes."],
                ["2️⃣","Pablo exporta los datos (botón Exportar) y se los envía a Sofía por WhatsApp."],
                ["3️⃣","Sofía abre el archivo recibido y lo importa en su app."],
                ["4️⃣","Ahora Sofía tiene todos los datos combinados. Ella registra los suyos."],
                ["5️⃣","Sofía exporta y le envía el archivo actualizado a Pablo."],
                ["6️⃣","Pablo importa y ambos están sincronizados. ✅"],
              ].map(([num, text]) => (
                <div key={num} style={{ display:"flex", gap:12, marginBottom:14, background:C.surface, borderRadius:10, padding:12 }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{num}</span>
                  <span style={{ color:C.muted, fontSize:13 }}>{text}</span>
                </div>
              ))}
              <div style={{ background:C.border, borderRadius:10, padding:12, marginTop:6 }}>
                <div style={{ color:C.yellow, fontWeight:700, marginBottom:4 }}>💡 Recomendación</div>
                <div style={{ color:C.muted, fontSize:12 }}>Sincronicen una vez por semana o cada vez que uno de los dos haga registros importantes.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
function App() {
  const [loggedUser, setLoggedUser] = useState(null);
  const [state, setStateRaw] = useState(() => load() || initState());
  const [tab, setTab] = useState("dashboard");
  const [selMonth, setSelMonth] = useState(nowMY().month);
  const [selYear, setSelYear] = useState(nowMY().year);
  const [showSync, setShowSync] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedExp, setExpandedExp] = useState({});

  // modals
  const [modExp, setModExp] = useState(false);
  const [modInc, setModInc] = useState(false);
  const [modSav, setModSav] = useState(false);
  const [modBud, setModBud] = useState(false);
  const [modCat, setModCat] = useState(false);
  const [modSavGoal, setModSavGoal] = useState(false);
  const [modSettle, setModSettle] = useState(false);

  function setState(next) { setStateRaw(next); persist(next); }
  const upd = useCallback(fn => setStateRaw(prev => { const n = structuredClone(prev); fn(n); persist(n); return n; }), []);

  if (!loggedUser) return React.createElement(LoginScreen, { onLogin: setLoggedUser });

  const me = USERS.find(u => u.id === loggedUser);
  const partner = USERS.find(u => u.id !== loggedUser);
  const MK = mkKey(selMonth, selYear);

  // ── Derived ───────────────────────────────────────────────────────────────
  const mInc   = state.incomes.filter(i => i.mk === MK);
  const mExp   = state.expenses.filter(e => e.mk === MK);
  const mSav   = state.savings.filter(s => s.mk === MK);
  const mBud   = state.budgets.filter(b => b.mk === MK);
  const mSett  = state.settlements.filter(s => s.mk === MK);
  const settledIds = new Set(mSett.flatMap(s => s.expenseIds || []));

  const myInc  = mInc.filter(i => i.userId === loggedUser);
  const myExp  = mExp.filter(e => e.userId === loggedUser);
  const sharedExp = mExp.filter(e => e.shared);

  const myPersonalExp  = myExp.filter(e => !e.shared);
  const mySharedPaid   = myExp.filter(e => e.shared);
  const partnerSharedPaid = mExp.filter(e => e.shared && e.userId === partner.id);

  const totalMyInc = myInc.reduce((s,i) => s+i.amount, 0);
  const totalMyPersonalExp = myPersonalExp.reduce((s,e) => s+e.amount, 0);
  const totalMySharedFair  = mySharedPaid.reduce((s,e) => s+(e.amount/(e.splitCount||2)), 0);
  const totalPartnerFair   = partnerSharedPaid.filter(e=>!settledIds.has(e.id)).reduce((s,e) => s+(e.amount/(e.splitCount||2)), 0);
  const totalMyExp = totalMyPersonalExp + totalMySharedFair + totalPartnerFair;

  const myCash = myExp.reduce((s,e) => s+(e.payment==="Efectivo"?e.amount:0), 0);
  const myCard = myExp.reduce((s,e) => s+(e.payment==="Tarjeta"?e.amount:0), 0);

  const totalBudInd = mBud.filter(b=>b.userId===loggedUser&&b.scope==="individual").reduce((s,b)=>s+b.amount,0);
  const totalBudSha = mBud.filter(b=>b.userId===loggedUser&&b.scope==="compartido").reduce((s,b)=>s+b.amount,0);
  const totalMySav  = mSav.filter(s=>s.userId===loggedUser).reduce((s,sv)=>s+sv.amount,0);
  const totalSharedSav = mSav.filter(s=>s.goalOwner==="Compartido").reduce((s,sv)=>s+sv.amount,0);
  const disponible = totalMyInc - totalMyExp - totalMySav;

  const iPaid = mySharedPaid.filter(e=>!settledIds.has(e.id)).reduce((s,e)=>s+e.amount,0);
  const partPaid = partnerSharedPaid.filter(e=>!settledIds.has(e.id)).reduce((s,e)=>s+e.amount,0);
  const iOwePartner = ((iPaid+partPaid)/2) - iPaid; // positive = I owe partner

  const thirdPartyDue = sharedExp.filter(e=>e.splitCount>2&&e.userId===loggedUser)
    .reduce((s,e)=>s+(e.amount/e.splitCount)*(e.splitCount-2),0);

  function getBudget(catId,scope){ return (mBud.find(b=>b.catId===catId&&b.userId===loggedUser&&b.scope===scope)||{}).amount||0; }
  function getSpent(catId,scope){
    if(scope==="individual") return myPersonalExp.filter(e=>e.catId===catId).reduce((s,e)=>s+e.amount,0);
    return sharedExp.filter(e=>e.catId===catId).reduce((s,e)=>s+(e.amount/(e.splitCount||2)),0);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  function addExpense(f){ upd(s=>{ s.expenses.push({id:uid(),mk:MK,userId:loggedUser,...f,amount:parseFloat(f.amount),splitCount:parseInt(f.splitCount)||2}); }); setToast("Gasto guardado"); }
  function addIncome(f){ upd(s=>{ s.incomes.push({id:uid(),mk:MK,userId:loggedUser,...f,amount:parseFloat(f.amount)}); }); setToast("Ingreso guardado"); }
  function addSaving(f){ upd(s=>{ s.savings.push({id:uid(),mk:MK,userId:loggedUser,...f,amount:parseFloat(f.amount)}); }); setToast("Ahorro guardado"); }
  function addBudget(f){
    upd(s=>{
      const idx=s.budgets.findIndex(b=>b.mk===MK&&b.catId===f.catId&&b.userId===loggedUser&&b.scope===f.scope);
      const item={id:uid(),mk:MK,userId:loggedUser,...f,amount:parseFloat(f.amount)};
      if(idx>=0) s.budgets[idx]=item; else s.budgets.push(item);
    });
    setToast("Presupuesto actualizado");
  }
  function addCategory(f){ upd(s=>{ s.categories.push({id:uid(),...f}); }); setToast("Categoría creada"); }
  function delCategory(id){ upd(s=>{ s.categories=s.categories.filter(c=>c.id!==id); }); }
  function addSavGoal(f){ upd(s=>{ s.savingsGoals.push({id:uid(),...f}); }); setToast("Meta creada"); }
  function delRecord(type,id){ upd(s=>{ s[type]=s[type].filter(x=>x.id!==id); }); }
  function addSettlement(f){ upd(s=>{ s.settlements.push({id:uid(),mk:MK,by:loggedUser,...f,amount:parseFloat(f.amount),date:todayStr()}); }); setToast("Pago registrado"); }
  function toggleExp(id){ setExpandedExp(p=>({...p,[id]:!p[id]})); }

  const TABS = [
    {id:"dashboard",label:"📊",full:"Dashboard"},
    {id:"expenses", label:"💸",full:"Gastos"},
    {id:"income",   label:"💵",full:"Ingresos"},
    {id:"savings",  label:"🏦",full:"Ahorros"},
    {id:"budget",   label:"📋",full:"Presupuesto"},
    {id:"shared",   label:"🤝",full:"Compartido"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans',sans-serif", paddingBottom:72 }}>

      {/* HEADER */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:600, margin:"0 auto", padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>💰 FinanzasDuo</div>
          </div>
          <select value={selMonth} onChange={e=>setSelMonth(+e.target.value)} style={{ ...iS, width:"auto", padding:"6px 10px", fontSize:13 }}>
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={selYear} onChange={e=>setSelYear(+e.target.value)} style={{ ...iS, width:"auto", padding:"6px 10px", fontSize:13 }}>
            {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={()=>setShowSync(true)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 10px", cursor:"pointer", fontSize:16, color:C.muted }}>🔄</button>
          <div onClick={()=>setLoggedUser(null)} style={{ width:34, height:34, borderRadius:"50%", background:me.color+"22", border:`2px solid ${me.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:me.color, cursor:"pointer" }}>{me.name[0]}</div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:600, margin:"0 auto", padding:"14px 14px 0" }}>

        {/* ══ DASHBOARD ════════════════════════════════════ */}
        {tab==="dashboard" && (
          <div>
            <div style={{ marginBottom:18 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, marginBottom:2 }}>Hola, {me.name} 👋</h2>
              <div style={{ color:C.muted, fontSize:13 }}>{MONTHS[selMonth-1]} {selYear}</div>
            </div>

            <SectionTitle>Mi Resumen Individual</SectionTitle>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
              <KpiCard icon="💵" label="Ingresos"    value={totalMyInc}  color={C.green}/>
              <KpiCard icon="💸" label="Gastos"      value={totalMyExp}  color={C.red}/>
              <KpiCard icon="📋" label="Presupuesto" value={totalBudInd} color={C.yellow}/>
              <KpiCard icon="🏦" label="Mis Ahorros" value={totalMySav}  color={C.purple}/>
            </div>
            <div style={{ background:C.card, border:`2px solid ${disponible>=0?C.green:C.red}`, borderRadius:14, padding:"14px 18px", marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:1 }}>DISPONIBLE</div>
                <div style={{ color:disponible>=0?C.green:C.red, fontSize:22, fontWeight:700 }}>{fmt(disponible)}</div>
              </div>
              <div style={{ fontSize:30 }}>{disponible>=0?"✅":"⚠️"}</div>
            </div>

            <SectionTitle>Mis Gastos por Medio de Pago</SectionTitle>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
                <div style={{ fontSize:22, marginBottom:4 }}>💵</div>
                <div style={{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:3 }}>EFECTIVO</div>
                <div style={{ color:C.yellow, fontSize:18, fontWeight:700 }}>{fmt(myCash)}</div>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
                <div style={{ fontSize:22, marginBottom:4 }}>💳</div>
                <div style={{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:3 }}>TARJETA</div>
                <div style={{ color:C.accent, fontSize:18, fontWeight:700 }}>{fmt(myCard)}</div>
              </div>
            </div>

            <SectionTitle>Pareja — Vista Compartida</SectionTitle>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <KpiCard small icon="🤝" label="Gastos compartidos" value={iPaid+partPaid}    color={C.yellow}/>
              <KpiCard small icon="🏦" label="Ahorros conjuntos"  value={totalSharedSav}   color={C.purple}/>
              <KpiCard small icon="📋" label="Presupuesto comp."  value={totalBudSha}      color={C.yellow}/>
              {thirdPartyDue>0&&<KpiCard small icon="👥" label="Otros nos deben" value={thirdPartyDue} color={C.green}/>}
            </div>

            <SectionTitle>Balance del Mes</SectionTitle>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:4 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                {USERS.map(u => {
                  const paid = mExp.filter(e=>e.shared&&e.userId===u.id&&!settledIds.has(e.id)).reduce((s,e)=>s+e.amount,0);
                  return (
                    <div key={u.id} style={{ background:C.surface, borderRadius:10, padding:12 }}>
                      <div style={{ color:C.muted, fontSize:10 }}>{u.name.toUpperCase()} PAGÓ</div>
                      <div style={{ color:u.color, fontSize:18, fontWeight:700 }}>{fmt(paid)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:C.surface, borderRadius:10, padding:13 }}>
                {Math.abs(iOwePartner)<0.01
                  ?<div style={{ color:C.green, fontWeight:700 }}>✅ Están equilibrados</div>
                  :iOwePartner>0
                    ?<div style={{ fontWeight:700, color:me.color }}>Debes {fmt(iOwePartner)} a {partner.name}</div>
                    :<div style={{ fontWeight:700, color:partner.color }}>{partner.name} te debe {fmt(Math.abs(iOwePartner))}</div>
                }
              </div>
              {thirdPartyDue>0&&(
                <div style={{ background:C.surface, borderRadius:10, padding:13, marginTop:8 }}>
                  <div style={{ color:C.muted, fontSize:10, marginBottom:4 }}>OTRAS PERSONAS NOS DEBEN</div>
                  <div style={{ color:C.green, fontWeight:700 }}>{fmt(thirdPartyDue)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ EXPENSES ═════════════════════════════════════ */}
        {tab==="expenses" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>Mis Gastos</h2>
              <button onClick={()=>setModExp(true)} style={{ ...btnP(me.color), width:"auto", padding:"10px 18px", fontSize:14 }}>+ Agregar</button>
            </div>
            {myExp.length===0
              ?<EmptyState icon="💸" msg="No hay gastos este mes" action="+ Agregar" onAction={()=>setModExp(true)}/>
              :myExp.map(e=>(
                <div key={e.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:10, overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:3 }}>{e.description}</div>
                      <div style={{ fontSize:12, color:C.muted, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                        <span>{e.catName}</span>
                        <span>·</span>
                        <span>{e.date}</span>
                        <span>·</span>
                        <span>{e.payment==="Efectivo"?"💵":"💳"} {e.payment}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                      {e.shared&&<Pill label="Compartido" color={C.yellow}/>}
                      <div style={{ color:C.red, fontWeight:700, fontSize:16 }}>{fmt(e.amount)}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", borderTop:`1px solid ${C.border}` }}>
                    {e.notes&&<button onClick={()=>toggleExp(e.id)} style={{ flex:1, background:"none", border:"none", color:C.muted, padding:"9px 14px", cursor:"pointer", fontSize:13, textAlign:"left" }}>
                      {expandedExp[e.id]?"▲ Ocultar nota":"▼ Ver nota"}
                    </button>}
                    <button onClick={()=>delRecord("expenses",e.id)} style={{ background:"none", border:"none", color:C.red+"99", padding:"9px 14px", cursor:"pointer", fontSize:13, marginLeft:"auto" }}>Eliminar</button>
                  </div>
                  {expandedExp[e.id]&&e.notes&&(
                    <div style={{ background:C.surface, padding:"10px 14px", fontSize:13, color:C.muted }}>📝 {e.notes}</div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* ══ INCOME ═══════════════════════════════════════ */}
        {tab==="income" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>Mis Ingresos</h2>
              <button onClick={()=>setModInc(true)} style={{ ...btnP(me.color), width:"auto", padding:"10px 18px", fontSize:14 }}>+ Agregar</button>
            </div>
            {myInc.length===0
              ?<EmptyState icon="💵" msg="No hay ingresos este mes" action="+ Agregar" onAction={()=>setModInc(true)}/>
              :myInc.map(i=>(
                <div key={i.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:600, marginBottom:3 }}>{i.description}</div>
                      <div style={{ fontSize:12, color:C.muted }}>{i.category} · {i.type}</div>
                    </div>
                    <div style={{ color:C.green, fontWeight:700, fontSize:16 }}>{fmt(i.amount)}</div>
                  </div>
                  <div style={{ borderTop:`1px solid ${C.border}` }}>
                    <button onClick={()=>delRecord("incomes",i.id)} style={{ background:"none", border:"none", color:C.red+"99", padding:"9px 14px", cursor:"pointer", fontSize:13, width:"100%", textAlign:"right" }}>Eliminar</button>
                  </div>
                </div>
              ))
            }
            {myInc.length>0&&(
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14, display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:C.muted, fontWeight:700 }}>TOTAL INGRESOS</span>
                <span style={{ color:C.green, fontWeight:700, fontSize:18 }}>{fmt(totalMyInc)}</span>
              </div>
            )}
          </div>
        )}

        {/* ══ SAVINGS ══════════════════════════════════════ */}
        {tab==="savings" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>Ahorros</h2>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setModSavGoal(true)} style={{ ...btnSec, width:"auto", padding:"10px 14px", fontSize:13 }}>+ Meta</button>
                <button onClick={()=>setModSav(true)} style={{ ...btnP(me.color), width:"auto", padding:"10px 18px", fontSize:14 }}>+ Ahorro</button>
              </div>
            </div>
            <div style={{ background:C.surface, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.muted, marginBottom:16 }}>
              💡 Registra <b style={{color:C.text}}>tu propia aportación</b>. En metas compartidas, la app suma las de ambos.
            </div>
            {state.savingsGoals.map(goal=>{
              const entries=mSav.filter(s=>s.goalId===goal.id);
              const total=entries.reduce((s,e)=>s+e.amount,0);
              if(entries.length===0) return null;
              return (
                <div key={goal.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, marginBottom:5 }}>{goal.name}</div>
                      <Pill label={goal.owner} color={goal.owner==="Compartido"?C.purple:me.color}/>
                    </div>
                    <div style={{ color:C.purple, fontWeight:700, fontSize:18 }}>{fmt(total)}</div>
                  </div>
                  {entries.map(e=>(
                    <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderTop:`1px solid ${C.border}`, fontSize:13 }}>
                      <span style={{ color:C.muted }}>{e.notes||"Aportación"} · {USERS.find(u=>u.id===e.userId)?.name}</span>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ color:C.purple, fontWeight:600 }}>{fmt(e.amount)}</span>
                        <button onClick={()=>delRecord("savings",e.id)} style={{ background:"none", border:"none", color:C.red+"99", cursor:"pointer", fontSize:12 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {mSav.length===0&&<EmptyState icon="🏦" msg="No hay ahorros este mes" action="+ Agregar ahorro" onAction={()=>setModSav(true)}/>}
          </div>
        )}

        {/* ══ BUDGET ═══════════════════════════════════════ */}
        {tab==="budget" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>Presupuesto</h2>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setModCat(true)} style={{ ...btnSec, width:"auto", padding:"10px 12px", fontSize:13 }}>+ Cat.</button>
                <button onClick={()=>setModBud(true)} style={{ ...btnP(me.color), width:"auto", padding:"10px 18px", fontSize:14 }}>Editar</button>
              </div>
            </div>
            <SectionTitle>Gastos Fijos</SectionTitle>
            {state.categories.filter(c=>c.type==="Gasto Fijo").map(cat=>
              <BudgetRow key={cat.id} cat={cat} scope={cat.owner==="Compartido"?"compartido":"individual"} getSpent={getSpent} getBudget={getBudget} color={me.color} onDel={()=>delCategory(cat.id)}/>
            )}
            <SectionTitle>Gastos Variables</SectionTitle>
            {state.categories.filter(c=>c.type==="Gasto Variable").map(cat=>
              <BudgetRow key={cat.id} cat={cat} scope={cat.owner==="Compartido"?"compartido":"individual"} getSpent={getSpent} getBudget={getBudget} color={me.color} onDel={()=>delCategory(cat.id)}/>
            )}
            <SectionTitle>Metas de Ahorro</SectionTitle>
            {state.savingsGoals.map(goal=>{
              const aportado = mSav.filter(s=>s.goalId===goal.id&&s.userId===loggedUser).reduce((s,e)=>s+e.amount,0);
              const budg = getBudget(goal.id,"individual");
              return (
                <div key={goal.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight:500 }}>{goal.name}</span>
                      <Pill label={goal.owner} color={goal.owner==="Compartido"?C.purple:me.color}/>
                    </div>
                    <div style={{ fontSize:13 }}>
                      <span style={{ color:C.purple }}>{fmt(aportado)}</span>
                      {budg>0&&<span style={{ color:C.muted }}> / {fmt(budg)}</span>}
                    </div>
                  </div>
                  <MiniBar value={aportado} max={budg||aportado||1} color={C.purple}/>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ SHARED ═══════════════════════════════════════ */}
        {tab==="shared" && (
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:16 }}>Vista Compartida</h2>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18, marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>⚖️ Balance compartido</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                {USERS.map(u=>{
                  const paid=mExp.filter(e=>e.shared&&e.userId===u.id&&!settledIds.has(e.id)).reduce((s,e)=>s+e.amount,0);
                  return (
                    <div key={u.id} style={{ background:C.surface, borderRadius:10, padding:13 }}>
                      <div style={{ color:C.muted, fontSize:10, marginBottom:3 }}>{u.name.toUpperCase()} PAGÓ</div>
                      <div style={{ color:u.color, fontSize:18, fontWeight:700 }}>{fmt(paid)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:C.surface, borderRadius:10, padding:13, marginBottom:10 }}>
                {Math.abs(iOwePartner)<0.01
                  ?<div style={{ color:C.green, fontWeight:700 }}>✅ Están equilibrados</div>
                  :iOwePartner>0
                    ?<div style={{ fontWeight:700, color:me.color }}>Debes {fmt(iOwePartner)} a {partner.name}</div>
                    :<div style={{ fontWeight:700, color:partner.color }}>{partner.name} te debe {fmt(Math.abs(iOwePartner))}</div>
                }
              </div>
              {thirdPartyDue>0&&(
                <div style={{ background:C.surface, borderRadius:10, padding:13, marginBottom:10 }}>
                  <div style={{ color:C.muted, fontSize:10, marginBottom:3 }}>OTRAS PERSONAS NOS DEBEN</div>
                  <div style={{ color:C.green, fontWeight:700 }}>{fmt(thirdPartyDue)}</div>
                </div>
              )}
              {Math.abs(iOwePartner)>0.01&&(
                <button onClick={()=>setModSettle(true)} style={{ ...btnP(C.green), fontSize:14 }}>✅ Registrar pago de deuda</button>
              )}
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18, marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>🏦 Ahorros conjuntos</div>
              {state.savingsGoals.filter(g=>g.owner==="Compartido").map(goal=>{
                const entries=mSav.filter(s=>s.goalId===goal.id);
                const total=entries.reduce((s,e)=>s+e.amount,0);
                const pablo=entries.filter(e=>e.userId==="pablo").reduce((s,e)=>s+e.amount,0);
                const sofia=entries.filter(e=>e.userId==="sofia").reduce((s,e)=>s+e.amount,0);
                return (
                  <div key={goal.id} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:10, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontWeight:600, fontSize:14 }}>{goal.name}</span>
                      <span style={{ color:C.purple, fontWeight:700 }}>{fmt(total)}</span>
                    </div>
                    <div style={{ fontSize:12, color:C.muted, display:"flex", gap:14 }}>
                      <span style={{ color:C.pablo }}>Pablo: {fmt(pablo)}</span>
                      <span style={{ color:C.sofia }}>Sofía: {fmt(sofia)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>💳 Gastos compartidos del mes</div>
              {sharedExp.length===0
                ?<div style={{ color:C.muted, fontSize:13 }}>No hay gastos compartidos este mes</div>
                :sharedExp.map(e=>{
                  const settled=settledIds.has(e.id);
                  return (
                    <div key={e.id} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:12, marginBottom:12, opacity:settled?.6:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:600, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                            {e.description}
                            {settled&&<Pill label="Saldado" color={C.green}/>}
                          </div>
                          <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
                            Pagó: {USERS.find(u=>u.id===e.userId)?.name} · {e.catName} · entre {e.splitCount||2} personas
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
                          <div style={{ color:C.red, fontWeight:700 }}>{fmt(e.amount)}</div>
                          <div style={{ color:C.muted, fontSize:11 }}>{fmt(e.amount/(e.splitCount||2))} c/u</div>
                        </div>
                      </div>
                      {e.notes&&(
                        <button onClick={()=>toggleExp(e.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:12, marginTop:4, padding:0 }}>
                          {expandedExp[e.id]?"▲ Ocultar":"▼ Ver nota"}
                        </button>
                      )}
                      {expandedExp[e.id]&&e.notes&&<div style={{ fontSize:12, color:C.muted, marginTop:4 }}>📝 {e.notes}</div>}
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:"none", border:"none", padding:"10px 4px 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <span style={{ fontSize:20 }}>{t.label}</span>
            <span style={{ fontSize:9, fontWeight:700, color:tab===t.id?me.color:C.muted, letterSpacing:.5 }}>{t.full.toUpperCase()}</span>
            {tab===t.id&&<div style={{ width:24, height:3, background:me.color, borderRadius:2 }}/>}
          </button>
        ))}
      </div>

      {/* SYNC PANEL */}
      {showSync&&<SyncScreen state={state} setState={setState} onClose={()=>setShowSync(false)} me={me}/>}

      {/* MODALS */}
      {modExp    &&<ExpenseModal    state={state} me={me} MK={MK} onAdd={addExpense}    onClose={()=>setModExp(false)}/>}
      {modInc    &&<IncomeModal     state={state}          onAdd={addIncome}     onClose={()=>setModInc(false)}/>}
      {modSav    &&<SavingModal     state={state}          onAdd={addSaving}     onClose={()=>setModSav(false)}/>}
      {modBud    &&<BudgetModal     state={state} me={me} onAdd={addBudget}     onClose={()=>setModBud(false)}/>}
      {modCat    &&<CategoryModal                          onAdd={addCategory}   onClose={()=>setModCat(false)}/>}
      {modSavGoal&&<SavGoalModal                           onAdd={addSavGoal}    onClose={()=>setModSavGoal(false)}/>}
      {modSettle &&<SettleModal iOwePartner={iOwePartner} partner={partner} sharedExp={sharedExp} settledIds={settledIds} onAdd={addSettlement} onClose={()=>setModSettle(false)} me={me} MK={MK}/>}

      {/* TOAST */}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ── Budget Row ────────────────────────────────────────────────────────────────
function BudgetRow({ cat, scope, getSpent, getBudget, color, onDel }) {
  const spent = getSpent(cat.id, scope);
  const budg  = getBudget(cat.id, scope);
  const over  = budg > 0 && spent > budg;
  return (
    <div style={{ background:C.card, border:`1px solid ${over?C.red:C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <div style={{ flex:1, minWidth:0, marginRight:8 }}>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>{cat.name}</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            <Pill label={cat.type==="Gasto Fijo"?"Fijo":"Variable"} color={cat.type==="Gasto Fijo"?C.accent:C.yellow}/>
            <Pill label={cat.owner} color={cat.owner==="Compartido"?C.purple:color}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:14, color:over?C.red:C.text, fontWeight:600 }}>{fmt(spent)}</div>
            {budg>0&&<div style={{ fontSize:11, color:C.muted }}>de {fmt(budg)}</div>}
          </div>
          <button onClick={onDel} style={{ background:C.red+"22", border:"none", color:C.red, borderRadius:8, padding:"5px 9px", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>
      </div>
      <MiniBar value={spent} max={budg||spent||1} color={color}/>
      {over&&<div style={{ fontSize:11, color:C.red, marginTop:4 }}>⚠️ Excedido por {fmt(spent-budg)}</div>}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ icon, msg, action, onAction }) {
  return (
    <div style={{ textAlign:"center", padding:"52px 20px" }}>
      <div style={{ fontSize:42, marginBottom:10 }}>{icon}</div>
      <div style={{ color:C.muted, fontSize:14, marginBottom:action?18:0 }}>{msg}</div>
      {action&&<button onClick={onAction} style={{ ...btnP(C.accent), width:"auto", padding:"11px 22px", fontSize:14 }}>{action}</button>}
    </div>
  );
}

// ── Expense Modal ─────────────────────────────────────────────────────────────
function ExpenseModal({ state, me, MK, onAdd, onClose }) {
  const [mo, yr] = MK.split("-");
  const dd = `${yr}-${mo}-${String(new Date().getDate()).padStart(2,"0")}`;
  const [f, setF] = useState({ date:dd, description:"", catId:state.categories[0]?.id, catName:state.categories[0]?.name, amount:"", shared:false, splitCount:"2", payment:"Tarjeta", notes:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  function submit(){
    if(!f.description||!f.amount) return;
    const c = state.categories.find(x=>x.id===f.catId);
    onAdd({...f, catName:c?.name||f.catName});
    onClose();
  }
  return (
    <Modal title="Registrar Gasto" onClose={onClose}>
      <Field label="Fecha"><input type="date" style={iS} value={f.date} onChange={e=>set("date",e.target.value)}/></Field>
      <Field label="Descripción"><input style={iS} placeholder="Ej: Supermercado semanal" value={f.description} onChange={e=>set("description",e.target.value)}/></Field>
      <Field label="Categoría">
        <select style={iS} value={f.catId} onChange={e=>{const c=state.categories.find(x=>x.id===e.target.value);set("catId",e.target.value);set("catName",c?.name||"");}}>
          {state.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Monto ($)"><input type="number" style={iS} placeholder="0.00" value={f.amount} onChange={e=>set("amount",e.target.value)}/></Field>
      <Field label="Medio de pago">
        <select style={iS} value={f.payment} onChange={e=>set("payment",e.target.value)}>
          <option value="Tarjeta">💳 Tarjeta de Crédito</option>
          <option value="Efectivo">💵 Efectivo</option>
        </select>
      </Field>
      <Field label="¿Es compartido?">
        <select style={iS} value={f.shared?"si":"no"} onChange={e=>set("shared",e.target.value==="si")}>
          <option value="no">No, es personal</option>
          <option value="si">Sí, compartido</option>
        </select>
      </Field>
      {f.shared&&(
        <Field label="¿Entre cuántas personas?" hint={`Si son solo tú y ${me.id==="pablo"?"Sofía":"Pablo"}, deja en 2.`}>
          <input type="number" style={iS} value={f.splitCount} min="2" onChange={e=>set("splitCount",e.target.value)}/>
        </Field>
      )}
      <Field label="Notas (opcional)"><input style={iS} placeholder="Detalle adicional…" value={f.notes} onChange={e=>set("notes",e.target.value)}/></Field>
      <button style={btnP(me.color)} onClick={submit}>Guardar Gasto</button>
    </Modal>
  );
}

// ── Income Modal ──────────────────────────────────────────────────────────────
function IncomeModal({ state, onAdd, onClose }) {
  const [f, setF] = useState({ description:"", category:state.incomeCategories[0], amount:"", type:"Fijo" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  function submit(){ if(!f.description||!f.amount) return; onAdd(f); onClose(); }
  return (
    <Modal title="Registrar Ingreso" onClose={onClose}>
      <Field label="Descripción"><input style={iS} placeholder="Ej: Salario enero" value={f.description} onChange={e=>set("description",e.target.value)}/></Field>
      <Field label="Categoría">
        <select style={iS} value={f.category} onChange={e=>set("category",e.target.value)}>
          {state.incomeCategories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Monto ($)"><input type="number" style={iS} placeholder="0.00" value={f.amount} onChange={e=>set("amount",e.target.value)}/></Field>
      <Field label="Tipo">
        <select style={iS} value={f.type} onChange={e=>set("type",e.target.value)}>
          {["Fijo","Variable","Bono","Otro"].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <button style={btnP(C.green)} onClick={submit}>Guardar Ingreso</button>
    </Modal>
  );
}

// ── Saving Modal ──────────────────────────────────────────────────────────────
function SavingModal({ state, onAdd, onClose }) {
  const [f, setF] = useState({ goalId:state.savingsGoals[0]?.id, goalOwner:state.savingsGoals[0]?.owner||"Compartido", amount:"", notes:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  function submit(){ if(!f.amount) return; const g=state.savingsGoals.find(x=>x.id===f.goalId); onAdd({...f,goalOwner:g?.owner||"Compartido"}); onClose(); }
  return (
    <Modal title="Registrar Ahorro" onClose={onClose}>
      <div style={{ background:C.surface, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.muted, marginBottom:16 }}>
        💡 Ingresa <b style={{color:C.text}}>tu aportación personal</b>. En metas compartidas se suman las de ambos.
      </div>
      <Field label="Meta de ahorro">
        <select style={iS} value={f.goalId} onChange={e=>{const g=state.savingsGoals.find(x=>x.id===e.target.value);set("goalId",e.target.value);set("goalOwner",g?.owner||"Compartido");}}>
          {state.savingsGoals.map(g=><option key={g.id} value={g.id}>{g.name} ({g.owner})</option>)}
        </select>
      </Field>
      <Field label="Monto que aportas ($)"><input type="number" style={iS} placeholder="0.00" value={f.amount} onChange={e=>set("amount",e.target.value)}/></Field>
      <Field label="Notas"><input style={iS} placeholder="Ej: Aportación mensual" value={f.notes} onChange={e=>set("notes",e.target.value)}/></Field>
      <button style={btnP(C.purple)} onClick={submit}>Guardar Ahorro</button>
    </Modal>
  );
}

// ── Budget Modal ──────────────────────────────────────────────────────────────
function BudgetModal({ state, me, onAdd, onClose }) {
  const allItems = [...state.categories, ...state.savingsGoals.map(g=>({...g,type:"Ahorro"}))];
  const [catId, setCatId] = useState(allItems[0]?.id);
  const [amount, setAmount] = useState("");
  const [scope, setScope] = useState("individual");
  function submit(){ if(!amount) return; const c=allItems.find(x=>x.id===catId); onAdd({catId,catName:c?.name||"",amount,scope}); setAmount(""); }
  return (
    <Modal title="Establecer Presupuesto" onClose={onClose}>
      <div style={{ color:C.muted, fontSize:13, marginBottom:16 }}>Define cuánto planeas gastar en cada categoría este mes.</div>
      <Field label="Categoría o meta">
        <select style={iS} value={catId} onChange={e=>setCatId(e.target.value)}>
          {allItems.map(c=><option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
        </select>
      </Field>
      <Field label="Tipo">
        <select style={iS} value={scope} onChange={e=>setScope(e.target.value)}>
          <option value="individual">Individual (solo mío)</option>
          <option value="compartido">Compartido (pareja)</option>
        </select>
      </Field>
      <Field label="Monto ($)"><input type="number" style={iS} placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}/></Field>
      <button style={btnP(me.color)} onClick={submit}>Guardar</button>
    </Modal>
  );
}

// ── Category Modal ────────────────────────────────────────────────────────────
function CategoryModal({ onAdd, onClose }) {
  const [f, setF] = useState({ name:"", type:"Gasto Variable", owner:"Compartido" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  function submit(){ if(!f.name) return; onAdd(f); onClose(); }
  return (
    <Modal title="Nueva Categoría" onClose={onClose}>
      <Field label="Nombre"><input style={iS} placeholder="Ej: Mascotas" value={f.name} onChange={e=>set("name",e.target.value)}/></Field>
      <Field label="Tipo">
        <select style={iS} value={f.type} onChange={e=>set("type",e.target.value)}>
          {["Gasto Fijo","Gasto Variable"].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="¿De quién?">
        <select style={iS} value={f.owner} onChange={e=>set("owner",e.target.value)}>
          <option value="Compartido">Compartido</option>
          <option value="Individual">Individual</option>
        </select>
      </Field>
      <button style={btnP(C.accent)} onClick={submit}>Crear Categoría</button>
    </Modal>
  );
}

// ── Savings Goal Modal ────────────────────────────────────────────────────────
function SavGoalModal({ onAdd, onClose }) {
  const [f, setF] = useState({ name:"", owner:"Compartido" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  function submit(){ if(!f.name) return; onAdd(f); onClose(); }
  return (
    <Modal title="Nueva Meta de Ahorro" onClose={onClose}>
      <Field label="Nombre"><input style={iS} placeholder="Ej: Auto nuevo, Viaje a Europa…" value={f.name} onChange={e=>set("name",e.target.value)}/></Field>
      <Field label="¿De quién?">
        <select style={iS} value={f.owner} onChange={e=>set("owner",e.target.value)}>
          <option value="Compartido">Compartida (ambos)</option>
          <option value="Individual">Individual (solo mía)</option>
        </select>
      </Field>
      <button style={btnP(C.purple)} onClick={submit}>Crear Meta</button>
    </Modal>
  );
}

// ── Settle Modal ──────────────────────────────────────────────────────────────
function SettleModal({ iOwePartner, partner, sharedExp, settledIds, onAdd, onClose, me, MK }) {
  const unsettled = sharedExp.filter(e=>!settledIds.has(e.id)&&e.userId!==me.id);
  const [selExp, setSelExp] = useState(unsettled.map(e=>e.id));
  const [note, setNote] = useState("");
  const amount = Math.abs(iOwePartner);
  function toggle(id){ setSelExp(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]); }
  function submit(){ onAdd({amount, expenseIds:selExp, note, mk:MK}); onClose(); }
  return (
    <Modal title="Registrar Pago de Deuda" onClose={onClose}>
      <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:16 }}>
        <div style={{ color:C.muted, fontSize:11, marginBottom:4 }}>MONTO A SALDAR</div>
        <div style={{ color:C.green, fontWeight:700, fontSize:26 }}>{fmt(amount)}</div>
        <div style={{ color:C.muted, fontSize:13, marginTop:4 }}>
          {iOwePartner>0?`Pagas a ${partner.name}`:`${partner.name} te paga`}
        </div>
      </div>
      {unsettled.length>0&&(
        <Field label="Gastos que se saldan">
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", maxHeight:200, overflowY:"auto" }}>
            {unsettled.map(e=>(
              <label key={e.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
                <input type="checkbox" checked={selExp.includes(e.id)} onChange={()=>toggle(e.id)} style={{ accentColor:C.green, width:18, height:18 }}/>
                <span style={{ flex:1, fontSize:14, color:C.text }}>{e.description}</span>
                <span style={{ color:C.muted, fontSize:13 }}>{fmt(e.amount)}</span>
              </label>
            ))}
          </div>
        </Field>
      )}
      <Field label="Nota (opcional)"><input style={iS} placeholder="Ej: Transferencia bancaria" value={note} onChange={e=>setNote(e.target.value)}/></Field>
      <button style={btnP(C.green)} onClick={submit}>✅ Confirmar Pago</button>
    </Modal>
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
