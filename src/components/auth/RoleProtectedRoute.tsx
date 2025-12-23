import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, RolePermissions } from '@/hooks/usePermissions';
import { Shield, Lock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: keyof RolePermissions;
  fallbackPath?: string;
}

export function RoleProtectedRoute({ 
  children, 
  requiredPermission,
  fallbackPath = '/dashboard'
}: RoleProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const permissions = usePermissions();
  
  if (authLoading || permissions.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-chameleon-purple to-chameleon-blue flex items-center justify-center mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  const hasPermission = permissions[requiredPermission];
  
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-panel p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-xl bg-destructive/20 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page. Contact your administrator if you believe this is an error.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Current role: <span className="font-medium capitalize">{permissions.role || 'Unknown'}</span>
          </p>
          <Link to="/dashboard">
            <Button className="bg-gradient-to-r from-chameleon-purple to-chameleon-blue hover:opacity-90">
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
