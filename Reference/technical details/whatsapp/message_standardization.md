# RexOS Message Standardization

This document outlines the standardization process for messages in the RexOS system.

## Overview

Message standardization is a critical first step in the RexOS processing pipeline. It ensures that messages from different sources (WhatsApp, webhook, etc.) are transformed into a consistent format for downstream processing.

## Standardization Process

The standardization is handled by the `STDRD_node_code_current.js` file, which implements the following process:

1. Receive raw message data from various sources
2. Detect the message source (WhatsApp, webhook, etc.)
3. Extract relevant information based on the source
4. Transform the data into a standardized format
5. Pass the standardized message to the next processing step

## Standardized Message Format

All messages, regardless of source, are transformed into the following format:

```javascript
{
  messageContent: "",          // The main text content of the message
  sessionId: "17789189938",    // Fixed session ID as requested
  sender: {
    id: "",                    // Sender identifier
    name: ""                   // Sender name if available
  },
  timestamp: "",               // ISO timestamp of when the message was received
  source: "",                  // Source of the message (whatsapp, webhook, etc.)
  messageType: "text",         // Type of message (text, image, audio, document)
  mediaInfo: null,             // Details about media if present
  rawData: {}                  // Original raw data for reference
}
```

### Media Information

For messages containing media, the `mediaInfo` field contains additional details:

#### Image Messages
```javascript
mediaInfo: {
  type: "image",
  id: "",                      // Media ID from WhatsApp
  mimeType: "image/jpeg",      // MIME type of the image
  sha256: "",                  // SHA256 hash of the image
  caption: ""                  // Caption text if provided
}
```

#### Audio Messages
```javascript
mediaInfo: {
  type: "audio",
  id: "",                      // Media ID from WhatsApp
  mimeType: "audio/ogg",       // MIME type of the audio
  sha256: ""                   // SHA256 hash of the audio
}
```

#### Document Messages
```javascript
mediaInfo: {
  type: "document",
  id: "",                      // Media ID from WhatsApp
  filename: "",                // Original filename
  mimeType: "",                // MIME type of the document
  sha256: ""                   // SHA256 hash of the document
}
```

## Source-Specific Processing

### WhatsApp Messages

WhatsApp messages are identified by checking for the `messaging_product` field with a value of "whatsapp". The system extracts:

- Message content from the appropriate field based on message type
- Sender information from the contacts array
- Timestamp from the message timestamp
- Media information for non-text messages

### Webhook Messages

Webhook messages are identified by checking for query parameters. The system extracts:

- Message content from the `messageContent` query parameter
- Sender information from the `senderId` and `senderName` query parameters
- Current timestamp as the message timestamp

## Benefits of Standardization

1. **Consistent Processing**: All messages are processed the same way regardless of source
2. **Simplified Downstream Logic**: Processing nodes don't need to handle different message formats
3. **Easier Integration**: New message sources can be added by updating only the standardization logic
4. **Better Debugging**: Standardized format makes it easier to track messages through the system

## Implementation Notes

- The session ID is fixed to "17789189938" as requested
- For messages with unknown format, default values are provided
- The original raw data is preserved for reference if needed
- Timestamps are converted to ISO format for consistency

---

*Last Updated: 2023-04-30 13:50*
