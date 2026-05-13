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
  biometric: boolean;
  pin: boolean;
  voice: boolean;
  haptic: boolean;
  offline: boolean;
  dailyBudget: number;
  userName: string;
  userEmail: string;
}
