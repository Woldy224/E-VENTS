-- Add media coverage option to event proposals (PostgreSQL)
ALTER TABLE event_proposals
ADD COLUMN IF NOT EXISTS media_coverage_requested BOOLEAN NOT NULL DEFAULT FALSE;
