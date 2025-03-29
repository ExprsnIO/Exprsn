// app.js - Main application file with enhanced features
const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const vhost = require('vhost');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ejs = require('ejs');
const moment = require('moment');
const axios = require('axios');
const winston = require('winston');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('better-sqlite3');
const { promisify } = require('util');
const oauth2orize = require('oauth2orize');
const uuid = require('uuid');
const ActivitypubExpress = require('activitypub-express');
const NodeCache = require('node-cache');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const openid = require('openid-client');
const crypto = require('crypto');

// Structured logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'exprsn-platform' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Configuration
const config = {
  baseDomain: process.env.BASE_DOMAIN || 'exprsn.io',
  port: process.env.PORT || 80,
  sslPort: process.env.SSL_PORT || 443,
  sitesDir: process.env.SITES_DIR || path.join(__dirname, 'sites'),
  routesDir: process.env.ROUTES_DIR || path.join(__dirname, 'routes'),
  sharedNodeModules: process.env.SHARED_NODE_MODULES || path.join(__dirname, 'node_modules'),
  statusPollingInterval: process.env.STATUS_POLLING_INTERVAL || 30000, // 30 seconds
  configDir: process.env.CONFIG_DIR || path.join(__dirname, 'config'),
  backupsDir: process.env.BACKUPS_DIR || path.join(__dirname, 'backups'),
  sslCertsDir: process.env.SSL_CERTS_DIR || path.join(__dirname, 'ssl'),
  sessionSecret: process.env.SESSION_SECRET || 'exprsn-session-secret-key',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || '', // Hash this in production
  jwtSecret: process.env.JWT_SECRET || 'exprsn-jwt-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  dbPath: process.env.DB_PATH || path.join(__dirname, 'db', 'exprsn.db'),
  uploadsDir: process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'),
  mediaDir: process.env.MEDIA_DIR || path.join(__dirname, 'media'),
  // OAuth 2.0 configuration
  oauth: {
    authorizationCodeLifetime: 600, // 10 minutes
    accessTokenLifetime: 3600 * 24, // 24 hours
    refreshTokenLifetime: 3600 * 24 * 30, // 30 days
    issuer: process.env.OAUTH_ISSUER || `https://auth.${process.env.BASE_DOMAIN || 'exprsn.io'}`,
    jwksPath: process.env.JWKS_PATH || path.join(__dirname, 'config', 'jwks.json'),
  },
  // ActivityPub federation configuration
  federation: {
    enabled: process.env.FEDERATION_ENABLED === 'true' || true,
    blacklist: (process.env.FEDERATION_BLACKLIST || '').split(',').filter(Boolean),
    whitelist: (process.env.FEDERATION_WHITELIST || '').split(',').filter(Boolean),
  }
};

// Ensure required directories exist
[
  config.sitesDir, 
  config.configDir, 
  config.backupsDir, 
  config.sslCertsDir, 
  config.routesDir,
  config.uploadsDir,
  config.mediaDir,
  path.join(config.mediaDir, 'avatars'),
  path.join(config.mediaDir, 'posts')
].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    } catch (error) {
      logger.error(`Failed to create directory: ${dir}`, { error: error.message });
    }
  }
});

// Create or load JWKS (JSON Web Key Set) for OAuth/OpenID signing
function setupJwks() {
  try {
    let jwks;
    
    if (fs.existsSync(config.oauth.jwksPath)) {
      jwks = JSON.parse(fs.readFileSync(config.oauth.jwksPath, 'utf8'));
      logger.info('Loaded existing JWKS');
    } else {
      // Generate a new RSA key pair for signing tokens
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      
      // Create a JWK from the keys
      const publicJwk = {
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid: uuidv4(),
        // We'd need to convert the PEM to JWK components
        // This is simplified - in practice use a library like jose
        n: Buffer.from(publicKey).toString('base64url'),
        e: 'AQAB'
      };
      
      jwks = {
        keys: [publicJwk],
        privateKeys: {
          [publicJwk.kid]: privateKey
        }
      };
      
      fs.writeFileSync(config.oauth.jwksPath, JSON.stringify(jwks, null, 2));
      logger.info('Generated and saved new JWKS');
    }
    
    return jwks;
  } catch (error) {
    logger.error('Failed to setup JWKS', { error: error.message });
    throw error;
  }
}

const jwks = setupJwks();

