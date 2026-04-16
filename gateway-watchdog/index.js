/**
 * gateway-watchdog - OpenClaw网关看门狗
 * 监控网关进程，如果宕机了自动重启，保证服务可用性
 */

module.exports = {
  name: 'gateway-watchdog',
  description: 'OpenClaw网关看门狗，监控网关进程，宕机自动重启',
  version: '1.0.0',
  author: 'Prometheus',
  license: 'MIT',

  defaults: {
    checkInterval: 30000, // 30秒检查一次
    maxRestarts: 5,      // 最多重启次数，防止死循环
    restartCommand: 'openclaw gateway restart',
    notifyOnRestart: true
  },

  /**
   * 检查网关是否运行
   */
  async isGatewayRunning() {
    const { execSync } = require('child_process');
    try {
      // 检查进程是否存在
      const output = execSync('pgrep -f "openclaw gateway"', { encoding: 'utf8' });
      return output.trim().split('\n').length > 0;
    } catch (e) {
      // pgrep返回非0就是没找到进程
      return false;
    }
  },

  /**
   * 重启网关
   */
  async restartGateway() {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec(this.defaults.restartCommand, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true, stdout, stderr });
        }
      });
    });
  },

  /**
   * 启动监控
   */
  async startMonitor(options = {}) {
    const config = { ...this.defaults, ...options };
    let restartCount = 0;

    this.intervalId = setInterval(async () => {
      const running = await this.isGatewayRunning();
      
      if (!running) {
        if (restartCount >= config.maxRestarts) {
          console.error(`❌ 网关宕机，已重启 ${restartCount} 次仍未恢复，停止自动重启`);
          clearInterval(this.intervalId);
          this.notify(`网关宕机，已重启 ${restartCount} 次仍未恢复，请人工检查`, 'critical');
          return;
        }

        restartCount++;
        console.warn(`⚠️ 网关未运行，正在第 ${restartCount} 次尝试重启...`);
        
        if (config.notifyOnRestart) {
          this.notify(`网关宕机，正在尝试第 ${restartCount} 次重启...`, 'warning');
        }

        const result = await this.restartGateway();
        
        if (result.success) {
          console.log(`✅ 网关重启成功`);
        } else {
          console.error(`❌ 网关重启失败: ${result.error}`);
        }
      }
    }, config.checkInterval);

    return {
      success: true,
      message: `网关看门狗已启动，每 ${config.checkInterval / 1000} 秒检查一次，最多重启 ${config.maxRestarts} 次`
    };
  },

  /**
   * 停止监控
   */
  stopMonitor() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      return { success: true, message: '网关看门狗已停止' };
    }
    return { success: false, message: '监控未在运行' };
  },

  /**
   * 发送通知
   */
  notify(message, level) {
    // 调用OpenClaw通知系统发送告警
    if (global.openclaw && openclaw.notify) {
      openclaw.notify({
        title: '网关看门狗告警',
        message,
        level
      });
    }
  },

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      running: !!this.intervalId,
      isGatewayRunning: this.isGatewayRunning()
    };
  },

  /**
   * 主入口
   */
  async run(params) {
    try {
      if (params.action === 'start') {
        return await this.startMonitor(params.options);
      } else if (params.action === 'stop') {
        return this.stopMonitor();
      } else if (params.action === 'status') {
        return { success: true, status: this.getStatus() };
      } else if (params.action === 'check') {
        const running = await this.isGatewayRunning();
        return { success: true, running };
      } else {
        return { success: false, message: 'Unknown action. Use start/stop/status/check' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
