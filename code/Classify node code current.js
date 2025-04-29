// Message classifier for memory storage vs task management
// Created: April 29, 2023
// Purpose: Classifies messages as memory storage or task management based on content patterns
// Handles both text messages and image captions

function classifyMessage(standardizedData) {
  // Get the message content - for images, use the caption if available
  let messageContent = "";
  
  if (standardizedData.messageType === "image" && standardizedData.messageContent) {
    // For images, use the caption as the message content
    messageContent = standardizedData.messageContent.toLowerCase();
  } else if (standardizedData.messageType === "text" || !standardizedData.messageType) {
    // For text messages or if messageType is not specified
    messageContent = (standardizedData.messageContent || "").toLowerCase();
  } else {
    // For other types of messages that we can't classify
    return {
      ...standardizedData,
      classification: {
        type: "unclassifiable",
        confidence: 0.9,
        reason: `Non-text message type without caption: ${standardizedData.messageType}`
      }
    };
  }
  
  // If we don't have any content to classify after the above checks
  if (!messageContent.trim()) {
    return {
      ...standardizedData,
      classification: {
        type: "unclassifiable",
        confidence: 0.9,
        reason: "No text content to classify"
      }
    };
  }
  
  // Memory storage related keywords and phrases (English and Arabic)
  const memoryPatterns = [
    // English memory patterns
    "remember this",
    "remember that",
    "remind me to",
    "remind me that",
    "i want to remember",
    "make a reminder",
    "set a reminder",
    "remind me if",
    "do i have a memory of",
    "is there a reminder for",
    "did i remember to",
    "did someone remind me to",
    "can you remind me to",
    "note this",
    "note that",
    "save this",
    "save that",
    "store this",
    "memorize this",
    "keep this in mind",
    "keep that in mind",
    "i just remembered",
    "top of mind",
    "someone told me",
    "i heard that",
    "i saw",
    "i know that",
    "i found that",
    
    // Arabic memory patterns
    "تذكير",
    "ذاكرة",
    "تذكر هذا",
    "تذكر ذلك",
    "ذكرني بـ",
    "ذكرني أن",
    "أريد أن أتذكر",
    "اعمل تذكير",
    "ضع تذكير",
    "ذكرني إذا",
    "هل لدي ذاكرة عن",
    "هل هناك تذكير لـ",
    "هل تذكرت أن",
    "هل ذكرني أحد أن",
    "هل يمكنك تذكيري بـ",
    "دون هذا",
    "دون ذلك",
    "احفظ هذا",
    "احفظ ذلك",
    "خزن هذا",
    "احفظ هذا في الذاكرة",
    "ضع هذا في الاعتبار",
    "تذكرت للتو",
    "في مقدمة ذهني",
    "أخبرني شخص ما",
    "سمعت أن",
    "رأيت",
    "أعرف أن",
    "وجدت أن"
  ];
  
  // Task management related keywords and phrases (English and Arabic)
  const taskPatterns = [
    // English task patterns
    "make a task",
    "create a task",
    "set a task",
    "check my tasks",
    "is there a task to",
    "do i have a task for",
    "do i have a task to",
    "check for tasks related to",
    "is there a task named",
    "make a task to",
    "check tasks from",
    "make a task with subtasks",
    "make a subtask for the task",
    "is there a subtask under the task",
    "add a task",
    "add task",
    "new task",
    "task list",
    "todo list",
    "to-do list",
    "task status",
    "complete task",
    "finish task",
    "update task",
    
    // Arabic task patterns
    "مهمة",
    "اعمل مهمة",
    "أنشئ مهمة",
    "ضع مهمة",
    "تحقق من مهامي",
    "هل هناك مهمة لـ",
    "هل لدي مهمة لـ",
    "هل لدي مهمة لـ",
    "تحقق من المهام المتعلقة بـ",
    "هل هناك مهمة باسم",
    "اعمل مهمة لـ",
    "تحقق من المهام من",
    "اعمل مهمة بمهام فرعية",
    "اعمل مهمة فرعية للمهمة",
    "هل هناك مهمة فرعية تحت المهمة",
    "أضف مهمة",
    "أضف مهمة",
    "مهمة جديدة",
    "قائمة المهام",
    "قائمة المهام",
    "قائمة المهام",
    "حالة المهمة",
    "أكمل المهمة",
    "أن<|im_start|> المهمة",
    "حدّث المهمة"
  ];
  
  // Function to find the earliest pattern match and its position
  function findEarliestMatch(content, patterns) {
    let earliestMatch = {
      pattern: null,
      position: Infinity
    };
    
    for (const pattern of patterns) {
      const position = content.indexOf(pattern);
      if (position !== -1 && position < earliestMatch.position) {
        earliestMatch = {
          pattern,
          position
        };
      }
    }
    
    return earliestMatch;
  }
  
  // Find earliest matches for both categories
  const earliestMemoryMatch = findEarliestMatch(messageContent, memoryPatterns);
  const earliestTaskMatch = findEarliestMatch(messageContent, taskPatterns);
  
  // Determine classification based on which pattern appears first
  let classification = "unknown";
  let confidence = 0;
  let matchedPattern = null;
  let reason = "";
  
  // Check if we have matches for either category
  const hasMemoryMatch = earliestMemoryMatch.pattern !== null;
  const hasTaskMatch = earliestTaskMatch.pattern !== null;
  
  if (hasMemoryMatch && hasTaskMatch) {
    // Both types of patterns found - determine which comes first
    if (earliestMemoryMatch.position < earliestTaskMatch.position) {
      classification = "memory_storage";
      confidence = 0.9;
      matchedPattern = earliestMemoryMatch.pattern;
      reason = "Memory pattern appears first in message";
    } else {
      classification = "task_management";
      confidence = 0.9;
      matchedPattern = earliestTaskMatch.pattern;
      reason = "Task pattern appears first in message";
    }
  } else if (hasMemoryMatch) {
    // Only memory patterns found
    classification = "memory_storage";
    confidence = 0.95;
    matchedPattern = earliestMemoryMatch.pattern;
    reason = "Only memory patterns found";
  } else if (hasTaskMatch) {
    // Only task patterns found
    classification = "task_management";
    confidence = 0.95;
    matchedPattern = earliestTaskMatch.pattern;
    reason = "Only task patterns found";
  } else {
    // No patterns found
    classification = "unknown";
    confidence = 0.8;
    reason = "No matching patterns found";
  }
  
  // Add classification to the standardized data
  return {
    ...standardizedData,
    classification: {
      type: classification,
      confidence: confidence,
      matchedPattern: matchedPattern,
      reason: reason,
      memoryPosition: hasMemoryMatch ? earliestMemoryMatch.position : -1,
      taskPosition: hasTaskMatch ? earliestTaskMatch.position : -1
    }
  };
}

// Get the standardized input data
const standardizedData = $input.item.json;

// Process and return classified output
return {
  json: classifyMessage(standardizedData)
};
