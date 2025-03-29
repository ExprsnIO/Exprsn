// Description: This script detects various network services and their statuses on a system.
// including HTTP servers, SSL/TLS tools, VPN servers, DNS services, DHCP services,
// file transfer services, and storage services.

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
    'http': 80,
    'https': 443,
    'apache2': 80,
    'httpd': 80,
    'nginx': 80,
    'ssh': 22,
    'sshd': 22,
    'ftp': 21,
    'sftp': 22,
    'vsftpd': 21,
    'dns': 53,
    'named': 53,
    'bind': 53,
    'dnsmasq': 53,
    'dhcp': 67,
    'dhcpd': 67,
    'dnsmasq-dhcp': 67,
    'openvpn': 1194,
    'samba': 445,
    'smbd': 445,
    'nfs': 2049
  };
  
  return defaultPorts[serviceName] || null;
}

// Function to detect HTTP servers
function detectHttpServers() {
  const httpServers = {
    'apache': {
      installed: isPackageInstalled('apache2') || isPackageInstalled('httpd'),
      running: isRunning('apache2') || isRunning('httpd'),
      port: 80,
      url: 'http://localhost:80',
      serverType: 'Apache'
    },
    'nginx': {
      installed: isPackageInstalled('nginx') || isInstalled('nginx'),
      running: isRunning('nginx'),
      port: 80,
      url: 'http://localhost:80',
      serverType: 'Nginx'
    },
    'lighttpd': {
      installed: isPackageInstalled('lighttpd') || isInstalled('lighttpd'),
      running: isRunning('lighttpd'),
      port: 80,
      url: 'http://localhost:80',
      serverType: 'Lighttpd'
    },
    'caddy': {
      installed: isPackageInstalled('caddy') || isInstalled('caddy'),
      running: isRunning('caddy'),
      port: 80,
      url: 'http://localhost:80',
      serverType: 'Caddy'
    },
    'tomcat': {
      installed: isPackageInstalled('tomcat') || isInstalled('tomcat'),
      running: isRunning('tomcat'),
      port: 8080,
      url: 'http://localhost:8080',
      serverType: 'Tomcat'
    }
  };
  
  // Try to detect which one is actually serving on port 80
  let activeServer = 'none';
  
  for (const [server, info] of Object.entries(httpServers)) {
    if (info.running) {
      activeServer = server;
      break;
    }
  }
  
  // Try to get server header to confirm server type
  if (process.platform !== 'win32') {
    const curlResult = safeExec('curl -s -I http://localhost 2>/dev/null | grep -i "Server:"');
    if (curlResult) {
      const serverHeader = curlResult.replace(/Server:\s*/i, '').trim();
      for (const [server, info] of Object.entries(httpServers)) {
        if (serverHeader.toLowerCase().includes(server.toLowerCase())) {
          info.detected = true;
          activeServer = server;
        }
      }
    }
  }
  
  return { servers: httpServers, active: activeServer };
}

// Function to detect SSL/TLS tools
function detectSslTools() {
  const sslTools = {
    'openssl': {
      installed: isPackageInstalled('openssl') || isInstalled('openssl'),
      version: safeExec('openssl version')
    },
    'gnutls': {
      installed: isPackageInstalled('gnutls') || isInstalled('gnutls-cli'),
      version: safeExec('gnutls-cli --version')
    },
    'certbot': {
      installed: isPackageInstalled('certbot') || isInstalled('certbot'),
      version: safeExec('certbot --version')
    }
  };
  
  return sslTools;
}

// Function to detect certificate authorities
function detectCertificateAuthority() {
  const caInfo = {
    'local-ca': {
      exists: false,
      path: '',
      certs: 0
    }
  };
  
  // Check common CA locations
  const caLocations = [
    '/etc/ssl/certs',
    '/etc/pki/ca-trust/source/anchors',
    '/usr/local/share/ca-certificates',
    '/etc/ca-certificates'
  ];
  
  for (const location of caLocations) {
    if (fs.existsSync(location)) {
      try {
        const files = fs.readdirSync(location).filter(file => 
          file.endsWith('.crt') || file.endsWith('.pem') || file.endsWith('.cert')
        );
        
        if (files.length > 0) {
          caInfo['local-ca'] = {
            exists: true,
            path: location,
            certs: files.length
          };
          break;
        }
      } catch (error) {
        // Couldn't read directory, probably permission issues
      }
    }
  }
  
  return caInfo;
}

// Function to detect VPN servers
function detectVpnServers() {
  const vpnServers = {
    'openvpn': {
      installed: isPackageInstalled('openvpn') || isInstalled('openvpn'),
      running: isRunning('openvpn'),
      port: 1194,
      protocol: 'UDP',
      configExists: fs.existsSync('/etc/openvpn/server.conf') || fs.existsSync('/etc/openvpn/server')
    },
    'wireguard': {
      installed: isPackageInstalled('wireguard') || isInstalled('wg'),
      running: safeExec('ip -o link show | grep -v "@" | grep -i wireguard') !== '',
      configExists: fs.existsSync('/etc/wireguard')
    },
    'ipsec': {
      installed: isPackageInstalled('strongswan') || isInstalled('ipsec'),
      running: isRunning('strongswan') || (safeExec('ipsec status 2>/dev/null | grep -i "running"') !== '')
    }
  };
  
  return vpnServers;
}

