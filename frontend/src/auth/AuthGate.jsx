import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const AuthGate = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};