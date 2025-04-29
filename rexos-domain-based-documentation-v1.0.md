# RexOS Project Documentation v1.0

## Introduction

This document provides a comprehensive overview of the RexOS project, a system developed for people managing multiple roles across business, education, and personal domains. The system was designed to help organize and streamline various responsibilities. This documentation captures the entire journey, including conceptualization, implementation attempts, challenges faced, solutions developed, and the newly proposed enhancements to the time management approach.

## User Profile and Requirements

### User Profile

The system is designed for a hypothetical user with multiple responsibilities:
* Managing some work in a family business in Dubai
* Engaging in video production work
* Pursuing a Bachelor's degree in studies
* Memorizing the Quran
* Managing personal finances and investments
* Maintaining physical fitness and wellness
* Coordinating family activities and responsibilities

### System Design

RexOS is designed as a unified system with specialized domains, each responsible for a specific area of functionality:

* **Executive Domain**: Daily planning, morning briefings, priority management, document tracking
* **Academic Domain**: University studies, Quran memorization
* **Business Domain**: Business operations, video production
* **Family Domain**: Family scheduling and activities
* **Wellness Domain**: Exercise routines, sleep hygiene
* **Financial Domain**: Budget tracking, financial planning

## Focus-Based Segmentation Approach

The system uses a focus-based segmentation approach to help the user manage their attention and energy across different domains. This approach recognizes that different tasks require different types of focus and energy levels, and aims to match tasks to the user's current state.

## Technical Implementation

### Database Selection

After evaluating several options, the system uses Supabase with PostgreSQL for structured data storage:

* **Advantages**: 
  * Self-hosted solution for data privacy
  * Robust relational database capabilities
  * SQL support for complex queries
  * API access for n8n integration

### Data Structure Design

The system uses Supabase database tables with the following structure:

* **Tasks & Projects**: For tracking to-do items, projects, and their completion status
* **Accounting**: For recording income, expenses, and financial transactions
* **Quran Memorization**: For monitoring Quran memorization progress
* **Wellness**: For tracking exercise and health routines
* **Family**: For managing family events and responsibilities
* **System Logs**: For monitoring system performance and errors

Documents are stored in Google Drive with metadata and vector embeddings in Pinecone.

## Message Processing Workflow

A sophisticated message processing workflow was designed to:
* Receive messages from WhatsApp
* Transcribe voice messages to text using AI
* Analyze message content with GPT to determine type and extract structured data
* Categorize messages (appointment, task, feedback, question, etc.)
* Route messages to appropriate domain workflows
* Store processed information in Supabase
* Generate appropriate responses based on message type and content

## GPT Prompt Engineering

A comprehensive prompt was developed for GPT to analyze incoming messages:

"You are an intelligent message analyzer for RexOS, a personal management system. Your task is to analyze incoming messages (text or transcribed voice) and categorize them based on their content and intent. The system has the following domains, each responsible for different aspects of the user's life:

* **Executive Domain**: Daily planning, morning briefings, priority management, document tracking
* **Academic Domain**: University studies, Quran memorization
* **Business Domain**: Business operations, video production
* **Family Domain**: Family scheduling and activities
* **Wellness Domain**: Exercise routines, sleep hygiene
* **Financial Domain**: Budget tracking, financial planning

Analyze the message and determine:
1. Which domain(s) the message relates to
2. The message type (task, appointment, question, feedback, etc.)
3. Any structured data that can be extracted (dates, times, locations, people, etc.)
4. The appropriate response type

Provide your analysis in JSON format with the following structure:
```json
{
  "domain": "executive|academic|business|family|wellness|financial|multiple",
  "messageType": "task|appointment|question|feedback|reminder|update|other",
  "extractedData": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "location": "string",
    "people": ["string"],
    "priority": "high|medium|low",
    "deadline": "YYYY-MM-DD"
  },
  "responseType": "confirmation|clarification|information|action",
  "suggestedResponse": "string"
}
```"

## Project Achievements and Challenges

### Achievements

The project has achieved several significant milestones:
* Created a comprehensive domain-based system design
* Implemented a Supabase database structure
* Set up n8n for workflow automation
* Integrated with WhatsApp for messaging
* Designed sophisticated message processing workflows
* Demonstrated remarkable persistence in overcoming technical challenges

### Challenges

