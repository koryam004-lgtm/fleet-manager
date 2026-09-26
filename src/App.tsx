import { useState } from 'react';
import { Layout, type PageKey } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { VehiclesPage } from '@/pages/VehiclesPage';
import { DriversPage } from '@/pages/DriversPage';
import { ChecklistsPage } from '@/pages/ChecklistsPage';
import { AnomaliesPage } from '@/pages/AnomaliesPage';
import { HistoryPage } from '@/pages/HistoryPage';

function App() {
  const [page, setPage] = useState<PageKey>('dashboard');

  return (
    <Layout current={page} onNavigate={setPage}>
      {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
      {page === 'vehicles' && <VehiclesPage />}
      {page === 'drivers' && <DriversPage />}
      {page === 'checklists' && <ChecklistsPage />}
      {page === 'anomalies' && <AnomaliesPage />}
      {page === 'history' && <HistoryPage />}
    </Layout>
  );
}

export default App;
