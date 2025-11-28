import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Product, Transaction, Customer } from '../types';
import { TrendingUp, AlertTriangle, Package, Wallet, DollarSign, Euro, RefreshCw, Download, Database } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { db } from '../db';

interface DashboardProps {
    onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    stock: [] as Product[],
    transactions: [] as Transaction[],
    customers: [] as Customer[],
  });

  const [rates, setRates] = useState<{usd: number, eur: number} | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        const stock = await DataService.getProducts();
        const transactions = await DataService.getTransactions();
        const customers = await DataService.getCustomers();
        
        setStats({ stock, transactions, customers });
    };
    loadData();

    // Load Exchange Rates
    fetchRates();
  }, []);

  const fetchRates = async () => {
      try {
          setLoadingRates(true);
          const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.tcmb.gov.tr/kurlar/today.xml'));
          
          if (!response.ok) throw new Error('Proxy response was not ok');
          
          const data = await response.json();
          const text = data.contents;
          
          if (!text) throw new Error('XML content is empty');

          const parser = new DOMParser();
          const xml = parser.parseFromString(text, "text/xml");

          const getRate = (code: string) => {
              const el = xml.querySelector(`Currency[Kod="${code}"] > ForexSelling`);
              return el ? parseFloat(el.textContent || '0') : 0;
          };

          const usd = getRate('USD');
          const eur = getRate('EUR');

          if (usd === 0 || eur === 0) throw new Error("Parsed rates are zero");

          setRates({ usd, eur });
      } catch (error) {
          console.error("Döviz kuru alınamadı:", error);
          setRates(null);
      } finally {
          setLoadingRates(false);
      }
  };

  const handleBackup = async () => {
      try {
          // Tüm veritabanını çek
          const exportData = {
              products: await db.products.toArray(),
              customers: await db.customers.toArray(),
              transactions: await db.transactions.toArray(),
              exportDate: new Date().toISOString()
          };

          // Blob oluştur
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          // İndirme linki oluştur ve tıkla
          const a = document.createElement('a');
          a.href = url;
          a.download = `su_takip_yedek_${new Date().toLocaleDateString()}.json`;
          document.body.appendChild(a);
          a.click();
          
          // Temizlik
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (error) {
          console.error("Yedek alma hatası:", error);
          alert("Yedek oluşturulurken bir hata oluştu.");
      }
  };

  const handleSqlExport = async () => {
    try {
        const products = await db.products.toArray();
        const customers = await db.customers.toArray();
        const transactions = await db.transactions.toArray();

        let sql = `-- MSSQL (T-SQL) Schema and Data Export for Su Takip Sistemi\n`;
        sql += `-- Generated on ${new Date().toLocaleString()}\n\n`;

        // MSSQL Helper to escape strings
        const escape = (str: string) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';

        // 1. Tables DDL
        
        // Products
        sql += `IF OBJECT_ID('dbo.Products', 'U') IS NULL\n`;
        sql += `CREATE TABLE [dbo].[Products] (\n`;
        sql += `    [Id] NVARCHAR(50) PRIMARY KEY,\n`;
        sql += `    [Name] NVARCHAR(255) NOT NULL,\n`;
        sql += `    [Type] NVARCHAR(50) NOT NULL,\n`;
        sql += `    [Price] DECIMAL(10, 2) DEFAULT 0,\n`;
        sql += `    [DepositPrice] DECIMAL(10, 2) DEFAULT 0,\n`;
        sql += `    [Stock] INT DEFAULT 0,\n`;
        sql += `    [LinkedDepositId] NVARCHAR(50)\n`;
        sql += `);\nGO\n\n`;

        // Customers
        sql += `IF OBJECT_ID('dbo.Customers', 'U') IS NULL\n`;
        sql += `CREATE TABLE [dbo].[Customers] (\n`;
        sql += `    [Id] NVARCHAR(50) PRIMARY KEY,\n`;
        sql += `    [Name] NVARCHAR(255) NOT NULL,\n`;
        sql += `    [Type] NVARCHAR(50) NOT NULL,\n`;
        sql += `    [Phone] NVARCHAR(50),\n`;
        sql += `    [Address] NVARCHAR(MAX),\n`;
        sql += `    [CashBalance] DECIMAL(12, 2) DEFAULT 0\n`;
        sql += `);\nGO\n\n`;

        // Customer Deposit Balances
        sql += `IF OBJECT_ID('dbo.CustomerDepositBalances', 'U') IS NULL\n`;
        sql += `CREATE TABLE [dbo].[CustomerDepositBalances] (\n`;
        sql += `    [CustomerId] NVARCHAR(50) FOREIGN KEY REFERENCES [dbo].[Customers]([Id]) ON DELETE CASCADE,\n`;
        sql += `    [ProductId] NVARCHAR(50) FOREIGN KEY REFERENCES [dbo].[Products]([Id]) ON DELETE CASCADE,\n`;
        sql += `    [Quantity] INT DEFAULT 0,\n`;
        sql += `    PRIMARY KEY ([CustomerId], [ProductId])\n`;
        sql += `);\nGO\n\n`;

        // Transactions
        sql += `IF OBJECT_ID('dbo.Transactions', 'U') IS NULL\n`;
        sql += `CREATE TABLE [dbo].[Transactions] (\n`;
        sql += `    [Id] NVARCHAR(50) PRIMARY KEY,\n`;
        sql += `    [Date] DATETIME2 NOT NULL,\n`;
        sql += `    [CustomerId] NVARCHAR(50) FOREIGN KEY REFERENCES [dbo].[Customers]([Id]) ON DELETE SET NULL,\n`;
        sql += `    [TotalAmount] DECIMAL(12, 2) DEFAULT 0,\n`;
        sql += `    [Notes] NVARCHAR(MAX),\n`;
        sql += `    [Type] NVARCHAR(50) NOT NULL\n`;
        sql += `);\nGO\n\n`;

        // Transaction Items
        sql += `IF OBJECT_ID('dbo.TransactionItems', 'U') IS NULL\n`;
        sql += `CREATE TABLE [dbo].[TransactionItems] (\n`;
        sql += `    [Id] INT IDENTITY(1,1) PRIMARY KEY,\n`;
        sql += `    [TransactionId] NVARCHAR(50) FOREIGN KEY REFERENCES [dbo].[Transactions]([Id]) ON DELETE CASCADE,\n`;
        sql += `    [ProductId] NVARCHAR(50) FOREIGN KEY REFERENCES [dbo].[Products]([Id]),\n`;
        sql += `    [Quantity] INT NOT NULL,\n`;
        sql += `    [Type] NVARCHAR(50) NOT NULL,\n`;
        sql += `    [PriceSnapshot] DECIMAL(10, 2) NOT NULL\n`;
        sql += `);\nGO\n\n`;

        // 2. Insert Data
        
        sql += `-- DATA: Products\n`;
        products.forEach(p => {
            sql += `IF NOT EXISTS (SELECT 1 FROM [dbo].[Products] WHERE [Id] = ${escape(p.id)}) `
            sql += `INSERT INTO [dbo].[Products] ([Id], [Name], [Type], [Price], [DepositPrice], [Stock], [LinkedDepositId]) VALUES (${escape(p.id)}, ${escape(p.name)}, ${escape(p.type)}, ${p.price}, ${p.depositPrice}, ${p.stock}, ${escape(p.linkedDepositId || '')});\n`;
        });
        sql += `\n`;

        sql += `-- DATA: Customers\n`;
        customers.forEach(c => {
            sql += `IF NOT EXISTS (SELECT 1 FROM [dbo].[Customers] WHERE [Id] = ${escape(c.id)}) `
            sql += `INSERT INTO [dbo].[Customers] ([Id], [Name], [Type], [Phone], [Address], [CashBalance]) VALUES (${escape(c.id)}, ${escape(c.name)}, ${escape(c.type)}, ${escape(c.phone)}, ${escape(c.address)}, ${c.cashBalance});\n`;
            
            // Deposit Balances
            Object.entries(c.depositBalances).forEach(([prodId, qty]) => {
                if (qty !== 0) {
                    sql += `IF NOT EXISTS (SELECT 1 FROM [dbo].[CustomerDepositBalances] WHERE [CustomerId] = ${escape(c.id)} AND [ProductId] = ${escape(prodId)}) `;
                    sql += `INSERT INTO [dbo].[CustomerDepositBalances] ([CustomerId], [ProductId], [Quantity]) VALUES (${escape(c.id)}, ${escape(prodId)}, ${qty});\n`;
                }
            });
        });
        sql += `\n`;

        sql += `-- DATA: Transactions\n`;
        transactions.forEach(t => {
            sql += `IF NOT EXISTS (SELECT 1 FROM [dbo].[Transactions] WHERE [Id] = ${escape(t.id)}) `
            sql += `INSERT INTO [dbo].[Transactions] ([Id], [Date], [CustomerId], [TotalAmount], [Notes], [Type]) VALUES (${escape(t.id)}, '${t.date}', ${escape(t.customerId || '')}, ${t.totalAmount}, ${escape(t.notes || '')}, ${escape(t.type)});\n`;
            
            t.items.forEach(item => {
                // TransactionItems has IDENTITY column, so we insert without Id and let SQL generate it
                sql += `INSERT INTO [dbo].[TransactionItems] ([TransactionId], [ProductId], [Quantity], [Type], [PriceSnapshot]) VALUES (${escape(t.id)}, ${escape(item.productId)}, ${item.quantity}, ${escape(item.type)}, ${item.priceSnapshot});\n`;
            });
        });

        // Blob oluştur
        const blob = new Blob([sql], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // İndirme linki oluştur
        const a = document.createElement('a');
        a.href = url;
        a.download = `su_takip_mssql_export.sql`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("SQL Export hatası:", error);
        alert("MSSQL scripti oluşturulurken bir hata oluştu.");
    }
  };

  const lowStock = stats.stock.filter(p => p.stock < 20);
  const totalReceivables = stats.customers.reduce((acc, c) => acc + c.cashBalance, 0);
  
  const totalPendingDeposits = stats.customers.reduce((acc, c) => {
      let total = 0;
      Object.values(c.depositBalances).forEach(v => total += Number(v));
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
            <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-sm">
                {loadingRates ? (
                    <span className="text-gray-400 flex items-center gap-2"><RefreshCw size={14} className="animate-spin"/> Kurlar Yükleniyor...</span>
                ) : rates ? (
                    <>
                        <div className="flex items-center gap-1 text-green-700 font-medium border-r pr-3 border-gray-200">
                            <DollarSign size={14} />
                            <span>{rates.usd.toFixed(4)} ₺</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-700 font-medium">
                            <Euro size={14} />
                            <span>{rates.eur.toFixed(4)} ₺</span>
                        </div>
                    </>
                ) : (
                    <button onClick={fetchRates} className="text-red-400 text-xs hover:text-red-600 flex items-center gap-1">
                        <AlertTriangle size={12} /> Kur Alınamadı
                    </button>
                )}
            </div>

            <Button variant="secondary" onClick={handleSqlExport} title="MSSQL Script İndir">
                <Database size={18} className="mr-2" />
                MSSQL Dışa Aktar
            </Button>

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
                    const customerName = t.customerId 
                        ? (stats.customers.find(c => c.id === t.customerId)?.name || 'Bilinmeyen') 
                        : 'Fabrika Girişi';
                    const itemCount = t.items.length;
                    return (
                        <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{customerName}</td>
                            <td className="px-6 py-3 text-gray-500">{itemCount} kalem ürün</td>
                            <td className="px-6 py-3 text-right font-medium">₺{t.totalAmount.toLocaleString()}</td>
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
            {stats.stock.slice(0, 6).map((product) => (
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
            ))}
             <Button variant="secondary" className="w-full mt-2" onClick={() => onNavigate('inventory')}>Stok Yönetimine Git</Button>
          </div>
        </div>
      </div>
    </div>
  );
};