import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchProvider from '../context/SearchContext';
import Dashboard from './Dashboard';

// Create a new QueryClient instance for this component
const queryClient = new QueryClient();

const WrappedDashboard: React.FC = () => {
  console.log("WrappedDashboard: Rendering with SearchProvider");
  
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <Dashboard />
      </SearchProvider>
    </QueryClientProvider>
  );
};

export default WrappedDashboard;
