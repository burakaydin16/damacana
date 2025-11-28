import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Customer, Product, Transaction, TransactionItem, ProductType } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, Trash, Save, Factory, User } from 'lucide-react';

export const Transactions: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [mode, setMode] = useState<'CustomerOp' | 'FactoryOp'>('CustomerOp');

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const load = async () => {
        const c = await DataService.getCustomers();
        const p = await DataService.getProducts();
        setCustomers(c);
        setProducts(p);
    };
    load();
  }, []);

  const addItem = () => {
      if (products.length === 0) return;
      setItems([...items, { 
          productId: products[0].id, 
          quantity: 1, 
          type: mode === 'CustomerOp' ? 'Gonderilen' : 'StokGirisi', 
          priceSnapshot: products[0].price 
      }]);
  };

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
      const newItems = [...items];
      const item = newItems[index];
      
      if (field === 'productId') {
          const product = products.find(p => p.id === value);
          item.productId = value;
          item.priceSnapshot = product ? product.price : 0;
      } else {
          (item as any)[field] = value;
      }
      setItems(newItems);
  };

  const removeItem = (index: number) => {
      setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
      if (mode === 'CustomerOp' && !selectedCustomer) return;
      if (items.length === 0) return;

      const transaction: Transaction = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          customerId: mode === 'CustomerOp' ? selectedCustomer : undefined,
          items: items,
          totalAmount: 0, 
          type: mode
      };

      setLoading(true);
      try {
          await DataService.processTransaction(transaction);
          setSuccessMsg('İşlem başarıyla kaydedildi!');
          setItems([]);
          setSelectedCustomer('');
          setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
          console.error(error);
          alert('İşlem sırasında bir hata oluştu.');
      } finally {
          setLoading(false);
      }
  };

  const totalMoney = items.reduce((acc, item) => {
      if (item.type === 'Gonderilen') {
         const p = products.find(prod => prod.id === item.productId);
         if (p && p.type === ProductType.WATER) return acc + (item.quantity * item.priceSnapshot);
      }
      return acc;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Hareket Ekle</h2>
          {successMsg && <span className="text-green-600 font-bold bg-green-100 px-3 py-1 rounded animate-pulse">{successMsg}</span>}
      </div>

      <div className="flex p-1 bg-gray-200 rounded-lg w-full md:w-fit">
          <button 
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${mode === 'CustomerOp' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
            onClick={() => { setMode('CustomerOp'); setItems([]); }}
          >
              <User size={18} />
              Müşteri / Bayi İşlemi
          </button>
          <button 
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${mode === 'FactoryOp' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'}`}
            onClick={() => { setMode('FactoryOp'); setItems([]); }}
          >
              <Factory size={18} />
              Fabrika Stok Girişi
          </button>
      </div>

      <div className={`bg-white rounded-xl shadow-sm border p-6 space-y-6 ${mode === 'FactoryOp' ? 'border-indigo-100' : 'border-gray-100'}`}>
          {mode === 'CustomerOp' && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri / Bayi Seçimi</label>
                <select 
                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-water-500"
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value)}
                >
                    <option value="">Seçiniz...</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                </select>
            </div>
          )}

           {mode === 'FactoryOp' && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-indigo-800 text-sm">
                  <span className="font-bold">Fabrika Giriş Modu:</span> Gireceğiniz ürünler doğrudan stoğunuza eklenecektir. Müşteri cari hesaplarına yansımaz.
              </div>
          )}

          <div className="space-y-4">
              <div className="flex justify-between items-end border-b pb-2">
                  <label className="block text-sm font-medium text-gray-700">Ürünler</label>
                  <Button size="sm" onClick={addItem} variant="secondary">
                      <Plus size={16} className="mr-1" /> Satır Ekle
                  </Button>
              </div>

              {items.length === 0 && (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded border border-dashed">
                      Listeye ürün ekleyin
                  </div>
              )}

              {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1 w-full">
                          <p className="text-xs text-gray-500 mb-1">İşlem Türü</p>
                          <select 
                            className={`w-full p-2 rounded border font-medium ${item.type === 'Gonderilen' ? 'text-blue-700 bg-blue-50 border-blue-200' : item.type === 'IadeAlinan' ? 'text-green-700 bg-green-50 border-green-200' : 'text-indigo-700 bg-indigo-50 border-indigo-200'}`}
                            value={item.type}
                            onChange={e => updateItem(index, 'type', e.target.value)}
                            disabled={mode === 'FactoryOp'} 
                          >
                              {mode === 'CustomerOp' ? (
                                  <>
                                    <option value="Gonderilen">Satış / Gönderim (Çıkış)</option>
                                    <option value="IadeAlinan">Boş İade Alma (Giriş)</option>
                                  </>
                              ) : (
                                  <option value="StokGirisi">Stok Girişi</option>
                              )}
                          </select>
                      </div>

                      <div className="flex-[2] w-full">
                          <p className="text-xs text-gray-500 mb-1">Ürün</p>
                          <select 
                             className="w-full p-2 rounded border"
                             value={item.productId}
                             onChange={e => updateItem(index, 'productId', e.target.value)}
                          >
                              {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                      {p.name} {item.type === 'Gonderilen' && p.type === ProductType.WATER ? `(₺${p.price})` : ''}
                                  </option>
                              ))}
                          </select>
                      </div>

                      <div className="w-24">
                          <p className="text-xs text-gray-500 mb-1">Adet</p>
                          <input 
                              type="number" 
                              min="1"
                              className="w-full p-2 rounded border text-center font-bold"
                              value={item.quantity}
                              onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                          />
                      </div>

                      <button onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                          <Trash size={18} />
                      </button>
                  </div>
              ))}
          </div>

          <div className="pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                  {mode === 'CustomerOp' && (
                    <>
                        <p>Tahmini Tutar: <span className="font-bold text-lg text-gray-900">₺{totalMoney}</span></p>
                        <p className="text-xs mt-1">*Depozito bakiyeleri otomatik işlenecektir.</p>
                    </>
                  )}
                  {mode === 'FactoryOp' && (
                      <p>Toplam <span className="font-bold">{items.reduce((acc, i) => acc + i.quantity, 0)}</span> adet ürün stoğa eklenecek.</p>
                  )}
              </div>
              
              <Button size="lg" onClick={handleSubmit} disabled={loading || (mode === 'CustomerOp' && !selectedCustomer) || items.length === 0}>
                  {loading ? 'İşleniyor...' : (
                      <>
                        <Save size={18} className="mr-2" />
                        {mode === 'CustomerOp' ? 'Hareketi Kaydet' : 'Stok Girişini Onayla'}
                      </>
                  )}
              </Button>
          </div>
      </div>
    </div>
  );
};