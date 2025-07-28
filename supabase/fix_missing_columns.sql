-- Add missing columns to videos table
DO $$ 
BEGIN 
    -- Add transcript_unavailable column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' 
        AND column_name = 'transcript_unavailable'
    ) THEN
        ALTER TABLE videos ADD COLUMN transcript_unavailable BOOLEAN DEFAULT false;
    END IF;
    
    -- Add summary_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' 
        AND column_name = 'summary_status'
    ) THEN
        ALTER TABLE videos ADD COLUMN summary_status TEXT DEFAULT 'processing';
    END IF;
    
    -- Add channel_category column to subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'channel_category'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN channel_category TEXT DEFAULT 'Other';
    END IF;
END $$;