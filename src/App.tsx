import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPortal from "./pages/LoginPortal";
import EnhancedLoginPortal from "./pages/enhanced/LoginPortal";
import Register from "./pages/Register";
import ApplicantDashboard from "./pages/applicant/ApplicantDashboard";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard";
import AuditorDashboard from "./pages/auditor/AuditorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPortal />} />
        <Route path="/login-enhanced" element={<EnhancedLoginPortal />} />
          <Route path="/register" element={<Register />} />
          <Route path="/applicant/dashboard" element={
            <ProtectedRoute requiredRole="applicant">
              <ApplicantDashboard />
            </ProtectedRoute>
          } />
          <Route path="/reviewer/dashboard" element={
            <ProtectedRoute requiredRole="reviewer">
              <ReviewerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/auditor/dashboard" element={
            <ProtectedRoute requiredRole="auditor">
              <AuditorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
