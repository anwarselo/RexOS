// Restore Caption node code
// Created: April 29, 2023
// Purpose: Restores caption and classification data from the Classify node after HTTP request processing
// Used in the WhatsApp image processing workflow to maintain caption information

// Get the HTTP response data
const httpData = $input.item.json;

// Restore the original data from the Classify node
// We know the caption and classification are in the original data
const result = {
  // Keep the HTTP response data
  ...httpData,
  
  // Restore the important fields from before
  messageContent: $node["Classify"].json.messageContent,
  classification: $node["Classify"].json.classification,
  messageType: $node["Classify"].json.messageType,
  mediaInfo: $node["Classify"].json.mediaInfo,
  sessionId: $node["Classify"].json.sessionId,
  sender: $node["Classify"].json.sender,
  timestamp: $node["Classify"].json.timestamp
};

// Add debug information
result.debug = {
  restoredCaption: $node["Classify"].json.messageContent,
  originalClassification: $node["Classify"].json.classification.type
};

return {
  json: result
};
