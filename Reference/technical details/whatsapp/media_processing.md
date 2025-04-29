# RexOS Media Processing

This document outlines the media processing capabilities in the RexOS system.

## Overview

RexOS supports processing various types of media from WhatsApp messages, including images, audio, and documents. Each media type follows a specialized processing path optimized for its content type.

## Media Types Supported

### Images

Images sent through WhatsApp are processed to extract visual information and any accompanying caption text.

### Audio

Audio messages (voice notes) are transcribed to text for further processing.

### Documents

Documents are stored and their metadata is processed for reference.

## Media Processing Flow

All media types follow a similar two-step retrieval process before specialized processing:

### Step 1: Media URL Retrieval

When a media message is received, RexOS first retrieves the media URL from the WhatsApp API:

```javascript
// Get the media URL using the media ID
const mediaUrlResponse = $http.get({
  url: `https://graph.facebook.com/v18.0/${mediaInfo.id}`,
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Step 2: Media Download

Once the URL is obtained, RexOS downloads the actual media file:

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

## Specialized Processing by Media Type

### Image Processing

After download, images are processed through:

1. **Vision Model Analysis**: The image is analyzed using OpenAI's vision model to extract content information
2. **Caption Extraction**: Any caption text is extracted and analyzed
3. **Content Correlation**: The vision model output and caption are correlated for comprehensive understanding
4. **Action Determination**: Based on the analysis, appropriate actions are determined

### Audio Processing

After download, audio files are processed through:

1. **Transcription**: The audio is transcribed to text using OpenAI's Whisper model
2. **Text Analysis**: The transcribed text is analyzed like a regular text message
3. **Action Determination**: Based on the analysis, appropriate actions are determined

### Document Processing

After download, documents are processed through:

1. **Storage**: The document is stored in Google Drive for future reference
2. **Metadata Extraction**: Filename, type, and other metadata are extracted
3. **Action Determination**: Based on the document type and metadata, appropriate actions are determined

## Implementation Components

### Image Processing Components

- **Image Media URL Retrieval**: Retrieves the URL for the image
- **Image Media Download**: Downloads the image data
- **Image Analyzer**: Analyzes the image content using vision models

### Audio Processing Components

- **Voice Media URL Retrieval**: Retrieves the URL for the audio
- **Voice Media Download**: Downloads the audio data
- **Voice Transcriber**: Transcribes the audio to text

### Document Processing Components

- **Document Media URL Retrieval**: Retrieves the URL for the document
- **Document Media Download**: Downloads the document data
- **Google Drive**: Stores the document in Google Drive

## Error Handling

Media processing includes error handling for various scenarios:

- **Download Failures**: If media download fails, appropriate error messages are generated
- **Processing Failures**: If specialized processing fails, fallback mechanisms are in place
- **Unsupported Media**: For unsupported media types, users receive appropriate notifications

## Security Considerations

- All media is processed securely with proper authentication
- Media is not stored permanently unless explicitly required
- Sensitive information in media is handled according to privacy guidelines

## Future Enhancements

1. **Enhanced Vision Analysis**: Deeper integration with advanced vision models
2. **Improved Transcription**: Better audio transcription for various accents and languages
3. **Document Content Extraction**: Extract and process text content from documents
4. **Media Transformation**: Convert between media formats as needed
5. **Multi-media Messages**: Handle messages with multiple media attachments

---

*Last Updated: 2023-04-30 14:00*
