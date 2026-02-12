# Tasks: ccsaffold Plugin Standardization

**Input**: Design documents from `/specs/003-plugin-standardize/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: 此项目使用手动测试 + `--plugin-dir` 标志验证，无自动化测试任务。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Plugin root**: `ccsaffold/`
- **Commands**: `ccsaffold/commands/`
- **Hooks**: `ccsaffold/hooks/`
- **Skills**: `ccsaffold/skills/`
- **Support files**: `ccsaffold/.specify/`

---

## Phase 1: Setup (Plugin Structure)

**Purpose**: 创建插件基础目录结构和清单文件

- [x] T001 Create plugin root directory ccsaffold/
- [x] T002 Create .claude-plugin directory at ccsaffold/.claude-plugin/
- [x] T003 [P] Create plugin.json manifest at ccsaffold/.claude-plugin/plugin.json
- [x] T004 [P] Create commands directory at ccsaffold/commands/
- [x] T005 [P] Create hooks directory at ccsaffold/hooks/
- [x] T006 [P] Create skills directory at ccsaffold/skills/
- [x] T007 [P] Create .specify directory structure at ccsaffold/.specify/

---

## Phase 2: Foundational (Core Infrastructure)

**Purpose**: 迁移 speckit 工作流支持文件，这是所有命令的基础设施

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Copy .specify/memory/ directory to ccsaffold/.specify/memory/
- [x] T009 Copy .specify/scripts/ directory to ccsaffold/.specify/scripts/
- [x] T010 Copy .specify/templates/ directory to ccsaffold/.specify/templates/

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 安装和使用 ccsaffold 插件 (Priority: P1) MVP

**Goal**: 用户可以通过 `--plugin-dir` 加载插件并验证基本功能

**Independent Test**: 运行 `claude --plugin-dir ./ccsaffold` 后执行 `/ccsaffold:speckit.specify` 验证命令可用

### Implementation for User Story 1

- [x] T011 [US1] Create README.md documentation at ccsaffold/README.md
- [x] T012 [US1] Validate plugin structure with `claude --plugin-dir ./ccsaffold`
- [ ] T013 [US1] Test basic command availability by running `/ccsaffold:speckit.specify`

**Checkpoint**: 插件可以被加载，README 文档说明安装方法

---

## Phase 4: User Story 2 - 使用 speckit 工作流命令 (Priority: P1)

**Goal**: 所有 10 个 speckit 命令以命名空间格式可用

**Independent Test**: 每个命令可以独立测试，如 `/ccsaffold:speckit.specify "测试功能"`

### Implementation for User Story 2

- [x] T014 [P] [US2] Copy speckit.specify.md to ccsaffold/commands/speckit.specify.md
- [x] T015 [P] [US2] Copy speckit.plan.md to ccsaffold/commands/speckit.plan.md
- [x] T016 [P] [US2] Copy speckit.tasks.md to ccsaffold/commands/speckit.tasks.md
- [x] T017 [P] [US2] Copy speckit.implement.md to ccsaffold/commands/speckit.implement.md
- [x] T018 [P] [US2] Copy speckit.clarify.md to ccsaffold/commands/speckit.clarify.md
- [x] T019 [P] [US2] Copy speckit.analyze.md to ccsaffold/commands/speckit.analyze.md
- [x] T020 [P] [US2] Copy speckit.constitution.md to ccsaffold/commands/speckit.constitution.md
- [x] T021 [P] [US2] Copy speckit.checklist.md to ccsaffold/commands/speckit.checklist.md
- [x] T022 [P] [US2] Copy speckit.taskstoissues.md to ccsaffold/commands/speckit.taskstoissues.md
- [x] T023 [US2] Copy speckit.manual-learn.md (if exists) to ccsaffold/commands/speckit.manual-learn.md
- [ ] T024 [US2] Validate all commands work with `/ccsaffold:speckit.*` namespace

**Checkpoint**: 所有 speckit 命令可用并通过命名空间验证

---

## Phase 5: User Story 3 - 使用 session 日志 Hooks (Priority: P2)

**Goal**: Session 日志功能自动启用，记录用户提示

**Independent Test**: 提交提示后检查 `doc/session_log/` 目录是否有日志文件

### Implementation for User Story 3

- [x] T025 [US3] Copy log-user-prompt.js hook script to ccsaffold/hooks/log-user-prompt.js
- [x] T026 [US3] Create hooks.json configuration at ccsaffold/hooks/hooks.json
- [x] T027 [US3] Update hook script to use correct relative paths for plugin context
- [ ] T028 [US3] Validate session logging by submitting a prompt and checking log file

**Checkpoint**: Session 日志功能正常工作

---

## Phase 6: User Story 4 - 使用 Agent Skills (Priority: P2)

**Goal**: Agent Skills（hook-creator, learn）可通过上下文自动调用

**Independent Test**: 请求创建 hook 时 Claude 自动使用 hook-creator skill

### Implementation for User Story 4

- [x] T029 [P] [US4] Copy hook-creator skill directory to ccsaffold/skills/hook-creator/
- [x] T030 [P] [US4] Copy learn skill directory to ccsaffold/skills/learn/ (if exists)
- [x] T031 [US4] Validate SKILL.md files have correct frontmatter (name, description)
- [ ] T032 [US4] Test skill auto-invocation by requesting "帮我创建一个 hook"

**Checkpoint**: Agent Skills 可被自动调用

---

## Phase 7: User Story 5 - 插件版本管理和更新 (Priority: P3)

**Goal**: 插件有清晰的版本号，README 说明更新方法

**Independent Test**: 检查 plugin.json 版本号是否为 semver 格式

### Implementation for User Story 5

- [x] T033 [US5] Verify plugin.json version follows semver format (1.0.0)
- [x] T034 [US5] Add version update instructions to ccsaffold/README.md
- [x] T035 [US5] Add changelog section to ccsaffold/README.md (optional)

**Checkpoint**: 版本管理规范完成

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 文档更新和项目清理

- [x] T036 [P] Update CLAUDE.md to reflect new plugin structure
- [x] T037 [P] Update doc/plugin_designer.md with final plugin structure
- [x] T038 Run full quickstart.md validation - test all installation and usage steps
- [x] T039 Clean up any temporary files or duplicate configurations
- [ ] T040 Final validation: `claude --plugin-dir ./ccsaffold` loads successfully

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (both P1)
  - US3 and US4 can proceed in parallel (both P2)
  - US5 can proceed independently (P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - No dependencies

### Parallel Opportunities

- All Setup directory creation tasks (T001-T007) can run in parallel
- All command copy tasks (T014-T023) can run in parallel
- US1 and US2 can be worked on in parallel
- US3 and US4 can be worked on in parallel
- Final polish tasks (T036-T037) can run in parallel

---

## Parallel Example: User Story 2 (Commands)

```bash
# Launch all command copy tasks together:
Task: "Copy speckit.specify.md to ccsaffold/commands/speckit.specify.md"
Task: "Copy speckit.plan.md to ccsaffold/commands/speckit.plan.md"
Task: "Copy speckit.tasks.md to ccsaffold/commands/speckit.tasks.md"
Task: "Copy speckit.implement.md to ccsaffold/commands/speckit.implement.md"
# ... and so on for all commands
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup (plugin structure)
2. Complete Phase 2: Foundational (.specify files)
3. Complete Phase 3: User Story 1 (basic installation)
4. Complete Phase 4: User Story 2 (all commands)
5. **STOP and VALIDATE**: Test plugin loading and all commands
6. Plugin is now usable as MVP

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 + 2 -> Core functionality (MVP!)
3. Add User Story 3 -> Session logging enhancement
4. Add User Story 4 -> Agent Skills enhancement
5. Add User Story 5 -> Version management polish
6. Complete Phase 8 -> Full polish and documentation

---

## Summary

| Phase | Tasks | Parallel Tasks | Story |
|-------|-------|----------------|-------|
| Phase 1: Setup | T001-T007 (7) | T003-T007 (5) | - |
| Phase 2: Foundational | T008-T010 (3) | 0 | - |
| Phase 3: US1 | T011-T013 (3) | 0 | US1 |
| Phase 4: US2 | T014-T024 (11) | T014-T023 (10) | US2 |
| Phase 5: US3 | T025-T028 (4) | 0 | US3 |
| Phase 6: US4 | T029-T032 (4) | T029-T030 (2) | US4 |
| Phase 7: US5 | T033-T035 (3) | 0 | US5 |
| Phase 8: Polish | T036-T040 (5) | T036-T037 (2) | - |
| **Total** | **40 tasks** | **19 parallelizable** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All paths are relative to repository root
