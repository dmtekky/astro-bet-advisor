import { useState } from 'react';
import { fetchTestGame } from '../lib/oddsApi';

export default function TestApi() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const game = await fetchTestGame('basketball_nba');
      if (game?.error) {
        setError(game.error);
      } else {
        setResult(game);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Test Odds API</h1>
      <button 
        onClick={handleTest} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Fetching...' : 'Fetch Test Game'}
      </button>

      {error && (
        <div style={{ color: 'red', margin: '10px 0', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h3>Test Game Result:</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
