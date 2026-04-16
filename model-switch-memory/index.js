/**
 * model-switch-memory - 模型切换记忆保留工具
 * 保存用户习惯、助手风格、对话默契，切换模型后一键恢复
 */

module.exports = {
  name: 'model-switch-memory',
  description: '模型切换记忆保留，保存用户习惯、助手风格、共同默契，换模型不用重新磨合',
  version: '1.0.0',
  author: 'Prometheus',
  license: 'MIT',

  /**
   * 保存当前记忆
   */
  async saveMemory(options) {
    const { context, preferences, summary } = options;
    const memory = {
      timestamp: Date.now(),
      model: options.currentModel,
      preferences,
      summary,
      context: context || []
    };
    
    await this.saveToDisk(memory);
    return { success: true, message: '记忆已保存' };
  },

  /**
   * 加载记忆到当前会话
   */
  async loadMemory(options) {
    const memory = await this.loadFromDisk();
    if (!memory) {
      return { success: false, message: '未找到保存的记忆' };
    }
    
    // 将记忆注入当前会话
    return {
      success: true,
      memory: {
        preferences: memory.preferences,
        summary: memory.summary,
        lastModel: memory.model,
        savedAt: memory.timestamp
      },
      message: `✅ 成功加载 ${memory.timestamp.toLocaleString()} 保存的记忆，来自模型 ${memory.model}`
    };
  },

  /**
   * 保存到磁盘
   */
  async saveToDisk(memory) {
    const fs = require('fs').promises;
    const path = require('path');
    const savePath = path.join(process.env.HOME, '.openclaw', 'skills', 'model-switch-memory', 'saved-memory.json');
    await fs.writeFile(savePath, JSON.stringify(memory, null, 2), 'utf8');
  },

  /**
   * 从磁盘加载
   */
  async loadFromDisk() {
    const fs = require('fs').promises;
    const path = require('path');
    const savePath = path.join(process.env.HOME, '.openclaw', 'skills', 'model-switch-memory', 'saved-memory.json');
    try {
      const data = await fs.readFile(savePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  /**
   * 提取当前会话默契摘要
   */
  async extractSummary(context) {
    // 提取用户偏好、风格约定等核心默契
    // 返回摘要文本
    const summary = this.summarizeContext(context);
    return summary;
  },

  /**
   * 主入口
   */
  async run(params) {
    try {
      if (params.action === 'save') {
        return await this.saveMemory(params);
      } else if (params.action === 'load') {
        return await this.loadMemory(params);
      } else {
        return { success: false, message: 'Unknown action. Use "save" or "load"' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
