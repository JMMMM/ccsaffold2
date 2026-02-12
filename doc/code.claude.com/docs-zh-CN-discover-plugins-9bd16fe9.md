<!--
Source: https://code.claude.com/docs/zh-CN/discover-plugins
Fetched: 2026-02-12T10:30:00Z
-->

# 通过市场发现和安装预构建插件 - Claude Code Docs

插件通过自定义命令、代理、钩子和 MCP 服务器扩展 Claude Code。插件市场是帮助您发现和安装这些扩展的目录，无需自己构建。
想要创建和分发自己的市场？请参阅创建和分发插件市场。

## 市场如何工作

市场是他人创建和共享的插件目录。使用市场是一个两步过程：

可以将其视为添加应用商店：添加商店让您可以访问浏览其集合，但您仍然可以单独选择要下载的应用。

## 官方 Anthropic 市场

官方 Anthropic 市场 (`claude-plugins-official`) 在您启动 Claude Code 时自动可用。运行 `/plugin` 并转到__发现__选项卡以浏览可用内容。
要从官方市场安装插件：

```
/plugin install plugin-name@claude-plugins-official
```

官方市场包括多个插件类别：

### 代码智能

代码智能插件帮助 Claude 更深入地理解您的代码库。安装这些插件后，Claude 可以跳转到定义、查找引用，并在编辑后立即查看类型错误。这些插件使用语言服务器协议 (LSP)，这是为 VS Code 代码智能提供支持的相同技术。
这些插件需要在您的系统上安装语言服务器二进制文件。如果您已经安装了语言服务器，当您打开项目时，Claude 可能会提示您安装相应的插件。

| 语言 | 插件 | 所需二进制文件 |
| --- | --- | --- |
| C/C++ | `clangd-lsp` | `clangd` |
| C# | `csharp-lsp` | `csharp-ls` |
| Go | `gopls-lsp` | `gopls` |
| Java | `jdtls-lsp` | `jdtls` |
| Lua | `lua-lsp` | `lua-language-server` |
| PHP | `php-lsp` | `intelephense` |
| Python | `pyright-lsp` | `pyright-langserver` |
| Rust | `rust-analyzer-lsp` | `rust-analyzer` |
| Swift | `swift-lsp` | `sourcekit-lsp` |
| TypeScript | `typescript-lsp` | `typescript-language-server` |

您也可以为其他语言创建自己的 LSP 插件。

### 外部集成

这些插件捆绑预配置的 MCP 服务器，以便您可以将 Claude 连接到外部服务，无需手动设置：

- __源代码控制__：`github`、`gitlab`
- __项目管理__：`atlassian`（Jira/Confluence）、`asana`、`linear`、`notion`
- __设计__：`figma`
- __基础设施__：`vercel`、`firebase`、`supabase`
- __通信__：`slack`
- __监控__：`sentry`

### 开发工作流

为常见开发任务添加命令和代理的插件：

- __commit-commands__：Git 提交工作流，包括提交、推送和 PR 创建
- __pr-review-toolkit__：用于审查拉取请求的专门代理
- __agent-sdk-dev__：使用 Claude Agent SDK 构建的工具
- __plugin-dev__：用于创建您自己的插件的工具包

### 输出样式

自定义 Claude 的响应方式：

- __explanatory-output-style__：关于实现选择的教育见解
- __learning-output-style__：用于技能构建的交互式学习模式

## 尝试：添加演示市场

Anthropic 还维护一个演示插件市场（`claude-code-plugins`），其中包含展示插件系统可能性的示例插件。与官方市场不同，您需要手动添加此市场。

本指南的其余部分涵盖了添加市场、安装插件和管理配置的所有方式。

## 添加市场

使用 `/plugin marketplace add` 命令从不同来源添加市场。

- __GitHub 存储库__：`owner/repo` 格式（例如，`anthropics/claude-code`）
- __Git URL__：任何 git 存储库 URL（GitLab、Bitbucket、自托管）
- __本地路径__：目录或 `marketplace.json` 文件的直接路径
- __远程 URL__：托管 `marketplace.json` 文件的直接 URL

### 从 GitHub 添加

使用 `owner/repo` 格式添加包含 `.claude-plugin/marketplace.json` 文件的 GitHub 存储库，其中 `owner` 是 GitHub 用户名或组织，`repo` 是存储库名称。
例如，`anthropics/claude-code` 指的是由 `anthropics` 拥有的 `claude-code` 存储库：

```
/plugin marketplace add anthropics/claude-code
```

### 从其他 Git 主机添加

通过提供完整 URL 添加任何 git 存储库。这适用于任何 Git 主机，包括 GitLab、Bitbucket 和自托管服务器：
使用 HTTPS：

```
/plugin marketplace add https://gitlab.com/company/plugins.git
```

使用 SSH：

要添加特定分支或标签，请在 `#` 后附加 ref：

```
/plugin marketplace add https://gitlab.com/company/plugins.git#v1.0.0
```

### 从本地路径添加

添加包含 `.claude-plugin/marketplace.json` 文件的本地目录：

```
/plugin marketplace add ./my-marketplace
```

您也可以添加 `marketplace.json` 文件的直接路径：

