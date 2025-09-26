import React from 'react';
import { Routes, Route } from 'react-router-dom';

const SuperAdminDashboard = React.lazy(() => import('@/components/dashboard/SuperAdminDashboard'));

const SuperAdminRoutes = () => (
  <Routes>
    <Route path="" element={<SuperAdminDashboard />} />
    {/* Add more super admin routes here */}
  </Routes>
);

export default SuperAdminRoutes;
