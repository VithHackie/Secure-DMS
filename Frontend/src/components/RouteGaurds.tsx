import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const auth = useContext(AuthContext);
  // If no token, redirect to the registration/login page
  return auth?.token ? <Outlet /> : <Navigate to="/reg" replace />;
};

export const PublicRoute = () => {
  const auth = useContext(AuthContext);
  // If a token exists, redirect to the protected Home page
  return !auth?.token ? <Outlet /> : <Navigate to="/" replace />;
};