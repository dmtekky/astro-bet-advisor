import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

type SearchContextType = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (query: string) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize search query from URL on component mount and when search params change
  useEffect(() => {
    const query = searchParams.get('q') || '';
    if (query !== searchQuery) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const updateUrl = (query: string) => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query.trim());
      // Always navigate to search results page with the query
      navigate(`/search?${params.toString()}`);
    } else {
      // If query is empty, navigate to dashboard
      navigate('/dashboard');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateUrl(query);
  };

  const contextValue = React.useMemo(() => ({
    searchQuery,
    setSearchQuery,
    handleSearch
  }), [searchQuery, setSearchQuery, handleSearch]);

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