The project encountered several significant challenges:
* Calendar Integration: Google Calendar for better integration capabilities
* Data Storage Challenges: Transitioned to Supabase for robust data management, hosted on the same Hostinger server as n8n
* Complex Message Processing: Developed a sophisticated GPT prompt to analyze and categorize messages
* System Complexity Management: Adopted an incremental approach, focusing on one component at a time
* Technical Learning Curve: Persisted through learning multiple platforms and technologies

## User Emotional Journey

The user experienced a range of emotions throughout this project:
* Initial Overwhelm: Feeling overwhelmed by numerous responsibilities and the complexity of creating a management system
* Excitement: Enthusiasm about the potential of a domain-based system to organize their life
* Frustration: Encountering technical limitations and integration challenges
* Determination: Persisting through difficulties and seeking alternative solutions
* Satisfaction: Successfully implementing components of the system and seeing them work
* Adaptability: Willingness to pivot to new platforms when necessary
* Growth Mindset: Embracing the learning process despite technical challenges

## Enhanced Time Management Approach

The enhanced time management approach focuses on:
* Task Foveation: Presenting the most relevant tasks based on context
* Energy-Based Task Selection: Matching tasks to the user's current energy level
* Context Awareness: Considering the user's location, available tools, and current state
* Task Dependencies: Managing prerequisites and related tasks
* Completion Tracking: Monitoring progress and celebrating achievements

## Supabase Schema Enhancements

To support the enhanced time management approach, the Supabase schema was extended with additional fields for context tags, energy levels, dependencies, and completion tracking.

## Implementation Strategy

The implementation of the enhanced approach follows a phased strategy:
* Phase 1: Set up Supabase tables for all structured data
* Phase 2: Configure Google Drive for document storage
* Phase 3: Implement Pinecone for vector search of documents
* Phase 4: Develop n8n workflows connecting WhatsApp/voice interface to Supabase and Pinecone
* Phase 5: Create the morning summary workflow
* Phase 6: Implement task polling functionality
* Phase 7: Add context awareness and energy level considerations
* Phase 8: Implement completion tracking and statistics

## Simplified Technical Architecture

* User Interface Layer:
  * Primary: WhatsApp Business API (text and voice messages)
  * Secondary: ElevenLabs voice interface
* Workflow Layer:
  * n8n for all automation workflows
  * Handles message processing, task management, and domain coordination
* Data Layer:
  * Supabase: All structured data (tasks, accounting, Quran tracking, etc.)
  * Google Drive: Document storage
  * Pinecone: Vector embeddings for semantic search
* Integration Layer:
  * n8n connects all components through API calls
  * No custom code required for basic functionality

## Domain-Based Email Integration System

The RexOS Email Integration System creates dedicated email addresses for each domain, establishing a powerful and familiar interface for document management and domain-specific interactions. This approach leverages existing email habits while extending RexOS capabilities through automated processing workflows.

### Email Address Configuration

Each domain has a dedicated email address for receiving communications and documents:

#### Executive Domain (executive.rexos@gmail.com)
* Process official documents (IDs, passports, licenses, certificates)
* Track expiration dates and set up reminder workflows
* Maintain a secure repository of important documents
* Create summary reports of document status
* Handle general inquiries and route to appropriate specialized domains
* Receive and process travel documents and itineraries
* **External Senders**: Government agencies, administrative services, travel agencies, general contacts

#### Academic Domain (academic.rexos@gmail.com)
* Receive course materials, study resources, and Quran references
* Organize educational content in subject-specific folders
* Extract study topics to create learning task entries
* Index documents for Pinecone vector search
* Process academic deadlines and requirements
* Manage study group communications and resources
* **External Senders**: Professors, academic advisors, study groups, religious teachers, educational institutions

#### Business Domain (business.rexos@gmail.com)
* Receive client briefs, contracts, and project materials
* Organize business documents by client and project
* Extract project deadlines and deliverables to create task entries
* Process invoices and payment confirmations
* Manage business communications and follow-ups
* Handle video production assets and requirements
* **External Senders**: Clients, business partners, vendors, contractors, industry contacts

#### Family Domain (family.rexos@gmail.com)
* Collect family photos, event invitations, and school documents
* Organize family memories in chronological/event-based albums
* Extract event details to create calendar entries
* Maintain family document archives (medical records, school reports)
* Process family communications and coordination
* Handle household management documents
* **External Senders**: Family members, children's schools, event organizers, household service providers

