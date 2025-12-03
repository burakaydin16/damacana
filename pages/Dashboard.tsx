
import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Product, Transaction, Customer } from '../types';
import { Package, Wallet, Download, Truck, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface DashboardProps {
    onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    stock: [] as Product[],
    transactions: [] as Transaction[],
    customers: [] as Customer[],
  });

  useEffect(() => {
    const loadData = async () => {
        const stock = await DataService.getProducts();
        const transactions = await DataService.getTransactions();
        const customers = await DataService.getCustomers();
        
        setStats({ stock, transactions, customers });
    };
    loadData();
  }, []);

  const handleBackup = async () => {
      try {
          const exportData = {
              products: stats.stock,
              customers: stats.customers,
              transactions: stats.transactions,
              exportDate: new Date().toISOString()
          };

          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `su_takip_yedek_${new Date().toLocaleDateString()}.json`;
          document.body.appendChild(a);
          a.click();
          
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (error) {
          console.error("Yedek alma hatası:", error);
          alert("Yedek oluşturulurken bir hata oluştu.");
      }
  };

  // Toplam Alacak Hesaplama
  const totalReceivables = stats.customers.reduce((acc, c) => acc + (c.cash_balance > 0 ? c.cash_balance : 0), 0);
  
  // Dışarıdaki Depozitoları Ürün Bazlı Hesaplama
  const marketDeposits: Record<string, number> = {};
  stats.customers.forEach(customer => {
      if (customer.deposit_balances) {
          Object.entries(customer.deposit_balances).forEach(([prodId, count]) => {
              if (Number(count) > 0) { // Müşteride varsa (Pozitif değer)
                   const prodName = stats.stock.find(p => p.id === prodId)?.name || 'Bilinmeyen Ürün';
                   marketDeposits[prodName] = (marketDeposits[prodName] || 0) + Number(count);
              }
          });
      }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Genel Bakış</h2>
            <p className="text-gray-500 mt-1">İşletmenizin anlık durumu ve operasyon özeti.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={handleBackup} title="Verileri İndir" className="text-gray-600 border border-gray-200 bg-white">
                <Download size={18} className="mr-2" />
                Yedekle
            </Button>
            <Button onClick={() => onNavigate('transactions')} className="shadow-lg shadow-water-500/30">
                + Hızlı İşlem
            </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Depo Stok Kartı */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Depo Stok Durumu</h3>
                    <p className="text-xs text-gray-500">Elimizdeki fiziksel ürünler</p>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto max-h-60 pr-2 space-y-3 custom-scrollbar">
                {stats.stock.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Ürün bulunamadı.</p>
                ) : (
                    stats.stock.map(product => (
                        <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="font-medium text-gray-700">{product.name}</span>
                            <span className={`font-bold px-3 py-1 rounded-full text-sm ${product.stock <= 10 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-800 border border-gray-200'}`}>
                                {product.stock} Adet
                            </span>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button onClick={() => onNavigate('inventory')} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Stok Yönetimine Git →</button>
            </div>
        </div>

        {/* Piyasa Depozito Kartı */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                    <Truck size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Piyasadaki Depozitolar</h3>
                    <p className="text-xs text-gray-500">Müşterilerdeki emanet ürünler</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto max-h-60 pr-2 space-y-3 custom-scrollbar">
                {Object.keys(marketDeposits).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                        <p>Piyasada emanet ürün yok.</p>
                    </div>
                ) : (
                    Object.entries(marketDeposits).map(([name, count]) => (
                        <div key={name} className="flex justify-between items-center p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                            <span className="font-medium text-gray-700">{name}</span>
                            <span className="font-bold text-orange-700 bg-white px-3 py-1 rounded-full text-sm shadow-sm border border-orange-100">
                                {count} Adet
                            </span>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button onClick={() => onNavigate('customers')} className="text-orange-600 hover:text-orange-800 text-sm font-medium">Müşteri Detaylarını Gör →</button>
            </div>
        </div>
      </div>

      {/* Financial & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Finansal Özet */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl shadow-gray-200">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gray-700/50 rounded-xl">
                      <Wallet size={24} className="text-emerald-400" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg">Finansal Durum</h3>
                      <p className="text-xs text-gray-400">Tahsil edilecek tutarlar</p>
                  </div>
              </div>
              
              <div className="space-y-1 mb-8">
                  <p className="text-sm text-gray-400">Toplam Cari Alacak</p>
                  <p className="text-4xl font-bold tracking-tight">₺{totalReceivables.toLocaleString()}</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Bugünkü Ciro</span>
                      <span className="text-emerald-400 font-bold">
                          +₺{stats.transactions
                              .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
                              .reduce((acc, t) => acc + t.total_amount, 0).toLocaleString()}
                      </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
              </div>
          </div>

          {/* Son Hareketler Listesi */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Son İşlem Hareketleri</h3>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('reports')}>Tüm Raporlar</Button>
              </div>
              
              <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                          <tr>
                              <th className="px-6 py-4">Tarih / Saat</th>
                              <th className="px-6 py-4">Cari / Müşteri</th>
                              <th className="px-6 py-4">İşlem Özeti</th>
                              <th className="px-6 py-4 text-right">Tutar</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {stats.transactions.slice(0, 6).map((t) => {
                              const customerName = t.customer_id 
                                  ? (stats.customers.find(c => c.id === t.customer_id)?.name || 'Bilinmeyen') 
                                  : 'Stok Girişi';
                              
                              const isSale = t.type === 'CustomerOp' && t.total_amount > 0;
                              
                              return (
                                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                                      <td className="px-6 py-4 text-gray-600">
                                          {new Date(t.date).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                              <div className={`w-2 h-2 rounded-full ${t.customer_id ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                              <span className="font-medium text-gray-900">{customerName}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-gray-500">
                                          {t.items?.length || 0} Kalem Ürün
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          {isSale ? (
                                              <span className="flex items-center justify-end gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md w-fit ml-auto">
                                                  <ArrowUpRight size={14} /> ₺{t.total_amount.toLocaleString()}
                                              </span>
                                          ) : (
                                              <span className="text-gray-400">-</span>
                                          )}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
                  {stats.transactions.length === 0 && (
                      <div className="p-12 text-center text-gray-400 bg-white">
                          Henüz bir işlem kaydı bulunmuyor.
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
