
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Customer, Product } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ name: '', type: 'Bayi', phone: '', address: '', cash_balance: 0 });

  const loadData = async () => {
      const c = await DataService.getCustomers();
      const p = await DataService.getProducts();
      setCustomers(c);
      setProducts(p);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
      if(!newCustomer.name) return;
      const customer = {
          name: newCustomer.name!,
          type: newCustomer.type as any,
          phone: newCustomer.phone || '',
          address: newCustomer.address || '',
          cash_balance: 0
      };
      
      // @ts-ignore
      await DataService.saveCustomer(customer);
      await loadData();
      
      setIsModalOpen(false);
      setNewCustomer({ name: '', type: 'Bayi', phone: '', address: '' });
  };

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Bayiler ve Müşteriler</h2>
        <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Müşteri Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="font-bold text-lg text-gray-900">{customer.name}</h3>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${customer.type === 'Bayi' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {customer.type}
                              </span>
                          </div>
                          <div className="text-right">
                              <p className="text-sm text-gray-500">Bakiye</p>
                              <p className={`font-bold ${customer.cash_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {customer.cash_balance > 0 ? `+₺${customer.cash_balance}` : `₺${customer.cash_balance}`}
                              </p>
                          </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                              <Phone size={14} />
                              <span>{customer.phone || 'Telefon yok'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <MapPin size={14} />
                              <span className="truncate">{customer.address || 'Adres yok'}</span>
                          </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100">
                          <button 
                             onClick={() => toggleExpand(customer.id)}
                             className="w-full flex items-center justify-between text-sm font-medium text-water-600 hover:text-water-700"
                          >
                              <span>Depozito Durumu</span>
                              {expandedId === customer.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          {expandedId === customer.id && (
                              <div className="mt-3 bg-gray-50 rounded p-3 text-sm space-y-2">
                                  {customer.deposit_balances && Object.entries(customer.deposit_balances).map(([prodId, value]) => {
                                      const qty = Number(value);
                                      const prodName = products.find(p => p.id === prodId)?.name || 'Bilinmeyen Ürün';
                                      if (qty === 0) return null;
                                      
                                      return (
                                          <div key={prodId} className="flex justify-between items-center border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                                              <span className="text-gray-600 truncate mr-2">{prodName}</span>
                                              <span className={`font-bold text-xs px-2 py-1 rounded ${qty > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                  {qty > 0 ? `${qty} Adet Borçlu` : `${Math.abs(qty)} Adet Alacaklı`}
                                              </span>
                                          </div>
                                      );
                                  })}
                                  {(!customer.deposit_balances || Object.values(customer.deposit_balances).every(v => Number(v) === 0)) && (
                                      <p className="text-gray-400 italic">Depozito hareketi yok.</p>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ))}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <h3 className="text-lg font-bold">Yeni Müşteri/Bayi Ekle</h3>
                <div className="space-y-3">
                    <input 
                        placeholder="Adı Soyadı / Firma Adı" 
                        className="w-full border rounded p-2" 
                        value={newCustomer.name} 
                        onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                    <select 
                        className="w-full border rounded p-2" 
                        value={newCustomer.type}
                        onChange={e => setNewCustomer({...newCustomer, type: e.target.value as any})}
                    >
                        <option value="Bayi">Bayi</option>
                        <option value="Perakende">Perakende</option>
                    </select>
                    <input 
                        placeholder="Telefon" 
                        className="w-full border rounded p-2" 
                        value={newCustomer.phone} 
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                    <textarea 
                        placeholder="Adres" 
                        className="w-full border rounded p-2" 
                        value={newCustomer.address} 
                        onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                    <Button onClick={handleSave}>Kaydet</Button>
                </div>
            </div>
        </div>
       )}
    </div>
  );
};
