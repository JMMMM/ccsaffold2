# Feature Specification: 持续学习功能升级

**Feature Branch**: `002-continuous-learning-upgrade`
**Created**: 2026-02-13
**Status**: Draft
**Input**: 持续学习功能升级 - 输出类型扩展和 Claude CLI 集成

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 自动学习生成 Skill（顽固 Bug 修复）(Priority: P1)

用户在会话中反复调试某个顽固的 bug，经过多次尝试后最终找到解决方案。会话结束时，系统自动分析对话内容，识别出这是一个反复沟通才解决的问题，自动生成一个 Skill，触发词是 bug 的现象描述。

**Why this priority**: 这是持续学习最核心的价值场景 - 捕获解决顽固问题的经验，避免重复踩坑。

**Independent Test**: 可以通过模拟一个包含多次调试尝试的会话，验证系统是否正确生成 Skill。

**Acceptance Scenarios**:

1. **Given** 会话中包含针对同一问题的多次调试尝试（至少 3 次失败后成功），**When** 会话结束触发自动学习，**Then** 系统识别为"顽固 bug"场景并生成 Skill
2. **Given** 生成的 Skill，**When** 用户后续遇到类似 bug 现象，**Then** Skill 的触发词能够匹配到该 bug 现象
3. **Given** 已存在相似 Skill，**When** 新生成 Skill 时，**Then** 系统进行去重或合并处理

---

### User Story 2 - 自动学习生成功能文档 (Priority: P1)

用户在会话中进行功能开发、修改、性能调优或核心实现变更。会话结束时，系统自动分析对话内容，识别出这是功能相关的工作，为该功能维护一份独立的文档，供后续迭代参考。

**Why this priority**: 功能文档是项目知识库的重要组成部分，帮助团队理解功能演进历史和设计决策。

**Independent Test**: 可以通过模拟一个功能开发的会话，验证系统是否正确生成功能文档。

**Acceptance Scenarios**:

1. **Given** 会话内容涉及新功能开发，**When** 会话结束触发自动学习，**Then** 系统生成功能文档，包含功能名称、核心设计、关键实现点
2. **Given** 会话内容涉及现有功能修改或性能调优，**When** 会话结束触发自动学习，**Then** 系统更新或创建功能文档
3. **Given** 已存在同名功能文档，**When** 再次学习时，**Then** 系统将新内容合并到现有文档中

---

### User Story 3 - 手动学习触发 (Priority: P2)

用户在任意时刻可以手动触发学习功能（通过 `/learn` 命令或关键词），系统立即分析当前会话内容，生成相应的 Skill 或功能文档。

**Why this priority**: 手动学习给用户更多控制权，可以在关键时刻主动保存知识。

**Independent Test**: 可以在会话中输入 `/learn` 命令，验证系统是否正确响应并生成输出。

**Acceptance Scenarios**:

1. **Given** 用户在会话中，**When** 输入 `/learn` 或 `手动学习` 等触发词，**Then** 系统立即分析当前会话内容
2. **Given** 手动学习触发，**When** 分析完成，**Then** 系统展示学习结果（生成了 Skill 还是功能文档）

---

### User Story 4 - Claude CLI 大模型调用 (Priority: P1)

系统不再使用直接 HTTP 请求调用大模型 API，而是通过 Claude CLI 工具触发大模型调用。这样可以利用 Claude CLI 的原生能力，无需维护 API 密钥和 HTTP 请求逻辑。

**Why this priority**: 这是技术架构的核心改造，影响所有学习功能的可靠性。

**Independent Test**: 可以通过调用学习功能，验证是否正确使用 Claude CLI 进行大模型调用。

**Acceptance Scenarios**:

1. **Given** 学习功能触发，**When** 需要大模型分析时，**Then** 系统通过 `claude -p "prompt"` 方式调用 Claude CLI
2. **Given** Claude CLI 调用，**When** 需要结构化输出，**Then** 系统使用 `--output-format json` 或 `--json-schema` 参数
3. **Given** 学习结果需要创建文件，**When** Claude CLI 执行时，**Then** 系统确保有适当的文件操作权限

---

### Edge Cases

- **空会话或对话过少**：当会话内容不足（少于 3 条用户输入）时，系统应跳过学习，记录日志
- **Claude CLI 不可用**：当 Claude CLI 未安装或不可用时，系统应优雅降级，记录错误日志，不阻塞主流程
- **输出类型难以判断**：当对话内容同时包含 bug 修复和功能开发时，系统应优先选择信息量更大的输出类型，或同时生成两种输出
- **权限不足**：当 Claude CLI 创建文件权限不足时，系统应记录错误并提供用户指引
- **重复内容检测**：当学习内容与现有 Skill/文档高度相似时，系统应合并而非重复创建

