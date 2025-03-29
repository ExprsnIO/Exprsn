#!/usr/bin/env node

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

// Function to check if a process is running
function isProcessRunning(processName) {
  try {
    if (process.platform === 'win32') {
      const result = safeExec(`tasklist /FI "IMAGENAME eq ${processName}*" /NH`);
      return result.includes(processName);
    } else {
      const result = safeExec(`ps aux | grep -v grep | grep -i "${processName}"`);
      return !!result;
    }
  } catch (error) {
    return false;
  }
}

// Function to check if a service is running
function isServiceRunning(serviceName) {
  try {
    if (process.platform === 'win32') {
      const result = safeExec(`sc query ${serviceName} | find "RUNNING"`);
      return !!result;
    } else if (process.platform === 'linux') {
      const systemctl = safeExec(`systemctl is-active ${serviceName}`);
      if (systemctl === 'active') return true;
      
      const service = safeExec(`service ${serviceName} status | grep -i running`);
      return !!service;
    } else if (process.platform === 'darwin') {
      const launchctl = safeExec(`launchctl list | grep ${serviceName}`);
      return !!launchctl;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Function to check if a command exists
function commandExists(command) {
  try {
    if (process.platform === 'win32') {
      const result = safeExec(`where ${command}`);
      return !!result;
    } else {
      const result = safeExec(`which ${command}`);
      return !!result;
    }
  } catch (error) {
    return false;
  }
}

// Function to detect Docker
function detectDocker() {
  const docker = {
    installed: commandExists('docker'),
    running: isProcessRunning('dockerd') || isServiceRunning('docker'),
    type: 'container',
    details: {}
  };
  
  // Check Docker version if installed
  if (docker.installed) {
    const version = safeExec('docker version --format "{{.Server.Version}}"');
    docker.version = version || 'unknown';
    
    // Check if Docker is actually running by trying to list containers
    const containers = safeExec('docker ps -q');
    docker.active = !!containers;
    
    if (docker.active) {
      // Get container count
      const containerCount = safeExec('docker ps -q | wc -l');
      docker.details.runningContainers = parseInt(containerCount) || 0;
      
      const allContainerCount = safeExec('docker ps -a -q | wc -l');
      docker.details.totalContainers = parseInt(allContainerCount) || 0;
      
      // Get image count
      const imageCount = safeExec('docker image ls -q | wc -l');
      docker.details.images = parseInt(imageCount) || 0;
      
      // Get Docker info
      const info = safeExec('docker info --format "{{json .}}"');
      if (info) {
        try {
          const infoObj = JSON.parse(info);
          docker.details.serverVersion = infoObj.ServerVersion;
          docker.details.storageDriver = infoObj.Driver;
          docker.details.rootDir = infoObj.DockerRootDir;
          docker.details.containerdVersion = infoObj.ContainerdVersion;
          docker.details.runcVersion = infoObj.RuncVersion;
        } catch (e) {
          // JSON parsing failed, ignore
        }
      }
      
      // Check if Docker Swarm is active
      const swarm = safeExec('docker info --format "{{.Swarm.LocalNodeState}}"');
      docker.details.swarm = swarm === 'active' ? 'active' : 'inactive';
      
      // Check Docker Compose
      docker.details.composeInstalled = commandExists('docker-compose');
    }
  }
  
  return docker;
}

// Function to detect Docker networks
function detectDockerNetworks() {
  const dockerNetworks = {
    available: false,
    networks: []
  };
  
  if (commandExists('docker') && safeExec('docker ps -q')) {
    const networks = safeExec('docker network ls --format "{{.Name}}\t{{.Driver}}\t{{.Scope}}"');
    if (networks) {
      dockerNetworks.available = true;
      
      networks.split('\n').forEach(network => {
        if (network.trim()) {
          const [name, driver, scope] = network.split('\t');
          
          // Get detailed network info
          const inspect = safeExec(`docker network inspect ${name}`);
          let details = {};
          
          try {
            const inspectObj = JSON.parse(inspect);
            if (inspectObj && inspectObj.length > 0) {
              details = {
                subnet: inspectObj[0].IPAM?.Config?.[0]?.Subnet || 'unknown',
                gateway: inspectObj[0].IPAM?.Config?.[0]?.Gateway || 'unknown',
                containers: Object.keys(inspectObj[0].Containers || {}).length
              };
            }
          } catch (e) {
            // JSON parsing failed, ignore
          }
          
          dockerNetworks.networks.push({
            name,
            driver,
            scope,
            ...details
          });
        }
      });
    }
  }
  
  return dockerNetworks;
}

// Function to detect Kubernetes
function detectKubernetes() {
  const kubernetes = {
    installed: false,
    running: false,
    type: 'orchestration',
    details: {}
  };
  
  // Check for kubectl
  kubernetes.installed = commandExists('kubectl') || 
                          commandExists('kubeadm') || 
                          commandExists('kubelet');
  
  // Check if kubelet is running
  kubernetes.running = isProcessRunning('kubelet') || isServiceRunning('kubelet');
  
  if (kubernetes.installed) {
    // Try to get version
    const version = safeExec('kubectl version --client --short');
    kubernetes.version = version || 'unknown';
    
    // Check if we can connect to a cluster
    const cluster = safeExec('kubectl cluster-info');
    kubernetes.active = cluster.includes('Kubernetes control plane') || 
                        cluster.includes('Kubernetes master');
    
    if (kubernetes.active) {
      // Get node count
      const nodeCount = safeExec('kubectl get nodes --no-headers | wc -l');
      kubernetes.details.nodes = parseInt(nodeCount) || 0;
      
      // Get pod count
      const podCount = safeExec('kubectl get pods --all-namespaces --no-headers | wc -l');
      kubernetes.details.pods = parseInt(podCount) || 0;
      
      // Get namespace count
      const namespaceCount = safeExec('kubectl get namespaces --no-headers | wc -l');
      kubernetes.details.namespaces = parseInt(namespaceCount) || 0;
      
      // Check if it's a Minikube cluster
      const minikube = safeExec('kubectl get nodes -o wide | grep minikube');
      kubernetes.details.minikube = !!minikube;
      
      // Check if it's a k3s cluster
      const k3s = isProcessRunning('k3s') || isServiceRunning('k3s');
      kubernetes.details.k3s = k3s;
      
      // Check the CNI plugin if possible
      const cni = safeExec('kubectl get pods -n kube-system -o wide | grep -E "calico|flannel|weave|cilium"');
      if (cni.includes('calico')) kubernetes.details.cni = 'calico';
      else if (cni.includes('flannel')) kubernetes.details.cni = 'flannel';
      else if (cni.includes('weave')) kubernetes.details.cni = 'weave';
      else if (cni.includes('cilium')) kubernetes.details.cni = 'cilium';
      else kubernetes.details.cni = 'unknown';
    }
  }
  
  return kubernetes;
}

// Function to detect Kubernetes networks
function detectKubernetesNetworks() {
  const k8sNetworks = {
    available: false,
    networks: []
  };
  
  if (commandExists('kubectl') && safeExec('kubectl cluster-info').includes('Kubernetes')) {
    k8sNetworks.available = true;
    
    // Get service CIDR
    const serviceCidr = safeExec(`kubectl cluster-info dump | grep -m 1 service-cluster-ip-range`);
    if (serviceCidr) {
      const match = serviceCidr.match(/service-cluster-ip-range=([^,\s]+)/);
      if (match && match[1]) {
        k8sNetworks.networks.push({
          name: 'Service CIDR',
          cidr: match[1],
          type: 'service'
        });
      }
    }
    
    // Get pod CIDR
    const podCidr = safeExec(`kubectl cluster-info dump | grep -m 1 cluster-cidr`);
    if (podCidr) {
      const match = podCidr.match(/cluster-cidr=([^,\s]+)/);
      if (match && match[1]) {
        k8sNetworks.networks.push({
          name: 'Pod CIDR',
          cidr: match[1],
          type: 'pod'
        });
      }
    }
    
    // Get network interfaces from nodes
    const nodeInterfaces = safeExec('kubectl get nodes -o wide');
    if (nodeInterfaces) {
      const lines = nodeInterfaces.split('\n');
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(/\s+/);
          // The internal IP should be the 6th column
          if (parts.length >= 6) {
            k8sNetworks.networks.push({
              name: `Node ${parts[0]} interface`,
              address: parts[5],
              type: 'node'
            });
          }
        }
      }
    }
  }
  
  return k8sNetworks;
}

// Function to detect LXC/LXD
function detectLXC() {
  const lxc = {
    installed: false,
    running: false,
    type: 'container',
    details: {}
  };
  
  // Check for LXC/LXD commands
  lxc.installed = commandExists('lxc') || 
                 commandExists('lxd') || 
                 commandExists('lxc-ls');
  
  // Check if LXD daemon is running
  lxc.running = isProcessRunning('lxd') || 
                isServiceRunning('lxd') || 
                isServiceRunning('lxc');
  
  if (lxc.installed) {
    // Try to get version
    let version = safeExec('lxc --version');
    if (!version) version = safeExec('lxc-ls --version');
    lxc.version = version || 'unknown';
    
    // Check if we can list containers
    const containers = safeExec('lxc list -c n --format csv');
    lxc.active = !!containers;
    
    if (lxc.active) {
      // Get container count
      const containerCount = safeExec('lxc list -c n --format csv | wc -l');
      lxc.details.containers = parseInt(containerCount) || 0;
      
      // Get running container count
      const runningCount = safeExec('lxc list -c ns --format csv | grep RUNNING | wc -l');
      lxc.details.runningContainers = parseInt(runningCount) || 0;
      
      // Get image count
      const imageCount = safeExec('lxc image list -c f --format csv | wc -l');
      lxc.details.images = parseInt(imageCount) || 0;
      
      // Get storage pools
      const pools = safeExec('lxc storage list -c n --format csv');
      lxc.details.storagePools = pools ? pools.split('\n').filter(Boolean) : [];
    } else {
      // Try with traditional LXC
      const lxcLs = safeExec('lxc-ls');
      if (lxcLs) {
        lxc.active = true;
        lxc.details.traditional = true;
        
        // Get container count
        const containerCount = safeExec('lxc-ls | wc -l');
        lxc.details.containers = parseInt(containerCount) || 0;
        
        // Get running container count
        const runningCount = safeExec('lxc-ls --running | wc -l');
        lxc.details.runningContainers = parseInt(runningCount) || 0;
      }
    }
  }
  
  return lxc;
}

// Function to detect LXC networks
function detectLXCNetworks() {
  const lxcNetworks = {
    available: false,
    networks: []
  };
  
  if (commandExists('lxc') && safeExec('lxc list')) {
    lxcNetworks.available = true;
    
    // Get LXD networks
    const networks = safeExec('lxc network list -c n --format csv');
    if (networks) {
      networks.split('\n').forEach(network => {
        if (network.trim()) {
          // Get network details
          const info = safeExec(`lxc network show ${network}`);
          let type = 'unknown';
          let ipv4Address = '';
          let usedBy = 0;
          
          // Parse YAML-like output
          if (info.includes('type:')) {
            const typeMatch = info.match(/type:\s+(\w+)/);
            if (typeMatch && typeMatch[1]) type = typeMatch[1];
          }
          
          if (info.includes('ipv4.address:')) {
            const ipv4Match = info.match(/ipv4\.address:\s+([^\s]+)/);
            if (ipv4Match && ipv4Match[1]) ipv4Address = ipv4Match[1];
          }
          
          // Count number of instances using this network
          const usedByMatch = info.match(/used_by:\s*\n((?:\s+-.*\n)*)/);
          if (usedByMatch && usedByMatch[1]) {
            usedBy = (usedByMatch[1].match(/-/g) || []).length;
          }
          
          lxcNetworks.networks.push({
            name: network,
            type,
            ipv4Address,
            usedBy
          });
        }
      });
    }
  } else if (commandExists('lxc-ls')) {
    // Traditional LXC
    lxcNetworks.available = true;
    
    // Check for default LXC bridge
    if (fs.existsSync('/etc/default/lxc-net')) {
      const lxcNet = fs.readFileSync('/etc/default/lxc-net', 'utf8');
      
      const bridgeMatch = lxcNet.match(/LXC_BRIDGE="([^"]+)"/);
      const addrMatch = lxcNet.match(/LXC_ADDR="([^"]+)"/);
      const netmaskMatch = lxcNet.match(/LXC_NETMASK="([^"]+)"/);
      
      if (bridgeMatch && bridgeMatch[1]) {
        lxcNetworks.networks.push({
          name: bridgeMatch[1],
          type: 'bridge',
          ipv4Address: addrMatch && addrMatch[1] ? addrMatch[1] : 'unknown',
          netmask: netmaskMatch && netmaskMatch[1] ? netmaskMatch[1] : 'unknown'
        });
      }
    }
  }
  
  return lxcNetworks;
}

