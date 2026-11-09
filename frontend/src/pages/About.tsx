import React from 'react';
import { Navigate } from 'react-router-dom';

export const About: React.FC = () => {
  return <Navigate to="/app" replace />;
};
