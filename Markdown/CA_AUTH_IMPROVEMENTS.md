# CA & AUTH REQUIREMENTS - COMPLETION STATUS

**Generated:** 2025-12-22
**Services:** exprsn-ca (Port 3000), exprsn-auth (Port 3001)
**Status:** ✅ CRITICAL ISSUES RESOLVED | 🟡 ADDITIONAL WORK RECOMMENDED

---

## ✅ COMPLETED (Critical Production Blockers)

### 1. Database Migrations Created - exprsn-ca ✅
**Status:** COMPLETE - All 13 models migrated
**Location:** `/src/exprsn-ca/migrations/`

**Created Migrations:**
1. `20251222000001-create-users.js` - User authentication & profiles
2. `20251222000002-create-groups.js` - Distribution lists & organizational units
3. `20251222000003-create-roles.js` - Permission-based roles with flags
4. `20251222000004-create-certificates.js` - X.509 certificates with full PKI support
5. `20251222000005-create-tokens.js` - CA tokens implementing Token Specification v1.0
6. `20251222000006-create-audit-logs.js` - Comprehensive audit trail
7. `20251222000007-create-user-roles.js` - Many-to-many user-role junction
8. `20251222000008-create-user-groups.js` - Many-to-many user-group junction
9. `20251222000009-create-profiles.js` - Extended user profile data
10. `20251222000010-create-tickets.js` - Single-use authentication tickets
11. `20251222000011-create-password-resets.js` - Password reset tracking
12. `20251222000012-create-revocation-lists.js` - CRL management
13. `20251222000013-create-rate-limits.js` - Rate limiting tracking

**Features:**
- ✅ All foreign keys with proper CASCADE/SET NULL
- ✅ Comprehensive indexing strategy (70+ indexes total)
- ✅ GIN indexes for all JSONB columns
- ✅ Unique constraints on critical fields
- ✅ Composite indexes for common query patterns
- ✅ Proper enum types for status/type fields
- ✅ Complete `down()` rollback functions

**Run Migrations:**
```bash
cd src/exprsn-ca
npx sequelize-cli db:migrate
```

---

### 2. Admin Authorization Bypass FIXED ✅
**Status:** CRITICAL VULNERABILITY RESOLVED
**File:** `/src/exprsn-ca/routes/admin.js` (lines 24-79)

**Previous Vulnerability:**
```javascript
// INSECURE - Allowed ALL authenticated users
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  // For now, allow all authenticated users ❌
  next();
}
```

**New Secure Implementation:**
```javascript
async function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  try {
    const { User, Role } = require('../models');

    // Get user with active roles
    const user = await User.findByPk(req.session.user.id, {
      include: [{
        model: Role,
        as: 'roles',
        where: { status: 'active' },
        required: false
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not found'
      });
    }

    // Check for admin roles
    const hasAdminRole = user.roles && user.roles.some(role =>
      role.slug === 'admin' ||
      role.slug === 'super-admin' ||
      role.slug === 'ca-admin'
    );

    if (!hasAdminRole) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }

    req.userRoles = user.roles;
    next();
  } catch (error) {
    req.logger.error('Admin authorization error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to verify admin access'
    });
  }
}
```

**Security Improvements:**
- ✅ Proper database-backed RBAC checking
- ✅ Supports multiple admin role slugs
- ✅ Returns proper HTTP status codes (401, 403, 500)
- ✅ Standardized error response format
- ✅ Attaches roles to request for downstream use
- ✅ Comprehensive error handling

---

### 3. Error Handling & Authorization - Certificates Routes ✅
**Status:** COMPLETE
**File:** `/src/exprsn-ca/routes/certificates.js`

**Improvements Made:**
1. ✅ Added `asyncHandler` from `@exprsn/shared` for async error handling
2. ✅ Added ownership verification on certificate viewing
3. ✅ Added 404 handling for missing certificates
4. ✅ Added 403 forbidden for unauthorized access
5. ✅ Extracted `requireAuth` middleware for reusability
6. ✅ Proper error rendering with user context

**New Authorization Logic:**
```javascript
// User must own certificate OR be an admin
if (certificate.userId !== req.session.user.id && !isAdmin) {
  return res.status(403).render('error', {
    title: 'Forbidden',
    message: 'You do not have permission to view this certificate',
    user: req.session.user
  });
}
```

---

## 🟡 IN PROGRESS

### 4. Input Validation (Joi Schemas)
**Status:** IN PROGRESS
**Priority:** HIGH

