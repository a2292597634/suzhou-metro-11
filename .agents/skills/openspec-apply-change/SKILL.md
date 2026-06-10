---
name: openspec-apply-change
description: Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.3.1"
---

Implement tasks from an OpenSpec change.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx:apply <other>`).

2. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using openspec-continue-change
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

6. **Verify testing infrastructure before implementation**

   Before starting the first task, run a quick check:
   - Run `npm test` to confirm current test suite passes
   - If tests fail, report and ask whether to fix first or continue
   - This establishes a Green baseline before making changes

7. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - **Detect task type**:
     - If task is a **test task** (contains "测试" or "test" or ends with `.T`): execute TDD workflow (see below)
     - If task is an **implementation task**: execute normally, but after completion run related tests
     - If task is a **refactor task**: run all tests first, refactor, run tests again
   - Make the code changes required
   - Keep changes minimal and focused
   - Mark task complete in the tasks file: `- [ ]` → `- [x]`
   - Continue to next task

   **TDD Workflow for test tasks (MANDATORY):**
   
   When encountering a test task (e.g., "2.T.1 编写 xxx 的测试用例"), follow this exact order:
   
   1. **Red Phase**: Write the test case that describes expected behavior
      - The test MUST fail when first run (this proves it's testing new behavior)
      - If the test passes immediately, the test is wrong - rewrite it
      - Show the failing output to confirm Red state
   
   2. **Green Phase**: Write the minimum code to make the test pass
      - Do NOT write "extra" code beyond what's needed for the test
      - Run the test, confirm it passes
      - Show the passing output to confirm Green state
   
   3. **Refactor Phase** (if applicable): Clean up the code
      - Only after test is Green
      - Run tests after each refactor step
      - Stop if tests break
   
   **After every implementation task:**
   - Run `npm test` to ensure no regressions
   - If tests fail, fix before marking the task complete

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts
   - Tests fail and cannot be fixed within the task scope → report and wait

8. **Final verification before completion**

   After all tasks are marked complete:
   - Run `npm test` one final time → must show all passing
   - Run `node scripts/check-test-coverage.js` → must pass
   - Review `tasks.md` testing checklist at the bottom → all boxes must be checked
   - If any check fails, do NOT claim the change is complete

9. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - Test results: "X tests passed, 0 failed"
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Green baseline: ✓ 27 tests passed

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete | Tests: 28 passed, 0 failed

Working on task 4/7: 3.T.1 编写 xxx 的测试用例（Red）
Writing test... Running test...
✓ Red confirmed: test fails as expected

Working on task 5/7: 3.T.5 实现使测试通过（Green）
Writing minimum implementation... Running test...
✓ Green confirmed: test passes
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓
**Tests:** 31 passed, 0 failed ✓
**Coverage:** All modules covered ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! Ready to archive this change.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete
**Tests:** 5 failed, 2 passed ⚠️

### Issue Encountered
<description of the issue>

**Options:**
1. Fix the failing tests before continuing
2. Update the test expectations (if the spec changed)
3. Other approach

What would you like to do?
```

**Guardrails**
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names
- **NEVER skip a test task** - testing tasks are mandatory, not optional
- **NEVER mark a task complete if tests fail** - the Red state must be resolved
- **NEVER write implementation before its corresponding test** - TDD order is enforced
- **After EVERY task completion, run tests** - this catches regressions immediately

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