// Function to detect Xen
function detectXen() {
  const xen = {
    installed: false,
    running: false,
    type: 'hypervisor',
    details: {}
  };
  
  // Check for Xen commands
  xen.installed = commandExists('xl') || 
                 commandExists('xm') || 
                 commandExists('xenstore-read');
  
  // Check if we're running on Xen
  const dmesg = safeExec('dmesg | grep -i xen');
  const xenExists = (dmesg.includes('Xen') || dmesg.includes('xen'));
  
  // Check if Xen service is running
  xen.running = isServiceRunning('xendomains') || 
               isServiceRunning('xend') || 
               xenExists;
  
  if (xen.installed || xenExists) {
    // Try to get version
    let version = '';
    const XenVersion = safeExec('xenstore-read /local/domain/0/vm | grep -i xen');
    if (XenVersion) {
      const versionMatch = XenVersion.match(/xen-\d+\.\d+/);
      if (versionMatch) version = versionMatch[0].replace('xen-', '');
    }
    
    if (!version) {
      // Try with xl
      const xlVersion = safeExec('xl info | grep xen_version');
      if (xlVersion) {
        const versionMatch = xlVersion.match(/:\s+([\d\.]+)/);
        if (versionMatch && versionMatch[1]) version = versionMatch[1];
      }
    }
    
    xen.version = version || 'unknown';
    
    // Check if we can list domains
    let domainList = safeExec('xl list');
    if (!domainList) domainList = safeExec('xm list');
    xen.active = !!domainList;
    
    if (xen.active) {
      // Count domains (subtract 1 for header)
      const domainCount = domainList.split('\n').length - 1;
      xen.details.domains = Math.max(0, domainCount);
      
      // Check if we're dom0 or domU
      const domType = safeExec('xenstore-read /local/domain/0/domid');
      xen.details.domainType = domType === '0' ? 'dom0' : 'domU';
      
      // Get total memory
      const totalMem = safeExec('xl info | grep total_memory');
      if (totalMem) {
        const memMatch = totalMem.match(/:\s+(\d+)/);
        if (memMatch && memMatch[1]) xen.details.totalMemory = parseInt(memMatch[1]) + ' MB';
      }
    }
  }
  
  return xen;
}

