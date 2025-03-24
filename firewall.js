const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class RakshaWall {
  constructor(config) {
    this.rules = config.rules || [];
    this.logPath = config.logPath || path.join(__dirname, 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }
  }

  // Add a rule to Windows Firewall
  addBlockRule(name, ipAddress) {
    const command = `netsh advfirewall firewall add rule name="${name}" dir=in action=block remoteip=${ipAddress}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logActivity(`Failed to add rule ${name}: ${error.message}`);
          reject(error);
          return;
        }
        
        this.rules.push({
          id: Date.now(),
          name,
          ipAddress,
          type: 'block',
          enabled: true
        });
        
        this.logActivity(`Added rule to block ${ipAddress} with name ${name}`);
        resolve(stdout);
      });
    });
  }

  // Remove a rule from Windows Firewall
  removeRule(name) {
    const command = `netsh advfirewall firewall delete rule name="${name}"`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logActivity(`Failed to remove rule ${name}: ${error.message}`);
          reject(error);
          return;
        }
        
        this.rules = this.rules.filter(rule => rule.name !== name);
        this.logActivity(`Removed rule ${name}`);
        resolve(stdout);
      });
    });
  }

  // Get active connections
  getActiveConnections() {
    return new Promise((resolve, reject) => {
      exec('netstat -ano', (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        
        const connections = this.parseNetstatOutput(stdout);
        resolve(connections);
      });
    });
  }

  parseNetstatOutput(output) {
    // Parse the netstat output into a structured format
    const lines = output.split('\n').slice(4); // Skip header lines
    
    return lines
      .filter(line => line.trim().length > 0)
      .map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          return {
            protocol: parts[0],
            localAddress: parts[1],
            foreignAddress: parts[2],
            state: parts[3],
            pid: parts[4]
          };
        }
        return null;
      })
      .filter(conn => conn !== null);
  }

  // Log firewall activity
  logActivity(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    fs.appendFileSync(
      path.join(this.logPath, 'firewall-activity.log'),
      logEntry
    );
    
    console.log(message);
  }

  // Export current rules to JSON
  exportRules() {
    return this.rules;
  }

  // Import rules from JSON
  importRules(rules) {
    const promises = [];
    
    // Clear existing rules first
    this.rules.forEach(rule => {
      promises.push(this.removeRule(rule.name));
    });
    
    // Add new rules
    rules.forEach(rule => {
      promises.push(this.addBlockRule(rule.name, rule.ipAddress));
    });
    
    return Promise.all(promises);
  }
}

module.exports = RakshaWall;