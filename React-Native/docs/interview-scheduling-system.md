# Interview Scheduling System Documentation

## Overview
The interview scheduling system is a comprehensive solution that allows job administrators to schedule, manage, and track interviews for job applications. The system supports both online and offline interviews with detailed information management.

## Database Schema

### Tables
1. **jobs** - Job postings
2. **job_applications** - Job applications submitted by candidates
3. **interview_schedules** - Interview scheduling information

### Key Relationships
- `job_applications.job_id` → `jobs.id`
- `interview_schedules.application_id` → `job_applications.id`

## Core Components

### 1. ApplicationDetails.tsx
**Location**: `app/(screens)/Jobs(selection)/ApplicationDetails.tsx`

**Purpose**: Main interface for managing individual job applications and scheduling interviews.

**Key Features**:
- View complete application details
- Schedule new interviews
- Edit existing interviews
- Update application status
- View interview information

**Navigation**:
- Accessed from AdminDashboard when clicking on an application
- Can navigate to InterviewDetailsScreen for detailed interview view

### 2. InterviewDetailsScreen.tsx
**Location**: `app/(screens)/InterviewDetailsScreen.tsx`

**Purpose**: Detailed view of scheduled interviews for candidates and administrators.

**Key Features**:
- Display interview date, time, and location
- Show meeting links for online interviews
- Display additional notes and instructions
- Share interview details
- Handle both online and offline interviews

**Navigation**:
- Accessed from ApplicationDetails or AdminDashboard
- Requires `applicationId` parameter

### 3. AdminDashboard.tsx
**Location**: `app/(screens)/Jobs(selection)/AdminDashboard.tsx`

**Purpose**: Overview dashboard for managing all job applications and interviews.

**Key Features**:
- View all applications grouped by job
- Filter applications by status
- Quick access to interview details
- Application statistics
- Bulk application management

**Navigation**:
- Accessible from Jobs.tsx via admin button
- Can navigate to ApplicationDetails and InterviewDetailsScreen

### 4. JobService.ts
**Location**: `lib/jobService.ts`

**Purpose**: Centralized service for all job and interview-related operations.

**Key Methods**:
- `scheduleInterview()` - Create or update interview schedules
- `getInterviewSchedule()` - Fetch interview details
- `updateInterviewStatus()` - Update interview status
- `getUpcomingInterviews()` - Get upcoming interviews
- `getApplicationStats()` - Get application statistics

## Interview Scheduling Flow

### 1. Schedule New Interview
1. Admin opens ApplicationDetails for a specific application
2. Clicks "Schedule Interview" button
3. Fills in interview details (date, time, type, location/link, notes)
4. System creates interview_schedule record
5. Application status automatically updates to "Interviewing"
6. Interview details are displayed in the application view

### 2. Edit Existing Interview
1. Admin opens ApplicationDetails for an application with existing interview
2. Clicks "Edit" button in interview section
3. Form is pre-filled with existing data
4. Admin makes changes and saves
5. Interview_schedule record is updated
6. Changes are reflected immediately

### 3. View Interview Details
1. Admin clicks "Interview" button in AdminDashboard or ApplicationDetails
2. System navigates to InterviewDetailsScreen
3. Interview details are fetched and displayed
4. Admin can share interview details or access meeting links

## Data Flow

### Interview Creation
```
Admin Input → ApplicationDetails → JobService.scheduleInterview() → 
Supabase interview_schedules table → Update job_applications status
```

### Interview Display
```
InterviewDetailsScreen → JobService.getInterviewSchedule() → 
Supabase query → Transform data → Display in UI
```

### Interview Updates
```
Admin Input → ApplicationDetails → JobService.scheduleInterview() → 
Supabase update → Refresh data → Update UI
```

## UI/UX Features

### Interactive Elements
- **Status Badges**: Color-coded status indicators
- **Edit Buttons**: Quick access to edit functionality
- **Navigation Buttons**: Seamless navigation between screens
- **Share Functionality**: Share interview details
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

### Responsive Design
- Adapts to different screen sizes
- Touch-friendly buttons and controls
- Optimized layouts for mobile devices
- Consistent spacing and typography

### Visual Feedback
- Success/error alerts
- Loading spinners
- Status color coding
- Interactive buttons with hover states

## File Structure

```
React-Native/
├── app/(screens)/
│   ├── Jobs.tsx                           # Main job portal entry
│   ├── JobListingsScreen.tsx              # Job listings with navigation
│   ├── InterviewDetailsScreen.tsx         # Interview details view
│   └── Jobs(selection)/
│       ├── _layout.tsx                    # Navigation layout
│       ├── AdminDashboard.tsx             # Admin dashboard
│       └── ApplicationDetails.tsx         # Application management
├── lib/
│   ├── jobService.ts                      # Job and interview services
│   └── Superbase.ts                       # Database configuration
├── types/
│   └── jobs.ts                           # TypeScript interfaces
└── supabase/
    └── migrations/
        └── 20240329_interview_schedules.sql  # Database schema
```

## Setup Instructions

### 1. Database Setup
Run the migration to create the interview_schedules table:
```sql
-- Execute the contents of setup-interview-schedules.sql in Supabase
```

### 2. Component Integration
All components are already integrated and connected. The system works out of the box once the database is set up.

### 3. Navigation Flow
- Jobs.tsx → AdminDashboard → ApplicationDetails → InterviewDetailsScreen
- Jobs.tsx → JobListingsScreen → JobDetailsScreen → ApplicationDetails

## Error Handling

### Common Issues
1. **Missing Database Table**: Ensure interview_schedules table exists
2. **Permission Errors**: Check RLS policies in Supabase
3. **Navigation Errors**: Verify route parameters are passed correctly
4. **Data Fetching Errors**: Check network connectivity and API endpoints

### Error Recovery
- Automatic retry mechanisms
- User-friendly error messages
- Fallback UI states
- Graceful degradation

## Future Enhancements

### Planned Features
1. **Interview Reminders**: Email/SMS notifications
2. **Calendar Integration**: Sync with external calendars
3. **Video Conferencing**: Direct integration with meeting platforms
4. **Interview Feedback**: Post-interview feedback collection
5. **Bulk Operations**: Schedule multiple interviews at once
6. **Analytics Dashboard**: Interview success metrics

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live updates
2. **Offline Support**: Local caching for offline functionality
3. **Performance Optimization**: Lazy loading and pagination
4. **Accessibility**: Enhanced accessibility features

## Support and Maintenance

### Monitoring
- Database query performance
- API response times
- User interaction patterns
- Error rates and types

### Updates
- Regular dependency updates
- Security patches
- Feature enhancements
- Bug fixes

This system provides a complete solution for interview scheduling and management, with a focus on user experience, data integrity, and scalability. 