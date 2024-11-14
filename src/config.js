class Config {
  constructor() {
    this.baseURL = "https://nodepay.org";
    this.ipCheckURL = "https://ipinfo.io/json";
    this.pingURL = "http://52.77.10.116/api/network/ping"; // 更新后的 PING URL
    this.retryInterval = 30000;
    this.sessionURL = "https://api.nodepay.ai/api/auth/session"; // 更新后的 SESSION URL
  }
}

module.exports = Config;
