// Description: This script checks the installation and running status of common database services
// (Redis, PostgreSQL, MongoDB, MySQL) on a system.
// It gathers information about the services, including their installation status, running status, default ports, and URLs.
// It also collects system information such as the platform, hostname, OS type, and release version.


const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

// Default port configurations
const DEFAULT_PORTS = {
  redis: 6379,
  postgresql: 5432,
  mongodb: 27017,
  mysql: 3306
};

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if a process is running
function isProcessRunning(processName) {
  try {
    // Different ways to check for running processes
    if (process.platform === 'darwin') { // macOS
      execSync(`pgrep -x ${processName}`, { stdio: 'ignore' });
    } else { // Linux/Unix
      execSync(`pgrep ${processName}`, { stdio: 'ignore' });
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if a port is in use
function isPortInUse(port) {
  try {
    execSync(`lsof -i:${port} -P -n -t`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to get service connection details
function getServiceDetails(service) {
  const result = {
    installed: false,
    running: false,
    url: null,
    port: DEFAULT_PORTS[service],
    status: 'not installed'
  };

  // Check if the service is installed based on common commands or paths
  switch (service) {
    case 'redis':
      result.installed = commandExists('redis-cli') || 
                         commandExists('redis-server') || 
                         fs.existsSync('/usr/bin/redis-server') || 
                         fs.existsSync('/usr/local/bin/redis-server');
      result.running = isProcessRunning('redis-server') || isPortInUse(result.port);
      result.url = `redis://localhost:${result.port}`;
      break;
    
    case 'postgresql':
      result.installed = commandExists('psql') || 
                         commandExists('pg_ctl') || 
                         fs.existsSync('/usr/bin/postgres') || 
                         fs.existsSync('/usr/local/bin/postgres');
      result.running = isProcessRunning('postgres') || isPortInUse(result.port);
      result.url = `postgresql://localhost:${result.port}`;
      break;
    
    case 'mongodb':
      result.installed = commandExists('mongo') || 
                         commandExists('mongod') || 
                         fs.existsSync('/usr/bin/mongod') || 
                         fs.existsSync('/usr/local/bin/mongod');
      result.running = isProcessRunning('mongod') || isPortInUse(result.port);
      result.url = `mongodb://localhost:${result.port}`;
      break;
    
    case 'mysql':
      result.installed = commandExists('mysql') || 
                         commandExists('mysqld') || 
                         fs.existsSync('/usr/bin/mysql') || 
                         fs.existsSync('/usr/local/bin/mysql');
      result.running = isProcessRunning('mysqld') || 
                       isProcessRunning('mysql') || 
                       isPortInUse(result.port);
      result.url = `mysql://localhost:${result.port}`;
      break;
  }

  // Update status based on installation and running state
  if (result.installed) {
    result.status = result.running ? 'running' : 'installed but not running';
  }

  return result;
}

// Main function to check all services
function checkAllServices() {
  const services = ['redis', 'postgresql', 'mongodb', 'mysql'];
  const results = {};

  // Get system information
  const systemInfo = {
    platform: process.platform,
    hostname: os.hostname(),
    osType: os.type(),
    osRelease: os.release(),
    timestamp: new Date().toISOString()
  };

  // Check each service
  services.forEach(service => {
    results[service] = getServiceDetails(service);
  });

  // Combine system info and service results
  const output = {
    system: systemInfo,
    services: results
  };

  // Output as formatted JSON
  console.log(JSON.stringify(output, null, 2));
}

// Run the checker
checkAllServices();