// Function to detect QEMU/KVM
function detectQemu() {
  const qemu = {
    installed: false,
    running: false,
    type: 'hypervisor',
    details: {}
  };
  
  // Check for QEMU/KVM commands
  qemu.installed = commandExists('qemu-system-x86_64') || 
                  commandExists('qemu-kvm') || 
                  commandExists('virsh');
  
  // Check if KVM module is loaded
  const kvmLoaded = safeExec('lsmod | grep kvm');
  
  // Check if libvirtd is running
  const libvirtRunning = isServiceRunning('libvirtd');
  
  qemu.running = libvirtRunning || isProcessRunning('qemu') || kvmLoaded;
  
  if (qemu.installed) {
    // Try to get version
    let version = safeExec('qemu-system-x86_64 --version');
    if (!version) version = safeExec('qemu-kvm --version');
    
    if (version) {
      const versionMatch = version.match(/QEMU emulator version ([\d\.]+)/);
      if (versionMatch && versionMatch[1]) qemu.version = versionMatch[1];
    }
    
    if (!qemu.version) {
      // Try libvirt version
      const libvirtVersion = safeExec('virsh --version');
      if (libvirtVersion) qemu.version = 'libvirt ' + libvirtVersion;
      else qemu.version = 'unknown';
    }
    
    // Check if libvirt is active
    const libvirtActive = commandExists('virsh') && !!safeExec('virsh list');
    qemu.active = libvirtActive;
    
    if (qemu.active) {
      // Get running VMs
      const runningVMs = safeExec('virsh list | grep running | wc -l');
      qemu.details.runningVMs = parseInt(runningVMs) || 0;
      
      // Get total VMs
      const totalVMs = safeExec('virsh list --all | grep -v "^-\\|^ Id" | wc -l');
      qemu.details.totalVMs = parseInt(totalVMs) || 0;
      
      // Get libvirt storage pools
      const pools = safeExec('virsh pool-list --name');
      qemu.details.storagePools = pools ? pools.split('\n').filter(Boolean) : [];
      
      // Check if we're hardware accelerated
      const acceleration = safeExec('virsh capabilities | grep -i kvm');
      qemu.details.hardwareAcceleration = !!acceleration;
      
      // Get hypervisor type
      const hypervisor = safeExec('virsh capabilities | grep -i qemu');
      qemu.details.hypervisorType = hypervisor.includes('kvm') ? 'kvm' : 
                                   hypervisor.includes('qemu') ? 'qemu' : 'unknown';
    }
  }
  
  return qemu;
}

