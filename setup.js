const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

async function runSetup() {
  try {
    // Get environment from command line argument or default to development
    const env = process.argv[2] || ENV_TYPES.development;
    if (!Object.values(ENV_TYPES).includes(env)) {
      throw new Error(`Invalid environment specified. Must be one of: ${Object.values(ENV_TYPES).join(', ')}`);
    }
    
    console.log(`Setting up environment: ${env}`);
    
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