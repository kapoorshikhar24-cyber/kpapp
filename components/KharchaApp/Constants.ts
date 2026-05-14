import { Category, Settings } from "./Types";

export const CATEGORIES: Category[] = [
  { id: "food",     label: "Food",     icon: "food",     color: "#EF9F27", bg: "var(--token-surfaceElevated)" },
  { id: "travel",   label: "Travel",   icon: "travel",   color: "#378ADD", bg: "var(--token-surfaceElevated)" },
  { id: "fuel",     label: "Fuel",     icon: "fuel",     color: "#D85A30", bg: "var(--token-surfaceElevated)" },
  { id: "shopping", label: "Shopping", icon: "shopping", color: "#7F77DD", bg: "var(--token-surfaceElevated)" },
  { id: "lodging",  label: "Lodging",  icon: "lodging",  color: "#1D9E75", bg: "var(--token-surfaceElevated)" },
  { id: "bills",    label: "Bills",    icon: "bills",    color: "#639922", bg: "var(--token-surfaceElevated)" },
];

export const AMOUNT_PRESETS = [50, 100, 200, 500, 1000];

export const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const STORAGE_KEYS = {
  EXPENSES: "kharcha_expenses",
  SETTINGS: "kharcha_settings",
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  biometric: true,
  pin: true,
  pinCode: "1234",
  voice: true,
  haptic: true,
  offline: true,
  dailyBudget: 2000,
  userName: "User",
  userEmail: "",
};
