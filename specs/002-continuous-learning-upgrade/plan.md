# Implementation Plan: 持续学习功能升级

**Branch**: `002-continuous-learning-upgrade` | **Date**: 2026-02-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-continuous-learning-upgrade/spec.md`

## Summary

升级持续学习功能，实现两个核心改进：
1. **输出类型扩展**：根据会话内容智能判断生成 Skill（顽固 bug 修复）或功能文档（功能开发/修改）
2. **Claude CLI 集成**：使用 `claude -p` 打印模式替代直接 HTTP API 调用，简化认证和依赖管理

## 大模型触发位置

```
完整调用链路:

SessionEnd Hook (会话结束事件)
    │
    ▼
hooks/auto-learning.js
    │  异步启动子进程
    │
    ▼
hooks/auto-learning-worker.js
    │  L177: const results = await llmAnalyzer.analyze(filteredText);
    │
    ▼
lib/llm-analyzer.js
    │  L147: const results = await claudeCli.analyze(transcriptContent, {...});
    │
    ▼
lib/claude-cli-client.js  ← 【大模型实际调用位置】
    │  L183: const proc = spawn('claude', args, { timeout });
    │  L169: async function analyze(content, options = {})
    │
    ▼
Claude CLI 子进程执行
    └─→ claude -p "prompt" --output-format json --max-turns 1
```

**核心调用代码** (`lib/claude-cli-client.js:169-215`):

```javascript
async function analyze(content, options = {}) {
  // ...
  const args = [
    '-p', prompt,
    '--output-format', 'json',
    '--max-turns', '1'
  ];

  const proc = spawn('claude', args, { timeout: 30000 });
  // ...
}
```

## Technical Context

**Language/Version**: Node.js 18+ LTS（与现有系统一致）
**Primary Dependencies**: Node.js 内置模块（child_process, fs, path, readline），Claude CLI
**Storage**: 文件系统（.claude/skills/, .claude/doc/features/, .claude/logs/）
**Testing**: Node.js 原生测试或 Jest
**Target Platform**: 跨平台（Windows, Linux, macOS）
**Project Type**: 单一项目（Claude Code 插件）
**Performance Goals**: 学习分析在 30 秒内完成
**Constraints**: Claude CLI 必须可用，否则优雅降级
**Scale/Scope**: 单用户 CLI 工具

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. 功能独立可复用 | PASS | 学习功能独立，可选择性启用 |
| II. TDD 开发模式 | PASS | 将为新增模块编写测试 |
| III. 代码可读性优先 | PASS | 保持简单直接的实现 |
| IV. 跨平台兼容性 | PASS | 使用 Node.js child_process 跨平台调用 |
| V. 信息安全合规 | PASS | 不存储敏感信息 |
| VI. 插件化功能存储 | PASS | 功能在插件根目录开发 |
| VII. 日志规范 | PASS | 使用纯 ASCII 日志，无 emoji |

**Gate Status**: PASS - 所有原则符合

## Project Structure

### Documentation (this feature)

```text
specs/002-continuous-learning-upgrade/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
ccsaffold2/
├── hooks/
│   ├── auto-learning.js           # 现有：异步学习触发器
│   ├── auto-learning-worker.js    # 需改造：调用新模块
│   └── session-logger.js          # 现有：会话日志记录
├── lib/
│   ├── llm-analyzer.js            # 需改造：改用 Claude CLI
│   ├── claude-cli-client.js       # 新增：Claude CLI 客户端
│   ├── output-type-classifier.js  # 新增：输出类型判断
│   ├── feature-doc-generator.js   # 新增：功能文档生成器
│   ├── skill-generator.js         # 现有：Skill 生成器（可扩展）
│   ├── conversation-reader.js     # 现有：会话读取器
│   ├── sensitive-filter.js        # 现有：敏感信息过滤器
│   └── learning-logger.js         # 现有：学习日志记录器
├── skills/
│   └── manual-learn/
│       └── SKILL.md               # 需更新：支持多输出类型
└── scripts/
    └── sync-to-local.js           # 现有：同步到 .claude 目录
```

**Structure Decision**: 在现有插件目录结构上扩展，新增 3 个核心模块，改造 2 个现有模块。

## Implementation Phases

### Phase 1: Claude CLI 集成（核心改造）

**目标**: 替换 HTTP API 调用为 Claude CLI 调用

**任务**:
1. 创建 `lib/claude-cli-client.js`
   - 封装 Claude CLI 调用逻辑
   - 支持 stdin 管道输入
   - 支持 `--output-format json` 结构化输出
   - 错误处理和优雅降级

2. 改造 `lib/llm-analyzer.js`
   - 移除直接 HTTP 请求逻辑
   - 调用 Claude CLI 客户端
   - 保持现有接口兼容

3. 更新 `hooks/auto-learning-worker.js`
   - 集成新的 LLM 分析器
   - 添加 Claude CLI 可用性检查

### Phase 2: 输出类型扩展

**目标**: 支持多输出类型（Skill + 功能文档）

**任务**:
1. 创建 `lib/output-type-classifier.js`
   - 分析会话内容特征
   - 调用 Claude CLI 判断输出类型
   - 返回分类结果和置信度

2. 创建 `lib/feature-doc-generator.js`
   - 功能文档内容生成
   - 文档格式化和写入
   - 现有文档合并/更新逻辑

3. 扩展 `lib/skill-generator.js`
   - 添加顽固 bug 特征识别
   - 优化触发词生成

4. 更新 `skills/manual-learn/SKILL.md`
   - 支持多输出类型说明

### Phase 3: 测试和文档

**目标**: 确保质量和可维护性

**任务**:
1. 编写单元测试
   - Claude CLI 客户端测试
   - 输出类型分类器测试
   - 功能文档生成器测试

2. 更新文档
   - README 更新
   - CLAUDE.md 更新

3. 集成测试
   - 端到端学习流程测试
   - 降级场景测试

## Complexity Tracking

> 无宪章违规，无需记录

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Dependencies

### External Dependencies
- **Claude CLI**: 版本支持 `--output-format json`

### Internal Dependencies
- 现有会话日志系统
- 现有敏感信息过滤器
- 现有学习日志系统

## Risk Mitigation

| 风险 | 缓解措施 |
|------|----------|
| Claude CLI 不可用 | 优雅降级，记录错误日志 |
| JSON 解析失败 | 多种解析策略，保留原始响应 |
| 输出类型判断错误 | 手动学习作为补充 |
| 跨平台兼容问题 | 使用 child_process 跨平台调用 |

## Success Metrics

- [ ] Claude CLI 调用成功率 > 99%
- [ ] 输出类型判断准确率 > 85%
- [ ] 学习分析完成时间 < 30 秒
- [ ] 所有测试通过
