## 持续学习
创建一个总结会话内容生成skills的功能，该功能分成两个部分，一个是手动触发学习，一个是自动学习；

## 实现方法
- 自动学习
新建一个hooks 触发点为sessionEnd，创建一个脚本叫 auto-learning.js 从sessionEnd中获取transcript_path；
调用大模型，读取transcript_path的文件，从内容中找到符合“用户多次反复沟通后才最终修复的问题” 将内容汇总总结成skills 保存到项目的.skills/learn目录下；

- 注意这类skill不保存到.claude文件中，而是直接保存在项目根目录下（cwd）；
- 提示词创建必须参照模版；命名需要匹配内容；
## skills提示词模版

```
--
name: my-skill
description: 这是一个示例技能，用于演示如何创建自定义 Skill
---

# Skill: my-skill

## Purpose
这个技能的主要用途是...

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- 关键词1
- 关键词2

## Instructions
1. 首先执行的操作
2. 接下来的步骤
3. 最后完成的任务

## Examples
示例1：用户输入 -> AI 的响应
示例2：用户输入 -> AI 的响应

```
在开发过程中需要考虑多平台复用，例如Windows，macos，linux;