#### Wellness Domain (wellness.rexos@gmail.com)
* Collect health records, fitness tracking data, and wellness articles
* Organize health documentation chronologically
* Extract health metrics to update wellness tracking
* Store workout plans and nutrition information
* Process appointment summaries and medical instructions
* Manage fitness and nutrition program materials
* **External Senders**: Doctors, fitness trainers, nutritionists, wellness coaches, health insurance providers

#### Financial Domain (financial.rexos@gmail.com)
* Receive and automatically categorize invoices, receipts, and financial statements
* Extract key data (amount, date, vendor) and add to financial tracking
* Store financial documents in organized Google Drive folders
* Send confirmation of processing with suggested categorization
* Process tax documents and financial reports
* Manage investment and insurance communications
* **External Senders**: Banks, investment platforms, insurance companies, tax authorities, accountants

### Example Workflow Scenarios

#### Personal Document Processing (Executive Domain)
1. Government agency emails passport renewal notification to executive.rexos@gmail.com
2. n8n workflow identifies document as official ID document
3. Document is stored in "Official Documents" folder in Google Drive
4. Expiration date is extracted and added to "Document Tracking" table in Supabase
5. Reminder is set for 3 months before expiration
6. Document is indexed in Pinecone for future reference
7. Confirmation message is sent to user via WhatsApp with document details and expiration date

#### Academic Document Processing (Academic Domain)
1. Professor emails course syllabus to academic.rexos@gmail.com
2. n8n workflow identifies document as academic syllabus
3. Document is stored in appropriate course folder in Google Drive
4. Key dates and assignments are extracted to "Academic Calendar" in Supabase
5. Document is indexed in Pinecone for future semantic search
6. Tasks are created for upcoming assignments with appropriate deadlines
7. Confirmation email is sent with summary of extracted deadlines

#### Business Document Processing (Business Domain)
1. Client emails project brief to business.rexos@gmail.com
2. n8n workflow categorizes as client project document
3. Document is stored in client-specific project folder in Google Drive
4. Project requirements and deadlines are extracted to "Projects" table in Supabase
5. Tasks are created based on deliverables mentioned in the brief
6. Document is indexed in Pinecone for future reference
7. Confirmation email is sent to client acknowledging receipt and next steps

#### Family Event Processing (Family Domain)
1. School emails event invitation to family.rexos@gmail.com
2. n8n workflow identifies document as event invitation
3. Document is stored in "School Events" folder in Google Drive
4. Event details (date, time, location) are extracted to "Family Calendar" in Supabase
5. Calendar entry is created for the event
6. Document is indexed in Pinecone for future reference
7. Notification is sent to user via WhatsApp with event details and option to confirm attendance

## Future Directions and Recommendations

Based on the progress made and the enhanced time management approach, the following future directions are recommended:
* Complete the Supabase database setup with appropriate tables and fields
* Configure Google Drive folders for organized document storage
* Set up Pinecone index and document embedding process
* Implement WhatsApp integration with n8n for the unified interface
* Develop the morning summary workflow
* Create the task polling conversation flow with RexOS
* Implement ElevenLabs voice interface as an alternative input method
* Extend the Supabase tables to include context tags and energy level requirements
* Create domain-specific workflows for contributing tasks to the central pool

## System Philosophy and Design Principles

The design and development of RexOS are driven by a set of core values and a clear philosophy aimed at empowering the user and enhancing their overall well-being. The fundamental purpose of RexOS is to liberate the user from the constant mental burden of incomplete work and the "firefighting mentality" that arises from the challenges of scheduling and task management. This system seeks to alleviate the cognitive load on the conscious mind, paving the way for increased feelings of comfort, happiness, and creativity.

Key characteristics of RexOS include:
* Frictionless: The system operates smoothly and seamlessly, minimizing any obstacles or resistance to user interaction
* Stretchy: The system is flexible and adaptable, accommodating changes in the user's schedule and priorities
* Invisible: The system works in the background, requiring minimal attention from the user
* Pressure-Free: The system reduces stress and anxiety by managing tasks and deadlines effectively
* Second Brain: The system serves as an extension of the user's cognitive capabilities, remembering and organizing information

The project emphasizes an iterative and user-centered approach, constantly adapting to feedback and new insights to deliver a truly effective and empowering personal management solution.

## Contextual Awareness

