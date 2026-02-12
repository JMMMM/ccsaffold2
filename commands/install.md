# /ccsaffold:install

将ccsaffold插件安装到当前项目。

## 使用

```
/ccsaffold:install
```

## 执行

请执行安装脚本：

```bash
node /Users/ming/Work/ccsaffold2/scripts/install.js
```

安装完成后，重启Claude Code会话使hooks生效。

## 安装内容

- 合并hooks配置到 `.claude/settings.json`
- 复制hooks脚本到 `.claude/hooks/`
- 复制lib依赖到 `.claude/lib/`
- 创建 `.claude/conversations/` 目录
