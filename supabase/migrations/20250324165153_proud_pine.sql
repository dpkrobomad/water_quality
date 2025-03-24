/*
  # Water Quality Monitoring System Schema

  1. New Types
    - user_role enum ('admin', 'user')

  2. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - role (user_role)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - sensor_logs
      - id (uuid, primary key)
      - sensor_type (text)
      - value (float)
      - timestamp (timestamptz)
      - topic (text)
      - raw_message (jsonb)

  3. Security
    - Enable RLS on all tables
    - Policies for user data access
    - Policies for sensor logs access
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sensor logs table
CREATE TABLE IF NOT EXISTS sensor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_type text NOT NULL,
  value float NOT NULL,
  timestamp timestamptz DEFAULT now(),
  topic text NOT NULL,
  raw_message jsonb NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin users can read all sensor logs"
  ON sensor_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

CREATE POLICY "Users can read recent sensor logs"
  ON sensor_logs
  FOR SELECT
  TO authenticated
  USING (timestamp >= now() - interval '24 hours');

-- Insert default admin user
INSERT INTO users (id, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'midhunheadlyk@gmail.com',
  'admin'
)
ON CONFLICT (email) DO NOTHING;