import React from 'react';
import { Routes, Route } from 'react-router-dom';

const CMSDashboard = React.lazy(() => import('@/components/dashboard/CMSDashboard'));

const CMSRoutes = () => (
  <Routes>
    <Route path="" element={<CMSDashboard />} />
    {/* Add more CMS routes here */}
  </Routes>
);

export default CMSRoutes;
