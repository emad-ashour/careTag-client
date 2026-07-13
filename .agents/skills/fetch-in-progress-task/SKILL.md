---
name: fetch-in-progress-task
description: Fetch the current active "In Progress" task from the Care Tag organization project board.
---

# Skill: Fetch In-Progress Task

This skill retrieves the issues/tickets that are currently in the "In Progress" status column on the "Care Tag" Project Board #1.

## Triggering Keywords
Trigger this skill whenever the user asks for the active tasks, "In Progress" tasks, or board status for Care Tag.

## Instructions
1. Run the Python helper script located at `/home/emad/projects/careTag-Client/.agents/skills/fetch-in-progress-task/scripts/fetch_in_progress.py`.
2. Format and present the returned task details (Title, Number, URL, Labels, Description) to the user.
