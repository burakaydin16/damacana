import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Customers } from './pages/Customers';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { AiAssistant } from './pages/AiAssistant';

const App: React.FC = () => {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={setPage} />;
      case 'inventory':
        return <Inventory />;
      case 'customers':
        return <Customers />;
      case 'transactions':
        return <Transactions />;
      case 'reports':
        return <Reports />;
      case 'ai':
        return <AiAssistant />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;