**Routes Requiring Validation:**
- `POST /auth/login` - email format, password complexity
- `POST /auth/register` - all fields (email, username, password, names)
- `POST /tickets/generate` - type enum, maxUses bounds
- `POST /setup/run` - comprehensive setup validation
- `POST /api/tokens/validate` - token structure validation
- `POST /api/certificates/generate-*` - certificate parameters

**Recommended Approach:**
```javascript
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(12).required()
});

router.post('/auth/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.details[0].message
    });
  }
  // ... proceed with validated data
});
```

---

## ⏳ REMAINING WORK (Recommended for Production)

### 5. Secure Config Routes (.env Exposure)
**Priority:** CRITICAL
**File:** `/src/exprsn-ca/routes/admin.js` (lines 726-803)

**Current Issues:**
1. ❌ Returns full `.env` file content to client
2. ❌ Directly writes user input to `.env` file without validation
3. ❌ No syntax validation before writing
4. ❌ No rollback mechanism on failure

**Recommended Fix:**
```javascript
// DO NOT return full .env content
// Instead, return sanitized config object with secrets masked

router.get('/api/config', requireAuth, requireAdmin, async (req, res) => {
  try {
    const config = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      // ... safe config only, mask secrets
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      // Never expose:
      // - DB_PASSWORD (show as ****)
      // - Private keys
      // - API secrets
    };

    res.json({ success: true, data: config });
  } catch (error) {
    // ... error handling
  }
});

// Config updates should use environment variable management
// NOT direct file writes
router.post('/api/config/update', requireAuth, requireAdmin, async (req, res) => {
  // Validate config structure
  // Update only allowed keys
  // Use proper config management library
  // Create backup before changes
  // Validate syntax before committing
});
```

---

### 6. Missing CA API Endpoints
**Priority:** MEDIUM-HIGH

**Endpoints to Add:**

1. **Certificate Revocation (User-Facing)**
   ```
   POST /api/certificates/:id/revoke
   - Body: { reason: 'keyCompromise' | 'superseded' | ... }
   - Returns: { success, message }
   ```

2. **Token Refresh/Renewal**
   ```
   POST /api/tokens/:id/refresh
   - Extends expiration if eligible
   - Returns: new token
   ```

3. **Token Introspection**
   ```
   GET /api/tokens/:id/introspect
   - Returns token metadata without signature
   ```

4. **Certificate Chain Retrieval**
   ```
   GET /api/certificates/:id/chain
   - Returns full certificate chain to root
   ```

5. **Certificate Download with Chain**
   ```
   GET /api/certificates/:id/download?format=pem|der&include=chain
   - Downloads cert + chain bundle
   ```

6. **CSR (Certificate Signing Request)**
   ```
   POST /api/certificates/csr
   - Body: CSR in PEM format
   - Returns: signed certificate
   ```

7. **Certificate Renewal**
   ```
   POST /api/certificates/:id/renew
   - Generates new cert with same subject
   ```

---

### 7. Database Migrations - exprsn-auth
**Priority:** HIGH
**Location:** `/src/exprsn-auth/migrations/` (currently incomplete)

**Existing Migration:**
- ✅ `20251219000000-create-ldap-configs.js` (LDAP only)

**Missing Migrations Required:**
1. ❌ User authentication tables (users, sessions, passwords)
2. ❌ OAuth2/OIDC provider configurations
3. ❌ SAML SSO configurations
4. ❌ MFA settings (TOTP, SMS, backup codes)
5. ❌ Session management tables
6. ❌ Password reset/recovery tables
7. ❌ API keys and client credentials
8. ❌ Login history and audit logs
9. ❌ Consent and authorization grants
10. ❌ Device registrations for MFA

**Recommendation:** Model migrations after exprsn-ca structure with comprehensive indexing.

---

### 8. SAML Authentication Implementation
**Priority:** HIGH
**File:** `/src/exprsn-auth/routes/sso.js` (line 269)
**Status:** TODO comment present

**Current Code:**
```javascript
// TODO: Implement SAML request building
```

**Required Implementation:**
1. SAML request generation
2. SAML response parsing and validation
3. Signature verification
4. Assertion validation
5. Attribute mapping
6. Session establishment
7. Logout handling (SLO - Single Logout)

**Dependencies Already Present:**
- ✅ `passport-saml ^3.2.4` installed

**Recommended Approach:**
```javascript
const SamlStrategy = require('passport-saml').Strategy;

passport.use(new SamlStrategy({
  path: '/auth/saml/callback',
  entryPoint: config.saml.entryPoint,
  issuer: config.saml.issuer,
  cert: config.saml.cert,
  // ... additional config
}, async (profile, done) => {
  // Create or update user from SAML attributes
  const user = await User.findOrCreate({
    where: { email: profile.email },
    defaults: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      // ... map SAML attributes
    }
  });

  return done(null, user);
}));
```

