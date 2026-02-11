# Research: 会话内容记录功能

**Feature**: 001-session-logging
**Date**: 2026-02-11
**Status**: Complete

## 1. Claude Code Hooks 机制研究

### Decision: 使用 UserPromptSubmit 和 PostToolUse 事件

**Rationale**:
- UserPromptSubmit 在用户提交提示时触发，输入数据包含用户提示内容
- PostToolUse 在工具执行完成后触发，输入数据包含工具名称和执行结果
- 两个事件覆盖了会话的主要交互节点

**Alternatives Considered**:
- PreToolUse: 在工具执行前触发，无法获取执行结果，不适合记录
- SessionStart/SessionEnd: 会话级别事件，无法捕获每次交互细节

### Hook 输入数据结构

**UserPromptSubmit 事件输入**:
```json
{
  "prompt": "用户输入的提示内容",
  "session_id": "会话ID"
}
```

**PostToolUse 事件输入**:
```json
{
  "tool": "工具名称，如 Edit, Write, Bash",
  "tool_input": { "工具输入参数" },
  "tool_result": "工具执行结果",
  "session_id": "会话ID"
}
```

### Hook 配置格式

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PROJECT_ROOT}/src/hooks/log-user-prompt.js"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "!(Grep|Glob|WebSearch|WebFetch)",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PROJECT_ROOT}/src/hooks/log-tool-use.js"
        }]
      }
    ]
  }
}
```

**Decision**: 使用 matcher 排除查询类工具，而非在代码中过滤

**Rationale**:
- 在配置层面过滤更高效，减少不必要的脚本调用
- matcher 语法支持否定模式 `!(tool1|tool2)`

## 2. 文件操作策略研究

### Decision: 追加写 + 滚动更新

**Rationale**:
- 追加写性能最优，无需读取整个文件
- 滚动更新时才需要读取和处理文件内容
- 符合"高性能"要求

**Alternatives Considered**:
- 每次写入都读取并处理: 性能差
- 使用数据库: 过度工程化，增加依赖

### 滚动更新算法

```
1. 追加新记录后
2. 检查 user> 行数
3. 如果 > 100 行:
   a. 读取所有行
   b. 计算需要删除的行数 = Math.floor(userLineCount / 3)
   c. 从开头删除对应数量的"条目"（每条目可能多行）
   d. 重写文件
```

**Decision**: 按"条目"删除而非按"行"删除

**Rationale**:
- 一条记录可能包含多行内容
- 按条目删除保持日志完整性
- 需要识别条目边界（user> 或 claude> 开头的行）

## 3. 跨平台路径处理

### Decision: 使用 Node.js path 模块

**Rationale**:
- path.join() 自动处理不同操作系统的路径分隔符
- path.resolve() 获取绝对路径
- 无需手动处理 Windows 的反斜杠

**Alternatives Considered**:
- 硬编码路径分隔符: 不跨平台
- 使用第三方库: 增加不必要依赖

### 日志文件路径

```javascript
const path = require('path');
const logDir = path.join(process.cwd(), '.claude', 'conversations');
const logFile = path.join(logDir, 'conversation.txt');
```

## 4. 性能优化策略

### Decision: 最小化 I/O 操作

**Rationale**:
- 文件 I/O 是主要性能瓶颈
- 追加写只需一次系统调用
- 滚动更新时批量读写

**优化措施**:
1. 追加写使用 `fs.appendFileSync` 或 `fs.createWriteStream` with flags: 'a'
2. 滚动更新时使用流式读取，避免大文件内存问题
3. 目录不存在时同步创建

## 5. 测试策略

### Decision: 单元测试 + 集成测试

**单元测试覆盖**:
- logger.js: 日志格式化、行数统计、滚动更新逻辑
- file-utils.js: 文件读写、目录创建

**集成测试覆盖**:
- hooks脚本执行: 模拟stdin输入，验证文件输出

**测试工具**:
- Node.js 内置 assert 模块
- 无需 Jest 等框架，保持零依赖

## 6. 排除工具列表

### Decision: 排除以下工具类型

| 工具名称 | 排除原因 |
|----------|----------|
| Grep | 查询工具，使用频繁，产生大量日志 |
| Glob | 文件搜索工具，同上 |
| WebSearch | 网络搜索，产生大量内容 |
| WebFetch | 网络获取，内容冗长 |
| Read | 文件读取，操作频繁 |

**Rationale**: 这些工具在正常开发流程中调用频繁，记录它们会导致日志快速膨胀，且价值较低。

## Summary

所有技术问题已解决，可以进入 Phase 1 设计阶段：
1. Hook 输入数据结构明确
2. 文件操作策略确定
3. 跨平台方案确认
4. 性能优化方向明确
5. 测试策略制定
6. 工具排除列表确定
