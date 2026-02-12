目前自动学习会影响claude关闭速度，我希望进行改进，首先将自动学习触发改成异步，并输出log，log位置为.claude/logs/continuous-learning/learning-{session_id}.log

日志显示整个大模式调用过程，包括文件读取，入参返回等，详细记录过程； 这样sessionEnd时触发异步，不阻塞主流程