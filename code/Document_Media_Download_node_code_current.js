// Document Media Download Node
// Last updated: 2023-04-30 12:45
// This node downloads the actual document file using the URL retrieved from the previous node

// The URL comes from the previous node's response
// WhatsApp API credentials are used for authentication
// The response will be the binary document data

// No custom code is needed as this is a standard HTTP Request node
// Configuration:
// - URL: {{ $json.url }}
// - Authentication: WhatsApp API credentials
// - Method: GET
// - Response Format: arraybuffer (for binary data)

// The downloaded document can then be passed to the Google Drive node for storage
