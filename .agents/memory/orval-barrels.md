---
name: Orval generated barrels
description: Non-obvious behavior when regenerating split API clients and schemas
---

Orval split generation may append wildcard exports to an existing package entry point even when it already has handwritten exports. Do not assume manually restricting a barrel's exports will survive regeneration.

**Why:** Regeneration reintroduced a type/schema name collision after an explicit type-export list had been written. The generator preserves existing content but appends its own generated wildcard exports.

**How to apply:** When generated query types and runtime schemas share names, resolve barrel ambiguity explicitly and run the full codegen command, including its chained TypeScript check. Avoid hand-editing generated files.
