# Tasks: 持续学习 (Continuous Learning)

**Input**: Design documents from `/specs/001-continuous-learning/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 规格中要求 TDD 开发模式，包含测试任务。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Feature directory**: `feature/continuous-learning/`
- **Runtime target**: `.claude/` (after install)
- **Generated skills**: `.skills/learn/` (project root)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create feature directory structure per implementation plan at feature/continuous-learning/
- [x] T002 [P] Create hooks/ subdirectory at feature/continuous-learning/hooks/
- [x] T003 [P] Create lib/ subdirectory at feature/continuous-learning/lib/
- [x] T004 [P] Create scripts/ subdirectory at feature/continuous-learning/scripts/
- [x] T005 [P] Create skills/ subdirectory at feature/continuous-learning/skills/
- [x] T006 [P] Create test directory structure at feature/continuous-learning/tests/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core library modules that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Foundational Tests

- [x] T007 [P] Write unit test for sensitive-filter module in feature/continuous-learning/tests/sensitive-filter.test.js
- [x] T008 [P] Write unit test for transcript-reader module in feature/continuous-learning/tests/transcript-reader.test.js

### Foundational Implementation

- [x] T009 Implement sensitive-filter module with regex patterns in feature/continuous-learning/lib/sensitive-filter.js
- [x] T010 Implement transcript-reader module for JSONL parsing in feature/continuous-learning/lib/transcript-reader.js
- [x] T011 Run tests to verify foundational modules pass

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 自动学习 (Priority: P1) 🎯 MVP

**Goal**: 会话结束时自动分析会话内容，识别"用户多次反复沟通后才最终修复的问题"，生成 skill 文件保存到 .skills/learn 目录

**Independent Test**: 模拟 sessionEnd 事件，提供包含多次迭代修复问题的 transcript 文件，验证是否正确生成 skill 文件

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [P] [US1] Write unit test for llm-analyzer module in feature/continuous-learning/tests/llm-analyzer.test.js
- [x] T013 [P] [US1] Write unit test for skill-generator module in feature/continuous-learning/tests/skill-generator.test.js
- [x] T014 [US1] Write integration test for auto-learning hook in feature/continuous-learning/tests/auto-learning.test.js

### Implementation for User Story 1

- [x] T015 [P] [US1] Implement llm-analyzer module with https API calls in feature/continuous-learning/lib/llm-analyzer.js
- [x] T016 [P] [US1] Implement skill-generator module with template formatting in feature/continuous-learning/lib/skill-generator.js
- [x] T017 [US1] Implement auto-learning hook for sessionEnd event in feature/continuous-learning/hooks/auto-learning.js
- [x] T018 [US1] Create settings.json with sessionEnd hook configuration in feature/continuous-learning/settings.json
- [x] T019 [US1] Run tests to verify User Story 1 implementation passes
- [x] T020 [US1] Verify skill file is generated to correct path .skills/learn/*.md

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 手动学习 (Priority: P2)

**Goal**: 用户可以手动触发学习功能，分析当前会话或指定的历史会话内容，生成 skill

**Independent Test**: 执行手动学习命令，指定一个会话记录，验证是否正确生成 skill 文件

### Tests for User Story 2

- [x] T021 [US2] Write unit test for manual-learn skill in feature/continuous-learning/tests/manual-learn.test.js

### Implementation for User Story 2

- [x] T022 [US2] Create manual-learn skill definition in feature/continuous-learning/skills/manual-learn.md
- [x] T023 [US2] Add manual learning instructions and trigger keywords to skill file
- [x] T024 [US2] Run tests to verify User Story 2 implementation passes

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Skill 去重与更新 (Priority: P3)

**Goal**: 当新学习到的内容与现有 skill 相关时，系统智能地更新现有 skill 而不是创建重复的内容

**Independent Test**: 模拟两次学习相似的会话内容，验证是否正确更新了现有 skill 而非创建重复文件

### Tests for User Story 3

- [x] T025 [US3] Write unit test for skill deduplication logic in feature/continuous-learning/tests/skill-dedup.test.js

### Implementation for User Story 3

- [x] T026 [US3] Implement skill similarity check function in feature/continuous-learning/lib/skill-generator.js
- [x] T027 [US3] Implement skill merge/update logic in feature/continuous-learning/lib/skill-generator.js
- [x] T028 [US3] Update auto-learning hook to use dedup logic in feature/continuous-learning/hooks/auto-learning.js
- [x] T029 [US3] Run tests to verify User Story 3 implementation passes

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T030 [P] Create install.sh script for feature installation in feature/continuous-learning/scripts/install.sh
- [x] T031 [P] Create verify.sh script for installation verification in feature/continuous-learning/scripts/verify.sh
- [x] T032 [P] Create test.sh script for running all tests in feature/continuous-learning/scripts/test.sh
- [x] T033 [P] Create README.md with usage instructions in feature/continuous-learning/README.md
- [x] T034 Add error handling and logging to all modules
- [x] T035 Verify cross-platform compatibility (Windows/macOS/Linux)
- [x] T036 Run quickstart.md validation scenarios
- [x] T037 Create sample transcript file for testing in feature/continuous-learning/tests/fixtures/sample-transcript.jsonl

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent, but builds on US1 modules
- **User Story 3 (P3)**: Can start after User Story 1 (requires skill-generator from US1)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Lib modules before hook scripts
- Hook scripts before settings.json
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T002-T006) can run in parallel
- Foundational tests (T007-T008) can run in parallel
- User Story 1 tests (T012-T013) can run in parallel
- User Story 1 modules (T015-T016) can run in parallel
- Polish tasks (T030-T033) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit test for llm-analyzer module in feature/continuous-learning/tests/llm-analyzer.test.js"
Task: "Write unit test for skill-generator module in feature/continuous-learning/tests/skill-generator.test.js"

# After tests written, launch all modules together:
Task: "Implement llm-analyzer module with https API calls in feature/continuous-learning/lib/llm-analyzer.js"
Task: "Implement skill-generator module with template formatting in feature/continuous-learning/lib/skill-generator.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2 (partial, independent work)
3. After User Story 1 completes:
   - Developer C: User Story 3

---

## Task Summary

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1: Setup | 6 | Project structure initialization |
| Phase 2: Foundational | 5 | Core library modules |
| Phase 3: User Story 1 | 9 | 自动学习 (MVP) |
| Phase 4: User Story 2 | 4 | 手动学习 |
| Phase 5: User Story 3 | 5 | Skill 去重与更新 |
| Phase 6: Polish | 8 | Cross-cutting concerns |
| **Total** | **37** | |

### MVP Scope (Recommended)

- Phase 1: Setup (T001-T006)
- Phase 2: Foundational (T007-T011)
- Phase 3: User Story 1 (T012-T020)
- **MVP Total**: 20 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