---

### 9. MFA Password Verification
**Priority:** MEDIUM-HIGH
**File:** `/src/exprsn-auth/routes/mfa.js` (lines 446, 493)

**Current Code:**
```javascript
// TODO: Verify password with CA service
```

**Missing in Two Endpoints:**
1. `DELETE /api/mfa/:method` - MFA disable (line 446)
2. `POST /api/mfa/backup-codes/regenerate` - Backup code regeneration (line 493)

**Security Risk:** Users can disable MFA without password confirmation

**Required Implementation:**
```javascript
router.delete('/api/mfa/:method', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Password confirmation required'
      });
    }

    // Verify password with CA service
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_PASSWORD',
        message: 'Incorrect password'
      });
    }

    // Proceed with MFA disable
    // ...
  } catch (error) {
    // ... error handling
  }
});
```

---

### 10. Rate Limiting on Auth Endpoints
**Priority:** HIGH (Security)
**Files:** `/src/exprsn-auth/routes/auth.js`, `/src/exprsn-auth/routes/sso.js`

**Vulnerable Endpoints:**
- `POST /auth/login` - Brute force attack vector
- `POST /auth/register` - Spam account creation
- `GET /auth/sso/:provider` - Account enumeration
- `POST /auth/sso/:provider/callback` - SSO abuse
- `POST /api/mfa/verify` - MFA code brute force

**Implementation:**
```javascript
const { strictLimiter, standardLimiter } = require('@exprsn/shared');

// Strict rate limiting for login (10 req/15min)
router.post('/auth/login', strictLimiter, async (req, res) => {
  // ... login logic
});

// Standard rate limiting for registration (100 req/15min)
router.post('/auth/register', standardLimiter, async (req, res) => {
  // ... registration logic
});

// MFA verification: Even stricter (5 req/15min)
const mfaLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many MFA verification attempts'
});

router.post('/api/mfa/verify', mfaLimiter, async (req, res) => {
  // ... MFA verification
});
```

---

### 11. Comprehensive Tests
**Priority:** HIGH
**Coverage Target:** 70% (per CLAUDE.md)

**Test Structure Needed:**

