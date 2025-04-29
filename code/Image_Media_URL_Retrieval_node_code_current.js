// Image Media URL Retrieval Node
// Last updated: 2023-04-30 12:45
// This node retrieves the URL for an image media from the WhatsApp API

// The URL is constructed using the media ID from the incoming data
// URL format: https://graph.facebook.com/v18.0/{mediaId}
// The WhatsApp API credentials are used for authentication

// No custom code is needed as this is a standard HTTP Request node
// Configuration:
// - URL: https://graph.facebook.com/v18.0/{{ $json.mediaInfo.id }}
// - Authentication: WhatsApp API credentials
// - Method: GET

// The response will contain a URL that can be used to download the actual media file