// SQLite Database Setup
function setupDatabase() {
  try {
    // Initialize the database connection
    const db = new sqlite3(config.dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });
    
    // Create users table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        display_name TEXT,
        bio TEXT,
        avatar_url TEXT,
        subdomain TEXT UNIQUE,
        federation_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        verified BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        settings TEXT
      );
      
      CREATE TABLE IF NOT EXISTS oauth_clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        client_secret TEXT NOT NULL,
        redirect_uris TEXT NOT NULL,
        grant_types TEXT NOT NULL,
        scope TEXT NOT NULL,
        user_id INTEGER,
        logo_url TEXT,
        website_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
        code TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        redirect_uri TEXT NOT NULL,
        scope TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES oauth_clients(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS oauth_access_tokens (
        token TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        scope TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES oauth_clients(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
        token TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        scope TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES oauth_clients(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        attachment_urls TEXT,
        visibility TEXT NOT NULL DEFAULT 'public',
        reply_to INTEGER,
        federation_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (reply_to) REFERENCES posts(id)
      );
      
      CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted BOOLEAN DEFAULT 0,
        UNIQUE(follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id),
        FOREIGN KEY (following_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
      );
      
      CREATE TABLE IF NOT EXISTS reposts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
      );
      
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        actor_id INTEGER,
        object_id INTEGER,
        read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (actor_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS federation_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor TEXT NOT NULL,
        object_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        last_attempt TIMESTAMP,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        priority INTEGER DEFAULT 5
      );
      
      CREATE TABLE IF NOT EXISTS rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        ip_address TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        request_count INTEGER DEFAULT 1,
        reset_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS subdomain_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        subdomain TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        verification_token TEXT UNIQUE,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        settings TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_reply_to ON posts(reply_to);
      CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
      CREATE INDEX IF NOT EXISTS idx_fed_queue_status ON federation_queue(status, attempts);
    `);
    
    // Check if default admin user exists, create if not
    const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get(config.adminUsername);
    
    if (!adminUser) {
      // Hash the admin password
      const hashedPassword = bcrypt.hashSync(config.adminPassword, 10);
      
      // Insert default admin user
      db.prepare(`
        INSERT INTO users (username, email, password, role, verified, display_name, subdomain)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(config.adminUsername, 'admin@exprsn.io', hashedPassword, 'admin', 1, 'System Administrator', 'admin');
      
      logger.info('Created default admin user');
    }
    
    // Create default OAuth client for the web application
    const defaultClient = db.prepare('SELECT id FROM oauth_clients WHERE name = ?').get('Exprsn Web App');
    
    if (!defaultClient) {
      const clientId = uuidv4();
      const clientSecret = crypto.randomBytes(32).toString('hex');
      
      db.prepare(`
        INSERT INTO oauth_clients (
          id, name, description, client_secret, redirect_uris, 
          grant_types, scope, is_active, website_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientId,
        'Exprsn Web App',
        'Official web client for the Exprsn platform',
        clientSecret,
        JSON.stringify([`https://app.${config.baseDomain}/callback`, `http://localhost:3000/callback`]),
        JSON.stringify(['authorization_code', 'refresh_token']),
        'read write follow',
        1,
        `https://app.${config.baseDomain}`
      );
      
      logger.info('Created default OAuth client');
      logger.info(`Client ID: ${clientId}`);
      logger.info(`Client Secret: ${clientSecret}`);
    }
    
    logger.info('Database setup completed successfully');
    
    return db;
  } catch (error) {
    logger.error('Database setup failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Initialize the database
const db = setupDatabase();

// In-memory cache for tokens and frequently accessed data
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// User model functions
const UserModel = {
  findById: (id) => {
    try {
      return db.prepare('SELECT id, username, email, role, created_at, is_active, display_name, avatar_url, bio, subdomain, verified, federation_id, settings FROM users WHERE id = ?').get(id);
    } catch (error) {
      logger.error('Error finding user by ID', { error: error.message, id });
      return null;
    }
  },
  
  findByUsername: (username) => {
    try {
      return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    } catch (error) {
      logger.error('Error finding user by username', { error: error.message, username });
      return null;
    }
  },
  
  findByEmail: (email) => {
    try {
      return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    } catch (error) {
      logger.error('Error finding user by email', { error: error.message, email });
      return null;
    }
  },
  
  findBySubdomain: (subdomain) => {
    try {
      return db.prepare('SELECT id, username, email, role, created_at, is_active, display_name, avatar_url, bio, subdomain, verified, federation_id, settings FROM users WHERE subdomain = ?').get(subdomain);
    } catch (error) {
      logger.error('Error finding user by subdomain', { error: error.message, subdomain });
      return null;
    }
  },
  
  findByFederationId: (federationId) => {
    try {
      return db.prepare('SELECT id, username, email, role, created_at, is_active, display_name, avatar_url, bio, subdomain, verified, federation_id, settings FROM users WHERE federation_id = ?').get(federationId);
    } catch (error) {
      logger.error('Error finding user by federation ID', { error: error.message, federationId });
      return null;
    }
  },
  
  create: (userData) => {
    try {
      const { 
        username, 
        email, 
        password, 
        role = 'user',
        display_name = username,
        bio = '',
        avatar_url = null,
        subdomain = null
      } = userData;
      
      // Hash the password
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      // Generate a unique federation ID if not provided
      const federation_id = userData.federation_id || 
                          `https://${subdomain || username}.${config.baseDomain}/user/${username}`;
      
      const result = db.prepare(`
        INSERT INTO users (
          username, email, password, role, display_name, 
          bio, avatar_url, subdomain, federation_id, settings
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        username, 
        email, 
        hashedPassword, 
        role, 
        display_name,
        bio,
        avatar_url,
        subdomain,
        federation_id,
        JSON.stringify({ theme: 'light', notifications: true, privacy: 'public' })
      );
      
      if (result.changes === 1) {
        return { 
          id: result.lastInsertRowid, 
          username, 
          email, 
          role,
          display_name,
          bio,
          avatar_url,
          subdomain,
          federation_id
        };
      }
      return null;
    } catch (error) {
      logger.error('Error creating user', { error: error.message });
      return null;
    }
  },
  
  update: (id, userData) => {
    try {
      const allowedFields = ['display_name', 'bio', 'avatar_url', 'settings', 'is_active'];
      const fields = [];
      const values = [];
      
      Object.entries(userData).forEach(([key, value]) => {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(key === 'settings' && typeof value === 'object' ? JSON.stringify(value) : value);
        }
      });
      
      if (fields.length === 0) return null;
      
      // Add updated_at field
      fields.push('updated_at = CURRENT_TIMESTAMP');
      
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      
      const result = db.prepare(query).run(...values);
      return result.changes > 0;
    } catch (error) {
      logger.error('Error updating user', { error: error.message, id });
      return null;
    }
  },
  
  updatePassword: (id, newPassword) => {
    try {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      const result = db.prepare(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(hashedPassword, id);
      
      return result.changes > 0;
    } catch (error) {
      logger.error('Error updating user password', { error: error.message, id });
      return false;
    }
  },
  
  updateLastLogin: (userId) => {
    try {
      return db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    } catch (error) {
      logger.error('Error updating user last login', { error: error.message, userId });
      return null;
    }
  },
  
  validatePassword: (user, password) => {
    return bcrypt.compareSync(password, user.password);
  },
  
  registerSubdomain: async (userId, subdomain) => {
    try {
      // Check if subdomain is already taken
      const existing = db.prepare('SELECT id FROM subdomain_registrations WHERE subdomain = ?').get(subdomain);
      if (existing) return { success: false, message: 'Subdomain already taken' };
      
      // Check if user already has a subdomain
      const userSubdomain = db.prepare('SELECT id FROM subdomain_registrations WHERE user_id = ?').get(userId);
      if (userSubdomain) return { success: false, message: 'User already has a registered subdomain' };
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Insert registration request
      const result = db.prepare(`
        INSERT INTO subdomain_registrations (
          user_id, subdomain, verification_token, status
        ) VALUES (?, ?, ?, 'pending')
      `).run(userId, subdomain, verificationToken);
      
      if (result.changes === 1) {
        return {
          success: true,
          subdomain,
          verificationToken,
          message: 'Subdomain registration pending verification'
        };
      }
      
      return { success: false, message: 'Failed to register subdomain' };
    } catch (error) {
      logger.error('Error registering subdomain', { error: error.message, userId, subdomain });
      return { success: false, message: 'Error registering subdomain' };
    }
  },
  
  verifySubdomain: async (verificationToken) => {
    try {
      // Find the registration record
      const registration = db.prepare(
        'SELECT * FROM subdomain_registrations WHERE verification_token = ?'
      ).get(verificationToken);
      
      if (!registration) {
        return { success: false, message: 'Invalid verification token' };
      }
      
      // Update registration status
      db.prepare(`
        UPDATE subdomain_registrations 
        SET status = 'verified', verified_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(registration.id);
      
      // Update user's subdomain field
      db.prepare(`
        UPDATE users 
        SET subdomain = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(registration.subdomain, registration.user_id);
      
      // Set up the subdomain site
      setupSite(registration.subdomain);
      
      return {
        success: true,
        subdomain: registration.subdomain,
        message: 'Subdomain verified successfully'
      };
    } catch (error) {
      logger.error('Error verifying subdomain', { error: error.message, token: verificationToken });
      return { success: false, message: 'Error verifying subdomain' };
    }
  }
};

// OAuth models
const OAuthModel = {
  // Client model
  getClient: (clientId, clientSecret) => {
    try {
      const query = clientSecret 
        ? 'SELECT * FROM oauth_clients WHERE id = ? AND client_secret = ? AND is_active = 1'
        : 'SELECT * FROM oauth_clients WHERE id = ? AND is_active = 1';
      
      const params = clientSecret ? [clientId, clientSecret] : [clientId];
      const client = db.prepare(query).get(...params);
      
      if (!client) return null;
      
      return {
        id: client.id,
        clientId: client.id,
        clientSecret: client.client_secret,
        grants: JSON.parse(client.grant_types),
        redirectUris: JSON.parse(client.redirect_uris),
        scope: client.scope
      };
    } catch (error) {
      logger.error('Error getting OAuth client', { error: error.message, clientId });
      return null;
    }
  },
  
  // Authorization code model
  saveAuthorizationCode: (code, client, user) => {
    try {
      const authCode = {
        code: code.authorizationCode,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        scope: code.scope,
        client: { id: client.id },
        user: { id: user.id }
      };
      
      db.prepare(`
        INSERT INTO oauth_authorization_codes (
          code, client_id, user_id, redirect_uri, 
          scope, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        authCode.code,
        authCode.client.id,
        authCode.user.id,
        authCode.redirectUri,
        authCode.scope,
        authCode.expiresAt
      );
      
      return authCode;
    } catch (error) {
      logger.error('Error saving authorization code', { error: error.message });
      return null;
    }
  },
  
  getAuthorizationCode: (authorizationCode) => {
    try {
      const code = db.prepare(`
        SELECT * FROM oauth_authorization_codes WHERE code = ?
      `).get(authorizationCode);
      
      if (!code) return null;
      
      return {
        code: code.code,
        expiresAt: new Date(code.expires_at),
        redirectUri: code.redirect_uri,
        scope: code.scope,
        client: { id: code.client_id },
        user: { id: code.user_id }
      };
    } catch (error) {
      logger.error('Error getting authorization code', { error: error.message, code: authorizationCode });
      return null;
    }
  },
  
  revokeAuthorizationCode: (code) => {
    try {
      const result = db.prepare('DELETE FROM oauth_authorization_codes WHERE code = ?').run(code.code);
      return result.changes > 0;
    } catch (error) {
      logger.error('Error revoking authorization code', { error: error.message });
      return false;
    }
  },
  
  // Token models
  saveToken: (token, client, user) => {
    try {
      // Save access token
      db.prepare(`
        INSERT INTO oauth_access_tokens (
          token, client_id, user_id, scope, expires_at
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        token.accessToken,
        client.id,
        user.id,
        token.scope,
        token.accessTokenExpiresAt
      );
      
      // Save refresh token if provided
      if (token.refreshToken) {
        db.prepare(`
          INSERT INTO oauth_refresh_tokens (
            token, client_id, user_id, scope, expires_at
          ) VALUES (?, ?, ?, ?, ?)
        `).run(
          token.refreshToken,
          client.id,
          user.id,
          token.scope,
          token.refreshTokenExpiresAt
        );
      }
      
      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        client: { id: client.id },
        user: { id: user.id }
      };
    } catch (error) {
      logger.error('Error saving token', { error: error.message });
      return null;
    }
  },
  
  getAccessToken: (accessToken) => {
    try {
      // Check cache first
      const cachedToken = cache.get(`access_token:${accessToken}`);
      if (cachedToken) return cachedToken;
      
      const token = db.prepare(`
        SELECT * FROM oauth_access_tokens WHERE token = ?
      `).get(accessToken);
      
      if (!token) return null;
      
      const result = {
        accessToken: token.token,
        accessTokenExpiresAt: new Date(token.expires_at),
        scope: token.scope,
        client: { id: token.client_id },
        user: { id: token.user_id }
      };
      
      // Cache the result
      cache.set(`access_token:${accessToken}`, result);
      
      return result;
    } catch (error) {
      logger.error('Error getting access token', { error: error.message });
      return null;
    }
  },
  
  getRefreshToken: (refreshToken) => {
    try {
      const token = db.prepare(`
        SELECT * FROM oauth_refresh_tokens WHERE token = ?
      `).get(refreshToken);
      
      if (!token) return null;
      
      return {
        refreshToken: token.token,
        refreshTokenExpiresAt: new Date(token.expires_at),
        scope: token.scope,
        client: { id: token.client_id },
        user: { id: token.user_id }
      };
    } catch (error) {
      logger.error('Error getting refresh token', { error: error.message });
      return null;
    }
  },
  
  revokeToken: (token) => {
    try {
      const result = db.prepare('DELETE FROM oauth_refresh_tokens WHERE token = ?').run(token.refreshToken);
      return result.changes > 0;
    } catch (error) {
      logger.error('Error revoking refresh token', { error: error.message });
      return false;
    }
  },
  
  // Validation functions
  validateScope: (user, client, scope) => {
    if (!scope) return false;
    
    const validScopes = client.scope.split(' ');
    const requestedScopes = scope.split(' ');
    
    return requestedScopes.every(s => validScopes.includes(s)) ? scope : false;
  },
  
  verifyScope: (token, scope) => {
    if (!token.scope) return false;
    
    const tokenScopes = token.scope.split(' ');
    const requiredScopes = scope.split(' ');
    
    return requiredScopes.every(s => tokenScopes.includes(s));
  }
};

// Social Media Models
const SocialModel = {
  // Posts
  createPost: (userId, postData) => {
    try {
      const { 
        content, 
        attachmentUrls = null, 
        visibility = 'public', 
        replyTo = null,
        federationId = null,
        metadata = {}
      } = postData;
      
      const result = db.prepare(`
        INSERT INTO posts (
          user_id, content, attachment_urls, visibility, 
          reply_to, federation_id, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        content,
        attachmentUrls ? JSON.stringify(attachmentUrls) : null,
        visibility,
        replyTo,
        federationId,
        JSON.stringify(metadata)
      );
      
      if (result.changes !== 1) return null;
      
      const postId = result.lastInsertRowid;
      return SocialModel.getPostById(postId);
    } catch (error) {
      logger.error('Error creating post', { error: error.message, userId });
      return null;
    }
  },
  
  getPostById: (postId) => {
    try {
      const post = db.prepare(`
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.subdomain
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `).get(postId);
      
      if (!post) return null;
      
      return {
        ...post,
        attachment_urls: post.attachment_urls ? JSON.parse(post.attachment_urls) : null,
        metadata: post.metadata ? JSON.parse(post.metadata) : {},
      };
    } catch (error) {
      logger.error('Error getting post', { error: error.message, postId });
      return null;
    }
  },
  
  getUserPosts: (userId, page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;
      
      const posts = db.prepare(`
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.subdomain,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM reposts WHERE post_id = p.id) as reposts_count,
          (SELECT COUNT(*) FROM posts WHERE reply_to = p.id) as replies_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(userId, limit, offset);
      
      return posts.map(post => ({
        ...post,
        attachment_urls: post.attachment_urls ? JSON.parse(post.attachment_urls) : null,
        metadata: post.metadata ? JSON.parse(post.metadata) : {},
      }));
    } catch (error) {
      logger.error('Error getting user posts', { error: error.message, userId });
      return [];
    }
  },
  
  getTimeline: (userId, page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;
      
      const timeline = db.prepare(`
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.subdomain,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM reposts WHERE post_id = p.id) as reposts_count,
          (SELECT COUNT(*) FROM posts WHERE reply_to = p.id) as replies_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ? AND accepted = 1
        ) OR p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(userId, userId, limit, offset);
      
      return timeline.map(post => ({
        ...post,
        attachment_urls: post.attachment_urls ? JSON.parse(post.attachment_urls) : null,
        metadata: post.metadata ? JSON.parse(post.metadata) : {},
      }));
    } catch (error) {
      logger.error('Error getting timeline', { error: error.message, userId });
      return [];
    }
  },
  
  // Follows
  followUser: (followerId, followingId) => {
    try {
      // Don't allow following yourself
      if (followerId === followingId) {
        return { success: false, message: "You can't follow yourself" };
      }
      
      // Check if the follow relationship already exists
      const existing = db.prepare(
        'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?'
      ).get(followerId, followingId);
      
      if (existing) {
        if (existing.accepted) {
          return { success: false, message: 'You are already following this user' };
        } else {
          return { success: false, message: 'Follow request already sent' };
        }
      }
      
      // Get following user's privacy setting
      const followingUser = UserModel.findById(followingId);
      if (!followingUser) {
        return { success: false, message: 'User not found' };
      }
      
      let settings = {};
      try {
        settings = JSON.parse(followingUser.settings || '{}');
      } catch (e) {
        settings = {};
      }
      
      // Determine if auto-accept based on privacy settings
      const autoAccept = settings.privacy !== 'private';
      
      // Create the follow relationship
      const result = db.prepare(`
        INSERT INTO follows (follower_id, following_id, accepted)
        VALUES (?, ?, ?)
      `).run(followerId, followingId, autoAccept ? 1 : 0);
      
      if (result.changes !== 1) {
        return { success: false, message: 'Failed to create follow relationship' };
      }
      
      // Create notification for the user being followed
      db.prepare(`
        INSERT INTO notifications (user_id, type, actor_id, data)
        VALUES (?, ?, ?, ?)
      `).run(
        followingId,
        autoAccept ? 'new_follower' : 'follow_request',
        followerId,
        JSON.stringify({ follow_id: result.lastInsertRowid })
      );
      
      return { 
        success: true, 
        message: autoAccept ? 'Now following user' : 'Follow request sent',
        status: autoAccept ? 'following' : 'pending'
      };
    } catch (error) {
      logger.error('Error following user', { error: error.message, followerId, followingId });
      return { success: false, message: 'Error following user' };
    }
  },
  
  unfollowUser: (followerId, followingId) => {
    try {
      const result = db.prepare(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
      ).run(followerId, followingId);
      
      if (result.changes === 0) {
        return { success: false, message: 'You are not following this user' };
      }
      
      return { success: true, message: 'Successfully unfollowed user' };
    } catch (error) {
      logger.error('Error unfollowing user', { error: error.message, followerId, followingId });
      return { success: false, message: 'Error unfollowing user' };
    }
  },
  
  acceptFollowRequest: (followId, userId) => {
    try {
      // Verify the follow request exists and belongs to this user
      const follow = db.prepare(
        'SELECT * FROM follows WHERE id = ? AND following_id = ? AND accepted = 0'
      ).get(followId, userId);
      
      if (!follow) {
        return { success: false, message: 'Follow request not found' };
      }
      
      // Accept the follow request
      const result = db.prepare(
        'UPDATE follows SET accepted = 1 WHERE id = ?'
      ).run(followId);
      
      if (result.changes === 0) {
        return { success: false, message: 'Failed to accept follow request' };
      }
      
      // Create notification for the follower
      db.prepare(`
        INSERT INTO notifications (user_id, type, actor_id, data)
        VALUES (?, ?, ?, ?)
      `).run(
        follow.follower_id,
        'follow_accepted',
        userId,
        null
      );
      
      return { success: true, message: 'Follow request accepted' };
    } catch (error) {
      logger.error('Error accepting follow request', { error: error.message, followId, userId });
      return { success: false, message: 'Error accepting follow request' };
    }
  },
  
  rejectFollowRequest: (followId, userId) => {
    try {
      // Verify the follow request exists and belongs to this user
      const follow = db.prepare(
        'SELECT * FROM follows WHERE id = ? AND following_id = ? AND accepted = 0'
      ).get(followId, userId);
      
      if (!follow) {
        return { success: false, message: 'Follow request not found' };
      }
      
      // Delete the follow request
      const result = db.prepare('DELETE FROM follows WHERE id = ?').run(followId);
      
      if (result.changes === 0) {
        return { success: false, message: 'Failed to reject follow request' };
      }
      
      return { success: true, message: 'Follow request rejected' };
    } catch (error) {
      logger.error('Error rejecting follow request', { error: error.message, followId, userId });
      return { success: false, message: 'Error rejecting follow request' };
    }
  },
  
  // Likes
  likePost: (userId, postId) => {
    try {
      // Check if already liked
      const existing = db.prepare(
        'SELECT * FROM likes WHERE user_id = ? AND post_id = ?'
      ).get(userId, postId);
      
      if (existing) {
        return { success: false, message: 'You already liked this post' };
      }
      
      // Get post to check if it exists and get owner ID
      const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId);
      if (!post) {
        return { success: false, message: 'Post not found' };
      }
      
      // Create the like
      const result = db.prepare(
        'INSERT INTO likes (user_id, post_id) VALUES (?, ?)'
      ).run(userId, postId);
      
      if (result.changes !== 1) {
        return { success: false, message: 'Failed to like post' };
      }
      
      // Create notification if not liking own post
      if (post.user_id !== userId) {
        db.prepare(`
          INSERT INTO notifications (user_id, type, actor_id, object_id, data)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          post.user_id,
          'like',
          userId,
          postId,
          null
        );
      }
      
      return { success: true, message: 'Post liked successfully' };
    } catch (error) {
      logger.error('Error liking post', { error: error.message, userId, postId });
      return { success: false, message: 'Error liking post' };
    }
  },
  
  unlikePost: (userId, postId) => {
    try {
      const result = db.prepare(
        'DELETE FROM likes WHERE user_id = ? AND post_id = ?'
      ).run(userId, postId);
      
      if (result.changes === 0) {
        return { success: false, message: 'You have not liked this post' };
      }
      
      return { success: true, message: 'Post unliked successfully' };
    } catch (error) {
      logger.error('Error unliking post', { error: error.message, userId, postId });
      return { success: false, message: 'Error unliking post' };
    }
  },
  
  // Reposts
  repostPost: (userId, postId) => {
    try {
      // Check if already reposted
      const existing = db.prepare(
        'SELECT * FROM reposts WHERE user_id = ? AND post_id = ?'
      ).get(userId, postId);
      
      if (existing) {
        return { success: false, message: 'You already reposted this post' };
      }
      
      // Get post to check if it exists and get owner ID
      const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId);
      if (!post) {
        return { success: false, message: 'Post not found' };
      }
      
      // Create the repost
      const result = db.prepare(
        'INSERT INTO reposts (user_id, post_id) VALUES (?, ?)'
      ).run(userId, postId);
      
      if (result.changes !== 1) {
        return { success: false, message: 'Failed to repost' };
      }
      
      // Create notification if not reposting own post
      if (post.user_id !== userId) {
        db.prepare(`
          INSERT INTO notifications (user_id, type, actor_id, object_id, data)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          post.user_id,
          'repost',
          userId,
          postId,
          null
        );
      }
      
      return { success: true, message: 'Post reposted successfully' };
    } catch (error) {
      logger.error('Error reposting', { error: error.message, userId, postId });
      return { success: false, message: 'Error reposting' };
    }
  },
  
  undoRepost: (userId, postId) => {
    try {
      const result = db.prepare(
        'DELETE FROM reposts WHERE user_id = ? AND post_id = ?'
      ).run(userId, postId);
      
      if (result.changes === 0) {
        return { success: false, message: 'You have not reposted this post' };
      }
      
      return { success: true, message: 'Repost removed successfully' };
    } catch (error) {
      logger.error('Error removing repost', { error: error.message, userId, postId });
      return { success: false, message: 'Error removing repost' };
    }
  },
  
  // Notifications
  getNotifications: (userId, page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;
      
      const notifications = db.prepare(`
        SELECT n.*,
          u.username as actor_username, 
          u.display_name as actor_display_name,
          u.avatar_url as actor_avatar_url,
          u.subdomain as actor_subdomain
        FROM notifications n
        LEFT JOIN users u ON n.actor_id = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `).all(userId, limit, offset);
      
      return notifications.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : null
      }));
    } catch (error) {
      logger.error('Error getting notifications', { error: error.message, userId });
      return [];
    }
  },
  
  markNotificationsAsRead: (userId, notificationIds = []) => {
    try {
      let result;
      
      if (notificationIds.length === 0) {
        // Mark all as read
        result = db.prepare(
          'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0'
        ).run(userId);
      } else {
        // Mark specific notifications as read
        const placeholders = notificationIds.map(() => '?').join(',');
        const query = `
          UPDATE notifications 
          SET read = 1 
          WHERE user_id = ? 
          AND id IN (${placeholders})
        `;
        
        result = db.prepare(query).run(userId, ...notificationIds);
      }
      
      return { 
        success: true, 
        message: 'Notifications marked as read',
        count: result.changes
      };
    } catch (error) {
      logger.error('Error marking notifications as read', { error: error.message, userId });
      return { success: false, message: 'Error marking notifications as read' };
    }
  },
  
  // Search
  search: (query, type = 'all', page = 1, limit = 20) => {
    try {
      const offset = (page - 1) * limit;
      const searchTerm = `%${query}%`;
      
      if (type === 'users' || type === 'all') {
        const users = db.prepare(`
          SELECT id, username, display_name, avatar_url, bio, subdomain
          FROM users 
          WHERE (username LIKE ? OR display_name LIKE ?) AND is_active = 1
          LIMIT ? OFFSET ?
        `).all(searchTerm, searchTerm, limit, offset);
        
        if (type === 'users') return { users };
        
        if (type === 'all') {
          const posts = db.prepare(`
            SELECT p.*, u.username, u.display_name, u.avatar_url, u.subdomain
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.content LIKE ? AND p.visibility = 'public'
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
          `).all(searchTerm, limit, offset);
          
          return { 
            users,
            posts: posts.map(post => ({
              ...post,
              attachment_urls: post.attachment_urls ? JSON.parse(post.attachment_urls) : null,
              metadata: post.metadata ? JSON.parse(post.metadata) : {},
            }))
          };
        }
      }
      
      if (type === 'posts') {
        const posts = db.prepare(`
          SELECT p.*, u.username, u.display_name, u.avatar_url, u.subdomain
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.content LIKE ? AND p.visibility = 'public'
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `).all(searchTerm, limit, offset);
        
        return { 
          posts: posts.map(post => ({
            ...post,
            attachment_urls: post.attachment_urls ? JSON.parse(post.attachment_urls) : null,
            metadata: post.metadata ? JSON.parse(post.metadata) : {},
          }))
        };
      }
      
      return { users: [], posts: [] };
    } catch (error) {
      logger.error('Error searching', { error: error.message, query, type });
      return { users: [], posts: [] };
    }
  }
};

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize OAuth 2.0 server
const oauth2Server = oauth2orize.createServer();

