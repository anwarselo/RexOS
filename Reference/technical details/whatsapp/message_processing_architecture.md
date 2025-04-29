# RexOS Message Processing Architecture

This document outlines the architecture for processing different types of WhatsApp messages in RexOS.

## Overview

The RexOS message processing system is designed to handle various types of WhatsApp messages (text, image, audio) through specialized processing streams. This approach improves maintainability, makes troubleshooting easier, and allows for optimized handling of each content type.

## Architecture

The message processing is divided into two main streams:

### 1. Text Processing Stream

This stream handles all text-based content, including:
- Direct text messages from users
- Transcribed audio messages

**Processing Flow:**
1. Message type detection
2. For text messages: Direct routing to text processing
3. For audio messages:
   - Media URL retrieval
   - Audio file download
   - Transcription to text
   - Routing to text processing
4. Text analysis and classification
5. Action determination based on content

### 2. Visual Processing Stream

This stream handles image-based content:

**Processing Flow:**
1. Media URL retrieval
2. Image file download
3. Vision model analysis
4. Caption extraction (if present)
5. LLM interpretation of visual content
6. Action determination based on visual analysis

## Implementation Details

### Media Handling

For both image and audio messages, the system follows a two-step process to access the media:

1. **Media URL Retrieval:**
   ```javascript
   // Get the media URL using the media ID
   const mediaUrlResponse = $http.get({
     url: `https://graph.facebook.com/v18.0/${mediaInfo.id}`,
     headers: {
       'Authorization': `Bearer ${accessToken}`
     }
   });
   ```

2. **Media Download:**
   ```javascript
   // Download the actual media file
   const mediaResponse = $http.get({
     url: mediaUrl,
     headers: {
       'Authorization': `Bearer ${accessToken}`
     },
     responseFormat: 'arraybuffer'  // For binary data
   });
   ```

### Audio Transcription

Audio messages are transcribed using a transcription service (e.g., OpenAI Whisper) and then processed as text messages.

### Image Analysis

Images are analyzed using a vision model to extract content information, which is then combined with any caption text for comprehensive understanding.

## Benefits of This Architecture

1. **Improved Troubleshooting:** Issues with one message type don't affect processing of other types
2. **Specialized Processing:** Each content type receives optimized handling
3. **Maintainability:** Easier to update or modify processing for specific content types
4. **Scalability:** New message types can be added with minimal changes to existing code
5. **Robustness:** Better error handling for each specific message type

## Future Enhancements

1. **Enhanced Vision Model Integration:** Deeper integration with advanced vision models for better image understanding
2. **Improved Audio Transcription:** Integration with more accurate transcription services
3. **Multi-modal Understanding:** Combining insights from different message types in the same conversation
4. **Contextual Processing:** Maintaining conversation context across different message types

---

*Last Updated: 2023-04-30*
