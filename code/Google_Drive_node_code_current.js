// Google Drive Node
// Last updated: 2023-04-30 12:45
// This node uploads documents to Google Drive for storage

// Configuration:
// - Operation: Upload
// - Drive: My Drive
// - Folder: RexOS Received from Whatsapp (ID: 1wy1DlW8UC38JHTVfSXiuBnZXrUF1VVdE)
// - File Name: {{ $('Classify').item.json.messageContent }}
// - Binary Data: Data from Document Media Download node

// No custom code is needed as this is a standard Google Drive node
// The node takes the binary document data and uploads it to the specified Google Drive folder
// The file name is set to the message content from the Classify node

// This allows documents to be stored and accessed later if needed