// Setup authorization code grant type
oauth2Server.grant(oauth2orize.grant.code(
  async (client, redirectUri, user, ares, done) => {
    try {
      const code = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + (config.oauth.authorizationCodeLifetime * 1000));
      
      const authorizationCode = await OAuthModel.saveAuthorizationCode({
        authorizationCode: code,
        expiresAt,
        redirectUri,
        scope: ares.scope
      }, client, user);
      
      return done(null, authorizationCode.code);
    } catch (error) {
      logger.error('Error generating authorization code', { error: error.message });
      return done(error);
    }
  }
));

// Setup refresh token grant type
oauth2Server.grant(oauth2orize.grant.refreshToken(
  async (client, refreshToken, scope, done) => {
    // This will be called when we issue a refresh token during the main token exchange
    // The actual refresh token exchange is implemented separately
    done(null, refreshToken);
  }
));

// Exchange authorization code for access token
oauth2Server.exchange(oauth2orize.exchange.code(
  async (client, code, redirectUri, done) => {
    try {
      const authorizationCode = await OAuthModel.getAuthorizationCode(code);
      
      if (!authorizationCode) {
        return done(null, false);
      }
      
      if (client.id !== authorizationCode.client.id) {
        return done(null, false);
      }
      
      if (redirectUri !== authorizationCode.redirectUri) {
        return done(null, false);
      }
      
      // Check if the authorization code has expired
      if (authorizationCode.expiresAt < new Date()) {
        return done(null, false);
      }
      
      // Revoke the used authorization code
      const revoked = await OAuthModel.revokeAuthorizationCode(authorizationCode);
      
      if (!revoked) {
        return done(new Error('Failed to revoke authorization code'));
      }
      
      // Generate tokens
      const accessToken = crypto.randomBytes(32).toString('hex');
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const accessTokenExpiresAt = new Date(Date.now() + (config.oauth.accessTokenLifetime * 1000));
      const refreshTokenExpiresAt = new Date(Date.now() + (config.oauth.refreshTokenLifetime * 1000));
      
      // Save the tokens
      const token = await OAuthModel.saveToken({
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        scope: authorizationCode.scope
      }, client, { id: authorizationCode.user.id });
      
      if (!token) {
        return done(new Error('Failed to save token'));
      }
      
      return done(null, token.accessToken, token.refreshToken, { 
        expires_in: config.oauth.accessTokenLifetime,
        token_type: 'Bearer',
        scope: token.scope
      });
    } catch (error) {
      logger.error('Error exchanging code for token', { error: error.message });
      return done(error);
    }
  }
));

// Exchange refresh token for new access token
oauth2Server.exchange(oauth2orize.exchange.refreshToken(
  async (client, refreshToken, scope, done) => {
    try {
      const token = await OAuthModel.getRefreshToken(refreshToken);
      
      if (!token) {
        return done(null, false);
      }
      
      if (client.id !== token.client.id) {
        return done(null, false);
      }
      
      // Check if the refresh token has expired
      if (token.refreshTokenExpiresAt < new Date()) {
        return done(null, false);
      }
      
      // Revoke the old refresh token
      await OAuthModel.revokeToken(token);
      
      // Generate new tokens
      const accessToken = crypto.randomBytes(32).toString('hex');
      const newRefreshToken = crypto.randomBytes(32).toString('hex');
      const accessTokenExpiresAt = new Date(Date.now() + (config.oauth.accessTokenLifetime * 1000));
      const refreshTokenExpiresAt = new Date(Date.now() + (config.oauth.refreshTokenLifetime * 1000));
      
      // Use the original scope if no new scope is requested
      const tokenScope = scope || token.scope;
      
      // Save the new tokens
      const newToken = await OAuthModel.saveToken({
        accessToken,
        accessTokenExpiresAt,
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt,
        scope: tokenScope
      }, client, { id: token.user.id });
      
      if (!newToken) {
        return done(new Error('Failed to save new token'));
      }
      
      return done(null, newToken.accessToken, newToken.refreshToken, { 
        expires_in: config.oauth.accessTokenLifetime,
        token_type: 'Bearer',
        scope: newToken.scope
      });
    } catch (error) {
      logger.error('Error refreshing token', { error: error.message });
      return done(error);
    }
  }
));

// Client credentials grant for service-to-service communication
oauth2Server.exchange(oauth2orize.exchange.clientCredentials(
  async (client, scope, done) => {
    try {
      // Validate requested scope
      const validScope = OAuthModel.validateScope(null, client, scope);
      
      if (!validScope) {
        return done(null, false);
      }
      
      // Generate access token (no refresh token for client credentials)
      const accessToken = crypto.randomBytes(32).toString('hex');
      const accessTokenExpiresAt = new Date(Date.now() + (config.oauth.accessTokenLifetime * 1000));
      
      // Save the token (using client as the user for client credentials)
      const token = await OAuthModel.saveToken({
        accessToken,
        accessTokenExpiresAt,
        scope: validScope
      }, client, { id: client.id });
      
      if (!token) {
        return done(new Error('Failed to save token'));
      }
      
      return done(null, token.accessToken, null, { 
        expires_in: config.oauth.accessTokenLifetime,
        token_type: 'Bearer',
        scope: token.scope
      });
    } catch (error) {
      logger.error('Error issuing client credentials token', { error: error.message });
      return done(error);
    }
  }
));

// Initialize ActivityPub Express
const apex = ActivitypubExpress({
  name: 'Exprsn Federation',
  domain: config.baseDomain,
  actorParam: 'actor',
  objectParam: 'id',
  activityParam: 'id',
  itemsPerPage: 20
});

