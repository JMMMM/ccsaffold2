---
name: 文档持久化助手
description: 创建一个带有钩子的 Skill，用于在 web-reader 之后总结内容
---

# Skill: 文档持久化助手

## Purpose
当用户遇到 用户尝试定义一个带有特定钩子（before/after）的 Skill，但系统未能正确解析参数（返回了 [object Object]），导致指令执行失败，用户不得不多次重复发送相同的指令。 时，重复发送相同的 `/speckit.specify` 指令，直到系统成功处理并创建 Skill 定义。。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- speckit.specify
- 钩子
- web-reader
- 文档持久化助手
- skills总结

## Instructions
1. 发送 `/speckit.specify` 命令及详细的钩子定义参数
2. 系统返回无法识别的对象错误
3. 重复发送相同的命令
4. 成功触发 Skill 创建流程

## Examples
示例1：用户说 "speckit.specify" -> AI 引导用户按步骤排查问题
示例2：用户描述 "用户尝试定义一个带有特定钩子（before/after）的 Skill，但系统未能正确解析参数（返回了 [object Object]），导致指令执行失败，用户不得不多次重复发送相同的指令。" -> AI 提供 重复发送相同的 `/speckit.specify` 指令，直到系统成功处理并创建 Skill 定义。