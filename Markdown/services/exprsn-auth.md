# Exprsn Authentication & Authorization (exprsn-auth)

**Version:** 1.0.0
**Port:** 3001
**Status:** ✅ Production-Ready (260+ test cases)
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

The **Exprsn Authentication & Authorization Service** provides comprehensive identity and access management for the entire Exprsn ecosystem. It implements industry-standard authentication protocols including OAuth2/OIDC, SAML 2.0 SSO, and multi-factor authentication (MFA).

**Security Level:** CRITICAL - Review all changes carefully due to security implications.

---

## Key Features

### Authentication Methods
- **Local Authentication** - Username/password with bcrypt hashing
- **OAuth2/OIDC** - Full OAuth2 provider with OpenID Connect support
- **SAML 2.0 SSO** - Enterprise Single Sign-On integration
- **Social Login** - Google, GitHub, and custom OAuth2 providers
- **Multi-Factor Authentication (MFA)** - TOTP and SMS-based 2FA
- **LDAP/Active Directory** - Enterprise directory integration

### Authorization & Access Control
- **Role-Based Access Control (RBAC)** - Hierarchical role management
- **Permission System** - Fine-grained permission assignments
- **Group Management** - User group organization
- **Resource-Level Authorization** - Per-resource access control
- **Delegation** - Temporary permission delegation

### Session Management
- **Redis-Based Sessions** - Fast, distributed session storage
- **Refresh Tokens** - Long-lived token refresh mechanism
- **Session Limits** - Concurrent session controls
- **Device Management** - Track and manage user devices
- **Session Revocation** - Instant logout across all devices

### Security Features
- **Password Policies** - Configurable complexity requirements
- **Account Lockout** - Brute-force protection
- **Email Verification** - Account activation workflow
- **Password Reset** - Secure reset token mechanism
- **Audit Logging** - Comprehensive security audit trail
- **IP Whitelisting** - Restrict access by IP range

---

## Architecture

### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (database: `exprsn_auth`)
- **Cache/Sessions:** Redis
- **View Engine:** EJS with Handlebars
- **Authentication:** Passport.js
- **OAuth2 Server:** oauth2-server
- **SAML:** passport-saml

### Security Implementation
- **bcrypt** - Password hashing (cost factor: 12)
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-origin request protection
- **JWT** - Token-based authentication
- **speakeasy** - TOTP generation/verification
- **express-session** - Secure session management

### Database Schema

**Tables:**
- `users` - User accounts and profiles
- `roles` - Role definitions
- `permissions` - Permission definitions
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission mappings
- `groups` - User groups
- `group_members` - Group membership
- `oauth_clients` - OAuth2 client applications
- `oauth_authorization_codes` - Authorization code grants
- `oauth_access_tokens` - Access tokens
- `oauth_refresh_tokens` - Refresh tokens
- `saml_providers` - SAML identity providers
- `mfa_devices` - MFA device registrations
- `sessions` - Active user sessions
- `password_resets` - Password reset tokens
- `email_verifications` - Email verification tokens
- `audit_logs` - Security audit events
- `login_attempts` - Failed login tracking

---

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecureP@ssw0rd",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "emailVerificationSent": true
  }
}
```

#### `POST /api/auth/login`
Authenticate user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "roles": ["user"]
    }
  }
}
```

#### `POST /api/auth/logout`
End user session.

#### `POST /api/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `POST /api/auth/verify-email`
Verify email address with token.

**Request:**
```json
{
  "token": "verification-token-string"
}
```

---

### Password Management

#### `POST /api/auth/password/forgot`
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### `POST /api/auth/password/reset`
Reset password with token.

**Request:**
```json
{
  "token": "reset-token-string",
  "newPassword": "NewSecureP@ssw0rd"
}
```

#### `POST /api/auth/password/change`
Change password (authenticated).

**Request:**
```json
{
  "currentPassword": "OldP@ssw0rd",
  "newPassword": "NewP@ssw0rd"
}
```

---

### Multi-Factor Authentication (MFA)

