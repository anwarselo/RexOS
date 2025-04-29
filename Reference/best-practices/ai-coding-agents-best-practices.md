## **Best Practices for Using AI Coding Agents (e.g., Augment Code)**

[*(Extracted from augmentcode.com/blog/best-practices-for-using-ai-coding-agents)*](https://augmentcode.com/blog/best-practices-for-using-ai-coding-agents)

This document outlines best practices to follow when collaborating with AI coding agents like Augment Code to maximize efficiency and effectiveness during software development.

**1\. Collaboration Mindset:**

* Treat the AI agent like a **fellow engineer** – perhaps less experienced in the specific context, but intelligent and capable. Collaborate rather than just command.

**2\. Prompting Strategy:**

* **Be Detailed:** Provide detailed prompts, especially for complex tasks. Avoid overly short or ambiguous instructions.  
* **Provide Context:** Give comprehensive background information relevant to the task.  
* **Use Integrations:** Share relevant documentation (tickets, GitHub issues, PRDs) using available integrations (e.g., Augment Integrations).  
* **Include Examples:** Provide helpful examples for reference when applicable.  
* **Specify Keywords & Files:** Mention relevant keywords and specific file locations the agent should focus on or modify.  
* **Break Down Complexity:** Decompose complex tasks into smaller, digestible pieces. Tackle one piece at a time.  
* **Plan First (for Complex Tasks):** Discuss and refine the plan with the agent *before* starting implementation on complex tasks.

**3\. Iteration and Refinement:**

* **Leverage Iteration:** Take advantage of the agent's ability to iterate based on test results and code execution output. Feed back errors or test failures.  
* **Use Checkpointing:** Utilize the checkpointing system (like Augment Agent's) to revert incorrect file edits easily.  
* **Guide, Don't Always Restart:** If the agent is only slightly off track but has made useful progress, guide it in the right direction within the same session. Only start a new session if it's completely off track.  
* **Provide Positive Feedback:** Acknowledge when the agent does a good job; this can sometimes reinforce positive patterns (though effectiveness varies by model).

**4\. Managing Scope and Sessions:**

* **Distinct Tasks, New Sessions:** Create new sessions for distinct logical tasks to maintain context clarity.  
* **Review Incrementally:** When implementing large changes, review the agent's modifications after each sub-task to avoid accumulating review debt.

**5\. Handling Challenges:**

* **Language:** If working in a language other than English, consider switching to English for prompts, as LLMs are predominantly trained on English data.  
* **Framework Syntax Issues:** If the agent struggles with a specific framework's syntax, explicitly direct it to look up the official documentation online.  
* **Safety Concerns:** If concerned about the agent running potentially dangerous commands, start by using a non-auto mode (requiring explicit confirmation for actions).

**6\. Effective Interaction Techniques:**

* **Verify Understanding:** Begin by using the agent in a "question-answering" mode to check its understanding of your codebase or the task context.  
* **Start Simple:** Experiment with simple, self-contained tasks first to get accustomed to the agent's capabilities and interaction style.  
* **Ask Clarifying Questions:** Feel free to ask the agent questions about the code it generated (e.g., prefix with "Just a question:").  
* **Batch Minor Fixes:** For multiple small improvements, consider leaving comments (e.g., \#TODO(agent): fix this) and asking the agent to address all \#TODO comments at once, rather than fixing each individually.  
* **Verify Completeness:** Request the agent to run git diff (or equivalent) to verify the changes made and check if any cleanup is needed.  
* **Testing is Key:** Have the agent write tests for the code it generates, run them, and verify the functionality.

**7\. Exploration:**

* **Try Unfamiliar Tasks:** Don't hesitate to use the agent for tasks or technologies you are less familiar with; it can be a powerful learning tool.

By adhering to these practices, we can foster a more productive and efficient collaboration with AI coding agents during the development of RexOS.