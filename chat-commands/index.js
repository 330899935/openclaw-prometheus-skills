/**
 * chat-commands
 * Useful shortcut commands for AI chat conversation management.
 * 
 * Commands:
 * /new - Start new conversation (clear context, save tokens)
 * /reset - Reset conversation context
 * /compact - Compact and summarize context to save tokens
 * /summary - Summarize current conversation
 * /clear - Clear entire conversation history
 * /continue - Continue last truncated response
 * /regenerate - Regenerate last response
 * /retry - Alias for regenerate
 * /help - Show help message
 * /undo - Undo last change
 * /save - Save current conversation
 * /load <id> - Load saved conversation
 * /role <role-name> - Switch to saved role
 * /temp <value> - Set temperature
 * /maxtokens <value> - Set max output tokens
 */

module.exports = {
  name: 'chat-commands',
  description: 'Useful shortcut commands for AI chat conversation management, save tokens and improve efficiency',
  version: '1.0.0',
  author: 'prometheus',

  commands: {
    '/new': {
      description: 'Start a brand new conversation, clear all context to save tokens',
      handler: this.startNew
    },
    '/reset': {
      description: 'Reset conversation context, keep conversation history but clear context window',
      handler: this.resetContext
    },
    '/compact': {
      description: 'Compact and summarize current conversation to reduce token usage',
      handler: this.compactContext
    },
    '/summary': {
      description: 'Get a concise summary of current conversation',
      handler: this.summary
    },
    '/clear': {
      description: 'Completely clear all conversation history',
      handler: this.clearHistory
    },
    '/continue': {
      description: 'Continue the last truncated response',
      handler: this.continue
    },
    '/regenerate': {
      description: 'Regenerate the last response',
      handler: this.regenerate
    },
    '/retry': {
      description: 'Alias for /regenerate',
      handler: this.regenerate
    },
    '/help': {
      description: 'Show this help message',
      handler: this.showHelp
    },
    '/undo': {
      description: 'Undo the last change/command',
      handler: this.undo
    },
    '/save': {
      description: 'Save current conversation to disk',
      handler: this.saveConversation
    },
    '/load': {
      description: 'Load a saved conversation by ID',
      handler: this.loadConversation
    },
    '/role': {
      description: 'Switch to a saved role: /role <role-name>',
      handler: this.switchRole
    },
    '/temp': {
      description: 'Set generation temperature: /temp <0.0-1.0>',
      handler: this.setTemperature
    },
    '/maxtokens': {
      description: 'Set max output tokens: /maxtokens <number>',
      handler: this.setMaxTokens
    }
  },

  /**
   * Start new conversation
   */
  async startNew(options) {
    const { session } = options;
    session.clearContext();
    return {
      success: true,
      message: '✅ 已开启全新对话，上下文已清空，节省Token'
    };
  },

  /**
   * Reset context
   */
  async resetContext(options) {
    const { session } = options;
    session.resetContext();
    return {
      success: true,
      message: '✅ 已重置对话上下文，历史保留但清空窗口'
    };
  },

  /**
   * Compact context
   */
  async compactContext(options, { ai }) {
    const { session } = options;
    const history = session.getHistory();
    
    const prompt = `请压缩总结以下对话历史，保留关键信息和上下文，去掉冗余内容：\n\n${JSON.stringify(history)}`;
    const summary = await ai.completion(prompt);
    
    session.setCompactedContext(summary);
    
    const originalTokens = session.estimateTokens();
    const compressedTokens = session.estimateTokens();
    
    const saved = originalTokens - compressedTokens;
    
    return {
      success: true,
      message: `✅ 上下文压缩完成\n原始Token: ${originalTokens}\n压缩后Token: ${compressedTokens}\n节省了: ${saved} Tokens 💾`
    };
  },

  /**
   * Summarize current conversation
   */
  async summary(options, { ai }) {
    const { session } = options;
    const history = session.getHistory();
    
    const prompt = `请总结以下对话的主要内容：\n\n${JSON.stringify(history)}`;
    const summary = await ai.completion(prompt);
    
    return {
      success: true,
      summary: summary,
      message: `📝 当前对话总结：\n\n${summary}`
    };
  },

  /**
   * Clear all history
   */
  async clearHistory(options) {
    const { session } = options;
    session.clearHistory();
    return {
      success: true,
      message: '✅ 已清空所有对话历史'
    };
  },

  /**
   * Continue truncated response
   */
  async continue(options, { ai }) {
    const { session } = options;
    const lastMessage = session.getLastMessage();
    
    const prompt = `${lastMessage.content}\n\n请继续完成你被截断的回答。`;
    const continuation = await ai.completion(prompt);
    
    session.appendToLastMessage(continuation);
    
    return {
      success: true,
      message: `✅ 已继续回答：\n\n${continuation}`
    };
  },

  /**
   * Regenerate last response
   */
  async regenerate(options, { ai }) {
    const { session } = options;
    const lastUserMessage = session.getLastUserMessage();
    session.removeLastResponse();
    
    const newResponse = await ai.completion(lastUserMessage.content);
    session.addResponse(newResponse);
    
    return {
      success: true,
      message: `✅ 已重新生成回答：\n\n${newResponse}`
    };
  },

  /**
   * Show help
   */
  async showHelp() {
    let lines = ['**📋 可用对话命令列表：**'];
    
    for (const [cmd, info] of Object.entries(this.commands)) {
      lines.push(`- \`${cmd}\` - ${info.description}`);
    }
    
    lines.push('\n💡 使用提示：常用 `/new` 开新对话、`/compact` 压缩上下文可以有效节省Token，控制额度消耗');
    
    return {
      success: true,
      message: lines.join('\n')
    };
  },

  /**
   * Undo last command
   */
  async undo(options) {
    const { session } = options;
    const undone = session.undoLastChange();
    
    if (undone) {
      return {
        success: true,
        message: '✅ 已撤销上一步操作'
      };
    } else {
      return {
        success: false,
        message: '❌ 没有可撤销的操作'
      };
    }
  },

  /**
   * Save conversation
   */
  async saveConversation(options, { fs }) {
    const { session } = options;
    const history = session.getHistory();
    const saveId = Date.now().toString();
    
    await fs.writeJson(`~/.openclaw/saved-conversations/${saveId}.json`, history);
    
    return {
      success: true,
      message: `✅ 对话已保存，ID: \`${saveId}\`，使用 /load ${saveId} 加载`
    };
  },

  /**
   * Load conversation
   */
  async loadConversation(options, { fs }) {
    const { session, args } = options;
    const saveId = args[0];
    
    if (!saveId) {
      return {
        success: false,
        message: '❌ 请提供对话ID：/load <id>'
      };
    }
    
    try {
      const history = await fs.readJson(`~/.openclaw/saved-conversations/${saveId}.json`);
      session.setHistory(history);
      
      return {
        success: true,
        message: `✅ 已加载对话 ${saveId}，共 ${history.length} 条消息`
      };
    } catch (e) {
      return {
        success: false,
        message: `❌ 加载失败：${e.message}`
      };
    }
  },

  /**
   * Switch role
   */
  async switchRole(options, { session, config }) {
    const { args } = options;
    const roleName = args.join(' ');
    
    if (!roleName) {
      return {
        success: false,
        message: '❌ 请提供角色名称：/role <role-name>'
      };
    }
    
    const roles = config.get('saved-roles', {});
    const role = roles[roleName];
    
    if (!role) {
      return {
        success: false,
        message: `❌ 找不到角色 "${roleName}"，请先保存`
      };
    }
    
    session.setSystemPrompt(role.prompt);
    
    return {
      success: true,
      message: `✅ 已切换到角色：**${roleName}**\n${role.description ? role.description : ''}`
    };
  },

  /**
   * Set temperature
   */
  async setTemperature(options, { session, args }) {
    const temp = parseFloat(args[0]);
    
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return {
        success: false,
        message: '❌ 温度必须在 0.0 - 2.0 之间'
      };
    }
    
    session.setGenerationConfig({ temperature: temp });
    
    return {
      success: true,
      message: `✅ 温度已设置为：${temp}`
    };
  },

  /**
   * Set max tokens
   */
  async setMaxTokens(options, { session, args }) {
    const max = parseInt(args[0]);
    
    if (isNaN(max) || max <= 0) {
      return {
        success: false,
        message: '❌ 最大Token数必须大于 0'
      };
    }
    
    session.setGenerationConfig({ maxTokens: max });
    
    return {
      success: true,
      message: `✅ 最大输出Token已设置为：${max}`
    };
  },

  /**
   * Main entry
   */
  async run(command, options = {}, context = {}) {
    const [cmdName, ...args] = command.trim().split(/\s+/);
    
    const commandObj = this.commands[cmdName.toLowerCase()];
    
    if (!commandObj) {
      return {
        success: false,
        message: `❌ 未知命令 "${cmdName}"，输入 /help 查看所有可用命令`
      };
    }
    
    options.args = args;
    return commandObj.handler.call(this, options, context);
  }
};
