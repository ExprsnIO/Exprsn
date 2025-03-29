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

// Function to get more detailed network information based on platform
function getDetailedNetworkInfo() {
  let result = {};
  
  if (process.platform === 'linux') {
    // Use ip command to get more detailed info on Linux
    const ipAddrs = safeExec('ip -j addr');
    if (ipAddrs) {
      try {
        result.ipDetails = JSON.parse(ipAddrs);
      } catch (e) {
        // Fallback if JSON parsing fails
        result.ipRawOutput = safeExec('ip addr');
      }
    }
    
    // Get routing table
    result.routingTable = safeExec('ip -j route');
    if (result.routingTable) {
      try {
        result.routingTable = JSON.parse(result.routingTable);
      } catch (e) {
        result.routingRawOutput = safeExec('ip route');
      }
    }
    
    // Get DNS info
    if (fs.existsSync('/etc/resolv.conf')) {
      const resolv = fs.readFileSync('/etc/resolv.conf', 'utf8');
      const nameservers = [];
      const searchDomains = [];
      
      resolv.split('\n').forEach(line => {
        if (line.startsWith('nameserver')) {
          nameservers.push(line.split(' ')[1]);
        } else if (line.startsWith('search')) {
          line.split(' ').slice(1).forEach(domain => {
            if (domain) searchDomains.push(domain);
          });
        }
      });
      
      result.dns = { nameservers, searchDomains };
    }
    
    // Get network manager state if available
    const nmcli = safeExec('nmcli -t -f DEVICE,TYPE,STATE,CONNECTION device');
    if (nmcli) {
      const connections = [];
      nmcli.split('\n').forEach(line => {
        if (line) {
          const [device, type, state, connection] = line.split(':');
          connections.push({ device, type, state, connection });
        }
      });
      result.networkManager = { connections };
    }
    
    // Check for wireless interfaces and their status
    const iwconfig = safeExec('iwconfig 2>/dev/null');
    if (iwconfig) {
      result.wirelessInterfaces = iwconfig;
    }
  } else if (process.platform === 'darwin') {
    // macOS specific commands
    // Get interface details
    const ifconfigOutput = safeExec('ifconfig');
    result.ifconfigOutput = ifconfigOutput;
    
    // Get routing table
    result.routingTable = safeExec('netstat -nr');
    
    // Get DNS servers
    const dnsServers = safeExec('scutil --dns | grep "nameserver\\[[0-9]*\\]" | sort -u');
    if (dnsServers) {
      const nameservers = [];
      dnsServers.split('\n').forEach(line => {
        const match = line.match(/nameserver\[\d+\] : (.+)/);
        if (match && match[1]) {
          nameservers.push(match[1]);
        }
      });
      result.dns = { nameservers };
    }
    
    // Get network service order
    const serviceOrder = safeExec('networksetup -listnetworkserviceorder');
    if (serviceOrder) {
      result.networkServiceOrder = serviceOrder;
    }
    
    // Get wireless info if applicable
    const airport = safeExec('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I');
    if (airport) {
      result.wirelessInfo = airport;
    }
  } else if (process.platform === 'win32') {
    // Windows specific commands
    // Get interface details
    const ipconfig = safeExec('ipconfig /all');
    result.ipconfigOutput = ipconfig;
    
    // Get routing table
    result.routingTable = safeExec('route print');
    
    // Get wireless interfaces if available
    const netsh = safeExec('netsh wlan show interfaces');
    if (netsh && !netsh.includes('not running')) {
      result.wirelessInterfaces = netsh;
    }
    
    // Get physical adapters details
    const adapters = safeExec('wmic nic get Name,AdapterType,MACAddress,PhysicalAdapter /format:list');
    if (adapters) {
      result.networkAdapters = adapters;
    }
  }
  
  return result;
}

