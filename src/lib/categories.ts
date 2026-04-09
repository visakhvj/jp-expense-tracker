export interface Category {
  id: string;
  nameEn: string;
  nameJp: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "groceries", nameEn: "Groceries", nameJp: "食料品", icon: "ShoppingCart", color: "#22c55e" },
  { id: "dining", nameEn: "Dining", nameJp: "外食", icon: "UtensilsCrossed", color: "#f97316" },
  { id: "transport", nameEn: "Transportation", nameJp: "交通", icon: "Train", color: "#3b82f6" },
  { id: "daily", nameEn: "Daily Necessities", nameJp: "日用品", icon: "Home", color: "#8b5cf6" },
  { id: "clothing", nameEn: "Clothing", nameJp: "衣類", icon: "Shirt", color: "#ec4899" },
  { id: "medical", nameEn: "Medical", nameJp: "医療", icon: "Heart", color: "#ef4444" },
  { id: "utilities", nameEn: "Utilities", nameJp: "光熱費", icon: "Zap", color: "#eab308" },
  { id: "communication", nameEn: "Communication", nameJp: "通信費", icon: "Smartphone", color: "#06b6d4" },
  { id: "entertainment", nameEn: "Entertainment", nameJp: "娯楽", icon: "Gamepad2", color: "#a855f7" },
  { id: "education", nameEn: "Education", nameJp: "教育", icon: "GraduationCap", color: "#14b8a6" },
  { id: "other", nameEn: "Other", nameJp: "その他", icon: "MoreHorizontal", color: "#6b7280" },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoryColor(id: string): string {
  return getCategoryById(id)?.color ?? "#6b7280";
}

// Store name to category mapping for auto-categorization
const STORE_CATEGORY_MAP: Record<string, string> = {
  // Supermarkets
  "イオン": "groceries",
  "西友": "groceries",
  "ライフ": "groceries",
  "マルエツ": "groceries",
  "サミット": "groceries",
  "OK": "groceries",
  "業務スーパー": "groceries",
  "まいばすけっと": "groceries",
  "ヨークマート": "groceries",
  "いなげや": "groceries",
  // Convenience stores
  "セブン-イレブン": "groceries",
  "セブンイレブン": "groceries",
  "ファミリーマート": "groceries",
  "ローソン": "groceries",
  "ミニストップ": "groceries",
  // Drug stores
  "マツモトキヨシ": "daily",
  "ウエルシア": "daily",
  "ツルハ": "daily",
  "サンドラッグ": "daily",
  "スギ薬局": "medical",
  // Restaurants
  "マクドナルド": "dining",
  "すき家": "dining",
  "吉野家": "dining",
  "松屋": "dining",
  "ガスト": "dining",
  "サイゼリヤ": "dining",
  "スターバックス": "dining",
  // Transportation
  "JR": "transport",
  "東京メトロ": "transport",
  "PASMO": "transport",
  "Suica": "transport",
  // Clothing
  "ユニクロ": "clothing",
  "GU": "clothing",
  "しまむら": "clothing",
  "ZARA": "clothing",
  "H&M": "clothing",
  // Electronics
  "ヨドバシ": "entertainment",
  "ビックカメラ": "entertainment",
  "ヤマダ電機": "entertainment",
};

export function guessCategory(storeName: string): string {
  for (const [key, category] of Object.entries(STORE_CATEGORY_MAP)) {
    if (storeName.includes(key)) {
      return category;
    }
  }
  return "other";
}
