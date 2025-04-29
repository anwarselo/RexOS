  Enhanced Foveated Task System: Production-Ready Implementation Guide  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 100%; overflow-x: hidden; } pre { white-space: pre-wrap; } .container { max-width: 1000px; } .section { margin-bottom: 2rem; padding-bottom: 1rem; } .code-block { background-color: #f5f5f5; border-radius: 0.375rem; padding: 1rem; margin: 1rem 0; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 0.875rem; overflow-x: auto; } table { width: 100%; border-collapse: collapse; margin: 1rem 0; } th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; } th { background-color: #f8fafc; } .diagram { font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; white-space: pre; background-color: #f8fafc; padding: 1rem; border-radius: 0.375rem; margin: 1rem 0; overflow-x: auto; } .checklist-item { margin-bottom: 1rem; } .checklist-header { font-weight: 600; display: flex; align-items: center; } .checklist-header i { margin-right: 0.5rem; } .checklist-description { margin-left: 1.5rem; } 

Enhanced Foveated Task System
=============================

Production-Ready Implementation Guide
-------------------------------------

### Overview

This comprehensive guide outlines the implementation of a production-ready Enhanced Foveated Task System using Baserow, n8n, and WhatsApp Business. The system is designed to prioritize tasks based on importance, context, energy level, and available tools - similar to how human vision focuses sharply on the center of attention while maintaining peripheral awareness of surrounding elements.

The foveated task system takes inspiration from human vision, where we focus sharply on what's directly in front of us while maintaining awareness of peripheral elements. In task management, this means prioritizing tasks based on current context, energy levels, available tools, and importance - bringing the most relevant tasks into "focus" while keeping others in the "periphery."

### System Architecture

┌─────────────────────────────────────────────────────────────┐ │ User Interface │ │ (WhatsApp) │ └───────────────────────────┬─────────────────────────────────┘ │ ┌───────────────────────────▼─────────────────────────────────┐ │ n8n Workflows │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │ │ Context │ │ Task │ │ Task │ │ │ │ Assessment │◄─►│ Polling │◄─►│ Completion │ │ │ └─────────────┘ └─────────────┘ └─────────────────┘ │ │ ▲ ▲ ▲ │ │ │ │ │ │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │ │ Anti-Procrast│ │ Dependency │ │ Task Overload │ │ │ │ Module │ │ Manager │ │ Detection │ │ │ └─────────────┘ └─────────────┘ └─────────────────┘ │ └───────────────────────────┬─────────────────────────────────┘ │ ┌───────────────────────────▼─────────────────────────────────┐ │ Baserow Database │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │ │ Tasks │ │ Task Groups │ │ User Context │ │ │ └─────────────┘ └─────────────┘ └─────────────────┘ │ │ │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │ │ │ Projects │ │Task Metrics │ │ System Logs │ │ │ └─────────────┘ └─────────────┘ └─────────────────┘ │ └─────────────────────────────────────────────────────────────┘

### 1\. Data Model Hardening (Baserow)

Primary-key stability

Adopt UUIDs for Tasks, Task Groups, and User Context instead of auto-incrementing integers to prevent ID shifts after bulk imports or restores.

// Example UUID generation in n8n before creating Baserow records
const { v4: uuidv4 } = require('uuid');

function generateTaskRecord(taskData) {
  return {
    id: uuidv4(),
    name: taskData.name,
    description: taskData.description,
    // Other fields...
  };
}

Indexed lookup fields

Create database indexes on columns that appear in every filter query (e.g., status, deadline, task\_group\_id, calculated_priority) to keep API calls <200 ms once the table reaches ≥10k rows.

Baserow supports indexes through the Baserow backend API:

// Example n8n HTTP request to create an index
const response = await $http.post({
  url: `${baserowUrl}/api/database/fields/table/${tableId}/`,
  headers: { Authorization: \`Token ${baserowToken}\` },
  body: {
    name: 'status_idx',
    type: 'index',
    field_ids: \[statusFieldId\]
  }
});

Archival partitions

Add an "archived\_at" timestamp and move completed tasks older than N days into a separate "Tasks\_Archive" table via a nightly n8n Cron. This prevents formula recalculation cascades on stale data.

// Example n8n archival workflow (scheduled as Cron job)
// 1\. Query completed tasks older than N days
const archiveThresholdDays = 30;
const now = new Date();
const archiveThreshold = new Date(now.setDate(now.getDate() - archiveThresholdDays));

const tasksToArchive = await getCompletedTasksBeforeDate(archiveThreshold);

// 2\. Insert tasks into archive table
await batchInsertIntoArchive(tasksToArchive);

// 3\. Delete tasks from active table after successful archive
await batchDeleteArchivedTasks(tasksToArchive.map(t => t.id));

Immutable history

Spin up a Task_History table where every status transition is appended (task ID, from, to, timestamp, actor). This guards against silent overwrites by concurrent n8n executions and enables reliable audit-trails.

// Task_History Table Structure
{
  id: uuid,
  task_id: uuid,  // Reference to task
  previous_status: string,
  new_status: string,
  changed_fields: json,  // Records all changed fields
  changed_by: string,    // User or system identifier
  timestamp: datetime,   // When change occurred
  workflow\_execution\_id: string  // n8n workflow execution reference
}

// Example usage in task status update workflow
function recordTaskStatusChange(taskId, fromStatus, toStatus, actor) {
  return {
    id: uuidv4(),
    task_id: taskId,
    previous_status: fromStatus,
    new_status: toStatus,
    changed_fields: { status: { from: fromStatus, to: toStatus } },
    changed_by: actor,
    timestamp: new Date().toISOString(),
    workflow\_execution\_id: $execution.id
  };
}

Strict enum enforcement

Convert free-text selects (e.g., energy_level) into single-select fields with validation to keep formula branches predictable.

// Example validation function in n8n before writing to Baserow
function validateTaskData(taskData) {
  const validPriorities = \['High', 'Medium', 'Low'\];
  const validStatuses = \['Not Started', 'In Progress', 'Completed'\];
  const validEnergyLevels = \['High', 'Medium', 'Low'\];
  const validMentalClarity = \['High', 'Medium', 'Low'\];
  
  if (!validPriorities.includes(taskData.priority)) {
    throw new Error(\`Invalid priority: ${taskData.priority}. Valid values: ${validPriorities.join(', ')}\`);
  }
  
  if (!validStatuses.includes(taskData.status)) {
    throw new Error(\`Invalid status: ${taskData.status}. Valid values: ${validStatuses.join(', ')}\`);
  }
  
  if (!validEnergyLevels.includes(taskData.energy_level)) {
    throw new Error(\`Invalid energy level: ${taskData.energy_level}. Valid values: ${validEnergyLevels.join(', ')}\`);
  }
  
  if (!validMentalClarity.includes(taskData.mental\_clarity\_required)) {
    throw new Error(\`Invalid mental clarity: ${taskData.mental\_clarity\_required}. Valid values: ${validMentalClarity.join(', ')}\`);
  }
  
  return taskData;
}

### 2\. Workflow Decomposition (n8n)

Short-lived executables

Break giant workflows into chains triggered by Webhooks or Events rather than keeping long Wait nodes alive. Store interim context in Baserow and re-hydrate on the next incoming message.

// Instead of this (problematic):
\[Trigger\] → \[Process Message\] → \[Wait for User Response\] → \[Process Response\] → \[Wait Again\]

// Do this (resilient):
// Workflow 1: Initial Message Handler
\[Trigger\] → \[Process Message\] → \[Save Conversation State to Baserow\] → \[Send Response with Tracking ID\]

// Workflow 2: User Response Handler
\[Response Trigger\] → \[Load Conversation State\] → \[Process Response\] → \[Update State\] → \[Send Next Message\]

// Example of saving conversation state
function saveConversationState(userId, conversationId, currentState) {
  return {
    id: conversationId || uuidv4(),
    user_id: userId,
    state: JSON.stringify(currentState),
    last_updated: new Date().toISOString(),
    workflow_step: currentState.currentStep,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h expiry
  };
}

Idempotent writes

Prefix every Baserow-write Function with a deduplication guard (e.g., "has this row already been updated in the past 15s?") to avoid race conditions when the user double-submits.

// Example idempotent write function
async function idempotentTaskUpdate(taskId, updateData) {
  // Check recent updates to this task
  const recentUpdates = await getTaskHistory({
    task_id: taskId,
    timestamp: { $gt: new Date(Date.now() - 15000).toISOString() } // Last 15 seconds
  });
  
  // Check if identical update was already made
  const isDuplicate = recentUpdates.some(update => {
    return Object.keys(updateData).every(key => {
      return update.changed_fields\[key\]?.to === updateData\[key\];
    });
  });
  
  if (isDuplicate) {
    console.log(\`Preventing duplicate update to task ${taskId}\`);
    return { success: true, isDuplicate: true };
  }
  
  // Proceed with update and record history
  const currentTask = await getTask(taskId);
  await updateTask(taskId, updateData);
  
  const changedFields = {};
  Object.keys(updateData).forEach(key => {
    changedFields\[key\] = {
      from: currentTask\[key\],
      to: updateData\[key\]
    };
  });
  
  await createTaskHistoryRecord({
    task_id: taskId,
    previous_status: currentTask.status,
    new_status: updateData.status || currentTask.status,
    changed_fields: changedFields,
    changed_by: 'system',
    timestamp: new Date().toISOString(),
    workflow\_execution\_id: $execution.id
  });
  
  return { success: true, isDuplicate: false };
}

This function must be tested under concurrent load to verify the 15-second window is appropriate.

Global error tunnel

Centralize all Execute Workflow → Error hooks to a single error-handling sub-workflow that logs the payload, retries with exponential back-off, and notifies an admin if max retries exceeded.

// Global error handler workflow
// Input: error object, original payload, workflow name, execution ID

// 1\. Log error to separate Error_Logs table
await createErrorLog({
  id: uuidv4(),
  workflow_name: $input.workflowName,
  execution_id: $input.executionId,
  error_message: $input.error.message,
  error_stack: $input.error.stack,
  payload: JSON.stringify($input.payload),
  timestamp: new Date().toISOString(),
  retry_count: $input.retryCount || 0
});

// 2\. Determine if we should retry
const MAX_RETRIES = 3;
const shouldRetry = ($input.retryCount || 0) < MAX_RETRIES && 
  !$input.error.message.includes('Invalid input data');

if (shouldRetry) {
  // Calculate exponential backoff delay
  const retryCount = ($input.retryCount || 0) + 1;
  const delayMs = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
  
  // Schedule retry after delay
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  // Retry the operation with incremented retry count
  return executeWorkflow({
    workflowName: $input.workflowName,
    payload: {
      ...$input.payload,
      retryCount
    }
  });
} else if (($input.retryCount || 0) >= MAX_RETRIES) {
  // Send admin notification after max retries
  await sendAdminAlert({
    subject: \`Workflow Error: ${$input.workflowName}\`,
    message: \`Failed after ${MAX_RETRIES} retries. Error: ${$input.error.message}\`,
    executionId: $input.executionId
  });
}

// Return error details for calling workflow
return {
  success: false,
  error: $input.error.message,
  retried: $input.retryCount || 0
};

Batch API calls

Where possible, replace n × "Create Row" loops with the bulk-import endpoint (/database/rows/table/&lt;id&gt;/batch/) to drop latency and avoid hitting Baserow's per-request size limit.

// Instead of this:
for (const task of tasksToCreate) {
  await createTask(task);
}

// Do this:
async function batchCreateTasks(tasks) {
  const BATCH_SIZE = 100; // Adjust based on Baserow limits
  
  // Split into batches to avoid request size limits
  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);
    
    await $http.post({
      url: `${baserowUrl}/api/database/rows/table/${tasksTableId}/batch/`,
      headers: { 
        Authorization: \`Token ${baserowToken}\`,
        'Content-Type': 'application/json'
      },
      body: {
        items: batch
      }
    });
  }
}

### 3\. Messaging Reliability (WhatsApp Business)

Template cataloguing

Catalogue every outbound message pattern (confirmation, follow-up, nudge) and pre-approve them as templates with variables so conversations remain uninterrupted past the 24-hour window.

Store templates in a dedicated Message_Templates table in Baserow:

// Message_Templates table structure
{
  id: uuid,
  template_name: string,        // Unique identifier
  whatsapp\_template\_id: string, // ID in WhatsApp Business
  language: string,             // 'en', 'ar', etc.
  template_text: string,        // Text with {{variable}} placeholders
  category: string,             // 'task_polling', 'confirmation', etc.
  status: string,               // 'approved', 'pending', 'rejected'
  variables: json,              // Array of variable names
  last_updated: datetime
}

// Example n8n function to send templated message
async function sendTemplatedMessage(recipientPhone, templateName, variables, language = 'en') {
  // Get template from database
  const template = await getMessageTemplate(templateName, language);
  
  if (!template || template.status !== 'approved') {
    throw new Error(\`Template ${templateName} not found or not approved\`);
  }
  
  // Validate all required variables are provided
  const requiredVars = template.variables;
  const missingVars = requiredVars.filter(v => !(v in variables));
  
  if (missingVars.length > 0) {
    throw new Error(\`Missing required variables: ${missingVars.join(', ')}\`);
  }
  
  // Send via WhatsApp Business API
  return await $http.post({
    url: `${whatsappApiUrl}/v1/messages`,
    headers: {
      Authorization: \`Bearer ${whatsappToken}\`,
      'Content-Type': 'application/json'
    },
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'template',
      template: {
        name: template.whatsapp\_template\_id,
        language: {
          code: language
        },
        components: \[
          {
            type: 'body',
            parameters: Object.entries(variables).map((\[name, value\]) => ({
              type: 'text',
              text: value
            }))
          }
        \]
      }
    }
  });
}

Read-receipt gating

Gate time-sensitive steps (e.g., starting timers) on receipt of the user's read status (status == "read") to prevent actions firing while the user is offline.

// Example workflow for handling read receipts
async function handleMessageStatusUpdate(data) {
  // Extract relevant data
  const { id, status, timestamp, recipient_id } = data;
  
  // Update message status in Sent_Messages table
  await updateMessageStatus(id, status, timestamp);
  
  // If message is marked as read, trigger appropriate workflows
  if (status === 'read') {
    // Get the message and its associated workflow step
    const message = await getSentMessage(id);
    
    if (message.requires\_read\_action) {
      // Execute the pending action now that we know user has seen the message
      await executeWorkflow({
        workflowName: message.read\_action\_workflow,
        payload: {
          messageId: id,
          userId: recipient_id,
          conversationId: message.conversation_id,
          timestamp
        }
      });
      
      // Mark the read action as completed
      await updateMessageReadAction(id, 'completed');
    }
  }
}

Mid-conversation re-auth

Implement logic that, on "message failed – risk unverified number," auto-sends a fallback SMS or email with a deep-link back into WhatsApp.

// Example workflow for handling delivery failures
async function handleMessageFailure(messageId, error, userData) {
  // Log the failure
  await logMessageFailure(messageId, error);
  
  // Check if it's an authentication/verification issue
  const isAuthIssue = error.includes('unverified') || 
                      error.includes('authentication');
  
  if (isAuthIssue && userData.email) {
    // Generate a unique re-authentication link
    const reAuthToken = generateSecureToken();
    const whatsappDeepLink = \`https://wa.me/${botPhoneNumber}?text=${encodeURIComponent(\`RECONNECT ${reAuthToken}`)}`;
    
    // Store the token for validation when user returns
    await storeReAuthToken(userData.id, reAuthToken);
    
    // Send recovery email
    await sendEmail({
      to: userData.email,
      subject: 'Reconnect to Your Task Assistant',
      body: \`We lost our connection on WhatsApp. Click here to reconnect: ${whatsappDeepLink}\`,
      template: 'whatsapp_reconnect'
    });
    
    // If SMS fallback is available, use it too
    if (userData.phone) {
      await sendSMS({
        to: userData.phone,
        message: \`Task Assistant: Click to reconnect: ${whatsappDeepLink}\`
      });
    }
    
    return {
      success: true,
      recoveryAttempted: true,
      channels: \['email', userData.phone ? 'sms' : null\].filter(Boolean)
    };
  }
  
  return {
    success: false,
    recoveryAttempted: false
  };
}

### 4\. Natural Language Robustness

LLM micro-service

Replace regex-only context parsing with a small OpenAI Function (or local Ollama) accessed via n8n's HTTP node. Define a JSON schema (location, energy, tools, available_time) so outputs are always typed.

// Example OpenAI function call for context extraction
async function extractContextWithLLM(userMessage) {
  const response = await $http.post({
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Authorization': \`Bearer ${process.env.OPENAI\_API\_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: {
      model: "gpt-4-turbo",
      messages: \[
        {
          role: "system",
          content: "Extract context information from user messages about their current situation."
        },
        {
          role: "user",
          content: userMessage
        }
      \],
      functions: \[
        {
          name: "extract\_user\_context",
          description: "Extract the user's current context from their message",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                enum: \["home", "office", "car", "outside", "unknown"\],
                description: "The user's current location"
              },
              energy_level: {
                type: "string",
                enum: \["high", "medium", "low", "unknown"\],
                description: "The user's current energy level"
              },
              mental_clarity: {
                type: "string",
                enum: \["high", "medium", "low", "unknown"\],
                description: "The user's current mental clarity"
              },
              available_tools: {
                type: "array",
                items: {
                  type: "string",
                  enum: \["phone", "laptop", "ipad", "desktop", "none"\]
                },
                description: "Tools the user currently has available"
              },
              available_time: {
                type: "integer",
                description: "Minutes the user has available, -1 if unknown"
              }
            },
            required: \["location", "energy\_level", "mental\_clarity", "available\_tools", "available\_time"\]
          }
        }
      \],
      function\_call: { name: "extract\_user_context" }
    }
  });
  
  const functionCall = response.data.choices\[0\].message.function_call;
  
  if (functionCall && functionCall.name === "extract\_user\_context") {
    try {
      return JSON.parse(functionCall.arguments);
    } catch (e) {
      console.error("Failed to parse LLM response:", e);
      return null;
    }
  }
  
  return null;
}

Fallback heuristics

If the LLM call fails (>2s timeout), fall back to the present keyword extractor to ensure graceful degradation.

// Example combined approach with fallback
async function extractUserContext(userMessage) {
  try {
    // Start a timer
    const startTime = Date.now();
    
    // Try LLM extraction first with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('LLM timeout')), 2000);
    });
    
    const llmResult = await Promise.race(\[
      extractContextWithLLM(userMessage),
      timeoutPromise
    \]);
    
    if (llmResult) {
      // Log success and return
      await logContextExtraction({
        method: 'llm',
        duration_ms: Date.now() - startTime,
        result: llmResult
      });
      return llmResult;
    }
  } catch (error) {
    console.log(\`LLM extraction failed: ${error.message}\`);
    // Continue to fallback
  }
  
  // Fallback to keyword-based extraction
  const keywordStartTime = Date.now();
  const keywordResult = extractContextWithKeywords(userMessage);
  
  await logContextExtraction({
    method: 'keyword_fallback',
    duration_ms: Date.now() - keywordStartTime,
    result: keywordResult
  });
  
  return keywordResult;
}

// Keyword-based extraction fallback
function extractContextWithKeywords(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Location detection
  let location = "unknown";
  if (message.includes("home") || message.includes("house")) location = "home";
  if (message.includes("office") || message.includes("work")) location = "office";
  if (message.includes("car") || message.includes("driving")) location = "car";
  if (message.includes("outside") || message.includes("out")) location = "outside";
  
  // Energy detection
  let energy_level = "unknown";
  if (message.includes("tired") || message.includes("exhausted")) energy_level = "low";
  if (message.includes("okay energy") || message.includes("some energy")) energy_level = "medium";
  if (message.includes("energetic") || message.includes("high energy")) energy_level = "high";
  
  // Mental clarity detection
  let mental_clarity = "unknown";
  if (message.includes("foggy") || message.includes("distracted")) mental_clarity = "low";
  if (message.includes("somewhat clear") || message.includes("okay focus")) mental_clarity = "medium";
  if (message.includes("focused") || message.includes("clear mind")) mental_clarity = "high";
  
  // Tools detection
  const available_tools = \[\];
  if (message.includes("phone")) available_tools.push("phone");
  if (message.includes("laptop")) available_tools.push("laptop");
  if (message.includes("ipad")) available_tools.push("ipad");
  if (message.includes("desktop")) available_tools.push("desktop");
  
  // Time detection
  let available_time = -1; // Unknown by default
  const timeRegex = /(\\d+)\\s*(min|hour|hr)/i;
  const timeMatch = message.match(timeRegex);
  
  if (timeMatch) {
    const amount = parseInt(timeMatch\[1\]);
    const unit = timeMatch\[2\].toLowerCase();
    
    if (unit.startsWith('hour') || unit === 'hr') {
      available_time = amount * 60; // Convert to minutes
    } else {
      available_time = amount;
    }
  }
  
  return {
    location,
    energy_level,
    mental_clarity,
    available\_tools: available\_tools.length > 0 ? available_tools : \["phone"\], // Assume at least phone
    available_time
  };
}

Multilingual tokens

Add Arabic synonyms for context keywords—users in Dubai often mix English/Arabic in chat.

// Example multilingual keyword mapping
const contextKeywords = {
  location: {
    home: \["home", "house", "منزل", "بيت"\],
    office: \["office", "work", "مكتب", "عمل"\],
    car: \["car", "driving", "سيارة", "قيادة"\],
    outside: \["outside", "out", "خارج"\]
  },
  energy_level: {
    high: \["energetic", "high energy", "نشيط", "طاقة عالية"\],
    medium: \["okay energy", "some energy", "طاقة متوسطة"\],
    low: \["tired", "exhausted", "متعب", "مرهق"\]
  },
  mental_clarity: {
    high: \["focused", "clear mind", "مركز", "ذهن صافي"\],
    medium: \["somewhat clear", "okay focus", "تركيز جيد"\],
    low: \["foggy", "distracted", "مشتت", "غير مركز"\]
  },
  tools: {
    phone: \["phone", "mobile", "هاتف", "جوال"\],
    laptop: \["laptop", "notebook", "لابتوب", "حاسوب محمول"\],
    ipad: \["ipad", "tablet", "آيباد", "لوحي"\],
    desktop: \["desktop", "computer", "كمبيوتر", "حاسوب"\]
  },
  time_units: {
    minute: \["minute", "min", "دقيقة", "دقائق"\],
    hour: \["hour", "hr", "ساعة", "ساعات"\]
  }
};

// Enhanced keyword detection function
function detectKeywordCategory(message, category) {
  for (const \[key, synonyms\] of Object.entries(contextKeywords\[category\])) {
    if (synonyms.some(word => message.includes(word))) {
      return key;
    }
  }
  return "unknown";
}

### 5\. Scoring & Prioritisation Accuracy

Unit tests for formulae

Write Jest tests that POST synthetic rows to Baserow and assert that calculated\_priority and overall\_load\_score match expected values for edge cases (e.g., deadline = null, postpone\_count = 9).

// Example Jest test for priority calculation
const { calculatePriorityScore, calculateTaskLoadScore } = require('../src/scoring');
const { createTask, getTask, deleteTask } = require('../src/baserow-api');

describe('Priority Calculation', () => {
  let testTaskId;
  
  afterEach(async () => {
    if (testTaskId) {
      await deleteTask(testTaskId);
      testTaskId = null;
    }
  });
  
  test('High priority task with upcoming deadline should score higher than 5000', async () => {
    // Create a test task
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskData = {
      name: 'Test Priority Task',
      description: 'Testing priority calculation',
      priority: 'High',
      deadline: tomorrow.toISOString(),
      status: 'Not Started',
      postpone_count: 0
    };
    
    // Create in Baserow
    testTaskId = await createTask(taskData);
    
    // Get the task with calculated priority
    const savedTask = await getTask(testTaskId);
    
    // Verify calculation
    expect(savedTask.calculated_priority).toBeGreaterThan(5000);
    expect(savedTask.calculated_priority).toBeLessThan(6000);
    
    // Double-check with our local implementation
    const calculatedLocally = calculatePriorityScore(taskData);
    expect(calculatedLocally).toBe(savedTask.calculated_priority);
  });
  
  test('Task with null deadline uses default 30 days', async () => {
    const taskData = {
      name: 'Test Null Deadline',
      description: 'Testing null deadline handling',
      priority: 'Medium',
      deadline: null,
      status: 'Not Started',
      postpone_count: 0
    };
    
    // Create in Baserow
    testTaskId = await createTask(taskData);
    
    // Get the task with calculated priority
    const savedTask = await getTask(testTaskId);
    
    // Should use 30-day default (medium priority base + low urgency)
    expect(savedTask.calculated_priority).toBe(3000);
    
    // Double-check with our local implementation
    const calculatedLocally = calculatePriorityScore(taskData);
    expect(calculatedLocally).toBe(savedTask.calculated_priority);
  });
  
  test('Maximum postpone count creates correct priority', async () => {
    const taskData = {
      name: 'Test Max Postpone',
      description: 'Testing max postponement handling',
      priority: 'Low',
      deadline: null,
      status: 'Not Started',
      postpone_count: 9
    };
    
    // Create in Baserow
    testTaskId = await createTask(taskData);
    
    // Get task with calculated values
    const savedTask = await getTask(testTaskId);
    
    // Low priority (1000) + max postpone effect
    const expectedPostponeEffect = 9 * 15; // From the scoring formula
    expect(savedTask.calculated_priority).toBe(1000);
    
    // Verify the focus score includes postpone effect
    const focusScore = calculateFocusScore(savedTask, mockUserContext, \[\]);
    const baseScoreWithoutPostpone = calculateFocusScore({...savedTask, postpone_count: 0}, mockUserContext, \[\]);
    expect(focusScore - baseScoreWithoutPostpone).toBe(expectedPostponeEffect);
  });
});

Parameter tuning service

Expose the weightings used in calculateFocusScore() (deadline × 100, context × 20, etc.) as records in a Scoring_Params table so you can tune without redeploying workflows.

// Scoring_Params table structure
{
  id: uuid,
  param\_name: string,        // E.g., "deadline\_weight", "context\_match\_weight" 
  value: number,             // The actual weight value
  description: string,       // Human-readable description
  default_value: number,     // Original default value
  min_value: number,         // Minimum allowed value
  max_value: number,         // Maximum allowed value
  affects: string,           // Which calculation this impacts
  last_updated: datetime,
  updated_by: string
}

// Example function to get parameters with caching
let cachedParams = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getScoringParameters() {
  const now = Date.now();
  
  // Return cached params if fresh
  if (cachedParams && (now - cacheTime < CACHE_TTL)) {
    return cachedParams;
  }
  
  // Fetch fresh parameters
  const params = await queryBaserow({
    tableId: scoringParamsTableId,
    fields: \['param_name', 'value'\]
  });
  
  // Transform to key-value object
  const paramMap = {};
  params.forEach(param => {
    paramMap\[param.param_name\] = param.value;
  });
  
  // Set default values for any missing parameters
  const defaults = {
    priority\_high\_weight: 5,
    priority\_medium\_weight: 3,
    priority\_low\_weight: 1,
    deadline_weight: 100,
    dependency_weight: 10,
    age_weight: 1,
    context\_match\_weight: 20,
    procrastination_weight: 15,
    mental\_clarity\_match_weight: 25
  };
  
  // Merge with defaults
  const mergedParams = {...defaults, ...paramMap};
  
  // Update cache
  cachedParams = mergedParams;
  cacheTime = now;
  
  return mergedParams;
}

// Modified focus score calculation using dynamic parameters
async function calculateFocusScore(task, userContext, allTasks) {
  // Get current parameter values
  const params = await getScoringParameters();
  
  // Base priority score
  const priorityWeights = {
    'High': params.priority\_high\_weight,
    'Medium': params.priority\_medium\_weight,
    'Low': params.priority\_low\_weight
  };
  const basePriority = priorityWeights\[task.priority\] * 1000;
  
  // Deadline urgency
  const deadlineUrgency = calculateDeadlineUrgency(task) * params.deadline_weight;
  
  // Context match
  const contextMatch = calculateContextMatch(task, userContext) * params.context\_match\_weight;
  
  // Procrastination penalty
  const procrastinationScore = (task.postpone\_count || 0) * params.procrastination\_weight;
  
  // Mental clarity match
  const clarityMatch = calculateClarityMatch(task, userContext) * params.mental\_clarity\_match_weight;
  
  // Other components...
  
  return basePriority + deadlineUrgency + contextMatch + procrastinationScore + clarityMatch;
}

Load-adaptive cut-offs

If overall\_load\_score is "Red" three days in a row, automatically tighten the query filter to cap daily scheduled hours to 80% of available time.

// Load adaptation workflow (runs daily)
async function adaptLoadThresholds() {
  // Get the last 3 days of load metrics
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const recentMetrics = await queryBaserow({
    tableId: taskLoadMetricsTableId,
    filter: {
      date: {
        $gte: threeDaysAgo.toISOString().split('T')\[0\]
      }
    },
    sort: \['-date'\]
  });
  
  // Check if we have 3 consecutive "Red" days
  const hasThreeRedDays = recentMetrics.length >= 3 && 
                          recentMetrics.slice(0, 3).every(m => m.overload_status === 'Red');
  
  if (hasThreeRedDays) {
    // Get current system settings
    const settings = await getSystemSettings();
    
    // Calculate new daily hour limit (80% of current)
    const newDailyLimit = Math.floor(settings.max\_daily\_hours * 0.8);
    
    // Update the setting
    await updateSystemSettings({
      max\_daily\_hours: newDailyLimit,
      adaptive\_reduction\_applied: true,
      adaptive\_reduction\_date: new Date().toISOString(),
      previous\_max\_daily\_hours: settings.max\_daily_hours
    });
    
    // Notify the user
    await sendTemplatedMessage(
      settings.user_phone,
      'load\_reduction\_notice',
      {
        previous\_limit: settings.max\_daily_hours,
        new_limit: newDailyLimit
      }
    );
    
    // Log the adaptation
    await logSystemEvent({
      event\_type: 'load\_adaptation',
      details: \`Reduced max daily hours from ${settings.max\_daily\_hours} to ${newDailyLimit} due to 3 consecutive Red load days\`,
      timestamp: new Date().toISOString()
    });
    
    return {
      adapted: true,
      previous: settings.max\_daily\_hours,
      new: newDailyLimit
    };
  }
  
  // Check if we should gradually restore after a period of Green days
  if (settings.adaptive\_reduction\_applied) {
    const hasThreeGreenDays = recentMetrics.length >= 3 &&
                             recentMetrics.slice(0, 3).every(m => m.overload_status === 'Green');
    
    if (hasThreeGreenDays) {
      // Gradually restore (90% of the way back to original)
      const originalLimit = settings.previous\_max\_daily_hours;
      const currentLimit = settings.max\_daily\_hours;
      const difference = originalLimit - currentLimit;
      const newLimit = currentLimit + Math.ceil(difference * 0.5);
      
      // Only update if meaningful change
      if (newLimit > currentLimit) {
        await updateSystemSettings({
          max\_daily\_hours: newLimit,
          adaptive\_reduction\_applied: newLimit < originalLimit // Still applied if not fully restored
        });
        
        // Log the adaptation
        await logSystemEvent({
          event\_type: 'load\_adaptation_restore',
          details: \`Increased max daily hours from ${currentLimit} to ${newLimit} after 3 consecutive Green load days\`,
          timestamp: new Date().toISOString()
        });
        
        return {
          adapted: true,
          direction: 'restore',
          previous: currentLimit,
          new: newLimit
        };
      }
    }
  }
  
  return { adapted: false };
}

### 6\. Observability & Analytics

Central log sink

Forward n8n Execution logs and Baserow row updates to an OpenTelemetry collector (e.g., Grafana Loki). This allows tracing a WhatsApp message through every workflow hop.

// Example setup for OpenTelemetry integration in n8n
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

// Configure the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    \[SemanticResourceAttributes.SERVICE_NAME\]: 'rex-os-n8n',
    \[SemanticResourceAttributes.SERVICE_VERSION\]: '1.0.0',
  }),
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    })
  ),
});

// Start the SDK
sdk.start();

// Example tracing in n8n function
async function tracedWorkflowExecution(functionName, payload, callback) {
  const { trace, context } = require('@opentelemetry/api');
  const tracer = trace.getTracer('rex-os-workflows');
  
  return await tracer.startActiveSpan(\`n8n.workflow.${functionName}\`, async (span) => {
    try {
      // Add context to the span
      span.setAttribute('workflow.payload', JSON.stringify(payload));
      span.setAttribute('workflow.execution_id', $execution.id);
      
      // Execute the actual function
      const result = await callback();
      
      // Record the result
      span.setAttribute('workflow.result', JSON.stringify(result));
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      // Record the error
      span.setAttribute('workflow.error', error.message);
      span.setAttribute('workflow.error_stack', error.stack);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      
      throw error;
    } finally {
      span.end();
    }
  });
}

// Usage example
await tracedWorkflowExecution('processUserMessage', { message, user_id }, async () => {
  // Workflow logic here
  const context = await extractUserContext(message);
  const tasks = await getMatchingTasks(context);
  return { context, tasks };
});

Prometheus health probes

Expose /healthz endpoints for n8n and Baserow containers; add alerts for: median workflow duration >3s, memory spikes, 5xx API responses >1%.

// Docker Compose example with health checks
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      \- "5678:5678"
    environment:
      \- N8N_METRICS=true  # Enable Prometheus metrics
      \- N8N\_METRICS\_PREFIX=n8n_
    healthcheck:
      test: \["CMD", "curl", "-f", "http://localhost:5678/healthz"\]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      \- n8n_data:/home/node/.n8n
      
  baserow:
    image: baserow/baserow:latest
    ports:
      \- "8000:8000"
    healthcheck:
      test: \["CMD", "curl", "-f", "http://localhost:8000/api/_health/"\]
      interval: 1m
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      \- baserow_data:/baserow/data
      
  prometheus:
    image: prom/prometheus:latest
    ports:
      \- "9090:9090"
    volumes:
      \- ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      \- prometheus_data:/prometheus
    command:
      \- '--config.file=/etc/prometheus/prometheus.yml'
      \- '--storage.tsdb.path=/prometheus'
      \- '--web.console.libraries=/etc/prometheus/console_libraries'
      \- '--web.console.templates=/etc/prometheus/consoles'
      \- '--web.enable-lifecycle'
      
  grafana:
    image: grafana/grafana:latest
    ports:
      \- "3000:3000"
    volumes:
      \- ./grafana/provisioning:/etc/grafana/provisioning
      \- grafana_data:/var/lib/grafana

volumes:
  n8n_data:
  baserow_data:
  prometheus_data:
  grafana_data:

\# prometheus.yml configuration
scrape_configs:
  \- job_name: 'n8n'
    scrape_interval: 15s
    metrics_path: /metrics
    static_configs:
      \- targets: \['n8n:5678'\]
        
  \- job_name: 'baserow'
    scrape_interval: 15s
    metrics\_path: /api/\_metrics
    static_configs:
      \- targets: \['baserow:8000'\]

\# Alert rules
alerting:
  alertmanagers:
    \- static_configs:
        \- targets: \['alertmanager:9093'\]
        
rule_files:
  \- /etc/prometheus/rules/*.yml

\# Example alert rules file (rules/rex\_os\_alerts.yml)
groups:
  \- name: rex\_os\_alerts
    rules:
      \- alert: N8nWorkflowDurationHigh
        expr: histogram\_quantile(0.5, sum(rate(n8n\_workflow\_duration\_seconds_bucket\[5m\])) by (le)) > 3
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "N8n workflow median duration exceeds 3 seconds"
          description: "Median workflow execution time is {{ $value }} seconds"
          
      \- alert: BaserowApiErrors
        expr: sum(rate(baserow\_http\_responses\_total{status=~"5.."}\[5m\])) / sum(rate(baserow\_http\_responses\_total\[5m\])) * 100 > 1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Baserow API error rate above 1%"
          description: "{{ $value }}% of Baserow API responses are errors"
          
      \- alert: HighMemoryUsage
        expr: (node\_memory\_MemTotal\_bytes - node\_memory\_MemAvailable\_bytes) / node\_memory\_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is at {{ $value }}%"

User UX metrics

Store interaction latency (user msg → agent reply) in a UX_Metrics table and surface weekly percentiles to detect slowdowns.

// UX_Metrics table structure
{
  id: uuid,
  interaction_id: string,      // Unique ID for the interaction
  user_id: string,             // User identifier
  message\_received\_at: datetime, // When user message was received
  agent\_reply\_sent_at: datetime, // When agent reply was sent
  response\_time\_ms: number,    // Calculated difference
  workflow_name: string,       // Which workflow handled this
  context\_extraction\_time_ms: number,  // Time taken for context extraction
  task\_query\_time_ms: number,  // Time taken for task database query
  message\_preparation\_time_ms: number, // Time to prepare response
  message\_type: string,        // 'task\_polling', 'context_gathering', etc.
  day\_of\_week: number,         // 0-6 (Sunday-Saturday)
  hour\_of\_day: number,         // 0-23
  timestamp: datetime          // When record was created
}

// Example UX metrics recording in n8n
async function recordUserInteraction(interactionData) {
  const {
    interaction_id,
    user_id,
    message\_received\_at,
    message_type,
    timing_details
  } = interactionData;
  
  // Calculate current timestamps
  const now = new Date();
  const agent\_reply\_sent_at = now.toISOString();
  
  // Calculate total response time
  const receivedTime = new Date(message\_received\_at).getTime();
  const sentTime = now.getTime();
  const response\_time\_ms = sentTime - receivedTime;
  
  // Prepare UX metrics record
  const metricsRecord = {
    id: uuidv4(),
    interaction_id,
    user_id,
    message\_received\_at,
    agent\_reply\_sent_at,
    response\_time\_ms,
    workflow_name: $workflow.name,
    context\_extraction\_time\_ms: timing\_details?.context\_extraction\_time || 0,
    task\_query\_time\_ms: timing\_details?.task\_query\_time || 0,
    message\_preparation\_time\_ms: timing\_details?.message\_preparation\_time || 0,
    message_type,
    day\_of\_week: now.getDay(),
    hour\_of\_day: now.getHours(),
    timestamp: now.toISOString()
  };
  
  // Record to Baserow
  await createUXMetricsRecord(metricsRecord);
  
  // Check if this response is slower than typical
  if (response\_time\_ms > 3000) { // 3 seconds
    // Log potential performance issue
    await logPerformanceWarning({
      interaction_id,
      response\_time\_ms,
      timestamp: now.toISOString(),
      message: \`Slow response detected (${response\_time\_ms}ms)\`
    });
  }
  
  return metricsRecord;
}

// Weekly UX metrics report generation
async function generateWeeklyUXReport() {
  // Get metrics for the past week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const weeklyMetrics = await queryBaserow({
    tableId: uxMetricsTableId,
    filter: {
      timestamp: {
        $gte: oneWeekAgo.toISOString()
      }
    }
  });
  
  // Calculate percentiles
  const responseTimes = weeklyMetrics.map(m => m.response\_time\_ms).sort((a, b) => a - b);
  const count = responseTimes.length;
  
  const p50 = responseTimes\[Math.floor(count * 0.5)\];
  const p90 = responseTimes\[Math.floor(count * 0.9)\];
  const p95 = responseTimes\[Math.floor(count * 0.95)\];
  const p99 = responseTimes\[Math.floor(count * 0.99)\];
  
  // Calculate by message type
  const metricsByType = {};
  weeklyMetrics.forEach(metric => {
    if (!metricsByType\[metric.message_type\]) {
      metricsByType\[metric.message_type\] = \[\];
    }
    metricsByType\[metric.message\_type\].push(metric.response\_time_ms);
  });
  
  const typeMetrics = {};
  Object.entries(metricsByType).forEach((\[type, times\]) => {
    times.sort((a, b) => a - b);
    const typeCount = times.length;
    typeMetrics\[type\] = {
      count: typeCount,
      p50: times\[Math.floor(typeCount * 0.5)\],
      p90: times\[Math.floor(typeCount * 0.9)\]
    };
  });
  
  // Generate report
  const report = {
    period_start: oneWeekAgo.toISOString(),
    period_end: new Date().toISOString(),
    total_interactions: count,
    overall_metrics: {
      p50,
      p90,
      p95,
      p99
    },
    by\_message\_type: typeMetrics,
    timestamp: new Date().toISOString()
  };
  
  // Store report
  await createUXReport(report);
  
  return report;
}

Cost controls on LLM usage

Add a Prometheus alert on daily token burn ≥ X to catch runaway loops.

// LLM_Usage table structure
{
  id: uuid,
  workflow_id: string,       // Workflow that made the call
  execution_id: string,      // Specific execution
  model: string,             // E.g., "gpt-4-turbo"
  prompt_tokens: number,     // Input tokens
  completion_tokens: number, // Output tokens
  total_tokens: number,      // Total tokens
  estimated\_cost\_usd: number, // Based on token count and model
  purpose: string,           // What the LLM call was for
  success: boolean,          // Whether call succeeded
  error_message: string,     // Error if failed
  timestamp: datetime
}

// Example token tracking function
const MODEL_COSTS = {
  'gpt-4-turbo': {
    input: 0.00001, // $0.01 per 1K tokens
    output: 0.00003 // $0.03 per 1K tokens
  },
  'gpt-3.5-turbo': {
    input: 0.000001, // $0.001 per 1K tokens
    output: 0.000002 // $0.002 per 1K tokens
  }
};

async function trackLLMUsage(usageData) {
  const {
    workflow_id,
    execution_id,
    model,
    prompt_tokens,
    completion_tokens,
    purpose,
    success,
    error_message
  } = usageData;
  
  const total\_tokens = prompt\_tokens + completion_tokens;
  
  // Calculate estimated cost
  const modelCosts = MODEL\_COSTS\[model\] || MODEL\_COSTS\['gpt-3.5-turbo'\];
  const promptCost = (prompt_tokens / 1000) * modelCosts.input;
  const completionCost = (completion_tokens / 1000) * modelCosts.output;
  const estimated\_cost\_usd = promptCost + completionCost;
  
  // Create usage record
  const usageRecord = {
    id: uuidv4(),
    workflow_id,
    execution_id,
    model,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated\_cost\_usd,
    purpose,
    success,
    error\_message: error\_message || null,
    timestamp: new Date().toISOString()
  };
  
  // Store in Baserow
  await createLLMUsageRecord(usageRecord);
  
  // Increment Prometheus counter
  // (assuming Prometheus client is available)
  if (prometheusClient) {
    prometheusClient.llmTokensCounter.inc({
      model,
      success: String(success)
    }, total_tokens);
    
    prometheusClient.llmCostCounter.inc({
      model,
      success: String(success)
    }, estimated\_cost\_usd);
  }
  
  return usageRecord;
}

// Prometheus Alert Rule for LLM costs
groups:
  \- name: llm\_cost\_alerts
    rules:
      \- alert: DailyLLMCostExceeded
        expr: sum(increase(rex\_os\_llm\_cost\_usd_total\[24h\])) > 5
        labels:
          severity: warning
        annotations:
          summary: "Daily LLM cost exceeded $5"
          description: "LLM cost in the last 24 hours: ${{ $value | printf \\"%.2f\\" }}"
          
      \- alert: RapidLLMUsageSpike
        expr: sum(rate(rex\_os\_llm\_tokens\_total\[5m\])) > sum(rate(rex\_os\_llm\_tokens\_total\[1h\] offset 1h)) * 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Unusual spike in LLM token usage"
          description: "Current rate is {{ $value | printf \\"%.0f\\" }} tokens/sec, more than 3x the baseline"

### 7\. Security & Compliance

Environment secrets

Keep Baserow API tokens and OpenAI keys in Docker secrets or an encrypted Vault, never in n8n credential JSON.

// Docker Compose with secrets
version: '3.8'

secrets:
  baserow\_api\_token:
    file: ./secrets/baserow\_api\_token.txt
  openai\_api\_key:
    file: ./secrets/openai\_api\_key.txt
  whatsapp_token:
    file: ./secrets/whatsapp_token.txt

services:
  n8n:
    image: n8nio/n8n:latest
    secrets:
      \- baserow\_api\_token
      \- openai\_api\_key
      \- whatsapp_token
    environment:
      \- BASEROW\_API\_TOKEN\_FILE=/run/secrets/baserow\_api_token
      \- OPENAI\_API\_KEY\_FILE=/run/secrets/openai\_api_key
      \- WHATSAPP\_TOKEN\_FILE=/run/secrets/whatsapp_token
    # ... other config

// Example n8n credential helper
async function getSecretFromFile(secretPath) {
  const fs = require('fs').promises;
  try {
    const secret = await fs.readFile(secretPath, 'utf8');
    return secret.trim();
  } catch (error) {
    console.error(\`Failed to read secret from ${secretPath}:\`, error);
    throw new Error('Failed to access secret');
  }
}

// Usage in n8n workflow
async function getOpenAIKey() {
  const keyPath = process.env.OPENAI\_API\_KEY_FILE;
  if (!keyPath) {
    throw new Error('OPENAI\_API\_KEY_FILE environment variable not set');
  }
  return await getSecretFromFile(keyPath);
}

// For Kubernetes, use proper Kubernetes secrets:
apiVersion: v1
kind: Secret
metadata:
  name: rex-os-secrets
type: Opaque
data:
  baserow-api-token: BASE64\_ENCODED\_TOKEN
  openai-api-key: BASE64\_ENCODED\_KEY
  whatsapp-token: BASE64\_ENCODED\_TOKEN

\-\-\-
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n
spec:
  template:
    spec:
      containers:
      \- name: n8n
        env:
        \- name: BASEROW\_API\_TOKEN
          valueFrom:
            secretKeyRef:
              name: rex-os-secrets
              key: baserow-api-token
        \- name: OPENAI\_API\_KEY
          valueFrom:
            secretKeyRef:
              name: rex-os-secrets
              key: openai-api-key

RBAC

Create a dedicated "n8n_bot" user in Baserow with row-level permissions limited to the owner's workspace.

// Example Baserow API calls to set up RBAC (to be run by admin)

// 1\. Create dedicated service account
const createUserResponse = await $http.post({
  url: `${baserowUrl}/api/user/`,
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    name: 'n8n Bot',
    email: '[\[email protected\]](/cdn-cgi/l/email-protection)',
    password: generateSecurePassword() // Store this securely
  }
});

const n8nBotUserId = createUserResponse.data.user.id;

// 2\. Create a workspace for the bot and owner
const createGroupResponse = await $http.post({
  url: `${baserowUrl}/api/groups/`,
  headers: {
    Authorization: \`Token ${adminToken}\`,
    'Content-Type': 'application/json'
  },
  body: {
    name: 'Rex OS Workspace'
  }
});

const workspaceId = createGroupResponse.data.id;

// 3\. Add owner as admin to the workspace
await $http.post({
  url: `${baserowUrl}/api/groups/${workspaceId}/invitations/`,
  headers: {
    Authorization: \`Token ${adminToken}\`,
    'Content-Type': 'application/json'
  },
  body: {
    email: ownerEmail,
    permissions: 'ADMIN'
  }
});

// 4\. Add n8n bot with limited permissions
await $http.post({
  url: `${baserowUrl}/api/groups/${workspaceId}/invitations/`,
  headers: {
    Authorization: \`Token ${adminToken}\`,
    'Content-Type': 'application/json'
  },
  body: {
    email: '[\[email protected\]](/cdn-cgi/l/email-protection)',
    permissions: 'MEMBER'
  }
});

// 5\. Create the database in the workspace
const createDatabaseResponse = await $http.post({
  url: `${baserowUrl}/api/databases/`,
  headers: {
    Authorization: \`Token ${adminToken}\`,
    'Content-Type': 'application/json'
  },
  body: {
    name: 'Rex OS Database',
    group: workspaceId
  }
});

const databaseId = createDatabaseResponse.data.id;

// 6\. Set up table-specific permissions
// Example: Give n8n bot read/write access to Tasks table
await $http.post({
  url: `${baserowUrl}/api/database/tables/${tasksTableId}/permissions/`,
  headers: {
    Authorization: \`Token ${adminToken}\`,
    'Content-Type': 'application/json'
  },
  body: {
    user_id: n8nBotUserId,
    permissions: {
      create: true,
      read: true,
      update: true,
      delete: false
    }
  }
});

GDPR data-subject tools

Add a "Delete My Data" command that triggers an n8n workflow wiping the requester's records from all tables and log sinks.

// Data deletion workflow
async function handleDataDeletionRequest(userId, requestSource) {
  // 1\. Log the request for compliance
  const requestId = uuidv4();
  
  await logGDPRRequest({
    id: requestId,
    user_id: userId,
    request_type: 'deletion',
    requested_at: new Date().toISOString(),
    request_source: requestSource,
    status: 'in_progress'
  });
  
  try {
    // 2\. Identify all tables with user data
    const userDataTables = \[
      { tableId: tasksTableId, userIdField: 'user_id' },
      { tableId: userContextTableId, userIdField: 'user_id' },
      { tableId: taskHistoryTableId, userIdField: 'user_id' },
      { tableId: errorLogsTableId, userIdField: 'user_id' },
      { tableId: llmUsageTableId, userIdField: 'user_id' },
      { tableId: uxMetricsTableId, userIdField: 'user_id' }
      // Add all other tables
    \];
    
    // 3\. Perform deletion in each table
    const deletionResults = {};
    
    for (const table of userDataTables) {
      // Find records belonging to user
      const records = await queryBaserow({
        tableId: table.tableId,
        filter: {
          \[table.userIdField\]: userId
        }
      });
      
      // Delete or anonymize each record
      const recordIds = records.map(r => r.id);
      
      if (recordIds.length > 0) {
        await batchDeleteRecords(table.tableId, recordIds);
      }
      
      deletionResults\[table.tableId\] = {
        count: recordIds.length,
        status: 'deleted'
      };
    }
    
    // 4\. Delete external logs (e.g., Loki)
    try {
      await deleteExternalLogs(userId);
    } catch (error) {
      console.error('Failed to delete external logs:', error);
      deletionResults.externalLogs = {
        status: 'failed',
        error: error.message
      };
    }
    
    // 5\. Complete the request log
    await updateGDPRRequest(requestId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      deletion_results: JSON.stringify(deletionResults)
    });
    
    // 6\. Send confirmation to user
    await sendTemplatedMessage(
      userPhoneNumber,
      'data\_deletion\_confirmation',
      {
        request_id: requestId,
        deletion_date: new Date().toISOString().split('T')\[0\]
      }
    );
    
    return {
      success: true,
      requestId,
      deletionResults
    };
  } catch (error) {
    // Log failure and update request status
    console.error('Data deletion failed:', error);
    
    await updateGDPRRequest(requestId, {
      status: 'failed',
      error_message: error.message,
      error_details: error.stack
    });
    
    return {
      success: false,
      requestId,
      error: error.message
    };
  }
}

### 8\. User Experience Polish

Progressive disclosure

Instead of listing five tasks in one chunk, paginate after three and offer "more" to stay within WhatsApp's screen real-estate.

// Example task presentation with progressive disclosure
async function presentTasksProgressively(tasks, userContext) {
  // Limit initial display to 3 items
  const INITIAL_ITEMS = 3;
  const initialTasks = tasks.slice(0, INITIAL_ITEMS);
  const remainingTasks = tasks.slice(INITIAL_ITEMS);
  
  // Format initial task list
  let message = \`Based on your current context (at ${userContext.location} with ${userContext.energy\_level} energy and ${userContext.mental\_clarity} clarity), here are some tasks:\\n\\n\`;
  
  initialTasks.forEach((task, index) => {
    message += `${index + 1}. ${task.name} - ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''} (Est. ${task.estimated_duration} min)\\n`;
  });
  
  // Add "more" option if there are remaining tasks
  if (remainingTasks.length > 0) {
    message += `\\n4. Show ${remainingTasks.length} more tasks`;
  }
  
  message += '\\n\\nWhich would you like to work on? Reply with the number.';
  
  // Send initial message
  const initialResponse = await sendWhatsAppMessage(userPhone, message);
  
  // Save conversation state including remaining tasks
  await saveConversationState(userId, conversationId, {
    step: 'task_selection',
    shownTasks: initialTasks.map(t => t.id),
    remainingTasks: remainingTasks.map(t => t.id),
    allTasksMap: tasks.reduce((map, task) => {
      map\[task.id\] = task;
      return map;
    }, {})
  });
  
  return {
    success: true,
    messageId: initialResponse.messageId,
    tasksShown: initialTasks.length,
    tasksRemaining: remainingTasks.length
  };
}

// Handler for "more tasks" selection
async function handleMoreTasksRequest(userId, conversationId) {
  // Get conversation state
  const state = await getConversationState(userId, conversationId);
  
  if (!state || state.step !== 'task_selection' || !state.remainingTasks || state.remainingTasks.length === 0) {
    return {
      success: false,
      error: 'No more tasks available or invalid state'
    };
  }
  
  // Get remaining tasks
  const BATCH_SIZE = 3;
  const tasksToShow = state.remainingTasks.slice(0, BATCH_SIZE);
  const newRemainingTasks = state.remainingTasks.slice(BATCH_SIZE);
  
  // Format message
  let message = \`Here are more tasks for you:\\n\\n\`;
  
  tasksToShow.forEach((taskId, index) => {
    const task = state.allTasksMap\[taskId\];
    const taskNumber = state.shownTasks.length + index + 1;
    
    message += `${taskNumber}. ${task.name} - ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''} (Est. ${task.estimated_duration} min)\\n`;
  });
  
  // Add "more" option if there are still remaining tasks
  if (newRemainingTasks.length > 0) {
    const nextOption = state.shownTasks.length + tasksToShow.length + 1;
    message += `\\n${nextOption}. Show ${newRemainingTasks.length} more tasks`;
  }
  
  message += '\\n\\nWhich would you like to work on? Reply with the number.';
  
  // Send message
  const response = await sendWhatsAppMessage(userPhone, message);
  
  // Update conversation state
  await updateConversationState(userId, conversationId, {
    step: 'task_selection',
    shownTasks: \[...state.shownTasks, ...tasksToShow\],
    remainingTasks: newRemainingTasks
  });
  
  return {
    success: true,
    messageId: response.messageId,
    tasksShown: tasksToShow.length,
    tasksRemaining: newRemainingTasks.length
  };
}

Context expiry reminder

Ping the user after 30 min of inactivity: "Still at the office? Shall I refresh your context?" rather than forcing them to restart the flow.

// Context expiry check workflow (runs every 15 minutes)
async function checkContextExpiry() {
  // Get active users with context older than 30 minutes but less than 2 hours
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  const activeContexts = await queryBaserow({
    tableId: userContextTableId,
    filter: {
      timestamp: {
        $lt: thirtyMinutesAgo.toISOString(),
        $gt: twoHoursAgo.toISOString()
      },
      context\_reminder\_sent: {
        $ne: true
      }
    }
  });
  
  const results = \[\];
  
  for (const context of activeContexts) {
    try {
      // Check for any activity since context was recorded
      const hasRecentActivity = await checkForUserActivity(context.user_id, context.timestamp);
      
      if (!hasRecentActivity) {
        // Generate location-specific message
        const locationText = context.location === 'unknown' ? '' : \`still at ${context.location}\`;
        
        const message = \`Hi there! Are you ${locationText}? It's been 30 minutes since I last checked your context. Would you like me to refresh it, or are you ready for some new tasks?\`;
        
        // Send reminder
        await sendWhatsAppMessage(getUserPhone(context.user_id), message);
        
        // Mark reminder as sent
        await updateBaserowRecord(userContextTableId, context.id, {
          context\_reminder\_sent: true
        });
        
        results.push({
          user\_id: context.user\_id,
          context_id: context.id,
          reminder_sent: true
        });
      }
    } catch (error) {
      console.error(\`Error processing context expiry for user ${context.user_id}:\`, error);
      results.push({
        user\_id: context.user\_id,
        context_id: context.id,
        reminder_sent: false,
        error: error.message
      });
    }
  }
  
  return {
    processed: activeContexts.length,
    reminders\_sent: results.filter(r => r.reminder\_sent).length,
    results
  };
}

// Helper to check for recent user activity
async function checkForUserActivity(userId, since) {
  const sinceDate = new Date(since);
  
  // Check message logs
  const recentMessages = await queryBaserow({
    tableId: messageLogsTableId,
    filter: {
      user_id: userId,
      timestamp: {
        $gt: sinceDate.toISOString()
      },
      direction: 'inbound' // Only check messages from user
    },
    limit: 1
  });
  
  return recentMessages.length > 0;
}

Smart snooze

After two consecutive postponements of the same task, automatically propose a micro-task alternative without waiting for a third manual postpone.

// Smart snooze logic in task postponement workflow
async function handleTaskPostponement(taskId, userId) {
  // Get current task data
  const task = await getTask(taskId);
  
  // Update postpone count
  const newPostponeCount = (task.postpone_count || 0) + 1;
  await updateTask(taskId, { postpone_count: newPostponeCount });
  
  // Record task history
  await createTaskHistoryRecord({
    task_id: taskId,
    previous_status: task.status,
    new_status: task.status, // Status not changing, just postponed
    changed\_fields: { postpone\_count: { from: task.postpone_count, to: newPostponeCount } },
    action: 'postpone',
    changed_by: userId,
    timestamp: new Date().toISOString()
  });
  
  // Check if this is second postponement
  if (newPostponeCount === 2) {
    // Create micro-task suggestion
    const microTasks = generateMicroTasks(task);
    
    // Prepare suggestion message
    let message = \`I notice you've postponed "${task.name}" twice now. Would you like to break it down into smaller steps?\\n\\n\`;
    
    microTasks.forEach((mt, index) => {
      message += `${index + 1}. ${mt.name} (${mt.estimated_duration} min)\\n`;
    });
    
    message += '\\nReply with the number of the micro-task you'd like to start with, or "all" to create all of them, or "no" to keep the original task.';
    
    // Send suggestion
    await sendWhatsAppMessage(getUserPhone(userId), message);
    
    // Save micro-task suggestions in conversation state
    await saveConversationState(userId, uuidv4(), {
      step: 'micro\_task\_suggestion',
      taskId: taskId,
      microTasks: microTasks,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      action: 'micro\_task\_suggested',
      microTaskCount: microTasks.length
    };
  }
  
  // Standard postpone response
  const response = \`Task "${task.name}" has been postponed. I'll suggest it again later.\`;
  await sendWhatsAppMessage(getUserPhone(userId), response);
  
  return {
    success: true,
    action: 'postponed',
    postponeCount: newPostponeCount
  };
}

// Function to generate micro-tasks
function generateMicroTasks(task) {
  // Prepare micro-tasks based on task type and estimated duration
  const totalDuration = task.estimated_duration || 30;
  let microTasks = \[\];
  
  // Check for task type
  if (task.category === 'email' || task.name.toLowerCase().includes('email')) {
    microTasks = \[
      {
        name: \`Open the email client for "${task.name}"\`,
        description: "Just open the email application or website",
        estimated_duration: 1,
        parent\_task\_id: task.id
      },
      {
        name: \`Draft the first paragraph for "${task.name}"\`,
        description: "Just write the opening of the email",
        estimated_duration: 5,
        parent\_task\_id: task.id
      },
      {
        name: \`Complete and send "${task.name}"\`,
        description: "Finish the email and send it",
        estimated_duration: totalDuration - 6,
        parent\_task\_id: task.id
      }
    \];
  } else if (task.category === 'writing' || task.description.toLowerCase().includes('write')) {
    microTasks = \[
      {
        name: \`Open the document for "${task.name}"\`,
        description: "Just open the document or create a new one",
        estimated_duration: 1,
        parent\_task\_id: task.id
      },
      {
        name: \`Write outline for "${task.name}"\`,
        description: "Create a simple bullet point outline",
        estimated_duration: 5,
        parent\_task\_id: task.id
      },
      {
        name: \`Write first section of "${task.name}"\`,
        description: "Just complete the first section",
        estimated_duration: Math.floor(totalDuration / 3),
        parent\_task\_id: task.id
      }
    \];
  } else {
    // Generic micro-tasks
    microTasks = \[
      {
        name: \`Get started on "${task.name}"\`,
        description: "Take the first small step for this task",
        estimated_duration: 5,
        parent\_task\_id: task.id
      },
      {
        name: \`Make progress on "${task.name}"\`,
        description: "Continue working on the task for a short period",
        estimated_duration: Math.min(15, Math.floor(totalDuration / 2)),
        parent\_task\_id: task.id
      },
      {
        name: \`Complete "${task.name}"\`,
        description: "Finish the remaining work",
        estimated_duration: totalDuration - 20,
        parent\_task\_id: task.id
      }
    \];
  }
  
  return microTasks;
}

WhatsApp template cardinality

With progressive disclosure you may need dozens of near-identical templates (one per language or branch). Track them in a Message_Templates table to avoid drift.

// Enhanced Message_Templates table structure
{
  id: uuid,
  template\_name: string,         // Unique identifier like "task\_list\_initial\_en"
  template\_family: string,       // Grouping like "task\_list"
  template_variant: string,      // "initial", "more", "final"
  language_code: string,         // "en", "ar"
  whatsapp\_template\_id: string,  // ID in WhatsApp Business API
  template_text: string,         // Text with {{variable}} placeholders
  variables: json,               // Array of variable names
  max\_tasks\_shown: number,       // For pagination templates
  has\_more\_option: boolean,      // Whether includes "more" option
  status: string,                // "approved", "pending", "rejected"
  approval_date: datetime,       // When approved by WhatsApp
  created_date: datetime,
  updated_date: datetime
}

// Example template manager function
async function getTaskListTemplate(variant, language, hasMore) {
  // Determine template name
  const templateName = \`task\_list\_${variant}_${hasMore ? 'with\_more' : 'final'}\_${language}\`;
  
  // Try to get exact template
  let template = await getMessageTemplate(templateName);
  
  // If not found, fall back to English
  if (!template && language !== 'en') {
    const englishTemplateName = \`task\_list\_${variant}_${hasMore ? 'with\_more' : 'final'}\_en\`;
    template = await getMessageTemplate(englishTemplateName);
  }
  
  // If still not found, use generic template
  if (!template) {
    template = await getMessageTemplate('task\_list\_generic_en');
  }
  
  return template;
}

// Template synchronization workflow (scheduled weekly)
async function synchronizeWhatsAppTemplates() {
  // Get all templates from our database
  const ourTemplates = await getAllMessageTemplates();
  
  // Log templates that need approval
  const pendingTemplates = ourTemplates.filter(t => t.status === 'pending');
  
  if (pendingTemplates.length > 0) {
    console.log(`${pendingTemplates.length} templates pending WhatsApp approval`);
    
    // Generate submission instructions
    let submissionGuide = '# WhatsApp Template Submission Guide\\n\\n';
    
    pendingTemplates.forEach(template => {
      submissionGuide += `## ${template.template_name}\\n\\n`;
      submissionGuide += `\*\*Template Text:\*\*\\n${template.template_text}\\n\\n`;
      submissionGuide += `\*\*Variables:\*\*\\n${template.variables.join(', ')}\\n\\n`;
      submissionGuide += `\*\*Category:\*\* UTILITY\\n\\n`;
      submissionGuide += '---\\n\\n';
    });
    
    // Save guide to file or send via email to admin
    await saveSubmissionGuide(submissionGuide);
  }
  
  // Check for template drift
  const templateFamilies = \[...new Set(ourTemplates.map(t => t.template_family))\];
  
  for (const family of templateFamilies) {
    const familyTemplates = ourTemplates.filter(t => t.template_family === family);
    
    // Group by language
    const byLanguage = {};
    familyTemplates.forEach(t => {
      if (!byLanguage\[t.language_code\]) {
        byLanguage\[t.language_code\] = \[\];
      }
      byLanguage\[t.language_code\].push(t);
    });
    
    // Check template coverage
    const mainLanguage = 'en';
    const mainLanguageTemplates = byLanguage\[mainLanguage\] || \[\];
    
    for (const \[lang, templates\] of Object.entries(byLanguage)) {
      if (lang === mainLanguage) continue;
      
      // Find variants in main language that are missing in this language
      const mainVariants = mainLanguageTemplates.map(t => `${t.template\_variant}\_${t.has\_more\_option ? 'with_more' : 'final'}`);
      const langVariants = templates.map(t => `${t.template\_variant}\_${t.has\_more\_option ? 'with_more' : 'final'}`);
      
      const missingVariants = mainVariants.filter(v => !langVariants.includes(v));
      
      if (missingVariants.length > 0) {
        console.log(\`Language ${lang} is missing ${missingVariants.length} variants in the "${family}" template family\`);
        
        // Flag for human attention or auto-create placeholders
        await flagTemplateDrift(family, lang, missingVariants);
      }
    }
  }
  
  return {
    total_templates: ourTemplates.length,
    pending_approval: pendingTemplates.length,
    template_families: templateFamilies.length
  };
}

### 9\. Testing & Staging

Sandbox tenant

Run a parallel Baserow workspace plus WhatsApp test number; route "/staging" prefixed commands there so QA can trial new workflows without touching production data.

// Message routing based on environment prefix
async function routeIncomingMessage(message, sender) {
  // Check for staging prefix
  const isStaging = message.text.startsWith('/staging');
  
  // Remove prefix for staging messages
  const cleanedMessage = isStaging 
    ? message.text.substring('/staging'.length).trim()
    : message.text;
  
  // Determine environment config
  const config = isStaging ? stagingConfig : productionConfig;
  
  // Log message to appropriate environment
  await logMessage({
    sender,
    text: cleanedMessage,
    timestamp: new Date().toISOString(),
    environment: isStaging ? 'staging' : 'production'
  }, config.baserowUrl, config.baserowToken);
  
  // Route to appropriate workflow
  const response = await $http.post({
    url: `${config.n8nUrl}/webhook/${config.webhookPath}`,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      sender,
      message: cleanedMessage,
      timestamp: new Date().toISOString(),
      environment: isStaging ? 'staging' : 'production'
    }
  });
  
  return {
    environment: isStaging ? 'staging' : 'production',
    originalMessage: message.text,
    processedMessage: cleanedMessage,
    response: response.data
  };
}

// Docker Compose setup for dual environments
version: '3.8'

services:
  # Production environment
  n8n-prod:
    image: n8nio/n8n:latest
    environment:
      \- N8N_ENVIRONMENT=production
      \- BASEROW\_URL=${PROD\_BASEROW_URL}
      \- BASEROW\_TOKEN=${PROD\_BASEROW_TOKEN}
      \- OPENAI\_API\_KEY=${PROD\_OPENAI\_API_KEY}
      \- WHATSAPP\_API\_URL=${PROD\_WHATSAPP\_API_URL}
      \- WHATSAPP\_TOKEN=${PROD\_WHATSAPP_TOKEN}
    ports:
      \- "5678:5678"
    volumes:
      \- n8n-prod-data:/home/node/.n8n
      
  baserow-prod:
    image: baserow/baserow:latest
    environment:
      \- ENVIRONMENT=production
    ports:
      \- "8000:8000"
    volumes:
      \- baserow-prod-data:/baserow/data
      
  # Staging environment
  n8n-staging:
    image: n8nio/n8n:latest
    environment:
      \- N8N_ENVIRONMENT=staging
      \- BASEROW\_URL=${STAGING\_BASEROW_URL}
      \- BASEROW\_TOKEN=${STAGING\_BASEROW_TOKEN}
      \- OPENAI\_API\_KEY=${STAGING\_OPENAI\_API_KEY}
      \- WHATSAPP\_API\_URL=${STAGING\_WHATSAPP\_API_URL}
      \- WHATSAPP\_TOKEN=${STAGING\_WHATSAPP_TOKEN}
    ports:
      \- "5679:5678"
    volumes:
      \- n8n-staging-data:/home/node/.n8n
      
  baserow-staging:
    image: baserow/baserow:latest
    environment:
      \- ENVIRONMENT=staging
    ports:
      \- "8001:8000"
    volumes:
      \- baserow-staging-data:/baserow/data

volumes:
  n8n-prod-data:
  baserow-prod-data:
  n8n-staging-data:
  baserow-staging-data:

Replay harness

Persist anonymised WhatsApp conversations and replay them against new workflow versions in CI to catch regressions in branching logic.

// Conversation recording and replay system

// 1\. Record conversations to Conversation_Logs table
{
  id: uuid,
  conversation_id: string,
  anonymized\_user\_id: string,  // Hashed user ID
  messages: json,              // Array of messages with timing
  context_changes: json,       // User context changes during conversation
  tasks_presented: json,       // Tasks presented to user
  tasks_selected: json,        // Tasks user chose
  started_at: datetime,
  ended_at: datetime,
  total\_duration\_seconds: number,
  message_count: number,
  workflow_versions: json      // Workflow versions used during conversation
}

// 2\. Conversation Replay Tool
async function replayConversation(conversationId, targetEnvironment = 'staging') {
  // Load the recorded conversation
  const conversation = await getConversationLog(conversationId);
  
  if (!conversation) {
    throw new Error(\`Conversation ${conversationId} not found\`);
  }
  
  // Set up test environment
  const testUserId = \`test-${uuidv4()}\`;
  const testSession = {
    id: uuidv4(),
    conversation\_id: conversation.conversation\_id,
    original_id: conversation.id,
    environment: targetEnvironment,
    started_at: new Date().toISOString(),
    replay_results: \[\]
  };
  
  try {
    // Initialize test environment state
    await initializeTestEnvironment(testUserId, targetEnvironment);
    
    // Replay each message in sequence
    for (const message of conversation.messages) {
      // Send the message to the target environment
      const response = await sendTestMessage({
        user_id: testUserId,
        text: message.text,
        timestamp: new Date().toISOString(),
        environment: targetEnvironment,
        session_id: testSession.id
      });
      
      // Record the response
      testSession.replay_results.push({
        original_message: message,
        replay_response: response,
        timestamp: new Date().toISOString(),
        matches_expected: compareResponses(message.response, response)
      });
      
      // Add delay to simulate real conversation timing
      const delay = Math.min(message.delay_ms || 1000, 3000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Complete the test session
    testSession.ended_at = new Date().toISOString();
    testSession.success = testSession.replay\_results.every(r => r.matches\_expected);
    
    // Save test results
    await saveReplayResults(testSession);
    
    return {
      success: testSession.success,
      session_id: testSession.id,
      message_count: conversation.messages.length,
      matching\_responses: testSession.replay\_results.filter(r => r.matches_expected).length
    };
  } catch (error) {
    console.error(\`Replay failed: ${error.message}\`);
    
    // Save failed test results
    testSession.ended_at = new Date().toISOString();
    testSession.success = false;
    testSession.error = error.message;
    await saveReplayResults(testSession);
    
    throw error;
  } finally {
    // Clean up test environment
    await cleanupTestEnvironment(testUserId, targetEnvironment);
  }
}

// 3\. Use in CI pipeline
async function runRegressionTests() {
  // Get a set of representative conversations
  const testConversations = await getTestConversationSet();
  
  const results = \[\];
  
  for (const conversation of testConversations) {
    try {
      const replayResult = await replayConversation(conversation.id);
      results.push({
        conversation_id: conversation.id,
        success: replayResult.success,
        details: replayResult
      });
    } catch (error) {
      results.push({
        conversation_id: conversation.id,
        success: false,
        error: error.message
      });
    }
  }
  
  // Determine overall success
  const allPassed = results.every(r => r.success);
  
  return {
    success: allPassed,
    total_tests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

Load simulation

Use Artillery or k6 to fire 500 concurrent WhatsApp Webhooks at n8n, verifying CPU and memory headroom.

// k6 load test script for n8n webhooks
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';

// Custom metrics
const webhookErrors = new Counter('webhook_errors');
const slowResponses = new Counter('slow\_responses\_ms');

// Test configuration
export const options = {
  stages: \[
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 200 },   // Ramp up to 200 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 for 5 minutes
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  \],
  thresholds: {
    http\_req\_duration: \['p(95)<2000'\], // 95% of requests must complete below 2s
    webhook_errors: \['count<10'\],      // Less than 10 total errors
  },
};

// Sample messages
const sampleMessages = \[
  "I'm ready for tasks",
  "What should I work on?",
  "I'm at home with my laptop",
  "I have high energy and about 30 minutes",
  "I completed the report",
  "Show me more tasks",
  "Postpone this task",
  "I'm at the office now",
  "What's on my schedule today?"
\];

// Sample user contexts
const sampleContexts = \[
  { location: 'home', energy\_level: 'high', mental\_clarity: 'high', available\_time: 60, available\_tools: \['laptop', 'phone'\] },
  { location: 'office', energy\_level: 'medium', mental\_clarity: 'medium', available\_time: 30, available\_tools: \['desktop', 'phone'\] },
  { location: 'car', energy\_level: 'low', mental\_clarity: 'low', available\_time: 15, available\_tools: \['phone'\] },
  { location: 'outside', energy\_level: 'high', mental\_clarity: 'medium', available\_time: 45, available\_tools: \['phone', 'ipad'\] }
\];

// Test webhook endpoint
const webhookUrl = \_\_ENV.WEBHOOK\_URL || 'http://localhost:5678/webhook/test';

export default function() {
  // Generate unique user and session identifiers
  const userId = \`loadtest-${uuidv4()}\`;
  const sessionId = uuidv4();
  
  // Select random message and context
  const message = randomItem(sampleMessages);
  const context = randomItem(sampleContexts);
  
  // Prepare payload
  const payload = {
    user_id: userId,
    session_id: sessionId,
    message: {
      type: 'text',
      text: message
    },
    timestamp: new Date().toISOString(),
    context: context,
    is\_load\_test: true
  };
  
  // Send webhook request
  const startTime = new Date().getTime();
  const response = http.post(webhookUrl, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' }
  });
  const duration = new Date().getTime() - startTime;
  
  // Check response
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time &lt; 1000ms': (r) =&gt; r.timings.duration < 1000
  });
  
  // Record metrics
  if (response.status !== 200) {
    webhookErrors.add(1);
  }
  
  if (duration > 1000) {
    slowResponses.add(duration);
  }
  
  // Add some randomized sleep to simulate real user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Example k6 command:
// k6 run --vus 500 --duration 10m load-test.js
// Environment variable:
// WEBHOOK_URL=https://your-n8n-instance.com/webhook/path k6 run load-test.js

// With Artillery for comparable test:
/*
config:
  target: "http://localhost:5678"
  phases:
    \- duration: 30
      arrivalRate: 5
      rampTo: 50
      name: "Warm up"
    \- duration: 60
      arrivalRate: 50
      rampTo: 200
      name: "Ramp to 200"
    \- duration: 120
      arrivalRate: 200
      rampTo: 500
      name: "Ramp to 500"
    \- duration: 300
      arrivalRate: 500
      name: "Sustained load"
  processor: "./message-generator.js"
scenarios:
  \- name: "Webhook calls"
    flow:
      \- function: "generateMessage"
      \- post:
          url: "/webhook/test"
          json:
            user_id: "{{ userId }}"
            session_id: "{{ sessionId }}"
            message:
              type: "text"
              text: "{{ message }}"
            timestamp: "{{ timestamp }}"
            context: "{{ context }}"
            is\_load\_test: true
*/

### 10\. DevOps & Deployment

Immutable builds

Package n8n + custom nodes + scoring micro-service as version-pinned Docker images; deploy via compose or Kubernetes with rolling upgrades.

// Dockerfile for customized n8n image
FROM n8nio/n8n:0.214.0

\# Add custom n8n nodes
COPY ./custom-nodes /custom-nodes
RUN cd /custom-nodes/rex-os-nodes && npm install && npm run build && npm link

\# Install dependencies
RUN npm install @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http uuid

\# Custom configuration
COPY ./config /home/node/.n8n
COPY ./scripts /scripts

\# Set environment
ENV N8N\_CUSTOM\_EXTENSIONS="/custom-nodes/rex-os-nodes"
ENV N8N_VERSION="0.214.0"
ENV REX\_OS\_VERSION="1.2.3"

\# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5678/healthz || exit 1

ENTRYPOINT \["/scripts/entrypoint.sh"\]

// Docker Compose with version pinning
version: '3.8'

services:
  n8n:
    image: rex-os-n8n:1.2.3
    build:
      context: ./n8n
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      \- "5678:5678"
    environment:
      \- N8N_METRICS=true
      \- N8N\_DIAGNOSTICS\_ENABLED=true
      \- N8N\_LOG\_LEVEL=info
      \- N8N\_ENCRYPTION\_KEY=${N8N\_ENCRYPTION\_KEY}
      \- N8N_PROTOCOL=https
      \- N8N\_HOST=${N8N\_HOST}
      \- N8N_PORT=5678
      \- BASEROW\_URL=${BASEROW\_URL}
      \- OPENAI\_API\_KEY\_FILE=/run/secrets/openai\_api_key
    secrets:
      \- baserow\_api\_token
      \- openai\_api\_key
      \- whatsapp_token
    volumes:
      \- n8n_data:/home/node/.n8n
      \- n8n_logs:/logs
    depends_on:
      \- baserow
      \- redis
      \- scoring-service
      
  baserow:
    image: baserow/baserow:1.19.1
    restart: unless-stopped
    ports:
      \- "8000:8000"
    environment:
      \- BASEROW\_PUBLIC\_URL=${BASEROW_URL}
      \- DATABASE\_URL=postgresql://${DB\_USER}:${DB\_PASSWORD}@postgres:5432/${DB\_DATABASE}
      \- REDIS_URL=redis://redis:6379
    volumes:
      \- baserow_data:/baserow/data
    depends_on:
      \- postgres
      \- redis
      
  postgres:
    image: postgres:14-alpine
    restart: unless-stopped
    environment:
      \- POSTGRES\_USER=${DB\_USER}
      \- POSTGRES\_PASSWORD=${DB\_PASSWORD}
      \- POSTGRES\_DB=${DB\_DATABASE}
    volumes:
      \- postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      \- redis_data:/data
      
  scoring-service:
    image: rex-os-scoring:1.2.3
    build:
      context: ./scoring-service
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      \- "4000:4000"
    environment:
      \- PORT=4000
      \- NODE_ENV=production
      \- BASEROW\_URL=${BASEROW\_URL}
      \- BASEROW\_API\_TOKEN\_FILE=/run/secrets/baserow\_api_token
    secrets:
      \- baserow\_api\_token
    healthcheck:
      test: \["CMD", "curl", "-f", "http://localhost:4000/health"\]
      interval: 30s
      timeout: 10s
      retries: 3
      
  prometheus:
    image: prom/prometheus:v2.42.0
    restart: unless-stopped
    volumes:
      \- ./prometheus:/etc/prometheus
      \- prometheus_data:/prometheus
    command:
      \- '--config.file=/etc/prometheus/prometheus.yml'
      \- '--storage.tsdb.path=/prometheus'
    ports:
      \- "9090:9090"
      
  grafana:
    image: grafana/grafana:9.4.7
    restart: unless-stopped
    volumes:
      \- ./grafana/datasources:/etc/grafana/provisioning/datasources
      \- ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      \- grafana_data:/var/lib/grafana
    ports:
      \- "3000:3000"
    depends_on:
      \- prometheus

volumes:
  n8n_data:
  n8n_logs:
  baserow_data:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

secrets:
  baserow\_api\_token:
    file: ./secrets/baserow\_api\_token.txt
  openai\_api\_key:
    file: ./secrets/openai\_api\_key.txt
  whatsapp_token:
    file: ./secrets/whatsapp_token.txt

Blue-green strategy

Cut over traffic only after health probes pass; keep the old stack live for instant rollback.

// Blue-Green deployment script
#!/bin/bash
set -e

\# Configuration
APP_NAME="rex-os"
DOCKER_REGISTRY="registry.example.com"
GREEN\_STACK="${APP\_NAME}-green"
BLUE\_STACK="${APP\_NAME}-blue"
DEPLOY_TIMEOUT=300  # 5 minutes
HEALTH\_CHECK\_URL="https://api.example.com/healthz"
LOADBALANCER_CONFIG="/etc/nginx/sites-enabled/rex-os"

\# Determine which environment is currently active
if grep -q "${BLUE\_STACK}" "${LOADBALANCER\_CONFIG}"; then
  CURRENT_ENV="blue"
  NEW_ENV="green"
elif grep -q "${GREEN\_STACK}" "${LOADBALANCER\_CONFIG}"; then
  CURRENT_ENV="green"
  NEW_ENV="blue"
else
  echo "No active environment detected, defaulting to blue as current"
  CURRENT_ENV="blue"
  NEW_ENV="green"
fi

CURRENT\_STACK="${APP\_NAME}-${CURRENT_ENV}"
NEW\_STACK="${APP\_NAME}-${NEW_ENV}"

echo "Current active environment: ${CURRENT_ENV}"
echo "Deploying to: ${NEW_ENV}"

\# Pull latest images
docker-compose -f docker-compose.yml -f docker-compose.${NEW_ENV}.yml pull

\# Start or update the new environment
docker-compose -f docker-compose.yml -f docker-compose.${NEW_ENV}.yml up -d

\# Wait for deployment to complete
echo "Waiting for ${NEW_STACK} to be ready..."
timeout ${DEPLOY\_TIMEOUT} bash -c "until curl -s -f http://localhost:${NEW\_ENV}/healthz; do sleep 5; done"

\# Run quick smoke test
echo "Running smoke tests on ${NEW_STACK}..."
./scripts/smoke-test.sh ${NEW_ENV}

if \[ $? -ne 0 \]; then
  echo "Smoke tests failed! Aborting deployment."
  exit 1
fi

\# Update load balancer to point to new environment
echo "Updating load balancer configuration..."
sed -i "s/${CURRENT\_STACK}/${NEW\_STACK}/g" "${LOADBALANCER_CONFIG}"
nginx -t && systemctl reload nginx

\# Verify the new environment is serving traffic
echo "Verifying new environment is serving traffic..."
SERVING\_ENV=$(curl -s ${HEALTH\_CHECK_URL} | jq -r '.environment')

if \[ "${SERVING\_ENV}" != "${NEW\_ENV}" \]; then
  echo "ERROR: Load balancer is not routing to ${NEW_ENV}!"
  echo "Rolling back..."
  
  # Rollback load balancer config
  sed -i "s/${NEW\_STACK}/${CURRENT\_STACK}/g" "${LOADBALANCER_CONFIG}"
  nginx -t && systemctl reload nginx
  
  exit 1
fi

echo "Deployment successful! New active environment: ${NEW_ENV}"
echo "Previous environment (${CURRENT_ENV}) is still running for quick rollback if needed."
echo "To stop the previous environment: docker-compose -f docker-compose.yml -f docker-compose.${CURRENT_ENV}.yml down
     window.\_\_genspark\_remove\_badge\_link = "https://www.genspark.ai/api/html_badge/" +
            "remove_badge?token=To%2FBnjzloZ3UfQdcSaYfDuXipucSQuP5bq2u%2BYBzVtyrcLq6Lia8A9Dw89TqXUA7aAz77KEtGkjc6On%2FPB%2Blw365ta%2Bs7pu5bhgP6hYQ79eDwlYYK1NRY2MLNoNIEuY6Rim%2BSZCB1%2FV4CIi5TDGdCDaKqFex1d%2FbkW%2BFlg%2BS37RMdOWMNk6eUDhHaoKXVMp9J0fdf0PaQuxNZQMuW1x8HFpRVDLFARH2wP8zYtl%2FZUxWIcZrnTYSgyr%2FqsvZd0ZW2lQvUDaDvb4F1t77jPocv1TrKSHJVUzSh1tHkJLmpo2EfmJ57gxVLNmFnMdXQFwOe4GNn%2Fpp%2BVwl6S7DVcQ8Z6P37Oh07KSGWXC4f4dvguUFuoH34%2BF9jujo98qKBs2f7O%2BiVeZUfeo3abAidkr8U2FA75MVq4U%2FfQvpuar0hTGTxrMTvTvkollrkdkqKcmUdJgC8Ede2NAnXKS0q1MpHDs%2BZsCjOT%2Br1r2YWqnbs2qB7RwfhV6h3UGG1omTzlfQ8keZrxTjCpmHUtQbIJ3kWgHUSJN7e1%2FaxOlrp48WEcCW36imrNUh0VtBmYnvcUsBylZcu%2FGuoSc5Nv1QmWFIv8SPA1L34vTu96yTY%2BAt8bNRPuAsTHouMzG2i1%2BAcVUp";
        window.\_\_genspark\_locale = "en-US";
        window.\_\_genspark\_token = "To/BnjzloZ3UfQdcSaYfDuXipucSQuP5bq2u+YBzVtyrcLq6Lia8A9Dw89TqXUA7aAz77KEtGkjc6On/PB+lw365ta+s7pu5bhgP6hYQ79eDwlYYK1NRY2MLNoNIEuY6Rim+SZCB1/V4CIi5TDGdCDaKqFex1d/bkW+Flg+S37RMdOWMNk6eUDhHaoKXVMp9J0fdf0PaQuxNZQMuW1x8HFpRVDLFARH2wP8zYtl/ZUxWIcZrnTYSgyr/qsvZd0ZW2lQvUDaDvb4F1t77jPocv1TrKSHJVUzSh1tHkJLmpo2EfmJ57gxVLNmFnMdXQFwOe4GNn/pp+Vwl6S7DVcQ8Z6P37Oh07KSGWXC4f4dvguUFuoH34+F9jujo98qKBs2f7O+iVeZUfeo3abAidkr8U2FA75MVq4U/fQvpuar0hTGTxrMTvTvkollrkdkqKcmUdJgC8Ede2NAnXKS0q1MpHDs+ZsCjOT+r1r2YWqnbs2qB7RwfhV6h3UGG1omTzlfQ8keZrxTjCpmHUtQbIJ3kWgHUSJN7e1/axOlrp48WEcCW36imrNUh0VtBmYnvcUsBylZcu/GuoSc5Nv1QmWFIv8SPA1L34vTu96yTY+At8bNRPuAsTHouMzG2i1+AcVUp";