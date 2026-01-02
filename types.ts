
export interface DailyLog {
  id: string;
  date: string;
  salesCount: number; // Changed from sales (amount) to salesCount (units)
  adSpend: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'SaaS' | 'E-book' | 'Course' | 'Asset' | 'Newsletter';
  price: number; 
  logs: DailyLog[];
}

export interface Metrics {
  grossSales: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  cac: number;
}

export interface AIInsight {
  title: string;
  recommendation: string;
  impact: 'High' | 'Medium' | 'Low';
  category: 'Pricing' | 'Marketing' | 'Operations';
}
