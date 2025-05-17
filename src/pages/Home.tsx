import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LEAGUES = [
  { id: 'nba', name: 'NBA', icon: '🏀', bg: 'bg-blue-600', description: 'Basketball predictions with celestial insights' },
  { id: 'mlb', name: 'MLB', icon: '⚾', bg: 'bg-green-600', description: 'Baseball analysis under the stars' },
  { id: 'nfl', name: 'NFL', icon: '🏈', bg: 'bg-red-600', description: 'Football forecasts aligned with the cosmos' },
  { id: 'boxing', name: 'Boxing', icon: '🥊', bg: 'bg-purple-600', description: 'Fight night predictions by the moon' },
  { id: 'soccer', name: 'Soccer', icon: '⚽', bg: 'bg-yellow-600', description: 'Coming soon - The world\'s game, cosmic style', comingSoon: true },
  { id: 'ncaa', name: 'NCAA Football', icon: '🏈', bg: 'bg-indigo-600', description: 'Coming soon - College football with cosmic wisdom', comingSoon: true },
];

import AstroSummaryBanner from '@/components/AstroSummaryBanner';
import AstroStatus from '@/components/AstroStatus';
import NextEventCount from '@/components/NextEventCount';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc2674?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1910&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Full Moon Odds
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Where celestial alignments meet sports analytics for smarter betting decisions
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              <Link to="/dashboard">
                View Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10">
              <Link to="/league/nba">
                Explore Leagues
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Leagues Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
            Featured Leagues
          </span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LEAGUES.map((league) => (
            <div 
              key={league.id} 
              className={`relative rounded-xl overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-105 ${
                league.comingSoon ? 'opacity-70' : 'hover:shadow-2xl'
              }`}
            >
              <div className={`h-2 ${league.bg}`}></div>
              <div className="p-6 bg-gray-800">
                <div className="flex items-center mb-4">
                  <span className="text-4xl mr-3">{league.icon}</span>
                  <h3 className="text-2xl font-bold">{league.name}</h3>
                </div>
                <p className="text-gray-300 mb-6">{league.description}</p>
                <Button 
                  asChild 
                  variant={league.comingSoon ? 'outline' : 'default'}
                  className={`w-full ${
                    league.comingSoon 
                      ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 cursor-not-allowed' 
                      : 'bg-yellow-500 hover:bg-yellow-600 text-black font-bold'
                  }`}
                  disabled={league.comingSoon}
                >
                  <Link to={league.comingSoon ? '#' : `/league/${league.id}`}>
                    {league.comingSoon ? 'Coming Soon' : 'View League'}
                  </Link>
                </Button>
              </div>
              {league.comingSoon && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
              Why Choose Full Moon Odds?
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6 bg-gray-750 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center text-2xl">
                🌟
              </div>
              <h3 className="text-xl font-bold mb-2">Celestial Insights</h3>
              <p className="text-gray-400">
                Our proprietary algorithm analyzes planetary alignments to predict game outcomes with uncanny accuracy.
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-750 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center text-2xl">
                📊
              </div>
              <h3 className="text-xl font-bold mb-2">Data-Driven</h3>
              <p className="text-gray-400">
                We combine traditional sports analytics with astrological data for the most comprehensive predictions.
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-750 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center text-2xl">
                🔮
              </div>
              <h3 className="text-xl font-bold mb-2">Future-Proof</h3>
              <p className="text-gray-400">
                Our models continuously learn and adapt to changing cosmic and athletic conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-yellow-900/30 to-orange-900/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Game?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of bettors who trust the stars to guide their wagers.
          </p>
          <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-6">
            <Link to="/dashboard">
              Start Betting with the Stars
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
