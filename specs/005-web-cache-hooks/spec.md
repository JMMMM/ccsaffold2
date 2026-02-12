# Feature Specification: Web Reader MCP Cache Hooks

**Feature Branch**: `005-web-cache-hooks`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "文档持久化助手 - 为 web-reader MCP 增加 before/after 钩子，实现网站内容缓存"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 使用已缓存的网站内容 (Priority: P1)

用户在会话中请求读取某个网站的内容时，系统首先检查该网站是否已有缓存的知识摘要。如果存在，直接使用缓存内容响应，无需调用 web-reader MCP。

**Why this priority**: 这是核心价值 - 减少重复的MCP调用，节省时间和资源。

**Independent Test**: 访问一个已缓存的网站（如 docs.nodejs.org），验证系统直接返回缓存内容而不触发 MCP 调用。

**Acceptance Scenarios**:

1. **Given** 系统已有 `docs.nodejs.org` 的缓存摘要，**When** 用户请求读取该网站内容，**Then** 系统直接返回缓存内容，不调用 web-reader MCP
2. **Given** 系统已有某个网站的缓存摘要，**When** 缓存内容足够回答用户问题，**Then** 用户获得准确答案且无需等待网络请求
3. **Given** 用户请求的网站URL与缓存中的URL匹配（支持域名匹配），**When** 系统检查缓存，**Then** 正确识别并使用缓存

---

### User Story 2 - 自动缓存新访问的网站内容 (Priority: P1)

当用户请求读取一个未被缓存的网站时，系统调用 web-reader MCP 获取内容，然后：
1. 将原始 markdown 保存到 `doc/` 目录作为存档
2. 通过 prompt 类型 hook 将内容总结为可复用的 skill

**Why this priority**: 与 P1-1 配套，确保每次新的网站访问都能产生持久化价值，同时保留原始内容。

**Independent Test**: 访问一个新网站（系统中无缓存），验证 MCP 调用后自动生成对应的缓存 skill 并保存原始 markdown。

**Acceptance Scenarios**:

1. **Given** 系统中没有 `react.dev` 的缓存，**When** 用户请求读取该网站并 MCP 返回内容，**Then** 系统自动将内容总结为 skill 并存储
2. **Given** web-reader 返回 markdown 内容，**When** after hook（prompt 类型）触发，**Then** 内容被提炼为核心知识点
3. **Given** 缓存生成完成，**When** 用户再次请求同一网站，**Then** before hook 能够找到并使用该缓存
4. **Given** web-reader 返回 markdown 内容，**When** after hook 处理完成，**Then** 原始 markdown 保存到 `doc/{domain}.md` 文件

---

### User Story 3 - 处理缓存失效与更新 (Priority: P2)

当缓存的网站内容可能过时时，用户可以选择强制刷新缓存。

**Why this priority**: 网站内容会更新，需要支持缓存刷新机制。

**Independent Test**: 对已缓存的网站执行强制刷新，验证旧缓存被新内容替换。

**Acceptance Scenarios**:

1. **Given** 系统已有某网站的缓存，**When** 用户指定强制刷新参数，**Then** 系统跳过缓存直接调用 MCP
2. **Given** MCP 返回新内容，**When** 缓存更新完成，**Then** 旧缓存被替换而非重复创建

---

### Edge Cases

- 当缓存 skill 文件损坏或格式错误时，系统应优雅降级并直接调用 MCP
- 当 URL 匹配到多个缓存（子域名情况）时，优先使用最精确匹配
- 当 web-reader MCP 调用失败时，不应创建空的或错误的缓存
- 当缓存内容过大时，应限制摘要长度避免 skill 文件过于臃肿

## Requirements *(mandatory)*

### Functional Requirements

**Before Hook (PreToolUse)**

- **FR-001**: 系统必须在调用 web-reader MCP 之前检查是否存在该网站的缓存 skill
- **FR-002**: 系统必须能够通过域名或完整 URL 识别缓存
- **FR-003**: 当缓存存在且有效时，系统必须优先使用缓存内容响应

**After Hook (PostToolUse - prompt 类型)**

- **FR-004**: after hook 类型必须是 prompt，用于处理 web-reader MCP 返回的 markdown 内容
- **FR-005**: after hook 必须将 markdown 内容总结为结构化的 skill，存储在 `skills/learn/{domain}/SKILL.md`
- **FR-006**: after hook 必须同时将原始 markdown 保存到 `doc/{domain}.md` 作为存档
- **FR-007**: 缓存 skill 必须包含：来源 URL、创建时间、核心知识摘要
- **FR-008**: CLAUDE.md 必须引用 `doc/` 目录下的文档，以便 AI 了解已有的网站资料

**通用要求**

- **FR-009**: 系统必须支持强制跳过缓存的选项（用户显式请求时）
- **FR-010**: 缓存摘要必须是精炼的知识点，而非原始 markdown 的简单存储

### Key Entities

- **WebCacheSkill**: 代表一个网站的缓存知识（存储在 `skills/learn/{domain}/SKILL.md`）
  - 来源 URL（原始请求地址）
  - 域名标识（用于匹配）
  - 创建/更新时间
  - 知识摘要（提炼的核心内容）
  - 标签（可选，用于分类）

- **DocArchive**: 代表原始 markdown 存档（存储在 `doc/{domain}.md`）
  - 原始 markdown 内容
  - 来源 URL
  - 抓取时间

- **CacheMatcher**: 负责匹配请求 URL 与现有缓存
  - 支持精确匹配
  - 支持域名匹配（子域名可选）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 对于已缓存的网站，用户获得响应的时间减少 80% 以上（无需等待网络请求和 MCP 处理）
- **SC-002**: 缓存命中时，系统不产生 web-reader MCP 调用
- **SC-003**: 缓存 skill 的平均文件大小控制在 10KB 以内（精炼摘要，非原文存储）
- **SC-004**: 用户在后续会话中访问相同网站时，能够直接获得有效信息
- **SC-005**: 缓存生成过程对用户透明，不影响正常工作流程

## Assumptions

- web-reader MCP 返回的内容是有效的 markdown 格式
- 用户主要访问的是文档类网站（API 文档、技术博客等），适合提炼为知识摘要
- 缓存有效期暂不做自动过期处理，由用户手动刷新
- 不需要支持需要认证的网站内容缓存

## Out of Scope

- 自动检测网站更新并刷新缓存
- 分布式缓存或跨设备同步
- 需要登录认证的网站内容缓存
- 非 web-reader MCP 的其他 MCP 工具缓存
