# RexOS Message Classification

This document outlines the message classification system used in RexOS.

## Overview

Message classification is a key component of the RexOS system that determines how messages should be processed. The classification system analyzes message content to identify the user's intent and route the message to the appropriate processing logic.

## Classification Process

The classification is handled by the `Classify_node_code_current.js` file, which implements the following process:

1. Receive standardized message data
2. Extract and analyze the message content
3. Match the content against predefined patterns
4. Determine the most likely classification
5. Add classification metadata to the message
6. Pass the classified message to the next processing step

## Classification Categories

The system currently classifies messages into the following categories:

### Memory Storage

Messages related to storing information for later retrieval. These include:
- Reminders
- Notes
- Facts to remember
- Information storage requests

### Task Management

Messages related to creating or managing tasks. These include:
- Task creation requests
- Task status inquiries
- Task list requests
- Task updates

### Unknown

Messages that don't match any known patterns are classified as "unknown" and may require further processing or human intervention.

### Unclassifiable

Non-text messages (images without captions, audio, etc.) that cannot be classified using text patterns are marked as "unclassifiable".

## Pattern Matching

The classification system uses pattern matching to identify the message category. It looks for specific keywords and phrases in both English and Arabic:

### Memory Storage Patterns

English patterns include phrases like:
- "remember this"
- "remind me to"
- "make a reminder"
- "note this"
- "save this"
- "keep this in mind"

Arabic patterns include phrases like:
- "تذكير"
- "ذكرني بـ"
- "اعمل تذكير"
- "احفظ هذا"

### Task Management Patterns

English patterns include phrases like:
- "make a task"
- "create a task"
- "check my tasks"
- "add a task"
- "task list"

Arabic patterns include phrases like:
- "مهمة"
- "اعمل مهمة"
- "تحقق من مهامي"
- "أضف مهمة"

## Classification Logic

The classification logic follows these steps:

1. Check if the message is a text message (or has caption text)
2. If not, mark as "unclassifiable" and exit
3. Find the earliest occurrence of any memory storage pattern
4. Find the earliest occurrence of any task management pattern
5. If both types of patterns are found, classify based on which appears first
6. If only one type of pattern is found, classify accordingly
7. If no patterns are found, classify as "unknown"

## Classification Metadata

The classification system adds the following metadata to the message:

```javascript
classification: {
  type: "",                  // Classification type (memory_storage, task_management, unknown, unclassifiable)
  confidence: 0.0,           // Confidence score (0.0 to 1.0)
  matchedPattern: "",        // The specific pattern that matched (if any)
  reason: "",                // Explanation for the classification
  memoryPosition: -1,        // Position of the earliest memory pattern (-1 if none)
  taskPosition: -1           // Position of the earliest task pattern (-1 if none)
}
```

## Special Cases

### Image Captions

For image messages with captions, the caption text is used for classification. This allows users to send images with captions containing memory storage or task management commands.

### Multiple Intents

If a message contains multiple intents (e.g., "remember to make a task"), the system classifies based on the first intent that appears in the message. This approach prioritizes the user's primary intent.

## Future Enhancements

1. **LLM Integration**: Enhance classification with language models for better understanding
2. **Intent Recognition**: Move beyond pattern matching to true intent recognition
3. **Multi-intent Handling**: Support messages with multiple distinct intents
4. **Confidence Thresholds**: Implement confidence thresholds for uncertain classifications
5. **User Feedback Loop**: Learn from user corrections to improve classification accuracy

---

*Last Updated: 2023-04-30 13:55*