```
/plugin marketplace add ./path/to/marketplace.json
```

### 从远程 URL 添加

通过 URL 添加远程 `marketplace.json` 文件：

```
/plugin marketplace add https://example.com/marketplace.json
```

## 安装插件

添加市场后，您可以直接安装插件（默认安装到用户范围）：

```
/plugin install plugin-name@marketplace-name
```

要选择不同的安装范围，请使用交互式 UI：运行 `/plugin`，转到__发现__选项卡，然后在插件上按 __Enter__。您将看到以下选项：

- __用户范围__（默认）：在所有项目中为自己安装
- __项目范围__：为此存储库上的所有协作者安装（添加到 `.claude/settings.json`）
- __本地范围__：仅在此存储库中为自己安装（不与协作者共享）

您也可能看到具有__托管__范围的插件——这些由管理员通过托管设置安装，无法修改。
运行 `/plugin` 并转到__已安装__选项卡以查看按范围分组的插件。

## 管理已安装的插件

运行 `/plugin` 并转到__已安装__选项卡以查看、启用、禁用或卸载您的插件。
您也可以使用直接命令管理插件。
禁用插件而不卸载：

```
/plugin disable plugin-name@marketplace-name
```

重新启用已禁用的插件：

```
/plugin enable plugin-name@marketplace-name
```

完全删除插件：

```
/plugin uninstall plugin-name@marketplace-name
```

`--scope` 选项允许您使用 CLI 命令针对特定范围：

```
claude plugin install formatter@your-org --scope project
claude plugin uninstall formatter@your-org --scope project
```

## 管理市场

您可以通过交互式 `/plugin` 界面或 CLI 命令管理市场。

### 使用交互式界面

运行 `/plugin` 并转到__市场__选项卡以：

- 查看所有添加的市场及其来源和状态
- 添加新市场
- 更新市场列表以获取最新插件
- 删除您不再需要的市场

### 使用 CLI 命令

您也可以使用直接命令管理市场。
列出所有配置的市场：

刷新市场的插件列表：

```
/plugin marketplace update marketplace-name
```

删除市场：

```
/plugin marketplace remove marketplace-name
```

### 配置自动更新

Claude Code 可以在启动时自动更新市场及其已安装的插件。为市场启用自动更新后，Claude Code 会刷新市场数据并将已安装的插件更新到其最新版本。如果任何插件已更新，您将看到建议重启 Claude Code 的通知。
通过 UI 为单个市场切换自动更新：

1. 运行 `/plugin` 打开插件管理器
2. 选择__市场__
3. 从列表中选择市场
4. 选择__启用自动更新__或__禁用自动更新__

官方 Anthropic 市场默认启用自动更新。第三方和本地开发市场默认禁用自动更新。
要完全禁用 Claude Code 和所有插件的所有自动更新，请设置 `DISABLE_AUTOUPDATER` 环境变量。有关详细信息，请参阅自动更新。
要在禁用 Claude Code 自动更新的同时保持插件自动更新启用，请设置 `FORCE_AUTOUPDATE_PLUGINS=true` 以及 `DISABLE_AUTOUPDATER`：

```
export DISABLE_AUTOUPDATER=true
export FORCE_AUTOUPDATE_PLUGINS=true
```

当您想手动管理 Claude Code 更新但仍接收自动插件更新时，这很有用。

## 配置团队市场

团队管理员可以通过将市场配置添加到 `.claude/settings.json` 来为项目设置自动市场安装。当团队成员信任存储库文件夹时，Claude Code 会提示他们安装这些市场和插件。
有关完整配置选项（包括 `extraKnownMarketplaces` 和 `enabledPlugins`），请参阅插件设置。

## 故障排除

### /plugin 命令无法识别

如果您看到"未知命令"或 `/plugin` 命令未出现：

1. __检查您的版本__：运行 `claude --version`。插件需要版本 1.0.33 或更高版本。
2. __更新 Claude Code__：
   - __Homebrew__：`brew upgrade claude-code`
   - __npm__：`npm update -g @anthropic-ai/claude-code`
   - __本地安装程序__：从设置重新运行安装命令
3. __重启 Claude Code__：更新后，重启您的终端并再次运行 `claude`。

### 常见问题

- __市场未加载__：验证 URL 是否可访问以及 `.claude-plugin/marketplace.json` 是否存在于该路径
- __插件安装失败__：检查插件源 URL 是否可访问以及存储库是否为公开（或您有访问权限）
- __安装后文件未找到__：插件被复制到缓存，因此引用插件目录外文件的路径将不起作用
- __插件技能未出现__：使用 `rm -rf ~/.claude/plugins/cache` 清除缓存，重启 Claude Code，然后重新安装插件。有关详细信息，请参阅插件技能安装后未出现。

有关详细的故障排除和解决方案，请参阅市场指南中的故障排除。有关调试工具，请参阅调试和开发工具。

## 后续步骤

- __构建您自己的插件__：请参阅插件以创建自定义命令、代理和钩子
- __创建市场__：请参阅创建插件市场以将插件分发给您的团队或社区
- __技术参考__：请参阅插件参考以获取完整规范
