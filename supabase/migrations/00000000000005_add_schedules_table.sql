-- Migration: Add schedules table for storing game schedules
CREATE TABLE IF NOT EXISTS schedules (
    id BIGSERIAL PRIMARY KEY,
    espn_id VARCHAR(64) UNIQUE NOT NULL,
    sport VARCHAR(32) NOT NULL,
    home_team VARCHAR(64) NOT NULL,
    away_team VARCHAR(64) NOT NULL,
    game_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_schedules_sport_time ON schedules(sport, game_time);

-- RLS policy
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
