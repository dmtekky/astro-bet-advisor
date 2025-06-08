export interface SeoMetaData {
  description?: string;
  keywords?: string[];
}

export interface Article {
  slug: string;
  title: string;
  subheading?: string;
  contentHtml: string;
  featureImageUrl?: string;
  publishedAt: string; // ISO 8601 date string
  seoMeta?: SeoMetaData;
  author?: string;
  tags?: string[]; // e.g., ['MLB', 'Astrology', 'Yankees']
}
