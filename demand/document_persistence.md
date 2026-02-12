# 文档持久化助手
增加2个钩子
在触发这个mcp后 web-reader - webReader (MCP)(return_format: "markdown", url: "******")
before：查看是否存在这个网站的skills，优先使用该skills总结的内容；
after： 将web-reader返回的内容总结成skills，方便下次直接使用，减少MCP调用消耗的时间；钩子类型是prompt，主要将这个mcp返回的markdown 总结成skills方便下次使用；同时在doc文件夹下保存该markdown
用CLAUDE.md引用
