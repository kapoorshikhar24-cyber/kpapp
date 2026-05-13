/**
 * KharchaApp.jsx
 * Drop this file into your Next.js /app or /pages directory.
 * No extra dependencies needed — pure React + inline styles.
 * localStorage is used for persistence (works offline in PWA).
 *
 * Usage in Next.js:
 *   import KharchaApp from "@/components/KharchaApp";
 *   export default function Page() { return <KharchaApp />; }
 */

"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "food",     label: "Food",     icon: "🍱", color: "#EF9F27", bg: "#251E13" },
  { id: "travel",   label: "Travel",   icon: "✈️",  color: "#378ADD", bg: "#131C25" },
  { id: "fuel",     label: "Fuel",     icon: "⛽",  color: "#D85A30", bg: "#251813" },
  { id: "shopping", label: "Shopping", icon: "🛍️",  color: "#7F77DD", bg: "#1C1325" },
  { id: "lodging",  label: "Lodging",  icon: "🏨",  color: "#1D9E75", bg: "#13251C" },
  { id: "bills",    label: "Bills",    icon: "🧾",  color: "#8BBF3A", bg: "#1F2513" },
];

const PRESETS = [50, 100, 200, 500, 1000];

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const SCREENS = ["lock", "cat", "amt", "dash", "hist", "set"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weekExpenses(expenses) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Monday = 0
  const totals = Array(7).fill(0);
  expenses.forEach((e) => {
    const d = new Date(e.createdAt);
    const diff = Math.floor((now - d) / 86400000);
    const idx = dow - diff;
    if (idx >= 0 && idx < 7) totals[idx] += e.amount;
  });
  return totals;
}

function groupByDate(expenses) {
  const groups = {};
  expenses.forEach((e) => {
    const key = e.createdAt.slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

function dateLabel(key) {
  const d = new Date(key);
  const today = todayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function loadStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={S.statusBar}>
      <span style={S.statusTime}>{time}</span>
      <div style={S.notch} />
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ color: "#55556A", fontSize: 13 }}>▲</span>
        <span style={{ color: "#55556A", fontSize: 13 }}>▮</span>
      </div>
    </div>
  );
}