// Function to detect QEMU/libvirt networks
function detectQemuNetworks() {
  const qemuNetworks = {
    available: false,
    networks: []
  };
  
  if (commandExists('virsh')) {
    const networks = safeExec('virsh net-list --all');
    if (networks) {
      qemuNetworks.available = true;
      
      const lines = networks.split('\n');
      // Skip header and footer lines
      for (let i = 2; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(/\s+/);
          if (parts.length >= 3) {
            const name = parts[0];
            const state = parts[1];
            const autostart = parts[2];
            
            // Get network details
            const details = safeExec(`virsh net-dumpxml ${name}`);
            let bridge = '';
            let ipAddress = '';
            let netmask = '';
            
            if (details) {
              const bridgeMatch = details.match(/<bridge name='([^']+)'/);
              if (bridgeMatch && bridgeMatch[1]) bridge = bridgeMatch[1];
              
              const ipMatch = details.match(/<ip address='([^']+)' netmask='([^']+)'/);
              if (ipMatch && ipMatch[1] && ipMatch[2]) {
                ipAddress = ipMatch[1];
                netmask = ipMatch[2];
              }
            }
            
            qemuNetworks.networks.push({
              name,
              state,
              autostart: autostart === 'yes',
              bridge,
              ipAddress,
              netmask
            });
          }
        }
      }
    }
  }
  
  return qemuNetworks;
}

// Function to detect VirtualBox
function detectVirtualBox() {
  const virtualbox = {
    installed: false,
    running: false,
    type: 'hypervisor',
    details: {}
  };
  
  // Check for VirtualBox commands
  virtualbox.installed = commandExists('VBoxManage') || 
                        commandExists('vboxmanage');
  
  // Check if VirtualBox service is running
  virtualbox.running = isServiceRunning('vboxdrv') || 
                     isProcessRunning('VBoxSVC');
  
  if (virtualbox.installed) {
    // Get version
    const version = safeExec('VBoxManage --version') || safeExec('vboxmanage --version');
    virtualbox.version = version || 'unknown';
    
    // Check if we can list VMs
    const vms = safeExec('VBoxManage list vms') || safeExec('vboxmanage list vms');
    virtualbox.active = !!vms;
    
    if (virtualbox.active) {
      // Count VMs
      const vmCount = vms.split('\n').filter(Boolean).length;
      virtualbox.details.vms = vmCount;
      
      // Count running VMs
      const runningVms = safeExec('VBoxManage list runningvms') || safeExec('vboxmanage list runningvms');
      virtualbox.details.runningVms = runningVms ? runningVms.split('\n').filter(Boolean).length : 0;
      
      // Get host info
      const hostInfo = safeExec('VBoxManage list hostinfo') || safeExec('vboxmanage list hostinfo');
      if (hostInfo) {
        const processorCoresMatch = hostInfo.match(/Processor core count:\s+(\d+)/);
        if (processorCoresMatch && processorCoresMatch[1]) {
          virtualbox.details.processorCores = parseInt(processorCoresMatch[1]);
        }
        
        const memoryMatch = hostInfo.match(/Memory size:\s+(\d+)/);
        if (memoryMatch && memoryMatch[1]) {
          virtualbox.details.memorySize = parseInt(memoryMatch[1]) + ' MB';
        }
      }
    }
  }
  
  return virtualbox;
}

