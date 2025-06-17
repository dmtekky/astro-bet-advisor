import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExampleProfilePage: React.FC = () => {
  // Mock user data
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    bio: 'Sports enthusiast and betting analyst. Love analyzing games and finding value in the odds. Big fan of basketball and baseball.',
    stats: {
      predictions: 128,
      accuracy: '74%',
      followers: 245,
      following: 156,
    },
    favoriteTeams: [
      { id: 1, name: 'Los Angeles Lakers', sport: 'NBA' },
      { id: 2, name: 'New York Yankees', sport: 'MLB' },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Profile Header */}
          <Card className="bg-slate-800/50 border-slate-700 flex-1">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-purple-500/50">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-purple-600 text-2xl">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    {user.name}
                  </h1>
                  <p className="text-slate-400 mt-1">{user.email}</p>
                  <div className="flex gap-4 mt-4 justify-center md:justify-start">
                    <Button variant="outline" className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/70">
                      Follow
                    </Button>
                    <Button variant="outline" className="bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30 text-purple-300">
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{user.bio}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatCard label="Predictions" value={user.stats.predictions} />
                <StatCard label="Accuracy" value={user.stats.accuracy} />
                <StatCard label="Followers" value={user.stats.followers} />
                <StatCard label="Following" value={user.stats.following} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700 rounded-lg p-1 mb-6">
            <TabsTrigger value="predictions" className="data-[state=active]:bg-slate-700/50 data-[state=active]:text-white rounded-md">
              Predictions
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700/50 data-[state=active]:text-white rounded-md">
              Activity
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-slate-700/50 data-[state=active]:text-white rounded-md">
              Favorites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl">Recent Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PredictionItem 
                    game="LAL @ BOS" 
                    prediction="Lakers +5.5" 
                    status="won"
                    odds="+110"
                    date="2 days ago"
                  />
                  <PredictionItem 
                    game="NYY @ HOU" 
                    prediction="Over 8.5 runs" 
                    status="pending"
                    odds="-120"
                    date="1 day ago"
                  />
                  <PredictionItem 
                    game="GSW @ PHX" 
                    prediction="Warriors ML" 
                    status="lost"
                    odds="-150"
                    date="3 days ago"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ActivityItem 
                    type="prediction"
                    text="Posted a new prediction for LAL @ BOS"
                    time="2 hours ago"
                  />
                  <ActivityItem 
                    type="follow"
                    text="Started following @bettingpro"
                    time="5 hours ago"
                  />
                  <ActivityItem 
                    type="like"
                    text="Liked a prediction by @sportsexpert"
                    time="1 day ago"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl">Favorite Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.favoriteTeams.map((team) => (
                    <div key={team.id} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-slate-600/50 flex items-center justify-center">
                        <span className="text-xl">{team.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-slate-400">{team.sport}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-slate-800/30 p-4 rounded-lg text-center">
    <div className="text-2xl font-bold text-purple-400">{value}</div>
    <div className="text-sm text-slate-400 mt-1">{label}</div>
  </div>
);

const PredictionItem = ({ game, prediction, status, odds, date }: { 
  game: string; 
  prediction: string; 
  status: 'won' | 'lost' | 'pending';
  odds: string;
  date: string;
}) => {
  const statusColors = {
    won: 'bg-green-500/20 text-green-400',
    lost: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
      <div>
        <h4 className="font-medium">{game}</h4>
        <p className="text-slate-400 text-sm">{prediction} • {odds}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span className="text-slate-500 text-sm">{date}</span>
      </div>
    </div>
  );
};

const ActivityItem = ({ type, text, time }: { type: string; text: string; time: string }) => {
  const icons = {
    prediction: '📊',
    follow: '👥',
    like: '❤️',
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
      <div className="text-2xl">{icons[type as keyof typeof icons] || '📝'}</div>
      <div className="flex-1">
        <p className="text-sm">{text}</p>
        <p className="text-xs text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
};

export default ExampleProfilePage;