// Function to get network performance stats
function getNetworkStats() {
  try {
    if (process.platform === 'linux') {
      // Read network stats from /proc/net/dev
      const netDev = fs.readFileSync('/proc/net/dev', 'utf8');
      const stats = {};
      
      netDev.split('\n').slice(2).forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 17) {
          const interfaceName = parts[0].replace(':', '');
          stats[interfaceName] = {
            rx_bytes: parseInt(parts[1]),
            rx_packets: parseInt(parts[2]),
            rx_errors: parseInt(parts[3]),
            rx_dropped: parseInt(parts[4]),
            tx_bytes: parseInt(parts[9]),
            tx_packets: parseInt(parts[10]),
            tx_errors: parseInt(parts[11]),
            tx_dropped: parseInt(parts[12])
          };
        }
      });
      
      return stats;
    } else if (process.platform === 'darwin') {
      // On macOS, use netstat -ib
      const netstat = safeExec('netstat -ibn');
      const stats = {};
      let currentInterface = null;
      
      netstat.split('\n').forEach(line => {
        if (line.trim().startsWith('Name')) return; // Skip header
        
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 10) {
          const interfaceName = parts[0];
          if (!stats[interfaceName]) {
            stats[interfaceName] = {
              rx_bytes: parseInt(parts[7]),
              rx_packets: parseInt(parts[4]),
              rx_errors: parseInt(parts[5]),
              rx_dropped: parseInt(parts[6]),
              tx_bytes: parseInt(parts[10]),
              tx_packets: parseInt(parts[8]),
              tx_errors: parseInt(parts[9]),
              tx_dropped: 0  // Not directly available in this output
            };
          }
        }
      });
      
      return stats;
    } else if (process.platform === 'win32') {
      // Limited implementation for Windows
      // We can use PowerShell to get some stats
      const stats = {};
      const netAdapters = safeExec('powershell "Get-NetAdapter | Format-List Name,InterfaceDescription,MacAddress,LinkSpeed,MediaConnectionState"');
      
      // Parse this info into our stats object
      // This is simplified as getting detailed stats requires more complex PowerShell
      let currentAdapter = null;
      netAdapters.split('\n').forEach(line => {
        const match = line.match(/^Name\s*:\s*(.+)$/);
        if (match) {
          currentAdapter = match[1].trim();
          stats[currentAdapter] = {};
        } else if (currentAdapter) {
          const propMatch = line.match(/^(\w+)\s*:\s*(.+)$/);
          if (propMatch) {
            stats[currentAdapter][propMatch[1]] = propMatch[2].trim();
          }
        }
      });
      
      return stats;
    }
  } catch (error) {
    return { error: error.message };
  }
  
  return {};
}

// Main function to gather network information
function gatherNetworkInfo() {
  // Get network interfaces from os module
  const networkInterfaces = os.networkInterfaces();
  const interfaces = {};
  
  // Process and format interface information
  for (const [name, addrs] of Object.entries(networkInterfaces)) {
    interfaces[name] = {
      name,
      addresses: addrs.map(addr => ({
        address: addr.address,
        netmask: addr.netmask,
        family: addr.family,
        mac: addr.mac,
        internal: addr.internal,
        cidr: addr.cidr
      })),
      isEthernet: name.startsWith('eth') || name.startsWith('en') || name.includes('Ethernet'),
      isWireless: name.startsWith('wlan') || name.startsWith('wl') || name.includes('Wi-Fi'),
      isVirtual: name.includes('vir') || name.includes('vbox') || name.includes('vmnet') || name.includes('docker'),
      isLoopback: name.includes('lo') || name === 'localhost'
    };
    
    // Get more specific information about interface type
    interfaces[name].ipv4 = addrs.filter(addr => addr.family === 'IPv4').map(addr => addr.address);
    interfaces[name].ipv6 = addrs.filter(addr => addr.family === 'IPv6').map(addr => addr.address);
    
    // Determine the primary IP (first non-internal IPv4 address)
    const primaryAddress = addrs.find(addr => addr.family === 'IPv4' && !addr.internal);
    if (primaryAddress) {
      interfaces[name].primaryIp = primaryAddress.address;
    }
  }
  
  // Get network stats
  const networkStats = getNetworkStats();
  
  // Get detailed network information based on platform
  const detailedInfo = getDetailedNetworkInfo();
  
  // Get default gateway
  let defaultGateway = null;
  if (process.platform === 'linux') {
    const gateway = safeExec("ip route | grep default | awk '{print $3}'");
    defaultGateway = gateway || null;
  } else if (process.platform === 'darwin') {
    const gateway = safeExec("netstat -nr | grep default | awk '{print $2}'");
    defaultGateway = gateway || null;
  } else if (process.platform === 'win32') {
    const gateway = safeExec("ipconfig | findstr /i \"Default Gateway\" | awk '{print $NF}'");
    defaultGateway = gateway || null;
  }
  
  // Get public IP (optional, only if curl or wget is available)
  let publicIp = null;
  if (process.platform !== 'win32') {
    const curlCheck = safeExec('which curl');
    if (curlCheck) {
      publicIp = safeExec('curl -s https://api.ipify.org');
    } else {
      const wgetCheck = safeExec('which wget');
      if (wgetCheck) {
        publicIp = safeExec('wget -qO- https://api.ipify.org');
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
    network: {
      interfaces,
      stats: networkStats,
      defaultGateway,
      publicIp
    },
    detailedInfo
  };
  
  return result;
}

// Execute and print results
const networkInfo = gatherNetworkInfo();
console.log(JSON.stringify(networkInfo, null, 2));