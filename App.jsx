import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── Constants ────────────────────────────────────────────────────────────────

const CARDS = ["SMBC", "Amazon", "PayPay", "セゾン"];

const CARD_CATEGORIES = {
  SMBC: ["コンビニ・スーパー等", "書籍", "チャージ", "その他"],
  Amazon: ["Amazon", "書籍(Downloads)", "公文・バリュー", "ドリームコーチ", "ふるさと納税", "その他"],
  PayPay: ["請求書払い", "チャージ", "その他", "ふるさと納税"],
  セゾン: ["生活費", "固定費", "移動費", "化粧品・美容", "ふるさと納税", "その他"],
};

const FURUSATO_CATS = {
  SMBC: [],
  Amazon: ["ふるさと納税"],
  PayPay: ["ふるさと納税"],
  セゾン: ["ふるさと納税"],
};

const CARD_COLORS = { SMBC: "#34d399", Amazon: "#f59e0b", PayPay: "#f87171", セゾン: "#818cf8" };

const CAT_COLORS = [
  "#34d399","#f59e0b","#f87171","#818cf8","#38bdf8","#e879f9","#84cc16","#ff6b6b","#06b6d4","#fbbf24","#c084fc","#4ade80"
];

// Per-card distinct color sets
const CARD_CAT_COLORS = {
  SMBC:   ["#38bdf8","#f59e0b","#a78bfa","#f87171"],
  Amazon: ["#34d399","#fbbf24","#f87171","#818cf8","#e879f9","#fb923c"],
  PayPay: ["#38bdf8","#a78bfa","#f87171","#f59e0b"],
  セゾン: ["#34d399","#38bdf8","#f59e0b","#e879f9","#f87171","#84cc16"],
};

// Storage wrapper using localStorage
const storage = {
  get: async (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    } catch { return null; }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, value);
      return { value };
    } catch { return null; }
  },
};

const STORAGE_KEY = "expense-tracker-v2";


// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED = [
  // SMBC
  { id:"s1", card:"SMBC", month:"2026-03", categories:{ "コンビニ・スーパー等":5782, "書籍":2379, "チャージ":75000, "その他":1990 }, otherNote:"多摩六都科学館 1,990円" },
  { id:"s2", card:"SMBC", month:"2026-04", categories:{ "コンビニ・スーパー等":10631, "書籍":3971, "チャージ":63000, "その他":1800 }, otherNote:"市ヶ谷フィッシュセンター 1,800円" },
  // Amazon
  { id:"a1", card:"Amazon", month:"2026-03", categories:{ "Amazon":60908, "書籍(Downloads)":3015, "公文・バリュー":16530, "ドリームコーチ":0, "ふるさと納税":22000, "その他":55289 }, otherNote:"テラサ990 / Airbnb(ロンドン)54,299円" },
  { id:"a2", card:"Amazon", month:"2026-04", categories:{ "Amazon":65466, "書籍(Downloads)":980, "公文・バリュー":40260, "ドリームコーチ":38580, "ふるさと納税":10000, "その他":1005 }, otherNote:"テラサ990 / クリックポスト185円" },
  // PayPay
  { id:"p1", card:"PayPay", month:"2026-03", categories:{ "請求書払い":74496, "チャージ":13000, "その他":39990, "ふるさと納税":0 }, otherNote:"セオサイクル39,460 / めちゃコミ330 / PayPayほけん200" },
  { id:"p2", card:"PayPay", month:"2026-04", categories:{ "請求書払い":8422, "チャージ":13000, "その他":26615, "ふるさと納税":0 }, otherNote:"道の駅佐川12,212 / Yahoo!ショッピング8,990 / いなげや4,113他" },
  // セゾン
  { id:"z1", card:"セゾン", month:"2026-04", categories:{ "生活費":241732, "固定費":126505, "移動費":139010, "化粧品・美容":172309, "ふるさと納税":50477, "その他":25683 }, otherNote:"移動費内訳: タイムズカー49,170 / Suica25,250 / ETC14,580 / タクシー14,010 / JR27,550 / 駐車場8,450" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = n => n.toLocaleString("ja-JP") + "円";

const totalOf = (entry) => Object.values(entry.categories).reduce((a, b) => a + b, 0);

const furusatoOf = (entry) => {
  const fcats = FURUSATO_CATS[entry.card] || [];
  return fcats.reduce((s, c) => s + (entry.categories[c] || 0), 0);
};

const months = () => {
  const res = [];
  for (let y = 2024; y <= 2027; y++)
    for (let m = 1; m <= 12; m++)
      res.push(`${y}-${String(m).padStart(2,"0")}`);
  return res;
};

const fmtMonth = s => {
  const [y,m] = s.split("-");
  return `${y}年${parseInt(m)}月`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const inputStyle = {
  background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)",
  borderRadius:8, padding:"8px 12px", color:"#f9fafb", fontSize:13,
  outline:"none", width:"100%", boxSizing:"border-box",
};

const Btn = ({ children, onClick, active, color, small }) => (
  <button onClick={onClick} style={{
    background: active ? (color||"#34d399") : "transparent",
    color: active ? "#0a0a0a" : "#9ca3af",
    border: `1px solid ${active ? (color||"#34d399") : "rgba(255,255,255,0.15)"}`,
    borderRadius: 8, padding: small ? "4px 12px" : "7px 18px",
    fontSize: small ? 12 : 13, fontWeight: active ? 700 : 400,
    cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
  }}>{children}</button>
);

const Card = ({ children, style }) => (
  <div style={{
    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:14, ...style
  }}>{children}</div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1a1a2e", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"10px 14px", fontSize:12 }}>
      <div style={{ color:"#e5e7eb", marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.fill||p.color, marginBottom:2 }}>
          {p.name}：{(p.value||0).toLocaleString()}円
        </div>
      ))}
    </div>
  );
};

