
export enum ProductType {
  WATER = 'Su',
  DEPOSIT = 'Depozito (Boş)', // Boş Damacana, Palet, Raf
  OTHER = 'Diğer'
}

export interface Product {
  id: string; // UUID
  name: string;
  type: ProductType;
  price: number; // Satış Fiyatı (numeric)
  deposit_price: number; // DB: deposit_price
  stock: number; // integer
  linked_deposit_id?: string; // DB: linked_deposit_id (UUID)
}

export interface DepositLedger {
  product_id: string;
  balance: number;
}

export interface Customer {
  id: string; // UUID
  name: string;
  type: 'Bayi' | 'Perakende';
  phone: string;
  address: string;
  // Bakiye Takibi
  cash_balance: number; // DB: cash_balance (numeric)
  // UI için kolaylık olsun diye bunu serviste dolduracağız, DB'de deposit_ledgers tablosu var.
  deposit_balances?: Record<string, number>; 
}

export interface TransactionItem {
  id?: string;
  product_id: string; // DB: product_id
  quantity: number;
  item_type: 'Gonderilen' | 'IadeAlinan' | 'StokGirisi'; // DB: item_type
  unit_price: number; // DB: unit_price
  // UI helper
  productName?: string;
}

export interface Transaction {
  id: string; // UUID
  date: string; // DB: date (timestamptz)
  customer_id?: string; // DB: customer_id
  total_amount: number; // DB: total_amount
  notes?: string;
  type: 'CustomerOp' | 'FactoryOp';
  // İlişkisel tablodan (transaction_items) gelen veriler buraya map edilecek
  items: TransactionItem[];
}

export interface DashboardStats {
  totalSales: number;
  totalCustomers: number;
  lowStockAlerts: number;
  pendingDeposits: number;
}
