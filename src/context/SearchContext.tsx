import React, { createContext, useContext, ReactNode } from 'react';
// Comment out router hooks for now
// import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const SearchProvider = ({ children }: { children: ReactNode }) => {
  // Minimal hardcoded values
  const searchQuery = "test";
  const setSearchQuery = (query: string) => { console.log("setSearchQuery called with:", query); };
  const handleSearch = (query: string) => { console.log("handleSearch called with:", query); };

  const contextValue: SearchContextType = {
    searchQuery,
    setSearchQuery,
    handleSearch,
  };

  console.log("SearchProvider rendering, contextValue:", contextValue); // For debugging

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

// Making SearchProvider the default export, as it's common for providers.
// If it was named export before, this might require adjustments where it's imported.
export default SearchProvider;
