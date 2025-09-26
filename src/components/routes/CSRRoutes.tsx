import React from 'react';
import { Routes, Route } from 'react-router-dom';

const CSDashboard = React.lazy(() => import('@/components/dashboard/CSDashboard'));

const CSRRoutes = () => (
  <Routes>
    <Route path="" element={<CSDashboard />} />
    {/* Add more CS routes here */}
  </Routes>
);

export default CSRRoutes;
