# AI Assistant Guidelines for RexOS Development

## 0. Date and Time Verification
- REMEMBER when the user request is UDCP (Update, Commit and Push) run the `date` command in the terminal to get the current date and time
- Use this date information for all documentation, timestamps, and planning before proceeding with any other actions
- This must be done before any documentation to ensure accurate timestamping
- Format all timestamps based on this verified date and time in the format [YYYY-MM-DD HH:MM]

## 1. Initial Context Gathering
- If the user is asking for a specific workflow advice or to add a specific feature, or suggests a workflow modification that is extremely complex in your opinion, go to this website https://n8n.io/workflows/ and search if there's any similar workflow and see how it can be adapted or customized or split or used as is to help the user achieve the objective of building the system.
Check the Context7 MCP at the start of each new chat
- Check Context7 MCP when the user requests research on functionality for n8n, Supabase, ElevenLabs conversational AI agent, or any other technology being considered
- Use this information to provide accurate, up-to-date guidance for code generation
- Do not hallucinate the presence of code that can replace n8n nodes. First check if the nodes are available in the n8n templates website https://n8n.io/workflows/ and recommend to the user. Do not make up node code yourself.
- If the user is asking for research, research in the context of n8n workflows and what others have had success with in the past using web search and the n8n documentation and the n8n templates website.

## 2. System Terminology
- Always refer to the system as "RexOS" (a multi-domain system agent), not a personal agent - The Agent name the user has chosen is Alex. this will be referring to the voice in elevenlabs conversational ai agent.

## 3. Development Approach
- Start with simple core functionality first (like 'remember' commands)
- Build incrementally rather than implementing complex solutions all at once
- When converting from agent-based to domain-based structure, rename and restructure files rather than removing them

## 4. Data Storage
- Use Supabase as the database for storing information
- Store data in tables within the 'rexos' schema
- For memory storage, use the 'remember_this' table with fields: note_id, timestamp, full_message, category, subject, content, remind_date, and gdrive_link
- The note_id field requires a bigint data type, not a string

## 5. Message Classification
- Classify messages containing phrases like "remember this", "remind me to", etc. as memory storage items
- Classify messages with phrases like "make a task", "create a task" as task management items
- When classifying messages with multiple instructions, prioritize the first instruction
- Process image captions the same way as text messages

## 6. Session Handling
- Always use 17789189938 as the session ID for both webhook and WhatsApp message sources

## 7. Documentation Style
- Keep guidelines and documentation concise rather than extensive
- Focus on practical implementation details

## 8. Code Management
- Store all code in appropriately named files in the designated code folder
- Update the code files whenever changes are made
- Never erase code files; instead, archive them with timestamps
- Naming convention for current code: "[NodeName] node code current"
- Naming convention for archived code: "[NodeName] node code archived [Month Day Year Time]"
- Include a comment at the beginning of archived files explaining why the code was deprecated
- Maintain the original code in the archived file after the explanation comment
- This versioning system ensures chronological tracking of code changes while preserving all versions

## 9. Development Workflow
- Follow the Step-by-Step Guided Implementation (SSGI) approach:
  - Begin with a brief overview of how the solution will work in general (2-3 sentences)
  - Provide a concise numbered list of all steps that will be needed
  - Present only the first actionable step in detail
  - Wait for confirmation or feedback before proceeding to the next step
  - Continue this pattern until implementation is complete
- Never overwhelm the user with multi-step actions
- Break down tasks into small, manageable steps that can be completed in 1-2 minutes
- Provide one node with code or a couple of clicks at a time
- Always test after each small change before proceeding to the next step
- Avoid multi-step actions that might cover up errors or break things without testing
- Build step by step, ensuring each component works before adding the next

## 10. Workflow Optimization
- Always look for ways to minimize complexity and reduce the number of nodes
- Suggest workflow optimizations when building something new
- Wait for user confirmation before implementing optimizations
- Use phrases like: "If we add X node, there will be no need for Y and Z nodes, reducing workflow complexity"
- Allow the user to decide when to implement these optimizations based on context and time constraints

## 11. Development Tracking
- Use the development tracking files in the development folder to document all aspects of the project
- Update DONE_LIST.md with completed actions, each with a precise timestamp [YYYY-MM-DD HH:MM]
- Add timestamps to EVERY single line item in the DONE_LIST.md, not just groups of items
- Update TO_DO_LIST.md with upcoming tasks and priorities, each with a precise creation timestamp [YYYY-MM-DD HH:MM]
- Document challenges, solutions, and decisions in CHALLENGES.md, each with a precise timestamp [YYYY-MM-DD HH:MM]
- Record functional changes, additions, and removals in FUNCTIONAL_CHANGES.md, each with a precise timestamp [YYYY-MM-DD HH:MM]
- Always include timestamps on every item created
- Reference these tracking files when discussing project status or planning next steps

## 12. Database Schema Management
- Before creating or modifying any database tables, confirm if the current schema exists
- Check the 'current tables in db' folder for existing schema files
- Verify if there's a file called 'current approved tables' that lists all approved tables
- Ask the user if they have specific fields or relations in mind before suggesting any
- Wait for explicit confirmation before creating any code, query, or plan related to database interactions
- Do not create nodes or commands that interact with tables that aren't approved and documented
- Only work with tables that are agreed upon and have their schema stored as CSV files in the 'current tables in db' folder

## 13. Conversation Continuity
- [2025-05-01 23:47] RexOS uses a conversation continuity system to maintain context across messages
- [2025-05-01 23:47] The system uses ZEP Memory for semantic understanding and Supabase for state persistence
- [2025-05-01 23:47] The conversation_contexts table in Supabase stores conversation state with fields: conversation_id, current_state, last_message, context_data, and updated_at
- [2025-05-01 23:47] The AI Agent node in n8n is configured with ZEP memory and Supabase tools to maintain context
- [2025-05-01 23:47] Media processing (images, documents, audio) feeds back to the STDRD node after processing to maintain context
- [2025-05-01 23:47] Special message prefixes like "PROCESSED_IMAGE:" and "PROCESSED_DOCUMENT:" indicate media confirmations
- [2025-05-01 23:47] The system message for the AI Agent includes instructions for handling these special message types
- [2025-05-01 23:47] This implementation ensures seamless conversation flow even when processing different media types
