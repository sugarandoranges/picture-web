/*
  # Add Points System

  1. New Tables
    - `user_points` - Tracks user points balance and daily rewards
      - `user_id` (uuid, primary key, references profiles.id)
      - `points_balance` (int, default 0)
      - `last_daily_reward` (date, tracks last day user received daily reward)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `point_transactions` - Logs all point transactions for auditing
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `points_amount` (int, can be positive or negative)
      - `transaction_type` (text, e.g., 'daily_reward', 'download', 'transfer')
      - `related_image_id` (uuid, nullable, references images.id)
      - `created_at` (timestamp)

  2. Modified Tables
    - `images` - Add point requirement column
      - `points_required` (int, default 0, max 15)

  3. Security
    - Enable RLS on user_points and point_transactions tables
    - Users can only view/update their own points
    - Only authenticated users can participate in points system

  4. Important Notes
    - Points balance cannot go below 0
    - Daily reward is 10 points per user per day
    - Image download requirement ranges from 0 to 15 points
    - All transactions are logged for transparency
*/

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  points_balance INT DEFAULT 0 CHECK (points_balance >= 0),
  last_daily_reward DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON user_points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points"
  ON user_points FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own points"
  ON user_points FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create point_transactions table for audit trail
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_amount INT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('daily_reward', 'download', 'transfer', 'admin')),
  related_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON point_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON point_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add points_required column to images table
ALTER TABLE images ADD COLUMN IF NOT EXISTS points_required INT DEFAULT 0 CHECK (points_required >= 0 AND points_required <= 15);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_last_reward ON user_points(last_daily_reward);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_points_required ON images(points_required);