// Add federation queue processing
const processFederationQueue = async () => {
  try {
    // Get pending federation items, oldest first, limited to 20
    const items = db.prepare(`
      SELECT * FROM federation_queue 
      WHERE status = 'pending' AND attempts < 5
      ORDER BY priority ASC, created_at ASC
      LIMIT 20
    `).all();
    
    for (const item of items) {
      try {
        // Update attempts count and last attempt time
        db.prepare(`
          UPDATE federation_queue 
          SET attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(item.id);
        
        // Process based on action type
        switch (item.action) {
          case 'create':
            // Logic to send Create activity to target
            await apex.sendActivity({
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Create',
              actor: item.actor,
              object: JSON.parse(item.object_id),
              to: [item.target]
            });
            break;
            
          case 'follow':
            // Logic to send Follow activity to target
            await apex.sendActivity({
              '@context': 'https://www.w3.org/ns/activitystreams',
              type: 'Follow',
              actor: item.actor,
              object: item.target
            });
            break;
            
          // Add more action types as needed
            
          default:
            logger.warn(`Unknown federation action: ${item.action}`);
            break;
        }
        
        // Mark as completed
        db.prepare(`
          UPDATE federation_queue 
          SET status = 'completed'
          WHERE id = ?
        `).run(item.id);
        
      } catch (error) {
        logger.error(`Error processing federation item ${item.id}`, { error: error.message });
        
        // Mark as failed if max attempts reached
        if (item.attempts >= 4) {
          db.prepare(`
            UPDATE federation_queue 
            SET status = 'failed'
            WHERE id = ?
          `).run(item.id);
        }
      }
    }
  } catch (error) {
    logger.error('Error processing federation queue', { error: error.message });
  }
  
  // Schedule next run
  setTimeout(processFederationQueue, 30000); // Run every 30 seconds
};

// Start federation queue processing if federation is enabled
if (config.federation.enabled) {
  processFederationQueue();
}

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "*"], // Allow images from federated instances
      connectSrc: ["'self'", "*"], // Allow connections to federated instances
      fontSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "*"], // Allow media from federated instances
      frameSrc: ["'self'"],
    }
  },
  xssFilter: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all subdomain origins
    const originHostname = new URL(origin).hostname;
    if (originHostname.endsWith(config.baseDomain)) {
      return callback(null, true);
    }
    
    // Allow federation partners
    if (config.federation.enabled) {
      if (config.federation.whitelist.length > 0) {
        // If whitelist is provided, check against it
        if (config.federation.whitelist.some(domain => originHostname.endsWith(domain))) {
          return callback(null, true);
        }
      } else if (config.federation.blacklist.length > 0) {
        // If blacklist is provided, check it's not in there
        if (!config.federation.blacklist.some(domain => originHostname.endsWith(domain))) {
          return callback(null, true);
        }
      } else {
        // No specific lists, allow all for federation
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session setup
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// CSRF protection (for session-based auth)
// Exclude API routes that use JWT
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

// Apply CSRF selectively
app.use((req, res, next) => {
  // Skip CSRF for API routes with JWT, OAuth endpoints, and ActivityPub endpoints
  if (req.path.startsWith('/api/v1/') || 
      req.path === '/api/auth/login' || 
      req.path === '/api/auth/register' ||
      req.path.startsWith('/oauth/') ||
      req.path.startsWith('/.well-known/') ||
      apex.isApexRequest(req)) {
    return next();
  }
  csrfProtection(req, res, next);
});

// Rate limiting setup
// Create rate limiter factories with different configs
const createStrictRateLimiter = (windowMs = 15 * 60 * 1000, max = 30) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  keyGenerator: (req) => req.user ? `user_${req.user.id}` : req.ip
});

const createModerateRateLimiter = (windowMs = 60 * 60 * 1000, max = 100) => rateLimit({
  windowMs,
  max, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  keyGenerator: (req) => req.user ? `user_${req.user.id}` : req.ip
});

// DB based rate limiter
const createDbRateLimiter = (endpoint, windowMs = 60 * 60 * 1000, maxRequests = 100) => {
  return async (req, res, next) => {
    try {
      const userId = req.user ? req.user.id : null;
      const ipAddress = req.ip;
      const now = new Date();
      const resetTime = new Date(now.getTime() + windowMs);
      
      // Check if there's an existing rate limit record
      let rateLimit;
      
      if (userId) {
        rateLimit = db.prepare(
          'SELECT * FROM rate_limits WHERE user_id = ? AND endpoint = ? AND reset_at > ?'
        ).get(userId, endpoint, now);
      } else {
        rateLimit = db.prepare(
          'SELECT * FROM rate_limits WHERE ip_address = ? AND endpoint = ? AND reset_at > ?'
        ).get(ipAddress, endpoint, now);
      }
      
      if (rateLimit) {
        // Rate limit record exists, check if exceeded
        if (rateLimit.request_count >= maxRequests) {
          // Rate limit exceeded
          return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded, please try again later.',
            retryAfter: Math.ceil((new Date(rateLimit.reset_at) - now) / 1000)
          });
        }
        
        // Increment the counter
        if (userId) {
          db.prepare(
            'UPDATE rate_limits SET request_count = request_count + 1 WHERE user_id = ? AND endpoint = ? AND reset_at > ?'
          ).run(userId, endpoint, now);
        } else {
          db.prepare(
            'UPDATE rate_limits SET request_count = request_count + 1 WHERE ip_address = ? AND endpoint = ? AND reset_at > ?'
          ).run(ipAddress, endpoint, now);
        }
      } else {
        // No rate limit record, create a new one
        if (userId) {
          db.prepare(
            'INSERT INTO rate_limits (user_id, ip_address, endpoint, request_count, reset_at) VALUES (?, ?, ?, 1, ?)'
          ).run(userId, ipAddress, endpoint, resetTime);
        } else {
          db.prepare(
            'INSERT INTO rate_limits (ip_address, endpoint, request_count, reset_at) VALUES (?, ?, 1, ?)'
          ).run(ipAddress, endpoint, resetTime);
        }
      }
      
      // Clean up expired rate limits periodically (1% chance per request)
      if (Math.random() < 0.01) {
        db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').run(now);
      }
      
      next();
    } catch (error) {
      logger.error('Rate limiting error', { error: error.message });
      next(); // Continue even if rate limiting fails
    }
  };
};

// Authentication setup
// Passport for session-based auth
app.use(passport.initialize());
app.use(passport.session());

// Passport strategies
passport.use(new LocalStrategy(
  (username, password, done) => {
    try {
      const user = UserModel.findByUsername(username);
      
      if (!user) {
        logger.warn('Login attempt with invalid username', { username });
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      
      if (!user.is_active) {
        logger.warn('Login attempt with inactive account', { username });
        return done(null, false, { message: 'Account is inactive.' });
      }
      
      if (!UserModel.validatePassword(user, password)) {
        logger.warn('Login attempt with invalid password', { username });
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      
      // Update last login time
      UserModel.updateLastLogin(user.id);
      
      logger.info('User logged in successfully', { username });
      return done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
        subdomain: user.subdomain
      });
    } catch (error) {
      logger.error('Authentication error', { error: error.message });
      return done(error);
    }
  }
));

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret
};

passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
  try {
    const user = UserModel.findById(jwtPayload.id);
    
    if (user && user.is_active) {
      return done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
        subdomain: user.subdomain
      });
    }
    
    return done(null, false);
  } catch (error) {
    logger.error('JWT verification error', { error: error.message });
    return done(error, false);
  }
}));

// OAuth 2.0 Bearer Strategy
passport.use('oauth-bearer', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret
}, (jwtPayload, done) => {
  try {
    // Verify the token is an OAuth token
    if (!jwtPayload.oauth) {
      return done(null, false);
    }
    
    const user = UserModel.findById(jwtPayload.sub);
    
    if (user && user.is_active) {
      return done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        scope: jwtPayload.scope,
        clientId: jwtPayload.client_id
      });
    }
    
    return done(null, false);
  } catch (error) {
    logger.error('OAuth token verification error', { error: error.message });
    return done(error, false);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const user = UserModel.findById(id);
    done(null, user || false);
  } catch (error) {
    logger.error('Deserialize user error', { error: error.message, id });
    done(error, false);
  }
});

// Middleware to check if user is authenticated via session
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Middleware to check if user is authenticated via JWT
const jwtAuth = passport.authenticate('jwt', { session: false });

// Middleware to check if user is authenticated via OAuth 2.0 Bearer token
const oauthAuth = passport.authenticate('oauth-bearer', { session: false });

// Middleware to check if the request has a valid access token
async function authenticateAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const accessToken = authHeader.split(' ')[1];
  const token = await OAuthModel.getAccessToken(accessToken);
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid access token' });
  }
  
  if (token.accessTokenExpiresAt < new Date()) {
    return res.status(401).json({ error: 'Access token expired' });
  }
  
  // Add token and user info to request
  req.oauth = { token };
  req.user = await UserModel.findById(token.user.id);
  
  next();
}

// Middleware to check for specific OAuth scopes
function requireScope(scope) {
  return async (req, res, next) => {
    if (!req.oauth || !req.oauth.token) {
      return res.status(401).json({ error: 'OAuth token required' });
    }
    
    const hasScope = OAuthModel.verifyScope(req.oauth.token, scope);
    
    if (!hasScope) {
      return res.status(403).json({ error: `Insufficient scope: ${scope} required` });
    }
    
    next();
  };
}

// RBAC middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media')));

// Add CSRF token to all templates
app.use((req, res, next) => {
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

// Set up file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || 'general';
    let uploadDir;
    
    switch (uploadType) {
      case 'avatar':
        uploadDir = path.join(config.mediaDir, 'avatars');
        break;
      case 'post':
        uploadDir = path.join(config.mediaDir, 'posts');
        break;
      default:
        uploadDir = config.uploadsDir;
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images, videos, and audio
  if (file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('video/') || 
      file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Track active sites and their status
let activeSites = [];
let serviceStatus = {};
let customDomains = {};
let siteConfigs = {};
let dynamicRoutes = new Map();

// Create a map to store socket.io instances for each site
const siteIoInstances = {};

// Load site configurations
function loadSiteConfigs() {
  const configFile = path.join(config.configDir, 'sites.json');
  try {
    if (fs.existsSync(configFile)) {
      const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      siteConfigs = configData.sites || {};
      customDomains = configData.customDomains || {};
      logger.info('Loaded site configurations', { sitesCount: Object.keys(siteConfigs).length });
    } else {
      siteConfigs = {};
      customDomains = {};
      logger.info('No site configurations found, starting with empty config');
    }
  } catch (error) {
    logger.error('Failed to load site configurations', { error: error.message });
    siteConfigs = {};
    customDomains = {};
  }
}

// Save site configurations
function saveSiteConfigs() {
  const configFile = path.join(config.configDir, 'sites.json');
  try {
    const configData = {
      sites: siteConfigs,
      customDomains: customDomains
    };
    fs.writeFileSync(configFile, JSON.stringify(configData, null, 2), 'utf8');
    logger.info('Saved site configurations', { sitesCount: Object.keys(siteConfigs).length });
    return true;
  } catch (error) {
    logger.error('Failed to save site configurations', { error: error.message });
    return false;
  }
}

// Load configurations on startup
loadSiteConfigs();

// Dynamic route handling
function loadRouteFile(filePath) {
  try {
    // Delete cached module if it exists to ensure we get the latest version
    const routeModule = require.resolve(filePath);
    if (require.cache[routeModule]) {
      delete require.cache[routeModule];
    }
    
    // Import the route module
    const route = require(filePath);
    
    if (!route || typeof route !== 'object') {
      logger.error(`Invalid route module: ${filePath}`);
      return null;
    }
    
    // Route should have fields: path, router, methods, auth, rateLimit
    if (!route.path || !route.router) {
      logger.error(`Route module missing required fields: ${filePath}`);
      return null;
    }
    
    return route;
  } catch (error) {
    logger.error(`Error loading route file: ${filePath}`, { error: error.message });
    return null;
  }
}

function registerRoute(route, filePath) {
  if (!route) return false;
  
  try {
    const routePath = route.path;
    
    // If there's an existing route with this path, remove it first
    if (dynamicRoutes.has(routePath)) {
      unregisterRoute(routePath);
    }
    
    // Apply rate limiting if specified
    if (route.rateLimit) {
      const { windowMs, max, strict, db: useDb } = route.rateLimit;
      
      if (useDb) {
        app.use(routePath, createDbRateLimiter(routePath, windowMs, max));
      } else if (strict) {
        app.use(routePath, createStrictRateLimiter(windowMs, max));
      } else {
        app.use(routePath, createModerateRateLimiter(windowMs, max));
      }
    }
    
    // Apply authentication if required
    if (route.auth) {
      if (route.auth === 'jwt') {
        app.use(routePath, jwtAuth);
      } else if (route.auth === 'session') {
        app.use(routePath, ensureAuthenticated);
      } else if (route.auth === 'oauth') {
        app.use(routePath, authenticateAccessToken);
        
        // Apply scope check if specified
        if (route.scope) {
          app.use(routePath, requireScope(route.scope));
        }
      }
      
      // Apply role-based access if specified
      if (route.role) {
        app.use(routePath, requireRole(route.role));
      }
    }
    
    // Register the router
    app.use(routePath, route.router);
    
    // Store the route in our map
    dynamicRoutes.set(routePath, {
      path: routePath,
      filePath,
      methods: route.methods || ['GET'],
      auth: route.auth || false,
      role: route.role || null,
      scope: route.scope || null,
      rateLimit: route.rateLimit || null
    });
    
    logger.info(`Registered route: ${routePath}`, { 
      methods: route.methods || ['GET'],
      auth: !!route.auth,
      rateLimit: !!route.rateLimit
    });
    
    return true;
  } catch (error) {
    logger.error(`Error registering route: ${route.path}`, { error: error.message });
    return false;
  }
}

function unregisterRoute(routePath) {
  // We can't truly "unregister" a route in Express once it's added
  // But we can keep track of which routes are active in our map
  if (dynamicRoutes.has(routePath)) {
    dynamicRoutes.delete(routePath);
    logger.info(`Unregistered route: ${routePath}`);
    return true;
  }
  return false;
}

function setupRoutesWatcher() {
  const watcher = chokidar.watch(config.routesDir, {
    ignored: /(^|[\/\\])\../,
    persistent: true
  });
  
  watcher
    .on('add', (filePath) => {
      if (filePath.endsWith('.js')) {
        logger.info(`Route file added: ${filePath}`);
        const route = loadRouteFile(filePath);
        registerRoute(route, filePath);
      }
    })
    .on('change', (filePath) => {
      if (filePath.endsWith('.js')) {
        logger.info(`Route file changed: ${filePath}`);
        const route = loadRouteFile(filePath);
        registerRoute(route, filePath);
      }
    })
    .on('unlink', (filePath) => {
      if (filePath.endsWith('.js')) {
        logger.info(`Route file removed: ${filePath}`);
        
        // Find the route that corresponds to this file
        for (const [path, route] of dynamicRoutes.entries()) {
          if (route.filePath === filePath) {
            unregisterRoute(path);
            break;
          }
        }
      }
    })
    .on('error', (error) => {
      logger.error(`Routes watcher error: ${error.message}`);
    })
    .on('ready', () => {
      logger.info('Initial routes scan complete. Watching for changes...');
    });
  
  return watcher;
}

// Load initial routes
function loadInitialRoutes() {
  if (!fs.existsSync(config.routesDir)) {
    logger.info(`Routes directory not found, creating: ${config.routesDir}`);
    fs.mkdirSync(config.routesDir, { recursive: true });
    return;
  }
  
  try {
    const routeFiles = fs.readdirSync(config.routesDir)
      .filter(file => file.endsWith('.js'));
    
    logger.info(`Found ${routeFiles.length} route files`);
    
    for (const file of routeFiles) {
      const filePath = path.join(config.routesDir, file);
      const route = loadRouteFile(filePath);
      registerRoute(route, filePath);
    }
  } catch (error) {
    logger.error('Error loading initial routes', { error: error.message });
  }
}

// Function to setup vhost for a site
function setupSite(siteName) {
  try {
    const siteDir = path.join(config.sitesDir, siteName);
    
    // Check if the directory exists
    if (!fs.existsSync(siteDir)) {
      logger.error(`Site directory not found: ${siteDir}`);
      return false;
    }
    
    // Create a new Express app for this site
    const siteApp = express();
    
    // Apply the same middleware we use for the main app
    siteApp.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
          styleSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "*"],
          connectSrc: ["'self'", "*"],
          fontSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "*"],
          frameSrc: ["'self'"],
        }
      }
    }));
    siteApp.use(compression());
    
    // Apply ActivityPub middleware if federation is enabled
    if (config.federation.enabled) {
      siteApp.use(apex);
    }
    
    // Set up EJS for this site
    siteApp.set('view engine', 'ejs');
    siteApp.set('views', path.join(__dirname, 'views'));
    
    // Body parsing middleware
    siteApp.use(bodyParser.json({ limit: '10mb' }));
    siteApp.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
    
    // Setup symbolic link to shared node_modules if it doesn't exist
    const siteNodeModules = path.join(siteDir, 'node_modules');
    if (!fs.existsSync(siteNodeModules)) {
      try {
        // On Windows, we might need to use junction instead of symlink
        if (process.platform === 'win32') {
          fs.symlinkSync(config.sharedNodeModules, siteNodeModules, 'junction');
        } else {
          fs.symlinkSync(config.sharedNodeModules, siteNodeModules, 'dir');
        }
        logger.info(`Created symlink to shared node_modules for ${siteName}`);
      } catch (error) {
        logger.error(`Failed to create symlink for ${siteName}`, { error: error.message });
        // Continue anyway, the site might still work without the symlink
      }
    }
    
    // Load or initialize site config
    if (!siteConfigs[siteName]) {
      siteConfigs[siteName] = {
        name: siteName,
        description: `Site ${siteName}`,
        customDomains: [],
        ssl: false,
        maintenance: false,
        backupEnabled: true,
        backupSchedule: '0 0 * * *', // Daily at midnight (cron format)
        healthCheckPath: '/api/health',
        // Default environment variables for the site
        env: {
          NODE_ENV: process.env.NODE_ENV || 'development'
        }
      };
      saveSiteConfigs();
    }
    
    // Get user info if this is a user subdomain
    const siteUser = UserModel.findBySubdomain(siteName);
    
    // Initialize status info for this site
    if (!serviceStatus[siteName]) {
      serviceStatus[siteName] = {
        status: 'unknown',
        lastChecked: new Date(),
        uptime: 0,
        details: {},
        metrics: {},
        history: []
      };
    }
    
    // Add ActivityPub routes for user subdomains
    if (siteUser && config.federation.enabled) {
      // Actor endpoint for this user
      siteApp.get('/.well-known/webfinger', (req, res) => {
        const resource = req.query.resource;
        
        if (!resource) {
          return res.status(400).json({ error: 'Resource parameter required' });
        }
        
        const resourceParts = resource.split(':');
        const schema = resourceParts[0];
        let identifier;
        
        if (schema === 'acct') {
          identifier = resourceParts[1];
          // Extract username from acct:username@domain
          const matches = identifier.match(/^(.+)@(.+)$/);
          
          if (!matches || matches[2] !== `${siteName}.${config.baseDomain}`) {
            return res.status(404).json({ error: 'Resource not found' });
          }
          
          const username = matches[1];
          
          if (username !== siteUser.username) {
            return res.status(404).json({ error: 'User not found' });
          }
        } else {
          return res.status(400).json({ error: 'Unsupported resource type' });
        }
        
        const webfinger = {
          subject: `acct:${siteUser.username}@${siteName}.${config.baseDomain}`,
          links: [
            {
              rel: 'self',
              type: 'application/activity+json',
              href: `https://${siteName}.${config.baseDomain}/user/${siteUser.username}`
            },
            {
              rel: 'http://webfinger.net/rel/profile-page',
              type: 'text/html',
              href: `https://${siteName}.${config.baseDomain}/@${siteUser.username}`
            }
          ]
        };
        
        res.json(webfinger);
      });
      
      // Actor endpoint
      siteApp.get('/user/:username', (req, res) => {
        if (req.params.username !== siteUser.username) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        const actor = {
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            'https://w3id.org/security/v1'
          ],
          id: `https://${siteName}.${config.baseDomain}/user/${siteUser.username}`,
          type: 'Person',
          preferredUsername: siteUser.username,
          name: siteUser.display_name || siteUser.username,
          summary: siteUser.bio || '',
          inbox: `https://${siteName}.${config.baseDomain}/user/${siteUser.username}/inbox`,
          outbox: `https://${siteName}.${config.baseDomain}/user/${siteUser.username}/outbox`,
          followers: `https://${siteName}.${config.baseDomain}/user/${siteUser.username}/followers`,
          following: `https://${siteName}.${config.baseDomain}/user/${siteUser.username}/following`,
          // Required by some ActivityPub implementations
          endpoints: {
            sharedInbox: `https://${siteName}.${config.baseDomain}/inbox`
          }
        };
        
        if (siteUser.avatar_url) {
          actor.icon = {
            type: 'Image',
            mediaType: 'image/jpeg', // Adjust based on actual image type
            url: siteUser.avatar_url.startsWith('http') 
              ? siteUser.avatar_url 
              : `https://${siteName}.${config.baseDomain}${siteUser.avatar_url}`
          };
        }
        
        // Add appropriate headers
        res.setHeader('Content-Type', 'application/activity+json');
        res.json(actor);
      });
      
      // Inbox, outbox, followers, and following endpoints would be implemented here
      // This would require more complex ActivityPub implementation
      
      // User's public profile page
      siteApp.get('/@:username', (req, res) => {
        if (req.params.username !== siteUser.username) {
          return res.status(404).render('error', { 
            error: 'User not found',
            user: req.user,
            csrfToken: req.csrfToken ? req.csrfToken() : null
          });
        }
        
        res.render('profile', {
          title: `${siteUser.display_name || siteUser.username} - ${siteName}.${config.baseDomain}`,
          profile: siteUser,
          isOwner: req.user && req.user.id === siteUser.id,
          user: req.user,
          csrfToken: req.csrfToken ? req.csrfToken() : null
        });
      });
    }
    
    // Create a status route for this site
    siteApp.get('/status', (req, res) => {
      res.render('status', {
        siteName: siteName,
        baseDomain: config.baseDomain,
        status: serviceStatus[siteName],
        moment: moment,
        config: siteConfigs[siteName],
        user: req.user,
        siteUser: siteUser
      });
    });
    
    // For user subdomains, set up social media functionality
    if (siteUser) {
      // Home page (timeline if logged in, public profile if not)
      siteApp.get('/', (req, res) => {
        if (req.isAuthenticated() && req.user.id === siteUser.id) {
          // Show timeline for the owner
          res.render('timeline', {
            title: `${siteUser.display_name || siteUser.username} - Home`,
            profile: siteUser,
            isOwner: true,
            user: req.user,
            csrfToken: req.csrfToken ? req.csrfToken() : null
          });
        } else {
          // Show public profile for visitors
          res.render('profile', {
            title: `${siteUser.display_name || siteUser.username} - ${siteName}.${config.baseDomain}`,
            profile: siteUser,
            isOwner: req.user && req.user.id === siteUser.id,
            user: req.user,
            csrfToken: req.csrfToken ? req.csrfToken() : null
          });
        }
      });
      
      // API endpoints for the user's data
      const userApiRouter = express.Router();
      
      // Rate limit for API
      userApiRouter.use(createModerateRateLimiter());
      
      // Get user info
      userApiRouter.get('/user', (req, res) => {
        const publicUser = {
          id: siteUser.id,
          username: siteUser.username,
          display_name: siteUser.display_name,
          avatar_url: siteUser.avatar_url,
          bio: siteUser.bio,
          subdomain: siteUser.subdomain,
          federation_id: siteUser.federation_id,
          created_at: siteUser.created_at
        };
        
        res.json({ success: true, user: publicUser });
      });
      
      // Get user's posts
      userApiRouter.get('/posts', async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const posts = await SocialModel.getUserPosts(siteUser.id, page, limit);
        
        res.json({ success: true, posts, page, limit });
      });
      
      // Get a single post
      userApiRouter.get('/posts/:id', async (req, res) => {
        const postId = req.params.id;
        const post = await SocialModel.getPostById(postId);
        
        if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }
        
        // Only allow accessing this user's posts
        if (post.user_id !== siteUser.id) {
          return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        res.json({ success: true, post });
      });
      
      // Register the user API routes
      siteApp.use('/api', userApiRouter);
      
      // Set up authenticated routes for the user
      const authUserApiRouter = express.Router();
      
      // Require authentication
      authUserApiRouter.use(authenticateAccessToken);
      
      // Only allow the user to access their own authenticated endpoints
      authUserApiRouter.use((req, res, next) => {
        if (req.user.id !== siteUser.id) {
          return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        next();
      });
      
      // Create a new post (requires 'write' scope)
      authUserApiRouter.post('/posts', requireScope('write'), async (req, res) => {
        const { content, visibility, replyTo, attachmentUrls, metadata } = req.body;
        
        if (!content) {
          return res.status(400).json({ success: false, message: 'Content is required' });
        }
        
        const post = await SocialModel.createPost(siteUser.id, {
          content,
          visibility: visibility || 'public',
          replyTo: replyTo || null,
          attachmentUrls: attachmentUrls || null,
          metadata: metadata || {}
        });
        
        if (!post) {
          return res.status(500).json({ success: false, message: 'Failed to create post' });
        }
        
        // Federation: if public and federation enabled, queue for distribution
        if (config.federation.enabled && post.visibility === 'public') {
          // Queue federation task
          db.prepare(`
            INSERT INTO federation_queue (
              actor, object_id, action, target, priority
            ) VALUES (?, ?, ?, ?, ?)
          `).run(
            `https://${siteName}.${config.baseDomain}/user/${siteUser.username}`,
            JSON.stringify({
              id: `https://${siteName}.${config.baseDomain}/posts/${post.id}`,
              type: 'Note',
              content: post.content,
              published: post.created_at,
              attributedTo: `https://${siteName}.${config.baseDomain}/user/${siteUser.username}`,
              to: ['https://www.w3.org/ns/activitystreams#Public']
            }),
            'create',
            'https://www.w3.org/ns/activitystreams#Public',
            5
          );
        }
        
        res.status(201).json({ success: true, post });
      });
      
      // Upload media for posts
      authUserApiRouter.post('/upload', requireScope('write'), upload.single('file'), async (req, res) => {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Process images with sharp if they're images
        if (req.file.mimetype.startsWith('image/')) {
          try {
            const processedFilePath = `${req.file.path}-processed${path.extname(req.file.path)}`;
            
            await sharp(req.file.path)
              .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toFile(processedFilePath);
            
            // Replace original file with processed one
            fs.unlinkSync(req.file.path);
            fs.renameSync(processedFilePath, req.file.path);
          } catch (error) {
            logger.error('Error processing image', { error: error.message });
            // Continue with the original file if processing fails
          }
        }
        
        // Generate URLs
        const fileUrl = `/media/${path.relative(config.mediaDir, req.file.path)}`;
        const fullUrl = `https://${siteName}.${config.baseDomain}${fileUrl}`;
        
        res.json({
          success: true,
          file: {
            url: fileUrl,
            fullUrl,
            mimetype: req.file.mimetype,
            size: req.file.size,
            filename: req.file.filename
          }
        });
      });
      
      // Get user's timeline
      authUserApiRouter.get('/timeline', requireScope('read'), async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const timeline = await SocialModel.getTimeline(siteUser.id, page, limit);
        
        res.json({ success: true, posts: timeline, page, limit });
      });
      
      // Get user's notifications
      authUserApiRouter.get('/notifications', requireScope('read'), async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const notifications = await SocialModel.getNotifications(siteUser.id, page, limit);
        
        res.json({ success: true, notifications, page, limit });
      });
      
      // Mark notifications as read
      authUserApiRouter.post('/notifications/read', requireScope('write'), async (req, res) => {
        const { notificationIds } = req.body;
        
        const result = await SocialModel.markNotificationsAsRead(
          siteUser.id, 
          notificationIds || []
        );
        
        res.json(result);
      });
      
      // Like a post
      authUserApiRouter.post('/posts/:id/like', requireScope('write'), async (req, res) => {
        const postId = req.params.id;
        const result = await SocialModel.likePost(siteUser.id, postId);
        res.json(result);
      });
      
      // Unlike a post
      authUserApiRouter.delete('/posts/:id/like', requireScope('write'), async (req, res) => {
        const postId = req.params.id;
        const result = await SocialModel.unlikePost(siteUser.id, postId);
        res.json(result);
      });
      
      // Repost
      authUserApiRouter.post('/posts/:id/repost', requireScope('write'), async (req, res) => {
        const postId = req.params.id;
        const result = await SocialModel.repostPost(siteUser.id, postId);
        res.json(result);
      });
      
      // Undo repost
      authUserApiRouter.delete('/posts/:id/repost', requireScope('write'), async (req, res) => {
        const postId = req.params.id;
        const result = await SocialModel.undoRepost(siteUser.id, postId);
        res.json(result);
      });
      
      // Follow a user
      authUserApiRouter.post('/follow/:userId', requireScope('follow'), async (req, res) => {
        const userId = req.params.userId;
        const result = await SocialModel.followUser(siteUser.id, userId);
        res.json(result);
      });
      
      // Unfollow a user
      authUserApiRouter.delete('/follow/:userId', requireScope('follow'), async (req, res) => {
        const userId = req.params.userId;
        const result = await SocialModel.unfollowUser(siteUser.id, userId);
        res.json(result);
      });
      
      // Accept a follow request
      authUserApiRouter.post('/follow-requests/:id/accept', requireScope('follow'), async (req, res) => {
        const followId = req.params.id;
        const result = await SocialModel.acceptFollowRequest(followId, siteUser.id);
        res.json(result);
      });
      
      // Reject a follow request
      authUserApiRouter.post('/follow-requests/:id/reject', requireScope('follow'), async (req, res) => {
        const followId = req.params.id;
        const result = await SocialModel.rejectFollowRequest(followId, siteUser.id);
        res.json(result);
      });
      
      // Update user profile
      authUserApiRouter.patch('/profile', requireScope('write'), async (req, res) => {
        const { display_name, bio, settings } = req.body;
        
        const updateData = {};
        if (display_name !== undefined) updateData.display_name = display_name;
        if (bio !== undefined) updateData.bio = bio;
        if (settings !== undefined) updateData.settings = settings;
        
        const updated = await UserModel.update(siteUser.id, updateData);
        
        if (!updated) {
          return res.status(500).json({ success: false, message: 'Failed to update profile' });
        }
        
        // Get updated user data
        const updatedUser = await UserModel.findById(siteUser.id);
        
        res.json({
          success: true,
          message: 'Profile updated',
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            display_name: updatedUser.display_name,
            bio: updatedUser.bio,
            avatar_url: updatedUser.avatar_url,
            subdomain: updatedUser.subdomain,
            settings: updatedUser.settings ? JSON.parse(updatedUser.settings) : {}
          }
        });
      });
      
      // Update avatar
      authUserApiRouter.post('/avatar', requireScope('write'), upload.single('avatar'), async (req, res) => {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        try {
          // Process avatar image
          const avatarFilename = `avatar-${siteUser.id}-${Date.now()}${path.extname(req.file.path)}`;
          const avatarPath = path.join(config.mediaDir, 'avatars', avatarFilename);
          
          await sharp(req.file.path)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(avatarPath);
          
          // Delete temp file
          fs.unlinkSync(req.file.path);
          
          // Update user avatar
          const avatarUrl = `/media/avatars/${avatarFilename}`;
          const updated = await UserModel.update(siteUser.id, { avatar_url: avatarUrl });
          
          if (!updated) {
            return res.status(500).json({ success: false, message: 'Failed to update avatar' });
          }
          
          res.json({
            success: true,
            message: 'Avatar updated',
            avatar_url: avatarUrl,
            full_url: `https://${siteName}.${config.baseDomain}${avatarUrl}`
          });
        } catch (error) {
          logger.error('Error updating avatar', { error: error.message });
          res.status(500).json({ success: false, message: 'Error updating avatar' });
        }
      });
      
      // Register the authenticated API routes
      siteApp.use('/api/auth', authUserApiRouter);
    }
    
    // Apply site-specific rate limiting
    // Standard rate limits for all site subdomains
    siteApp.use(createModerateRateLimiter(60 * 60 * 1000, 1000)); // 1000 requests per hour per IP
    
    // Check if the site has a specific server.js file
    const siteServerFile = path.join(siteDir, 'server.js');
    if (fs.existsSync(siteServerFile)) {
      // If this site has its own server.js, we'll proxy to it
      
      // Determine a port for this site
      const sitePort = config.port + (siteName.charCodeAt(0) % 1000);
      
      // Setup proxy middleware with environment variables for this site
      const proxyOptions = {
        target: `http://localhost:${sitePort}`,
        changeOrigin: true,
        ws: true,
        // Don't proxy the status route
        pathFilter: (path) => path !== '/status',
        // Send site-specific env variables in headers
        onProxyReq: (proxyReq, req, res) => {
          // Add custom headers
          proxyReq.setHeader('X-Proxied-By', 'Exprsn.io');
          proxyReq.setHeader('X-Site-Name', siteName);
          
          // Pass environment variables
          if (siteConfigs[siteName] && siteConfigs[siteName].env) {
            Object.entries(siteConfigs[siteName].env).forEach(([key, value]) => {
              proxyReq.setHeader(`X-Env-${key}`, value);
            });
          }
        }
      };
      
      siteApp.use('/', createProxyMiddleware(proxyOptions));
      
      logger.info(`Setup proxy for ${siteName}.${config.baseDomain} to http://localhost:${sitePort}`);
      
      // Set up scheduled status checks for the proxied service
      const healthCheckPath = siteConfigs[siteName].healthCheckPath || '/api/health';
      scheduleStatusCheck(siteName, `http://localhost:${sitePort}${healthCheckPath}`);
    } else {
      // Otherwise serve static files from the site directory
      siteApp.use(express.static(siteDir));
      
      // If there's an index.js file, assume it's an Express router
      const siteIndexFile = path.join(siteDir, 'index.js');
      if (fs.existsSync(siteIndexFile)) {
        try {
          const siteRouter = require(siteIndexFile);
          
          // We only want to use the router for non-status routes
          siteApp.use('/', (req, res, next) => {
            if (req.path === '/status') {
              next(); // Skip the router for /status route
            } else {
              siteRouter(req, res, next);
            }
          });
          
          logger.info(`Loaded Express router from ${siteIndexFile}`);
          
          // Set site status to active since we found a router
          updateServiceStatus(siteName, {
            status: 'active',
            lastChecked: new Date(),
            uptime: process.uptime(),
            details: { message: 'Service router loaded successfully' }
          });
        } catch (error) {
          logger.error(`Failed to load router from ${siteIndexFile}`, { error: error.message });
          
          // Update service status to reflect the error
          updateServiceStatus(siteName, {
            status: 'error',
            lastChecked: new Date(),
            details: { error: error.message }
          });
        }
      } else {
        logger.info(`Setup static file serving for ${siteName}.${config.baseDomain} from ${siteDir}`);
        
        // Update service status for static sites
        updateServiceStatus(siteName, {
          status: 'active',
          lastChecked: new Date(),
          uptime: process.uptime(),
          details: { message: 'Static file server is active' }
        });
      }
    }
    
    // Check if site is in maintenance mode
    if (siteConfigs[siteName].maintenance) {
      // Add middleware to show maintenance page
      siteApp.use((req, res, next) => {
        // Skip maintenance mode for status endpoint
        if (req.path === '/status') {
          return next();
        }
        
        res.status(503).render('maintenance', {
          siteName: siteName,
          baseDomain: config.baseDomain
        });
      });
      
      logger.info(`Site ${siteName} is in maintenance mode`);
    }
    
    // Create a Socket.IO instance for this site
    const siteServer = http.createServer(siteApp);
    const siteIo = socketIo(siteServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          
          // Allow the main subdomain
          if (origin === `http://${siteName}.${config.baseDomain}` || 
              origin === `https://${siteName}.${config.baseDomain}`) {
            return callback(null, true);
          }
          
          // Allow any custom domains for this site
          if (siteConfigs[siteName] && siteConfigs[siteName].customDomains) {
            for (const domain of siteConfigs[siteName].customDomains) {
              if (origin === `http://${domain}` || origin === `https://${domain}`) {
                return callback(null, true);
              }
            }
          }
          
          callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    // Store the Socket.IO instance
    siteIoInstances[siteName] = siteIo;
    
    // Set up Socket.IO connection handlers
    siteIo.on('connection', (socket) => {
      logger.debug(`Socket.IO client connected to ${siteName}`);
      
      // Send current status immediately
      socket.emit('status-update', serviceStatus[siteName]);
      
      // Set up real-time notifications for the user subdomain
      if (siteUser) {
        // Handle client identification (must authenticate)
        socket.on('auth', async (data) => {
          const { token } = data;
          try {
            const oauthToken = await OAuthModel.getAccessToken(token);
            
            if (!oauthToken || oauthToken.accessTokenExpiresAt < new Date()) {
              socket.emit('auth-error', { message: 'Invalid or expired token' });
              return;
            }
            
            // Only allow the site owner to subscribe to their own notifications
            if (oauthToken.user.id !== siteUser.id) {
              socket.emit('auth-error', { message: 'Unauthorized' });
              return;
            }
            
            // Successfully authenticated
            socket.join(`user:${siteUser.id}`);
            socket.emit('auth-success', { message: 'Authenticated successfully' });
            
            // Send latest notifications
            const notifications = await SocialModel.getNotifications(siteUser.id, 1, 5);
            socket.emit('notifications', { notifications });
          } catch (error) {
            logger.error('WebSocket auth error', { error: error.message });
            socket.emit('auth-error', { message: 'Authentication error' });
          }
        });
      }
      
      socket.on('disconnect', () => {
        logger.debug(`Socket.IO client disconnected from ${siteName}`);
      });
    });
    
    // Use vhost middleware to handle this subdomain
    app.use(vhost(`${siteName}.${config.baseDomain}`, siteApp));
    
    // Set up custom domains for this site if configured
    if (siteConfigs[siteName] && siteConfigs[siteName].customDomains) {
      for (const domain of siteConfigs[siteName].customDomains) {
        app.use(vhost(domain, siteApp));
        customDomains[domain] = siteName;
        logger.info(`Mapped custom domain ${domain} to site ${siteName}`);
      }
    }
    
    // Add to active sites
    if (!activeSites.includes(siteName)) {
      activeSites.push(siteName);
      activeSites.sort(); // Keep the list sorted for easier display
    }
    
    return true;
  } catch (error) {
    logger.error(`Error setting up site ${siteName}`, { error: error.message, stack: error.stack });
    
    // Update service status to reflect the error
    updateServiceStatus(siteName, {
      status: 'error',
      lastChecked: new Date(),
      details: { error: error.message }
    });
    
    return false;
  }
}

