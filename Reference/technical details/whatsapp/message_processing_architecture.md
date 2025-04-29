# RexOS Message Processing Architecture

This document outlines the architecture for processing different types of WhatsApp messages in RexOS.

## Overview

The RexOS message processing system is designed to handle various types of WhatsApp messages (text, image, audio) through specialized processing streams. This approach improves maintainability, makes troubleshooting easier, and allows for optimized handling of each content type.

## Architecture

The message processing is divided into four specialized streams:

### 1. Text Processing Stream

This stream handles direct text messages from users.

**Processing Flow:**
1. Message type detection (via Switch node)
2. Text message routing to text processing
3. Text analysis and classification
4. Action determination based on content

### 2. Image Processing Stream

This stream handles image-based content:

**Processing Flow:**
1. Media URL retrieval (via Image Media URL Retrieval node)
2. Image file download (via Image Media Download node)
3. Vision model analysis (via Image Analyzer node)
4. Caption extraction and interpretation
5. LLM interpretation of visual content
6. Action determination based on visual analysis

### 3. Audio Processing Stream

This stream handles voice messages:

**Processing Flow:**
1. Media URL retrieval (via Voice Media URL Retrieval node)
2. Audio file download (via Voice Media Download node)
3. Transcription to text (via Voice Transcriber node)
4. Text analysis of transcribed content
5. Action determination based on transcribed content

### 4. Document Processing Stream

This stream handles document messages:

**Processing Flow:**
1. Media URL retrieval (via Document Media URL Retrieval node)
2. Document file download (via Document Media Download node)
3. Document storage (via Google Drive node)
4. Metadata extraction and processing
5. Action determination based on document type and content

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

*Last Updated: 2023-04-30 13:45*
