# 技能健康监控器 (skill-health-monitor)

OpenClaw 技能健康监控工具，监控定时技能运行状态，发现超过时间没运行自动发告警，避免定时任务挂了没人知道。

## 功能

- ✅ 定时检查多个技能运行状态
- ✅ 自定义每个技能的最大 stale 时间（默认超过24小时没运行就算异常）
- ✅ 发现异常自动发送通知告警
- ✅ 支持添加/移除监控技能，灵活管理
- ✅ 列出所有监控技能当前健康状态
- ✅ 被监控技能可以主动记录运行时间

## 使用方法

### 1. 安装

克隆仓库后，复制文件夹到 `~/.openclaw/skills/` 目录：

```bash
cp -r skill-health-monitor ~/.openclaw/skills/
```

重启OpenClaw即可使用。

### 2. 启动监控

```javascript
const result = await skills.run('skill-health-monitor', {
  action: 'start',
  options: {
    checkInterval: 3600000, // 检查间隔，默认1小时一次
    maxStaleHours: 24,     // 默认超过24小时没运行就算异常
    notifyOnFailure: true, // 发现异常自动发通知
    monitoredSkills: [     // 要监控的技能列表
      {
        name: 'bailian-quotas-monitor',
        maxStaleHours: 24   // 可以单独给这个技能设置过期时间
      },
      {
        name: 'caa123-bidder-monitor'
        // 没设置就用全局默认的 maxStaleHours
      }
    ]
  }
});

console.log(result.message);
```

### 3. 添加新监控技能

```javascript
const result = await skills.run('skill-health-monitor', {
  action: 'add',
  skill: {
    name: 'your-skill-name',
    maxStaleHours: 12 // 可选，默认24
  }
});
```

### 4. 移除监控技能

```javascript
const result = await skills.run('skill-health-monitor', {
  action: 'remove',
  skillName: 'your-skill-name'
});
```

### 5. 列出所有监控技能当前状态

```javascript
const result = await skills.run('skill-health-monitor', {
  action: 'list'
});

console.log(`总共 ${result.total} 个技能，健康 ${result.healthy}，异常 ${result.unhealthy}`);
console.log(result.skills);
```

### 6. 手动检查一次

```javascript
const result = await skills.run('skill-health-monitor', {
  action: 'check'
});

console.log(`检查完成：健康 ${result.healthy}，异常 ${result.unhealthy}`);
```

### 7. 被监控技能记录运行

在你的定时技能运行完最后加上：

```javascript
// 在你的技能代码里
skills.get('skill-health-monitor').recordRun('your-skill-name');
```

这样健康监控就能知道你上次运行是什么时间了。

### 8. 停止监控

```javascript
const result = await skills.run('skill-health-monitor', {
  action: 'stop'
});
```

## 配置说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `checkInterval` | 3600000 (1小时) | 定时检查间隔，单位毫秒 |
| `maxStaleHours` | 24 | 默认最大多久没运行算异常，单位小时 |
| `notifyOnFailure` | `true` | 发现异常是否发送通知 |
| `monitoredSkills` | `[]` | 要监控的技能数组，每个技能可以单独设置maxStaleHours |

## 使用场景

- 监控定时额度检查任务，比如火山/百炼额度监控
- 监控竞买人监控定时任务
- 监控任何需要定期运行的技能
- 出问题（进程崩溃、异常退出）第一时间收到通知，不用等几天才发现

## 存储

健康状态保存在技能目录 `health-state.json`，重启后自动加载。
每个技能最后运行时间保存在OpenClaw全局存储 `skill-health-monitor:{skillName}:lastRun`。

## License

MIT License - 免费开源，可随意使用修改。
