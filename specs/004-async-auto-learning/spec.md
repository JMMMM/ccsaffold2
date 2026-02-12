# Feature Specification: 异步自动学习优化

**Feature Branch**: `004-async-auto-learning`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "目前自动学习会影响claude关闭速度，我希望进行改进，首先将自动学习触发改成异步，并输出log，log位置为.claude/logs/continuous-learning/learning-{session_id}.log

日志显示整个大模式调用过程，包括文件读取，入参返回等，详细记录过程； 这样sessionEnd时触发异步，不阻塞主流程"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 会话快速关闭 (Priority: P1)

用户结束 Claude Code 会话时，不希望因为自动学习功能而等待。会话应该能够立即关闭，自动学习任务在后台异步执行。

**Why this priority**: 这是用户的核心痛点 - 自动学习阻塞会话关闭直接影响用户体验。

**Independent Test**: 启动 Claude Code 会话，进行一些对话后关闭会话，测量会话关闭时间是否在 1 秒内完成（不等待自动学习）。

**Acceptance Scenarios**:

1. **Given** 用户正在使用 Claude Code 会话, **When** 用户关闭会话, **Then** 会话在 1 秒内完成关闭，不等待自动学习完成
2. **Given** 自动学习正在后台运行, **When** 用户查看日志文件, **Then** 能够看到完整的执行日志记录

---

### User Story 2 - 详细日志记录 (Priority: P2)

开发者需要通过日志追踪自动学习的完整执行过程，包括文件读取、LLM 调用入参返回等，便于调试和监控。

**Why this priority**: 日志是诊断问题的重要手段，但对于核心功能来说不是第一优先级。

**Independent Test**: 触发一次会话结束，检查日志文件是否包含完整的执行过程记录。

**Acceptance Scenarios**:

1. **Given** 会话结束触发自动学习, **When** 查看日志文件, **Then** 日志包含每个步骤的入参和返回值
2. **Given** 自动学习执行过程中发生错误, **When** 查看日志文件, **Then** 错误信息和堆栈被完整记录
3. **Given** 自动学习调用 LLM API, **When** 查看日志文件, **Then** 日志记录了请求参数和响应内容

---

### User Story 3 - 学习结果可靠性 (Priority: P3)

即使采用异步方式，自动学习的核心功能（分析会话并生成 skill）必须保持与同步方式相同的可靠性。

**Why this priority**: 功能正确性是基础，但用户首先关心的是不阻塞关闭。

**Independent Test**: 对比同步和异步方式生成的 skill 文件，验证结果一致性。

**Acceptance Scenarios**:

1. **Given** 会话包含可学习的内容, **When** 异步自动学习完成, **Then** 生成的 skill 文件与同步方式一致
2. **Given** 多个会话同时结束, **When** 异步任务并行执行, **Then** 每个会话的学习任务独立完成，互不干扰

---

### Edge Cases

- 如果日志目录不存在会怎样？系统应自动创建目录
- 如果 LLM API 不可用会怎样？日志应记录跳过原因，不影响主流程
- 如果会话文件（transcript）读取失败会怎样？日志应记录错误详情
- 如果异步进程启动失败会怎样？应有 fallback 确保不抛出错误

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 在 SessionEnd hook 中立即返回，不等待自动学习完成
- **FR-002**: 系统 MUST 将自动学习任务作为独立的子进程异步执行
- **FR-003**: 系统 MUST 为每个会话创建独立的日志文件，路径格式为 `.claude/logs/continuous-learning/learning-{session_id}.log`
- **FR-004**: 日志 MUST 记录以下内容：
  - 文件读取操作（transcript 文件路径、读取结果摘要）
  - 敏感信息过滤前后的内容摘要
  - LLM API 调用的请求参数和响应内容
  - Skill 文件生成的路径和内容摘要
  - 所有步骤的执行时间戳
- **FR-005**: 系统 MUST 自动创建日志目录（如果不存在）
- **FR-006**: 异步进程 MUST 不影响 Claude Code 主进程的退出
- **FR-007**: 错误 MUST 被完整记录到日志文件，包括错误信息和堆栈跟踪

### Key Entities

- **学习日志**: 每个会话对应一个日志文件，记录完整的自动学习执行过程，包含时间戳、操作类型、入参、返回值、错误信息
- **异步任务**: 独立于主进程运行的子进程，执行自动学习逻辑，通过 session_id 标识

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 会话关闭时间不超过 1 秒（当前同步方式可能需要 10+ 秒）
- **SC-002**: 每个会话的学习日志文件包含完整的执行过程记录
- **SC-003**: 日志文件能够被人类阅读，包含清晰的时间戳和结构化信息
- **SC-004**: 异步执行失败时，日志文件能够提供足够的信息进行问题诊断
- **SC-005**: 自动学习生成的 skill 文件与原有同步方式保持一致

## Assumptions

- 假设使用 Node.js 的 `child_process.spawn` 实现异步执行
- 假设日志文件使用 JSON Lines 格式便于程序解析，同时也保持可读性
- 假设 session_id 是唯一的，可用于标识日志文件
