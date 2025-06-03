# Game Recap Generation System

## Overview
The Game Recap Generation System is an automated pipeline that generates professional-quality sports articles by combining real-time game data with AI-powered content generation and astrological insights. The system creates engaging game recaps that include traditional sports journalism elements enhanced with unique astrological perspectives.

## Architecture

### Data Flow
1. **Data Collection**
   - Fetches MLB game schedules and details from SportsRadar API
   - Retrieves player statistics and team information from Supabase
   - Gathers astrological data for players and game times

2. **Content Generation**
   - Processes game data to identify key moments and players
   - Enhances player data with astrological insights
   - Uses Anthropic's Claude AI to generate engaging article content

3. **Publishing**
   - Saves generated articles to the filesystem
   - Updates the website's news index
   - Stores article metadata in Supabase

## Key Components

### 1. Article Generation Script (`generate-real-articles.js`)
- Main orchestrator of the recap generation process
- Handles data fetching, processing, and content generation
- Manages API calls to external services

### 2. AI Content Generation (`generateArticleWithLLM` function)
- Creates detailed prompts for Claude AI
- Structures the article with proper formatting and sections
- Ensures consistent tone and style across all recaps

### 3. Data Processing
- Processes raw game data into structured formats
- Enhances player data with astrological insights
- Formats statistics and key moments for inclusion in articles

## Article Structure

Each generated article follows this structure:

1. **Title** - Attention-grabbing headline with teams and key outcome
2. **Introduction** - Sets the scene with key outcome and atmosphere
3. **Game Summary** - Detailed recap of the game flow and key moments
4. **Key Player Analysis** - Performance highlights with astrological insights
5. **Astrological Insights** - How planetary alignments influenced the game
6. **Season Context** - Impact on team standings and season performance
7. **Conclusion** - Final thoughts and upcoming game previews

## Required Environment Variables

```
# Sports Data
SPORTS_RADAR_NEWS_API_KEY=your_sportsradar_api_key

# AI Generation
ANTHROPIC_API_KEY=your_anthropic_api_key

# Image Search (Optional)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id

# Database
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the System

### Prerequisites
- Node.js 16+
- Access to SportsRadar API
- Anthropic API key
- Supabase project with required tables

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`

### Generating Recaps
Run the main generation script:
```bash
node scripts/generate-real-articles.js
```

## Customization

### Modifying Article Style
Edit the prompt template in `generateArticleWithLLM()` to change:
- Writing style and tone
- Article structure and sections
- Level of astrological content

### Adding New Data Sources
1. Add new data fetching functions
2. Process the data into the expected format
3. Update the prompt template to include the new information

## Troubleshooting

### Common Issues
1. **API Rate Limiting**
   - Implement retry logic with exponential backoff
   - Check API usage limits for SportsRadar and Anthropic

2. **Data Quality Issues**
   - Validate API responses before processing
   - Add error handling for missing or malformed data

3. **Content Quality**
   - Refine the prompt template for better output
   - Add more specific instructions for Claude

## Maintenance

### Monitoring
- Log all API calls and generation attempts
- Track article quality with user feedback
- Monitor API usage and costs

### Updates
- Regularly update API clients and dependencies
- Refresh prompt templates based on performance
- Add support for new sports or data sources as needed

## License
[Your License Here]
