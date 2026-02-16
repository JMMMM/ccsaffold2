#!/usr/bin/env node
/**
 * ccsaffold 插件安装脚本
 * 将插件的hooks配置合并到目标项目的 .claude/settings.json
 *
 * 使用: node scripts/install.js [目标项目路径]
 */
const fs = require('fs');
const path = require('path');

// 插件根目录
const pluginRoot = path.resolve(__dirname, '..');

// 目标项目目录（参数或当前工作目录）
const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

console.log('ccsaffold 插件安装');
console.log('目标项目:', targetDir);
console.log('');

// 目标目录
const targetClaudeDir = path.join(targetDir, '.claude');
const targetHooksDir = path.join(targetClaudeDir, 'hooks');
const targetConversationsDir = path.join(targetClaudeDir, 'conversations');
const targetSettingsFile = path.join(targetClaudeDir, 'settings.json');

// 读取插件的hooks配置
const pluginHooksFile = path.join(pluginRoot, 'hooks', 'hooks.json');
let pluginHooks;
try {
  pluginHooks = JSON.parse(fs.readFileSync(pluginHooksFile, 'utf8'));
} catch (e) {
  console.error('无法读取插件hooks配置:', e.message);
  process.exit(1);
}

// 确保目录存在
fs.mkdirSync(targetClaudeDir, { recursive: true });
fs.mkdirSync(targetHooksDir, { recursive: true });
fs.mkdirSync(targetConversationsDir, { recursive: true });

// 读取现有settings.json（如果存在）
let existingSettings = {};
if (fs.existsSync(targetSettingsFile)) {
  try {
    existingSettings = JSON.parse(fs.readFileSync(targetSettingsFile, 'utf8'));
  } catch (e) {
    console.log('无法解析现有settings.json，将创建新文件');
  }
}

// 合并hooks配置
if (!existingSettings.hooks) {
  existingSettings.hooks = {};
}

// 将插件的hooks转换为项目本地格式（使用相对路径）
const localHooks = {};
for (const [eventName, hooks] of Object.entries(pluginHooks.hooks)) {
  localHooks[eventName] = hooks.map(hookConfig => ({
    ...hookConfig,
    hooks: hookConfig.hooks.map(h => {
      // 将 ${CLAUDE_PLUGIN_ROOT}/hooks/xxx.js 转换为 .claude/hooks/xxx.js
      const match = h.command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/(.+\.js)/);
      if (match) {
        return {
          ...h,
          command: `node .claude/hooks/${match[1]}`
        };
      }
      return h;
    })
  }));
}

// 合并到现有配置
for (const [eventName, hooks] of Object.entries(localHooks)) {
  if (existingSettings.hooks[eventName]) {
    // 合并，避免重复
    const existingDescs = new Set(
      existingSettings.hooks[eventName].map(h => h.description)
    );
    for (const hook of hooks) {
      if (!existingDescs.has(hook.description)) {
        existingSettings.hooks[eventName].push(hook);
      }
    }
  } else {
    existingSettings.hooks[eventName] = hooks;
  }
}

// 写入settings.json
fs.writeFileSync(targetSettingsFile, JSON.stringify(existingSettings, null, 2));
console.log('✓ 已更新 .claude/settings.json');

// 复制hooks脚本
const hooksToCopy = ['session-logger.js', 'auto-learning.js', 'auto-learning-worker.js'];
for (const hookFile of hooksToCopy) {
  const src = path.join(pluginRoot, 'hooks', hookFile);
  const dest = path.join(targetHooksDir, hookFile);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ 已复制 hooks/${hookFile}`);
  }
}

// 复制lib目录（auto-learning需要）
const libSrc = path.join(pluginRoot, 'lib');
const libDest = path.join(targetClaudeDir, 'lib');
if (fs.existsSync(libSrc)) {
  fs.mkdirSync(libDest, { recursive: true });
  const libFiles = fs.readdirSync(libSrc).filter(f => f.endsWith('.js'));
  for (const file of libFiles) {
    fs.copyFileSync(path.join(libSrc, file), path.join(libDest, file));
  }
  console.log(`✓ 已复制 lib/ 目录 (${libFiles.length} 个文件)`);
}

// 复制skills目录（如果存在）
const skillsSrc = path.join(pluginRoot, 'skills');
const skillsDest = path.join(targetClaudeDir, 'skills');
if (fs.existsSync(skillsSrc)) {
  fs.mkdirSync(skillsDest, { recursive: true });
  const copyDir = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  copyDir(skillsSrc, skillsDest);
  console.log('✓ 已复制 skills/ 目录');
}

console.log('');
console.log('安装完成！');
console.log('');
console.log('下一步: 重启 Claude Code 会话使hooks生效');
