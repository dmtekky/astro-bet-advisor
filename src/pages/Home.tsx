import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart2, Shield, TrendingUp, Zap } from 'lucide-react';

const LEAGUES = [
  { 
    id: 'nba', 
    name: 'NBA', 
    bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
    border: 'border-slate-600',
    description: 'Advanced basketball analytics powered by celestial data science',
    icon: <BarChart2 className="w-6 h-6 text-slate-400" />
  },
  { 
    id: 'mlb', 
    name: 'MLB', 
    bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
    border: 'border-slate-600',
    description: 'Precision baseball predictions through astronomical algorithms',
    icon: <TrendingUp className="w-6 h-6 text-slate-400" />
  },
  { 
    id: 'nfl', 
    name: 'NFL', 
    bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
    border: 'border-slate-600',
    description: 'Strategic football insights enhanced by cosmic patterns',
    icon: <Zap className="w-6 h-6 text-slate-400" />
  },
  { 
    id: 'nhl', 
    name: 'NHL', 
    bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
    border: 'border-slate-600',
    description: 'Hockey analytics with a celestial edge',
    icon: <Shield className="w-6 h-6 text-slate-400" />,
    comingSoon: true
  }
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">FM</span>
            </div>
            <span className="text-xl font-semibold text-slate-800">Full Moon Odds</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#leagues" className="text-slate-600 hover:text-slate-900 transition-colors">Leagues</a>
            <a href="#insights" className="text-slate-600 hover:text-slate-900 transition-colors">Insights</a>
          </div>
          <Button asChild variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-20 bg-gradient-to-b from-white to-slate-50"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-block px-4 py-2 mb-6 rounded-full bg-slate-100 text-slate-600 text-sm font-medium"
          >
            Now covering major sports leagues worldwide
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700"
          >
            Data-Driven Sports Predictions
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Harnessing advanced analytics and celestial patterns to deliver superior sports predictions with precision and clarity.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-6">
              <Link to="/league/nba">
                Explore Leagues
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium px-8 py-6">
              <Link to="/dashboard">
                View Dashboard
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Trust Indicators */}
      <div className="py-12 bg-white border-t border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '98.7%', label: 'Prediction Accuracy' },
              { value: '10K+', label: 'Active Users' },
              { value: '4.9/5', label: 'User Rating' },
              { value: '24/7', label: 'Support' }
            ].map((item, index) => (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-4"
              >
                <div className="text-3xl font-bold text-slate-900 mb-2">{item.value}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wider">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Leagues Grid */}
      <section id="leagues" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Featured Leagues</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive coverage of major sports leagues with advanced predictive analytics
            </p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {LEAGUES.map((league) => (
              <motion.div
                key={league.id}
                variants={fadeIn}
                className={`relative rounded-xl overflow-hidden border ${league.border} ${league.bg} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
              >
                <div className="p-6">
                  <div className="w-12 h-12 mb-4 rounded-lg bg-slate-600/20 flex items-center justify-center">
                    {league.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{league.name}</h3>
                  <p className="text-slate-500 mb-6 text-sm leading-relaxed">{league.description}</p>
                  <Button 
                    asChild 
                    variant="outline"
                    className={`w-full border-slate-300 text-slate-700 hover:bg-white/10 hover:border-slate-400 hover:text-slate-900 ${
                      league.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={league.comingSoon}
                  >
                    <Link to={league.comingSoon ? '#' : `/league/${league.id}`}>
                      {league.comingSoon ? 'Coming Soon' : 'View League'}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Advanced Predictive Analytics</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Our proprietary technology combines multiple data points to deliver unparalleled predictive accuracy
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: 'Celestial Pattern Analysis',
                description: 'Our algorithms analyze planetary alignments and celestial events to identify patterns that influence game outcomes.',
                icon: <BarChart2 className="w-6 h-6 text-slate-900" />
              },
              {
                title: 'Performance Metrics',
                description: 'Comprehensive player and team statistics combined with advanced metrics for deeper insights.',
                icon: <TrendingUp className="w-6 h-6 text-slate-900" />
              },
              {
                title: 'Risk Assessment',
                description: 'Sophisticated models evaluate multiple risk factors to provide confidence levels for each prediction.',
                icon: <Shield className="w-6 h-6 text-slate-900" />
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 mb-4 rounded-lg bg-slate-100 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to make informed decisions?</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join our community of professional analysts and gain a competitive edge with our predictive insights.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-medium px-8 py-6">
                <Link to="/dashboard">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-medium px-8 py-6">
                <Link to="/league/nba">
                  Explore Leagues
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">FM</span>
              </div>
              <span className="text-lg font-semibold text-slate-900">Full Moon Odds</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Terms</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Privacy</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-sm text-slate-500 text-center">
            © {new Date().getFullYear()} Venusian Labs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
