
import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Transaction, Customer, Product } from '../types';
import { Search, Calendar, FileText, User, Filter, ArrowRight } from 'lucide-react';

export const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Filtreler
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]); // Son 30 gün
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
        const t = await DataService.getTransactions();
        const c = await DataService.getCustomers();
        const p = await DataService.getProducts();
        setTransactions(t);
        setCustomers(c);
        setProducts(p);
    };
    fetchData();
  }, []);

  // Filtreleme Mantığı
  const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.date).toISOString().split('T')[0];
      const dateMatch = tDate >= startDate && tDate <= endDate;
      const customerMatch = selectedCustomerId ? t.customer_id === selectedCustomerId : true;
      return dateMatch && customerMatch;
  });

  // Seçili Müşteri Verileri
  const selectedCustomerData = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
           <div>
               <h2 className="text-3xl font-bold text-gray-900">Raporlar & Hareketler</h2>
               <p className="text-gray-500 mt-1">Detaylı bayi hareketleri ve sevkiyat raporları.</p>
           </div>
       </div>

       {/* Filtre Alanı */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
           <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                   <User size={16} /> Bayi / Müşteri Seçimi
               </label>
               <select 
                   className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-water-500 bg-gray-50"
                   value={selectedCustomerId}
                   onChange={e => setSelectedCustomerId(e.target.value)}
               >
                   <option value="">Tüm Hareketleri Listele</option>
                   {customers.map(c => (
                       <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                   ))}
               </select>
           </div>
           
           <div>
               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                   <Calendar size={16} /> Başlangıç Tarihi
               </label>
               <input 
                   type="date" 
                   className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-water-500"
                   value={startDate}
                   onChange={e => setStartDate(e.target.value)}
               />
           </div>

           <div>
               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                   <Calendar size={16} /> Bitiş Tarihi
               </label>
               <input 
                   type="date" 
                   className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-water-500"
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
               />
           </div>
       </div>

       {/* Müşteri seçiliyse Özet Kartı Göster */}
       {selectedCustomerData && (
           <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
               <div className="flex flex-col md:flex-row gap-8">
                   {/* Sol Taraf: Müşteri Bilgisi ve Bakiye */}
                   <div className="flex-1 border-b md:border-b-0 md:border-r border-indigo-200 pb-4 md:pb-0 md:pr-4">
                       <h3 className="text-xl font-bold text-indigo-900 mb-1">{selectedCustomerData.name}</h3>
                       <p className="text-indigo-600 text-sm mb-4">{selectedCustomerData.type} • {selectedCustomerData.phone}</p>
                       
                       <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm inline-block min-w-[200px]">
                           <p className="text-sm text-gray-500 mb-1">Güncel Para Bakiyesi</p>
                           <p className={`text-2xl font-bold ${selectedCustomerData.cash_balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                               {selectedCustomerData.cash_balance > 0 ? `Borçlu: ₺${selectedCustomerData.cash_balance}` : `Alacaklı: ₺${Math.abs(selectedCustomerData.cash_balance)}`}
                           </p>
                       </div>
                   </div>

                   {/* Sağ Taraf: Elindeki Depozitolar */}
                   <div className="flex-[2]">
                       <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                           <FileText size={16} /> Müşterideki Depozitolar
                       </h4>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                           {selectedCustomerData.deposit_balances && Object.entries(selectedCustomerData.deposit_balances).map(([prodId, count]) => {
                               if(Number(count) === 0) return null;
                               const prod = products.find(p => p.id === prodId);
                               return (
                                   <div key={prodId} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                       <p className="text-xs text-gray-500 truncate mb-1">{prod?.name}</p>
                                       <p className={`font-bold ${Number(count) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                           {Number(count) > 0 ? `${count} Adet (Bizde)` : `${Math.abs(Number(count))} Adet (Onda)`}
                                       </p>
                                   </div>
                               );
                           })}
                           {(!selectedCustomerData.deposit_balances || Object.values(selectedCustomerData.deposit_balances).every(v => v === 0)) && (
                               <p className="text-sm text-indigo-400 italic">Üzerinde depozito bulunmuyor.</p>
                           )}
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Hareket Tablosu */}
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-6 border-b border-gray-100 flex items-center justify-between">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <Filter size={18} className="text-gray-400" />
                   Hareket Dökümü
               </h3>
               <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                   {filteredTransactions.length} Kayıt Bulundu
               </span>
           </div>
           
           <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-500 font-medium">
                       <tr>
                           <th className="px-6 py-4">Tarih</th>
                           <th className="px-6 py-4">Müşteri</th>
                           <th className="px-6 py-4">İşlem Detayları (Ürün - Adet - Tip)</th>
                           <th className="px-6 py-4 text-right">Toplam Tutar</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                       {filteredTransactions.length === 0 ? (
                           <tr>
                               <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                   Seçilen kriterlere uygun hareket bulunamadı.
                               </td>
                           </tr>
                       ) : (
                           filteredTransactions.map(t => {
                               const cName = t.customer_id ? customers.find(c => c.id === t.customer_id)?.name : 'Stok Girişi';
                               return (
                                   <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                       <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                           {new Date(t.date).toLocaleDateString('tr-TR')}
                                           <div className="text-xs text-gray-400">{new Date(t.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</div>
                                       </td>
                                       <td className="px-6 py-4 font-medium text-gray-900">
                                           {cName}
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="space-y-1">
                                               {t.items.map((item, idx) => {
                                                   const pName = products.find(p => p.id === item.product_id)?.name;
                                                   return (
                                                       <div key={idx} className="flex items-center gap-2 text-xs">
                                                           <ArrowRight size={12} className="text-gray-300" />
                                                           <span className="text-gray-700 font-medium w-32 truncate" title={pName}>{pName}</span>
                                                           <span className="font-bold bg-gray-100 px-1.5 rounded">{item.quantity} Adet</span>
                                                           <span className={`px-1.5 rounded ${
                                                               item.item_type === 'Gonderilen' ? 'bg-blue-50 text-blue-600' : 
                                                               item.item_type === 'IadeAlinan' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
                                                           }`}>
                                                               {item.item_type === 'Gonderilen' ? 'Çıkış' : item.item_type === 'IadeAlinan' ? 'İade' : 'Giriş'}
                                                           </span>
                                                       </div>
                                                   );
                                               })}
                                           </div>
                                       </td>
                                       <td className="px-6 py-4 text-right font-bold text-gray-800">
                                           {t.total_amount > 0 ? `₺${t.total_amount.toLocaleString()}` : '-'}
                                       </td>
                                   </tr>
                               );
                           })
                       )}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};
