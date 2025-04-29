# Qur'an Memorization System - Design Document

## Overview

The Qur'an Memorization System helps users memorize the Qur'an through personalized scheduling, testing, and study plan adjustments. The system uses the NRLT (New, Recent, Long-Term) memorization method combined with spaced repetition to improve retention.

This document outlines the practical implementation of the system using n8n, Baserow, and WhatsApp integration within the RexOS framework.

## Table of Contents

1. [System Overview](#system-overview)
2. [Implementation Approach](#implementation-approach)
3. [Core Components](#core-components)
4. [Integration with RexOS](#integration-with-rexos)

## System Overview

### Purpose and Scope

The Intelligent Qur'an Memorization System aims to provide a personalized and adaptive approach to Qur'an memorization, addressing common challenges such as:

- Inconsistent review schedules
- Difficulty identifying weak areas
- Lack of personalized testing
- Ineffective memorization techniques
- Poor long-term retention

The system implements the NRLT (New, Recent, Long-Term) memorization method combined with spaced repetition to optimize the learning process and improve retention.

### Key Features

1. **Personalized User Profiles**: Tracking memorization progress, goals, and preferences
2. **Intelligent Scheduling**: Generating optimized memorization and review schedules
3. **Adaptive Testing**: Providing personalized tests based on user performance
4. **Weak Ayah Identification**: Identifying and prioritizing challenging verses
5. **Dynamic Plan Adjustment**: Modifying study plans based on performance and progress
6. **Multi-channel Notifications**: Delivering timely reminders through various channels

### User Personas

1. **Individual Learners**: Self-directed memorization at their own pace
2. **Students**: Following structured memorization programs with academic commitments
3. **Teachers/Instructors**: Monitoring and guiding students' memorization progress
4. **Institutions**: Implementing standardized memorization programs

## Implementation Approach

### System Components

The Qur'an Memorization System uses the following core components:

1. **Data Storage (Baserow)**: Stores user profiles, memorization progress, and testing records
2. **Workflow Automation (n8n)**: Handles scheduling, notifications, and testing workflows
3. **User Interface (WhatsApp)**: Provides a familiar interface for testing and notifications
4. **Calendar Integration (Google Calendar)**: Manages memorization and review schedules

### Component Interaction

```
┌─────────────────┐          ┌───────────────┐          ┌──────────────┐
│User (WhatsApp)  │          │Agent Abdullah │          │n8n Workflows │
└────────┬────────┘          └───────┬───────┘          └───────┬──────┘
         │                           │                          │
         │ Send Message              │                          │
         │──────────────────────────>│                          │
         │                           │                          │
         │                           │ Process Request          │
         │                           │────────────────────────>│
         │                           │                          │
         │                           │                          │ Store/Retrieve Data
         │                           │                          │─────────────────────┐
         │                           │                          │                     │
         │                           │                          │                     │
         │                           │                          │                     ▼
         │                           │                          │          ┌──────────────────┐
         │                           │                          │          │Baserow Database  │
         │                           │                          │          └──────────────────┘
         │                           │                          │                     │
         │                           │                          │<────────────────────┘
         │                           │                          │
         │                           │ Return Response          │
         │                           │<────────────────────────│
         │                           │                          │
         │ Send Response             │                          │
         │<──────────────────────────│                          │
```

### Data Structure

#### User Profiles Table
- User ID
- Memorization goals
- Current progress
- Notification preferences

#### Memorization Progress Table
- Surahs/Juz memorized
- Current position
- Completion dates

#### Testing Records Table
- Test results
- Identified weak ayahs
- Test dates

### Data Flow

1. **User Interaction**
   - User sends a message via WhatsApp
   - Agent Abdullah processes the request
   - n8n workflows handle the specific operations

2. **Scheduling Process**
   - n8n creates memorization and review schedules
   - Events are added to Google Calendar
   - Reminders are sent via WhatsApp

3. **Testing Process**
   - User receives test prompts via WhatsApp
   - Responses are evaluated and recorded
   - Weak ayahs are identified for additional review

## Core Components

### 1. NRLT Memorization Method

The system implements the NRLT (New, Recent, Long-Term) memorization method:

1. **New Material**: Daily memorization of new verses
2. **Recent Review**: Reviewing recently memorized verses at increasing intervals (1, 3, 7 days)
3. **Long-Term Review**: Reviewing previously mastered material at extended intervals (30, 90, 180, 365 days)

### 2. n8n Workflows

The system uses several key n8n workflows:

1. **Schedule Generation**: Creates personalized memorization and review schedules
2. **Notification Workflow**: Sends reminders via WhatsApp
3. **Testing Workflow**: Conducts tests and evaluates responses
4. **Progress Tracking**: Updates memorization progress in Baserow

### 3. Testing Methods

The system uses two primary testing methods:

1. **Last Word - Next Word**: User is given the last word of an ayah and must recall the next word
2. **Middle Ayah Recall**: User is given a word from the middle of an ayah and must recall the complete ayah

### 4. Weak Ayah Identification

The system identifies verses that need additional review based on:

1. Frequency of errors during testing
2. Time since last successful recall
3. Historical difficulty level

Weak ayahs are automatically added to the review schedule with higher frequency.

## Integration with RexOS

The Qur'an Memorization System integrates with the RexOS framework through:

1. **Academic Domain**: This domain handles all Qur'an memorization interactions
2. **WhatsApp Interface**: Users interact with the system through WhatsApp messages
3. **Morning Briefings**: Daily memorization tasks are included in the Executive Domain's morning briefings
4. **Shared Database**: Memorization data is stored in the central Baserow database

### Workflow Example

1. User sends a message: "Test me on Surah Al-Fatiha"
2. WhatsApp forwards the message to n8n
3. n8n identifies the intent and routes to the Academic Domain
4. The Academic Domain selects an appropriate test based on the user's history
5. The test is delivered via WhatsApp
6. User's response is evaluated and recorded
7. Results are stored in Baserow
8. Schedule is adjusted based on performance

## Implementation Approach

### Required Components

1. **Baserow Database**: For storing user profiles, memorization progress, and test results
2. **n8n Workflows**: For automation, notifications, and integrations
3. **WhatsApp Business API**: For user interaction and notifications
4. **Google Calendar**: For scheduling memorization and review sessions

### Implementation Steps

1. **Setup Baserow Tables**:
   - Create User Profiles table
   - Create Memorization Progress table
   - Create Testing Records table

2. **Configure n8n Workflows**:
   - Create message processing workflow
   - Create testing workflow
   - Create notification workflow

3. **Connect WhatsApp**:
   - Set up webhook for incoming messages
   - Configure message templates for notifications

4. **Integrate with Google Calendar**:
   - Set up calendar access
   - Create event templates

### Implementation Timeline

**Week 1-2**: Database setup and initial workflows
**Week 3-4**: Testing implementation and integration
**Week 5-6**: User testing and refinement

## Conclusion

The Qur'an Memorization System provides a practical solution for memorization using the proven NRLT method. By leveraging existing RexOS components (n8n, Baserow, WhatsApp), the system can be implemented quickly and efficiently without unnecessary complexity.

The focus on practical workflows and user interaction through WhatsApp ensures high usability and adoption, while the integration with the Academic Domain provides a seamless experience within the RexOS ecosystem.

## References

- [RexOS Project Documentation v0.92](../project/rexos-project-documentation-v0.92.md)
- [Academic Domain Specification](../domains/academic-domain-specification.md)
- [NRLT Memorization Method](https://www.islamicstudies.info/quran/memorization/nrlt-method.pdf)
- [Baserow Documentation](https://baserow.io/docs)
- [n8n Documentation](https://docs.n8n.io/)