// Function to detect VirtualBox networks
function detectVirtualBoxNetworks() {
  const vboxNetworks = {
    available: false,
    networks: []
  };
  
  const vboxmanage = commandExists('VBoxManage') ? 'VBoxManage' : 
                     commandExists('vboxmanage') ? 'vboxmanage' : null;
  
  if (vboxmanage) {
    const hostonlyifs = safeExec(`${vboxmanage} list hostonlyifs`);
    if (hostonlyifs) {
      vboxNetworks.available = true;
      
      // Parse host-only interfaces
      let currentNetwork = null;
      hostonlyifs.split('\n').forEach(line => {
        const nameLine = line.match(/^Name:\s+(.+)$/);
        if (nameLine) {
          if (currentNetwork) {
            vboxNetworks.networks.push(currentNetwork);
          }
          currentNetwork = {
            name: nameLine[1],
            type: 'hostonly',
          };
        } else if (currentNetwork) {
          const ipAddr = line.match(/^IPAddress:\s+(.+)$/);
          if (ipAddr) currentNetwork.ipAddress = ipAddr[1];
          
          const netmask = line.match(/^NetworkMask:\s+(.+)$/);
          if (netmask) currentNetwork.netmask = netmask[1];
          
          const status = line.match(/^Status:\s+(.+)$/);
          if (status) currentNetwork.status = status[1];
        }
      });
      
      if (currentNetwork) {
        vboxNetworks.networks.push(currentNetwork);
      }
    }
    
    // Check for NAT networks
    const natnetworks = safeExec(`${vboxmanage} natnetwork list`);
    if (natnetworks) {
      const lines = natnetworks.split('\n');
      let currentNatNet = null;
      
      lines.forEach(line => {
        const nameMatch = line.match(/^Name:\s+(.+)$/);
        if (nameMatch) {
          if (currentNatNet) {
            vboxNetworks.networks.push(currentNatNet);
          }
          currentNatNet = {
            name: nameMatch[1],
            type: 'natnetwork',
          };
        } else if (currentNatNet) {
          const networkMatch = line.match(/^Network:\s+(.+)$/);
          if (networkMatch) currentNatNet.network = networkMatch[1];
          
          const enabledMatch = line.match(/^Enabled:\s+(.+)$/);
          if (enabledMatch) currentNatNet.enabled = enabledMatch[1] === 'Yes';
          
          const dhcpMatch = line.match(/^DHCP Enabled:\s+(.+)$/);
          if (dhcpMatch) currentNatNet.dhcpEnabled = dhcpMatch[1] === 'Yes';
        }
      });
      
      if (currentNatNet) {
        vboxNetworks.networks.push(currentNatNet);
      }
    }
    
    // Check for bridged interfaces
    const bridgedifs = safeExec(`${vboxmanage} list bridgedifs`);
    if (bridgedifs) {
      let currentBridge = null;
      
      bridgedifs.split('\n').forEach(line => {
        const nameLine = line.match(/^Name:\s+(.+)$/);
        if (nameLine) {
          if (currentBridge) {
            vboxNetworks.networks.push(currentBridge);
          }
          currentBridge = {
            name: nameLine[1],
            type: 'bridged',
          };
        } else if (currentBridge) {
          const ipAddr = line.match(/^IPAddress:\s+(.+)$/);
          if (ipAddr) currentBridge.ipAddress = ipAddr[1];
          
          const netmask = line.match(/^NetworkMask:\s+(.+)$/);
          if (netmask) currentBridge.netmask = netmask[1];
          
          const status = line.match(/^Status:\s+(.+)$/);
          if (status) currentBridge.status = status[1];
        }
      });
      
      if (currentBridge) {
        vboxNetworks.networks.push(currentBridge);
      }
    }
  }
  
  return vboxNetworks;
}

// Function to detect VMware
function detectVMware() {
  const vmware = {
    installed: false,
    running: false,
    type: 'hypervisor',
    details: {}
  };
  
  // Check for VMware commands
  vmware.installed = commandExists('vmrun') || 
                    commandExists('vmware') || 
                    commandExists('vmware-cmd');
  
  // Check if VMware service is running
  vmware.running = isServiceRunning('vmware') || 
                 isServiceRunning('vmware-workstation') || 
                 isProcessRunning('vmware-vmx');
  
  if (vmware.installed) {
    // Try to get version
    let version = '';
    if (process.platform === 'linux') {
      // Look for version file
      if (fs.existsSync('/etc/vmware/config')) {
        const config = fs.readFileSync('/etc/vmware/config', 'utf8');
        const match = config.match(/player.product.version = "([^"]+)"/);
        if (match && match[1]) version = match[1];
      }
    } else if (process.platform === 'darwin') {
      // Check for VMware Fusion
      const fusion = safeExec('defaults read /Applications/VMware\\ Fusion.app/Contents/Info CFBundleShortVersionString');
      if (fusion) version = fusion;
    } else if (process.platform === 'win32') {
      // Check registry for version
      const reg = safeExec('reg query "HKLM\\SOFTWARE\\VMware, Inc.\\VMware Workstation" /v ProductVersion');
      if (reg) {
        const match = reg.match(/ProductVersion\s+REG_SZ\s+(.+)/);
        if (match && match[1]) version = match[1];
      }
    }
    
    vmware.version = version || 'unknown';
    
    // Check if vmrun is available and can list VMs
    const vms = safeExec('vmrun list');
    vmware.active = !!vms && !vms.includes('Error');
    
    if (vmware.active) {
      // Count running VMs
      const vmCount = vms.split('\n').filter(line => line.includes('.vmx')).length;
      vmware.details.runningVms = vmCount;
    }
  }
  
  return vmware;
}

