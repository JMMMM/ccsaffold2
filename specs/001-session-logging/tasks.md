# Tasks: 会话内容记录功能

**Input**: Design documents from `/specs/001-session-logging/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 根据宪章原则II（TDD开发模式），测试任务已包含在内。

**Organization**: 任务按用户故事组织，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属用户故事（US1, US2, US3, US4）
- 描述中包含精确的文件路径

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- 本项目采用单项目结构

---

## Phase 1: Setup (项目初始化)

**Purpose**: 创建项目结构和基础配置

- [x] T001 Create project directory structure (src/hooks/, src/lib/, tests/unit/, tests/integration/)
- [x] T002 [P] Create .claude/conversations/ directory for log files
- [x] T003 [P] Create .claude/settings.json with hooks configuration skeleton

**Checkpoint**: 项目结构就绪

---

## Phase 2: Foundational (基础模块)

**Purpose**: 核心工具模块，所有用户故事依赖此阶段完成

**⚠️ CRITICAL**: 用户故事实现必须等待此阶段完成

### Tests for Foundational (TDD)

- [x] T004 [P] Write unit tests for file-utils module in tests/unit/file-utils.test.js
- [x] T005 [P] Write unit tests for logger module in tests/unit/logger.test.js

### Implementation for Foundational

- [x] T006 Implement ensureDirectoryExists function in src/lib/file-utils.js
- [x] T007 Implement getLogFilePath function in src/lib/file-utils.js
- [x] T008 Implement appendToFile function in src/lib/file-utils.js
- [x] T009 Implement readFileLines function in src/lib/file-utils.js
- [x] T010 Implement writeLinesToFile function in src/lib/file-utils.js
- [x] T011 Implement formatEntry function in src/lib/logger.js
- [x] T012 Implement countUserLines function in src/lib/logger.js
- [x] T013 Implement scrollToLimit function in src/lib/logger.js
- [x] T014 Run unit tests and verify all pass

**Checkpoint**: 基础模块就绪，用户故事可并行开始

---

## Phase 3: User Story 1 - 自动记录用户提示 (Priority: P1) 🎯 MVP

**Goal**: 用户提交提示时自动记录到日志文件，以"user>"前缀标识

**Independent Test**: 在Claude Code中提交提示，检查日志文件是否出现对应的"user>"记录

### Tests for User Story 1 (TDD)

- [x] T015 [P] [US1] Write unit test for log-user-prompt.js in tests/unit/log-user-prompt.test.js

### Implementation for User Story 1

- [x] T016 [US1] Implement stdin JSON parsing in src/hooks/log-user-prompt.js
- [x] T017 [US1] Implement user entry formatting with "user>" prefix in src/hooks/log-user-prompt.js
- [x] T018 [US1] Integrate logger module for file writing in src/hooks/log-user-prompt.js
- [x] T019 [US1] Add error handling for invalid input in src/hooks/log-user-prompt.js
- [x] T020 [US1] Run tests and verify User Story 1 acceptance scenarios

**Checkpoint**: User Story 1 完成并可独立测试

---

## Phase 4: User Story 2 - 自动记录AI工具使用 (Priority: P1)

**Goal**: Claude使用工具后自动记录，以"claude>"前缀标识，排除查询类工具

**Independent Test**: 触发Claude使用非查询类工具，检查日志文件是否出现对应的"claude>"记录

### Tests for User Story 2 (TDD)

- [x] T021 [P] [US2] Write unit test for log-tool-use.js in tests/unit/log-tool-use.test.js
- [x] T022 [P] [US2] Write test for excluded tools (Grep, Glob, etc.) in tests/unit/log-tool-use.test.js

### Implementation for User Story 2

- [x] T023 [US2] Implement stdin JSON parsing in src/hooks/log-tool-use.js
- [x] T024 [US2] Implement tool name extraction and summary generation in src/hooks/log-tool-use.js
- [x] T025 [US2] Implement claude entry formatting with "[tool] summary" pattern in src/hooks/log-tool-use.js
- [x] T026 [US2] Integrate logger module for file writing in src/hooks/log-tool-use.js
- [x] T027 [US2] Add error handling for missing tool fields in src/hooks/log-tool-use.js
- [x] T028 [US2] Run tests and verify User Story 2 acceptance scenarios

**Checkpoint**: User Stories 1 和 2 均可独立工作

---

## Phase 5: User Story 3 - 内容滚动更新 (Priority: P2)

**Goal**: user行数超过100时自动删除最早的约1/3内容

**Independent Test**: 创建超过100行user>记录的日志文件，触发记录操作后验证最早记录被删除

### Tests for User Story 3 (TDD)

- [x] T029 [P] [US3] Write unit test for scrollToLimit function in tests/unit/logger.test.js (extend existing)
- [x] T030 [P] [US3] Write integration test for rolling update in tests/integration/rolling-update.test.js

### Implementation for User Story 3

- [x] T031 [US3] Enhance scrollToLimit to identify entry boundaries in src/lib/logger.js
- [x] T032 [US3] Implement delete oldest 1/3 entries logic in src/lib/logger.js
- [x] T033 [US3] Integrate scrollToLimit into log-user-prompt.js hook
- [x] T034 [US3] Integrate scrollToLimit into log-tool-use.js hook
- [x] T035 [US3] Run tests and verify User Story 3 acceptance scenarios

**Checkpoint**: 滚动更新功能完成

---

## Phase 6: User Story 4 - 跨平台兼容 (Priority: P2)

**Goal**: 在Windows、macOS、Linux上正常工作

**Independent Test**: 在三个平台上分别验证日志功能

### Implementation for User Story 4

- [x] T036 [US4] Verify path module usage for cross-platform compatibility in src/lib/file-utils.js
- [x] T037 [US4] Add EOL handling for different platforms in src/lib/logger.js
- [x] T038 [US4] Create integration test script for cross-platform validation in tests/integration/cross-platform.sh

**Checkpoint**: 跨平台兼容性验证完成

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 整体优化和最终验证

- [x] T039 [P] Update .claude/settings.json with final hooks configuration
- [x] T040 [P] Write integration test for full workflow in tests/integration/hooks.test.js
- [x] T041 Run quickstart.md validation - verify installation steps work
- [x] T042 [P] Add inline code comments for complex logic
- [x] T043 Final test run - verify all acceptance scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 立即开始
- **Foundational (Phase 2)**: 依赖Setup完成 - 阻塞所有用户故事
- **User Stories (Phase 3-6)**: 依赖Foundational完成
  - US1 和 US2 可并行进行
  - US3 依赖 US1 或 US2 的基础记录功能
  - US4 可与 US3 并行
- **Polish (Phase 7)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 依赖Foundational完成 - 无其他故事依赖
- **User Story 2 (P1)**: 依赖Foundational完成 - 无其他故事依赖
- **User Story 3 (P2)**: 依赖US1或US2（需要触发记录才能测试滚动）
- **User Story 4 (P2)**: 依赖US1/US2完成 - 可与US3并行

### Within Each User Story

- 测试先行（TDD），确保测试失败后再实现
- 实现完成后运行测试验证

### Parallel Opportunities

| Phase | 可并行任务 |
|-------|-----------|
| Phase 1 | T002, T003 |
| Phase 2 | T004, T005 (测试) |
| Phase 3 | T015 (测试) |
| Phase 4 | T021, T022 (测试) |
| Phase 5 | T029, T030 (测试) |
| Phase 7 | T039, T040, T042 |

---

## Parallel Example: Phase 2 Foundational

```bash
# 并行启动测试编写
Task: "Write unit tests for file-utils module in tests/unit/file-utils.test.js"
Task: "Write unit tests for logger module in tests/unit/logger.test.js"
```

## Parallel Example: User Story 1 & 2

```bash
# Foundational完成后，US1和US2可并行开发
Developer A: User Story 1 (T015-T020)
Developer B: User Story 2 (T021-T028)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: 测试用户提示记录功能
5. 可独立部署/演示

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. Add User Story 1 → 测试 → MVP完成
3. Add User Story 2 → 测试 → AI工具记录完成
4. Add User Story 3 → 测试 → 滚动更新完成
5. Add User Story 4 → 测试 → 跨平台验证完成
6. 每个故事独立增加价值

---

## Notes

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签映射任务到具体用户故事
- 每个用户故事独立可完成和测试
- TDD: 测试先行，确保失败后再实现
- 每个任务完成后提交代码
- 在任意检查点停止验证故事独立性
