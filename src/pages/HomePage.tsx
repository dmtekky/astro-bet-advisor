import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Welcome to Astro Bet Advisor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/league/nba">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏀</span>
                NBA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View NBA teams, players, and upcoming games
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/league/mlb">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚾</span>
                MLB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View MLB teams, players, and upcoming games
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default HomePage; 