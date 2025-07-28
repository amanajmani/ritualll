-- Add channel_category column to subscriptions table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'channel_category'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN channel_category TEXT DEFAULT 'Other';
    END IF;
END $$;