// Function to remove a site
function removeSite(siteName) {
  // Remove from active sites array
  const index = activeSites.indexOf(siteName);
  if (index !== -1) {
    activeSites.splice(index, 1);
    logger.info(`Marked ${siteName} as inactive`);
    
    // Remove custom domain mappings for this site
    if (siteConfigs[siteName] && siteConfigs[siteName].customDomains) {
      for (const domain of siteConfigs[siteName].customDomains) {
        delete customDomains[domain];
      }
    }
    
    return true;
  }
  return false;
}

// Function to update service status
function updateServiceStatus(siteName, newStatus) {
  // Merge the new status with existing status
  serviceStatus[siteName] = {
    ...serviceStatus[siteName] || {},
    ...newStatus,
    lastChecked: newStatus.lastChecked || new Date()
  };
  
  // Add to history (keep last 100 entries)
  if (!serviceStatus[siteName].history) {
    serviceStatus[siteName].history = [];
  }
  
  serviceStatus[siteName].history.unshift({
    timestamp: new Date(),
    status: serviceStatus[siteName].status
  });
  
  // Limit history to 100 entries
  if (serviceStatus[siteName].history.length > 100) {
    serviceStatus[siteName].history = serviceStatus[siteName].history.slice(0, 100);
  }
  
  // Emit update to connected clients
  if (siteIoInstances[siteName]) {
    siteIoInstances[siteName].emit('status-update', serviceStatus[siteName]);
  }
  
  // Also emit to main socket
  io.emit('service-status-update', {
    site: siteName,
    status: serviceStatus[siteName]
  });
  
  // Check if we need to take automatic actions based on status
  if (newStatus.status === 'error' && siteConfigs[siteName] && siteConfigs[siteName].autoRestart) {
    logger.info(`Auto-restart triggered for site ${siteName} due to error status`);
    // In a real implementation, you would implement the restart logic here
  }
}

