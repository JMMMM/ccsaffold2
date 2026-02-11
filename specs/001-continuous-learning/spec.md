# Feature Specification: 持续学习 (Continuous Learning)

**Feature Branch**: `001-continuous-learning`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "创建一个总结会话内容生成skills的功能，该功能分成两个部分，一个是手动触发学习，一个是自动学习"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 自动学习 (Priority: P1)

作为一个 Claude Code 用户，当我的会话结束时，系统自动分析会话内容，识别出"用户多次反复沟通后才最终修复的问题"，并将这些经验总结为可复用的 skill，保存到项目的 .skills/learn 目录下。这样我可以在未来的会话中避免重复遇到相同的问题。

**Why this priority**: 自动学习是核心价值，它让用户无需额外操作就能积累经验，是最小可行产品(MVP)的核心功能。

**Independent Test**: 可以通过模拟一个 sessionEnd 事件，提供一个包含多次迭代修复问题的 transcript 文件，验证是否正确生成了 skill 文件。

**Acceptance Scenarios**:

1. **Given** 会话结束时 sessionEnd hook 被触发，**When** transcript 文件包含一个"用户尝试3次后才解决的配置问题"，**Then** 系统生成一个 skill 文件，描述该问题及解决方案
2. **Given** 会话结束时，**When** transcript 文件中没有任何需要多次沟通才能解决的问题，**Then** 系统不生成任何 skill 文件
3. **Given** 会话结束时，**When** transcript 文件包含多个可学习的场景，**Then** 系统将相关场景合并为一个或多个 skill 文件
4. **Given** Windows/macOS/Linux 任一平台，**When** 自动学习执行，**Then** skill 文件正确保存到项目根目录的 .skills/learn 目录

---

### User Story 2 - 手动学习 (Priority: P2)

作为一个 Claude Code 用户，我可以手动触发学习功能，让系统分析当前会话或指定的历史会话内容，生成 skill。这在自动学习可能遗漏重要经验时特别有用。

**Why this priority**: 手动学习作为自动学习的补充，让用户有更精细的控制，但不是 MVP 必需的功能。

**Independent Test**: 可以通过执行一个手动学习命令，指定一个会话记录，验证是否正确生成 skill 文件。

**Acceptance Scenarios**:

1. **Given** 用户触发手动学习命令，**When** 指定一个历史会话 transcript，**Then** 系统分析该会话并生成相应的 skill 文件
2. **Given** 用户触发手动学习命令，**When** 不指定具体会话，**Then** 系统分析当前会话内容并生成 skill 文件
3. **Given** 用户触发手动学习命令，**When** 提供自定义的学习重点或关键词，**Then** 系统根据用户指定的方向生成更聚焦的 skill 文件

---

### User Story 3 - Skill 去重与更新 (Priority: P3)

作为一个已有多个 skill 的用户，当新学习到的内容与现有 skill 相关时，系统会智能地更新现有 skill 而不是创建重复的内容。

**Why this priority**: 提升长期使用体验，避免 skill 目录膨胀，但可以在后期迭代中实现。

**Independent Test**: 可以通过模拟两次学习相似的会话内容，验证是否正确更新了现有 skill 而非创建重复文件。

**Acceptance Scenarios**:

1. **Given** 已存在一个关于"API调试"的 skill，**When** 新的学习内容也涉及"API调试"，**Then** 系统更新现有 skill 而非创建新文件
2. **Given** 已存在的 skill 与新学习内容部分重叠，**When** 系统分析相似度，**Then** 系统智能合并内容，保留完整信息

---

### Edge Cases

- 当 transcript 文件非常大时，系统如何处理？
  - 系统应分段处理大文件，提取关键信息而非一次性加载全部内容
- 当 .skills/learn 目录不存在时如何处理？
  - 系统应自动创建目录结构
- 当 LLM 调用失败或超时时如何处理？
  - 系统应记录错误日志，不阻塞会话结束流程，静默失败
- 当生成的 skill 文件名与现有文件冲突时如何处理？
  - 检查内容相似度，若相似则更新现有文件，否则生成新的唯一命名
- 当会话内容涉及敏感信息（密码、密钥等）时如何处理？
  - 系统应在生成 skill 时自动过滤敏感信息

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 在 sessionEnd 事件触发时自动执行学习脚本
- **FR-002**: 学习脚本 MUST 从 sessionEnd 事件的 transcript_path 获取会话记录
- **FR-003**: 系统 MUST 调用大模型分析会话内容，识别"用户多次反复沟通后才最终修复的问题"
- **FR-004**: 系统 MUST 将学习内容按照指定的 skill 模板格式生成文件
- **FR-005**: 系统 MUST 将 skill 文件保存到项目根目录（cwd）下的 .skills/learn 目录
- **FR-006**: skill 文件命名 MUST 与内容主题相关，便于识别
- **FR-007**: 系统 MUST 支持 Windows、macOS、Linux 三个平台
- **FR-008**: 系统 MUST 提供手动触发学习的方式
- **FR-009**: 系统 MUST 在无法找到可学习内容时不生成 skill 文件
- **FR-010**: 系统 MUST 处理敏感信息过滤，避免在 skill 中泄露密码、密钥等

### Skill 模板要求

生成的 skill 文件必须遵循以下格式：

```
---
name: [skill名称]
description: [技能描述]
---

# Skill: [skill名称]

## Purpose
[技能的主要用途]

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- [关键词1]
- [关键词2]

## Instructions
1. [首先执行的操作]
2. [接下来的步骤]
3. [最后完成的任务]

## Examples
示例1：[用户输入] -> [AI的响应]
示例2：[用户输入] -> [AI的响应]
```

### Key Entities

- **Transcript**: 会话记录文件，包含用户与 AI 的完整对话历史
- **Skill**: 学习产物，包含问题描述、解决方案、触发条件等结构化信息
- **LearningSession**: 学习会话，记录每次学习执行的元数据（可选）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 自动学习在会话结束后 30 秒内完成 skill 文件生成（或确定无需生成）
- **SC-002**: 生成的 skill 文件在三个平台（Windows/macOS/Linux）上路径解析正确率 100%
- **SC-003**: skill 文件内容符合指定模板格式，格式验证通过率 100%
- **SC-004**: 当 transcript 包含可学习内容时，skill 生成成功率 ≥ 90%
- **SC-005**: 用户在后续会话中遇到相似问题时，相关 skill 被正确识别和应用的比率 ≥ 80%

## Assumptions

- 用户使用的 Claude Code 版本支持 sessionEnd hook
- 项目根目录有写入权限
- 系统可以访问外部 LLM API 进行内容分析
- transcript 文件格式为标准 JSON 或文本格式，可被解析
- .skills 目录结构由本功能自动创建，不依赖外部初始化

## Dependencies

- Claude Code hooks 系统（sessionEnd 事件）
- 外部 LLM API 访问能力
- Node.js 运行环境（与项目现有技术栈一致）
