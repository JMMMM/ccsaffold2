---
name: Auto-Learning
description: 确保会话结束时自动学习功能的执行与路径配置
---

# Skill: Auto-Learning

## Purpose
当用户遇到 用户不确定在触发 sessionEnd 时 continuous-learn 是否被执行，无法感知 auto-learning 的运行状态。此外，发现 auto-learning 的保存路径配置错误，保存在了 .claude/.skills/learn/ 而非预期的 {cwd}/skill/learn/。 时，通过增加日志来感知执行状态，调整 LLM 超时时间，修改 auto-learning 的存储路径配置，并提供具体的 jsonl 文件路径以触发测试。。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- sessionEnd
- contiuous-learn
- auto-learning
- 日志
- 路径
- jsonl

## Instructions
1. 请求增加日志以感知 auto-learning 是否在运行
2. 调整 LLM 超时时间
3. 修改 auto-learning 的保存路径配置（从 .claude/.skills/learn/ 改为 {cwd}/skill/learn/）
4. 通过提供具体的 jsonl 文件路径进行触发测试

## Examples
示例1：用户说 "sessionEnd" -> AI 引导用户按步骤排查问题
示例2：用户描述 "用户不确定在触发 sessionEnd 时 continuous-learn 是否被执行，无法感知 auto-learning 的运行状态。此外，发现 auto-learning 的保存路径配置错误，保存在了 .claude/.skills/learn/ 而非预期的 {cwd}/skill/learn/。" -> AI 提供 通过增加日志来感知执行状态，调整 LLM 超时时间，修改 auto-learning 的存储路径配置，并提供具体的 jsonl 文件路径以触发测试。