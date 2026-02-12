# Tasks: Web Reader MCP Cache Hooks

**Input**: Design documents from `/specs/005-web-cache-hooks/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: 手动测试 + 功能验证脚本（无自动化测试需求）

**Organization**: 任务按用户故事分组，支持独立实现和测试

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 描述中包含精确文件路径

## Path Conventions

- **Feature 模块**: `feature/web-cache-hooks/`
- **安装目标**: `.claude/hooks/`, `.claude/skills/learn/`, `doc/`

---

## Phase 1: Setup (项目初始化)

**Purpose**: 创建 feature 模块目录结构和基础文件

- [x] T001 Create feature module directory structure `feature/web-cache-hooks/`
- [x] T002 [P] Create hooks subdirectory `feature/web-cache-hooks/hooks/`
- [x] T003 [P] Create scripts subdirectory `feature/web-cache-hooks/scripts/`

---

## Phase 2: Foundational (基础设施)

**Purpose**: 创建所有用户故事共用的配置和工具函数

**CRITICAL**: 用户故事实现必须等待此阶段完成

- [x] T004 Create URL utility module for domain extraction in `feature/web-cache-hooks/lib/url-utils.js`
- [x] T005 [P] Create settings.json fragment for hook configuration in `feature/web-cache-hooks/settings.fragment.json`
- [x] T006 [P] Create README.md with installation and usage instructions in `feature/web-cache-hooks/README.md`
- [x] T007 Create install script to copy hooks and merge settings in `feature/web-cache-hooks/scripts/install.js`

**Checkpoint**: 基础设施就绪 - 可以开始用户故事实现

---

## Phase 3: User Story 1 - 使用已缓存的网站内容 (Priority: P1)

**Goal**: Before Hook 检查缓存，优先使用已缓存的网站内容，跳过 MCP 调用

**Independent Test**: 创建一个测试缓存 skill 文件，然后请求读取该网站，验证系统返回缓存内容且不调用 MCP

### Implementation for User Story 1

- [x] T008 [US1] Implement domain extraction and normalization in `feature/web-cache-hooks/lib/url-utils.js` (extractDomain function)
- [x] T009 [US1] Implement cache lookup logic in `feature/web-cache-hooks/lib/cache-matcher.js` (findCacheSkill function)
- [x] T010 [US1] Implement PreToolUse hook for web-reader MCP in `feature/web-cache-hooks/hooks/web-cache-before.js`
- [x] T011 [US1] Add cache hit logging (ASCII only, no emoji) in `feature/web-cache-hooks/hooks/web-cache-before.js`
- [x] T012 [US1] Handle edge cases: corrupted cache, invalid URL in `feature/web-cache-hooks/hooks/web-cache-before.js`

**Checkpoint**: Before Hook 完成 - 缓存命中时可跳过 MCP 调用

---

## Phase 4: User Story 2 - 自动缓存新访问的网站内容 (Priority: P1)

**Goal**: After Hook (prompt 类型) 将 web-reader 返回的内容保存为 skill 和原始 markdown 存档

**Independent Test**: 访问一个新网站，验证生成 `skills/learn/{domain}/SKILL.md` 和 `doc/{domain}.md`

### Implementation for User Story 2

- [x] T013 [US2] Create doc directory structure for markdown archives in `feature/web-cache-hooks/scripts/install.js` (update)
- [x] T014 [US2] Create skills/learn directory structure in `feature/web-cache-hooks/scripts/install.js` (update)
- [x] T015 [US2] Add PostToolUse hook configuration (prompt type) in `feature/web-cache-hooks/settings.fragment.json`
- [x] T016 [US2] Define prompt template for markdown summarization in `feature/web-cache-hooks/settings.fragment.json`
- [x] T017 [US2] Update CLAUDE.md to reference doc/ directory for cached content

**Checkpoint**: After Hook 完成 - 新网站内容自动缓存

---

## Phase 5: User Story 3 - 处理缓存失效与更新 (Priority: P2)

**Goal**: 支持强制刷新缓存，跳过已有缓存直接调用 MCP

**Independent Test**: 对已缓存网站执行强制刷新，验证旧缓存被新内容替换

### Implementation for User Story 3

- [x] T018 [US3] Implement force-refresh detection in `feature/web-cache-hooks/hooks/web-cache-before.js`
- [x] T019 [US3] Add refresh keyword detection logic in `feature/web-cache-hooks/lib/cache-matcher.js`
- [x] T020 [US3] Update README.md with force-refresh usage instructions in `feature/web-cache-hooks/README.md`

**Checkpoint**: 强制刷新功能完成 - 用户可控制缓存更新

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完善功能，确保跨平台兼容性和文档完整性

- [x] T021 [P] Verify cross-platform path handling (Windows/Linux/macOS) in all hook scripts
- [x] T022 [P] Add error handling with graceful degradation in `feature/web-cache-hooks/hooks/web-cache-before.js`
- [x] T023 Run quickstart.md validation - test complete workflow end-to-end
- [x] T024 [P] Update CLAUDE.md with web-cache-hooks feature documentation
- [x] T025 Final review of all log outputs (ensure ASCII only, no emoji)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - 阻塞所有用户故事
- **User Stories (Phase 3-5)**: 全部依赖 Foundational 完成
  - US1 和 US2 可并行（不同文件）
  - US3 依赖 US1（修改同一文件）
- **Polish (Phase 6)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational 后开始 - 无其他故事依赖
- **User Story 2 (P1)**: 可在 Foundational 后开始 - 与 US1 独立
- **User Story 3 (P2)**: 依赖 US1（修改 web-cache-before.js）

### Within Each User Story

- lib 模块在 hook 脚本之前
- 核心实现在边界处理之前
- 故事完成后验证独立测试

### Parallel Opportunities

- Phase 1: T002, T003 可并行
- Phase 2: T005, T006 可并行
- Phase 3-4: US1 和 US2 的不同文件任务可并行
- Phase 6: T021, T022, T024 可并行

---

## Parallel Example: Phase 2

```bash
# 并行创建配置文件
Task: "Create settings.json fragment in feature/web-cache-hooks/settings.fragment.json"
Task: "Create README.md in feature/web-cache-hooks/README.md"
```

## Parallel Example: User Story 1 & 2

```bash
# US1 和 US2 可同时进行（不同文件）
Task (US1): "Implement PreToolUse hook in feature/web-cache-hooks/hooks/web-cache-before.js"
Task (US2): "Add PostToolUse hook configuration in feature/web-cache-hooks/settings.fragment.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (缓存命中)
4. Complete Phase 4: User Story 2 (缓存生成)
5. **STOP and VALIDATE**: 测试完整缓存流程
6. 可选部署

### Incremental Delivery

1. Setup + Foundational -> 基础就绪
2. Add US1 -> Before Hook 可用 -> 测试缓存命中
3. Add US2 -> After Hook 可用 -> 测试缓存生成
4. Add US3 -> 强制刷新可用 -> 完整功能

---

## Notes

- [P] 任务 = 不同文件，无依赖冲突
- [Story] 标签 = 任务到用户故事的映射
- 每个用户故事应独立完成和测试
- 每个任务或逻辑组完成后提交
- 任何检查点停止验证故事独立性
- 避免：模糊任务、同文件冲突、跨故事依赖
