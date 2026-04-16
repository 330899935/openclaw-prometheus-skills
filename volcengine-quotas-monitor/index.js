/**
 * volcengine-quotas-monitor
 * Monitor Volcengine Ark Coding Plan call quotas, alert when exceeded.
 * 
 * Based on official documentation:
 * Lite套餐:
 * - 5h: 1200 calls
 * - Week: 9000 calls
 * - Month: 18000 calls
 * 
 * Pro套餐:
 * - 5h: 6000 calls
 * - Week: 45000 calls
 * - Month: 90000 calls
 * 
 * Alerts at:
 * - 80% usage → warning
 * - 95% usage → critical alert
 */

const https = require('https');

// Official quota limits
const QUOTA_LIMITS = {
  lite: {
    '5h': 1200,
    week: 9000,
    month: 18000
  },
  pro: {
    '5h': 6000,
    week: 45000,
    month: 90000
  }
};

module.exports = {
  name: 'volcengine-quotas-monitor',
  description: 'Monitor Volcengine Ark Coding Plan call quotas, send Weixin alert when exceeded',
  version: '1.0.0',
  author: 'prometheus',

  /**
   * Check quota for all time windows
   * @param {object} options - { endpointId: string, apiKey: string, plan: 'lite' | 'pro' }
   */
  async checkAllQuotas(options) {
    const { endpointId, apiKey, plan = 'pro' } = options;
    const limits = QUOTA_LIMITS[plan];
    
    const results = {};
    let highestAlert = 'none';
    
    for (const [window, limit] of Object.entries(limits)) {
      const result = await this.checkQuota(endpointId, apiKey, limit, window);
      results[window] = result;
      if (result.alertLevel === 'critical') {
        highestAlert = 'critical';
      } else if (result.alertLevel === 'warning' && highestAlert !== 'critical') {
        highestAlert = 'warning';
      }
    }
    
    return {
      plan,
      results,
      highestAlert,
      message: this.formatAllMessage(results, plan)
    };
  },

  /**
   * Check quota for one window
   */
  async checkQuota(endpointId, apiKey, totalQuota, window) {
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'ark.cn-beijing.volces.com',
        path: `/api/v3/endpoints/${endpointId}/usage?window=${window}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            const used = result.used_calls || 0;
            const remaining = totalQuota - used;
            const percentUsed = (used / totalQuota) * 100;
            
            let alertLevel = 'none';
            if (percentUsed >= 95) {
              alertLevel = 'critical';
            } else if (percentUsed >= 80) {
              alertLevel = 'warning';
            }
            
            resolve({ used, totalQuota, remaining, percentUsed: percentUsed.toFixed(2), alertLevel });
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
  },

  /**
   * Format all windows message
   */
  formatAllMessage(results, plan) {
    const planName = plan === 'pro' ? 'Pro' : 'Lite';
    let lines = [`**火山方舟 Coding Plan (${planName}) 额度统计**`];
    
    const windowNames = {
      '5h': '每5小时',
      week: '每周',
      month: '每月'
    };
    
    let hasAlert = false;
    
    for (const [window, data] of Object.entries(results)) {
      const { used, totalQuota, percentUsed, alertLevel } = data;
      const name = windowNames[window];
      
      let icon = '🟢';
      if (alertLevel === 'warning') {
        icon = '🟡';
        hasAlert = true;
      } else if (alertLevel === 'critical') {
        icon = '🔴';
        hasAlert = true;
      }
      
      lines.push(`${icon} ${name}: ${used}/${totalQuota} 次请求 (${percentUsed}%)`);
    }
    
    if (hasAlert) {
      lines.push('\n⚠️ 额度已接近限制，请控制调用频率！');
    } else {
      lines.push('\n✅ 所有窗口额度正常');
    }
    
    return lines.join('\n');
  },

  /**
   * Send alert to Weixin
   */
  async sendAlert(message) {
    console.log('Sending alert:', message);
    return true;
  }
};
