我希望创建一个会话内容记录的功能，里面涉及到hooks的使用，你可以先了解claude code对hooks的使用方式；

首先hooks监听UserPromptSubmit和PostToolUse事件，当用户提交提示或使用工具后，hooks会触发相应的函数来记录会话内容。
注意工具使用需要排除Grep,Search等查询相关的事件，避免记录太多内容；

文件记录需要限制内容条数，保存最近100条聊天内容，每次超出100条就将最早的50条删除，不断滚动更新记录文件。

由于是高频触发脚本，我希望选择高性能的nodejs编写，使用时也需要注重性能；同时需要注重代码可复用性；

在开发过程中需要考虑多平台复用，例如Windows，macos，linux;

注意会话文件采用追加写，文件相对路径为.claude/conversations/conversation.txt;
