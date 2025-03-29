// Description: This script checks the installation and running status of mail services (Dovecot and Sendmail) on a system.
// It gathers information about the services, including their installation status, running status, default ports, and URLs.
// It also collects system information such as the platform, hostname, OS type, and release version.

const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');

// Function to safely execute shell commands
function safeExec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return '';
  }
}

// Function to check if a service is installed
function isInstalled(serviceName) {
  // Different check methods based on platform
  if (process.platform === 'linux') {
    // Check using which command
    const whichResult = safeExec(`which ${serviceName}`);
    if (whichResult) return true;
    
    // Check common binary locations
    const commonPaths = [
      `/usr/bin/${serviceName}`,
      `/usr/sbin/${serviceName}`,
      `/usr/local/bin/${serviceName}`,
      `/usr/local/sbin/${serviceName}`
    ];
    
    return commonPaths.some(path => fs.existsSync(path));
  } else if (process.platform === 'darwin') {
    // For macOS, check using both which and brew
    const whichResult = safeExec(`which ${serviceName}`);
    if (whichResult) return true;
    
    const brewResult = safeExec(`brew list | grep -i ${serviceName}`);
    return !!brewResult;
  } else if (process.platform === 'win32') {
    // For Windows, limited checking capabilities
    const whereResult = safeExec(`where ${serviceName}`);
    return !!whereResult;
  }
  
  return false;
}

// Function to check if a service is running
function isRunning(serviceName) {
  if (process.platform === 'linux') {
    // Try systemctl first
    const systemctlResult = safeExec(`systemctl is-active ${serviceName}`);
    if (systemctlResult === 'active') return true;
    
    // Try service command
    const serviceResult = safeExec(`service ${serviceName} status | grep -i running`);
    if (serviceResult) return true;
    
    // Check process list
    const psResult = safeExec(`ps aux | grep -v grep | grep -i ${serviceName}`);
    return !!psResult;
  } else if (process.platform === 'darwin') {
    // For macOS
    const launchctlResult = safeExec(`launchctl list | grep ${serviceName}`);
    if (launchctlResult) return true;
    
    // Check process list
    const psResult = safeExec(`ps aux | grep -v grep | grep -i ${serviceName}`);
    return !!psResult;
  } else if (process.platform === 'win32') {
    // For Windows
    const scResult = safeExec(`sc query ${serviceName} | find "RUNNING"`);
    return !!scResult;
  }
  
  return false;
}

// Function to get the port for a service
function getPort(serviceName) {
  // Default ports for common services
  const defaultPorts = {
    'dovecot': { pop3: 110, imap: 143 },
    'sendmail': 25
  };
  
  // Return default port if known
  if (defaultPorts[serviceName]) {
    return typeof defaultPorts[serviceName] === 'object' 
      ? defaultPorts[serviceName] 
      : defaultPorts[serviceName];
  }
  
  return null;
}

// Function to get service URL
function getServiceUrl(serviceName, port) {
  if (typeof port === 'object') {
    // For services with multiple protocols/ports
    const urls = {};
    for (const [protocol, portNum] of Object.entries(port)) {
      urls[protocol] = `${protocol}://localhost:${portNum}`;
    }
    return urls;
  }
  
  // For single protocol services
  return `${serviceName}://localhost:${port}`;
}

// Main function to gather all information
function gatherSystemInfo() {
  const services = {
    'dovecot': {
      installed: isInstalled('dovecot'),
      running: isRunning('dovecot'),
    },
    'sendmail': {
      installed: isInstalled('sendmail'),
      running: isRunning('sendmail'),
    }
  };
  
  // Add ports and URLs to services
  for (const [name, info] of Object.entries(services)) {
    const port = getPort(name);
    info.port = port;
    
    if (port) {
      info.url = getServiceUrl(name, port);
    }
    
    // Determine status text
    if (!info.installed) {
      info.status = 'not installed';
    } else if (!info.running) {
      info.status = 'not running';
    } else {
      info.status = 'running';
    }
  }
  
  // Create final JSON structure
  const result = {
    system: {
      platform: process.platform,
      hostname: os.hostname(),
      osType: os.type(),
      osRelease: os.release(),
      timestamp: new Date().toISOString()
    },
    services: services
  };
  
  return result;
}

// Execute and print results
const systemInfo = gatherSystemInfo();
console.log(JSON.stringify(systemInfo, null, 2));