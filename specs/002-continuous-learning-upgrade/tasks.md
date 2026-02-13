# Tasks: 持续学习功能升级

**Input**: Design documents from `/specs/002-continuous-learning-upgrade/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 根据宪章 TDD 原则，包含测试任务。

**Organization**: 任务按用户故事分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3, US4）
- 描述中包含精确文件路径

## Path Conventions

- **插件目录**: `ccsaffold2/` (repository root)
- **hooks**: `hooks/`
- **lib**: `lib/`
- **skills**: `skills/`

---

## Phase 1: Setup (项目初始化)

**Purpose**: 准备开发环境和目录结构

- [x] T001 创建功能目录结构 `.claude/doc/features/` 用于存储功能文档
- [x] T002 [P] 验证 Claude CLI 可用性和版本（支持 `--output-format json`）

---

## Phase 2: Foundational - Claude CLI 集成 (US4, Priority: P1)

**Purpose**: 核心基础设施改造，替换 HTTP API 为 Claude CLI

**⚠️ CRITICAL**: 所有后续用户故事依赖此阶段完成

**Goal**: 使用 Claude CLI 替代直接 HTTP API 调用进行大模型分析

**Independent Test**: 调用学习功能，验证使用 `claude -p` 命令而非 HTTP 请求

### Tests for US4

- [x] T003 [P] [US4] 创建 Claude CLI 客户端单元测试 `tests/unit/claude-cli-client.test.js`

### Implementation for US4

- [x] T004 [US4] 创建 Claude CLI 客户端 `lib/claude-cli-client.js`
  - 封装 `claude -p "prompt"` 调用逻辑
  - 支持 stdin 管道输入
  - 支持 `--output-format json` 参数
  - 支持 `--max-turns 1` 限制
  - 错误处理和超时控制（30秒）
  - Claude CLI 可用性检查
- [x] T005 [US4] 改造 LLM 分析器 `lib/llm-analyzer.js`
  - 移除直接 HTTP 请求逻辑（智谱 AI API）
  - 调用新的 Claude CLI 客户端
  - 保持现有 `analyze()` 接口兼容
  - 更新 prompt 构建逻辑
- [x] T006 [US4] 更新自动学习工作进程 `hooks/auto-learning-worker.js`
  - 集成改造后的 LLM 分析器
  - 添加 Claude CLI 可用性检查
  - 不可用时优雅降级，记录错误日志
- [x] T007 [US4] 运行 Claude CLI 客户端测试，验证基础功能

**Checkpoint**: Claude CLI 集成完成，`claude -p` 可正常调用并返回结构化输出

---

## Phase 3: User Story 1 - Skill 生成（顽固 Bug 修复）(Priority: P1) 🎯 MVP

**Goal**: 当会话显示"同一问题反复沟通后最终修复"时，自动生成 Skill

**Independent Test**: 模拟包含多次调试尝试（>=3次失败后成功）的会话，验证生成 Skill

### Tests for US1

- [x] T008 [P] [US1] 创建输出类型分类器测试 `tests/unit/output-type-classifier.test.js`
- [x] T009 [P] [US1] 创建 Skill 生成集成测试 `tests/integration/skill-generation.test.js`

### Implementation for US1

- [x] T010 [P] [US1] 创建输出类型分类器 `lib/output-type-classifier.js`
  - 分析会话内容特征
  - 调用 Claude CLI 判断输出类型
  - 识别"顽固 bug"特征（>=3次失败尝试）
  - 返回 `{ type: 'skill'|'feature-doc'|'none', confidence, reason }`
- [x] T011 [US1] 扩展 Skill 生成器 `lib/skill-generator.js`
  - 添加顽固 bug 特征识别
  - 优化触发词生成（基于 bug 现象描述）
  - 保持现有去重/合并逻辑
- [x] T012 [US1] 集成到自动学习流程 `hooks/auto-learning-worker.js`
  - 调用输出类型分类器
  - 根据 type='skill' 生成 Skill
  - 记录学习日志
- [x] T013 [US1] 运行 US1 测试，验证 Skill 生成流程

**Checkpoint**: 顽固 bug 场景可自动生成 Skill，触发词基于 bug 现象

---

## Phase 4: User Story 2 - 功能文档生成 (Priority: P1)

**Goal**: 当会话涉及功能开发、修改、性能调优时，自动生成功能文档

**Independent Test**: 模拟功能开发会话，验证生成功能文档

### Tests for US2

- [x] T014 [P] [US2] 创建功能文档生成器测试 `tests/unit/feature-doc-generator.test.js`
- [x] T015 [P] [US2] 创建功能文档集成测试 `tests/integration/feature-doc-generation.test.js`

### Implementation for US2

- [x] T016 [P] [US2] 创建功能文档生成器 `lib/feature-doc-generator.js`
  - 功能文档内容生成
  - Markdown 格式化（包含名称、类型、设计、实现点、变更历史）
  - 现有文档合并/更新逻辑（追加变更记录）
  - 存储路径：`.claude/doc/features/{name}.md`
- [x] T017 [US2] 扩展输出类型分类器 `lib/output-type-classifier.js`
  - 识别功能开发/修改/调优特征
  - 返回 type='feature-doc'
- [x] T018 [US2] 集成到自动学习流程 `hooks/auto-learning-worker.js`
  - 根据 type='feature-doc' 生成功能文档
  - 支持文档合并更新
  - 记录学习日志
- [x] T019 [US2] 运行 US2 测试，验证功能文档生成流程

**Checkpoint**: 功能开发场景可自动生成/更新功能文档

---

## Phase 5: User Story 3 - 手动学习触发 (Priority: P2)

**Goal**: 用户可通过 `/learn` 等命令手动触发学习，立即生成 Skill 或功能文档

**Independent Test**: 在会话中输入 `/learn`，验证立即分析并展示结果

### Tests for US3

- [x] T020 [P] [US3] 创建手动学习测试 `tests/integration/manual-learn.test.js`

### Implementation for US3

- [x] T021 [US3] 更新手动学习 Skill `skills/manual-learn/SKILL.md`
  - 添加多输出类型说明（Skill / 功能文档）
  - 更新触发条件和指令
  - 添加输出类型判断逻辑说明
- [x] T022 [US3] 更新自动学习工作进程 `hooks/auto-learning-worker.js`
  - 支持手动触发模式（非异步）
  - 返回学习结果摘要
  - 区分自动/手动学习日志
- [x] T023 [US3] 运行 US3 测试，验证手动学习流程

**Checkpoint**: `/learn` 命令可立即触发学习，展示生成结果

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完善和优化

- [x] T024 [P] 更新 CLAUDE.md 文档，添加新功能说明
- [x] T025 [P] 更新 README.md，添加功能文档生成说明
- [x] T026 运行 quickstart.md 验证场景
- [x] T027 [P] 添加降级场景测试（Claude CLI 不可用）
- [x] T028 代码审查和清理

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，可立即开始
- **Foundational - US4 (Phase 2)**: 依赖 Setup - **阻塞所有后续用户故事**
- **US1 (Phase 3)**: 依赖 US4 完成
- **US2 (Phase 4)**: 依赖 US4 完成（可与 US1 并行）
- **US3 (Phase 5)**: 依赖 US1 和 US2 完成（需要完整的输出类型支持）
- **Polish (Phase 6)**: 依赖所有用户故事完成

### User Story Dependencies

- **US4 (Claude CLI)**: 基础设施，无用户故事依赖
- **US1 (Skill 生成)**: 依赖 US4
- **US2 (功能文档生成)**: 依赖 US4，可与 US1 并行
- **US3 (手动学习)**: 依赖 US1 和 US2（需要完整的输出类型判断）

### Within Each User Story

- 测试先行（TDD）
- 核心模块实现
- 集成到工作流程
- 运行测试验证

### Parallel Opportunities

- Phase 1: T001, T002 可并行
- Phase 2: T003 可与其他测试任务并行
- Phase 3-4: US1 和 US2 可在完成 Phase 2 后并行开发
- Phase 3: T008, T009 可并行
- Phase 4: T014, T015 可并行
- Phase 6: T024, T025, T027 可并行

---

## Parallel Example: Phase 3 (US1)

```bash
# 并行启动 US1 测试：
Task: "创建输出类型分类器测试 tests/unit/output-type-classifier.test.js"
Task: "创建 Skill 生成集成测试 tests/integration/skill-generation.test.js"

# 并行启动 US1 和 US2 实现（在 Phase 2 完成后）：
Task: "[US1] 创建输出类型分类器 lib/output-type-classifier.js"
Task: "[US2] 创建功能文档生成器 lib/feature-doc-generator.js"
```

---

## Implementation Strategy

### MVP First (US4 + US1)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: US4 (Claude CLI) - **关键路径**
3. 完成 Phase 3: US1 (Skill 生成)
4. **验证**: 测试 Skill 生成独立工作
5. 可部署/演示

### Incremental Delivery

1. Setup + US4 → Claude CLI 集成完成
2. + US1 → Skill 自动生成（MVP!）
3. + US2 → 功能文档自动生成
4. + US3 → 手动学习触发
5. 每个增量独立可用

---

## Notes

- [P] 任务 = 不同文件，无依赖
- [Story] 标签映射到具体用户故事
- 每个用户故事应独立可完成和测试
- 验证测试在实现前失败
- 每个任务或逻辑组完成后提交
- 任意检查点可停止验证故事独立性
- 避免：模糊任务、同文件冲突、跨故事依赖
