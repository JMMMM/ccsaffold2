## 需求目标
我希望创建一个会话内容记录的功能，里面涉及到hooks的使用，你可以先了解claude code对hooks的使用方式；
文档内容限制：user行数100行

## 参考文献
本次涉及到claude code hooks的使用，请优先通过context7 mcp 查阅相关文档，了解清楚后再执行；

## 设计思路
首先设置hooks监听UserPromptSubmit和PostToolUse事件，当用户提交提示或使用工具后，hooks会触发相应的函数来记录会话内容。
注意工具使用需要排除Grep,Search等查询相关的事件，避免记录太多内容；

## 代码相关
我希望使用nodejs实现，用nodejs实现一个文档记录功能，每次调用时判断文档是否超出限制；
UserPromptSubmit是用户事件，触发记录时，增加user>开头
PostToolUse是ClaudeAI事件，触发记录时，增加claude>开头；

文件内容限制是指user>的行数

## 更多内容
- 文件记录需要限制内容条数，每次超出限制就删除最早的1/3左右的数据，不断滚动更新记录文件。
- 用nodejs编写，注重高性能，可以不添加锁机制；
- 多平台复用，Windows，macos，linux;
- 追加写，文件相对路径为.claude/conversations/conversation.txt;
