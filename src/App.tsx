import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { EmergencyProvider } from "@/contexts/EmergencyContext";

// Pages
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Messages from "./pages/Messages";
import Security from "./pages/Security";
import SafeModes from "./pages/SafeModes";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import TorAnalysis from "./pages/TorAnalysis";
import SecurityControlsTest from "./pages/SecurityControlsTest";
import NotFound from "./pages/NotFound";

// Role-based protection
import { RoleProtectedRoute } from "./components/auth/RoleProtectedRoute";

const queryClient = new QueryClient();

/* =========================
   🔐 AUTH PROTECTED ROUTE
========================= */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dashboard-main bg-cover bg-center flex items-center justify-center">
        <div className="text-center backdrop-blur-md bg-black/50 p-6 rounded-xl border border-white/10">
          <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-chameleon-purple to-chameleon-blue flex items-center justify-center mb-4 animate-pulse">
            <span className="text-xl font-bold text-primary-foreground">
              PC
            </span>
          </div>
          <p className="text-muted-foreground">Loading secure session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

/* =========================
   🧭 ROUTES
========================= */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/auth" element={<Auth />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute requiredPermission="canAccessSecurityCenter">
              <Security />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/safe-modes"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute requiredPermission="canAccessSafeModes">
              <SafeModes />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute requiredPermission="canAccessSettings">
              <Settings />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tor-analysis"
        element={
          <ProtectedRoute>
            <TorAnalysis />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security-test"
        element={
          <ProtectedRoute>
            <SecurityControlsTest />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/* =========================
   🌌 APP ROOT WITH BACKGROUND
========================= */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SecurityProvider>
        <EmergencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            {/* GLOBAL BACKGROUND */}
            <div className="min-h-screen bg-dashboard-main bg-cover bg-center bg-no-repeat bg-fixed">
              {/* Dark glass overlay for readability */}
              <div className="min-h-screen bg-black/60 backdrop-blur-xs">
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </div>
            </div>
          </TooltipProvider>
        </EmergencyProvider>
      </SecurityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
