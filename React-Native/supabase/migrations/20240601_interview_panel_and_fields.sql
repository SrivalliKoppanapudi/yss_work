-- Add new fields to interview_schedules
ALTER TABLE interview_schedules
ADD COLUMN IF NOT EXISTS round VARCHAR(100),
ADD COLUMN IF NOT EXISTS duration INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
ADD COLUMN IF NOT EXISTS rescheduled_to UUID REFERENCES interview_schedules(id),
ADD COLUMN IF NOT EXISTS updated_by UUID, -- user who last updated
ADD COLUMN IF NOT EXISTS updated_reason TEXT;

-- Create interview_panel table
CREATE TABLE IF NOT EXISTS interview_panel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interview_schedules(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(100),
    organization VARCHAR(150),
    phone VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_panel_interview_id ON interview_panel(interview_id);

-- RLS for interview_panel
ALTER TABLE interview_panel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Panelists viewable by job/interview owners" ON interview_panel FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM interview_schedules s
        JOIN job_applications a ON s.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        WHERE s.id = interview_panel.interview_id
        AND (a.user_id = auth.uid() OR j.user_id = auth.uid())
    )
);

CREATE POLICY "Panelists insertable by job/interview owners" ON interview_panel FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM interview_schedules s
        JOIN job_applications a ON s.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        WHERE s.id = interview_panel.interview_id
        AND j.user_id = auth.uid()
    )
);

CREATE POLICY "Panelists updatable by job/interview owners" ON interview_panel FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM interview_schedules s
        JOIN job_applications a ON s.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        WHERE s.id = interview_panel.interview_id
        AND j.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM interview_schedules s
        JOIN job_applications a ON s.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        WHERE s.id = interview_panel.interview_id
        AND j.user_id = auth.uid()
    )
); 