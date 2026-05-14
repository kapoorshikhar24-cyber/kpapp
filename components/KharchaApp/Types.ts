export type ScreenName = "lock" | "cat" | "amt" | "dash" | "hist" | "set" | "manage_cats" | "change_pin" | "registry";
export type PeriodName = "today" | "week" | "month";

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface Settings {
  theme?: "dark" | "light";
  accentColor?: string;
  biometric: boolean;
  pin: boolean;
  pinCode: string; // 4-digit PIN
  voice: boolean;
  haptic: boolean;
  offline: boolean;
  dailyBudget: number;
  userName: string;
  userEmail: string;
  customCategories?: Category[];
}
