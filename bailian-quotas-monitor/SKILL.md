# 阿里云百炼额度监控 (bailian-quotas-monitor)

阿里云百炼API调用额度监控工具，实时监控额度使用情况，达到阈值自动告警，避免额度用尽被限流。

## 功能

- ✅ 实时查询百炼API剩余额度
- ✅ 80% 警告级别告警
- ✅ 95% 紧急级别告警
- ✅ 支持定时自动检查
- ✅ 清晰易懂的告警消息

## 使用方法

### 1. 安装

克隆仓库后，将文件夹复制到 `~/.openclaw/skills/` 目录：

```bash
cp -r bailian-quotas-monitor ~/.openclaw/skills/
```

重启OpenClaw即可使用。

### 2. 配置

在你的配置文件中添加：

```json
{
  "bailian": {
    "apiKey": "你的阿里云百炼API Key",
    "endpoint": "https://bailian.aliyuncs.com",
    "checkInterval": 3600000
  }
}
```

- `apiKey`: 你的百炼API密钥
- `endpoint`: API地址，一般使用默认即可
- `checkInterval`: 自动检查间隔，单位毫秒，默认1小时

### 3. 手动检查

调用技能：

```javascript
const result = await skills.run('bailian-quotas-monitor', {
  apiKey: 'your-api-key'
});
console.log(result);
```

## 告警级别

| 使用率 | 级别 | 处理建议 |
|--------|------|----------|
| < 80% | OK | 正常使用 |
| 80% - 95% | Warning | 注意控制用量 |
| >= 95% | Critical | 尽快充值，即将用尽 |

## 开发原则

实用优先，稳定第一，不做花架子，解决真实痛点。

## License

MIT License - 免费开源，可随意使用修改。
