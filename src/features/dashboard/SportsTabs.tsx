import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sport } from '@/types';

interface SportsTabsProps {
  activeSport: Sport;
  onSportChange: (sport: Sport) => void;
  children: React.ReactNode;
}

const sports: { id: Sport; name: string; comingSoon?: boolean }[] = [
  { id: 'nba', name: 'NBA' },
  { id: 'mlb', name: 'MLB' },
  { id: 'nfl', name: 'NFL' },
  { id: 'boxing', name: 'Boxing' },
  { id: 'soccer', name: 'Soccer', comingSoon: true },
  { id: 'ncaa', name: 'NCAA FB', comingSoon: true },
];

const SportsTabs: React.FC<SportsTabsProps> = ({ 
  activeSport, 
  onSportChange,
  children 
}) => {
  const navigate = useNavigate();

  const handleSportChange = (sport: Sport) => {
    onSportChange(sport);
    // Update URL without page reload
    navigate(`/dashboard?sport=${sport}`, { replace: true });
  };

  // Map sports to their respective icons
  const SportIcon = ({ sport }: { sport: Sport }) => {
    switch (sport) {
      case 'nba':
        return <Basketball className="h-5 w-5" />;
      case 'nfl':
        return <Football className="h-5 w-5" />;
      case 'boxing':
        return <BoxingGlove className="h-5 w-5" />;
      case 'mlb':
        return <Baseball className="h-5 w-5" />;
      case 'soccer':
        return <Soccer className="h-5 w-5" />;
      case 'ncaa':
        return <Football className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Tabs 
      value={activeSport} 
      onValueChange={(value) => handleSportChange(value as Sport)}
      className="w-full"
    >
      <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-3 md:grid-cols-6 mb-8">
        {sports.map((sport) => (
          <TabsTrigger 
            key={sport.id} 
            value={sport.id}
            disabled={sport.comingSoon}
            className="flex gap-2 items-center"
          >
            <SportIcon sport={sport.id} />
            <span>{sport.name}</span>
            {sport.comingSoon && (
              <span className="text-xs bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded-full">
                Soon
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      
      <TabsContent value={activeSport}>
        {children}
      </TabsContent>
    </Tabs>
  );
};

// Custom SVG icons for sports
const Basketball = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M4.93 4.93c4.03 4.03 10.18 10.18 14.14 14.14" />
    <path d="M19.07 4.93C15.04 8.96 8.89 15.1 4.93 19.07" />
    <path d="M2 12h20" />
    <path d="M12 2v20" />
  </svg>
);

const Football = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="12" rx="10" ry="7" />
    <path d="M2 12h20" />
    <path d="M12 5v14" />
    <path d="M6 8l12 8" />
    <path d="M18 8 6 16" />
  </svg>
);

// Reuse the existing BoxingGlove SVG component
const BoxingGlove = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8.5 2a3.5 3.5 0 0 0-3.5 3.5V12a6 6 0 0 0 6 6 6 6 0 0 0 6-6V5.5A3.5 3.5 0 0 0 13.5 2h-5Z" />
    <path d="M16 2c1.7 0 3 1.3 3 3v14.5a2.5 2.5 0 0 1-2.5 2.5 2.5 2.5 0 0 1-2.5-2.5v-.5" />
  </svg>
);

// Reuse the existing Baseball SVG component
const Baseball = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5.5 2.5c1.5 1 3 1.5 3 8.5 0 7-3 9-3 9" />
    <path d="M12 21c.5 0 4.5-1.5 4.5-7.5S12 5.5 9 3" />
    <path d="M18.5 2.5c1 .5 3 1 3 9s-2 9.5-3 10" />
  </svg>
);

const Soccer = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a27.26 27.26 0 0 0 3 13.91A27.26 27.26 0 0 0 12 22" />
    <path d="M12 22a27.26 27.26 0 0 1-3-13.91A27.26 27.26 0 0 1 12 2" />
    <path d="M2 12h20" />
  </svg>
);

export default SportsTabs;
