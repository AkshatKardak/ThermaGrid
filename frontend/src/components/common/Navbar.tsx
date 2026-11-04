import React from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNavbar } from '../navigation/PublicNavbar';
import { AppNavbar } from '../navigation/AppNavbar';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');

  if (isAppRoute) {
    return <AppNavbar />;
  }

  return <PublicNavbar />;
};
