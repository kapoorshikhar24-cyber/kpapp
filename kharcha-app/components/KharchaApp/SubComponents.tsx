import React, { useState, useEffect } from "react";
import { S } from "./Styles";
import { CATEGORIES, DAY_LABELS } from "./Constants";
import { Expense } from "./Types";

export function StatusBar() {
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

export function HomeBar() {
  return (
    <div style={S.homeBar}>
      <div style={S.homeIndicator} />
    </div>
  );
}

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
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

export function BarChart({ data }: { data: number[] }) {
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
              title={v > 0 ? `₹${v.toLocaleString("en-IN")}` : "No data"}
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

export function ExpenseRow({ expense, onDelete }: { expense: Expense; onDelete: (id: string) => void }) {
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
        ₹{expense.amount.toLocaleString("en-IN")}
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
