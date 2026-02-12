#!/usr/bin/env python3
"""
Hook Script Template (Python)

stdin 输入格式参见 references/input-format.md
"""
import sys
import json


def main():
    try:
        data = sys.stdin.read()
        input_data = json.loads(data or '{}')
        event_name = input_data.get('hook_event_name', '')

        # 根据事件类型处理
        if event_name == 'UserPromptSubmit':
            handle_user_prompt(input_data)
        elif event_name == 'PreToolUse':
            handle_pre_tool_use(input_data)
        elif event_name == 'PostToolUse':
            handle_post_tool_use(input_data)
        elif event_name == 'Notification':
            handle_notification(input_data)
        elif event_name == 'Stop':
            handle_stop(input_data)
    except Exception:
        pass
    sys.exit(0)


def handle_user_prompt(input_data):
    prompt = input_data.get('prompt', '')
    # TODO: 实现你的逻辑
    pass


def handle_pre_tool_use(input_data):
    tool = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})
    # TODO: 实现你的逻辑

    # 如需拦截，输出:
    # print(json.dumps({'decision': 'deny', 'reason': '拒绝原因'}))


def handle_post_tool_use(input_data):
    tool = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})
    tool_response = input_data.get('tool_response', {})
    # TODO: 实现你的逻辑


def handle_notification(input_data):
    notification = input_data.get('notification', '')
    # TODO: 实现你的逻辑


def handle_stop(input_data):
    # TODO: 清理资源
    pass


if __name__ == '__main__':
    main()
