import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeaguesOpen, setIsLeaguesOpen] = useState(false);
  const location = useLocation();
  
  // Keep leagues menu open if we're on a league page
  useEffect(() => {
    setIsLeaguesOpen(location.pathname.startsWith('/league/'));
  }, [location]);

  const leagues = [
    { id: 'nba', name: 'NBA', icon: '🏀' },
    { id: 'mlb', name: 'MLB', icon: '⚾' },
    { id: 'nfl', name: 'NFL', icon: '🏈' },
    { id: 'boxing', name: 'Boxing', icon: '🥊' },
    { id: 'soccer', name: 'Soccer', icon: '⚽', comingSoon: true },
    { id: 'ncaa', name: 'NCAA Football', icon: '🏈', comingSoon: true },
  ];

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/upcoming-games', label: 'Games' },
  ];

  return (
    <header className="bg-gray-900 text-white shadow-lg fixed w-full z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xl">
              🌕
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Full Moon Odds
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === link.to
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Leagues Dropdown */}
            <div className="relative group">
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  location.pathname.startsWith('/league/')
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                aria-expanded={isLeaguesOpen}
                aria-haspopup="true"
              >
                Leagues
                <span className={`ml-1 transition-transform ${isLeaguesOpen ? 'transform rotate-180' : ''}`}>▼</span>
              </button>
              
              <div 
                className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 ${
                  isLeaguesOpen ? 'block' : 'hidden group-hover:block'
                } z-50`}
              >
                <div className="py-1">
                  {leagues.map((league) => (
                    <Link
                      key={league.id}
                      to={league.comingSoon ? '#' : `/league/${league.id}`}
                      className={`block px-4 py-2 text-sm ${
                        league.comingSoon 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : location.pathname === `/league/${league.id}`
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      onClick={(e) => {
                        if (league.comingSoon) {
                          e.preventDefault();
                        } else {
                          setIsLeaguesOpen(true);
                        }
                      }}
                    >
                      <span className="mr-2">{league.icon}</span>
                      {league.name}
                      {league.comingSoon && <span className="ml-2 text-xs text-yellow-400">(Coming Soon)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === link.to
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Leagues
                </h3>
                <div className="mt-2 space-y-1">
                  {leagues.map((league) => (
                    <Link
                      key={league.id}
                      to={league.comingSoon ? '#' : `/league/${league.id}`}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        league.comingSoon
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      onClick={(e) => {
                        if (league.comingSoon) {
                          e.preventDefault();
                        } else {
                          setIsMenuOpen(false);
                        }
                      }}
                    >
                      <span className="mr-2">{league.icon}</span>
                      {league.name}
                      {league.comingSoon && <span className="ml-2 text-xs text-yellow-400">(Coming Soon)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
