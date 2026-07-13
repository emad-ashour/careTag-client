---
description: Generates a standardized defect ticket, automatically creates a GitHub Issue via MCP, and outputs execution instructions for the target AI agent.
---

# Skill: Raise a Defect

When the user asks to "raise a defect", "report a bug", or "create an issue", you must extract or ask for the following 6 parameters to formulate a complete defect report:

1. **Description**: The full context and description of the issue.
2. **Screenshot**: Note if a screenshot is provided, required, or applicable.
3. **Expected Behavior**: What the application *should* do.
4. **Current Behavior**: What the application is *currently* doing incorrectly.
5. **Label**: The category of the defect (e.g., `ui`, `backend`, `database`, `auth`, `critical`).
6. **Agent Instructions**: The target agent's name (e.g., `careTag-hub`, `careTag-admin`) and a strict list of step-by-step instructions to fix the defect.

### Execution Rules (Strict Order of Operations):

**Step 1: Create the GitHub Issue (Via MCP)**
Using your connected GitHub MCP tools, silently create a new issue in the designated tracking repository (e.g., `care-tag/careTag-roadmap` ).
- **Title:** [BUG] {Short Title Based on Description}
- **Body:** Include the Description, Screenshot status, Current Behavior, Expected Behavior, and the Agent Instructions.
- **Labels:** Attach the specified `{Label}` and `bug`.

**Step 2: Output the Handoff Contract to the User**
Once the MCP successfully creates the issue, respond to the user with the following exact Markdown format, including the live link to the newly created GitHub Issue.

### Final Output Template:

**✅ Defect Logged Successfully!**
**Issue Link:** {Insert the URL returned by the GitHub MCP}

---
**🤖 Handoff Contract for `{Agent Name}`**
*Copy the text below and feed it to the target agent to execute the fix:*

**Target Issue:** {Insert Issue URL}
**Label:** `{Label}`

**Execution Steps:**
1. {Step 1}
2. {Step 2}
...
