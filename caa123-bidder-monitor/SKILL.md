# 中拍平台竞买人监控 (caa123-bidder-monitor)

监控中拍平台（caa123.org.cn）拍品新增竞买人，支持关键词匹配，发现意向买家及时推送提醒。

## 功能

- ✅ 定期检查所有拍品新增竞买人
- ✅ 支持关键词过滤，只提醒匹配的竞买人
- ✅ 自动记录已发现的竞买人，不重复提醒
- ✅ 匹配到关键词自动发送通知

## 使用方法

### 1. 安装

克隆仓库后，将文件夹复制到 `~/.openclaw/skills/` 目录：

```bash
cp -r caa123-bidder-monitor ~/.openclaw/skills/
```

重启OpenClaw即可使用。

### 2. 启动监控

```javascript
const result = await skills.run('caa123-bidder-monitor', {
  action: 'start',
  options: {
    checkInterval: 3600000,  // 1小时检查一次
    keywords: ['关键词1', '关键词2'],  // 要匹配的关键词
    notifyOnMatch: true  // 匹配到就发通知
  }
});

console.log(result.message);
```

### 3. 手动检查一次

```javascript
const result = await skills.run('caa123-bidder-monitor', {
  action: 'check'
});

console.log(`发现 ${result.newBidders} 个新竞买人，${result.matched} 个匹配关键词`);
```

### 4. 停止监控

```javascript
const result = await skills.run('caa123-bidder-monitor', {
  action: 'stop'
});
```

## 配置说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `checkInterval` | 3600000 | 检查间隔，单位毫秒，默认1小时 |
| `keywords` | `[]` | 匹配关键词数组，竞买人名称包含任一关键词就会触发提醒 |
| `apiEndpoint` | `https://www.caa123.org.cn` | 中拍平台网址，一般不用改 |
| `notifyOnMatch` | `true` | 匹配到是否发送通知 |

## 使用场景

- 拍卖行业务，关注特定竞买人参与拍品
- 及时发现意向买家，提前准备沟通
- 自动监控，不用每天手动刷新网站

## 存储位置

已发现的竞买人ID保存在技能目录 `known-bidders.json`，重启后会自动加载，不会重复提醒。

## 注意事项

- 需要能正常访问中拍平台网站
- 频率不要设置太高，遵守网站规则
- 这是监控工具，不参与实际出价，只做提醒

## License

MIT License - 免费开源，可随意使用修改。
