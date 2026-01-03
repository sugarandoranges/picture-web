/*
  # Add Daily Tasks System

  1. New Tables
    - `daily_tasks` - Daily task templates
      - `id` (uuid, primary key)
      - `title` (text, task name)
      - `description` (text, task description)
      - `points_reward` (int, points earned on completion)
      - `icon` (text, emoji or icon identifier)
      - `is_active` (boolean, whether task is available)
      - `created_at` (timestamp)

    - `user_task_completions` - Track which users completed which tasks on which days
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `task_id` (uuid, references daily_tasks.id)
      - `completed_at` (date, the date when task was completed)
      - `created_at` (timestamp)
      - `unique constraint` on (user_id, task_id, completed_at)

  2. Security
    - Enable RLS on both tables
    - Users can only view/complete their own task completions
    - Task templates are public view only

  3. Important Notes
    - Each user can complete each task once per day
    - Tasks are reset daily (tracked by date, not by timestamp)
    - Default tasks include: visit gallery, upload image, like image, explore categories
*/

-- Create daily_tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  points_reward INT DEFAULT 10 CHECK (points_reward > 0),
  icon TEXT DEFAULT '⭐',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tasks"
  ON daily_tasks FOR SELECT
  USING (is_active = true);

-- Create user_task_completions table
CREATE TABLE IF NOT EXISTS user_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, task_id, completed_at)
);

ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task completions"
  ON user_task_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task completions"
  ON user_task_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_task_completions_user_id ON user_task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_task_id ON user_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_completed_at ON user_task_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_is_active ON daily_tasks(is_active);

-- Insert default daily tasks
INSERT INTO daily_tasks (title, description, points_reward, icon, is_active) VALUES
  ('访问图库', '每天访问图片库', 10, '👀', true),
  ('上传图片', '上传一张图片', 15, '📸', true),
  ('点赞图片', '为其他用户的图片点赞', 5, '❤️', true),
  ('浏览分类', '浏览不同的图片分类', 8, '🔍', true)
ON CONFLICT DO NOTHING;
