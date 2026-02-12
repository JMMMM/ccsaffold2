---
name: ccsaffold插件改造
description: 将ccsaffold2项目改造成符合Claude Code规范的社区可分享插件
---

# Skill: ccsaffold插件改造

## Purpose
当用户遇到 用户希望将现有项目改造为可复用的插件，但经历了多次反复沟通才达成正确结构：1) 最初创建的是嵌套结构(2层)，用户要求改为根目录单层；2) 初始包含了speckit命令，用户要求排除；3) 包含了log-user-prompt功能，用户要求移除；4) 插件加载失败，hook-creator skill不显示；5) 最后通过创建/ccsaffold:hook-creator命令才成功加载 时，1) 将插件内容从ccsaffold/子目录移到项目根目录；2) 从插件目录中移除commands/和.specify/目录，保留在主项目；3) 删除log-user-prompt.js，更新hooks.json只保留auto-learning；4) 创建.claude-plugin/plugin.json、hooks/hooks.json、skills/hook-creator/SKILL.md等核心文件；5) 最后通过创建/ccsaffold:hook-creator命令成功加载插件。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- 插件化
- speckit
- hooks
- skills
- plugin-dir
- 嵌套结构
- 复用

## Instructions
1. 阅读官方插件文档并生成spec.md、plan.md等规范文件
2. 创建.claude-plugin/plugin.json插件清单
3. 创建hooks/hooks.json配置auto-learning钩子
4. 创建skills/hook-creator/SKILL.md提供hook创建能力
5. 根据用户反馈调整结构：移除嵌套、排除speckit、移除log-user-prompt
6. 在项目根目录直接提供插件功能，不创建子目录
7. 通过创建/ccsaffold:hook-creator命令成功加载插件

## Examples
示例1：用户说 "插件化" -> AI 引导用户按步骤排查问题
示例2：用户描述 "用户希望将现有项目改造为可复用的插件，但经历了多次反复沟通才达成正确结构：1) 最初创建的是嵌套结构(2层)，用户要求改为根目录单层；2) 初始包含了speckit命令，用户要求排除；3) 包含了log-user-prompt功能，用户要求移除；4) 插件加载失败，hook-creator skill不显示；5) 最后通过创建/ccsaffold:hook-creator命令才成功加载" -> AI 提供 1) 将插件内容从ccsaffold/子目录移到项目根目录；2) 从插件目录中移除commands/和.specify/目录，保留在主项目；3) 删除log-user-prompt.js，更新hooks.json只保留auto-learning；4) 创建.claude-plugin/plugin.json、hooks/hooks.json、skills/hook-creator/SKILL.md等核心文件；5) 最后通过创建/ccsaffold:hook-creator命令成功加载插件