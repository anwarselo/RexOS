// System Message Filter Node
// Last updated: 2023-04-30 12:45
// This node filters out system messages and only passes through actual user messages

// Configuration:
// - Type: IF Node
// - Conditions (OR):
//   1. {{$json.messages && $json.messages[0].text && $json.messages[0].text.body}}
//   2. {{$json.messages && $json.messages[0].image && $json.messages[0].image.caption}}
//   3. {{$json.messages && $json.messages[0].type === 'audio' && $json.messages[0].audio}}
//   4. {{$json.messages && $json.messages[0].type === "image" && $json.messages[0].image}}
//   5. {{$json.messages && $json.messages[0].type === "document" && $json.messages[0].document}}

// This node ensures that only actual messages with content are processed
// It filters out delivery receipts, read receipts, and other system messages
// Only messages that match one of the conditions will be passed to the next node
