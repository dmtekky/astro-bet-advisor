import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Astro-Bet Advisor
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your intelligent sports betting companion powered by astrology
          </p>
          <div className="space-y-4">
            <Button asChild>
              <Link to="/dashboard" className="text-white">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
