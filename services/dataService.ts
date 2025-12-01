
import { supabase } from '../supabaseClient';
import { Customer, Product, ProductType, Transaction, TransactionItem } from '../types';

export const DataService = {
  // --- Products ---
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data || [];
  },

  saveProduct: async (product: Partial<Product>) => {
    // UI camelCase kullanıyor, DB snake_case. Mapping yapıyoruz.
    const dbProduct = {
        id: product.id, // Eğer varsa update, yoksa Supabase oluşturur (fakat UI'dan genelde boş gelir create'de)
        name: product.name,
        type: product.type,
        price: product.price,
        stock: product.stock,
        deposit_price: product.deposit_price,
        linked_deposit_id: product.linked_deposit_id || null
    };

    // ID varsa update, yoksa insert (ID'yi supabase üretsin diye id alanını undefined yapabiliriz create durumunda)
    if (!product.id) delete (dbProduct as any).id;

    const { error } = await supabase.from('products').upsert(dbProduct);
    if (error) console.error('Error saving product:', error);
    return !error;
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Error deleting product:', error);
  },

  // --- Customers ---
  getCustomers: async (): Promise<Customer[]> => {
    // Müşterileri ve ilişkili depozito defterini çek
    const { data, error } = await supabase
        .from('customers')
        .select(`
            *,
            deposit_ledgers (
                product_id,
                balance
            )
        `)
        .order('name');

    if (error) {
        console.error('Error fetching customers:', error);
        return [];
    }

    // Gelen veriyi UI formatına dönüştür (Array -> Record<string, number>)
    return data?.map((c: any) => ({
        ...c,
        deposit_balances: c.deposit_ledgers.reduce((acc: any, ledger: any) => {
            acc[ledger.product_id] = ledger.balance;
            return acc;
        }, {})
    })) || [];
  },

  saveCustomer: async (customer: Partial<Customer>) => {
    const dbCustomer = {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        phone: customer.phone,
        address: customer.address,
        cash_balance: customer.cash_balance
    };
    if (!customer.id) delete (dbCustomer as any).id;

    const { error } = await supabase.from('customers').upsert(dbCustomer);
    if (error) console.error('Error saving customer:', error);
    return !error;
  },

  // --- Transactions ---
  getTransactions: async (): Promise<Transaction[]> => {
    // Transaction başlıklarını ve altındaki kalemleri (items) join ile çekiyoruz
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            items: transaction_items (
                id,
                product_id,
                quantity,
                unit_price,
                item_type
            )
        `)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
    return data || [];
  },

  // --- Core Logic: Process Transaction (Relational) ---
  processTransaction: async (transaction: Transaction) => {
      // Bu işlem birbiri ardına zincirleme DB operasyonları gerektirir.
      // Supabase'de Stored Procedure (RPC) kullanmak en iyisidir ama
      // burada JS tarafında sıralı işlemlerle çözeceğiz.

      try {
        let transactionTotal = 0;
        let customer: any = null;

        // 1. Müşteriyi Bul (Eğer işlem müşteriye yapılıyorsa)
        if (transaction.customer_id) {
            const { data } = await supabase
                .from('customers')
                .select('*')
                .eq('id', transaction.customer_id)
                .single();
            customer = data;
        }

        // 2. Transaction Başlığını Oluştur
        const { data: transHeader, error: transError } = await supabase
            .from('transactions')
            .insert({
                date: new Date().toISOString(),
                customer_id: transaction.customer_id || null,
                type: transaction.type,
                notes: transaction.notes,
                total_amount: 0 // Hesaplayıp güncelleyeceğiz
            })
            .select()
            .single();

        if (transError || !transHeader) throw new Error("Fiş oluşturulamadı: " + transError?.message);

        const transactionId = transHeader.id;
        
        // 3. Kalemleri İşle (Stok, Bakiye, Insert Item)
        for (const item of transaction.items) {
            // Güncel ürün bilgisini çek
            const { data: product } = await supabase.from('products').select('*').eq('id', item.product_id).single();
            if (!product) continue;

            // --- Stok Yönetimi ---
            let newStock = product.stock;
            if (item.item_type === 'StokGirisi') {
                newStock += item.quantity;
            } else if (item.item_type === 'Gonderilen') { // Satış
                newStock -= item.quantity;
                // Sadece SU satışları ciroya eklenir
                if (product.type === ProductType.WATER) {
                    transactionTotal += item.quantity * item.unit_price;
                }
            } else if (item.item_type === 'IadeAlinan') { // Boş iade
                newStock += item.quantity;
            }
            // Stok update
            await supabase.from('products').update({ stock: newStock }).eq('id', product.id);

            // --- Depozito Yönetimi (Ledger) ---
            if (customer) {
                 let ledgerProductId = null;
                 let ledgerChange = 0;

                 // Eğer satılan ürün Depozito ise veya ona bağlı bir depozito varsa
                 if (item.item_type === 'Gonderilen') {
                     if (product.type === ProductType.DEPOSIT) {
                         ledgerProductId = product.id;
                         ledgerChange = item.quantity; // Borç artar
                     } else if (product.linked_deposit_id) {
                         ledgerProductId = product.linked_deposit_id;
                         ledgerChange = item.quantity; // Dolu gitti, boş borcu artar
                     }
                 } 
                 else if (item.item_type === 'IadeAlinan' && product.type === ProductType.DEPOSIT) {
                     ledgerProductId = product.id;
                     ledgerChange = -item.quantity; // Borç düşer
                 }

                 // Ledger Update (Upsert mantığı)
                 if (ledgerProductId) {
                     // Mevcut bakiyeyi çek
                     const { data: existingLedger } = await supabase
                        .from('deposit_ledgers')
                        .select('balance')
                        .match({ customer_id: customer.id, product_id: ledgerProductId })
                        .single();

                     const currentBalance = existingLedger ? existingLedger.balance : 0;
                     const newBalance = currentBalance + ledgerChange;

                     // Kaydet
                     await supabase.from('deposit_ledgers').upsert({
                         customer_id: customer.id,
                         product_id: ledgerProductId,
                         balance: newBalance
                     }, { onConflict: 'customer_id, product_id' });
                 }
            }

            // --- Transaction Item Insert ---
            await supabase.from('transaction_items').insert({
                transaction_id: transactionId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                item_type: item.item_type
            });
        }

        // 4. Müşteri Para Bakiyesi ve Fiş Toplamı Güncelleme
        if (customer && transactionTotal > 0) {
            await supabase.from('customers').update({ 
                cash_balance: Number(customer.cash_balance) + transactionTotal 
            }).eq('id', customer.id);
        }

        // Fiş toplamını güncelle
        await supabase.from('transactions').update({ total_amount: transactionTotal }).eq('id', transactionId);

      } catch (error) {
          console.error("İşlem hatası:", error);
          throw error;
      }
  }
};
