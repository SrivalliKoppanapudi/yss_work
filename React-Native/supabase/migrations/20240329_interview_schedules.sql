-- Create enum type for interview status
CREATE TYPE interview_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'rescheduled'
);

-- Create interview_schedules table
CREATE TABLE IF NOT EXISTS interview_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    interview_type VARCHAR(10) CHECK (interview_type IN ('online', 'offline')),
    location VARCHAR(500),
    meeting_link VARCHAR(500),
    additional_notes TEXT,
    status interview_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application_id ON interview_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_date ON interview_schedules(interview_date);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);

-- Create trigger for interview_schedules table
DROP TRIGGER IF EXISTS update_interview_schedules_updated_at ON interview_schedules;
CREATE TRIGGER update_interview_schedules_updated_at
    BEFORE UPDATE ON interview_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;

-- Policy for interview_schedules
CREATE POLICY "Users can view interview schedules for applications they own or manage"
ON interview_schedules FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = interview_schedules.application_id
        AND (ja.user_id = auth.uid() OR j.user_id = auth.uid())
    )
);

CREATE POLICY "Users can insert interview schedules for applications they manage"
ON interview_schedules FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = interview_schedules.application_id
        AND j.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update interview schedules for applications they manage"
ON interview_schedules FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = interview_schedules.application_id
        AND j.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = interview_schedules.application_id
        AND j.user_id = auth.uid()
    )
); 