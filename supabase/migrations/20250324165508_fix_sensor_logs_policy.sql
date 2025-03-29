-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."sensor_logs";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."sensor_logs";

-- Create new policies
CREATE POLICY "Enable insert for authenticated users only"
ON "public"."sensor_logs"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for all users"
ON "public"."sensor_logs"
FOR SELECT
TO public
USING (true);

-- Enable RLS
ALTER TABLE "public"."sensor_logs" ENABLE ROW LEVEL SECURITY; 

