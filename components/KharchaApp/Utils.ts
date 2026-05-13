import { Expense, PeriodName } from "./Types";

export function fmt(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function dateLabel(key: string) {
  const today = todayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(key).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStorage<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function filterByPeriod(expenses: Expense[], period: PeriodName) {
  const now = new Date();
  const today = todayKey();

  if (period === "today") {
    return expenses.filter((e) => e.createdAt.startsWith(today));
  }

  if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return expenses.filter((e) => new Date(e.createdAt) >= weekAgo);
  }

  if (period === "month") {
    return expenses.filter((e) => {
      const d = new Date(e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }

  return expenses;
}

export function sumExpenses(expenses: Expense[]) {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function categoryTotal(expenses: Expense[], catId: string) {
  const now = new Date();
  return expenses
    .filter((e) => {
      const d = new Date(e.createdAt);
      return e.category === catId && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);
}

export function weeklyTotals(expenses: Expense[]) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Monday = 0
  const totals = Array(7).fill(0);
  expenses.forEach((e) => {
    const d = new Date(e.createdAt);
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const idx = dow - diff;
    if (idx >= 0 && idx < 7) totals[idx] += e.amount;
  });
  return totals;
}

export function groupByDate(expenses: Expense[]) {
  const groups: { [key: string]: Expense[] } = {};
  expenses.forEach((e) => {
    const key = e.createdAt.slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

export type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function triggerHaptic(type: HapticType = "light") {
  if (typeof window === "undefined" || !window.navigator.vibrate) return;

  const patterns: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 30, 10],
    warning: [40, 60, 40],
    error: [60, 40, 60, 40, 100],
  };

  try {
    window.navigator.vibrate(patterns[type]);
  } catch (e) {
    // Some browsers might block vibration if not triggered by user interaction
    console.warn("Haptic feedback failed", e);
  }
}
