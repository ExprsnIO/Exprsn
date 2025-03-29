// Description: This script checks for the installation and status of LDAP and Kerberos services on Linux, macOS, and Windows.
// It gathers information about the services, including their installation status, running status, default ports, and URLs.
// It also collects system information such as the platform, hostname, OS type, and release version.

const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Function to check if a package is installed (for Linux)
function isPackageInstalled(packageName) {
  if (process.platform === 'linux') {
    // Try apt (Debian/Ubuntu)
    const aptResult = safeExec(`dpkg -l | grep -i ${packageName}`);
    if (aptResult) return true;
    
    // Try rpm (RHEL/CentOS/Fedora)
    const rpmResult = safeExec(`rpm -qa | grep -i ${packageName}`);
    if (rpmResult) return true;
    
    // Try pacman (Arch)
    const pacmanResult = safeExec(`pacman -Qs ${packageName}`);
    if (pacmanResult) return true;
  } else if (process.platform === 'darwin') {
    // For macOS, check using brew
    const brewResult = safeExec(`brew list | grep -i ${packageName}`);
    return !!brewResult;
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
    'slapd': 389,         // OpenLDAP server
    'ldap': 389,          // LDAP
    'kerberos': 88,       // Kerberos
    'krb5kdc': 88,        // Kerberos KDC
    'kadmind': 749        // Kerberos admin server
  };
  
  // Return default port if known
  if (defaultPorts[serviceName]) {
    return defaultPorts[serviceName];
  }
  
  return null;
}

// Function to detect PAM modules
function detectPamModules() {
  const pamModules = {};
  
  if (process.platform === 'linux') {
    // Check common PAM configuration files
    const pamDirPath = '/etc/pam.d';
    
    if (fs.existsSync(pamDirPath)) {
      try {
        const files = fs.readdirSync(pamDirPath);
        
        // Common important PAM services
        const keyServices = ['common-auth', 'system-auth', 'password-auth', 'sshd', 'login', 'sudo'];
        
        for (const service of keyServices) {
          if (files.includes(service)) {
            const filePath = path.join(pamDirPath, service);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Extract PAM modules used
            const modules = [];
            const lines = content.split('\n');
            
            for (const line of lines) {
              // Skip comments and empty lines
              if (line.trim().startsWith('#') || !line.trim()) continue;
              
              // Extract module name (typically the first non-whitespace word after "auth", "account", "password", or "session")
              const match = line.match(/^\s*(auth|account|password|session)\s+[^\s]+\s+([^\s]+)/);
              if (match && match[2]) {
                const module = match[2].replace('pam_', ''); // Remove 'pam_' prefix for cleaner display
                if (!modules.includes(module)) {
                  modules.push(module);
                }
              }
            }
            
            // Add to results
            pamModules[service] = {
              exists: true,
              modules: modules
            };
          } else {
            pamModules[service] = {
              exists: false,
              modules: []
            };
          }
        }
      } catch (error) {
        console.error('Error reading PAM directory:', error.message);
      }
    }
  } else if (process.platform === 'darwin') {
    // macOS uses OpenDirectory and DirectoryService
    pamModules['OpenDirectory'] = {
      exists: isInstalled('dscl'),
      modules: []
    };
  } else if (process.platform === 'win32') {
    // Windows doesn't use PAM
    pamModules['windows_auth'] = {
      exists: true,
      modules: ['NTLM', 'Kerberos']
    };
  }
  
  return pamModules;
}

// Main function to gather all information
function gatherAuthInfo() {
  // Check for LDAP services
  const ldapServices = {
    'openldap': {
      installed: isPackageInstalled('openldap') || isInstalled('slapd'),
      running: isRunning('slapd'),
      port: 389,
      url: 'ldap://localhost:389',
    },
    'sssd': {
      installed: isPackageInstalled('sssd') || isInstalled('sssd'),
      running: isRunning('sssd'),
    },
    '389ds': {
      installed: isPackageInstalled('389-ds') || isInstalled('ns-slapd'),
      running: isRunning('dirsrv'),
      port: 389,
      url: 'ldap://localhost:389',
    }
  };
  
  // Check for Kerberos services
  const kerberosServices = {
    'krb5kdc': {
      installed: isPackageInstalled('krb5-server') || isInstalled('krb5kdc'),
      running: isRunning('krb5kdc'),
      port: 88,
      url: 'kerberos://localhost:88',
    },
    'kadmind': {
      installed: isPackageInstalled('krb5-server') || isInstalled('kadmind'),
      running: isRunning('kadmind'),
      port: 749,
      url: 'kerberos://localhost:749',
    }
  };
  
  // Detect PAM authentication modules
  const pamModules = detectPamModules();
  
  // Add status to each service
  for (const services of [ldapServices, kerberosServices]) {
    for (const [name, info] of Object.entries(services)) {
      // Determine status text
      if (!info.installed) {
        info.status = 'not installed';
      } else if (!info.running) {
        info.status = 'not running';
      } else {
        info.status = 'running';
      }
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
    services: {
      ldap: ldapServices,
      kerberos: kerberosServices
    },
    authentication: {
      pam: pamModules
    }
  };
  
  return result;
}

// Execute and print results
const authInfo = gatherAuthInfo();
console.log(JSON.stringify(authInfo, null, 2));