// Function to schedule regular status checks
function scheduleStatusCheck(siteName, healthEndpoint) {
  const interval = setInterval(async () => {
    try {
      // Skip health check if site is in maintenance mode
      if (siteConfigs[siteName] && siteConfigs[siteName].maintenance) {
        updateServiceStatus(siteName, {
          status: 'maintenance',
          lastChecked: new Date(),
          details: { message: 'Site is in maintenance mode' }
        });
        return;
      }
      
      const response = await axios.get(healthEndpoint, { timeout: 5000 });
      
      if (response.status === 200) {
        updateServiceStatus(siteName, {
          status: 'active',
          lastChecked: new Date(),
          details: response.data
        });
      } else {
        updateServiceStatus(siteName, {
          status: 'warning',
          lastChecked: new Date(),
          details: { 
            message: `Received unexpected status code: ${response.status}`,
            data: response.data 
          }
        });
      }
    } catch (error) {
      updateServiceStatus(siteName, {
        status: 'error',
        lastChecked: new Date(),
        details: { 
          message: `Health check failed: ${error.message}`,
          code: error.code
        }
      });
    }
  }, config.statusPollingInterval);
  
  // Store the interval ID so we can clear it if needed
  if (!siteConfigs[siteName]) {
    siteConfigs[siteName] = {};
  }
  siteConfigs[siteName].healthCheckInterval = interval;
}

// Setup file watcher for the Sites directory
function setupSitesWatcher() {
  const watcher = chokidar.watch(config.sitesDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    depth: 0 // Only watch immediate subdirectories
  });
  
  // Add event listeners
  watcher
    .on('addDir', (path) => {
      const siteName = path.split(/[\/\\]/).pop();
      // Only process immediate subdirectories of the Sites folder
      if (path !== config.sitesDir && path.split(/[\/\\]/).length === config.sitesDir.split(/[\/\\]/).length + 1) {
        logger.info(`Directory added: ${path}`);
        if (setupSite(siteName)) {
          io.emit('site-added', { site: siteName });
        }
      }
    })
    .on('unlinkDir', (path) => {
      const siteName = path.split(/[\/\\]/).pop();
      // Only process immediate subdirectories of the Sites folder
      if (path !== config.sitesDir && path.split(/[\/\\]/).length === config.sitesDir.split(/[\/\\]/).length + 1) {
        logger.info(`Directory removed: ${path}`);
        if (removeSite(siteName)) {
          io.emit('site-removed', { site: siteName });
        }
      }
    })
    .on('change', (path) => {
      // When a file changes, check if it's in a site directory
      const pathParts = path.split(/[\/\\]/);
      const sitesIndex = pathParts.indexOf('Sites');
      
      if (sitesIndex !== -1 && pathParts.length > sitesIndex + 1) {
        const siteName = pathParts[sitesIndex + 1];
        logger.debug(`File changed in site ${siteName}: ${path}`);
        
        // If this is a critical file, consider reloading the site
        const filename = pathParts[pathParts.length - 1];
        if (filename === 'server.js' || filename === 'index.js') {
          logger.info(`Critical file ${filename} changed in site ${siteName}, reloading...`);
          if (setupSite(siteName)) {
            io.emit('site-reloaded', { site: siteName });
          }
        }
      }
    })
    .on('error', (error) => logger.error(`Watcher error: ${error.message}`))
    .on('ready', () => {
      logger.info('Initial scan complete. Watching for changes...');
    });
  
  return watcher;
}

// Emit notifications to connected users
function emitNotification(userId, notification) {
  // Find all connected sockets for this user
  io.to(`user:${userId}`).emit('notification', notification);
}

// Hook into notification creation to emit real-time updates
const originalDbRun = db.prepare;
db.prepare = function(sql) {
  const stmt = originalDbRun.call(this, sql);
  
  // Intercept notification inserts
  if (sql.includes('INSERT INTO notifications')) {
    const originalRun = stmt.run;
    stmt.run = function(...args) {
      const result = originalRun.apply(this, args);
      
      try {
        // If this was a notification insert, emit to the user
        if (result.changes === 1) {
          const userId = args[0]; // First parameter in our notification insert is user_id
          
          // Get the newly created notification
          const notification = db.prepare(
            'SELECT * FROM notifications WHERE id = ?'
          ).get(result.lastInsertRowid);
          
          if (notification) {
            // Emit to connected user sockets
            emitNotification(userId, notification);
          }
        }
      } catch (error) {
        logger.error('Error emitting notification', { error: error.message });
      }
      
      return result;
    };
  }
  
  return stmt;
};

