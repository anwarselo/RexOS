// Standardize output from webhook and WhatsApp triggers
// Last updated: 2023-04-30 12:45
function standardizeMessage(inputData) {
  // Initialize standardized output structure with fixed session ID
  const standardOutput = {
    messageContent: "",
    sessionId: "17789189938", // Fixed session ID as requested
    sender: {
      id: "",
      name: ""
    },
    timestamp: new Date().toISOString(),
    source: "",
    messageType: "text", // Default to text
    mediaInfo: null, // Will contain media details if present
    rawData: inputData // Store original data for reference if needed
  };

  // Check if this is a WhatsApp message
  if (inputData.messaging_product === "whatsapp" && inputData.messages && inputData.messages.length > 0) {
    // This is a WhatsApp message
    const message = inputData.messages[0];
    const contact = inputData.contacts && inputData.contacts.length > 0 ? inputData.contacts[0] : {};
    
    // Handle different message types
    if (message.type === "text" && message.text) {
      standardOutput.messageContent = message.text.body || "";
      standardOutput.messageType = "text";
    } else if (message.type === "image" && message.image) {
      // For image messages, use the caption as the message content if available
      standardOutput.messageContent = message.image.caption || "";
      standardOutput.messageType = "image";
      standardOutput.mediaInfo = {
        type: "image",
        id: message.image.id || "",
        mimeType: message.image.mime_type || "image/jpeg",
        sha256: message.image.sha256 || "",
        caption: message.image.caption || ""
      };
    } else if (message.type === "audio" && message.audio) {
      standardOutput.messageContent = "Voice message";
      standardOutput.messageType = "audio";
      standardOutput.mediaInfo = {
        type: "audio",
        id: message.audio.id || "",
        mimeType: message.audio.mime_type || "audio/ogg",
        sha256: message.audio.sha256 || ""
      };
    } else if (message.type === "document" && message.document) {
      standardOutput.messageContent = message.document.filename || "Document message";
      standardOutput.messageType = "document";
      standardOutput.mediaInfo = {
        type: "document",
        id: message.document.id || "",
        filename: message.document.filename || "",
        mimeType: message.document.mime_type || "",
        sha256: message.document.sha256 || ""
      };
    } else {
      standardOutput.messageContent = `Unsupported message type: ${message.type}`;
      standardOutput.messageType = message.type || "unknown";
    }
    
    standardOutput.sender = {
      id: contact.wa_id || message.from || "",
      name: contact.profile?.name || ""
    };
    standardOutput.timestamp = message.timestamp ? new Date(parseInt(message.timestamp) * 1000).toISOString() : standardOutput.timestamp;
    standardOutput.source = "whatsapp";
    standardOutput.messageId = message.id || "";
    
  } 
  // Check if this is a webhook with query parameters
  else if (inputData.query && inputData.query.messageContent) {
    // This is a webhook message
    standardOutput.messageContent = inputData.query.messageContent || "";
    standardOutput.sender = {
      id: inputData.query.senderId || "webhook-user",
      name: inputData.query.senderName || "Webhook User"
    };
    standardOutput.source = "webhook";
    standardOutput.webhookUrl = inputData.webhookUrl || "";
  }
  // Handle other potential formats or empty data
  else {
    standardOutput.messageContent = "Unknown message format";
    standardOutput.source = "unknown";
  }

  return standardOutput;
}

// Get the input data (first item in the array)
const inputData = $input.all()[0].json;

// Process and return standardized output
return {
  json: standardizeMessage(inputData)
};
