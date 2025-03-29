const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');

// Configuration for different environments
const ENV_TYPES = {
  production: 'production',
  development: 'development',
  staging: 'staging'
};

// Map environment names to file naming convention
const ENV_FILE_NAMES = {
  production: '.production.env',
  development: '.development.env',
  staging: '.stage.env'
};

// Certificate paths
const CERT_DIR = 'certs';
const CA_CERT_PATH = path.join(CERT_DIR, 'ca.cert');
const CA_KEY_PATH = path.join(CERT_DIR, 'ca.key');
const CSR_PATH = path.join(CERT_DIR, 'ca.csr');

// CA configuration
const CA_CONFIG = {
  commonName: 'Local Development CA',
  countryName: 'US',
  stateOrProvinceName: 'California',
  localityName: 'San Francisco',
  organizationName: 'Development',
  organizationalUnitName: 'IT',
  emailAddress: 'admin@example.com',
  validity: 365 * 5 // 5 years
};

/**
 * Checks if a certificate authority exists
 * @returns {boolean} True if CA exists, false otherwise
 */
function caExists() {
  return fs.existsSync(CA_CERT_PATH) && fs.existsSync(CA_KEY_PATH);
}

/**
 * Creates a directory if it doesn't exist
 * @param {string} dir - Directory path to create
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Creates a self-signed certificate authority using OpenSSL
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function createSelfSignedCA() {
  return new Promise((resolve, reject) => {
    try {
      ensureDirectoryExists(CERT_DIR);
      
      console.log('Generating CA private key...');
      execSync(`openssl genrsa -out ${CA_KEY_PATH} 4096`, { stdio: 'inherit' });
      
      console.log('Creating CSR configuration...');
      const csrConfigPath = path.join(CERT_DIR, 'ca.cnf');
      const csrConfig = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = ${CA_CONFIG.commonName}
C = ${CA_CONFIG.countryName}
ST = ${CA_CONFIG.stateOrProvinceName}
L = ${CA_CONFIG.localityName}
O = ${CA_CONFIG.organizationName}
OU = ${CA_CONFIG.organizationalUnitName}
emailAddress = ${CA_CONFIG.emailAddress}

[v3_req]
basicConstraints = critical, CA:true
keyUsage = critical, keyCertSign, cRLSign
`;
      fs.writeFileSync(csrConfigPath, csrConfig);
      
      console.log('Generating CSR...');
      execSync(`openssl req -new -key ${CA_KEY_PATH} -out ${CSR_PATH} -config ${csrConfigPath}`, { stdio: 'inherit' });
      
      console.log('Self-signing certificate...');
      execSync(
        `openssl x509 -req -in ${CSR_PATH} -signkey ${CA_KEY_PATH} -out ${CA_CERT_PATH} ` +
        `-days ${CA_CONFIG.validity} -extfile ${csrConfigPath} -extensions v3_req`,
        { stdio: 'inherit' }
      );
      
      console.log('Certificate Authority created successfully.');
      
      // Create PEM format if needed
      const caCert = fs.readFileSync(CA_CERT_PATH);
      const caKey = fs.readFileSync(CA_KEY_PATH);
      fs.writeFileSync(path.join(CERT_DIR, 'ca.pem'), Buffer.concat([caCert, caKey]));
      
      console.log('Verifying certificate...');
      const verifyOutput = execSync(`openssl x509 -in ${CA_CERT_PATH} -text -noout`, { encoding: 'utf8' });
      console.log(verifyOutput.split('\n').slice(0, 10).join('\n') + '\n...');
      
      resolve(true);
    } catch (error) {
      console.error('Error creating self-signed CA:', error.message);
      reject(error);
    }
  });
}

/**
 * Sets up Let's Encrypt certificate using certbot
 * @param {string} domain - Domain name for the certificate
 * @param {string} email - Email address for Let's Encrypt notifications
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function setupLetsEncrypt(domain, email) {
  return new Promise((resolve, reject) => {
    try {
      ensureDirectoryExists(CERT_DIR);
      
      // Check if certbot is installed
      try {
        execSync('certbot --version', { stdio: 'ignore' });
      } catch (error) {
        console.error('Certbot is not installed. Please install certbot first.');
        console.log('You can install it with:');
        console.log('  Ubuntu/Debian: sudo apt-get install certbot');
        console.log('  CentOS/RHEL: sudo yum install certbot');
        console.log('  macOS: brew install certbot');
        reject(new Error('Certbot not installed'));
        return;
      }
      
      console.log(`Setting up Let's Encrypt certificate for ${domain}...`);
      
      // Use certbot in standalone mode
      const certbotArgs = [
        'certonly',
        '--standalone',
        '--agree-tos',
        '--non-interactive',
        '-d', domain,
        '--email', email,
        '--cert-path', path.join(CERT_DIR, 'cert.pem'),
        '--key-path', path.join(CERT_DIR, 'key.pem'),
        '--fullchain-path', path.join(CERT_DIR, 'fullchain.pem')
      ];
      
      const certbot = spawn('certbot', certbotArgs, { stdio: 'inherit' });
      
      certbot.on('close', (code) => {
        if (code === 0) {
          console.log(`Successfully obtained Let's Encrypt certificate for ${domain}`);
          resolve(true);
        } else {
          console.error(`Failed to obtain Let's Encrypt certificate, exit code: ${code}`);
          reject(new Error(`Certbot failed with exit code ${code}`));
        }
      });
    } catch (error) {
      console.error('Error setting up Let\'s Encrypt:', error.message);
      reject(error);
    }
  });
}

/**
 * Check for SSL tools and CA
 * @returns {Object} Info about SSL tools and CA status
 */