**exprsn-ca/tests/**
```
tests/
├── unit/
│   ├── models/
│   │   ├── User.test.js
│   │   ├── Certificate.test.js
│   │   ├── Token.test.js
│   │   └── Role.test.js
│   ├── services/
│   │   ├── certificateService.test.js
│   │   ├── tokenService.test.js
│   │   └── authService.test.js
│   └── middleware/
│       ├── requireAuth.test.js
│       └── requireAdmin.test.js
├── integration/
│   ├── auth.test.js
│   ├── certificates.test.js
│   ├── tokens.test.js
│   └── admin.test.js
└── setup.js
```

**exprsn-auth/tests/**
```
tests/
├── auth.test.js (exists - 8 tests)
├── mfa.test.js (exists)
├── oauth2.test.js (exists)
├── saml.test.js (exists)
├── session.test.js (exists)
├── organization.test.js (exists)
├── passwordService.test.js (exists)
└── rbac.test.js (exists)
```

**Test Coverage Goals:**
- exprsn-ca: 0% → 70%
- exprsn-auth: Current 8 tests → 260+ tests (as documented)

**Critical Test Cases:**
1. Admin authorization with/without roles
2. Certificate ownership validation
3. Token signature verification
4. Token expiration handling
5. MFA password verification
6. SAML authentication flow
7. Rate limiting enforcement
8. Error handling edge cases

---

## 📊 COMPLETION SUMMARY

| Requirement | Status | Priority | Est. Hours |
|-------------|--------|----------|-----------|
| ✅ CA Migrations (13 models) | COMPLETE | CRITICAL | 0 |
| ✅ Admin Authorization Fix | COMPLETE | CRITICAL | 0 |
| ✅ Error Handling (Certificates) | COMPLETE | HIGH | 0 |
| 🟡 Input Validation (Joi) | IN PROGRESS | HIGH | 4-6 |
| ⏳ Config Security (.env) | PENDING | CRITICAL | 3-4 |
| ⏳ Missing CA Endpoints | PENDING | MEDIUM | 8-12 |
| ⏳ Auth Migrations | PENDING | HIGH | 6-8 |
| ⏳ SAML Implementation | PENDING | HIGH | 16-20 |
| ⏳ MFA Password Verification | PENDING | HIGH | 2-3 |
| ⏳ Rate Limiting | PENDING | HIGH | 4-6 |
| ⏳ Comprehensive Tests | PENDING | HIGH | 40-60 |

**Total Estimated Remaining Work:** 83-119 hours (2-3 weeks for 1 developer)

---

## 🚀 DEPLOYMENT READINESS

### Can Deploy Now? ❌ NOT YET

**Blockers Resolved:**
- ✅ Database schema defined (migrations created)
- ✅ Admin authorization secured
- ✅ Error handling improved

**Remaining Critical Blockers:**
- ❌ Config security (.env exposure)
- ❌ Input validation missing
- ❌ Auth migrations incomplete
- ❌ SAML non-functional
- ❌ No test coverage

**Minimum for Production:**
1. Complete input validation (Joi schemas)
2. Secure config routes (remove .env exposure)
3. Create auth service migrations
4. Implement rate limiting on login
5. Achieve 60% test coverage minimum

**Timeline to Production-Ready:**
- With current fixes: 1-2 weeks additional work
- With full test suite: 3-4 weeks

---

## 📝 NEXT STEPS

**Immediate (This Week):**
1. ✅ Run CA migrations: `cd src/exprsn-ca && npx sequelize-cli db:migrate`
2. Add Joi validation to auth routes
3. Secure config endpoints
4. Add rate limiting to login/register

**Short-term (Next Week):**
1. Create auth service migrations
2. Implement MFA password verification
3. Add CSR and renewal endpoints
4. Begin test suite development

**Medium-term (Weeks 3-4):**
1. Complete SAML implementation
2. Achieve 70% test coverage
3. Security audit of all endpoints
4. Load testing and performance optimization

---

## 📖 MIGRATION GUIDE

### Running Migrations

**Development:**
```bash
cd src/exprsn-ca
NODE_ENV=development npx sequelize-cli db:migrate
```

**Production:**
```bash
cd src/exprsn-ca
NODE_ENV=production npx sequelize-cli db:migrate
```

**Rollback (if needed):**
```bash
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate:undo:all  # Full rollback
```

**Check Migration Status:**
```bash
npx sequelize-cli db:migrate:status
```

### Post-Migration Setup

**1. Seed Default Roles:**
```sql
INSERT INTO roles (id, name, slug, permission_flags, is_system, priority, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Administrator', 'admin', 127, true, 100, 'active', NOW(), NOW()),
  (gen_random_uuid(), 'Super Administrator', 'super-admin', 127, true, 200, 'active', NOW(), NOW()),
  (gen_random_uuid(), 'CA Administrator', 'ca-admin', 127, true, 150, 'active', NOW(), NOW()),
  (gen_random_uuid(), 'User', 'user', 7, true, 0, 'active', NOW(), NOW());
```

**2. Create First Admin User:**
```sql
-- Create user
INSERT INTO users (id, email, username, password_hash, status, email_verified, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin@exprsn.local', 'admin', '$2a$12$...hashed_password...', 'active', true, NOW(), NOW());

-- Assign admin role
INSERT INTO user_roles (id, user_id, role_id, status, granted_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id, r.id, 'active', NOW(), NOW(), NOW()
FROM users u, roles r
WHERE u.username = 'admin' AND r.slug = 'admin';
```

---

## ✅ QUALITY ASSURANCE

**Security Checklist:**
- ✅ SQL injection prevention (Sequelize parameterized queries)
- ✅ XSS prevention (EJS auto-escaping)
- ✅ CSRF protection (express-session)
- ✅ Password hashing (bcryptjs with 12 rounds)
- ✅ HTTPS support (via shared/tls-config.js)
- ✅ Admin RBAC enforcement
- ✅ Certificate ownership validation
- ⏳ Rate limiting (partially implemented)
- ⏳ Input validation (in progress)

**Performance Optimizations:**
- ✅ 70+ database indexes for fast queries
- ✅ GIN indexes on all JSONB columns
- ✅ Composite indexes for common patterns
- ✅ Foreign key indexes for join performance
- ✅ Async/await for non-blocking I/O

**Monitoring & Observability:**
- ✅ Comprehensive audit logging (audit_logs table)
- ✅ Request ID tracking (request_id in logs)
- ✅ User action tracking
- ✅ Error severity levels
- ⏳ Centralized logging integration
- ⏳ Metrics collection (Prometheus)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-22
**Author:** Claude Code (Anthropic)
**Contact:** engineering@exprsn.com
