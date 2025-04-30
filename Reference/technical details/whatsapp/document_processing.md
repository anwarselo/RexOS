# RexOS Document Processing

This document outlines the document processing capabilities in the RexOS system.

## Overview

RexOS provides comprehensive document processing capabilities for documents sent through WhatsApp. The system can extract text content from documents using OCR, analyze the content, and store both the original document and its extracted information.

## Document Processing Flow

When a document is received through WhatsApp, it follows this processing flow:

1. **Document Detection**: The Switch node identifies the message as a document type
2. **URL Retrieval**: Document Media URL Retrieval node gets the document URL from WhatsApp
3. **Document Download**: Document Media Download node downloads the document content
4. **Document Storage**: Document Save to GDrive node stores the document in Google Drive
5. **OCR Processing**: The document is sent to Mistral AI for OCR processing
6. **Content Extraction**: Document Information Extractor extracts structured data from the document
7. **Response Generation**: The system generates a response based on the document content

## Implementation Components

### Document Media Handling

The document processing stream uses these components for media handling:

```javascript
// Document Media URL Retrieval
const documentMediaUrlRetrieval = {
  parameters: {
    url: `https://graph.facebook.com/v18.0/${mediaInfo.id}`,
    authentication: "predefinedCredentialType",
    nodeCredentialType: "whatsAppApi"
  },
  type: "n8n-nodes-base.httpRequest"
};

// Document Media Download
const documentMediaDownload = {
  parameters: {
    url: "={{ $json.url }}",
    authentication: "predefinedCredentialType",
    nodeCredentialType: "whatsAppApi"
  },
  type: "n8n-nodes-base.httpRequest"
};
```

### Document Storage

Documents are stored in Google Drive for future reference:

```javascript
// Document Save to GDrive
const documentSaveToGDrive = {
  parameters: {
    name: "={{ $('Classify').item.json.messageContent }}",
    driveId: "My Drive",
    folderId: "6707 Documents"
  },
  type: "n8n-nodes-base.googleDrive"
};
```

### OCR Processing with Mistral AI

The system uses Mistral AI for OCR processing:

```javascript
// Upload to Mistral
const uploadToMistral = {
  parameters: {
    method: "POST",
    url: "https://api.mistral.ai/v1/files",
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    contentType: "multipart-form-data",
    bodyParameters: [
      { name: "purpose", value: "ocr" },
      { name: "file", inputDataFieldName: "data" }
    ]
  },
  type: "n8n-nodes-base.httpRequest"
};

// Get OCR Results
const getOcrResults = {
  parameters: {
    method: "POST",
    url: "https://api.mistral.ai/v1/ocr",
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    jsonBody: {
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: "{{ $json.url }}"
      },
      include_image_base64: true
    }
  },
  type: "n8n-nodes-base.httpRequest"
};
```

### Content Analysis

The Document Information Extractor analyzes the OCR results to extract structured information:

```javascript
// Document Information Extractor
const documentInformationExtractor = {
  parameters: {
    text: "={{ $json.pages[0].markdown }}",
    attributes: {
      attributes: [
        {
          name: "Content",
          description: "A full Description of this document including any unique identifiers like number or ID or name or expiry date or urgent information."
        }
      ]
    }
  },
  type: "@n8n/n8n-nodes-langchain.informationExtractor"
};
```

## Supported Document Types

The document processing system supports various document types:

- PDF documents
- Microsoft Office documents (Word, Excel, PowerPoint)
- Text documents
- Images of documents (which are processed as documents rather than images)
- Scanned documents

## OCR Capabilities

The Mistral AI OCR integration provides these capabilities:

- Text extraction from images and scanned documents
- Table detection and extraction
- Form field identification
- Multi-language support
- Layout preservation

## Information Extraction

The Document Information Extractor can identify and extract:

- Document type (invoice, ID card, receipt, etc.)
- Key identifiers (document numbers, IDs, reference codes)
- Dates (issue date, expiry date, due date)
- Personal information (names, addresses, contact details)
- Financial information (amounts, account numbers)
- Action items or important notes

## Future Enhancements

Planned enhancements for the document processing system include:

1. **Document Type Detection**: Automatically identify document types for specialized processing
2. **Structured Data Extraction**: Extract specific fields based on document type
3. **Database Integration**: Store extracted metadata in Supabase for better searchability
4. **Document Classification**: Categorize documents by type and content
5. **Multi-page Document Support**: Enhanced processing for multi-page documents

## Integration with Memory System

In future iterations, the document processing system will integrate with the memory storage system to:

1. Store document metadata as memories
2. Link to the original document in Google Drive
3. Set reminders based on document dates (e.g., expiry dates)
4. Enable retrieval of document information through natural language queries

---

*Last Updated: 2023-05-01 11:00*
