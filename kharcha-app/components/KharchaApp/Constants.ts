import { Category } from "./Types";

export const CATEGORIES: Category[] = [
  { id: "food",     label: "Food",     icon: "🍱", color: "#EF9F27", bg: "#251E13" },
  { id: "travel",   label: "Travel",   icon: "✈️",  color: "#378ADD", bg: "#131C25" },
  { id: "fuel",     label: "Fuel",     icon: "⛽",  color: "#D85A30", bg: "#251813" },
  { id: "shopping", label: "Shopping", icon: "🛍️",  color: "#7F77DD", bg: "#1C1325" },
  { id: "lodging",  label: "Lodging",  icon: "🏨",  color: "#1D9E75", bg: "#13251C" },
  { id: "bills",    label: "Bills",    icon: "🧾",  color: "#8BBF3A", bg: "#1F2513" },
];

export const PRESETS = [50, 100, 200, 500, 1000];

export const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const SCREENS = ["lock", "cat", "amt", "dash", "hist", "set"];
