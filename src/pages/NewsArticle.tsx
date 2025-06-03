import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MarkdownContent from '../components/MarkdownContent';
import PlayerCardNew from '../components/PlayerCardNew';
import { supabase } from '../lib/supabase';
import { Users, Star } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  image?: string;
  teamHome?: string;
  teamAway?: string;
  score?: {
    home: number;
    away: number;
  };
}

// Interface for players as they exist in the database
interface DbPlayer {
  id: string;
  name: string;
  birth_date: string;
  position: string;
  team_id: string;
  image: string; // This is the headshot URL
  external_id: string;
  stats: any;
  win_shares: number;
  created_at: string;
  updated_at: string;
  sport: string;
}

// Interface for our application's player representation
interface Player {
  id: string;
  player_id?: string; // Added for PlayerCardNew component
  full_name: string;
  headshot_url?: string | null;
  birth_date?: string | null;
  position?: string | null;
  team_id?: string | null;
  impact_score?: number | null;
  astro_influence?: number | null;
  astro_influence_score?: number | null;
  player_zodiac_sign?: string | null;
  linkPath?: string;
}

const NewsArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        if (!slug) {
          throw new Error('Article slug is missing');
        }

        // First, load the index to find the article
        const indexResponse = await fetch('/news/index.json');
        if (!indexResponse.ok) {
          throw new Error('Failed to load news index');
        }
        
        const indexData = await indexResponse.json();
        const articles = indexData.articles || [];
        
        // Find the article with the matching slug
        const articleData = articles.find((a: any) => a.slug === slug);
        
        if (!articleData) {
          throw new Error('Article not found');
        }

        // Load the full article content
        const articleResponse = await fetch(`/news/${slug}.json`);
        if (!articleResponse.ok) {
          throw new Error('Failed to load article content');
        }
        
        const articleContent = await articleResponse.json();
        
        // Combine the data from the index with the full content
        const fullArticle = {
          ...articleData,
          ...articleContent,
          // Ensure we have all required fields
          id: articleData.id || slug,
          title: articleData.title || 'Untitled Article',
          content: articleContent.content || articleData.content || '',
          publishedAt: articleData.publishedAt || articleData.date || new Date().toISOString(),
          teamHome: articleData.teamHome || articleData.home_team || 'Home',
          teamAway: articleData.teamAway || articleData.away_team || 'Away',
          score: typeof articleData.score === 'string' ? parseScore(articleData.score) : 
                (articleData.score || { home: 0, away: 0 })
        };
        
        setArticle(fullArticle);
        document.title = `${fullArticle.title} | Astro Bet Advisor`;
        
        // Extract player names from article content
        extractAndFetchPlayers(fullArticle.content);
      } catch (err: any) {
        console.error('Error fetching article:', err);
        setError(err.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);
  
  // Helper function to parse score strings like "Marlins 0 - Giants 2"
  const parseScore = (scoreStr: string) => {
    if (!scoreStr) return { home: 0, away: 0 };
    const match = scoreStr.match(/(\d+)\s*-\s*(\d+)/);
    return match ? { 
      home: parseInt(match[2].trim(), 10), 
      away: parseInt(match[1].trim(), 10) 
    } : { home: 0, away: 0 };
  };
  
  // Function to extract player names from article content and fetch their data
  const extractAndFetchPlayers = async (content: string) => {
    try {
      setPlayersLoading(true);
      
      // First, create a temporary DOM element to parse the HTML content
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      
      // Extract player names from h3 headers which typically contain player info
      const playerSections = tempElement.querySelectorAll('h3');
      const extractedPlayers: {name: string, team?: string, position?: string}[] = [];
      
      playerSections.forEach(section => {
        const text = section.textContent || '';
        
        // Look for patterns like "Player Name, Team (Position, Zodiac)"
        const playerMatch = text.match(/([\w\s]+),\s*([\w\s]+)\s*\(([\w\s]+),/);
        if (playerMatch) {
          extractedPlayers.push({
            name: playerMatch[1].trim(),
            team: playerMatch[2].trim(),
            position: playerMatch[3].trim()
          });
        } else {
          // Try alternate pattern: "Player Name, Team Name (Position)"
          const altMatch = text.match(/([\w\s]+),\s*([\w\s]+)\s*\(([\w\s]+)\)/);
          if (altMatch) {
            extractedPlayers.push({
              name: altMatch[1].trim(),
              team: altMatch[2].trim(),
              position: altMatch[3].trim()
            });
          }
        }
      });
      
      // If no players found via h3 headers, try to extract from paragraphs
      if (extractedPlayers.length === 0) {
        const paragraphs = tempElement.querySelectorAll('p');
        paragraphs.forEach(p => {
          const text = p.textContent || '';
          
          // Find mentions of players with their positions
          const matches = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)\s+\(([^)]+)\)/g);
          if (matches) {
            matches.forEach(match => {
              const parts = match.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)\s+\(([^)]+)\)/);
              if (parts) {
                extractedPlayers.push({
                  name: parts[1].trim(),
                  position: parts[2].trim()
                });
              }
            });
          }
        });
      }
      
      // If we found player names, query the database
      if (extractedPlayers.length > 0) {
        console.log('Extracted players:', extractedPlayers);
        
        // Create an array of queries, one for each player
        const playerQueries = extractedPlayers.map(async (player) => {
          // Split the full name into first and last name for better searching
          const nameParts = player.name.split(' ');
          if (nameParts.length < 2) return null;
          
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');
          
          // Query the database for this player
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .ilike('first_name', `%${firstName}%`)
            .ilike('last_name', `%${lastName}%`)
            .limit(1);
          
          if (error) {
            console.error('Error fetching player:', error);
            return null;
          }
          
          // Convert database player to our application's format
          const dbPlayer = data && data.length > 0 ? data[0] as DbPlayer : null;
          if (!dbPlayer) return null;
          
          // Process player stats if available
          const stats = dbPlayer.stats || {};
          
          // Extract astro data
          // Note: This is a simplified version, in a real app we would
          // query the astrological_data table to get this information
          const astroScore = typeof stats.astro_score === 'number' ? stats.astro_score : 50;
          const influenceScore = typeof stats.influence_score === 'number' ? stats.influence_score : 50;
          
          return {
            id: dbPlayer.id,
            player_id: dbPlayer.external_id || dbPlayer.id, // Use external_id as player_id if available
            full_name: dbPlayer.name,
            headshot_url: dbPlayer.image,
            birth_date: dbPlayer.birth_date,
            position: player.position || dbPlayer.position,
            team_id: dbPlayer.team_id,
            impact_score: dbPlayer.win_shares,
            astro_influence: influenceScore,
            astro_influence_score: astroScore,
            player_zodiac_sign: stats.zodiac_sign,
            linkPath: `/players/${dbPlayer.id}`
          };
        });
        
        // Wait for all queries to complete
        const results = await Promise.all(playerQueries);
        
        // Filter out null results and remove duplicates
        const filteredPlayers = results
          .filter(Boolean) // Remove null values
          .filter((player, index, self) => 
            index === self.findIndex(p => p.id === player.id)
          ) as Player[];
        
        // Update state with the player data
        setPlayers(filteredPlayers);
      }
    } catch (err) {
      console.error('Error extracting and fetching players:', err);
    } finally {
      setPlayersLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    out: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error || 'Article not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to News
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        ← Back to News
      </button>
      
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {article.image ? (
          <img 
            src={article.image} 
            alt={article.title} 
            className="w-full h-64 md:h-96 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">
              {article.teamAway || 'Away'} vs {article.teamHome || 'Home'}
            </div>
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">
            {article.title}
          </h1>
          
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-6">
            <span>
              Published on {new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          
          {article.teamHome && article.teamAway && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">Game Summary</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="text-lg font-medium">{article.teamAway}</div>
                <div className="text-2xl font-bold">
                  {article.score?.away} - {article.score?.home}
                </div>
                <div className="text-lg font-medium">{article.teamHome}</div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            {article.content ? (
              <MarkdownContent content={article.content} />
            ) : (
              <div className="text-gray-500 italic">
                No content available for this article.
              </div>
            )}
          </div>
          
          {/* Player Cards Section */}
          {players.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-indigo-700 dark:text-indigo-300">
                <Users className="mr-2 h-6 w-6" />
                Key Players
              </h2>
              
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
                {players.map(player => (
                  <PlayerCardNew
                    key={player.id}
                    id={player.id}
                    player_id={player.player_id || player.id} // Use player_id if available, fallback to id
                    full_name={player.full_name}
                    headshot_url={player.headshot_url || undefined}
                    birth_date={player.birth_date || undefined}
                    primary_position={player.position || undefined}
                    impact_score={player.impact_score || 0}
                    astro_influence={player.astro_influence || 0}
                    astro_influence_score={player.astro_influence_score || undefined}
                    team_id={player.team_id || undefined}
                    linkPath={`/players/${player.id}`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {playersLoading && (
            <div className="mt-10 text-center p-4">
              <p>Loading player data...</p>
            </div>
          )}
        </div>
      </article>
    </motion.div>
  );
};

export default NewsArticle;