// Entry form
function EntryForm({ card, onSave, onCancel, existing }) {
  const cats = CARD_CATEGORIES[card];
  const [month, setMonth] = useState(existing?.month || "2026-05");
  const [vals, setVals] = useState(() => {
    const init = {};
    cats.forEach(c => init[c] = existing?.categories[c] ?? "");
    return init;
  });
  const [note, setNote] = useState(existing?.note || existing?.otherNote || "");

  const handleSave = () => {
    const categories = {};
    cats.forEach(c => categories[c] = Number(vals[c]) || 0);
    onSave({ id: existing?.id || Date.now().toString(), card, month, categories, otherNote: note });
  };

  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:20, marginBottom:20 }}>
      <div style={{ fontSize:12, color:"#9ca3af", marginBottom:14, letterSpacing:"0.05em" }}>
        {existing ? "編集" : "新しい月を追加"} — {card}
      </div>
      <div style={{ display:"grid", gap:10 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label style={{ width:130, fontSize:12, color:"#d1d5db", flexShrink:0 }}>利用月</label>
          <select value={month} onChange={e=>setMonth(e.target.value)} style={{ ...inputStyle, flex:1 }}>
            {months().map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
          </select>
        </div>
        {cats.map(cat => (
          <div key={cat} style={{ display:"flex", gap:8, alignItems:"center" }}>
            <label style={{ width:130, fontSize:12, color:"#d1d5db", flexShrink:0 }}>{cat}</label>
            <input type="number" placeholder="0" value={vals[cat]}
              onChange={e => setVals(p => ({...p,[cat]:e.target.value}))}
              style={{ ...inputStyle, flex:1 }} />
            <span style={{ fontSize:11, color:"#6b7280" }}>円</span>
          </div>
        ))}
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <label style={{ width:130, fontSize:12, color:"#d1d5db", flexShrink:0 }}>メモ</label>
          <input placeholder="その他メモ（任意）" value={note} onChange={e=>setNote(e.target.value)} style={{ ...inputStyle, flex:1 }} />
        </div>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button onClick={handleSave} style={{ background:"#34d399", color:"#0a0a0a", border:"none", borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>保存</button>
          <button onClick={onCancel} style={{ background:"transparent", color:"#9ca3af", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 20px", fontSize:13, cursor:"pointer" }}>キャンセル</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeCard, setActiveCard] = useState("全カード");
  const [activeView, setActiveView] = useState("月次一覧");
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [formCard, setFormCard] = useState("SMBC");
  const [yearFilter, setYearFilter] = useState("2026");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res?.value) {
          const parsed = JSON.parse(res.value);
          setData(parsed.length ? parsed : SEED);
        } else setData(SEED);
      } catch { setData(SEED); }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (next) => {
    setData(next);
    try { await storage.set(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const handleAdd = (entry) => {
    const next = editEntry
      ? data.map(d => d.id === entry.id ? entry : d)
      : [...data, entry];
    save(next.sort((a,b) => (a.card+a.month).localeCompare(b.card+b.month)));
    setShowForm(false); setEditEntry(null);
  };

  const handleDelete = (id) => {
    if (!confirm("削除しますか？")) return;
    save(data.filter(d => d.id !== id));
  };

  const handleEdit = (entry) => {
    setEditEntry(entry); setFormCard(entry.card); setShowForm(true);
  };

  if (!loaded) return <div style={{ color:"#fff", padding:40, fontFamily:"sans-serif" }}>読み込み中...</div>;

  const years = ["全期間", ...Array.from(new Set(data.map(d => d.month.slice(0,4)))).sort().reverse()];

  const filtered = data.filter(d => {
    if (d.card !== activeCard) return false;
    return true;
  });

  // Monthly totals for chart
  const monthMap = {};
  filtered.forEach(entry => {
    if (!monthMap[entry.month]) monthMap[entry.month] = { month: fmtMonth(entry.month).replace("年","/").replace("月","") };
    const total = totalOf(entry);
    const furusato = furusatoOf(entry);
    monthMap[entry.month]["実支出"] = (monthMap[entry.month]["実支出"] || 0) + total - furusato;
    // category breakdown
    Object.entries(entry.categories).forEach(([cat, val]) => {
      monthMap[entry.month][cat] = (monthMap[entry.month][cat] || 0) + val;
    });
  });
  const chartData = Object.values(monthMap).sort((a,b)=>a.month.localeCompare(b.month));

  // Category breakdown for selected card
  const catMap = {};
  filtered.forEach(entry => {
    Object.entries(entry.categories).forEach(([cat, val]) => {
      catMap[cat] = (catMap[cat] || 0) + val;
    });
  });
  const pieData = Object.entries(catMap).filter(([,v])=>v>0).map(([name,value])=>({name,value}));

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-tracker-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) throw new Error("invalid");
        if (!confirm(`${parsed.length}件のデータをインポートします。現在のデータは上書きされます。よろしいですか？`)) return;
        save(parsed);
        alert("インポート完了しました");
      } catch {
        alert("ファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const views = ["月次一覧", "グラフ", "支出別"];

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#060612 0%,#0d1117 60%,#0a1628 100%)",
      fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
      color:"#f9fafb", padding:"28px 16px",
    }}>
      <div style={{ maxWidth:940, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:"0.2em", color:"#34d399", marginBottom:6, textTransform:"uppercase" }}>Family Finance Tracker</div>
            <h1 style={{ fontSize:24, fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>支出トラッカー</h1>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={handleExport} style={{
              background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)",
              borderRadius:8, padding:"6px 14px", fontSize:12, color:"#34d399", cursor:"pointer",
            }}>⬇ 保存</button>
            <label style={{
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:8, padding:"6px 14px", fontSize:12, color:"#9ca3af", cursor:"pointer",
            }}>
              ⬆ 復元
              <input type="file" accept=".json" onChange={handleImport} style={{ display:"none" }} />
            </label>
          </div>
        </div>

        {/* Card filter */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {CARDS.map(c => (
            <Btn key={c} active={activeCard===c} color={CARD_COLORS[c]} onClick={()=>setActiveCard(c)}>{c}</Btn>
          ))}
        </div>



        {/* View tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {views.map(v => <Btn key={v} small active={activeView===v} onClick={()=>setActiveView(v)}>{v}</Btn>)}
        </div>

        {/* ── 月次一覧 ── */}
        {activeView === "月次一覧" && (
          <div>
            {(showForm && !editEntry) && (
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                  {CARDS.map(c => <Btn key={c} small active={formCard===c} color={CARD_COLORS[c]} onClick={()=>setFormCard(c)}>{c}</Btn>)}
                </div>
                <EntryForm card={formCard} onSave={handleAdd} onCancel={()=>setShowForm(false)} />
              </div>
            )}
            {editEntry && showForm && (
              <EntryForm card={editEntry.card} existing={editEntry} onSave={handleAdd} onCancel={()=>{setShowForm(false);setEditEntry(null);}} />
            )}
            {!showForm && (
              <button onClick={()=>setShowForm(true)} style={{
                background:"transparent", color:"#9ca3af", border:"1px dashed rgba(255,255,255,0.2)",
                borderRadius:10, padding:"10px", marginBottom:20, width:"100%", fontSize:13, cursor:"pointer",
              }}>＋ 月を追加</button>
            )}

            {/* List */}
            <div style={{ display:"grid", gap:10 }}>
              {filtered.sort((a,b)=>b.month.localeCompare(a.month)||a.card.localeCompare(b.card)).map(entry => {
                const total = totalOf(entry);
                const furusato = furusatoOf(entry);
                const cats = CARD_CATEGORIES[entry.card];
                const isOpen = expandedId === entry.id;
                return (
                  <Card key={entry.id} style={{ overflow:"hidden" }}>
                    {/* Summary row - tappable */}
                    <div
                      onClick={() => setExpandedId(isOpen ? null : entry.id)}
                      style={{ padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}
                    >
                      <div style={{ fontSize:13, color:"#e5e7eb", minWidth:90 }}>{fmtMonth(entry.month)}</div>
                      <span style={{ background:CARD_COLORS[entry.card]+"22", color:CARD_COLORS[entry.card], borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{entry.card}</span>
                      <div style={{ marginLeft:"auto", display:"flex", gap:16, alignItems:"center" }}>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#f9fafb" }}>{fmt(total)}</div>
                          {furusato > 0 && <div style={{ fontSize:11, color:"#34d399" }}>実支出 {fmt(total-furusato)}</div>}
                        </div>
                        <div style={{ fontSize:14, color:"#6b7280", transition:"transform 0.2s", transform: isOpen?"rotate(90deg)":"rotate(0deg)" }}>›</div>
                      </div>
                    </div>

                    {/* Detail panel */}
                    {isOpen && (
                      <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", padding:"14px 16px", background:"rgba(255,255,255,0.02)" }}>
                        {/* Category breakdown */}
                        <div style={{ display:"grid", gap:8, marginBottom:14 }}>
                          {cats.map((c, i) => {
                            const val = entry.categories[c] || 0;
                            return (
                              <div key={c} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                  <div style={{ width:3, height:16, background:(CARD_CAT_COLORS[entry.card]||CAT_COLORS)[i%(CARD_CAT_COLORS[entry.card]||CAT_COLORS).length], borderRadius:2 }} />
                                  <span style={{ fontSize:12, color: val > 0 ? "#d1d5db" : "#4b5563" }}>{c}</span>
                                </div>
                                <span style={{ fontSize:13, fontWeight: val > 0 ? 600 : 400, color: val > 0 ? "#f9fafb" : "#4b5563" }}>{fmt(val)}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Note */}
                        {entry.otherNote && (
                          <div style={{ fontSize:11, color:"#6b7280", borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:10, marginBottom:12 }}>
                            📝 {entry.otherNote}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                          <button onClick={(e)=>{e.stopPropagation();handleEdit(entry);}} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:"#9ca3af", cursor:"pointer", borderRadius:6, padding:"5px 14px", fontSize:12 }}>編集</button>
                          <button onClick={(e)=>{e.stopPropagation();handleDelete(entry.id);}} style={{ background:"rgba(248,113,113,0.1)", border:"none", color:"#f87171", cursor:"pointer", borderRadius:6, padding:"5px 14px", fontSize:12 }}>削除</button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── グラフ ── */}
        {activeView === "グラフ" && (
          <div style={{ display:"grid", gap:20 }}>
            <Card style={{ padding:"20px 8px 12px" }}>
              <div style={{ fontSize:11, color:"#6b7280", padding:"0 12px", marginBottom:12, letterSpacing:"0.05em" }}>月別実支出推移</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{top:4,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{fill:"#9ca3af",fontSize:11}} />
                  <YAxis tick={{fill:"#9ca3af",fontSize:10}} tickFormatter={v=>(v/10000)+"万"} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="実支出" stroke="#34d399" strokeWidth={2.5} dot={{fill:"#34d399",r:4}} />
                  {activeCard==="全カード" && CARDS.map((c,i) => (
                    <Line key={c} type="monotone" dataKey={c+"_total"} name={c} stroke={CARD_COLORS[c]} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display:"grid", gap:20 }}>
              <Card style={{ padding:"20px 8px 12px" }}>
                <div style={{ fontSize:11, color:"#6b7280", padding:"0 12px", marginBottom:12, letterSpacing:"0.05em" }}>月別カテゴリ別推移</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{top:4,right:16,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{fill:"#9ca3af",fontSize:10}} />
                    <YAxis tick={{fill:"#9ca3af",fontSize:10}} tickFormatter={v=>(v/10000)+"万"} />
                    <Tooltip content={<CustomTooltip />} />
                    {(CARD_CATEGORIES[activeCard]||[]).map((c,i) => {
                      const colors = CARD_CAT_COLORS[activeCard]||CAT_COLORS;
                      return <Bar key={c} dataKey={c} name={c} stackId="a" fill={colors[i%colors.length]} />;
                    })}
                  </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 16px", padding:"12px 16px 4px" }}>
                  {(CARD_CATEGORIES[activeCard]||[]).map((c,i) => {
                    const colors = CARD_CAT_COLORS[activeCard]||CAT_COLORS;
                    return (
                      <div key={c} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:colors[i%colors.length], flexShrink:0 }} />
                        <span style={{ fontSize:11, color:"#9ca3af" }}>{c}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── 支出別 ── */}
        {activeView === "支出別" && (() => {
          const cats = CARD_CATEGORIES[activeCard] || [];
          const sortedMonths = [...new Set(filtered.map(d => d.month))].sort().reverse();
          const latestMonth = sortedMonths[0];
          const prevMonth = sortedMonths[1];

          const getEntry = (month) => filtered.find(d => d.month === month);
          const latest = getEntry(latestMonth);
          const prev = getEntry(prevMonth);

          if (!latest) return <div style={{ color:"#6b7280", fontSize:13 }}>データがありません</div>;

          return (
            <div style={{ display:"grid", gap:12 }}>
              {/* Month headers */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, alignItems:"center" }}>
                <div style={{ fontSize:11, color:"#6b7280" }}>カテゴリ</div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{prev ? fmtMonth(prevMonth) : "—"}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, color:"#34d399", fontWeight:700 }}>{fmtMonth(latestMonth)}（直近）</div>
                </div>
              </div>

              {/* Category rows */}
              {cats.map((cat, i) => {
                const latestVal = latest?.categories[cat] || 0;
                const prevVal = prev?.categories[cat] || 0;
                const diff = latestVal - prevVal;
                const color = (CARD_CAT_COLORS[activeCard]||CAT_COLORS)[i % (CARD_CAT_COLORS[activeCard]||CAT_COLORS).length];
                return (
                  <Card key={cat} style={{ padding:"12px 16px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:3, height:32, background:color, borderRadius:2, flexShrink:0 }} />
                        <div style={{ fontSize:12, color:"#9ca3af" }}>{cat}</div>
                      </div>
                      <div style={{ textAlign:"right", fontSize:14, color:"#6b7280" }}>
                        {prev ? fmt(prevVal) : "—"}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:15, fontWeight:700, color:"#f9fafb" }}>{fmt(latestVal)}</div>
                        {prev && diff !== 0 && (
                          <div style={{ fontSize:11, color: diff > 0 ? "#f87171" : "#34d399", marginTop:2 }}>
                            {diff > 0 ? "▲" : "▼"}{Math.abs(diff).toLocaleString()}円
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Total row */}
              <Card style={{ padding:"12px 16px", border:"1px solid rgba(255,255,255,0.15)" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, alignItems:"center" }}>
                  <div style={{ fontSize:12, color:"#9ca3af", fontWeight:700 }}>合計</div>
                  <div style={{ textAlign:"right", fontSize:14, color:"#9ca3af", fontWeight:700 }}>
                    {prev ? fmt(totalOf(prev)) : "—"}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:16, fontWeight:800, color:"#f9fafb" }}>{fmt(totalOf(latest))}</div>
                    {prev && (() => {
                      const d = totalOf(latest) - totalOf(prev);
                      return d !== 0 ? (
                        <div style={{ fontSize:11, color: d > 0 ? "#f87171" : "#34d399", marginTop:2 }}>
                          {d > 0 ? "▲" : "▼"}{Math.abs(d).toLocaleString()}円
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        <div style={{ marginTop:20, fontSize:11, color:"#374151", textAlign:"right" }}>
          データはブラウザに自動保存 · {data.length}件
        </div>
      </div>
    </div>
  );
}
