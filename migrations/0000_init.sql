-- D1 Migration: Initial Users Schema for Ink & Iron

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL DEFAULT 'Commander',
    master_volume INTEGER NOT NULL DEFAULT 80,
    sfx_volume INTEGER NOT NULL DEFAULT 100,
    audio_muted INTEGER NOT NULL DEFAULT 0,
    planning_duration INTEGER NOT NULL DEFAULT 20,
    playback_speed INTEGER NOT NULL DEFAULT 3,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    is_banned INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
