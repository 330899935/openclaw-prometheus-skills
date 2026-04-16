/**
 * skill-health-monitor - OpenClaw 技能健康监控器
 * 监控定时技能运行状态，故障自动告警，提醒用户处理
 */

module.exports = {
  name: 'skill-health-monitor',
  description: 'OpenClaw 技能健康监控器，监控定时技能运行状态，故障自动告警',
  version: '1.0.0',
  author: 'Prometheus',
  license: 'MIT',

  defaults: {
    checkInterval: 3600000, // 默认1小时检查一次
    maxStaleHours: 24,    // 超过多少小时没运行就算异常
    notifyOnFailure: true, // 发现异常是否通知
    monitoredSkills: []    // 要监控的技能列表 [{name: 'skill-name', lastRunKey: 'last-run-timestamp'}]
  },

  /**
   * 存储状态文件路径
   */
  getStatePath() {
    const path = require('path');
    return path.join(process.env.HOME, '.openclaw', 'skills', 'skill-health-monitor', 'health-state.json');
  },

  /**
   * 加载保存的状态
   */
  async loadState() {
    const fs = require('fs').promises;
    try {
      const data = await fs.readFile(this.getStatePath(), 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return {
        lastCheck: null,
        skills: {}
      };
    }
  },

  /**
   * 保存状态
   */
  async saveState(state) {
    const fs = require('fs').promises;
    await fs.writeFile(this.getStatePath(), JSON.stringify(state, null, 2), 'utf8');
  },

  /**
   * 检查技能是否健康
   */
  checkSkillHealth(skillConfig, currentTime) {
    const { name, lastRunKey, maxStaleHours } = skillConfig;
    const staleHours = maxStaleHours || this.defaults.maxStaleHours;
    const staleMs = staleHours * 3600 * 1000;

    // 获取存储的最后运行时间
    const lastRun = this.getLastRunTime(name);

    if (!lastRun) {
      return {
        name,
        healthy: false,
        status: 'never_run',
        message: `${name} 从未运行过，请检查配置`
      };
    }

    const timeSinceLastRun = currentTime - lastRun;
    if (timeSinceLastRun > staleMs) {
      const hours = (timeSinceLastRun / 3600 / 1000).toFixed(1);
      return {
        name,
        healthy: false,
        status: 'stale',
        hours: hours,
        message: `${name} 已经 ${hours} 小时没有正常运行，可能已故障`
      };
    }

    return {
      name,
      healthy: true,
      status: 'ok',
      lastRun: lastRun,
      message: `${name} 运行正常`
    };
  },

  /**
   * 获取技能最后运行时间
   */
  getLastRunTime(skillName) {
    // 优先从技能自己的存储获取，其次从我们自己的状态获取
    if (global.openclaw && openclaw.storage) {
      try {
        const stored = openclaw.storage.get(`skill-health-monitor:${skillName}:lastRun`);
        if (stored) return parseInt(stored, 10);
      } catch (e) {
        // ignore
      }
    }
    return null;
  },

  /**
   * 记录技能最后运行时间（供被监控技能调用）
   */
  recordRun(skillName) {
    const now = Date.now();
    if (global.openclaw && openclaw.storage) {
      openclaw.storage.set(`skill-health-monitor:${skillName}:lastRun`, now.toString());
    }
    return now;
  },

  /**
   * 发送告警通知
   */
  sendAlert(unhealthyList) {
    if (!this.defaults.notifyOnFailure || unhealthyList.length === 0) return;

    const message = `⚠️ 技能健康监控发现异常\n\n${unhealthy.map(r => r.message).join('\n')}\n\n请及时检查处理。`;

    if (global.openclaw && openclaw.notify) {
      openclaw.notify({
        title: '技能健康监控告警',
        message,
        level: 'warning'
      });
    }

    // 也可以输出到控制台
    console.warn('[skill-health-monitor] ALERT:', message);
  },

  /**
   * 执行一次全量检查
   */
  async runCheck(customSkills = null) {
    const currentTime = Date.now();
    const skillsToCheck = customSkills || this.defaults.monitoredSkills;
    const results = {
      timestamp: currentTime,
      total: skillsToCheck.length,
      healthy: 0,
      unhealthy: 0,
      results: []
    };

    for (const skill of skillsToCheck) {
      const checkResult = this.checkSkillHealth(skill, currentTime);
      results.results.push(checkResult);
      if (checkResult.healthy) {
        results.healthy++;
      } else {
        results.unhealthy++;
      }
    }

    // 保存检查时间
    const state = await this.loadState();
    state.lastCheck = currentTime;
    await this.saveState(state);

    // 如果有不健康的，发送通知
    const unhealthyList = results.results.filter(r => !r.healthy);
    if (unhealthyList.length > 0) {
      this.sendAlert(unhealthyList);
    }

    return results;
  },

  /**
   * 启动定时监控
   */
  async startMonitor(options = {}) {
    this.config = { ...this.defaults, ...options };

    // 立即执行第一次检查
    const firstResult = await this.runCheck();

    // 启动定时检查
    this.intervalId = setInterval(async () => {
      await this.runCheck();
    }, this.config.checkInterval);

    return {
      success: true,
      message: `技能健康监控已启动，每 ${this.config.checkInterval / 3600 / 1000} 小时检查一次，共监控 ${firstResult.total} 个技能`,
      firstResult
    };
  },

  /**
   * 停止监控
   */
  stopMonitor() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      return { success: true, message: '技能健康监控已停止' };
    }
    return { success: false, message: '监控未在运行' };
  },

  /**
   * 添加一个要监控的技能
   */
  addMonitoredSkill(skillConfig) {
    // skillConfig: { name, lastRunKey?, maxStaleHours? }
    if (!skillConfig.name) {
      return { success: false, message: '技能名称不能为空' };
    }
    const exists = this.defaults.monitoredSkills.find(s => s.name === skillConfig.name);
    if (exists) {
      return { success: false, message: `${skillConfig.name} 已经在监控列表中` };
    }
    this.defaults.monitoredSkills.push(skillConfig);
    return {
      success: true,
      message: `已添加 ${skillConfig.name} 到监控列表`,
      total: this.defaults.monitoredSkills.length
    };
  },

  /**
   * 从监控列表移除技能
   */
  removeMonitoredSkill(skillName) {
    const beforeLength = this.defaults.monitoredSkills.length;
    this.defaults.monitoredSkills = this.defaults.monitoredSkills.filter(s => s.name !== skillName);
    if (this.defaults.monitoredSkills.length === beforeLength) {
      return { success: false, message: `找不到技能 ${skillName}` };
    }
    return {
      success: true,
      message: `已移除 ${skillName} 从监控列表`,
      total: this.defaults.monitoredSkills.length
    };
  },

  /**
   * 列出所有监控的技能和当前状态
   */
  async listMonitored() {
    const currentTime = Date.now();
    const list = this.defaults.monitoredSkills.map(skill => {
      const check = this.checkSkillHealth(skill, currentTime);
      return {
        name: skill.name,
        maxStaleHours: skill.maxStaleHours || this.defaults.maxStaleHours,
        status: check.status,
        healthy: check.healthy,
        lastRun: check.lastRun ? new Date(check.lastRun).toISOString() : null
      };
    });

    return {
      success: true,
      total: list.length,
      healthy: list.filter(s => s.healthy).length,
      unhealthy: list.filter(s => !s.healthy).length,
      skills: list
    };
  },

  /**
   * 主入口
   */
  async run(params) {
    try {
      switch (params.action) {
        case 'start':
          return await this.startMonitor(params.options);
        case 'stop':
          return this.stopMonitor();
        case 'check':
          return await this.runCheck();
        case 'add':
          return this.addMonitoredSkill(params.skill);
        case 'remove':
          return this.removeMonitoredSkill(params.skillName);
        case 'list':
          return await this.listMonitored();
        case 'record':
          // 手动记录一次运行
          const now = this.recordRun(params.skillName);
          return {
            success: true,
            message: `已记录 ${params.skillName} 运行时间`,
            timestamp: now
          };
        default:
          return {
            success: false,
            message: 'Unknown action. Use start/stop/check/add/remove/list/record'
          };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