// Setup initial sites
function setupInitialSites() {
  try {
    const sites = fs.readdirSync(config.sitesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    logger.info(`Found ${sites.length} sites: ${sites.join(', ')}`);
    
    sites.forEach(siteName => {
      setupSite(siteName);
    });
  } catch (error) {
    logger.error('Error setting up initial sites', { error: error.message });
  }
}

// Setup Socket.IO connection
io.on('connection', (socket) => {
  logger.debug('Client connected');
  
  // Send current list of sites to the new client
  socket.emit('sites-list', { sites: activeSites });
  socket.emit('service-status', { status: serviceStatus });
  
  socket.on('disconnect', () => {
    logger.debug('Client disconnected');
  });
  
  // Additional socket events for admin dashboard
  socket.on('request-site-config', ({ siteName }) => {
    if (siteConfigs[siteName]) {
      socket.emit('site-config', { 
        siteName, 
        config: siteConfigs[siteName] 
      });
    }
  });
});

// Create OAuth 2.0 and OpenID provider endpoints
function setupOAuthServer() {
  const oauthApp = express();
  
  // Apply security middlewares
  oauthApp.use(helmet());
  oauthApp.use(compression());
  
  // Body parsing middleware
  oauthApp.use(bodyParser.json());
  oauthApp.use(bodyParser.urlencoded({ extended: true }));
  oauthApp.use(cookieParser());
  
  // Session setup
  oauthApp.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  }));
  
  // Initialize Passport
  oauthApp.use(passport.initialize());
  oauthApp.use(passport.session());
  
  // Set up EJS for views
  oauthApp.set('view engine', 'ejs');
  oauthApp.set('views', path.join(__dirname, 'views'));
  
  // Serve static files
  oauthApp.use('/public', express.static(path.join(__dirname, 'public')));
  
  // Rate limiting for OAuth endpoints
  oauthApp.use('/token', createStrictRateLimiter(60 * 1000, 30)); // 30 requests per minute
  
  // Authorization endpoint
  oauthApp.get('/authorize', (req, res, next) => {
    // If user is not logged in, redirect to login
    if (!req.isAuthenticated()) {
      // Store the OAuth request details in the session
      req.session.authorizationRequest = {
        response_type: req.query.response_type,
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri,
        scope: req.query.scope,
        state: req.query.state
      };
      
      return res.redirect(`/oauth/login?redirect=${encodeURIComponent('/oauth/authorize')}`);
    }
    
    next();
  }, oauth2Server.authorize({
    authenticateHandler: {
      handle: (req, res) => {
        // The user is already authenticated via Passport session
        return req.user;
      }
    }
  }), (req, res) => {
    // This shouldn't be reached, as oauth2Server.authorize should have redirected
    res.redirect('/');
  });
  
  // User consent page
  oauthApp.get('/consent', ensureAuthenticated, async (req, res) => {
    const { client_id, redirect_uri, scope, response_type, state } = req.query;
    
    try {
      // Validate the client and redirect URI
      const client = await OAuthModel.getClient(client_id);
      
      if (!client) {
        return res.status(400).render('error', { 
          error: 'Invalid client',
          user: req.user,
          csrfToken: req.csrfToken ? req.csrfToken() : null
        });
      }
      
      const redirectUris = client.redirectUris;
      if (!redirectUris.includes(redirect_uri)) {
        return res.status(400).render('error', { 
          error: 'Invalid redirect URI',
          user: req.user,
          csrfToken: req.csrfToken ? req.csrfToken() : null
        });
      }
      
      // Parse and validate requested scopes
      const requestedScopes = scope ? scope.split(' ') : [];
      const availableScopes = [
        { name: 'read', description: 'Read your profile and posts' },
        { name: 'write', description: 'Create, edit and delete posts' },
        { name: 'follow', description: 'Follow and unfollow other users' }
      ];
      
      const scopesForConsent = availableScopes.filter(s => 
        requestedScopes.includes(s.name)
      );
      
      res.render('consent', {
        client,
        scopes: scopesForConsent,
        user: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null,
        query: {
          client_id,
          redirect_uri,
          scope,
          response_type,
          state
        }
      });
    } catch (error) {
      logger.error('Error in consent page', { error: error.message });
      res.status(500).render('error', { 
        error: 'Server error',
        user: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null
      });
    }
  });
  
  // Handle consent form submission
  oauthApp.post('/consent/approve', ensureAuthenticated, (req, res) => {
    // User has approved the authorization
    const query = {
      client_id: req.body.client_id,
      redirect_uri: req.body.redirect_uri,
      scope: req.body.scope,
      response_type: req.body.response_type,
      state: req.body.state,
      allow: 'true' // Indicate approval
    };
    
    // Redirect back to the authorize endpoint with approval
    const queryString = Object.entries(query)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    res.redirect(`/oauth/authorize?${queryString}`);
  });
  
  oauthApp.post('/consent/deny', ensureAuthenticated, (req, res) => {
    // User has denied the authorization
    const { redirect_uri, state } = req.body;
    
    // Redirect back to the client with an error
    const query = {
      error: 'access_denied',
      error_description: 'The user denied the request',
      state
    };
    
    const queryString = Object.entries(query)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    res.redirect(`${redirect_uri}?${queryString}`);
  });
  
  // Token endpoint
  oauthApp.post('/token', oauth2Server.token());
  
  // Login page
  oauthApp.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect(req.query.redirect || '/oauth');
    }
    
    res.render('oauth-login', {
      title: 'Login to Exprsn',
      error: req.query.error,
      redirect: req.query.redirect || '/oauth',
      csrfToken: req.csrfToken ? req.csrfToken() : null
    });
  });
  
  // Login form submission
  oauthApp.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        logger.error('Login error', { error: err.message });
        return next(err);
      }
      
      if (!user) {
        return res.redirect('/oauth/login?error=1');
      }
      
      req.logIn(user, (err) => {
        if (err) {
          logger.error('Login error', { error: err.message });
          return next(err);
        }
        
        // Redirect to the stored authorization request or the specified redirect
        if (req.session.authorizationRequest) {
          const authRequest = req.session.authorizationRequest;
          delete req.session.authorizationRequest;
          
          const queryString = Object.entries(authRequest)
            .map(([key, value]) => `${key}=${encodeURIComponent(value || '')}`)
            .join('&');
          
          return res.redirect(`/oauth/authorize?${queryString}`);
        }
        
        return res.redirect(req.body.redirect || '/oauth');
      });
    })(req, res, next);
  });
  
  // Logout
  oauthApp.get('/logout', (req, res) => {
    req.logout(function(err) {
      if (err) { 
        logger.error('Error during logout', { error: err.message });
      }
      res.redirect('/oauth/login');
    });
  });
  
  // Client registration page
  oauthApp.get('/clients', ensureAuthenticated, async (req, res) => {
    try {
      // Get all clients for this user
      const clients = db.prepare(`
        SELECT * FROM oauth_clients 
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY created_at DESC
      `).all(req.user.id);
      
      res.render('oauth-clients', {
        title: 'OAuth Clients',
        clients,
        user: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null
      });
    } catch (error) {
      logger.error('Error loading client page', { error: error.message });
      res.status(500).render('error', { 
        error: 'Error loading clients',
        user: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null
      });
    }
  });
  
  // New client form
  oauthApp.get('/clients/new', ensureAuthenticated, (req, res) => {
    res.render('oauth-client-form', {
      title: 'Register New Client',
      client: null,
      user: req.user,
      csrfToken: req.csrfToken ? req.csrfToken() : null
    });
  });
  
  // Client registration form submission
  oauthApp.post('/clients', ensureAuthenticated, (req, res) => {
    try {
      const { 
        name, 
        description, 
        redirect_uris, 
        website_url,
        client_uri,
        logo_uri 
      } = req.body;
      
      if (!name || !redirect_uris) {
        return res.status(400).json({ error: 'Name and redirect URIs are required' });
      }
      
      // Generate client ID and secret
      const clientId = uuidv4();
      const clientSecret = crypto.randomBytes(32).toString('hex');
      
      // Parse redirect URIs
      const redirectUriArray = redirect_uris.split(',').map(uri => uri.trim());
      
      // Insert new client
      db.prepare(`
        INSERT INTO oauth_clients (
          id, name, description, client_secret, redirect_uris,
          grant_types, scope, user_id, website_url, logo_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientId,
        name,
        description || '',
        clientSecret,
        JSON.stringify(redirectUriArray),
        JSON.stringify(['authorization_code', 'refresh_token']),
        'read write follow',
        req.user.id,
        website_url || '',
        logo_uri || ''
      );
      
      res.redirect('/oauth/clients');
    } catch (error) {
      logger.error('Error creating client', { error: error.message });
      res.status(500).render('error', { 
        error: 'Error creating client',
        user: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null
      });
    }
  });
  
  // Delete client
  oauthApp.post('/clients/:id/delete', ensureAuthenticated, (req, res) => {
    try {
      const clientId = req.params.id;
      
      // Verify this client belongs to the user
      const client = db.prepare('SELECT * FROM oauth_clients WHERE id = ?').get(clientId);
      
      if (!client || (client.user_id !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Delete client
      db.prepare('DELETE FROM oauth_clients WHERE id = ?').run(clientId);
      
      // Delete all associated tokens
      db.prepare('DELETE FROM oauth_access_tokens WHERE client_id = ?').run(clientId);
      db.prepare('DELETE FROM oauth_refresh_tokens WHERE client_id = ?').run(clientId);
      db.prepare('DELETE FROM oauth_authorization_codes WHERE client_id = ?').run(clientId);
      
      res.redirect('/oauth/clients');
    } catch (error) {
      logger.error('Error deleting client', { error: error.message });
      res.status(500).render('error', { 
        error: 'Error deleting client',
        user: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null
      });
    }
  });
  
  // OpenID Connect discovery document
  oauthApp.get('/.well-known/openid-configuration', (req, res) => {
    res.json({
      issuer: config.oauth.issuer,
      authorization_endpoint: `${config.oauth.issuer}/authorize`,
      token_endpoint: `${config.oauth.issuer}/token`,
      userinfo_endpoint: `${config.oauth.issuer}/userinfo`,
      jwks_uri: `${config.oauth.issuer}/.well-known/jwks.json`,
      registration_endpoint: `${config.oauth.issuer}/register`,
      scopes_supported: ['openid', 'profile', 'email', 'read', 'write', 'follow'],
      response_types_supported: ['code', 'token', 'id_token', 'code token', 'code id_token', 'token id_token', 'code token id_token'],
      response_modes_supported: ['query', 'fragment'],
      grant_types_supported: ['authorization_code', 'implicit', 'refresh_token', 'client_credentials'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      userinfo_signing_alg_values_supported: ['RS256'],
      request_object_signing_alg_values_supported: ['none', 'RS256'],
      claims_supported: ['sub', 'name', 'preferred_username', 'profile', 'picture', 'website', 'email', 'email_verified', 'updated_at', 'iss', 'aud']
    });
  });
  
  // JWKS endpoint for OpenID Connect
  oauthApp.get('/.well-known/jwks.json', (req, res) => {
    res.json({
      keys: jwks.keys
    });
  });
  
  // UserInfo endpoint
  oauthApp.get('/userinfo', authenticateAccessToken, (req, res) => {
    // Only provide userinfo if scope includes 'profile' or 'openid'
    const scope = req.oauth.token.scope;
    if (!scope.includes('openid') && !scope.includes('profile') && !scope.includes('read')) {
      return res.status(403).json({ error: 'Insufficient scope' });
    }
    
    const user = req.user;
    
    const userInfo = {
      sub: user.id.toString(),
      preferred_username: user.username,
      name: user.display_name || user.username
    };
    
    if (scope.includes('profile') || scope.includes('read')) {
      userInfo.picture = user.avatar_url;
      userInfo.website = `https://${user.subdomain || user.username}.${config.baseDomain}`;
      userInfo.profile = `https://${user.subdomain || user.username}.${config.baseDomain}/@${user.username}`;
      userInfo.updated_at = user.updated_at;
      userInfo.account_url = `https://${user.subdomain || user.username}.${config.baseDomain}`;
    }
    
    if ((scope.includes('email') || scope.includes('read')) && scope.includes('openid')) {
      userInfo.email = user.email;
      userInfo.email_verified = !!user.verified;
    }
    
    res.json(userInfo);
  });
  
  // Home page
  oauthApp.get('/', (req, res) => {
    res.render('oauth-home', {
      title: 'Exprsn OAuth Server',
      user: req.user,
      csrfToken: req.csrfToken ? req.csrfToken() : null
    });
  });
  
  return oauthApp;
}

// Create status subdomain
function setupStatusSubdomain() {
  const statusApp = express();
  
  // Setup view engine
  statusApp.set('view engine', 'ejs');
  statusApp.set('views', path.join(__dirname, 'views'));
  
  // Serve static files
  statusApp.use(express.static(path.join(__dirname, 'public')));
  
  // Status dashboard route - make it require authentication
  statusApp.get('/', ensureAuthenticated, (req, res) => {
    res.render('status-dashboard', {
      sites: activeSites,
      serviceStatus: serviceStatus,
      siteConfigs: siteConfigs,
      baseDomain: config.baseDomain,
      moment: moment,
      user: req.user
    });
  });
  
  // API endpoint to get all statuses (also requires authentication)
  statusApp.get('/api/status', ensureAuthenticated, (req, res) => {
    res.json({
      sites: activeSites,
      status: serviceStatus,
      timestamp: new Date()
    });
  });
  
  // Use vhost middleware
  app.use(vhost(`status.${config.baseDomain}`, statusApp));
  
  logger.info(`Setup status dashboard at status.${config.baseDomain}`);
}

// Create subdomain registration app
function setupRegistrationSubdomain() {
  const regApp = express();
  
  // Setup view engine
  regApp.set('view engine', 'ejs');
  regApp.set('views', path.join(__dirname, 'views'));
  
  // Serve static files
  regApp.use('/public', express.static(path.join(__dirname, 'public')));
  
  // Apply rate limiting
  regApp.use(createModerateRateLimiter());
  
  // Home page with registration form
  regApp.get('/', (req, res) => {
    res.render('register-subdomain', {
      title: 'Register Your Subdomain',
      user: req.user,
      csrfToken: req.csrfToken ? req.csrfToken() : null,
      error: req.query.error,
      success: req.query.success
    });
  });
  
  // Process registration
  regApp.post('/register', ensureAuthenticated, async (req, res) => {
    try {
      const { subdomain } = req.body;
      
      // Validate subdomain format
      const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
      if (!subdomainRegex.test(subdomain)) {
        return res.redirect('/register?error=invalid-format');
      }
      
      // Don't allow certain reserved subdomains
      const reservedSubdomains = ['www', 'mail', 'smtp', 'admin', 'auth', 'api', 'status', 'register', 'app'];
      if (reservedSubdomains.includes(subdomain)) {
        return res.redirect('/register?error=reserved');
      }
      
      // Register the subdomain
      const result = await UserModel.registerSubdomain(req.user.id, subdomain);
      
      if (!result.success) {
        return res.redirect(`/register?error=${encodeURIComponent(result.message)}`);
      }
      
      // Show success page with verification instructions
      res.render('verify-subdomain', {
        title: 'Verify Your Subdomain',
        user: req.user,
        csrfToken: req.csrfToken ? req.csrfToken() : null,
        subdomain,
        verificationToken: result.verificationToken,
        dnsVerification: `_exprsn-verify.${subdomain}.${config.baseDomain}`,
        txtRecord: result.verificationToken,
        verifyUrl: `/register/verify?token=${result.verificationToken}`
      });
    } catch (error) {
      logger.error('Subdomain registration error', { error: error.message });
      res.redirect('/register?error=server-error');
    }
  });
  
  // Verify subdomain
  regApp.get('/verify', ensureAuthenticated, async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.redirect('/register?error=missing-token');
      }
      
      const result = await UserModel.verifySubdomain(token);
      
      if (!result.success) {
        return res.redirect(`/register?error=${encodeURIComponent(result.message)}`);
      }
      
      // Redirect to the new subdomain
      res.redirect(`https://${result.subdomain}.${config.baseDomain}/`);
    } catch (error) {
      logger.error('Subdomain verification error', { error: error.message });
      res.redirect('/register?error=verification-failed');
    }
  });
  
  // Use vhost middleware
  app.use(vhost(`register.${config.baseDomain}`, regApp));
  
  logger.info(`Setup subdomain registration at register.${config.baseDomain}`);
}

// Authentication routes
app.get('/login', (req, res) => {
  // Check if already authenticated
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  
  res.render('login', { 
    title: 'Exprsn Site Manager - Login',
    error: req.query.error,
    csrfToken: req.csrfToken ? req.csrfToken() : null
  });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login?error=1'
}));

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      logger.error('Error during logout', { error: err.message });
      return res.redirect('/'); 
    }
    res.redirect('/login');
  });
});

// API authentication routes (JWT)
const authRouter = express.Router();

// Rate limit auth endpoints
authRouter.use(createStrictRateLimiter(15 * 60 * 1000, 20)); // 20 attempts per 15 min

// Login endpoint for JWT authentication
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    const user = UserModel.findByUsername(username);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    if (!UserModel.validatePassword(user, password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    // Update last login time
    UserModel.updateLastLogin(user.id);
    
    // Generate JWT token
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
      subdomain: user.subdomain
    };
    
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });
    
    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        subdomain: user.subdomain
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// Register endpoint for new users
authRouter.post('/register', async (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and can only contain letters, numbers, and underscores'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check if username or email already exists
    if (UserModel.findByUsername(username)) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken'
      });
    }
    
    if (UserModel.findByEmail(email)) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Create the user
    const user = UserModel.create({
      username,
      email,
      password,
      display_name: display_name || username,
      role: 'user' // Default role for new users
    });
    
    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Verify token endpoint