// Function to detect DNS services
function detectDnsServices() {
  const dnsServices = {
    'bind': {
      installed: isPackageInstalled('bind9') || isPackageInstalled('bind') || isInstalled('named'),
      running: isRunning('named') || isRunning('bind9'),
      port: 53
    },
    'dnsmasq': {
      installed: isPackageInstalled('dnsmasq') || isInstalled('dnsmasq'),
      running: isRunning('dnsmasq'),
      port: 53
    },
    'unbound': {
      installed: isPackageInstalled('unbound') || isInstalled('unbound'),
      running: isRunning('unbound'),
      port: 53
    },
    'systemd-resolved': {
      installed: fs.existsSync('/lib/systemd/systemd-resolved'),
      running: isRunning('systemd-resolved'),
      port: 53
    }
  };
  
  // Try to detect active resolver
  if (fs.existsSync('/etc/resolv.conf')) {
    try {
      const resolv = fs.readFileSync('/etc/resolv.conf', 'utf8');
      const lines = resolv.split('\n');
      
      for (const line of lines) {
        if (line.trim().startsWith('nameserver 127.0.0.')) {
          // Local nameserver
          for (const [name, info] of Object.entries(dnsServices)) {
            if (info.running) {
              dnsServices[name].active = true;
              break;
            }
          }
          break;
        }
      }
    } catch (error) {
      // Couldn't read resolv.conf
    }
  }
  
  return dnsServices;
}

// Function to detect DHCP services
function detectDhcpServices() {
  const dhcpServices = {
    'isc-dhcp': {
      installed: isPackageInstalled('isc-dhcp-server') || isInstalled('dhcpd'),
      running: isRunning('isc-dhcp-server') || isRunning('dhcpd'),
      port: 67,
      configExists: fs.existsSync('/etc/dhcp/dhcpd.conf')
    },
    'dnsmasq-dhcp': {
      installed: isPackageInstalled('dnsmasq') || isInstalled('dnsmasq'),
      running: isRunning('dnsmasq'),
      port: 67,
      configExists: fs.existsSync('/etc/dnsmasq.conf')
    }
  };
  
  return dhcpServices;
}

// Function to detect SSH/SFTP/FTP services
function detectFileTransferServices() {
  const fileTransferServices = {
    'ssh': {
      installed: isPackageInstalled('openssh-server') || isInstalled('sshd'),
      running: isRunning('sshd') || isRunning('ssh'),
      port: 22,
      protocol: 'SSH/SFTP'
    },
    'vsftpd': {
      installed: isPackageInstalled('vsftpd') || isInstalled('vsftpd'),
      running: isRunning('vsftpd'),
      port: 21,
      protocol: 'FTP'
    },
    'proftpd': {
      installed: isPackageInstalled('proftpd') || isInstalled('proftpd'),
      running: isRunning('proftpd'),
      port: 21,
      protocol: 'FTP'
    }
  };
  
  return fileTransferServices;
}

// Function to detect storage services (NAS/Samba/NFS)
function detectStorageServices() {
  const storageServices = {
    'samba': {
      installed: isPackageInstalled('samba') || isInstalled('smbd'),
      running: isRunning('smbd'),
      port: 445,
      protocol: 'SMB/CIFS',
      configExists: fs.existsSync('/etc/samba/smb.conf')
    },
    'nfs': {
      installed: isPackageInstalled('nfs-kernel-server') || isInstalled('nfsd'),
      running: isRunning('nfsd') || (safeExec('showmount -e localhost 2>/dev/null') !== ''),
      port: 2049,
      protocol: 'NFS',
      configExists: fs.existsSync('/etc/exports')
    }
  };
  
  // Check for any exported NFS shares
  if (storageServices.nfs.running && process.platform !== 'win32') {
    const nfsExports = safeExec('showmount -e localhost 2>/dev/null');
    storageServices.nfs.exports = nfsExports || 'None';
  }
  
  // Check for any Samba shares
  if (storageServices.samba.running && process.platform !== 'win32') {
    const smbShares = safeExec('smbclient -L localhost -N 2>/dev/null | grep Disk');
    storageServices.samba.shares = smbShares || 'None';
  }
  
  return storageServices;
}

// Main function to gather all information
function gatherNetworkServices() {
  // Add status to all services
  const addStatus = (services) => {
    for (const [name, info] of Object.entries(services)) {
      if (info.installed === false) {
        info.status = 'not installed';
      } else if (info.running === false) {
        info.status = 'not running';
      } else {
        info.status = 'running';
      }
    }
    return services;
  };
  
  // Get HTTP servers
  const httpInfo = detectHttpServers();
  addStatus(httpInfo.servers);
  
  // Get SSL/TLS tools
  const sslTools = detectSslTools();
  
  // Get Certificate Authority info
  const caInfo = detectCertificateAuthority();
  
  // Get VPN servers
  const vpnServers = detectVpnServers();
  addStatus(vpnServers);
  
  // Get DNS services
  const dnsServices = detectDnsServices();
  addStatus(dnsServices);
  
  // Get DHCP services
  const dhcpServices = detectDhcpServices();
  addStatus(dhcpServices);
  
  // Get SSH/SFTP/FTP services
  const fileTransferServices = detectFileTransferServices();
  addStatus(fileTransferServices);
  
  // Get storage services
  const storageServices = detectStorageServices();
  addStatus(storageServices);
  
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
      http: {
        servers: httpInfo.servers,
        activeServer: httpInfo.active
      },
      ssl: {
        tools: sslTools,
        ca: caInfo
      },
      vpn: vpnServers,
      dns: dnsServices,
      dhcp: dhcpServices,
      fileTransfer: fileTransferServices,
      storage: storageServices
    }
  };
  
  return result;
}

// Execute and print results
const serviceInfo = gatherNetworkServices();
console.log(JSON.stringify(serviceInfo, null, 2));