/**
 * plugin-compatibility-checker - OpenClaw插件兼容性检查工具
 * 在升级OpenClaw版本前，检查已安装插件是否兼容，提前发现问题
 */

module.exports = {
  name: 'plugin-compatibility-checker',
  description: 'OpenClaw升级前插件兼容性检查，提前知道哪些插件会崩，避免升级后全线挂掉',
  version: '1.0.0',
  author: 'Prometheus',
  license: 'MIT',

  // 已知废弃API列表
  deprecatedApis: [
    'oldConfig.apiMethod',
    'oldSession.getContext',
    // 可继续添加
  ],

  /**
   * 检查单个插件
   */
  async checkPlugin(pluginPath) {
    const fs = require('fs').promises;
    const path = require('path');

    const results = {
      pluginName: path.basename(pluginPath),
      errors: [],
      warnings: [],
      passed: true
    };

    // 1. 检查package.json是否存在
    try {
      await fs.access(path.join(pluginPath, 'package.json'));
    } catch (e) {
      results.errors.push('❌ 缺少 package.json 文件，不符合OpenClaw插件规范');
      results.passed = false;
      return results;
    }

    // 2. 检查main入口文件是否存在
    const pkg = JSON.parse(await fs.readFile(path.join(pluginPath, 'package.json'), 'utf8'));
    const mainFile = pkg.main || 'index.js';
    try {
      await fs.access(path.join(pluginPath, mainFile));
    } catch (e) {
      results.errors.push(`❌ 主入口文件 ${mainFile} 不存在`);
      results.passed = false;
    }

    // 3. 检查package.json格式
    if (!pkg.name || !pkg.version) {
      results.warnings.push('⚠️ package.json 缺少 name 或 version 字段');
    }

    // 4. 检查main代码中是否使用废弃API
    try {
      const code = await fs.readFile(path.join(pluginPath, mainFile), 'utf8');
      this.checkDeprecatedApis(code, results);
    } catch (e) {
      results.errors.push(`❌ 无法读取主入口文件 ${mainFile}`);
      results.passed = false;
    }

    // 5. 检查peerDependencies
    if (!pkg.peerDependencies || !pkg.peerDependencies.openclaw) {
      results.warnings.push('⚠️ 未指定 openclaw  peerDependency，可能兼容性未知');
    }

    return results;
  },

  /**
   * 检查废弃API
   */
  checkDeprecatedApis(code, results) {
    for (const api of this.deprecatedApis) {
      if (code.includes(api)) {
        results.warnings.push(`⚠️ 代码中使用了废弃API: ${api}`);
      }
    }
  },

  /**
   * 检查所有已安装插件
   */
  async checkAllPlugins(skillsPath = '~/.openclaw/skills') {
    const fs = require('fs').promises;
    const path = require('path');
    const expandedPath = path.expand(skillsPath);
    
    const items = await fs.readdir(expandedPath);
    const results = [];

    for (const item of items) {
      const stat = await fs.stat(path.join(expandedPath, item));
      if (stat.isDirectory()) {
        // 检查是否是插件（有package.json）
        try {
          await fs.access(path.join(expandedPath, item, 'package.json'));
          const checkResult = await this.checkPlugin(path.join(expandedPath, item));
          results.push(checkResult);
        } catch (e) {
          // 不是插件，跳过
        }
      }
    }

    return this.generateReport(results);
  },

  /**
   * 生成分级报告
   */
  generateReport(results) {
    const report = {
      total: results.length,
      compatible: results.filter(r => r.passed && r.warnings.length === 0).length,
      warnings: results.filter(r => r.passed && r.warnings.length > 0).length,
      incompatible: results.filter(r => !r.passed).length,
      details: results,
      summary: ''
    };

    report.summary = `检查完成：共 ${report.total} 个插件\n✅ 完全兼容：${report.compatible}\n⚠️ 有警告：${report.warnings}\n❌ 不兼容：${report.incompatible}`;

    return report;
  },

  /**
   * 添加自定义废弃API
   */
  addDeprecatedApis(apis) {
    this.deprecatedApis.push(...apis);
  },

  /**
   * 主入口
   */
  async run(params) {
    try {
      if (params.pluginPath) {
        const result = await this.checkPlugin(params.pluginPath);
        return { success: true, result };
      } else {
        const report = await this.checkAllPlugins(params.skillsPath);
        return { success: true, report };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
