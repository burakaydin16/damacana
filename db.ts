import Dexie, { Table } from 'dexie';
import { Product, Customer, Transaction, ProductType } from './types';

export class SuTakipDB extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  transactions!: Table<Transaction>;

  constructor() {
    super('SuTakipDB');
    
    // Şema Tanımlama
    // id'ler string olduğu için '&id' (unique primary key) kullanıyoruz.
    // İlişkisel sorgular için indekslenebilir alanları belirtiyoruz.
    (this as any).version(1).stores({
      products: '&id, name, type',
      customers: '&id, name, type',
      transactions: '&id, date, customerId, type' 
    });
  }

  // Veritabanı ilk oluştuğunda örnek veri ekle
  async populate() {
    const productCount = await this.products.count();
    if (productCount > 0) return;

    await this.products.bulkAdd([
        { id: 'p1', name: '19L Damacana Su (Dolu)', type: ProductType.WATER, price: 85, depositPrice: 0, stock: 100, linkedDepositId: 'p2' },
        { id: 'p2', name: '19L Boş Damacana', type: ProductType.DEPOSIT, price: 0, depositPrice: 0, stock: 50 },
        { id: 'p3', name: 'Euro Palet', type: ProductType.DEPOSIT, price: 0, depositPrice: 0, stock: 20 },
        { id: 'p4', name: 'Metal Raf', type: ProductType.DEPOSIT, price: 0, depositPrice: 0, stock: 10 },
        { id: 'p5', name: '0.5L Su (24\'lü Koli)', type: ProductType.WATER, price: 60, depositPrice: 0, stock: 200, linkedDepositId: 'p3' },
    ]);

    await this.customers.bulkAdd([
        { 
            id: 'c1', 
            name: 'Merkez Market', 
            type: 'Bayi', 
            phone: '0555 111 22 33', 
            address: 'Atatürk Cad. No:1', 
            depositBalances: { 'p2': 10, 'p3': 2 }, 
            cashBalance: 1500 
        },
        { 
            id: 'c2', 
            name: 'Ahmet Yılmaz', 
            type: 'Perakende', 
            phone: '0555 999 88 77', 
            address: 'Ev', 
            depositBalances: { 'p2': 1 }, 
            cashBalance: 0 
        }
    ]);
  }
}

export const db = new SuTakipDB();

// Uygulama başladığında verileri kontrol et ve doldur
(db as any).on('populate', () => db.populate());