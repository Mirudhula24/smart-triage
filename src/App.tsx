import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Auth from "./pages/Auth";
import ChatbotTriage from "./pages/ChatbotTriage";
import PatientIntake from "./pages/PatientIntake";
import TriageResults from "./pages/TriageResults";
import CaseSummary from "./pages/CaseSummary";
import PriorityQueue from "./pages/PriorityQueue";
import PatientCases from "./pages/PatientCases";
import AlertsFlags from "./pages/AlertsFlags";
import WorkloadAnalytics from "./pages/WorkloadAnalytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function RoleBasedRedirect() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect based on role
  if (userRole === 'healthcare_staff') {
    return <Navigate to="/queue" replace />;
  }
  
  return <Navigate to="/triage" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirects based on auth status and role */}
      <Route path="/" element={<RoleBasedRedirect />} />
      
      {/* Auth */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Patient Routes */}
      <Route path="/triage" element={<ChatbotTriage />} />
      <Route path="/intake" element={<PatientIntake />} />
      <Route path="/results" element={<TriageResults />} />
      <Route path="/case-summary" element={<CaseSummary />} />
      
      {/* Healthcare Staff Routes */}
      <Route path="/queue" element={<PriorityQueue />} />
      <Route path="/patient-cases" element={<PatientCases />} />
      <Route path="/alerts" element={<AlertsFlags />} />
      <Route path="/analytics" element={<WorkloadAnalytics />} />
      
      {/* Shared Routes */}
      <Route path="/settings" element={<Settings />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
