/*
  # Initial Schema Setup

  1. New Tables
    - `users` table for storing user information
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text, unique)
      - `role` (user_role enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sensor_logs` table for storing sensor data
      - `id` (uuid, primary key)
      - `sensor_type` (text)
      - `value` (float)
      - `timestamp` (timestamp)
      - `topic` (text)
      - `raw_message` (jsonb)

  2. Security
    - Enable RLS on both tables
    - Add policies for data access control
*/

-- Create enum for user roles if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
  END IF;
END $$;

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

-- Create policies if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read their own data'
  ) THEN
    CREATE POLICY "Users can read their own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sensor_logs' 
    AND policyname = 'Admin users can read all sensor logs'
  ) THEN
    CREATE POLICY "Admin users can read all sensor logs"
      ON sensor_logs
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sensor_logs' 
    AND policyname = 'Users can read recent sensor logs'
  ) THEN
    CREATE POLICY "Users can read recent sensor logs"
      ON sensor_logs
      FOR SELECT
      TO authenticated
      USING (timestamp >= now() - interval '24 hours');
  END IF;
END $$;

-- Insert admin user into public.users table
INSERT INTO public.users (id, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'midhunheadlyk@gmail.com',
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin';