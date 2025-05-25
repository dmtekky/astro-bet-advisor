import { createRoot } from 'react-dom/client';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { TooltipProvider } from '@/components/ui/tooltip';
// import { Toaster } from '@/components/ui/toaster';
// import { Toaster as Sonner } from '@/components/ui/sonner';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* <TooltipProvider> */}
      <>
        {/* <Toaster /> */}
        {/* <Sonner /> */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </>
      {/* </TooltipProvider> */}
    </QueryClientProvider>
  </React.StrictMode>
);
