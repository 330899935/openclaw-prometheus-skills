# 插件兼容性检查 (plugin-compatibility-checker)

OpenClaw大版本升级前，提前检查你已安装的插件兼容性，避免升级后一大堆插件都用不了，帮你提前踩坑。

## 功能

- ✅ 检查插件目录结构是否正确
- ✅ 检查 package.json 格式是否规范
- ✅ 检查主入口文件是否存在
- ✅ 检测代码中是否使用已废弃API
- ✅ 分级风险报告：完全兼容 / 有警告 / 不兼容
- ✅ 支持添加自定义废弃API规则

## 使用方法

### 1. 安装

克隆仓库后，将文件夹复制到 `~/.openclaw/skills/` 目录：

```bash
cp -r plugin-compatibility-checker ~/.openclaw/skills/
```

重启OpenClaw即可使用。

### 2. 检查所有已安装插件

```javascript
const result = await skills.run('plugin-compatibility-checker', {
  skillsPath: '~/.openclaw/skills'
});

console.log(result.report.summary);
console.log(result.report.details);
```

### 3. 检查单个插件

```javascript
const result = await skills.run('plugin-compatibility-checker', {
  pluginPath: '~/.openclaw/skills/your-plugin-name'
});

console.log(result);
```

### 4. 添加自定义废弃API

```javascript
const checker = skills.get('plugin-compatibility-checker');
checker.addDeprecatedApis([
  'old.api.method',
  'another.deprecated.call'
]);
```

## 检查项说明

| 检查项 | 错误等级 | 说明 |
|--------|----------|------|
| 缺少 package.json | ❌ 错误 | 不符合OpenClaw插件规范，加载会失败 |
| 主入口文件不存在 | ❌ 错误 | 找不到入口文件，加载会失败 |
| 缺少 name/version | ⚠️ 警告 | 不影响加载，但不符合规范 |
| 使用废弃API | ⚠️ 警告 | 能运行，但升级后可能会出问题 |
| 不指定openclaw版本 | ⚠️ 警告 | 兼容性未知，建议指定 |

## 典型使用场景

- OpenClaw大版本升级前，批量检查所有已安装插件
- 发布自己开发的插件前，自我检查规范是否正确
- 排查插件加载失败问题，快速定位原因

## 开发原则

这个工具是应社区需求开发的：OpenClaw大版本升级后，很多旧插件都不能用了，用户不知道哪个好哪个坏，这个工具提前帮你查出来，避免升级后一堆报错再一个个排查。

实用优先，稳定第一，解决升级恐惧症。

## License

MIT License - 免费开源，可随意使用修改。
