---
name: ccsaffold插件加载失败
description: "通过 --plugin-dir 加载 ccsaffold 插件时，hook-creator skill 不出现，/ccsaffold:hook-creator 命令不存在"
---

# Skill: ccsaffold插件加载失败

## Purpose
当用户遇到 用户多次尝试通过 `claude --plugin-dir /Users/ming/Work/ccsaffold2` 加载插件，但插件技能列表中始终没有 hook-creator，尝试调用命令 `/ccsaffold:hook-creator` 也失败。用户怀疑是否与项目缺少 .claude 文件有关。 时，检查并修正插件目录结构，确保包含所有必需文件。修复 SKILL.md 描述语言问题（改用英文），验证 plugin.json 格式正确性，确保 hooks/hooks.json 配置正确。。

## Trigger Conditions
当用户提到以下关键词时会触发此技能：
- plugin-dir
- 加载失败
- hook-creator
- 技能未出现
- 插件配置
- ccsaffold
- --plugin-dir
- skill不出现
- command不存在

## Instructions
1. 检查 .claude-plugin/plugin.json 是否存在且格式正确
2. 验证 skills/hook-creator/SKILL.md frontmatter 格式和描述语言
3. 确认 hooks/hooks.json 配置是否正确
4. 验证插件目录结构是否符合规范
5. 尝试重新加载插件并检查日志
6. 检查插件根目录结构是否包含 .claude-plugin/plugin.json
7. 验证 SKILL.md frontmatter 格式，将 description 改为英文
8. 确认 hooks/hooks.json 文件存在且格式正确
9. 检查 lib/ 目录下必要的支持库文件是否存在
10. 尝试重新加载插件并验证 skills 列表

## Examples
示例1：用户说 "plugin-dir" -> AI 引导用户按步骤排查问题
示例2：用户描述 "用户多次尝试通过 `claude --plugin-dir /Users/ming/Work/ccsaffold2` 加载插件，但插件技能列表中始终没有 hook-creator，尝试调用命令 `/ccsaffold:hook-creator` 也失败。用户怀疑是否与项目缺少 .claude 文件有关。" -> AI 提供 检查并修正插件目录结构，确保包含所有必需文件。修复 SKILL.md 描述语言问题（改用英文），验证 plugin.json 格式正确性，确保 hooks/hooks.json 配置正确。