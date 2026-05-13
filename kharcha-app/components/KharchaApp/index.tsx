"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { S } from "./Styles";
import { CATEGORIES, PRESETS } from "./Constants";
import { Expense, Settings, Category } from "./Types";
import {
  fmt,
  todayKey,
  weekExpenses,
  groupByDate,
  dateLabel,
  loadStorage,
  saveStorage,
  greeting,
} from "./Utils";
import {
  StatusBar,
  HomeBar,
  Toggle,
  BarChart,
  ExpenseRow,
} from "./SubComponents";

export default function KharchaApp() {
  // ── State ──
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState("lock");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>({
    biometric: true,
    pin: true,
    voice: true,
    haptic: true,
    offline: true,
    dailyBudget: 2000,
    userName: "User",
    userEmail: "",
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    setExpenses(loadStorage("kharcha_expenses", []));
    setSettings(loadStorage("kharcha_settings", {
      biometric: true,
      pin: true,
      voice: true,
      haptic: true,
      offline: true,
      dailyBudget: 2000,
      userName: "User",
      userEmail: "",
    }));
    setMounted(true);
  }, []);

  // Amount screen state
  const [selCat, setSelCat] = useState<Category>(CATEGORIES[0]);
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

  // ── Persist ──
  useEffect(() => {
    if (mounted) saveStorage("kharcha_expenses", expenses);
  }, [expenses, mounted]);

  useEffect(() => {
    if (mounted) saveStorage("kharcha_settings", settings);
  }, [settings, mounted]);

  // ── Navigation ──
  const go = useCallback((s: string) => {
    setScreen(s);
    setVoiceOpen(false);
  }, []);

  // ── Expense helpers ──
  const addExpense = useCallback(() => {
    const e: Expense = {
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

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  if (!mounted) return null;

  // ── Stats ──
  const todayTotal = expenses
    .filter((e) => e.createdAt.startsWith(todayKey()))
    .reduce((s, e) => s + e.amount, 0);

  const weekTotal = expenses
    .filter((e) => {
      const d = new Date(e.createdAt);
      return Date.now() - d.getTime() < 7 * 86400000;
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
        ? expenses.filter((e) => Date.now() - new Date(e.createdAt).getTime() < 7 * 86400000).length
        : expenses.filter((e) => {
          const d = new Date(e.createdAt);
          const n = new Date();
          return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
        }).length;

  const budgetPct = Math.min(100, Math.round((todayTotal / settings.dailyBudget) * 100));
  const barData = weekExpenses(expenses);

  function catTotal(catId: string) {
    return expenses
      .filter((e) => {
        const d = new Date(e.createdAt);
        const n = new Date();
        return e.category === catId && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
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
    const e: Expense = {
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
          style={S.biometricBtn as any}
        >
          <span style={{ fontSize: 40 }}>👆</span>
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#888898", fontSize: 14 }}>Touch to unlock</div>
          <div style={{ color: "#44445A", fontSize: 12, marginTop: 4 }}>or use PIN</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={S.pinDot as any}>
              <span style={{ color: "#555565", fontSize: 18 }}>•</span>
            </div>
          ))}
        </div>

        <div style={S.lastSession as any}>
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
        <div style={S.row}>
          <div>
            <div style={S.label}>Good {greeting()} 👋</div>
            <div style={S.heading}>New Expense</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={startVoice} style={S.iconBtn as any} aria-label="Voice logging">
              <span style={{ fontSize: 16 }}>🎙️</span>
            </button>
            <button onClick={() => go("dash")} style={S.iconBtn as any} aria-label="Close">
              <span style={{ color: "#555565", fontSize: 16 }}>✕</span>
            </button>
          </div>
        </div>

        <div style={S.todayBanner as any}>
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

        {voiceOpen && (
          <div style={S.voiceBox as any}>
            <div style={S.label}>Say something like</div>
            <div style={{ fontSize: 13, color: "#D0CEC8", fontStyle: "italic", textAlign: "center" }}>
              "Spent 200 on food at Sharma dhaba"
            </div>
            <div
              style={{
                ...S.voiceRing,
                background: voiceStep === 0 ? "#171720" : "#251E13",
              } as any}
              onClick={() => voiceStep === 0 && setVoiceStep(1)}
            >
              <span style={{ fontSize: 28 }}>🎙️</span>
            </div>
            <div style={{ fontSize: 12, color: "#EF9F27" }}>
              {voiceStep === 0 ? "Listening…" : "Done — tap Confirm"}
            </div>
            {voiceStep === 1 && (
              <>
                <div style={S.voiceResult as any}>
                  <div style={S.label}>Detected</div>
                  <div style={{ color: "#EF9F27", fontSize: 15, fontWeight: 500 }}>₹200 — Food</div>
                  <div style={{ color: "#C0BEB8", fontSize: 12, marginTop: 2 }}>"Sharma dhaba"</div>
                </div>
                <button onClick={confirmVoice} style={S.confirmBtn as any}>
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

        {!voiceOpen && (
          <div style={S.catGrid as any}>
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
                  } as any}
                >
                  <div style={{ ...S.picon, background: cat.bg } as any}>
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
        <div style={S.row}>
          <button onClick={() => go("cat")} style={S.iconBtn as any} aria-label="Back">
            <span style={{ color: "#888", fontSize: 16 }}>←</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...S.picon, background: selCat.bg } as any}>
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

        <div style={S.card as any}>
          <div style={S.label}>Note (optional)</div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lunch, Petrol, Hotel…"
            style={S.noteInput as any}
          />
        </div>

        <div style={{ ...S.card, alignItems: "center", gap: 10 } as any}>
          <div style={S.label}>Amount (₹)</div>
          <button onClick={() => setAmtVal((v) => v + 50)} style={S.adjBtn as any} aria-label="Increase by 50">▲</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, fontWeight: 500, color: "#F0EEE5", fontFamily: "monospace", letterSpacing: -2 }}>
              ₹{amtVal.toLocaleString("en-IN")}
            </div>
          </div>
          <button onClick={() => setAmtVal((v) => Math.max(1, v - 50))} style={S.adjBtn as any} aria-label="Decrease by 50">▼</button>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
            {[-10, -1, 1, 10].map((d) => (
              <button key={d} onClick={() => setAmtVal((v) => Math.max(1, v + d))} style={S.fineBtn as any}>
                {d > 0 ? "+" : ""}{d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...S.label, marginBottom: 6 }}>Quick presets</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setAmtVal(p)} style={S.presetBtn as any}>
                {fmt(p)}
              </button>
            ))}
          </div>
        </div>

        <button onClick={addExpense} style={{ ...S.primaryBtn, marginTop: "auto" } as any}>
          Save Expense
        </button>
      </div>
    );
  }

  function renderDash() {
    return (
      <div style={{ ...S.screenPad, gap: 10, overflowY: "auto" }}>
        <div style={S.row}>
          <div>
            <div style={S.label}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
            <div style={S.heading}>Overview</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => go("hist")} style={S.iconBtn as any} aria-label="History">
              <span style={{ fontSize: 16 }}>📋</span>
            </button>
            <button onClick={() => go("set")} style={S.iconBtn as any} aria-label="Settings">
              <span style={{ fontSize: 16 }}>⚙️</span>
            </button>
          </div>
        </div>

        <div style={S.tabRow as any}>
          {["today", "week", "month"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                ...S.tabBtn,
                background: period === p ? "#EF9F27" : "transparent",
                color: period === p ? "#412402" : "#44445A",
                fontWeight: period === p ? 600 : 400,
              } as any}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div style={S.card as any}>
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

        <div style={S.card as any}>
          <div style={{ color: "#666678", fontSize: 12, marginBottom: 10 }}>This week</div>
          <BarChart data={barData} />
        </div>

        {topCats.length > 0 && (
          <div style={S.card as any}>
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

        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <button onClick={() => go("cat")} style={S.fab as any}>
            <span style={{ color: "#412402", fontSize: 16 }}>＋</span>
            <span style={{ color: "#412402", fontSize: 14, fontWeight: 500 }}>Add expense</span>
          </button>
        </div>
      </div>
    );
  }

  function renderHist() {
    return (
      <div style={{ ...S.screenPad, gap: 10, overflowY: "auto" }}>
        <div style={S.row}>
          <button onClick={() => go("dash")} style={S.iconBtn as any} aria-label="Back">
            <span style={{ color: "#888", fontSize: 16 }}>←</span>
          </button>
          <div style={S.heading}>History</div>
          <div style={{ width: 34 }} />
        </div>

        <div style={{ ...S.card, flexDirection: "row", gap: 8, alignItems: "center" } as any}>
          <span style={{ color: "#44445A", fontSize: 14 }}>🔍</span>
          <input
            type="text"
            value={histSearch}
            onChange={(e) => setHistSearch(e.target.value)}
            placeholder="Search expenses…"
            style={S.noteInput as any}
          />
        </div>

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
    return (
      <div style={{ ...S.screenBase, overflowY: "auto" }}>
        <div style={{ ...S.row, padding: "20px 20px 12px", borderBottom: "0.5px solid #28283A" }}>
          <button onClick={() => go("dash")} style={S.iconBtn as any} aria-label="Back">
            <span style={{ color: "#888", fontSize: 16 }}>←</span>
          </button>
          <div style={S.heading}>Settings</div>
          <div style={{ width: 34 }} />
        </div>

        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "0.5px solid #1A1A24" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#251E13", border: "1.5px solid #EF9F27", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#EF9F27", fontSize: 16, fontWeight: 500 }}>
              {(settings.userName || "U").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <input
              value={settings.userName}
              onChange={(e) => setSettings(s => ({ ...s, userName: e.target.value }))}
              style={{ ...S.noteInput, fontSize: 14, color: "#F0EEE5", fontWeight: 500, width: "100%" } as any}
              placeholder="Your name"
            />
            <input
              value={settings.userEmail}
              onChange={(e) => setSettings(s => ({ ...s, userEmail: e.target.value }))}
              style={{ ...S.noteInput, fontSize: 12, color: "#44445A", marginTop: 2, width: "100%" } as any}
              placeholder="Email"
              type="email"
            />
          </div>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={S.label}>Daily budget</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ color: "#EF9F27", fontSize: 20, fontWeight: 600 }}>{fmt(settings.dailyBudget)}</span>
          </div>
          <input
            type="range"
            min="500"
            max="10000"
            step="500"
            value={settings.dailyBudget}
            onChange={(e) => setSettings(s => ({ ...s, dailyBudget: parseInt(e.target.value) }))}
            style={{ width: "100%", marginTop: 12, accentColor: "#EF9F27" }}
          />
        </div>

        <div style={{ padding: "0 20px" }}>
          <button
            onClick={() => { if (confirm("Are you sure?")) setExpenses([]); }}
            style={{ width: "100%", padding: 12, background: "#1A1A24", border: "0.5px solid #28283A", borderRadius: 10, color: "#E24B4A", fontSize: 13, cursor: "pointer" }}
          >
            Clear all data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root as any}>
      <div style={S.phone as any}>
        <StatusBar />
        <div style={S.body as any}>
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
