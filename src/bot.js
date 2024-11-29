const axios = require('axios'); 
const crypto = require('crypto'); 
const ProxyChecker = require('./proxyChecker'); 

class Bot {
  constructor(config, logger) {
    this.config = config; 
    this.logger = logger; 
    this.proxyCheck = new ProxyChecker(config, logger); 
  }

  
  async connect(token, proxy = null) {
    try {
      const userAgent = 'Mozilla/5.0 ... Safari/537.3'; // 设置 User-Agent
      const accountInfo = await this.getSession(token, userAgent, proxy); // 获取会话信息

      console.log(`✅ ${'已连接会话'.green}，UID: ${accountInfo.uid}`);
      this.logger.info('会话信息', {
        uid: accountInfo.uid,
        name: accountInfo.name,
        useProxy: !!proxy,
      });

      console.log('');

    
      const interval = setInterval(async () => {
        try {
          await this.sendPing(accountInfo, token, userAgent, proxy);
        } catch (error) {
          console.log(`❌ ${'心跳错误'.red}: ${error.message}`);
          this.logger.error('心跳错误', { error: error.message });
        }
      }, this.config.retryInterval);

     
      if (!process.listenerCount('SIGINT')) {
        process.once('SIGINT', () => {
          clearInterval(interval);
          console.log('\n👋 正在关闭...');
        });
      }
    } catch (error) {
      console.log(`❌ ${'连接错误'.red}: ${error.message}`);
      this.logger.error('连接错误', { error: error.message, proxy });
    }
  }

 
  async getSession(token, userAgent, proxy) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
      };

      if (proxy) {
        config.proxy = this.buildProxyConfig(proxy); 
      }

      const response = await axios.post(this.config.sessionURL, {}, config);
      return response.data.data; // 返回会话数据
    } catch (error) {
      throw new Error('会话请求失败');
    }
  }

  
  async sendPing(accountInfo, token, userAgent, proxy) {
    const uid = accountInfo.uid || crypto.randomBytes(8).toString('hex'); 
    const browserId =
      accountInfo.browser_id || crypto.randomBytes(8).toString('hex'); 

    const pingData = {
      id: uid,
      browser_id: browserId,
      timestamp: Math.floor(Date.now() / 1000), 
      version: '2.2.7',
    };

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
      };

      if (proxy) {
        config.proxy = this.buildProxyConfig(proxy); 
      }

      await axios.post(this.config.pingURL, pingData, config);
      console.log(`📡 ${'已发送心跳'.cyan}，UID: ${uid}`);
      this.logger.info('已发送心跳', {
        uid,
        browserId,
        ip: proxy ? proxy.host : 'direct',
      });
    } catch (error) {
      throw new Error('心跳请求失败');
    }
  }

  
  buildProxyConfig(proxy) {
    return proxy && proxy.host
      ? {
          host: proxy.host,
          port: parseInt(proxy.port),
          auth:
            proxy.username && proxy.password
              ? { username: proxy.username, password: proxy.password }
              : undefined,
        }
      : undefined;
  }
}

module.exports = Bot; 

