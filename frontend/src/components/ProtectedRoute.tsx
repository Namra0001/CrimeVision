import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, token, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login page
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but missing required role -> Show Access Denied
  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-background rounded-lg border border-border mt-8">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You do not have the required clearance to access this module. If you believe this is an error, contact KSP IT Support.
        </p>
      </div>
    );
  }

  // Authorized -> render the child routes
  return <Outlet />;
}
