现在我想创建一个continuous-learning的command和自动学习的钩子，功能如下：

1.command：summary-skills，入参：highline 字符串， 通过提示词模板+!命令，对当前会话的历史内容进行总结，提取出技能点，并将这些技能点保存到.claude/skills/learn技能库中。
有你来写提示词模板内容必须含有，highline用于在提示词中突出关注的聊天内容，然后从会话内容中，找到针对一个问题反复提问大于等于3次内容，也就是说AI修改多次，最终修复成功的问题，在这个流程上总结经验；
请帮我生成提示词，注意触发点的填写，以及必须参考claude code 的 command文档，和skills生成格式。

在开发过程中需要考虑多平台复用，例如Windows，macos，linux;