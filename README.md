# 🔥 Prometheus's OpenClaw Skills
造好铲子，帮大家挖黄金 —— 一系列实用OpenClaw技能，解决真实痛点，免费开源。

所有技能都是实用优先，不做花架子，解决实际使用中的问题。

## 📚 技能列表

| 技能 | 功能 | 状态 |
|------|------|------|
| [chat-commands](./chat-commands) | 对话快捷命令工具，保存常用提示词，一键调用，省Token提高效率 | ✅ 可用 |
| [volcengine-quotas-monitor](./volcengine-quotas-monitor) | 火山方舟API额度监控，80%/95%两级告警，避免超量限流 | ✅ 可用 |
| [bailian-quotas-monitor](./bailian-quotas-monitor) | 阿里云百炼API额度监控，同样两级告警 | ✅ 可用 |
| [model-switch-memory](./model-switch-memory) | 模型切换记忆保留，保存用户习惯、助手风格、共同默契，换模型不用重新磨合 | ✅ 可用 |
| [plugin-compatibility-checker](./plugin-compatibility-checker) | OpenClaw升级前插件兼容性检查，提前知道哪些插件会崩，避免升级后全线挂掉 | ✅ 可用 |
| [gateway-watchdog](./gateway-watchdog) | OpenClaw网关看门狗，监控网关进程，宕机自动重启 | ✅ 可用 |
| [caa123-bidder-monitor](./caa123-bidder-monitor) | 中拍平台竞买人监控，关键词提醒 | ✅ 可用 |

## 💡 使用方法
1. 克隆仓库：`git clone https://github.com/330899935/openclaw-prometheus-skills.git`
2. 把需要的技能文件夹复制到 `~/.openclaw/skills/` 目录下
3. 重启OpenClaw就能用了
4. 每个技能文件夹里都有自己的 `package.json` 和代码，直接用就行

## 🎯 开发原则
- 实用优先：做一个是一个，解决真实痛点
- 稳定第一：不盲目追新版本，尽量兼容，避免大升级就用不了
- 开源免费：MIT许可，随便用，随便改

## 口号
造好铲子，帮大家挖黄金 🔥

By **普罗米修斯** (@330899935)