#### `POST /api/mfa/setup`
Initialize MFA setup (generates QR code).

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "base32-secret",
    "qrCode": "data:image/png;base64,...",
    "backupCodes": [
      "12345678",
      "87654321"
    ]
  }
}
```

#### `POST /api/mfa/enable`
Enable MFA after verifying code.

**Request:**
```json
{
  "token": "123456"
}
```

#### `POST /api/mfa/disable`
Disable MFA for user.

**Request:**
```json
{
  "password": "UserP@ssw0rd"
}
```

#### `POST /api/mfa/verify`
Verify MFA code during login.

**Request:**
```json
{
  "sessionId": "temp-session-id",
  "token": "123456"
}
```

---

### OAuth2 Endpoints

#### `GET /oauth/authorize`
OAuth2 authorization endpoint.

**Query Parameters:**
```
response_type=code
client_id=abc123
redirect_uri=https://app.example.com/callback
scope=read write
state=random-state-string
```

#### `POST /oauth/token`
OAuth2 token endpoint.

**Grant Types:**
- `authorization_code` - Authorization code flow
- `password` - Resource owner password credentials
- `client_credentials` - Client credentials flow
- `refresh_token` - Token refresh

**Request (Authorization Code):**
```json
{
  "grant_type": "authorization_code",
  "code": "auth-code",
  "client_id": "abc123",
  "client_secret": "secret",
  "redirect_uri": "https://app.example.com/callback"
}
```

**Response:**
```json
{
  "access_token": "access-token-string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh-token-string",
  "scope": "read write"
}
```

#### `GET /oauth/userinfo`
Get user information (OpenID Connect).

**Headers:**
```
Authorization: Bearer access-token
```

**Response:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://..."
}
```

---

### SAML 2.0 Endpoints

#### `GET /saml/metadata`
SAML service provider metadata.

#### `POST /saml/login/:providerId`
Initiate SAML SSO login.

#### `POST /saml/acs`
Assertion Consumer Service (ACS) endpoint.

#### `POST /saml/logout`
SAML Single Logout (SLO).

---

### User Management

#### `GET /api/users/me`
Get current user profile.

#### `PUT /api/users/me`
Update current user profile.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://...",
  "bio": "Software developer"
}
```

#### `GET /api/users/:id`
Get user by ID (requires permission).

#### `DELETE /api/users/:id`
Delete user account.

---

### Role & Permission Management

#### `GET /api/roles`
List all roles.

#### `POST /api/roles`
Create new role (admin only).

**Request:**
```json
{
  "name": "moderator",
  "description": "Content moderator role",
  "permissions": [
    "posts.moderate",
    "comments.moderate"
  ]
}
```

#### `GET /api/permissions`
List all permissions.

#### `POST /api/users/:id/roles`
Assign role to user.

**Request:**
```json
{
  "roleId": "uuid"
}
```

---

### Group Management

#### `GET /api/groups`
List user's groups.

#### `POST /api/groups`
Create new group.

**Request:**
```json
{
  "name": "Engineering Team",
  "description": "Software engineering group",
  "visibility": "private"
}
```

#### `POST /api/groups/:id/members`
Add member to group.

#### `DELETE /api/groups/:id/members/:userId`
Remove member from group.

---

## Configuration

### Environment Variables

```env
# Application
NODE_ENV=development|production
PORT=3001
SERVICE_NAME=exprsn-auth

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exprsn_auth
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Session
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=86400000
SESSION_SECURE=false

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OAuth2
OAUTH2_ENABLED=true
OAUTH2_ACCESS_TOKEN_LIFETIME=3600
OAUTH2_REFRESH_TOKEN_LIFETIME=1209600
OAUTH2_AUTHORIZATION_CODE_LIFETIME=300

# SAML
SAML_ENABLED=true
SAML_ENTRY_POINT=https://idp.example.com/sso
SAML_ISSUER=https://auth.exprsn.io
SAML_CERT_PATH=/path/to/saml.crt

# Social Login
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret

# Email
EMAIL_PROVIDER=sendgrid|ses|smtp
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@exprsn.io

# MFA
MFA_ISSUER=Exprsn
MFA_WINDOW=2
MFA_BACKUP_CODE_COUNT=10

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_MAX_AGE_DAYS=90

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CA Integration
CA_URL=http://localhost:3000
CA_VALIDATION_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Usage Examples

### User Registration and Login

```javascript
const axios = require('axios');

// Register new user
async function registerUser() {
  const response = await axios.post('http://localhost:3001/api/auth/register', {
    email: 'user@example.com',
    username: 'johndoe',
    password: 'SecureP@ssw0rd',
    firstName: 'John',
    lastName: 'Doe'
  });

  return response.data;
}

// Login user
async function loginUser() {
  const response = await axios.post('http://localhost:3001/api/auth/login', {
    email: 'user@example.com',
    password: 'SecureP@ssw0rd'
  });

  const { accessToken, refreshToken } = response.data.data;
  return { accessToken, refreshToken };
}

// Make authenticated request
async function getUserProfile(accessToken) {
  const response = await axios.get('http://localhost:3001/api/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return response.data.data;
}
```

### OAuth2 Integration

```javascript
// Client-side: Initiate OAuth2 flow
function initiateOAuth2Login() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'your-client-id',
    redirect_uri: 'https://yourapp.com/callback',
    scope: 'read write',
    state: generateRandomState()
  });

  window.location.href = `http://localhost:3001/oauth/authorize?${params}`;
}

