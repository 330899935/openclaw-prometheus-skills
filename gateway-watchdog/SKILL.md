# 网关看门狗 (gateway-watchdog)

监控OpenClaw网关进程，如果网关意外宕机，自动帮你重启，保证服务持续可用，不用你手动干预。

## 功能

- ✅ 定期检查网关进程状态
- ✅ 发现宕机自动执行重启
- ✅ 限制最大重启次数，防止死循环
- ✅ 重启自动发送通知告警
- ✅ 可配置检查间隔和重启命令

## 使用方法

### 1. 安装

克隆仓库后，将文件夹复制到 `~/.openclaw/skills/` 目录：

```bash
cp -r gateway-watchdog ~/.openclaw/skills/
```

重启OpenClaw即可使用。

### 2. 启动监控

```javascript
const result = await skills.run('gateway-watchdog', {
  action: 'start',
  options: {
    checkInterval: 30000,  // 30秒检查一次
    maxRestarts: 5,        // 最多重启5次
    notifyOnRestart: true  // 重启时通知
  }
});

console.log(result.message);
```

### 3. 停止监控

```javascript
const result = await skills.run('gateway-watchdog', {
  action: 'stop'
});
```

### 4. 手动检查状态

```javascript
const result = await skills.run('gateway-watchdog', {
  action: 'status'
});

console.log(result.status);
```

### 5. 仅检查网关是否运行

```javascript
const result = await skills.run('gateway-watchdog', {
  action: 'check'
});

if (result.running) {
  console.log('✅ 网关正常运行');
} else {
  console.log('❌ 网关未运行');
}
```

## 配置说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `checkInterval` | 30000 | 检查间隔，单位毫秒，默认30秒 |
| `maxRestarts` | 5 | 最大自动重启次数，防止死循环 |
| `restartCommand` | `openclaw gateway restart` | 重启命令，一般不用改 |
| `notifyOnRestart` | `true` | 重启时是否发送通知 |

## 使用场景

- 长时间运行的OpenClaw服务，保证高可用性
- 远程服务器部署，不方便手动登录重启
- 网关偶尔会因为网络问题意外退出，自动恢复

## 注意事项

- 需要在macOS/Linux环境下使用，依赖 `pgrep` 命令检查进程
- 重启命令需要 `openclaw` 在PATH中能找到
- 自动重启不是万能的，如果连续多次重启失败，会停止并通知你人工处理

## License

MIT License - 免费开源，可随意使用修改。
