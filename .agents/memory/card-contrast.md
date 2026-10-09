---
name: Card contrast and cascade layers
description: Why rendered reveal cards need color checks beyond DOM-text assertions
---

Keep shared card defaults in the components cascade layer so Tailwind background and text utilities can determine the intended contrast.

**Why:** An unlayered card background overrode the culprit reveal's colored background. Its name passed DOM-text assertions but was visually unreadable because foreground and background were nearly identical.

**How to apply:** When restyling shared cards or changing palettes, inspect the actual culprit and champion screens, including computed foreground/background colors. Text existing in the DOM is not proof that players can read it.
