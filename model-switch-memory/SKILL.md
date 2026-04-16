# 模型切换记忆保留 (model-switch-memory)

切换OpenClaw模型后，不用重新磨合！保存你和助手之间已经养成的默契、习惯、风格设定，切换模型后一键加载恢复。

## 功能

- ✅ 分层保存：全局偏好 + 当前对话摘要
- ✅ 自动提取默契内容
- ✅ 支持手动编辑保存内容
- ✅ 切换模型后一键加载，快速找回感觉
- ✅ 兼容所有OpenClaw模型，不绑定特定API

## 使用方法

### 1. 安装

克隆仓库后，将文件夹复制到 `~/.openclaw/skills/` 目录：

```bash
cp -r model-switch-memory ~/.openclaw/skills/
```

重启OpenClaw即可使用。

### 2. 保存记忆

切换模型前，先保存当前记忆：

```javascript
const result = await skills.run('model-switch-memory', {
  action: 'save',
  currentModel: 'current-model-name',
  preferences: {
    tone: 'concise',
    language: 'zh-CN',
    style: 'practical'
  },
  summary: '这里是我们之间达成的默契摘要...',
  context: currentConversationContext
});
```

### 3. 加载记忆

切换模型后，加载保存的记忆：

```javascript
const result = await skills.run('model-switch-memory', {
  action: 'load'
});

if (result.success) {
  // 将记忆内容注入当前会话
  injectMemory(result.memory);
}
```

### 4. 手动使用（更简单）

你也可以：
1. 切换模型前调用保存
2. 切换后调用加载
3. 根据加载的摘要和偏好，快速找回之前的默契

## 使用场景

- 测试不同模型，需要反复切换，不想每次重新说一遍偏好
- 主模型限流，临时切换备用模型，需要保持对话风格一致
- 更新OpenClaw版本，重启后恢复之前的对话设定

## 存储位置

记忆保存在技能目录下 `saved-memory.json`，你可以手动编辑这个文件修改内容。

## 开发原则

实用优先，稳定第一，解决真实痛点：切换模型丢默契，这是很多用户都碰到的问题，这个工具一次解决。

## License

MIT License - 免费开源，可随意使用修改。
