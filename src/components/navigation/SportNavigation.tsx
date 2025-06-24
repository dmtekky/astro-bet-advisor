import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sport } from '@/types';

interface SportNavigationProps {
  className?: string;
  isHeader?: boolean;
}

const sports: { id: Sport; name: string; icon: string; comingSoon?: boolean }[] = [
  { id: 'nba', name: 'NBA', icon: '🏀' },
  { id: 'mlb', name: 'MLB', icon: '⚾' },
  { id: 'nfl', name: 'NFL', icon: '🏈', comingSoon: true },
  { id: 'boxing', name: 'Boxing', icon: '🥊', comingSoon: true },
  { id: 'soccer', name: 'Soccer', icon: '⚽', comingSoon: true },
  { id: 'ncaa', name: 'NCAA FB', icon: '🏈', comingSoon: true },
  { id: 'nhl', name: 'NHL', icon: '🏒', comingSoon: true },
];

const SportNavigation: React.FC<SportNavigationProps> = ({ className = '', isHeader = false }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav className={`${className} ${isHeader ? 'hidden md:flex' : ''}`}>
      <ul className={`flex ${isHeader ? 'space-x-6' : 'flex-wrap justify-center gap-4'}`}>
        {sports.map((sport) => {
          const isActive = isDashboard && new URLSearchParams(location.search).get('sport') === sport.id;
          
          return (
            <li key={sport.id}>
              <Link
                to={`/dashboard?sport=${sport.id}`}
                className={`relative flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                } ${sport.comingSoon ? 'opacity-60' : ''}`}
                onClick={(e) => {
                  if (sport.comingSoon) {
                    e.preventDefault();
                  }
                }}
              >
                <span className="text-lg">{sport.icon}</span>
                {isHeader && (
                  <div className="flex items-center">
                    <span>{sport.name}</span>
                    {sport.comingSoon && (
                      <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SportNavigation;
