import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/types/news';

interface ArticleSectionProps {
  article: Article;
  className?: string;
}

export const featuredArticleVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

const ArticleSection: React.FC<ArticleSectionProps> = ({ article, className = '' }) => {
  return (
    <Link 
      to={`/news/${article.slug}`} 
      className={`block group relative overflow-hidden ${className}`} 
      onClick={() => window.scrollTo(0, 0)}
    >
      {/* Animated cosmic background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950">
          {/* Animated stars */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full bg-white/30"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
            />
          ))}
          
          {/* Animated gradient orbs */}
          <motion.div 
            className="absolute rounded-full w-64 h-64 -top-32 -right-32 bg-gradient-to-br from-purple-500/20 to-transparent blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute rounded-full w-96 h-96 -bottom-48 -left-48 bg-gradient-to-tr from-indigo-500/20 to-transparent blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
        
        {/* Main content image with overlay */}
        <div className="absolute inset-0 z-10">
          {article.featureImageUrl ? (
            <img
              src={article.featureImageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
              <span className="text-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </span>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
      </div>

      {/* Content */}
      <motion.article
        variants={featuredArticleVariant}
        initial="hidden"
        animate="visible"
        className="relative z-20 flex flex-col justify-end h-[300px] md:h-[350px] lg:h-[400px] p-8 md:p-12"
      >
        <div className="max-w-4xl mx-auto w-full">
          {/* Decorative elements */}
          <motion.div 
            className="absolute top-6 right-6 w-16 h-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge 
              variant="secondary" 
              className="mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Featured Insight
            </Badge>
            
            <motion.h2 
              className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-white drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {article.title}
            </motion.h2>
            
            {article.subheading && (
              <motion.p 
                className="text-base md:text-lg text-white/90 max-w-3xl leading-relaxed line-clamp-2 font-light"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {article.subheading}
              </motion.p>
            )}
            
            <motion.div 
              className="flex items-center mt-6 space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium border-0 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30">
                Read Full Story
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              
              {article.publishedAt && (
                <span className="text-sm text-white/70">
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.article>
    </Link>
  );
};

export default ArticleSection;
