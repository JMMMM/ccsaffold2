---
name: speckit session_log 钩子重构
description: 在 speckit 的钩子节点中添加 session_log，使其仅输出钩子内容
---

# Skill: speckit session_log 钩子重构

## Purpose
当用户遇到 用户希望在 speckit 的每个钩子节点都添加 session_log，并要求该日志单纯输出钩子内容，需要对该功能进行重构和实现 时，修改 session_log 的逻辑，使其能够捕获并仅记录钩子节点的执行内容。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- session_log
- 钩子节点
- speckit
- 重构

## Instructions
1. 分析钩子节点需求
2. 重构 session_log 逻辑以输出钩子内容
3. 在 speckit 工作流中实施

## Examples
示例1：用户说 "session_log" -> AI 引导用户按步骤排查问题
示例2：用户描述 "用户希望在 speckit 的每个钩子节点都添加 session_log，并要求该日志单纯输出钩子内容，需要对该功能进行重构和实现" -> AI 提供 修改 session_log 的逻辑，使其能够捕获并仅记录钩子节点的执行内容