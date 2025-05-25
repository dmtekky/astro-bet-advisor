import React from 'react';
import { Sport } from '@/types';

interface SportNavigationProps {
  className?: string;
  isHeader?: boolean;
}

const sports: { id: Sport; name: string; icon: string }[] = [
  { id: 'nba', name: 'NBA', icon: '🏀' },
  { id: 'mlb', name: 'MLB', icon: '⚾' },
  { id: 'nfl', name: 'NFL', icon: '🏈' },
  { id: 'boxing', name: 'Boxing', icon: '🥊' },
  { id: 'soccer', name: 'Soccer', icon: '⚽' },
  { id: 'ncaa', name: 'NCAA FB', icon: '🏈' },
];

const SportNavigation: React.FC<SportNavigationProps> = ({ className = '', isHeader = false }) => {
  // Simple check for current path - will work for client-side rendering
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const isDashboard = pathname === '/dashboard';

  return (
    <nav className={`${className} ${isHeader ? 'hidden md:flex' : ''}`}>
      <ul className={`flex ${isHeader ? 'space-x-6' : 'flex-wrap justify-center gap-4'}`}>
        {sports.map((sport) => {
          const isActive = isDashboard && new URLSearchParams(search).get('sport') === sport.id;
          
          return (
            <li key={sport.id}>
              <a
                href={`/dashboard?sport=${sport.id}`}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <span className="text-lg">{sport.icon}</span>
                {isHeader && <span>{sport.name}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SportNavigation;