// Server-side: Handle OAuth2 callback
async function handleOAuth2Callback(code) {
  const response = await axios.post('http://localhost:3001/oauth/token', {
    grant_type: 'authorization_code',
    code: code,
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    redirect_uri: 'https://yourapp.com/callback'
  });

  return response.data;
}
```

### MFA Setup

```javascript
// Setup MFA for user
async function setupMFA(accessToken) {
  const response = await axios.post('http://localhost:3001/api/mfa/setup', {}, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const { secret, qrCode, backupCodes } = response.data.data;

  // Display QR code to user
  console.log('Scan this QR code with your authenticator app:');
  console.log(qrCode);

  // Save backup codes securely
  console.log('Backup codes:', backupCodes);

  return secret;
}

// Enable MFA after user scans QR
async function enableMFA(accessToken, token) {
  const response = await axios.post('http://localhost:3001/api/mfa/enable', {
    token: token
  }, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  return response.data;
}
```

---

## Development

### Setup

```bash
# Navigate to service directory
cd src/exprsn-auth

# Install dependencies
npm install

# Initialize database
npm run migrate

# Seed default data (creates admin user)
npm run seed

# Start in development mode
npm run dev
```

### Testing

```bash
# Run all tests (260+ test cases)
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

---

## Security Best Practices

### Password Management
1. **Strong password policies** - Enforce complexity requirements
2. **Secure storage** - Always use bcrypt (never plain text)
3. **Password history** - Prevent reuse of old passwords
4. **Regular rotation** - Encourage periodic password changes
5. **Breach detection** - Check against known breached passwords

### Session Management
1. **Short-lived tokens** - Limit access token lifetime
2. **Secure cookies** - Use HttpOnly, Secure, SameSite flags
3. **Session rotation** - Rotate session IDs after authentication
4. **Concurrent limits** - Limit active sessions per user
5. **Logout everywhere** - Provide global logout functionality

### OAuth2 Security
1. **PKCE for public clients** - Use Proof Key for Code Exchange
2. **State parameter** - Prevent CSRF attacks
3. **Scope validation** - Validate all requested scopes
4. **Client authentication** - Secure client credentials
5. **Redirect URI validation** - Strict URI matching

### MFA Best Practices
1. **Backup codes** - Provide recovery mechanism
2. **Multiple methods** - Support TOTP and SMS
3. **Rate limiting** - Prevent brute-force attacks
4. **Device trust** - Remember trusted devices
5. **Admin bypass** - Secure admin recovery process

---

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### Metrics to Monitor

- **Login Success/Failure Rate** - Track authentication attempts
- **MFA Verification Rate** - Monitor 2FA usage
- **Token Generation Rate** - OAuth2/JWT token creation
- **Session Count** - Active sessions
- **Failed Login Attempts** - Security alerts
- **Password Reset Requests** - Unusual spikes
- **Email Verification Rate** - Account activation
- **OAuth2 Authorization Rate** - Third-party app usage

---

## Troubleshooting

### Common Issues

**Issue:** Password validation fails
**Solution:** Check password policy configuration and complexity requirements

**Issue:** MFA codes not working
**Solution:** Verify time synchronization (TOTP requires accurate system time)

**Issue:** OAuth2 redirect URI mismatch
**Solution:** Ensure registered redirect URI exactly matches callback URL

**Issue:** Session expires immediately
**Solution:** Check Redis connection and SESSION_MAX_AGE configuration

**Issue:** Email verification not sending
**Solution:** Verify email provider credentials and configuration

---

## Dependencies

### Core Dependencies
- **express** (^4.18.2) - Web framework
- **passport** (^0.7.0) - Authentication middleware
- **passport-local** (^1.0.0) - Local auth strategy
- **passport-oauth2** (^1.7.0) - OAuth2 strategy
- **passport-saml** (^3.2.4) - SAML strategy
- **oauth2-server** (^3.1.1) - OAuth2 server
- **sequelize** (^6.35.2) - ORM
- **bcrypt** (^5.1.1) - Password hashing
- **speakeasy** (^2.0.0) - TOTP/MFA
- **jsonwebtoken** (^9.0.2) - JWT generation
- **redis** (^4.6.11) - Session store
- **@exprsn/shared** (file:../shared) - Shared utilities

---

## Related Documentation

- **OAuth2 Guide:** `/docs/oauth2.md`
- **SAML Configuration:** `/docs/saml-setup.md`
- **MFA Setup Guide:** `/docs/mfa-guide.md`
- **Security Policies:** `/docs/security-policies.md`

---

## Support

For issues, questions, or contributions:
- **Email:** engineering@exprsn.com
- **Critical Security Issues:** Use secure channel
- **License:** MIT
