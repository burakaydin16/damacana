
export enum ProductType {
  WATER = 'Su',
  DEPOSIT = 'Depozito (Boş)', // Boş Damacana, Palet, Raf
  OTHER = 'Diğer'
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number; // Satış Fiyatı
  depositPrice: number; // Depozito Bedeli (UI'da gizlenecek, arka plan için)
  stock: number;
  linkedDepositId?: string; // Dolu su satarken hangi boş depozito tetiklenmeli?
}

export interface Customer {
  id: string;
  name: string;
  type: 'Bayi' | 'Perakende';
  phone: string;
  address: string;
  // Bakiye Takibi (Depozito Borçları)
  depositBalances: Record<string, number>; // ProductID -> Adet (Pozitif: Müşteride var/Borçlu, Negatif: Bizde fazladan/Alacaklı)
  cashBalance: number; // TL Borcu
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  type: 'Gonderilen' | 'IadeAlinan' | 'StokGirisi'; 
  priceSnapshot: number;
}

export interface Transaction {
  id: string;
  date: string;
  customerId?: string; // Fabrika girişlerinde boş olabilir
  items: TransactionItem[];
  totalAmount: number;
  notes?: string;
  type: 'CustomerOp' | 'FactoryOp';
}

export interface DashboardStats {
  totalSales: number;
  totalCustomers: number;
  lowStockAlerts: number;
  pendingDeposits: number;
}