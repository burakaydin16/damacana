
import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Product, Transaction, Customer } from '../types';
import { TrendingUp, AlertTriangle, Package, Wallet, Download } from 'lucide-react';
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
              products: await DataService.getProducts(),
              customers: await DataService.getCustomers(),
              transactions: await DataService.getTransactions(),
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

  const lowStock = stats.stock.filter(p => p.stock < 20);
  const totalReceivables = stats.customers.reduce((acc, c) => acc + (c.cash_balance || 0), 0);
  
  const totalPendingDeposits = stats.customers.reduce((acc, c) => {
      let total = 0;
      if (c.deposit_balances) {
          Object.values(c.deposit_balances).forEach(v => total += Number(v));
      }
      return acc + total;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Hoş Geldiniz</h2>
            <p className="text-gray-500">Bugünün operasyon özeti.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={handleBackup} title="Verileri İndir (JSON Yedek)">
                <Download size={18} className="mr-2" />
                Yedek Al
            </Button>

            <Button onClick={() => onNavigate('transactions')}>+ Yeni Hareket</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Ürün Çeşidi</p>
              <h3 className="text-2xl font-bold">{stats.stock.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Alacak (Cari)</p>
              <h3 className="text-2xl font-bold">₺{totalReceivables.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dışarıdaki Depozito</p>
              <h3 className="text-2xl font-bold">{totalPendingDeposits} Adet</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kritik Stok</p>
              <h3 className="text-2xl font-bold">{lowStock.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Son Hareketler</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('reports')}>Tümünü Gör</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">Müşteri / Tip</th>
                  <th className="px-6 py-3">İşlem</th>
                  <th className="px-6 py-3 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.transactions.slice(0, 5).map((t) => {
                    const customerName = t.customer_id 
                        ? (stats.customers.find(c => c.id === t.customer_id)?.name || 'Bilinmeyen') 
                        : 'Fabrika Girişi';
                    const itemCount = t.items ? t.items.length : 0;
                    return (
                        <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{customerName}</td>
                            <td className="px-6 py-3 text-gray-500">{itemCount} kalem ürün</td>
                            <td className="px-6 py-3 text-right font-medium">₺{t.total_amount.toLocaleString()}</td>
                        </tr>
                    );
                })}
                {stats.transactions.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Henüz işlem yapılmamış.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Stok Durumu</h3>
          <div className="space-y-4">
            {stats.stock.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                    Henüz ürün eklenmemiş.
                </div>
            ) : (
                stats.stock.slice(0, 6).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-800 truncate w-40">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.type}</p>
                        </div>
                        <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                product.stock < 20 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                                {product.stock} Adet
                            </span>
                        </div>
                    </div>
                ))
            )}
             <Button variant="secondary" className="w-full mt-2" onClick={() => onNavigate('inventory')}>Stok Yönetimine Git</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