This approach combines awareness of the user's cognitive state with an understanding of how the current task relates to other tasks in the user's schedule and goals. The system will prompt the user with a single question that encompasses their emotional, physical, and mental state, as well as their location (car, home, office) and available tools (iPad, phone, laptop, etc.).

Additionally, it would analyze the task itself:
* Task Dependencies: Is this task a prerequisite for another? Is it part of a larger project?
* Task Context: What domain does this task belong to? What tools or resources are required?
* Task Energy: How much mental or physical energy does this task require?
* Task Urgency: Is this task time-sensitive? What is the deadline?
* Task Importance: How does this task align with the user's goals and priorities?

The system would then use this information to suggest the most appropriate task for the user's current state:
* If the user indicates they are low energy, the system might suggest a less demanding task, or suggest rescheduling the task if it is not urgent

## Technical Documentation

This technical documentation section provides detailed information about the architecture, components, and functionalities of the RexOS system. It covers the roles and responsibilities of each domain, the communication and coordination mechanisms employed, and the reward and scoring system designed to optimize system performance.

### Domain-Based System Details

#### Domain Roles and Responsibilities

Each domain is assigned specific responsibilities tailored to different aspects of the user's life:

* **Executive Domain**:
  * Morning briefings and daily planning
  * Task prioritization and scheduling
  * Document tracking and management
  * Travel planning and coordination
  * General inquiry handling and routing

* **Academic Domain**:
  * University course management
  * Assignment tracking and deadlines
  * Study resource organization
  * Quran memorization progress tracking
  * Learning schedule optimization

* **Business Domain**:
  * Client project management
  * Business communication handling
  * Invoice and payment tracking
  * Video production coordination
  * Business development support

* **Family Domain**:
  * Family event scheduling
  * School activity coordination
  * Household management
  * Family communication organization
  * Family document archiving

* **Wellness Domain**:
  * Exercise routine scheduling
  * Workout tracking and progress monitoring
  * Sleep hygiene optimization
  * Health metric tracking
  * Wellness appointment management

* **Financial Domain**:
  * Budget tracking and management
  * Expense categorization and analysis
  * Investment monitoring
  * Financial goal tracking
  * Tax preparation support

#### System Coordination Mechanisms

RexOS employs several mechanisms to ensure effective coordination across domains:

* **Central Task Pool**: All tasks from all domains are collected in a central pool, allowing for cross-domain prioritization and scheduling
* **Context Tagging**: Tasks are tagged with context information to enable filtering based on the user's current state
* **Energy Level Matching**: Tasks are assigned energy level requirements to match with the user's current energy state
* **Dependency Tracking**: Task dependencies are tracked to ensure prerequisites are completed before dependent tasks
* **Morning Briefing**: A daily summary of tasks, appointments, and priorities across all domains
* **Task Polling**: On-demand task suggestions based on the user's current context and energy level
* **Completion Tracking**: Monitoring of task completion and progress across all domains

#### Learning and Adaptation

The system is designed to learn from the user's behavior and adapt to their preferences over time. This includes learning which tasks the user typically chooses in different contexts and adjusting task prioritization accordingly.

#### Guiding Principles and Philosophy

The design of RexOS is driven by a philosophy that emphasizes user empowerment, well-being, and seamless integration into the user's life. The system is designed to be frictionless, stretchy, invisible, pressure-free, and to act as a "second brain" for the user. It also has a personality that learns the user.

### RememberThis Feature

The RememberThis feature allows the user to quickly capture thoughts, ideas, and information for later retrieval. This feature is accessible across all domains and serves as a universal capture system for the user's mental notes.

### Technical Stack

The RexOS system is built on a carefully selected stack of technologies:

* **n8n** provides:
  * Workflow automation for message processing
  * Integration with WhatsApp, Google Drive, and other services
  * Custom nodes for domain-specific functionality
  * Scheduled workflows for recurring tasks

* **Supabase** provides:
  * Structured data storage for all domains
  * Simple, spreadsheet-like interface for non-developers
  * Relational database capabilities without SQL knowledge
  * Built-in forms, views, and automations
  * API access for n8n integration

* **Pinecone** provides:
  * Vector search for the 25,000 pages of course materials
  * Simple API for embedding and retrieving documents
  * Efficient semantic search capabilities

* **Google Drive** serves as document storage, with Pinecone indexing the content

This combination creates a simpler, more user-friendly approach that doesn't require advanced database knowledge while still providing powerful functionality across all domains.
