import { db } from '../db';
import { Customer, Product, ProductType, Transaction } from '../types';

export const DataService = {
  // --- Products ---
  getProducts: async (): Promise<Product[]> => {
    return await db.products.toArray();
  },

  saveProduct: async (product: Product) => {
    return await db.products.put(product);
  },

  deleteProduct: async (id: string) => {
    return await db.products.delete(id);
  },

  // --- Customers ---
  getCustomers: async (): Promise<Customer[]> => {
    return await db.customers.toArray();
  },

  saveCustomer: async (customer: Customer) => {
    return await db.customers.put(customer);
  },

  // --- Transactions ---
  getTransactions: async (): Promise<Transaction[]> => {
    // Tarihe göre tersten sırala (En yeni en üstte)
    return await db.transactions.orderBy('date').reverse().toArray();
  },

  // --- Core Logic: Process a Transaction (Atomik İşlem) ---
  processTransaction: async (transaction: Transaction) => {
    // Dexie transaction bloğu: Herhangi bir adımda hata olursa veritabanı eski haline döner.
    return await (db as any).transaction('rw', db.products, db.customers, db.transactions, async () => {
        
        let transactionTotal = 0;
        let customer: Customer | undefined;

        // 1. Müşteriyi Bul (Eğer varsa)
        if (transaction.customerId) {
            customer = await db.customers.get(transaction.customerId);
        }

        // 2. Ürünleri Döngüye Al ve Stok/Bakiye Hesapla
        for (const item of transaction.items) {
            const product = await db.products.get(item.productId);
            if (!product) continue;

            // --- FABRİKA STOK GİRİŞİ ---
            if (item.type === 'StokGirisi') {
                product.stock += item.quantity;
                await db.products.put(product);
            }
            
            // --- MÜŞTERİ İŞLEMLERİ ---
            else if (customer) {
                // SATIŞ / GÖNDERİLEN
                if (item.type === 'Gonderilen') {
                    product.stock -= item.quantity; // Stok düş
                    
                    // Su ise parasını ekle
                    if (product.type === ProductType.WATER) {
                        transactionTotal += item.quantity * item.priceSnapshot;
                    }

                    // Depozito Borcu
                    if (product.type === ProductType.DEPOSIT) {
                        customer.depositBalances[product.id] = (customer.depositBalances[product.id] || 0) + item.quantity;
                    } else if (product.linkedDepositId) {
                        customer.depositBalances[product.linkedDepositId] = (customer.depositBalances[product.linkedDepositId] || 0) + item.quantity;
                    }
                } 
                // İADE ALINAN
                else if (item.type === 'IadeAlinan') {
                    product.stock += item.quantity; // Stok art

                    // Depozito Bakiyesinden Düş
                    if (product.type === ProductType.DEPOSIT) {
                        customer.depositBalances[product.id] = (customer.depositBalances[product.id] || 0) - item.quantity;
                    }
                }
                
                await db.products.put(product);
            }
        }

        // 3. Müşteri Bakiyesini Güncelle ve Kaydet
        if (customer) {
            customer.cashBalance += transactionTotal;
            await db.customers.put(customer);
        }

        // 4. Hareketi Kaydet
        transaction.totalAmount = transactionTotal;
        await db.transactions.add(transaction);
    });
  }
};