function checkSslTools() {
  const sslTools = {
    openssl: {
      installed: false,
      version: ''
    },
    certbot: {
      installed: false,
      version: ''
    },
    ca: {
      exists: caExists(),
      path: caExists() ? CA_CERT_PATH : null
    }
  };
  
  // Check OpenSSL
  try {
    const opensslVersion = execSync('openssl version', { encoding: 'utf8' }).trim();
    sslTools.openssl.installed = true;
    sslTools.openssl.version = opensslVersion;
  } catch (error) {
    console.warn('OpenSSL not found. Cannot create self-signed certificates.');
  }
  
  // Check Certbot
  try {
    const certbotVersion = execSync('certbot --version', { encoding: 'utf8' }).trim();
    sslTools.certbot.installed = true;
    sslTools.certbot.version = certbotVersion;
  } catch (error) {
    console.warn('Certbot not found. Cannot use Let\'s Encrypt for certificates.');
  }
  
  return sslTools;
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    env: ENV_TYPES.development,
    ca: {
      create: false,
      type: null,
      domain: null,
      email: null
    }
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Environment
    if (Object.values(ENV_TYPES).includes(arg)) {
      options.env = arg;
    }
    
    // CA options
    else if (arg === '--ca') {
      options.ca.create = true;
      options.ca.type = 'self-signed';
    }
    else if (arg === '--ca-letsencrypt') {
      options.ca.create = true;
      options.ca.type = 'letsencrypt';
      
      // Look for domain and email
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.ca.domain = args[++i];
      } else {
        throw new Error('Domain name is required for Let\'s Encrypt');
      }
      
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options.ca.email = args[++i];
      } else {
        throw new Error('Email address is required for Let\'s Encrypt');
      }
    }
  }
  
  return options;
}