## Requirements *(mandatory)*

### Functional Requirements

#### 输出类型扩展

- **FR-001**: 系统必须能够分析会话内容，判断应生成 Skill 还是功能文档
- **FR-002**: 当会话内容显示"同一问题反复沟通后最终修复"的特征时，系统必须生成 Skill
- **FR-003**: Skill 的触发词必须基于 bug 现象描述，便于后续匹配
- **FR-004**: 当会话内容涉及功能开发、修改、性能调优、核心实现变更时，系统必须生成功能文档
- **FR-005**: 功能文档必须包含功能名称、核心设计、关键实现点、变更历史等结构化信息
- **FR-006**: 系统必须支持对现有 Skill/文档进行去重和合并

#### Claude CLI 集成

- **FR-007**: 系统必须使用 Claude CLI（`claude -p "prompt"`）进行大模型调用，而非直接 HTTP 请求
- **FR-008**: 系统必须支持 `--output-format json` 参数获取结构化输出
- **FR-009**: 系统必须能够将对话内容通过 stdin 管道传递给 Claude CLI（`cat content | claude -p "prompt"`）
- **FR-010**: 系统必须在 Claude CLI 不可用时优雅降级，记录错误日志
- **FR-011**: 系统必须通过 Claude CLI 的工具调用能力创建文件，或返回创建指令供主进程执行

#### 自动学习

- **FR-012**: 系统必须在 SessionEnd 事件时异步触发自动学习
- **FR-013**: 系统必须检查最小对话数量（至少 3 条用户输入）才触发学习
- **FR-014**: 学习过程必须在独立子进程中执行，不阻塞主会话

#### 手动学习

- **FR-015**: 系统必须支持通过 `/learn`、`手动学习`、`生成skill` 等关键词触发手动学习
- **FR-016**: 手动学习必须立即执行，分析当前会话内容

### Key Entities

- **LearningOutput（学习输出）**: 学习功能的输出结果，可以是 Skill 或功能文档
  - 类型：skill / feature-doc
  - 名称：唯一标识符
  - 内容：结构化的知识内容
  - 创建时间：记录生成时间
  - 来源会话：关联的会话 ID

- **Skill（技能）**: 用于捕获顽固 bug 修复经验的可复用知识
  - 触发词：用于匹配 bug 现象
  - 问题描述：bug 的具体表现
  - 解决方案：修复步骤
  - 存储位置：`.claude/skills/{name}/SKILL.md`

- **FeatureDoc（功能文档）**: 记录功能设计、实现和演进的知识
  - 功能名称：唯一标识
  - 核心设计：架构和设计决策
  - 关键实现点：重要代码片段和逻辑
  - 变更历史：修改记录
  - 存储位置：`.claude/doc/features/{name}.md`

- **LearningSession（学习会话）**: 单次学习的执行上下文
  - 会话 ID：关联的 Claude Code 会话
  - 对话内容：分析原始数据
  - 学习结果：生成的输出列表
  - 执行日志：学习过程记录

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 自动学习在会话结束后 30 秒内完成分析和输出生成
- **SC-002**: 输出类型判断准确率达到 85% 以上（通过人工审核验证）
- **SC-003**: Claude CLI 调用成功率在正常环境下达到 99%
- **SC-004**: 生成的 Skill 在后续相似问题中被成功匹配并应用
- **SC-005**: 功能文档能够有效支撑后续功能迭代，减少 50% 的重复沟通
- **SC-006**: 系统在 Claude CLI 不可用时能够优雅降级，不丢失会话数据

## Assumptions

- 用户已安装 Claude CLI 并配置好环境
- 学习输出（Skill 和功能文档）的存储目录结构与现有系统兼容
- Claude CLI 的 `--output-format json` 参数能够提供可靠的结构化输出
- 学习日志格式与现有系统保持一致（JSON Lines 格式）
- 功能文档使用 Markdown 格式存储，便于版本控制和阅读

## Dependencies

- Claude CLI 工具（版本支持 `--output-format json` 和 `--json-schema` 参数）
- 现有的会话日志系统（`.claude/conversations/` 目录）
- 现有的敏感信息过滤器（`lib/sensitive-filter.js`）
- 现有的学习日志系统（`.claude/logs/continuous-learning/` 目录）
