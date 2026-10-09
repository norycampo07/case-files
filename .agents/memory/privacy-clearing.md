---
name: Privacy clearing
description: Why room privacy controls require visible-state verification as well as server-state checks.
---

For changes to chat disabling, reset, or case replacement, verify that discarded information actually disappears from the rendered UI in both clients.

**Why:** Server clearing and backend tests once passed while React reconciliation retained orphaned chat panels containing old messages. The API returned a fresh case, but the visible UI still contradicted the promised no-history behavior.

**How to apply:** Check one continuous multiplayer flow: disabling chat removes the panel/messages, re-enabling shows one empty panel, and reset/new case removes previous chat, notes, selections, and results. Watch for duplicate-key warnings. Do not treat a clean room response alone as proof of the privacy contract.
