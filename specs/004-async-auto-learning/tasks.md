# Tasks: 异步自动学习优化

**Input**: Design documents from `/specs/004-async-auto-learning/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **hooks/**: Hook 脚本目录
- **lib/**: 核心库文件目录
- 项目使用 Node.js，无 src 目录

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目基础结构和依赖确认

- [x] T001 确认项目结构和现有代码状态
- [x] T002 创建 feature 目录 feature/async-auto-learning/ 用于模块化存储
- [x] T003 [P] 创建 feature/async-auto-learning/README.md 功能说明文档

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心日志记录模块，所有用户故事都依赖此模块

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 创建 learning-logger 模块骨架 lib/learning-logger.js
- [x] T005 实现 createLogger(sessionId, cwd) 函数，创建日志记录器实例
- [x] T006 实现 logger.log(level, step, message, data) 方法，记录日志条目
- [x] T007 实现 logger.logError(step, message, error) 方法，记录错误日志
- [x] T008 实现 logger.logStep(step, message, data, startTime) 方法，记录步骤完成日志
- [x] T009 实现 logger.getLogPath() 方法，获取日志文件路径
- [x] T010 确保日志目录自动创建（fs.mkdirSync recursive: true）
- [x] T011 验证日志格式符合 JSON Lines 规范和宪章 VII（无 emoji）

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 会话快速关闭 (Priority: P1) MVP

**Goal**: 用户结束会话时立即关闭，自动学习在后台异步执行

**Independent Test**: 启动 Claude Code 会话，进行对话后关闭，测量会话关闭时间是否 < 1 秒

### Implementation for User Story 1

- [x] T012 [US1] 创建 worker 进程脚本骨架 hooks/auto-learning-worker.js
- [x] T013 [US1] 实现 worker 命令行参数解析（接收 JSON 配置）
- [x] T014 [US1] 实现 worker 主流程：读取 transcript -> 过滤 -> LLM 分析 -> 生成 skill
- [x] T015 [US1] 在 worker 中集成 learning-logger，记录每个步骤
- [x] T016 [US1] 实现 worker 错误处理，确保所有错误记录到日志但不崩溃
- [x] T017 [US1] 重构 hooks/auto-learning.js 为异步调度器
- [x] T018 [US1] 实现 spawn 异步启动 worker 进程（detached: true, stdio: 'ignore'）
- [x] T019 [US1] 实现 child.unref() 确保父进程不等待子进程
- [x] T020 [US1] 添加终端输出：显示 session_id 和日志文件路径
- [x] T021 [US1] 添加 spawn 失败的 fallback 处理

**Checkpoint**: At this point, User Story 1 should be fully functional - session closes immediately, learning runs in background

---

## Phase 4: User Story 2 - 详细日志记录 (Priority: P2)

**Goal**: 开发者可以通过日志追踪完整的自动学习执行过程

**Independent Test**: 触发一次会话结束，检查日志文件是否包含完整的执行过程记录

### Implementation for User Story 2

- [x] T022 [US2] 在 worker 中添加 read_transcript 步骤的详细日志（文件路径、记录数）
- [x] T023 [US2] 在 worker 中添加 parse_transcript 步骤的详细日志
- [x] T024 [US2] 在 worker 中添加 filter_sensitive 步骤的详细日志（过滤前后摘要）
- [x] T025 [US2] 在 worker 中添加 llm_request 步骤日志（请求参数摘要）
- [x] T026 [US2] 在 worker 中添加 llm_response 步骤日志（响应内容摘要）
- [x] T027 [US2] 在 worker 中添加 generate_skill 步骤日志（生成路径）
- [x] T028 [US2] 在 worker 中添加 write_skill 步骤日志（写入结果）
- [x] T029 [US2] 为所有步骤添加 duration_ms 耗时统计
- [x] T030 [US2] 添加 complete 步骤日志，标记任务完成

**Checkpoint**: At this point, User Story 2 should be fully functional - all steps are logged in detail

---

## Phase 5: User Story 3 - 学习结果可靠性 (Priority: P3)

**Goal**: 异步方式的 skill 生成结果与同步方式保持一致

**Independent Test**: 对比同步和异步方式生成的 skill 文件，验证结果一致性

### Implementation for User Story 3

- [x] T031 [US3] 验证 worker 的 transcript 读取逻辑与原 auto-learning.js 一致
- [x] T032 [US3] 验证 worker 的敏感信息过滤逻辑与原版一致
- [x] T033 [US3] 验证 worker 的 LLM 调用逻辑与原版一致（使用相同的 lib/llm-analyzer.js）
- [x] T034 [US3] 验证 worker 的 skill 生成逻辑与原版一致（使用相同的 lib/skill-generator.js）
- [x] T035 [US3] 添加多会话并行测试场景的日志隔离验证
- [x] T036 [US3] 添加边界情况处理：transcript 文件不存在时记录日志并退出
- [x] T037 [US3] 添加边界情况处理：API Key 不存在时记录日志并退出

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T038 [P] 更新 feature/async-auto-learning/README.md 安装说明
- [x] T039 [P] 更新 CLAUDE.md 项目说明，添加异步学习功能描述
- [x] T040 验证跨平台兼容性（Windows, Linux, macOS）
- [x] T041 清理原 auto-learning.js 中的冗余代码
- [x] T042 运行 quickstart.md 验证流程

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 -> P2 -> P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 completion (adds logging to US1's worker)
- **User Story 3 (P3)**: Depends on US1 and US2 completion (validates consistency)

### Within Each User Story

- Core implementation before enhancement
- Worker creation before hook refactoring (US1)
- Basic logging before detailed logging (US2)
- Functionality before validation (US3)

### Parallel Opportunities

- T002, T003 can run in parallel (different files)
- Within US2: T022-T028 can be added together in one file edit
- T038, T039 can run in parallel (different files)

---

## Parallel Example: Phase 2 Foundational

```bash
# All tasks in Phase 2 are sequential (same file: lib/learning-logger.js)
# Complete in order T004 -> T011
```

## Parallel Example: User Story 2

```bash
# These logging additions can be done together:
Task: "Add read_transcript step logging"
Task: "Add parse_transcript step logging"
Task: "Add filter_sensitive step logging"
# All in same file: hooks/auto-learning-worker.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test session close time < 1 second
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy (MVP!)
3. Add User Story 2 -> Test logging completeness -> Deploy
4. Add User Story 3 -> Test result consistency -> Deploy
5. Each story adds value without breaking previous stories

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 42 |
| Setup Tasks | 3 |
| Foundational Tasks | 8 |
| User Story 1 Tasks | 10 |
| User Story 2 Tasks | 9 |
| User Story 3 Tasks | 7 |
| Polish Tasks | 5 |
| Parallel Opportunities | 4 |

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
