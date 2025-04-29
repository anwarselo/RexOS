# Intelligent Qur'an Memorization System - Backend Architecture

## System Overview

The Intelligent Qur'an Memorization System is designed to help users memorize the Qur'an through personalized scheduling, adaptive testing, and dynamic study plan adjustments. The system is managed by "Agent Abdullah" which orchestrates the interactions between various components.

## Core Components

### 1. Data Storage Layer (Baserow)

Baserow serves as the primary database for the system, storing:

- **User Profiles Collection**
  - Personal information
  - Memorization goals
  - Academic commitments
  - Preferred memorization methods
  - Current progress

- **Memorization Progress Collection**
  - Chapters memorized
  - Current position
  - Completion dates
  - Page/verse tracking

- **Testing Records Collection**
  - Test results
  - Identified weak ayahs
  - Performance metrics
  - Test types and timestamps

- **Scheduling Data Collection**
  - Memorization schedules
  - Review patterns
  - Calendar event IDs

### 2. Automation Layer (n8n)

n8n workflows handle the automation aspects:

- **Calendar Integration Workflows**
  - Create/update Google Calendar events
  - Sync schedule changes
  - Handle recurring events

- **Notification Workflows**
  - Generate reminders
  - Send notifications across channels (Google Calendar, WhatsApp, email)
  - Alert on schedule changes

- **Testing Workflows**
  - Trigger scheduled tests
  - Process test results
  - Update user profiles based on performance

- **Plan Adjustment Workflows**
  - Analyze performance data
  - Trigger schedule modifications
  - Update user profiles with new recommendations

### 3. User Interface Layer (RexOS)

While not explicitly detailed in the attachment, the system appears to interface with users through RexOS:

- **Notification Channels**
  - WhatsApp integration
  - Email notifications
  - Calendar alerts

- **Testing Interface**
  - Present recitation challenges
  - Capture user responses
  - Provide feedback

### 4. External Integration Layer (Google Calendar)

Google Calendar serves as the scheduling interface:

- **Event Management**
  - Store memorization sessions
  - Manage review schedules
  - Track testing appointments

- **Reminder System**
  - Deliver timely notifications
  - Support multiple reminder intervals

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Interface (RexOS)                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Agent Abdullah Core                        │
└───────────┬─────────────────────┬────────────────┬──────────────┘
            │                     │                │
            ▼                     ▼                ▼
┌───────────────────┐  ┌────────────────┐  ┌─────────────────────┐
│  Data Storage     │  │  Automation    │  │ External Integration │
│    (Baserow)      │  │    (n8n)       │  │  (Google Calendar)   │
└───────────────────┘  └────────────────┘  └─────────────────────┘
```

## Data Flow

1. **User Profile Creation/Access**
   - User identification → Baserow query → Profile retrieval/creation
   - Profile data → Agent Abdullah → Schedule generation

2. **Scheduling Process**
   - Profile data + Current date → Scheduling algorithm → Session plan
   - Session plan → n8n workflow → Google Calendar events

3. **Reminder Flow**
   - Google Calendar events → n8n workflow → Notifications via configured channels

4. **Testing Process**
   - Scheduled test → n8n trigger → Test selection
   - Test results → Baserow update → Weak ayah identification

5. **Plan Adjustment**
   - Performance data from Baserow → Adjustment algorithm → Updated schedule
   - Updated schedule → n8n workflow → Google Calendar updates

## API Endpoints

The system will require the following API endpoints:

### User Management
- `GET /api/users/{userId}` - Retrieve user profile
- `POST /api/users` - Create new user profile
- `PUT /api/users/{userId}` - Update user profile

### Memorization Management
- `GET /api/users/{userId}/progress` - Get memorization progress
- `POST /api/users/{userId}/progress` - Update memorization progress
- `GET /api/users/{userId}/weak-ayahs` - Get identified weak ayahs

### Schedule Management
- `GET /api/users/{userId}/schedule` - Get current schedule
- `POST /api/users/{userId}/schedule/generate` - Generate new schedule
- `PUT /api/users/{userId}/schedule/adjust` - Adjust existing schedule

### Testing
- `GET /api/tests/types` - Get available test types
- `POST /api/users/{userId}/tests` - Record test results
- `GET /api/users/{userId}/tests/history` - Get testing history

### Notifications
- `POST /api/notifications/send` - Send manual notification
- `GET /api/users/{userId}/notification-preferences` - Get notification preferences

## Integration Points

### Baserow Integration
- Custom API wrapper to interact with Baserow collections
- Authentication and authorization management
- Data validation and transformation

### n8n Integration
- Webhook endpoints for workflow triggers
- Callback URLs for workflow completion
- Error handling and retry mechanisms

### Google Calendar Integration
- OAuth2 authentication flow
- Event creation and management
- Reminder configuration

## Security Considerations

- User authentication and authorization
- Secure storage of credentials for third-party services
- Data encryption for sensitive information
- Rate limiting for API endpoints
- Input validation and sanitization
