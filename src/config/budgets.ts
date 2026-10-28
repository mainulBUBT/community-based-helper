// "২০,০০০ টাকার মধ্যে সেরা মোবাইল" ধরনের পাতা: কোন ক্যাটাগরিতে কোন বাজেট (টাকা)। লোকে এভাবেই খোঁজে
export const BUDGETS: Record<string, number[]> = {
  mobile: [10000, 15000, 20000, 25000, 30000, 40000, 50000],
  laptop: [40000, 50000, 60000, 80000, 100000],
  tablet: [15000, 20000, 30000, 50000],
  watch: [2000, 5000, 10000],
  earbuds: [1000, 2000, 3000, 5000],
};

// এর কম পণ্য হলে পাতাটা বানানো হয় না (পাতলা পাতা Google পছন্দ করে না)
export const BUDGET_MIN_PRODUCTS = 4;

export const budgetSlug = (amount: number) => `under-${amount}`;
export const budgetFromSlug = (slug: string) => (/^under-(\d+)$/.exec(slug) ? Number(slug.slice(6)) : null);