authRouter.get('/verify', jwtAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

app.use('/api/auth', authRouter);

// Setup the admin interface on the main domain - require authentication
app.get('/', ensureAuthenticated, (req, res) => {
  res.render('index', { 
    title: 'Exprsn Site Manager',
    baseDomain: config.baseDomain,
    sites: activeSites,
    serviceStatus: serviceStatus,
    user: req.user,
    csrfToken: req.csrfToken ? req.csrfToken() : null
  });
});

// API Routes for site management
const apiRouter = express.Router();

// General API rate limiting
apiRouter.use(createModerateRateLimiter(60 * 60 * 1000, 200)); // 200 requests per hour

// Middleware to check API authentication
apiRouter.use((req, res, next) => {
  // Allow unauthenticated access to GET /sites and /status for public info
  if (req.method === 'GET' && (req.path === '/sites' || req.path === '/status')) {
    return next();
  }
  
  // All other API routes require authentication
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required'
    });
  }
  
  next();
});

// Get list of sites
apiRouter.get('/sites', (req, res) => {
  res.json({ sites: activeSites });
});

// Get status of all sites
apiRouter.get('/status', (req, res) => {
  res.json({ 
    sites: activeSites,
    status: serviceStatus,
    timestamp: new Date()
  });
});

// Get detailed info for a specific site
apiRouter.get('/sites/:site', (req, res) => {
  const siteName = req.params.site;
  
  if (!activeSites.includes(siteName)) {
    return res.status(404).json({ 
      success: false, 
      message: `Site ${siteName} not found` 
    });
  }
  
  res.json({
    success: true,
    site: {
      name: siteName,
      status: serviceStatus[siteName] || { status: 'unknown' },
      config: siteConfigs[siteName] || {}
    }
  });
});

// Reload a site - stricter rate limiting for this endpoint
apiRouter.post('/reload/:site', createStrictRateLimiter(60 * 1000, 10), (req, res) => {
  const siteName = req.params.site;
  
  logger.info(`Reloading site ${siteName}`);
  
  if (setupSite(siteName)) {
    res.json({ 
      success: true, 
      message: `Site ${siteName} reloaded successfully` 
    });
    io.emit('site-reloaded', { site: siteName });
  } else {
    res.status(404).json({ 
      success: false, 
      message: `Failed to reload site ${siteName}` 
    });
  }
});

// Setup user profile API
apiRouter.get('/profile', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      display_name: req.user.display_name,
      avatar_url: req.user.avatar_url,
      bio: req.user.bio,
      role: req.user.role,
      subdomain: req.user.subdomain,
      created_at: req.user.created_at,
      settings: req.user.settings ? JSON.parse(req.user.settings) : {}
    }
  });
});

app.use('/api', apiRouter);

// Create a SaaS web app on the app subdomain
function setupWebApp() {
  const webApp = express();
  
  // Apply same middleware
  webApp.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
        styleSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "*"],
        connectSrc: ["'self'", "*"],
        fontSrc: ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "*"],
        frameSrc: ["'self'"],
      }
    }
  }));
  webApp.use(compression());
  webApp.use(cookieParser());
  webApp.use(bodyParser.json());
  webApp.use(bodyParser.urlencoded({ extended: true }));
  
  // Setup view engine
  webApp.set('view engine', 'ejs');
  webApp.set('views', path.join(__dirname, 'views'));
  
  // Serve static files
  webApp.use('/public', express.static(path.join(__dirname, 'public')));
  
  // Home page - main web interface
  webApp.get('/', (req, res) => {
    res.render('webapp', {
      title: 'Exprsn Social Network',
      user: null,
      baseDomain: config.baseDomain
    });
  });
  
  // OAuth callback handler
  webApp.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).render('error', { 
        error: 'Missing authorization code',
        user: null
      });
    }
    
    try {
      // Get client credentials
      const client = db.prepare('SELECT * FROM oauth_clients WHERE name = ?')
        .get('Exprsn Web App');
      
      if (!client) {
        return res.status(500).render('error', { 
          error: 'OAuth client not found',
          user: null
        });
      }
      
      // Exchange code for token
      const tokenResponse = await axios.post(`https://auth.${config.baseDomain}/token`, 
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: `https://app.${config.baseDomain}/callback`,
          client_id: client.id,
          client_secret: client.client_secret
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      // Get user info
      const userResponse = await axios.get(`https://auth.${config.baseDomain}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data.access_token}`
        }
      });
      
      // Store token in cookie
      res.cookie('access_token', tokenResponse.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.cookie('refresh_token', tokenResponse.data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      // Redirect to dashboard
      res.redirect('/dashboard');
    } catch (error) {
      logger.error('Error in OAuth callback', { error: error.message });
      res.status(500).render('error', { 
        error: 'Error processing authentication',
        user: null
      });
    }
  });
  
  // Dashboard
  webApp.get('/dashboard', async (req, res) => {
    // Check if user is authenticated via OAuth
    const accessToken = req.cookies.access_token;
    
    if (!accessToken) {
      return res.redirect('/login');
    }
    
    try {
      // Verify the access token
      const userResponse = await axios.get(`https://auth.${config.baseDomain}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const user = userResponse.data;
      
      res.render('webapp-dashboard', {
        title: 'Your Dashboard',
        user,
        baseDomain: config.baseDomain
      });
    } catch (error) {
      // Token might be expired or invalid
      logger.error('Error verifying access token', { error: error.message });
      res.redirect('/login');
    }
  });
  
  // Login page
  webApp.get('/login', (req, res) => {
    // Check if already authenticated
    const accessToken = req.cookies.access_token;
    if (accessToken) {
      return res.redirect('/dashboard');
    }
    
    // Default client for the web app
    const client = db.prepare('SELECT * FROM oauth_clients WHERE name = ?')
      .get('Exprsn Web App');
    
    if (!client) {
      return res.status(500).render('error', { 
        error: 'OAuth client not configured',
        user: null
      });
    }
    
    // Generate random state
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in cookie
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    // Redirect to authorization endpoint
    const authUrl = `https://auth.${config.baseDomain}/authorize?` +
      `response_type=code&` +
      `client_id=${client.id}&` +
      `redirect_uri=${encodeURIComponent(`https://app.${config.baseDomain}/callback`)}&` +
      `scope=openid%20profile%20email%20read%20write%20follow&` +
      `state=${state}`;
    
    res.redirect(authUrl);
  });
  
  // Logout
  webApp.get('/logout', (req, res) => {
    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('oauth_state');
    
    res.redirect('/');
  });
  
  // Use vhost middleware
  app.use(vhost(`app.${config.baseDomain}`, webApp));
  
  logger.info(`Setup web app at app.${config.baseDomain}`);
}

// RESTful API with JWT auth
const apiV1Router = express.Router();

// Apply JWT authentication to all v1 API routes
apiV1Router.use(jwtAuth);

// Get user profile
apiV1Router.get('/profile', (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Update user profile
apiV1Router.put('/profile', (req, res) => {
  // This would update the user profile in the database
  res.json({
    success: true,
    message: 'Profile updated',
    user: req.user
  });
});

// Register the v1 API router
app.use('/api/v1', apiV1Router);

// Function to setup SSL
function setupSSL() {
  try {
    // Check if SSL certificates exist
    const privateKeyPath = path.join(config.sslCertsDir, 'privkey.pem');
    const certificatePath = path.join(config.sslCertsDir, 'fullchain.pem');
    
    if (fs.existsSync(privateKeyPath) && fs.existsSync(certificatePath)) {
      const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      const certificate = fs.readFileSync(certificatePath, 'utf8');
      
      const credentials = { key: privateKey, cert: certificate };
      
      // Create HTTPS server
      const httpsServer = https.createServer(credentials, app);
      const sslPort = config.sslPort;
      
      // Start HTTPS server
      httpsServer.listen(sslPort, () => {
        logger.info(`HTTPS server running on port ${sslPort}`);
      });
      
      return true;
    } else {
      logger.warn('SSL certificates not found, HTTPS server not started');
      return false;
    }
  } catch (error) {
    logger.error('Failed to setup SSL', { error: error.message });
    return false;
  }
}

// Create a sample route file in the routes directory if it doesn't exist
function createSampleRouteFile() {
  const sampleRouteDir = path.join(config.routesDir);
  const sampleRoutePath = path.join(sampleRouteDir, 'users.js');
  
  if (!fs.existsSync(sampleRouteDir)) {
    fs.mkdirSync(sampleRouteDir, { recursive: true });
  }
  
  if (!fs.existsSync(sampleRoutePath)) {
    const sampleRouteContent = `
const express = require('express');
const router = express.Router();

// GET all users
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'List of users',
    users: [
      { id: 1, username: 'user1' },
      { id: 2, username: 'user2' }
    ]
  });
});

// GET user by ID
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: \`User with ID \${req.params.id}\`,
    user: { id: parseInt(req.params.id), username: \`user\${req.params.id}\` }
  });
});

// POST create new user
router.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'User created',
    user: { ...req.body, id: Math.floor(Math.random() * 1000) }
  });
});

// PUT update user
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    message: \`User \${req.params.id} updated\`,
    user: { id: parseInt(req.params.id), ...req.body }
  });
});

// DELETE user
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: \`User \${req.params.id} deleted\`
  });
});

// Export the router with additional metadata
module.exports = {
  path: '/api/users',
  router: router,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  auth: 'oauth',
  scope: 'read write',
  role: 'admin',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,             // 30 requests per minute
    strict: true,        // Use strict rate limiting
    db: true             // Use DB-based rate limiting
  }
};
`;
    
    fs.writeFileSync(sampleRoutePath, sampleRouteContent);
    logger.info(`Created sample route file: ${sampleRoutePath}`);
  }
}

// Setup well-known files for ActivityPub discovery
function setupActivityPubDiscovery() {
  // nodeinfo endpoint
  app.get('/.well-known/nodeinfo', (req, res) => {
    res.json({
      links: [{
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
        href: `https://${config.baseDomain}/nodeinfo/2.0`
      }]
    });
  });
  
  // nodeinfo implementation
  app.get('/nodeinfo/2.0', (req, res) => {
    res.json({
      version: '2.0',
      software: {
        name: 'exprsn',
        version: '1.0.0'
      },
      protocols: ['activitypub'],
      services: {
        inbound: [],
        outbound: []
      },
      usage: {
        users: {
          total: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count,
          activeMonth: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND last_login > date("now", "-30 day")').get().count,
          activeHalfyear: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND last_login > date("now", "-180 day")').get().count
        },
        localPosts: db.prepare('SELECT COUNT(*) as count FROM posts').get().count
      },
      openRegistrations: true,
      metadata: {
        nodeName: `${config.baseDomain}`,
        nodeDescription: 'A decentralized social media network based on Exprsn.io',
        maintainer: {
          name: 'System Administrator',
          email: `admin@${config.baseDomain}`
        }
      }
    });
  });
  
  // host-meta
  app.get('/.well-known/host-meta', (req, res) => {
    res.type('application/xrd+xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="https://${config.baseDomain}/.well-known/webfinger?resource={uri}"/>
</XRD>`);
  });
  
  // webfinger
  app.get('/.well-known/webfinger', (req, res) => {
    const resource = req.query.resource;
    
    if (!resource) {
      return res.status(400).json({ error: 'Resource parameter required' });
    }
    
    const resourceParts = resource.split(':');
    const schema = resourceParts[0];
    let identifier;
    
    if (schema === 'acct') {
      identifier = resourceParts[1];
      // Extract username and domain from acct:username@domain
      const matches = identifier.match(/^(.+)@(.+)$/);
      
      if (!matches) {
        return res.status(400).json({ error: 'Invalid resource format' });
      }
      
      const username = matches[1];
      const domain = matches[2];
      
      // If this is not our domain, return 404
      if (domain !== config.baseDomain) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Try to find user by username
      const user = UserModel.findByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const subdomain = user.subdomain || username;
      
      // Return webfinger response
      const webfinger = {
        subject: resource,
        links: [
          {
            rel: 'self',
            type: 'application/activity+json',
            href: `https://${subdomain}.${config.baseDomain}/user/${username}`
          },
          {
            rel: 'http://webfinger.net/rel/profile-page',
            type: 'text/html',
            href: `https://${subdomain}.${config.baseDomain}/@${username}`
          }
        ]
      };
      
      res.json(webfinger);
    } else {
      return res.status(400).json({ error: 'Unsupported resource type' });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Express error', { error: err.message, stack: err.stack });
  
  // If the error is a CSRF failure
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }
  
  // Handle OAuth errors
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      success: false,
      message: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Start the server
server.listen(config.port, () => {
  logger.info(`HTTP server running on port ${config.port}`);
  logger.info(`Main domain: ${config.baseDomain}`);
  logger.info(`Monitoring Sites directory: ${config.sitesDir}`);
  
  // Setup SSL if available
  setupSSL();
  
  // Setup initial sites
  setupInitialSites();
  
  // Setup status subdomain
  setupStatusSubdomain();
  
  // Setup OAuth/OpenID server
  const oauthApp = setupOAuthServer();
  app.use(vhost(`auth.${config.baseDomain}`, oauthApp));
  logger.info(`Setup OAuth server at auth.${config.baseDomain}`);
  
  // Setup subdomain registration
  setupRegistrationSubdomain();
  
  // Setup SaaS web app
  setupWebApp();
  
  // Setup ActivityPub discovery
  setupActivityPubDiscovery();
  
  // Setup routes watcher
  loadInitialRoutes();
  const routesWatcher = setupRoutesWatcher();
  
  // Create a sample route file
  createSampleRouteFile();
  
  // Start watching for directory changes
  const sitesWatcher = setupSitesWatcher();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    sitesWatcher.close().then(() => {
      routesWatcher.close().then(() => {
        // Close database connection
        if (db) {
          db.close();
          logger.info('Database connection closed');
        }
        
        server.close(() => {
          logger.info('Server shut down');
          process.exit(0);
        });
      });
    });
  });
});

// Export for testing
module.exports = { 
  app, 
  server, 
  io, 
  setupSite, 
  removeSite, 
  db,
  dynamicRoutes, 
  registerRoute,
  unregisterRoute,
  UserModel,
  SocialModel,
  OAuthModel
};