async function runSetup() {
  try {
    // Parse arguments
    const options = parseArgs();
    const env = options.env;
    
    if (!Object.values(ENV_TYPES).includes(env)) {
      throw new Error(`Invalid environment specified. Must be one of: ${Object.values(ENV_TYPES).join(', ')}`);
    }
    
    console.log(`Setting up environment: ${env}`);
    
    // Check SSL tools if CA creation is requested
    let sslInfo = null;
    if (options.ca.create) {
      sslInfo = checkSslTools();
      
      if (options.ca.type === 'self-signed' && !sslInfo.openssl.installed) {
        throw new Error('OpenSSL is required for creating self-signed certificates');
      }
      
      if (options.ca.type === 'letsencrypt' && !sslInfo.certbot.installed) {
        throw new Error('Certbot is required for setting up Let\'s Encrypt certificates');
      }
      
      // Create CA if requested and doesn't exist
      if (!sslInfo.ca.exists) {
        if (options.ca.type === 'self-signed') {
          console.log('Creating self-signed Certificate Authority...');
          await createSelfSignedCA();
        } else if (options.ca.type === 'letsencrypt') {
          console.log('Setting up Let\'s Encrypt certificate...');
          await setupLetsEncrypt(options.ca.domain, options.ca.email);
        }
      } else {
        console.log('Certificate Authority already exists at', sslInfo.ca.path);
      }
    }
    
    // Services to run and collect data from
    const services = [
      'dbservices.js',
      'dirservices.js',
      'mailservices.js',
      'netservices.js',
      'virtservices.js'
    ];
    
    let envData = {
      NODE_ENV: env,
      ENVIRONMENT: env,
      GENERATED_AT: new Date().toISOString()
    };
    
    // Add CA info if it exists
    if (caExists()) {
      envData.SSL_CA_CERT = CA_CERT_PATH;
      envData.SSL_CA_KEY = CA_KEY_PATH;
      envData.SSL_ENABLED = 'true';
    }
    
    // Create directory for service data
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    // Run each service and collect its output
    for (const service of services) {
      console.log(`Running ${service}...`);
      try {
        // Execute the service with environment parameter
        const output = execSync(`node ${service} ${env}`, {
          encoding: 'utf8'
        });
        
        // Parse the JSON output
        const serviceData = JSON.parse(output);
        
        // Save raw output to data directory
        const serviceName = path.basename(service, '.js');
        fs.writeFileSync(path.join(dataDir, `${serviceName}_${env}.json`), output);
        
        // Process data to filter out non-installed/non-running services
        const filteredData = filterServiceData(serviceData);
        
        // Flatten the filtered data for .env file format
        const flattenedData = flattenObject(filteredData);
        
        // Merge flattened data into our env data
        envData = { ...envData, ...flattenedData };
      } catch (error) {
        console.error(`Error running ${service}:`, error.message);
        if (error.stdout) console.error('Service output:', error.stdout);
        if (error.stderr) console.error('Service error:', error.stderr);
      }
    }
    
    // Format data for .env file
    const envContent = Object.entries(envData)
      .map(([key, value]) => {
        // Handle different value types appropriately
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if it contains spaces
          if (value.includes(' ') || value.includes('=')) {
            return `${key}="${value.replace(/"/g, '\\"')}"`;
          }
          return `${key}=${value}`;
        } else if (typeof value === 'boolean' || typeof value === 'number') {
          return `${key}=${value}`;
        } else if (value === null || value === undefined) {
          return `${key}=`;
        } else {
          // For objects or arrays, stringify them
          return `${key}='${JSON.stringify(value)}'`;
        }
      })
      .join('\n');
    
    // Get the appropriate file name
    const envFileName = ENV_FILE_NAMES[env] || `.${env}.env`;
    
    // Write to environment file
    fs.writeFileSync(envFileName, envContent);
    console.log(`Successfully created ${envFileName}`);
    
    // Also create a .env symlink or copy if in production for applications that expect .env
    if (env === ENV_TYPES.production) {
      try {
        if (process.platform !== 'win32') {
          // Create symlink on Unix-like platforms
          if (fs.existsSync('.env')) {
            fs.unlinkSync('.env');
          }
          fs.symlinkSync(envFileName, '.env');
          console.log('Created symlink .env -> ' + envFileName);
        } else {
          // Copy on Windows (no symlinks)
          fs.copyFileSync(envFileName, '.env');
          console.log('Copied ' + envFileName + ' to .env');
        }
      } catch (error) {
        console.error('Warning: Failed to create .env symlink/copy:', error.message);
      }
    }
    
    console.log(`Environment setup complete for ${env}`);
    
    if (caExists()) {
      console.log(`\nCertificate Authority is available at: ${CA_CERT_PATH}`);
      console.log(`You may need to import this certificate into your browser/OS to trust it.`);
    }
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

// Filter out services that are not installed or not running
function filterServiceData(data) {
  const result = { ...data };
  
  // Process system info separately
  if (result.system) {
    // Keep system info as is
  }
  
  // Process services data
  if (result.services) {
    const filteredServices = {};
    
    // Iterate through each service category
    for (const [categoryName, category] of Object.entries(result.services)) {
      // If it's a direct service object with installed/running properties
      if (category.installed !== undefined && category.running !== undefined) {
        // Only keep if it's installed and running
        if (category.installed && category.running) {
          filteredServices[categoryName] = category;
        }
      } 
      // If it's a category containing multiple services
      else if (typeof category === 'object') {
        const filteredCategory = {};
        let hasActiveServices = false;
        
        // Check each service in the category
        for (const [serviceName, service] of Object.entries(category)) {
          // Only keep if it's installed and running
          if (service.installed && service.running) {
            filteredCategory[serviceName] = service;
            hasActiveServices = true;
          }
        }
        
        // Only add the category if it has active services
        if (hasActiveServices) {
          filteredServices[categoryName] = filteredCategory;
        }
      }
    }
    
    result.services = filteredServices;
  }
  
  // Process network info (handle differently as it doesn't follow the same pattern)
  if (result.network) {
    // Keep network info but could apply filtering if needed
  }
  
  return result;
}

// Helper function to flatten a nested object into a flat object with dot notation keys
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? `${prefix}_` : '';
    
    // Convert key to uppercase for .env convention
    const key = `${pre}${k}`.toUpperCase();
    
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      // Recursively flatten nested objects
      Object.assign(acc, flattenObject(obj[k], key));
    } else {
      // Add leaf node to accumulator
      acc[key] = obj[k];
    }
    
    return acc;
  }, {});
}

// Execute setup
runSetup();
