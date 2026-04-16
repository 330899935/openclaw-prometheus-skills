/**
 * caa123-bidder-monitor - 中拍平台竞买人监控
 * 监控拍品新增竞买人，关键词匹配，及时推送提醒
 */

module.exports = {
  name: 'caa123-bidder-monitor',
  description: '中拍平台竞买人监控，关键词提醒，及时发现意向买家',
  version: '1.0.0',
  author: 'Prometheus',
  license: 'MIT',

  defaults: {
    checkInterval: 3600000, // 默认1小时检查一次
    keywords: [],          // 关键词列表，匹配竞买人名称
    apiEndpoint: 'https://www.caa123.org.cn',
    notifyOnMatch: true
  },

  /**
   * 获取当前拍品列表
   */
  async fetchLotList(page = 1) {
    const response = await fetch(`${this.defaults.apiEndpoint}/api/lots?page=${page}`);
    return await response.json();
  },

  /**
   * 获取拍品竞买人列表
   */
  async fetchBidders(lotId) {
    const response = await fetch(`${this.defaults.apiEndpoint}/api/lots/${lotId}/bidders`);
    return await response.json();
  },

  /**
   * 检查竞买人是否匹配关键词
   */
  matchKeywords(bidderName, keywords) {
    const lowerName = bidderName.toLowerCase();
    return keywords.filter(k => lowerName.includes(k.toLowerCase()));
  },

  /**
   * 检查新竞买人
   */
  async checkNewBidders(knownBidders = []) {
    const results = {
      newBidders: [],
      matched: [],
      timestamp: Date.now()
    };

    // 获取当前所有拍品
    const lots = await this.fetchLotList();
    
    for (const lot of lots) {
      const bidders = await this.fetchBidders(lot.id);
      
      for (const bidder of bidders) {
        if (!knownBidders.includes(bidder.id)) {
          results.newBidders.push({
            lotId: lot.id,
            lotName: lot.name,
            bidderId: bidder.id,
            bidderName: bidder.name,
            registerTime: bidder.registerTime
          });

          // 检查关键词匹配
          const matches = this.matchKeywords(bidder.name, this.defaults.keywords);
          if (matches.length > 0) {
            results.matched.push({
              ...results.newBidders[results.newBidders.length - 1],
              matchedKeywords: matches
            });
          }
        }
      }
    }

    return results;
  },

  /**
   * 保存已知竞买人ID
   */
  async saveKnownBidders(bidders) {
    const fs = require('fs').promises;
    const path = require('path');
    const savePath = path.join(process.env.HOME, '.openclaw', 'skills', 'caa123-bidder-monitor', 'known-bidders.json');
    await fs.writeFile(savePath, JSON.stringify(bidders, null, 2), 'utf8');
  },

  /**
   * 加载已知竞买人ID
   */
  async loadKnownBidders() {
    const fs = require('fs').promises;
    const path = require('path');
    const savePath = path.join(process.env.HOME, '.openclaw', 'skills', 'caa123-bidder-monitor', 'known-bidders.json');
    try {
      const data = await fs.readFile(savePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  /**
   * 发送匹配通知
   */
  sendNotification(matchedList) {
    if (!this.defaults.notifyOnMatch || matchedList.length === 0) return;

    const message = `🔔 中拍平台发现新匹配竞买人\n\n${matchedList.map(m => 
      `拍品: ${m.lotName}\n竞买人: ${m.bidderName}\n匹配关键词: ${m.matchedKeywords.join(', ')}`
    ).join('\n\n')}`;

    if (global.openclaw && openclaw.notify) {
      openclaw.notify({
        title: '中拍竞买人监控提醒',
        message,
        level: 'info'
      });
    }
  },

  /**
   * 启动监控
   */
  async startMonitor(options = {}) {
    this.config = { ...this.defaults, ...options };
    const knownBidders = await this.loadKnownBidders();

    this.intervalId = setInterval(async () => {
      const results = await this.checkNewBidders(knownBidders);
      
      if (results.newBidders.length > 0) {
        // 更新已知竞买人列表
        const newIds = results.newBidders.map(b => b.bidderId);
        this.saveKnownBidders([...knownBidders, ...newIds]);
        
        // 如果有关键词匹配，发送通知
        if (results.matched.length > 0) {
          this.sendNotification(results.matched);
        }
      }
    }, this.config.checkInterval);

    return {
      success: true,
      message: `中拍竞买人监控已启动，每 ${this.config.checkInterval / 1000 / 60} 分钟检查一次，关键词: ${this.config.keywords.join(', ') || '无'}`,
      foundNew: results.newBidders.length,
      matched: results.matched.length
    };
  },

  /**
   * 停止监控
   */
  stopMonitor() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      return { success: true, message: '中拍竞买人监控已停止' };
    }
    return { success: false, message: '监控未在运行' };
  },

  /**
   * 手动检查一次
   */
  async manualCheck() {
    const knownBidders = await this.loadKnownBidders();
    const results = await this.checkNewBidders(knownBidders);
    
    if (results.newBidders.length > 0) {
      const newIds = results.newBidders.map(b => b.bidderId);
      this.saveKnownBidders([...knownBidders, ...newIds]);
      
      if (results.matched.length > 0) {
        this.sendNotification(results.matched);
      }
    }

    return {
      success: true,
      newBidders: results.newBidders.length,
      matched: results.matched.length,
      details: results
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
      } else if (params.action === 'check') {
        return await this.manualCheck();
      } else {
        return { success: false, message: 'Unknown action. Use start/stop/check' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
