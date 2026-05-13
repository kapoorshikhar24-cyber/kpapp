import { Category, Settings } from "./Types";

export const CATEGORIES: Category[] = [
  { id: "food",     label: "Food",     icon: "food",     color: "#EF9F27", bg: "#251E13" },
  { id: "travel",   label: "Travel",   icon: "travel",   color: "#378ADD", bg: "#131C25" },
  { id: "fuel",     label: "Fuel",     icon: "fuel",     color: "#D85A30", bg: "#251813" },
  { id: "shopping", label: "Shopping", icon: "shopping", color: "#7F77DD", bg: "#1C1325" },
  { id: "lodging",  label: "Lodging",  icon: "lodging",  color: "#1D9E75", bg: "#13251C" },
  { id: "bills",    label: "Bills",    icon: "bills",    color: "#639922", bg: "#1F2513" },
];

export const AMOUNT_PRESETS = [50, 100, 200, 500, 1000];

export const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const STORAGE_KEYS = {
  EXPENSES: "kharcha_expenses",
  SETTINGS: "kharcha_settings",
};

export const DEFAULT_SETTINGS: Settings = {
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
