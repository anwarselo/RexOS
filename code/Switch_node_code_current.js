// Switch Node for Message Type Routing
// Last updated: 2023-04-30 12:45
// This node routes messages to different processing streams based on message type

// Configuration:
// - Type: Switch Node
// - Rules:
//   1. TEXT: {{$json.messageType}} equals "text"
//   2. IMAGE: {{$json.messageType}} equals "image"
//   3. AUDIO: {{$json.messageType}} equals "audio"
//   4. DOCUMENT: {{$json.messageType}} equals "document"

// This node implements the new message processing architecture with separate streams:
// - Text messages go to the text processing stream
// - Image messages go to the image processing stream with vision model
// - Audio messages go to the audio transcription stream
// - Document messages go to the document processing stream

// Each stream is optimized for its specific content type
// This improves maintainability and makes troubleshooting easier
