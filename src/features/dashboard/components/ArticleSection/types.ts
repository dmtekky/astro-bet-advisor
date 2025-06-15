import { Article } from '@/types/news';

export interface ArticleSectionProps {
  article: Article;
  className?: string;
}

export interface FeaturedArticleVariantProps {
  hidden: {
    opacity: number;
    y: number;
  };
  visible: {
    opacity: number;
    y: number;
    transition: {
      duration: number;
      ease: string;
      delay?: number;
    };
  };
}
