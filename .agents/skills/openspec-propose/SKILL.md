---
name: openspec-propose
description: Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.3.1"
---

Propose a new change - create the change and generate all artifacts in one step.

I'll create a change with artifacts:
- proposal.md (what & why)
- design.md (how)
- tasks.md (implementation steps)

When ready to implement, run /opsx:apply

---

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what they want to build.

2. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change at `openspec/changes/<name>/` with `.openspec.yaml`.

3. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies

4. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `outputPath`: Where to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

5. **Inject testing requirements into artifacts** (MANDATORY - cannot skip)

   After all artifacts are created, read `openspec/testing-strategy.md` and modify each artifact to embed testing:

   a. **proposal.md**: Add a "测试策略" section before "成功标准", containing:
      - Which test layers are needed (unit/integration/E2E) based on change type
      - Reference to openspec/testing-strategy.md change-type mapping table
      - Estimated test file names (e.g., `tests/module-name.test.js`)

   b. **design.md**: Add a "测试架构设计" section containing:
      - Test file directory layout
      - Which modules need unit tests
      - Which cross-module interactions need integration tests
      - Which user flows need E2E tests
      - External dependencies to mock

   c. **tasks.md**: Apply the following transformations:
      - For every functional task group (e.g., "2. 修改交互模块"), insert a corresponding testing task group immediately after it
      - Testing task naming convention: append `.T` to the group number (e.g., "2.T 交互模块测试")
      - Testing tasks must follow TDD order: Red (write failing test) → Green (min implementation) → Refactor
      - At the END of tasks.md, append the full content of `openspec/templates/testing-checklist.md`
      - Example transformation:
        ```
        ## 2. 修改交互模块
        - [ ] 2.1 修改 openStationEditor()
        - [ ] 2.2 添加 addShopRow()
        - [ ] 2.3 添加 deleteShopRow()
        
        ## 2.T 交互模块测试
        - [ ] 2.T.1 编写 openStationEditor() 的测试用例（Red）
        - [ ] 2.T.2 编写 addShopRow() 的测试用例（Red）
        - [ ] 2.T.3 编写 deleteShopRow() 的测试用例（Red）
        - [ ] 2.T.4 运行测试确认全部失败（Red 验证）
        - [ ] 2.T.5 实现使测试通过（Green）
        - [ ] 2.T.6 重构代码（Refactor）
        ```

   d. **specs/*.md**: Add "Testing Notes" at the end of each spec file:
      - Which test layer covers this spec
      - Expected test cases (bullet list)
      - Any special mocking requirements

6. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- Testing tasks injected: which modules have tests, how many test tasks
- What's ready: "All artifacts created! Ready for implementation."
- Prompt: "Run `/opsx:apply` or ask me to implement to start working on the tasks."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
- **NEVER skip testing injection** - if a change involves any logic (not pure CSS/config), testing tasks MUST be created
- **Testing tasks are not optional** - they are part of the artifact, not an afterthought
