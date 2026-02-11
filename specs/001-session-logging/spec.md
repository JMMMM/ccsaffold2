# Feature Specification: 会话内容记录功能

**Feature Branch**: `001-session-logging`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "创建一个会话内容记录的功能，通过hooks监听用户提示提交和工具使用事件，记录到文件中并控制内容条数"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 自动记录用户提示 (Priority: P1)

当用户在Claude Code会话中提交提示时，系统自动将该提示内容记录到会话日志文件中，以"user>"前缀标识。

**Why this priority**: 这是核心功能，记录用户的输入是会话日志的基础，确保用户意图被完整保存。

**Independent Test**: 可以通过在Claude Code中提交任意提示，然后检查日志文件中是否出现对应的"user>"前缀记录来独立验证。

**Acceptance Scenarios**:

1. **Given** 日志文件不存在或为空, **When** 用户提交一条提示, **Then** 系统创建日志文件并追加一行以"user>"开头的记录
2. **Given** 日志文件已存在, **When** 用户提交一条提示, **Then** 系统在文件末尾追加新的一行"user>"记录

---

### User Story 2 - 自动记录AI工具使用 (Priority: P1)

当Claude AI使用工具（排除查询类工具）后，系统自动记录该工具使用事件，以"claude>"前缀标识。

**Why this priority**: 与用户提示记录同等重要，共同构成完整的会话上下文。

**Independent Test**: 可以通过触发Claude使用非查询类工具（如Edit、Write、Bash），然后检查日志文件中是否出现对应的"claude>"前缀记录来独立验证。

**Acceptance Scenarios**:

1. **Given** Claude使用了Edit工具, **When** 工具执行完成, **Then** 系统在日志文件中追加一行"claude>"记录，包含工具名称和简要信息
2. **Given** Claude使用了Grep或Search工具, **When** 工具执行完成, **Then** 系统不记录该事件（查询类工具排除）
3. **Given** Claude使用了Bash工具, **When** 工具执行完成, **Then** 系统在日志文件中追加一行"claude>"记录

---

### User Story 3 - 内容滚动更新 (Priority: P2)

当日志文件中的user行数超过100行限制时，系统自动删除最早约1/3的内容，保持日志在可控范围内。

**Why this priority**: 保证日志不会无限增长，确保系统长期稳定运行。

**Independent Test**: 可以通过手动创建包含超过100行"user>"记录的日志文件，触发一次记录操作后验证最早的记录是否被删除。

**Acceptance Scenarios**:

1. **Given** 日志文件包含105行"user>"记录, **When** 触发新的记录操作, **Then** 系统删除最早的约35行记录，保留约70行
2. **Given** 日志文件刚好100行"user>"记录, **When** 触发新的记录操作, **Then** 系统删除最早的约33行记录后追加新记录

---

### User Story 4 - 跨平台兼容 (Priority: P2)

系统在Windows、macOS、Linux三个平台上均能正常工作，使用统一的相对路径存储日志文件。

**Why this priority**: 确保不同开发环境的用户都能使用此功能。

**Independent Test**: 在三个不同平台上分别安装配置hooks，验证日志功能是否正常运行。

**Acceptance Scenarios**:

1. **Given** 在Windows系统上配置hooks, **When** 用户提交提示或触发工具使用, **Then** 日志正常记录到.claude/conversations/conversation.txt
2. **Given** 在macOS系统上配置hooks, **When** 用户提交提示或触发工具使用, **Then** 日志正常记录到.claude/conversations/conversation.txt
3. **Given** 在Linux系统上配置hooks, **When** 用户提交提示或触发工具使用, **Then** 日志正常记录到.claude/conversations/conversation.txt

---

### Edge Cases

- 日志文件所在目录不存在时，系统是否会自动创建目录？
- 日志文件被其他进程占用时，系统如何处理？
- 记录内容包含特殊字符（如换行符、引号）时，如何保证记录的完整性？
- 用户行数计算是否区分大小写（User> vs user>）？
- PostToolUse事件中工具名称为空或异常时如何处理？

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须通过Claude Code hooks配置监听UserPromptSubmit事件
- **FR-002**: 系统必须通过Claude Code hooks配置监听PostToolUse事件
- **FR-003**: UserPromptSubmit事件触发时，系统必须以"user>"前缀记录用户提示内容
- **FR-004**: PostToolUse事件触发时，系统必须以"claude>"前缀记录工具使用信息
- **FR-005**: 系统必须排除Grep、Search等查询类工具的记录，避免日志过度膨胀
- **FR-006**: 日志文件必须存储在相对路径.claude/conversations/conversation.txt
- **FR-007**: 系统必须限制日志文件中"user>"前缀的行数不超过100行
- **FR-008**: 当user行数超过限制时，系统必须删除最早的约1/3内容进行滚动更新
- **FR-009**: 系统必须通过Node.js脚本实现，保证高性能执行
- **FR-010**: 系统必须在Windows、macOS、Linux三个平台上正常工作

### Key Entities

- **会话日志文件**: 存储会话内容的文本文件，包含用户提示和AI工具使用记录
- **日志记录条目**: 单行文本记录，以"user>"或"claude>"前缀标识来源，后接具体内容
- **Hook配置**: Claude Code的JSON配置，定义事件触发器和对应的处理脚本
- **排除工具列表**: 不记录的工具名称集合，初始包含Grep、Search等查询工具

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户提交提示后，日志文件在1秒内完成记录追加
- **SC-002**: Claude使用工具后，日志文件在1秒内完成记录追加
- **SC-003**: 滚动更新操作在500毫秒内完成，不阻塞后续记录
- **SC-004**: 日志文件user行数始终保持在100行以内
- **SC-005**: 系统在三个主要操作系统平台上功能一致，无平台特定错误
- **SC-006**: 长时间运行（1000次以上记录操作）后系统仍正常工作，无内存泄漏

## Assumptions

- 用户已安装Node.js运行环境
- 用户有权在项目目录下创建.claude目录和文件
- Claude Code hooks功能已正确启用
- 日志文件不会被用户手动大量修改
- 单次记录内容长度合理（不超过10KB）
- 不需要并发写入的锁机制（Claude Code串行处理事件）

## Out of Scope

- 日志文件的加密和权限控制
- 日志内容的搜索和查询功能
- 日志文件的备份和恢复
- 多会话隔离（同一项目共享一个日志文件）
- 日志导出功能
