import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  useEffect(() => {
    DataService.getTransactions().then(setTransactions);
  }, []);

  const salesData = transactions
    .slice(0, 10)
    .reverse()
    .map(t => ({
        date: new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit'}),
        amount: t.totalAmount
    }));

  const transactionsByType = [
      { name: 'Satış/Çıkış', value: transactions.reduce((acc, t) => acc + t.items.filter(i => i.type === 'Gonderilen').length, 0) },
      { name: 'İade/Giriş', value: transactions.reduce((acc, t) => acc + t.items.filter(i => i.type === 'IadeAlinan').length, 0) }
  ];

  const COLORS = ['#0ea5e9', '#22c55e'];

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Raporlar ve Analizler</h2>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold mb-6 text-gray-700">Son İşlem Hacimleri (TL)</h3>
               <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={salesData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="date" />
                           <YAxis />
                           <Tooltip />
                           <Bar dataKey="amount" fill="#0284c7" radius={[4, 4, 0, 0]} />
                       </BarChart>
                   </ResponsiveContainer>
               </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold mb-6 text-gray-700">İşlem Dağılımı</h3>
               <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                           <Pie
                               data={transactionsByType}
                               cx="50%"
                               cy="50%"
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                           >
                               {transactionsByType.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                               ))}
                           </Pie>
                           <Tooltip />
                       </PieChart>
                   </ResponsiveContainer>
                   <div className="flex justify-center gap-4 mt-4">
                       {transactionsByType.map((entry, index) => (
                           <div key={index} className="flex items-center gap-2 text-sm">
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                               <span>{entry.name} ({entry.value})</span>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       </div>

       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold mb-4 text-gray-700">İşlem Geçmişi</h3>
           <div className="overflow-x-auto">
               <table className="w-full text-sm">
                   <thead className="bg-gray-50 text-gray-500">
                       <tr>
                           <th className="px-4 py-3 text-left">Tarih</th>
                           <th className="px-4 py-3 text-left">Tutar</th>
                           <th className="px-4 py-3 text-left">Kalem Adedi</th>
                       </tr>
                   </thead>
                   <tbody>
                       {transactions.map(t => (
                           <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                               <td className="px-4 py-3">{new Date(t.date).toLocaleString()}</td>
                               <td className="px-4 py-3 font-bold">₺{t.totalAmount}</td>
                               <td className="px-4 py-3">{t.items.length}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};