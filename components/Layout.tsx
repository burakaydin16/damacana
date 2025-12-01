import React from 'react';
import { LayoutDashboard, Users, Package, ArrowRightLeft, PieChart, Sparkles, Droplets } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stok & Ürünler', icon: Package },
    { id: 'customers', label: 'Bayiler & Cari', icon: Users },
    { id: 'transactions', label: 'Hareket Ekle', icon: ArrowRightLeft },
    { id: 'reports', label: 'Raporlar', icon: PieChart },
    { id: 'ai', label: 'Akıllı Asistan', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-water-500 p-2 rounded-lg">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">SuTakip</h1>
            <p className="text-xs text-slate-400">Distribütör Paneli</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPage === item.id 
                  ? 'bg-water-600 text-white shadow-lg shadow-water-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400">Bulut Bağlantısı</p>
            <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
                 <p className="text-sm font-semibold">Supabase Aktif</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Droplets className="w-6 h-6 text-water-600" />
                <span className="font-bold">SuTakip</span>
            </div>
            <select 
                value={currentPage} 
                onChange={(e) => onNavigate(e.target.value)}
                className="bg-gray-100 border-none rounded p-2 text-sm"
            >
                {navItems.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};