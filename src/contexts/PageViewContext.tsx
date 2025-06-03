import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type PageViewContextType = {
  pageViews: number;
  incrementPageView: () => void;
  resetPageViews: () => void;
};

const PageViewContext = createContext<PageViewContextType | undefined>(undefined);

export const PageViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageViews, setPageViews] = useState(0);
  const location = useLocation();

  // Load page views from localStorage on initial render
  useEffect(() => {
    const savedPageViews = localStorage.getItem('pageViews');
    if (savedPageViews) {
      setPageViews(parseInt(savedPageViews, 10));
    }
  }, []);

  // Save page views to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pageViews', pageViews.toString());
  }, [pageViews]);

  // Increment page view when location changes
  useEffect(() => {
    // Don't increment for certain paths
    const excludedPaths = ['/login', '/signup', '/profile'];
    if (!excludedPaths.some(path => location.pathname.startsWith(path))) {
      setPageViews(prev => {
        const newCount = prev + 1;
        localStorage.setItem('pageViews', newCount.toString());
        return newCount;
      });
    }
  }, [location.pathname]);

  const incrementPageView = () => {
    setPageViews(prev => prev + 1);
  };

  const resetPageViews = () => {
    setPageViews(0);
    localStorage.removeItem('pageViews');
  };

  return (
    <PageViewContext.Provider value={{ pageViews, incrementPageView, resetPageViews }}>
      {children}
    </PageViewContext.Provider>
  );
};

export const usePageView = () => {
  const context = useContext(PageViewContext);
  if (context === undefined) {
    throw new Error('usePageView must be used within a PageViewProvider');
  }
  return context;
};