function HomeBar({ onGo }) {
  return (
    <div style={S.homeBar}>
      <div style={S.homeIndicator} />
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      style={{
        ...S.toggle,
        background: on ? "#EF9F27" : "#2E2E3E",
      }}
    >
      <div style={{ ...S.knob, left: on ? 18 : 2 }} />
    </button>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data, 1);
  const todayIdx = (new Date().getDay() + 6) % 7;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 72 }}>
        {data.map((v, i) => {
          const h = v > 0 ? Math.max(6, Math.round((v / max) * 68)) : 4;
          const isToday = i === todayIdx;
          return (
            <div
              key={i}
              title={v > 0 ? fmt(v) : "No data"}
              style={{
                flex: 1,
                height: h,
                background: isToday ? "#EF9F27" : v > 0 ? "#252538" : "#1A1A24",
                borderRadius: "3px 3px 0 0",
                alignSelf: "flex-end",
                cursor: "pointer",
                transition: "height 0.4s",
                border: isToday ? "none" : "0.5px solid #2E2E3E",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              color: i === todayIdx ? "#EF9F27" : "#44445A",
            }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Expense Row ──────────────────────────────────────────────────────────────
function ExpenseRow({ expense, onDelete }) {
  const [swiped, setSwiped] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === expense.category) || CATEGORIES[0];
  return (
    <div
      style={{
        ...S.expRow,
        transform: swiped ? "translateX(-70px)" : "translateX(0)",
        transition: "transform 0.2s",
      }}
      onClick={() => setSwiped((s) => !s)}
    >
      <div style={{ ...S.picon, background: cat.bg }}>
        <span style={{ fontSize: 18 }}>{cat.icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#D8D6CE", fontSize: 13 }}>{expense.note || cat.label}</div>
        <div style={{ color: "#44445A", fontSize: 11, marginTop: 2 }}>
          {cat.label} •{" "}
          {new Date(expense.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      <div style={{ color: "#F0EEE5", fontSize: 13, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
        {fmt(expense.amount)}
      </div>
      {swiped && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(expense.id);
          }}
          style={S.deleteSlide}
          aria-label="Delete expense"
        >
          🗑️
        </button>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function KharchaApp() {
  // ── State ──
  const [screen, setScreen] = useState("lock");
  const [expenses, setExpenses] = useState(() =>
    loadStorage("kharcha_expenses", [])
  );
  const [settings, setSettings] = useState(() =>
    loadStorage("kharcha_settings", {
      biometric: true,
      pin: true,
      voice: true,
      haptic: true,
      offline: true,
      dailyBudget: 2000,
      userName: "User",
      userEmail: "",
    })
  );

  // Amount screen state
  const [selCat, setSelCat] = useState(CATEGORIES[0]);
  const [amtVal, setAmtVal] = useState(150);
  const [note, setNote] = useState("");

  // Dashboard period
  const [period, setPeriod] = useState("today");

  // History filter
  const [histCat, setHistCat] = useState("all");
  const [histSearch, setHistSearch] = useState("");

  // Voice
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceStep, setVoiceStep] = useState(0); // 0=listening 1=result
  const voiceRef = useRef(null);

  // ── Persist ──
  useEffect(() => saveStorage("kharcha_expenses", expenses), [expenses]);
  useEffect(() => saveStorage("kharcha_settings", settings), [settings]);

  // ── Navigation ──
  const go = useCallback((s) => {
    setScreen(s);
    setVoiceOpen(false);
  }, []);

  // ── Expense helpers ──
  const addExpense = useCallback(() => {
    const e = {
      id: Date.now().toString(),
      category: selCat.id,
      amount: amtVal,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [e, ...prev]);
    setNote("");
    setAmtVal(150);
    go("dash");
  }, [selCat, amtVal, note, go]);

  const deleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Budget ──
  const todayTotal = expenses
    .filter((e) => e.createdAt.startsWith(todayKey()))
    .reduce((s, e) => s + e.amount, 0);

  const weekTotal = expenses
    .filter((e) => {
      const d = new Date(e.createdAt);
      return Date.now() - d < 7 * 86400000;
    })
    .reduce((s, e) => s + e.amount, 0);

  const monthTotal = expenses
    .filter((e) => {
      const d = new Date(e.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);

  const periodTotal = period === "today" ? todayTotal : period === "week" ? weekTotal : monthTotal;
  const periodCount =
    period === "today"
      ? expenses.filter((e) => e.createdAt.startsWith(todayKey())).length
      : period === "week"
      ? expenses.filter((e) => Date.now() - new Date(e.createdAt) < 7 * 86400000).length
      : expenses.filter((e) => {
          const d = new Date(e.createdAt);
          const n = new Date();
          return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
        }).length;

  const budgetPct = Math.min(100, Math.round((todayTotal / settings.dailyBudget) * 100));

  // ── Weekly chart data ──
  const barData = weekExpenses(expenses);

  // ── Category totals ──
  function catTotal(catId) {
    return expenses
      .filter((e) => {
        const d = new Date(e.createdAt);
        const n = new Date();
        return e.category === catId && d.getMonth() === n.getMonth();
      })
      .reduce((s, e) => s + e.amount, 0);
  }

  const topCats = CATEGORIES.map((c) => ({ ...c, total: catTotal(c.id) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const maxCatTotal = Math.max(...topCats.map((c) => c.total), 1);

  // ── Filtered history ──
  const filteredExpenses = expenses.filter((e) => {
    const catMatch = histCat === "all" || e.category === histCat;
    const searchMatch =
      !histSearch ||
      (e.note || "").toLowerCase().includes(histSearch.toLowerCase()) ||
      e.category.includes(histSearch.toLowerCase());
    return catMatch && searchMatch;
  });

  const groupedHistory = groupByDate(filteredExpenses);
  const historyDates = Object.keys(groupedHistory).sort().reverse();

  // ── Voice simulation ──
  function startVoice() {
    setVoiceStep(0);
    setVoiceOpen(true);
    setTimeout(() => setVoiceStep(1), 2000);
  }

  function confirmVoice() {
    const e = {
      id: Date.now().toString(),
      category: "food",
      amount: 200,
      note: "Sharma dhaba",
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [e, ...prev]);
    setVoiceOpen(false);
    go("dash");
  }

  // ─── SCREENS ────────────────────────────────────────────────────────────────

  function renderLock() {
    return (
      <div style={S.screen}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#44445A", marginBottom: 8, textTransform: "uppercase" }}>
            Expense Tracker
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, color: "#F0EEE5", letterSpacing: -1, fontFamily: "monospace" }}>
            KHARCHA
          </div>
        </div>

        <button
          onClick={() => go("cat")}
          aria-label="Unlock with fingerprint"
          style={S.biometricBtn}
        >
          <span style={{ fontSize: 40 }}>👆</span>
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#888898", fontSize: 14 }}>Touch to unlock</div>
          <div style={{ color: "#44445A", fontSize: 12, marginTop: 4 }}>or use PIN</div>
        </div>

        {/* PIN dots */}
        <div style={{ display: "flex", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={S.pinDot}>
              <span style={{ color: "#555565", fontSize: 18 }}>•</span>
            </div>
          ))}
        </div>

        <div style={S.lastSession}>
          <span style={{ color: "#44445A", fontSize: 11 }}>
            {expenses.length > 0
              ? `Last: ${expenses.length} expenses • ${fmt(expenses.reduce((s, e) => s + e.amount, 0))}`
              : "No expenses yet"}
          </span>
        </div>
      </div>
    );
  }

  function renderCat() {
    return (
      <div style={{ ...S.screenPad, gap: 12 }}>
        {/* Header */}
        <div style={S.row}>
          <div>
            <div style={S.label}>Good {greeting()} 👋</div>
            <div style={S.heading}>New Expense</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={startVoice} style={S.iconBtn} aria-label="Voice logging">
              <span style={{ fontSize: 16 }}>🎙️</span>
            </button>
            <button onClick={() => go("dash")} style={S.iconBtn} aria-label="Close">
              <span style={{ color: "#555565", fontSize: 16 }}>✕</span>
            </button>
          </div>
        </div>

        {/* Today banner */}
        <div style={S.todayBanner}>
          <div>
            <div style={S.label}>Today's total</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: "#EF9F27", fontFamily: "monospace" }}>
              {fmt(todayTotal)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={S.label}>
              {expenses.filter((e) => e.createdAt.startsWith(todayKey())).length} expenses
            </div>
            <div style={S.label}>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
          </div>
        </div>

        {/* Voice overlay */}
        {voiceOpen && (
          <div style={S.voiceBox}>
            <div style={S.label}>Say something like</div>
            <div style={{ fontSize: 13, color: "#D0CEC8", fontStyle: "italic", textAlign: "center" }}>
              "Spent 200 on food at Sharma dhaba"
            </div>
            <div
              style={{
                ...S.voiceRing,
                background: voiceStep === 0 ? "#171720" : "#251E13",
              }}
              onClick={() => voiceStep === 0 && setVoiceStep(1)}
            >
              <span style={{ fontSize: 28 }}>🎙️</span>
            </div>
            <div style={{ fontSize: 12, color: "#EF9F27" }}>
              {voiceStep === 0 ? "Listening…" : "Done — tap Confirm"}
            </div>
            {voiceStep === 1 && (
              <>
                <div style={S.voiceResult}>
                  <div style={S.label}>Detected</div>
                  <div style={{ color: "#EF9F27", fontSize: 15, fontWeight: 500 }}>₹200 — Food</div>
                  <div style={{ color: "#C0BEB8", fontSize: 12, marginTop: 2 }}>"Sharma dhaba"</div>
                </div>
                <button onClick={confirmVoice} style={S.confirmBtn}>
                  Confirm &amp; Save
                </button>
              </>
            )}
            <button
              onClick={() => setVoiceOpen(false)}
              style={{ background: "none", border: "none", color: "#44445A", cursor: "pointer", fontSize: 12 }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Category grid */}
        {!voiceOpen && (
          <div style={S.catGrid}>
            {CATEGORIES.map((cat) => {
              const total = catTotal(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelCat(cat);
                    go("amt");
                  }}
                  style={{
                    ...S.catBtn,
                    borderColor: selCat.id === cat.id ? cat.color : "#2E2E3E",
                    background: selCat.id === cat.id ? cat.bg : "#1A1A24",
                  }}
                >
                  <div style={{ ...S.picon, background: cat.bg }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  </div>
                  <div style={{ color: "#E0DEDB", fontSize: 13, fontWeight: 500 }}>{cat.label}</div>
                  {total > 0 && (
                    <div style={{ color: "#44445A", fontSize: 10 }}>{fmt(total)} this month</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderAmt() {
    return (
      <div style={{ ...S.screenPad, gap: 12 }}>
        {/* Header */}
        <div style={S.row}>
          <button onClick={() => go("cat")} style={S.iconBtn} aria-label="Back">
            <span style={{ color: "#888", fontSize: 16 }}>←</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...S.picon, background: selCat.bg }}>
              <span style={{ fontSize: 16 }}>{selCat.icon}</span>
            </div>
            <span style={{ color: "#F0EEE5", fontSize: 15, fontWeight: 500 }}>{selCat.label}</span>
          </div>
          <div
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 10,
              background: budgetPct > 90 ? "#251813" : "#1A2212",
              color: budgetPct > 90 ? "#D85A30" : "#8BBF3A",
            }}
          >
            {fmt(Math.max(0, settings.dailyBudget - todayTotal))} left
          </div>
        </div>

        {/* Note */}
        <div style={S.card}>
          <div style={S.label}>Note (optional)</div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lunch, Petrol, Hotel…"
            style={S.noteInput}
          />
        </div>

        {/* Amount wheel */}
        <div style={{ ...S.card, alignItems: "center", gap: 10 }}>
          <div style={S.label}>Amount (₹)</div>
          <button className="adj" onClick={() => setAmtVal((v) => v + 50)} style={S.adjBtn} aria-label="Increase by 50">▲</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, fontWeight: 500, color: "#F0EEE5", fontFamily: "monospace", letterSpacing: -2 }}>
              ₹{amtVal.toLocaleString("en-IN")}
            </div>
          </div>
          <button onClick={() => setAmtVal((v) => Math.max(1, v - 50))} style={S.adjBtn} aria-label="Decrease by 50">▼</button>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
            {[-10, -1, 1, 10].map((d) => (
              <button key={d} onClick={() => setAmtVal((v) => Math.max(1, v + d))} style={S.fineBtn}>
                {d > 0 ? "+" : ""}{d}
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div>
          <div style={{ ...S.label, marginBottom: 6 }}>Quick presets</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setAmtVal(p)} style={S.presetBtn}>
                {fmt(p)}
              </button>
            ))}
          </div>
        </div>

        <button onClick={addExpense} style={{ ...S.primaryBtn, marginTop: "auto" }}>
          Save Expense
        </button>
      </div>
    );
  }

  function renderDash() {
    return (
      <div style={{ ...S.screenPad, gap: 10, overflowY: "auto" }}>
        {/* Header */}
        <div style={S.row}>
          <div>
            <div style={S.label}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
            <div style={S.heading}>Overview</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => go("hist")} style={S.iconBtn} aria-label="History">
              <span style={{ fontSize: 16 }}>📋</span>
            </button>
            <button onClick={() => go("set")} style={S.iconBtn} aria-label="Settings">
              <span style={{ fontSize: 16 }}>⚙️</span>
            </button>
          </div>
        </div>

        {/* Period tabs */}
        <div style={S.tabRow}>
          {["today", "week", "month"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                ...S.tabBtn,
                background: period === p ? "#EF9F27" : "transparent",
                color: period === p ? "#412402" : "#44445A",
                fontWeight: period === p ? 600 : 400,
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Total card */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={S.label}>Total spent</div>
              <div style={{ fontSize: 38, fontWeight: 500, color: "#F0EEE5", fontFamily: "monospace", letterSpacing: -1 }}>
                {fmt(periodTotal)}
              </div>
              <div style={{ color: "#44445A", fontSize: 12, marginTop: 4 }}>{periodCount} expenses</div>
            </div>
            {period === "today" && (
              <div style={{ textAlign: "right" }}>
                <div style={S.label}>Daily Budget</div>
                <div style={{ color: "#EF9F27", fontSize: 18, fontWeight: 500, fontFamily: "monospace" }}>
                  {fmt(settings.dailyBudget)}
                </div>
                <div style={{ width: 80, height: 5, background: "#22222C", borderRadius: 3, marginTop: 6 }}>
                  <div
                    style={{
                      width: `${budgetPct}%`,
                      height: "100%",
                      background: budgetPct > 90 ? "#D85A30" : "#EF9F27",
                      borderRadius: 3,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <div style={{ color: "#44445A", fontSize: 11, marginTop: 3 }}>{budgetPct}% used</div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly chart */}
        <div style={S.card}>
          <div style={{ color: "#666678", fontSize: 12, marginBottom: 10 }}>This week</div>
          <BarChart data={barData} />
        </div>

        {/* Category breakdown */}
        {topCats.length > 0 && (
          <div style={S.card}>
            <div style={{ color: "#666678", fontSize: 12, marginBottom: 10 }}>By category</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topCats.map((c) => (
                <div key={c.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{c.icon}</span>
                      <span style={{ color: "#C8C6C0", fontSize: 12 }}>{c.label}</span>
                    </div>
                    <span style={{ color: "#C8C6C0", fontSize: 12, fontFamily: "monospace" }}>{fmt(c.total)}</span>
                  </div>
                  <div style={{ height: 5, background: "#22222C", borderRadius: 3 }}>
                    <div
                      style={{
                        width: `${Math.round((c.total / maxCatTotal) * 100)}%`,
                        height: "100%",
                        background: c.color,
                        borderRadius: 3,
                        transition: "width 0.4s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent */}
        {expenses.length > 0 && (
          <>
            <div style={{ ...S.label, marginTop: 4 }}>Recent</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {expenses.slice(0, 3).map((e) => (
                <ExpenseRow key={e.id} expense={e} onDelete={deleteExpense} />
              ))}
            </div>
          </>
        )}

        {/* FAB */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <button onClick={() => go("cat")} style={S.fab}>
            <span style={{ color: "#412402", fontSize: 16 }}>＋</span>
            <span style={{ color: "#412402", fontSize: 14, fontWeight: 500 }}>Add expense</span>
          </button>
        </div>

        {expenses.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#44445A", fontSize: 13 }}>
            No expenses yet. Tap Add expense to start!
          </div>
        )}
      </div>
    );
  }

  function renderHist() {
    return (
      <div style={{ ...S.screenPad, gap: 10, overflowY: "auto" }}>
        {/* Header */}
        <div style={S.row}>
          <button onClick={() => go("dash")} style={S.iconBtn} aria-label="Back">
            <span style={{ color: "#888", fontSize: 16 }}>←</span>
          </button>
          <div style={S.heading}>History</div>
          <div style={{ width: 34 }} />
        </div>

        {/* Search */}
        <div style={{ ...S.card, flexDirection: "row", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#44445A", fontSize: 14 }}>🔍</span>
          <input
            type="text"
            value={histSearch}
            onChange={(e) => setHistSearch(e.target.value)}
            placeholder="Search expenses…"
            style={S.noteInput}
          />
        </div>

        {/* Category filter chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {["all", ...CATEGORIES.map((c) => c.id)].map((f) => {
            const cat = CATEGORIES.find((c) => c.id === f);
            const active = histCat === f;
            return (
              <button
                key={f}
                onClick={() => setHistCat(f)}
                style={{
                  whiteSpace: "nowrap",
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  border: `0.5px solid ${active ? "#EF9F27" : "#2E2E3E"}`,
                  background: active ? "#251E13" : "transparent",
                  color: active ? "#EF9F27" : "#666",
                  cursor: "pointer",
                }}
              >
                {cat ? `${cat.icon} ${cat.label}` : "All"}
              </button>
            );
          })}
        </div>

        {/* Grouped list */}
        {historyDates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#44445A", fontSize: 13 }}>
            No expenses found
          </div>
        ) : (
          historyDates.map((date) => (
            <div key={date}>
              <div style={{ ...S.label, marginBottom: 6 }}>
                {dateLabel(date)} • {fmt(groupedHistory[date].reduce((s, e) => s + e.amount, 0))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {groupedHistory[date].map((e) => (
                  <ExpenseRow key={e.id} expense={e} onDelete={deleteExpense} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  function renderSet() {
    function updateSetting(key, val) {
      setSettings((s) => ({ ...s, [key]: val }));
    }

    return (
      <div style={{ ...S.screenBase, overflowY: "auto" }}>
        {/* Header */}
        <div style={{ ...S.row, padding: "20px 20px 12px", borderBottom: "0.5px solid #28283A" }}>
          <button onClick={() => go("dash")} style={S.iconBtn} aria-label="Back">
            <span style={{ color: "#888", fontSize: 16 }}>←</span>
          </button>
          <div style={S.heading}>Settings</div>
          <div style={{ width: 34 }} />
        </div>

        {/* Profile */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "0.5px solid #1A1A24" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#251E13", border: "1.5px solid #EF9F27", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#EF9F27", fontSize: 16, fontWeight: 500 }}>
              {(settings.userName || "U").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <input
              value={settings.userName}
              onChange={(e) => updateSetting("userName", e.target.value)}
              style={{ ...S.noteInput, fontSize: 14, color: "#F0EEE5", fontWeight: 500, width: "100%" }}
              placeholder="Your name"
            />
            <input
              value={settings.userEmail}
              onChange={(e) => updateSetting("userEmail", e.target.value)}
              style={{ ...S.noteInput, fontSize: 12, color: "#44445A", marginTop: 2, width: "100%" }}
              placeholder="Email"
              type="email"
            />
          </div>
          <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 10, background: "#1D9E7520", color: "#1D9E75", border: "0.5px solid #1D9E7560" }}>
            {expenses.length} saved
          </span>
        </div>

        {/* Security */}
        <SectionLabel>Security</SectionLabel>
        <TogRow label="Biometric unlock" sub="Fingerprint / Face ID" val={settings.biometric} onChange={(v) => updateSetting("biometric", v)} />
        <TogRow label="PIN fallback" sub="4-digit backup PIN" val={settings.pin} onChange={(v) => updateSetting("pin", v)} />

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <TogRow label="Voice logging" sub="AI expense detection" val={settings.voice} onChange={(v) => updateSetting("voice", v)} />
        <TogRow label="Haptic feedback" sub="Vibrate on amount change" val={settings.haptic} onChange={(v) => updateSetting("haptic", v)} />
        <TogRow label="Offline mode" sub="Cache entries locally" val={settings.offline} onChange={(v) => updateSetting("offline", v)} />

        {/* Budget */}
        <SectionLabel>Budget</SectionLabel>
        <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#D8D6CE", fontSize: 13 }}>Daily budget</div>
            <div style={{ color: "#EF9F27", fontSize: 13, fontFamily: "monospace", fontWeight: 500 }}>
              {fmt(settings.dailyBudget)}
            </div>
          </div>
          <input
            type="range"
            min="500"
            max="20000"
            step="500"
            value={settings.dailyBudget}
            onChange={(e) => updateSetting("dailyBudget", parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#EF9F27" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={S.label}>₹500</span>
            <span style={S.label}>₹20,000</span>
          </div>
        </div>

        {/* Data */}
        <SectionLabel>Data</SectionLabel>
        <div style={{ padding: "0 20px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...S.card, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#D8D6CE", fontSize: 13 }}>Total expenses</div>
              <div style={{ color: "#44445A", fontSize: 11 }}>{fmt(expenses.reduce((s, e) => s + e.amount, 0))} all time</div>
            </div>
            <span style={{ color: "#EF9F27", fontSize: 20, fontWeight: 600 }}>{expenses.length}</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Clear all expense data?")) setExpenses([]);
            }}
            style={{ width: "100%", padding: 12, background: "#A32D2D20", border: "0.5px solid #A32D2D60", borderRadius: 10, color: "#E24B4A", fontSize: 13, cursor: "pointer" }}
          >
            Clear all data
          </button>
        </div>

        <div style={{ height: 20 }} />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <div style={S.phone}>
        <StatusBar />
        <div style={S.body}>
          {screen === "lock" && renderLock()}
          {screen === "cat" && renderCat()}
          {screen === "amt" && renderAmt()}
          {screen === "dash" && renderDash()}
          {screen === "hist" && renderHist()}
          {screen === "set" && renderSet()}
        </div>
        <HomeBar />
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ padding: "12px 20px 6px", color: "#44445A", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
      {children}
    </div>
  );
}

function TogRow({ label, sub, val, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "0.5px solid #1A1A24" }}>
      <div>
        <div style={{ color: "#D8D6CE", fontSize: 13 }}>{label}</div>
        <div style={{ color: "#44445A", fontSize: 11 }}>{sub}</div>
      </div>
      <Toggle on={val} onToggle={() => onChange(!val)} />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  root: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#060608",
    padding: 16,
  },
  phone: {
    width: 360,
    maxWidth: "100%",
    background: "#0C0C12",
    borderRadius: 40,
    border: "2px solid #28283A",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 720,
    boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
  },
  statusBar: {
    background: "#0C0C12",
    padding: "14px 22px 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  statusTime: { color: "#D8D6CE", fontSize: 12, fontWeight: 500, fontFamily: "monospace" },
  notch: { width: 80, height: 14, background: "#18181F", borderRadius: 20, border: "0.5px solid #28283A" },
  homeBar: { padding: "8px 0 14px", display: "flex", justifyContent: "center", flexShrink: 0, background: "#0C0C12" },
  homeIndicator: { width: 100, height: 4, background: "#28283A", borderRadius: 2 },
  body: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },
  screen: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 24,
    background: "#0C0C12",
  },
  screenPad: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 20,
    background: "#0C0C12",
    overflowY: "auto",
  },
  screenBase: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#0C0C12",
  },
  biometricBtn: {
    width: 84,
    height: 84,
    borderRadius: "50%",
    background: "#171720",
    border: "1.5px solid #EF9F27",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 0.1s",
  },
  pinDot: {
    width: 44,
    height: 50,
    background: "#16161F",
    borderRadius: 10,
    border: "0.5px solid #28283A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lastSession: {
    padding: "10px 20px",
    background: "#16161F",
    borderRadius: 20,
    border: "0.5px solid #28283A",
  },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#44445A", fontSize: 11 },
  heading: { color: "#F0EEE5", fontSize: 18, fontWeight: 500 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#16161F",
    border: "0.5px solid #28283A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  todayBanner: {
    background: "#16161F",
    borderRadius: 12,
    padding: "14px 16px",
    border: "0.5px solid #28283A",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voiceBox: {
    background: "#0D0D17",
    borderRadius: 16,
    border: "0.5px solid #EF9F27",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  voiceRing: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "2px solid #EF9F27",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  voiceResult: {
    background: "#16161F",
    borderRadius: 10,
    padding: "10px 14px",
    width: "100%",
    textAlign: "center",
  },
  confirmBtn: {
    width: "100%",
    padding: "11px",
    background: "#EF9F27",
    border: "none",
    borderRadius: 10,
    color: "#412402",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 9,
    flex: 1,
  },
  catBtn: {
    background: "#1A1A24",
    border: "0.5px solid #2E2E3E",
    borderRadius: 14,
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    textAlign: "left",
  },
  picon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  card: {
    background: "#16161F",
    borderRadius: 14,
    padding: 14,
    border: "0.5px solid #28283A",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  noteInput: {
    background: "transparent",
    border: "none",
    color: "#D0CEC8",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
  },
  adjBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#252530",
    border: "0.5px solid #3A3A4A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#888",
    fontSize: 14,
  },
  fineBtn: {
    padding: "5px 11px",
    borderRadius: 20,
    background: "#252530",
    border: "0.5px solid #3A3A4A",
    color: "#888",
    fontSize: 12,
    cursor: "pointer",
  },
  presetBtn: {
    padding: "7px 14px",
    borderRadius: 20,
    background: "#1C1C28",
    border: "0.5px solid #2E2E3E",
    color: "#C8C6C0",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "monospace",
  },
  primaryBtn: {
    width: "100%",
    padding: 15,
    background: "#EF9F27",
    border: "none",
    borderRadius: 14,
    color: "#412402",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  tabRow: {
    display: "flex",
    background: "#16161F",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    padding: "7px",
    borderRadius: 8,
    border: "none",
    fontSize: 12,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  },
  expRow: {
    background: "#16161F",
    borderRadius: 12,
    padding: "11px 14px",
    border: "0.5px solid #28283A",
    display: "flex",
    alignItems: "center",
    gap: 11,
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
  },
  deleteSlide: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    background: "#A32D2D",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 20,
  },
  fab: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#EF9F27",
    padding: "12px 28px",
    borderRadius: 30,
    border: "none",
    cursor: "pointer",
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    border: "none",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  knob: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    position: "absolute",
    top: 2,
    transition: "left 0.2s",
  },
};