// Function to detect VMware networks
function detectVMwareNetworks() {
  const vmwareNetworks = {
    available: false,
    networks: []
  };
  
  // Check for VMware network configuration
  if (process.platform === 'linux' && fs.existsSync('/etc/vmware/networking')) {
    vmwareNetworks.available = true;
    
    // Try to parse the networking file
    const networking = fs.readFileSync('/etc/vmware/networking', 'utf8');
    
    // Look for network definitions
    const answerSections = networking.match(/answer VNET_\d+_HOSTONLY_SUBNET ([^#\n]+)/g);
    if (answerSections) {
      answerSections.forEach(section => {
        const match = section.match(/answer VNET_(\d+)_HOSTONLY_SUBNET ([^#\n]+)/);
        if (match && match[1] && match[2]) {
          const id = match[1];
          const subnet = match[2];
          
          // Look for corresponding netmask
          const netmaskMatch = networking.match(new RegExp(`answer VNET_${id}_HOSTONLY_NETMASK ([^#\\n]+)`));
          let netmask = '';
          if (netmaskMatch && netmaskMatch[1]) netmask = netmaskMatch[1];
          
          vmwareNetworks.networks.push({
            id: `vmnet${id}`,
            type: 'hostonly',
            subnet,
            netmask
          });
        }
      });
    }
    
    // Look for NAT networks
    const natSections = networking.match(/answer VNET_\d+_NAT ([^#\n]+)/g);
    if (natSections) {
      natSections.forEach(section => {
        const match = section.match(/answer VNET_(\d+)_NAT ([^#\n]+)/);
        if (match && match[1] && match[2] && match[2] === 'yes') {
          const id = match[1];
          
          // Look for corresponding subnet
          const subnetMatch = networking.match(new RegExp(`answer VNET_${id}_HOSTONLY_SUBNET ([^#\\n]+)`));
          let subnet = '';
          if (subnetMatch && subnetMatch[1]) subnet = subnetMatch[1];
          
          // Look for corresponding netmask
          const netmaskMatch = networking.match(new RegExp(`answer VNET_${id}_HOSTONLY_NETMASK ([^#\\n]+)`));
          let netmask = '';
          if (netmaskMatch && netmaskMatch[1]) netmask = netmaskMatch[1];
          
          vmwareNetworks.networks.push({
            id: `vmnet${id}`,
            type: 'nat',
            subnet,
            netmask
          });
        }
      });
    }
  } else if (process.platform === 'darwin' && fs.existsSync('/Library/Preferences/VMware Fusion/networking')) {
    vmwareNetworks.available = true;
    
    // Same parsing logic as Linux
    const networking = fs.readFileSync('/Library/Preferences/VMware Fusion/networking', 'utf8');
    
    // Similar parsing as Linux version
    // Implementation would be similar
  }
  
  return vmwareNetworks;
}

// Function to detect Hyper-V (Windows only)
function detectHyperV() {
  const hyperv = {
    installed: false,
    running: false,
    type: 'hypervisor',
    details: {}
  };
  
  if (process.platform !== 'win32') {
    return hyperv;
  }
  
  // Check if Hyper-V feature is installed
  const featureCheck = safeExec('powershell "Get-WindowsOptionalFeature -FeatureName Microsoft-Hyper-V-All -Online | Select-Object -ExpandProperty State"');
  hyperv.installed = featureCheck === 'Enabled';
  
  // Check if Hyper-V service is running
  hyperv.running = isServiceRunning('vmms');
  
  if (hyperv.installed) {
    // Get version (based on Windows version)
    const windowsVersion = safeExec('powershell "(Get-WmiObject -class Win32_OperatingSystem).Version"');
    hyperv.version = windowsVersion || 'unknown';
    
    // Check if we can list VMs
    const vms = safeExec('powershell "Get-VM | Select-Object -ExpandProperty Name"');
    hyperv.active = !!vms;
    
    if (hyperv.active) {
      // Count VMs
      const vmCount = vms.split('\n').filter(Boolean).length;
      hyperv.details.vms = vmCount;
      
      // Count running VMs
      const runningVms = safeExec('powershell "Get-VM | Where-Object {$_.State -eq \'Running\'} | Select-Object -ExpandProperty Name"');
      hyperv.details.runningVms = runningVms ? runningVms.split('\n').filter(Boolean).length : 0;
    }
  }
  
  return hyperv;
}

// Function to detect Hyper-V networks
function detectHyperVNetworks() {
  const hypervNetworks = {
    available: false,
    networks: []
  };
  
  if (process.platform === 'win32') {
    const switches = safeExec('powershell "Get-VMSwitch | Select-Object Name,SwitchType,NetAdapterInterfaceDescription | ConvertTo-Csv -NoTypeInformation"');
    
    if (switches) {
      hypervNetworks.available = true;
      
      const lines = switches.split('\n');
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(',');
          if (parts.length >= 3) {
            const name = parts[0].replace(/"/g, '');
            const type = parts[1].replace(/"/g, '');
            const interfaceDesc = parts[2].replace(/"/g, '');
            
            hypervNetworks.networks.push({
              name,
              type,
              interfaceDescription: interfaceDesc
            });
          }
        }
      }
    }
  }
  
  return hypervNetworks;
}

// Function to detect if running inside a container or VM
function detectVirtualizationGuest() {
  const guest = {
    isVirtual: false,
    type: 'unknown',
    details: {}
  };
  
  // Check various methods to determine if we're in a virtualized env
  
  // Method 1: Check systemd-detect-virt if available
  const systemdDetect = safeExec('systemd-detect-virt');
  if (systemdDetect && systemdDetect !== 'none') {
    guest.isVirtual = true;
    guest.type = systemdDetect;
    return guest;
  }
  
  // Method 2: Check /proc/cpuinfo
  if (fs.existsSync('/proc/cpuinfo')) {
    const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    
    if (cpuinfo.includes('hypervisor')) {
      guest.isVirtual = true;
      
      // Try to determine hypervisor type
      if (cpuinfo.includes('VMware')) {
        guest.type = 'vmware';
      } else if (cpuinfo.includes('KVM')) {
        guest.type = 'kvm';
      } else if (cpuinfo.includes('Microsoft Hv')) {
        guest.type = 'hyper-v';
      } else if (cpuinfo.includes('QEMU')) {
        guest.type = 'qemu';
      } else if (cpuinfo.includes('Xen')) {
        guest.type = 'xen';
      }
    }
  }
  
  // Method 3: Check dmesg
  const dmesg = safeExec('dmesg | grep -i virtual');
  if (dmesg) {
    guest.isVirtual = true;
    
    if (dmesg.includes('VMware')) {
      guest.type = 'vmware';
    } else if (dmesg.includes('KVM')) {
      guest.type = 'kvm';
    } else if (dmesg.includes('Microsoft Hyper-V')) {
      guest.type = 'hyper-v';
    } else if (dmesg.includes('QEMU')) {
      guest.type = 'qemu';
    } else if (dmesg.includes('Xen')) {
      guest.type = 'xen';
    } else if (dmesg.includes('VirtualBox')) {
      guest.type = 'virtualbox';
    }
  }
  
  // Method 4: Check DMI
  const dmidecode = safeExec('dmidecode -s system-manufacturer');
  if (dmidecode) {
    if (dmidecode.includes('VMware')) {
      guest.isVirtual = true;
      guest.type = 'vmware';
    } else if (dmidecode.includes('Microsoft Corporation')) {
      guest.isVirtual = true;
      guest.type = 'hyper-v';
    } else if (dmidecode.includes('QEMU')) {
      guest.isVirtual = true;
      guest.type = 'qemu';
    } else if (dmidecode.includes('Xen')) {
      guest.isVirtual = true;
      guest.type = 'xen';
    } else if (dmidecode.includes('innotek GmbH')) {
      guest.isVirtual = true;
      guest.type = 'virtualbox';
    }
  }
  
  // Method 5: Check for container environment
  // Docker
  if (fs.existsSync('/.dockerenv') || fs.existsSync('/run/.containerenv')) {
    guest.isVirtual = true;
    guest.type = 'container';
    guest.details.containerType = 'docker';
    return guest;
  }
  
  // LXC
  if (safeExec('grep -q container=lxc /proc/1/environ')) {
    guest.isVirtual = true;
    guest.type = 'container';
    guest.details.containerType = 'lxc';
    return guest;
  }
  
  return guest;
}

// Function to detect virtual network interfaces
function detectVirtualInterfaces() {
  const vInterfaces = {
    available: false,
    interfaces: []
  };
  
  // Check for virtual interfaces
  if (process.platform === 'linux') {
    const ifconfig = safeExec('ip -j addr');
    if (ifconfig) {
      try {
        const interfaces = JSON.parse(ifconfig);
        vInterfaces.available = true;
        
        interfaces.forEach(iface => {
          // Look for virtual interfaces
          if (iface.ifname.startsWith('docker') || 
              iface.ifname.startsWith('veth') || 
              iface.ifname.startsWith('br-') || 
              iface.ifname.startsWith('virbr') || 
              iface.ifname.startsWith('lxc') || 
              iface.ifname.startsWith('vnet') || 
              iface.ifname.startsWith('vmnet') || 
              iface.ifname.startsWith('tun') || 
              iface.ifname.startsWith('tap')) {
            
            const addresses = iface.addr_info ? iface.addr_info.map(addr => {
              return {
                family: addr.family === 2 ? 'inet' : 'inet6',
                address: addr.local,
                prefixlen: addr.prefixlen
              };
            }) : [];
            
            vInterfaces.interfaces.push({
              name: iface.ifname,
              type: iface.ifname.startsWith('docker') ? 'docker' :
                    iface.ifname.startsWith('veth') ? 'veth' :
                    iface.ifname.startsWith('br-') ? 'bridge' :
                    iface.ifname.startsWith('virbr') ? 'libvirt' :
                    iface.ifname.startsWith('lxc') ? 'lxc' :
                    iface.ifname.startsWith('vnet') ? 'libvirt' :
                    iface.ifname.startsWith('vmnet') ? 'vmware' :
                    iface.ifname.startsWith('tun') ? 'tunnel' :
                    iface.ifname.startsWith('tap') ? 'tap' : 'unknown',
              addresses: addresses,
              state: iface.operstate
            });
          }
        });
      } catch (e) {
        // JSON parsing failed
        // Try with ifconfig instead
        const ifconfigOutput = safeExec('ifconfig');
        
        if (ifconfigOutput) {
          vInterfaces.available = true;
          
          let current = null;
          const interfaces = ifconfigOutput.split('\n\n');
          
          interfaces.forEach(block => {
            const firstLine = block.split('\n')[0];
            if (firstLine) {
              const nameMatch = firstLine.match(/^(\S+)/);
              
              if (nameMatch && nameMatch[1]) {
                const name = nameMatch[1];
                
                if (name.startsWith('docker') || 
                    name.startsWith('veth') || 
                    name.startsWith('br-') || 
                    name.startsWith('virbr') || 
                    name.startsWith('lxc') || 
                    name.startsWith('vnet') || 
                    name.startsWith('vmnet') || 
                    name.startsWith('tun') || 
                    name.startsWith('tap')) {
                  
                  const addresses = [];
                  const inetMatch = block.match(/inet\s+(\S+)/);
                  if (inetMatch && inetMatch[1]) {
                    addresses.push({
                      family: 'inet',
                      address: inetMatch[1]
                    });
                  }
                  
                  const inet6Match = block.match(/inet6\s+(\S+)/);
                  if (inet6Match && inet6Match[1]) {
                    addresses.push({
                      family: 'inet6',
                      address: inet6Match[1]
                    });
                  }
                  
                  vInterfaces.interfaces.push({
                    name,
                    type: name.startsWith('docker') ? 'docker' :
                          name.startsWith('veth') ? 'veth' :
                          name.startsWith('br-') ? 'bridge' :
                          name.startsWith('virbr') ? 'libvirt' :
                          name.startsWith('lxc') ? 'lxc' :
                          name.startsWith('vnet') ? 'libvirt' :
                          name.startsWith('vmnet') ? 'vmware' :
                          name.startsWith('tun') ? 'tunnel' :
                          name.startsWith('tap') ? 'tap' : 'unknown',
                    addresses,
                    state: block.includes('UP') ? 'UP' : 'DOWN'
                  });
                }
              }
            }
          });
        }
      }
    }
  } else if (process.platform === 'darwin') {
    const ifconfig = safeExec('ifconfig');
    
    if (ifconfig) {
      vInterfaces.available = true;
      
      let current = null;
      const interfaces = ifconfig.split('\n\n');
      
      interfaces.forEach(block => {
        const firstLine = block.split('\n')[0];
        if (firstLine) {
          const nameMatch = firstLine.match(/^(\S+)/);
          
          if (nameMatch && nameMatch[1]) {
            const name = nameMatch[1];
            
            if (name.startsWith('bridge') || 
                name.startsWith('vnic') || 
                name.startsWith('vmnet') || 
                name.startsWith('tun') || 
                name.startsWith('tap') || 
                name.startsWith('utun')) {
              
              const addresses = [];
              const inetMatch = block.match(/inet\s+(\S+)/);
              if (inetMatch && inetMatch[1]) {
                addresses.push({
                  family: 'inet',
                  address: inetMatch[1]
                });
              }
              
              const inet6Match = block.match(/inet6\s+(\S+)/);
              if (inet6Match && inet6Match[1]) {
                addresses.push({
                  family: 'inet6',
                  address: inet6Match[1]
                });
              }
              
              vInterfaces.interfaces.push({
                name,
                type: name.startsWith('bridge') ? 'bridge' :
                      name.startsWith('vnic') ? 'vnic' :
                      name.startsWith('vmnet') ? 'vmware' :
                      name.startsWith('tun') ? 'tunnel' :
                      name.startsWith('utun') ? 'utun' :
                      name.startsWith('tap') ? 'tap' : 'unknown',
                addresses,
                state: block.includes('UP') ? 'UP' : 'DOWN'
              });
            }
          }
        }
      });
    }
  } else if (process.platform === 'win32') {
    const interfaces = safeExec('powershell "Get-NetAdapter | Where-Object {$_.InterfaceDescription -like \'*Virtual*\' -or $_.InterfaceDescription -like \'*VMware*\' -or $_.InterfaceDescription -like \'*VirtualBox*\'} | Select-Object Name,InterfaceDescription,Status | ConvertTo-Csv -NoTypeInformation"');
    
    if (interfaces) {
      vInterfaces.available = true;
      
      const lines = interfaces.split('\n');
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(',');
          if (parts.length >= 3) {
            const name = parts[0].replace(/"/g, '');
            const description = parts[1].replace(/"/g, '');
            const status = parts[2].replace(/"/g, '');
            
            // Get IP addresses
            const addresses = [];
            const ipAddresses = safeExec(`powershell "Get-NetIPAddress -InterfaceAlias '${name}' | Select-Object IPAddress,AddressFamily | ConvertTo-Csv -NoTypeInformation"`);
            
            if (ipAddresses) {
              const ipLines = ipAddresses.split('\n');
              // Skip header
              for (let j = 1; j < ipLines.length; j++) {
                const ipLine = ipLines[j].trim();
                if (ipLine) {
                  const ipParts = ipLine.split(',');
                  if (ipParts.length >= 2) {
                    const address = ipParts[0].replace(/"/g, '');
                    const family = ipParts[1].replace(/"/g, '') === '2' ? 'inet' : 'inet6';
                    
                    addresses.push({
                      family,
                      address
                    });
                  }
                }
              }
            }
            
            let type = 'unknown';
            if (description.includes('VMware')) type = 'vmware';
            else if (description.includes('VirtualBox')) type = 'virtualbox';
            else if (description.includes('Hyper-V')) type = 'hyper-v';
            else if (description.includes('Virtual')) type = 'virtual';
            
            vInterfaces.interfaces.push({
              name,
              description,
              type,
              addresses,
              state: status
            });
          }
        }
      }
    }
  }
  
  return vInterfaces;
}

// Main function to gather all virtualization information
function gatherVirtualizationInfo() {
  // Detect if we're running as a guest
  const guestInfo = detectVirtualizationGuest();
  
  // Gather information about virtualization technologies
  const docker = detectDocker();
  const kubernetes = detectKubernetes();
  const lxc = detectLXC();
  const xen = detectXen();
  const qemu = detectQemu();
  const virtualbox = detectVirtualBox();
  const vmware = detectVMware();
  const hyperv = detectHyperV();
  
  // Gather network information
  const dockerNetworks = docker.active ? detectDockerNetworks() : { available: false, networks: [] };
  const kubernetesNetworks = kubernetes.active ? detectKubernetesNetworks() : { available: false, networks: [] };
  const lxcNetworks = lxc.active ? detectLXCNetworks() : { available: false, networks: [] };
  const qemuNetworks = qemu.active ? detectQemuNetworks() : { available: false, networks: [] };
  const vboxNetworks = virtualbox.active ? detectVirtualBoxNetworks() : { available: false, networks: [] };
  const vmwareNetworks = vmware.active ? detectVMwareNetworks() : { available: false, networks: [] };
  const hypervNetworks = hyperv.active ? detectHyperVNetworks() : { available: false, networks: [] };
  
  // Detect virtual interfaces
  const virtualInterfaces = detectVirtualInterfaces();
  
  // Create final JSON structure
  const result = {
    system: {
      platform: process.platform,
      hostname: os.hostname(),
      osType: os.type(),
      osRelease: os.release(),
      timestamp: new Date().toISOString()
    },
    virtualizationGuest: guestInfo,
    virtualizationHosts: {
      docker,
      kubernetes,
      lxc,
      xen,
      qemu,
      virtualbox,
      vmware,
      hyperv
    },
    virtualNetworks: {
      docker: dockerNetworks,
      kubernetes: kubernetesNetworks,
      lxc: lxcNetworks,
      qemu: qemuNetworks,
      virtualbox: vboxNetworks,
      vmware: vmwareNetworks,
      hyperv: hypervNetworks,
      interfaces: virtualInterfaces
    }
  };
  
  return result;
}

// Execute and print results
const virtInfo = gatherVirtualizationInfo();
console.log(JSON.stringify(virtInfo, null, 2));