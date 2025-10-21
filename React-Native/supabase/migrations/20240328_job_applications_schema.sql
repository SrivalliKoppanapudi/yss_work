-- Create enum type for application status
CREATE TYPE application_status AS ENUM (
    'Applied',
    'Viewed',
    'Shortlisted',
    'Interviewing',
    'Offered',
    'Hired',
    'Rejected',
    'Withdrawn'
);

-- Create jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS jobs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    job_name VARCHAR NOT NULL,
    job_title VARCHAR,
    job_highlights TEXT,
    phone VARCHAR,
    qualification VARCHAR,
    experience INTEGER,
    about TEXT,
    details TEXT,
    preferred_location VARCHAR,
    additional_info TEXT,
    duration INTEGER,
    job_id VARCHAR,
    thumbnail_uri VARCHAR,
    organization_id UUID,
    salary_range VARCHAR,
    job_type VARCHAR,
    required_skills TEXT,
    benefits TEXT,
    application_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'Active',
    department VARCHAR,
    education_level VARCHAR,
    work_mode VARCHAR,
    contact_email VARCHAR,
    company_name VARCHAR,
    industry VARCHAR,
    employment_type VARCHAR,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    organization_logo VARCHAR
);

-- Create job_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id BIGINT REFERENCES jobs(id),
    user_id UUID REFERENCES auth.users(id),
    
    -- Personal Information
    first_name VARCHAR,
    last_name VARCHAR,
    dob DATE,
    street_address VARCHAR,
    city VARCHAR,
    state VARCHAR,
    pin_code VARCHAR,
    
    -- Education (stored as JSONB array)
    education JSONB,
    teaching_level VARCHAR,
    subjects_specialization TEXT[],
    
    -- Experience
    is_experienced BOOLEAN DEFAULT false,
    experiences JSONB,
    experience VARCHAR,
    
    -- Professional Details
    current_ctc VARCHAR,
    expected_ctc VARCHAR,
    board_experience VARCHAR,
    teaching_methodology TEXT,
    languages_known TEXT[],
    certifications TEXT[],
    
    -- Documents
    resume_url VARCHAR,
    
    -- Application Status
    application_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status application_status DEFAULT 'Applied',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for job_applications table
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy for jobs
CREATE POLICY "Jobs are viewable by everyone"
ON jobs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
ON jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for job_applications
CREATE POLICY "Users can view their own applications and job owners can view applications for their jobs"
ON job_applications FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id
    OR 
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = job_applications.job_id 
        AND jobs.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own applications"
ON job_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
ON job_applications FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
    OR 
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = job_applications.job_id 
        AND jobs.user_id = auth.uid()
    )
); 