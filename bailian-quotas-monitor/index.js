/**
 * bailian-quotas-monitor - 阿里云百炼API额度监控
 * 监控百炼API调用额度，超过阈值自动告警
 */

module.exports = {
  name: 'bailian-quotas-monitor',
  description: '阿里云百炼API额度监控，80%/95%两级告警，避免超量限流',
  version: '1.0.0',
  author: 'Prometheus',
  license: 'MIT',

  /**
   * 检查百炼额度
   */
  async checkQuotas(options) {
    const { apiKey, aliyunConfig } = options;
    // 调用阿里云百炼API查询额度
    // 返回剩余额度和使用百分比
    const result = await this.fetchQuotas(apiKey, aliyunConfig);
    return this.evaluateAlerts(result);
  },

  /**
   * 获取额度数据
   */
  async fetchQuotas(apiKey, config) {
    // API调用逻辑
    const response = await fetch(`${config.endpoint}/v1/usage`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return await response.json();
  },

  /**
   * 判断是否需要告警
   */
  evaluateAlerts(result) {
    const { used, total } = result;
    const percentage = (used / total) * 100;
    
    if (percentage >= 95) {
      return { level: 'critical', percentage, message: `⚠️ 阿里云百炼额度已使用 ${percentage.toFixed(1)}%，即将耗尽！` };
    } else if (percentage >= 80) {
      return { level: 'warning', percentage, message: `⚠️ 阿里云百炼额度已使用 ${percentage.toFixed(1)}%，请注意控制用量` };
    }
    return { level: 'ok', percentage, message: `✅ 阿里云百炼额度正常，已使用 ${percentage.toFixed(1)}%` };
  },

  /**
   * 主入口
   */
  async run(params) {
    try {
      const result = await this.checkQuotas(params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
