# Exprsn Pricing Implementation Guide
## Technical Implementation & Configuration

**Version:** 1.0
**Date:** December 24, 2024

---

## Quick Reference: Pricing at a Glance

### Individual Plans
| Tier | Monthly | Annual | Storage | Key Features |
|------|---------|--------|---------|--------------|
| **Free** | $0 | $0 | 5GB | Core social, messaging, basic features |
| **Pro** | $12 | $120 | 50GB | + CRM (1K), workflows, streaming |
| **Max** | $29 | $290 | 200GB | + Unlimited CRM, payments, geospatial |
| **Premium** | $59 | $590 | 1TB | + Enterprise features, white-label, SSO |

### Organization Plans (Per User/Month)
| Size | Monthly | Annual (20% off) | Features |
|------|---------|-----------------|----------|
| **Small** (5-100) | $8 | $76.80 | All Pro features |
| **Growing** (100-500) | $7 | $67.20 | All Max features |
| **Scale** (500-1000) | $6 | $57.60 | All Premium features |
| **Enterprise** (1000+) | Custom | Custom | Everything + self-hosted |

---

## 1. Database Schema for Billing

### Required Tables (PostgreSQL)

```sql
-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    tier VARCHAR(20) NOT NULL, -- 'free', 'pro', 'max', 'premium'
    price_monthly DECIMAL(10,2),
    price_annual DECIMAL(10,2),
    stripe_price_id_monthly VARCHAR(100),
    stripe_price_id_annual VARCHAR(100),
    features JSONB NOT NULL,
    limits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
    billing_cycle VARCHAR(10) NOT NULL, -- 'monthly', 'annual'
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id VARCHAR(100),
    stripe_customer_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage Tracking
CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    metric_type VARCHAR(50) NOT NULL, -- 'storage', 'api_calls', 'workflows', etc.
    usage_value BIGINT NOT NULL,
    limit_value BIGINT,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization Subscriptions
CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    plan_type VARCHAR(20) NOT NULL, -- 'small', 'growing', 'scale', 'enterprise'
    user_count INTEGER NOT NULL,
    price_per_user DECIMAL(10,2) NOT NULL,
    total_monthly_price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(10) NOT NULL,
    stripe_subscription_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add-ons
CREATE TABLE user_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    addon_type VARCHAR(50) NOT NULL, -- 'storage_50gb', 'api_premium', etc.
    quantity INTEGER DEFAULT 1,
    price_monthly DECIMAL(10,2) NOT NULL,
    stripe_price_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_usage_metrics_user_period ON usage_metrics(user_id, period_start, period_end);
CREATE INDEX idx_organization_subscriptions_org_id ON organization_subscriptions(organization_id);
```

---

## 2. Service Configuration

### Environment Variables (.env)

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# PayPal Configuration
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_WEBHOOK_ID=xxx

# Pricing Tiers
TIER_FREE_STORAGE_GB=5
TIER_PRO_STORAGE_GB=50
TIER_PRO_PRICE_MONTHLY=12
TIER_PRO_PRICE_ANNUAL=120
TIER_MAX_STORAGE_GB=200
TIER_MAX_PRICE_MONTHLY=29
TIER_MAX_PRICE_ANNUAL=290
TIER_PREMIUM_STORAGE_GB=1000
TIER_PREMIUM_PRICE_MONTHLY=59
TIER_PREMIUM_PRICE_ANNUAL=590

# Organization Pricing
ORG_SMALL_PRICE_USER_MONTH=8
ORG_GROWING_PRICE_USER_MONTH=7
ORG_SCALE_PRICE_USER_MONTH=6
ORG_ENTERPRISE_BASE_PRICE=5

# Usage Limits (Free Tier)
FREE_API_CALLS_DAILY=1000
FREE_WORKFLOW_RUNS_MONTHLY=100
FREE_WORKFLOWS_MAX=3
FREE_NEXUS_GROUPS=1
FREE_LOWCODE_APPS=1

# Usage Limits (Pro Tier)
PRO_API_CALLS_DAILY=10000
PRO_WORKFLOW_RUNS_MONTHLY=1000
PRO_WORKFLOWS_MAX=10
PRO_CRM_CONTACTS=1000
PRO_NEXUS_GROUPS=5
PRO_LOWCODE_APPS=5
PRO_STREAM_QUALITY=720
PRO_STREAM_DURATION_HOURS=2

# Usage Limits (Max Tier)
MAX_API_CALLS_DAILY=100000
MAX_WORKFLOW_RUNS_MONTHLY=10000
MAX_WORKFLOWS_MAX=50
MAX_CRM_CONTACTS=-1  # Unlimited
MAX_NEXUS_GROUPS=-1  # Unlimited
MAX_LOWCODE_APPS=20
MAX_STREAM_QUALITY=1080
MAX_STREAM_DURATION_HOURS=-1  # Unlimited
MAX_VAULT_SECRETS=100

# Usage Limits (Premium Tier)
PREMIUM_API_CALLS_DAILY=-1  # Unlimited
PREMIUM_WORKFLOW_RUNS_MONTHLY=-1  # Unlimited
PREMIUM_WORKFLOWS_MAX=-1  # Unlimited
PREMIUM_STREAM_QUALITY=2160  # 4K
PREMIUM_VAULT_SECRETS=-1  # Unlimited
PREMIUM_LOWCODE_APPS=-1  # Unlimited

# Add-on Pricing
ADDON_STORAGE_50GB_MONTHLY=5
ADDON_STORAGE_200GB_MONTHLY=15
ADDON_STORAGE_500GB_MONTHLY=30
ADDON_STORAGE_1TB_MONTHLY=50
ADDON_PAYMENT_PROCESSING_PERCENT=2.5
ADDON_PAYMENT_PROCESSING_FIXED=0.30
ADDON_STREAMING_OVERAGE_PER_GB=0.05
ADDON_SMS_PER_MESSAGE=0.01
ADDON_API_BASIC_MONTHLY=10
ADDON_API_STANDARD_MONTHLY=50
ADDON_API_PREMIUM_MONTHLY=200
```

---

## 3. Middleware for Tier Enforcement

### Feature Access Control

```javascript
// src/shared/middleware/tierEnforcement.js
const { logger } = require('@exprsn/shared');

const TIER_FEATURES = {
  free: {
    storage_gb: 5,
    api_calls_daily: 1000,
    workflows_max: 3,
    workflow_runs_monthly: 100,
    nexus_groups: 1,
    lowcode_apps: 1,
    crm_access: false,
    payments_access: false,
    atlas_access: false,
    vault_access: false,
    streaming_access: false,
    dbadmin_access: false
  },
  pro: {
    storage_gb: 50,
    api_calls_daily: 10000,
    workflows_max: 10,
    workflow_runs_monthly: 1000,
    nexus_groups: 5,
    lowcode_apps: 5,
    crm_access: true,
    crm_contacts: 1000,
    payments_access: false,
    atlas_access: false,
    vault_access: false,
    streaming_access: true,
    streaming_quality: 720,
    streaming_duration_hours: 2,
    dbadmin_access: false
  },
  max: {
    storage_gb: 200,
    api_calls_daily: 100000,
    workflows_max: 50,
    workflow_runs_monthly: 10000,
    nexus_groups: -1, // Unlimited
    lowcode_apps: 20,
    crm_access: true,
    crm_contacts: -1, // Unlimited
    payments_access: true,
    atlas_access: true,
    vault_access: true,
    vault_secrets: 100,
    streaming_access: true,
    streaming_quality: 1080,
    streaming_duration_hours: -1, // Unlimited
    dbadmin_access: false
  },
  premium: {
    storage_gb: 1000,
    api_calls_daily: -1, // Unlimited
    workflows_max: -1,
    workflow_runs_monthly: -1,
    nexus_groups: -1,
    lowcode_apps: -1,
    crm_access: true,
    crm_contacts: -1,
    payments_access: true,
    atlas_access: true,
    vault_access: true,
    vault_secrets: -1,
    streaming_access: true,
    streaming_quality: 2160, // 4K
    streaming_duration_hours: -1,
    dbadmin_access: true,
    white_label: true,
    sso_saml: true
  }
};

/**
 * Middleware to check if user has access to a feature
 */
const requireTierFeature = (feature, minValue = true) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      // Get user's subscription
      const subscription = await getUserSubscription(userId);
      const tier = subscription?.tier || 'free';
      const tierFeatures = TIER_FEATURES[tier];

      // Check if feature exists in tier
      if (!(feature in tierFeatures)) {
        return res.status(403).json({
          success: false,
          error: 'FEATURE_NOT_AVAILABLE',
          message: `Feature '${feature}' is not available`
        });
      }

      const featureValue = tierFeatures[feature];

      // Check boolean features
      if (typeof minValue === 'boolean') {
        if (!featureValue) {
          return res.status(403).json({
            success: false,
            error: 'TIER_UPGRADE_REQUIRED',
            message: `This feature requires ${getMinimumTierForFeature(feature)} tier or higher`,
            upgradeUrl: '/pricing'
          });
        }
      }
      // Check numeric limits
      else if (typeof minValue === 'number') {
        // -1 means unlimited
        if (featureValue !== -1 && featureValue < minValue) {
          return res.status(403).json({
            success: false,
            error: 'TIER_LIMIT_EXCEEDED',
            message: `Your ${tier} tier limit for ${feature} is ${featureValue}`,
            currentLimit: featureValue,
            required: minValue,
            upgradeUrl: '/pricing'
          });
        }
      }

      // Add tier info to request
      req.userTier = tier;
      req.tierFeatures = tierFeatures;
      next();
    } catch (error) {
      logger.error('Tier enforcement error', { error: error.message, feature });
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to verify tier access'
      });
    }
  };
};

/**
 * Middleware to track usage against tier limits
 */
const trackUsage = (metricType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next();

      const tier = req.userTier || 'free';
      const tierFeatures = TIER_FEATURES[tier];

      // Get current usage
      const usage = await getCurrentUsage(userId, metricType);
      const limit = tierFeatures[metricType];

      // Check if limit exceeded (-1 means unlimited)
      if (limit !== -1 && usage >= limit) {
        return res.status(429).json({
          success: false,
          error: 'USAGE_LIMIT_EXCEEDED',
          message: `${metricType} limit exceeded`,
          currentUsage: usage,
          limit: limit,
          tier: tier,
          upgradeUrl: '/pricing'
        });
      }

      // Increment usage
      await incrementUsage(userId, metricType);

      // Add usage info to response headers
      res.set({
        'X-RateLimit-Limit': limit === -1 ? 'unlimited' : limit,
        'X-RateLimit-Remaining': limit === -1 ? 'unlimited' : Math.max(0, limit - usage - 1),
        'X-RateLimit-Reset': getResetTime(metricType)
      });

      next();
    } catch (error) {
      logger.error('Usage tracking error', { error: error.message, metricType });
      next(); // Don't block request on tracking errors
    }
  };
};

// Helper functions
async function getUserSubscription(userId) {
  const { UserSubscription } = require('../models');
  return await UserSubscription.findOne({
    where: {
      user_id: userId,
      status: 'active'
    },
    include: ['plan']
  });
}

async function getCurrentUsage(userId, metricType) {
  const { UsageMetric } = require('../models');
  const period = getUsagePeriod(metricType);

  const usage = await UsageMetric.findOne({
    where: {
      user_id: userId,
      metric_type: metricType,
      period_start: period.start,
      period_end: period.end
    }
  });

  return usage?.usage_value || 0;
}

async function incrementUsage(userId, metricType, amount = 1) {
  const { UsageMetric } = require('../models');
  const period = getUsagePeriod(metricType);

  await UsageMetric.upsert({
    user_id: userId,
    metric_type: metricType,
    usage_value: Sequelize.literal(`usage_value + ${amount}`),
    period_start: period.start,
    period_end: period.end
  });
}

function getUsagePeriod(metricType) {
  const now = new Date();
  let start, end;

  if (metricType.includes('daily')) {
    start = new Date(now.setHours(0, 0, 0, 0));
    end = new Date(now.setHours(23, 59, 59, 999));
  } else if (metricType.includes('monthly')) {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else {
    // Default to daily
    start = new Date(now.setHours(0, 0, 0, 0));
    end = new Date(now.setHours(23, 59, 59, 999));
  }

  return { start, end };
}

function getMinimumTierForFeature(feature) {
  for (const [tier, features] of Object.entries(TIER_FEATURES)) {
    if (features[feature]) {
      return tier;
    }
  }
  return 'premium';
}

function getResetTime(metricType) {
  const period = getUsagePeriod(metricType);
  return period.end.toISOString();
}

module.exports = {
  requireTierFeature,
  trackUsage,
  TIER_FEATURES
};
```

---

## 4. Service-Specific Implementation

### exprsn-forge (CRM) Integration

```javascript
// src/exprsn-forge/middleware/tierLimits.js
const { requireTierFeature, trackUsage } = require('@exprsn/shared/middleware/tierEnforcement');

// Apply to CRM routes
router.use('/api/contacts',
  requireTierFeature('crm_access'),
  trackUsage('crm_contacts')
);

// Check contact limits for Pro tier
router.post('/api/contacts', async (req, res, next) => {
  if (req.userTier === 'pro') {
    const contactCount = await Contact.count({ where: { user_id: req.user.id } });
    if (contactCount >= 1000) {
      return res.status(403).json({
        success: false,
        error: 'CONTACT_LIMIT_EXCEEDED',
        message: 'Pro tier limited to 1,000 contacts. Upgrade to Max for unlimited contacts.',
        upgradeUrl: '/pricing'
      });
    }
  }
  next();
});
```

### exprsn-workflow Integration

```javascript
// src/exprsn-workflow/routes/workflows.js
const { requireTierFeature, trackUsage } = require('@exprsn/shared/middleware/tierEnforcement');

// Check workflow creation limits
router.post('/api/workflows',
  validateCAToken,
  requirePermissions({ write: true }),
  async (req, res, next) => {
    const tier = req.userTier || 'free';
    const limits = TIER_FEATURES[tier];

    const workflowCount = await Workflow.count({
      where: { user_id: req.user.id }
    });

    if (limits.workflows_max !== -1 && workflowCount >= limits.workflows_max) {
      return res.status(403).json({
        success: false,
        error: 'WORKFLOW_LIMIT_EXCEEDED',
        message: `${tier} tier limited to ${limits.workflows_max} workflows`,
        upgradeUrl: '/pricing'
      });
    }
    next();
  }
);

// Track workflow runs
router.post('/api/workflows/:id/run',
  validateCAToken,
  trackUsage('workflow_runs_monthly'),
  async (req, res) => {
    // Run workflow
  }
);
```

### exprsn-payments Integration

```javascript
// src/exprsn-payments/routes/payments.js
const { requireTierFeature } = require('@exprsn/shared/middleware/tierEnforcement');

// Only Max and Premium tiers can process payments
router.use('/api/payments',
  validateCAToken,
  requireTierFeature('payments_access')
);

// Calculate transaction fees based on tier
function calculateTransactionFee(amount, tier) {
  const baseFee = 0.025; // 2.5%
  const fixedFee = 0.30; // $0.30

  // Premium tier gets 0.1% discount
  const percentFee = tier === 'premium' ? 0.024 : baseFee;

  return {
    percentage: percentFee,
    fixed: fixedFee,
    total: (amount * percentFee) + fixedFee
  };
}
```

### exprsn-live (Streaming) Integration

```javascript
// src/exprsn-live/routes/streaming.js
const { requireTierFeature } = require('@exprsn/shared/middleware/tierEnforcement');

router.post('/api/streams/start',
  validateCAToken,
  requireTierFeature('streaming_access'),
  async (req, res) => {
    const tier = req.userTier;
    const limits = TIER_FEATURES[tier];

    // Check quality limits
    if (req.body.quality > limits.streaming_quality) {
      return res.status(403).json({
        success: false,
        error: 'QUALITY_LIMIT_EXCEEDED',
        message: `${tier} tier limited to ${limits.streaming_quality}p streaming`,
        maxQuality: limits.streaming_quality,
        requestedQuality: req.body.quality
      });
    }

    // Check duration limits for Pro tier
    if (tier === 'pro' && req.body.duration > limits.streaming_duration_hours * 3600) {
      return res.status(403).json({
        success: false,
        error: 'DURATION_LIMIT_EXCEEDED',
        message: `Pro tier limited to ${limits.streaming_duration_hours} hours per stream`,
        maxDuration: limits.streaming_duration_hours * 3600
      });
    }

    // Start stream
  }
);
```

---

## 5. Stripe Integration

### Product and Price Creation

```javascript
// scripts/setup-stripe-products.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  // Create products
  const products = {
    pro: await stripe.products.create({
      name: 'Exprsn Pro',
      description: 'Professional features for freelancers and creators',
      metadata: { tier: 'pro' }
    }),
    max: await stripe.products.create({
      name: 'Exprsn Max',
      description: 'Maximum power for growing businesses',
      metadata: { tier: 'max' }
    }),
    premium: await stripe.products.create({
      name: 'Exprsn Premium',
      description: 'Enterprise-grade features for professionals',
      metadata: { tier: 'premium' }
    })
  };

  // Create prices
  const prices = {
    pro_monthly: await stripe.prices.create({
      product: products.pro.id,
      unit_amount: 1200, // $12.00 in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'pro', billing: 'monthly' }
    }),
    pro_annual: await stripe.prices.create({
      product: products.pro.id,
      unit_amount: 12000, // $120.00 in cents
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'pro', billing: 'annual' }
    }),
    max_monthly: await stripe.prices.create({
      product: products.max.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'max', billing: 'monthly' }
    }),
    max_annual: await stripe.prices.create({
      product: products.max.id,
      unit_amount: 29000, // $290.00
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'max', billing: 'annual' }
    }),
    premium_monthly: await stripe.prices.create({
      product: products.premium.id,
      unit_amount: 5900, // $59.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'premium', billing: 'monthly' }
    }),
    premium_annual: await stripe.prices.create({
      product: products.premium.id,
      unit_amount: 59000, // $590.00
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'premium', billing: 'annual' }
    })
  };

  // Save price IDs to database or environment
  console.log('Stripe products created:', prices);
  return prices;
}

// Run setup
createStripeProducts().catch(console.error);
```

### Subscription Management

```javascript
// src/exprsn-payments/services/subscriptionService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class SubscriptionService {
  async createSubscription(userId, tier, billingCycle) {
    try {
      // Get or create Stripe customer
      const customer = await this.getOrCreateCustomer(userId);

      // Get price ID for tier and billing cycle
      const priceId = this.getPriceId(tier, billingCycle);

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
          tier: tier,
          billing_cycle: billingCycle
        }
      });

      // Save to database
      await UserSubscription.create({
        user_id: userId,
        plan_id: await this.getPlanId(tier),
        status: 'trialing',
        billing_cycle: billingCycle,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };
    } catch (error) {
      logger.error('Failed to create subscription', { error, userId, tier });
      throw error;
    }
  }

  async upgradeSubscription(userId, newTier) {
    const subscription = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    const newPriceId = this.getPriceId(newTier, subscription.billing_cycle);

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId
      }],
      proration_behavior: 'create_prorations'
    });

    // Update database
    subscription.plan_id = await this.getPlanId(newTier);
    await subscription.save();

    return subscription;
  }

  async cancelSubscription(userId, immediately = false) {
    const subscription = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (immediately) {
      await stripe.subscriptions.del(subscription.stripe_subscription_id);
      subscription.status = 'canceled';
    } else {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true
      });
      subscription.cancel_at_period_end = true;
    }

    await subscription.save();
    return subscription;
  }

  getPriceId(tier, billingCycle) {
    const priceMap = {
      'pro_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
      'pro_annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
      'max_monthly': process.env.STRIPE_PRICE_MAX_MONTHLY,
      'max_annual': process.env.STRIPE_PRICE_MAX_ANNUAL,
      'premium_monthly': process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      'premium_annual': process.env.STRIPE_PRICE_PREMIUM_ANNUAL
    };

    return priceMap[`${tier}_${billingCycle}`];
  }
}

module.exports = new SubscriptionService();
```

---

## 6. Frontend Implementation

### Pricing Page Component

```html
<!-- src/exprsn-svr/views/pricing.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Exprsn Pricing - Choose Your Plan</title>
  <link href="/css/bootstrap.min.css" rel="stylesheet">
  <style>
    .pricing-card {
      border: 2px solid transparent;
      transition: all 0.3s;
    }
    .pricing-card:hover {
      border-color: var(--bs-primary);
      transform: translateY(-5px);
    }
    .pricing-card.recommended {
      border-color: var(--bs-success);
      position: relative;
    }
    .pricing-badge {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bs-success);
      color: white;
      padding: 5px 20px;
      border-radius: 20px;
      font-size: 0.875rem;
    }
    .feature-list {
      list-style: none;
      padding: 0;
    }
    .feature-list li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    .feature-list li:before {
      content: "✓ ";
      color: var(--bs-success);
      font-weight: bold;
      margin-right: 8px;
    }
    .billing-toggle {
      display: inline-flex;
      background: var(--bs-light);
      border-radius: 30px;
      padding: 4px;
    }
    .billing-toggle button {
      border: none;
      background: transparent;
      padding: 8px 20px;
      border-radius: 25px;
      transition: all 0.3s;
    }
    .billing-toggle button.active {
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="container py-5">
    <div class="text-center mb-5">
      <h1 class="display-4 fw-bold">Simple, Transparent Pricing</h1>
      <p class="lead text-muted">
        Start free, upgrade when you're ready. No hidden fees.
      </p>

      <!-- Billing Toggle -->
      <div class="billing-toggle mt-4">
        <button class="active" onclick="toggleBilling('monthly')">Monthly</button>
        <button onclick="toggleBilling('annual')">Annual (Save 17%)</button>
      </div>
    </div>

    <!-- Pricing Cards -->
    <div class="row g-4 mb-5">
      <!-- Free Tier -->
      <div class="col-md-6 col-lg-3">
        <div class="card pricing-card h-100">
          <div class="card-body">
            <h3 class="card-title">Free</h3>
            <p class="text-muted">Perfect for getting started</p>
            <div class="my-4">
              <h2 class="display-4 fw-bold mb-0">$0</h2>
              <small class="text-muted">forever</small>
            </div>
            <ul class="feature-list">
              <li>5GB Storage</li>
              <li>Core social features</li>
              <li>E2EE messaging</li>
              <li>3 workflows (100 runs/mo)</li>
              <li>1 group/calendar</li>
              <li>1,000 API calls/day</li>
              <li>Community support</li>
            </ul>
            <button class="btn btn-outline-primary w-100 mt-3">
              Get Started
            </button>
          </div>
        </div>
      </div>

      <!-- Pro Tier -->
      <div class="col-md-6 col-lg-3">
        <div class="card pricing-card h-100">
          <div class="card-body">
            <h3 class="card-title">Pro</h3>
            <p class="text-muted">For professionals</p>
            <div class="my-4">
              <h2 class="display-4 fw-bold mb-0">
                <span class="price-monthly">$12</span>
                <span class="price-annual" style="display:none">$10</span>
              </h2>
              <small class="text-muted">
                <span class="period-monthly">per month</span>
                <span class="period-annual" style="display:none">per month (billed annually)</span>
              </small>
            </div>
            <ul class="feature-list">
              <li>50GB Storage</li>
              <li>CRM (1,000 contacts)</li>
              <li>10 workflows (1K runs/mo)</li>
              <li>Live streaming (720p)</li>
              <li>5 groups/calendars</li>
              <li>10,000 API calls/day</li>
              <li>Email support</li>
              <li>Custom subdomain</li>
            </ul>
            <button class="btn btn-primary w-100 mt-3">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>

      <!-- Max Tier (Recommended) -->
      <div class="col-md-6 col-lg-3">
        <div class="card pricing-card recommended h-100">
          <span class="pricing-badge">MOST POPULAR</span>
          <div class="card-body">
            <h3 class="card-title">Max</h3>
            <p class="text-muted">For growing businesses</p>
            <div class="my-4">
              <h2 class="display-4 fw-bold mb-0">
                <span class="price-monthly">$29</span>
                <span class="price-annual" style="display:none">$24</span>
              </h2>
              <small class="text-muted">
                <span class="period-monthly">per month</span>
                <span class="period-annual" style="display:none">per month (billed annually)</span>
              </small>
            </div>
            <ul class="feature-list">
              <li>200GB Storage</li>
              <li>Unlimited CRM contacts</li>
              <li>50 workflows (10K runs/mo)</li>
              <li>Live streaming (1080p, ∞)</li>
              <li>Unlimited groups</li>
              <li>Payment processing</li>
              <li>Geospatial features</li>
              <li>100,000 API calls/day</li>
              <li>Priority support</li>
            </ul>
            <button class="btn btn-success w-100 mt-3">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>

      <!-- Premium Tier -->
      <div class="col-md-6 col-lg-3">
        <div class="card pricing-card h-100">
          <div class="card-body">
            <h3 class="card-title">Premium</h3>
            <p class="text-muted">Enterprise features</p>
            <div class="my-4">
              <h2 class="display-4 fw-bold mb-0">
                <span class="price-monthly">$59</span>
                <span class="price-annual" style="display:none">$49</span>
              </h2>
              <small class="text-muted">
                <span class="period-monthly">per month</span>
                <span class="period-annual" style="display:none">per month (billed annually)</span>
              </small>
            </div>
            <ul class="feature-list">
              <li>1TB Storage</li>
              <li>Everything unlimited</li>
              <li>4K streaming</li>
              <li>White-label options</li>
              <li>SSO/SAML</li>
              <li>Database admin</li>
              <li>Custom integrations</li>
              <li>Unlimited API calls</li>
              <li>Premium support + SLA</li>
            </ul>
            <button class="btn btn-primary w-100 mt-3">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Organization Plans -->
    <div class="text-center my-5">
      <h2 class="display-5 fw-bold">Organization Plans</h2>
      <p class="lead text-muted">Volume pricing for teams and enterprises</p>
    </div>

    <div class="row g-4">
      <div class="col-md-3">
        <div class="card h-100">
          <div class="card-body text-center">
            <h4>Small Teams</h4>
            <p class="text-muted">5-100 users</p>
            <h3>$8<small>/user/mo</small></h3>
            <p>All Pro features</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card h-100">
          <div class="card-body text-center">
            <h4>Growing Business</h4>
            <p class="text-muted">100-500 users</p>
            <h3>$7<small>/user/mo</small></h3>
            <p>All Max features</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card h-100">
          <div class="card-body text-center">
            <h4>Scale</h4>
            <p class="text-muted">500-1000 users</p>
            <h3>$6<small>/user/mo</small></h3>
            <p>All Premium features</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card h-100">
          <div class="card-body text-center">
            <h4>Enterprise</h4>
            <p class="text-muted">1000+ users</p>
            <h3>Custom</h3>
            <p>Self-hosted option</p>
            <a href="/contact-sales" class="btn btn-outline-primary">Contact Sales</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function toggleBilling(type) {
      // Toggle button states
      document.querySelectorAll('.billing-toggle button').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');

      // Toggle price displays
      document.querySelectorAll('.price-monthly, .period-monthly').forEach(el => {
        el.style.display = type === 'monthly' ? 'inline' : 'none';
      });
      document.querySelectorAll('.price-annual, .period-annual').forEach(el => {
        el.style.display = type === 'annual' ? 'inline' : 'none';
      });
    }
  </script>
</body>
</html>
```

---

## 7. Monitoring & Analytics

### Usage Dashboard Queries

```sql
-- Daily usage metrics by tier
SELECT
  DATE(created_at) as date,
  s.tier,
  COUNT(DISTINCT u.user_id) as active_users,
  SUM(u.usage_value) as total_usage,
  AVG(u.usage_value) as avg_usage
FROM usage_metrics u
JOIN user_subscriptions s ON u.user_id = s.user_id
WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), s.tier
ORDER BY date DESC, tier;

-- Conversion funnel
SELECT
  COUNT(*) FILTER (WHERE tier = 'free') as free_users,
  COUNT(*) FILTER (WHERE tier = 'pro') as pro_users,
  COUNT(*) FILTER (WHERE tier = 'max') as max_users,
  COUNT(*) FILTER (WHERE tier = 'premium') as premium_users,
  ROUND(100.0 * COUNT(*) FILTER (WHERE tier != 'free') / COUNT(*), 2) as conversion_rate
FROM user_subscriptions
WHERE status = 'active';

-- Revenue by tier
SELECT
  tier,
  COUNT(*) as subscribers,
  SUM(CASE
    WHEN billing_cycle = 'monthly' THEN price_monthly
    ELSE price_annual / 12
  END) as monthly_revenue
FROM user_subscriptions s
JOIN subscription_plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY tier;

-- Feature usage by tier
SELECT
  s.tier,
  u.metric_type,
  COUNT(DISTINCT u.user_id) as users_using_feature,
  AVG(u.usage_value) as avg_usage,
  MAX(u.usage_value) as max_usage
FROM usage_metrics u
JOIN user_subscriptions s ON u.user_id = s.user_id
WHERE u.period_start >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.tier, u.metric_type
ORDER BY s.tier, users_using_feature DESC;
```

---

## 8. Testing Checklist

### Pre-Launch Testing

- [ ] **Stripe Integration**
  - [ ] Product and price creation successful
  - [ ] Subscription creation flow works
  - [ ] Payment processing completes
  - [ ] Webhooks properly configured
  - [ ] Refund process tested

- [ ] **Tier Enforcement**
  - [ ] Free tier limits enforced correctly
  - [ ] Feature access controlled by tier
  - [ ] Usage tracking accurate
  - [ ] Upgrade prompts shown appropriately
  - [ ] API rate limits applied

- [ ] **User Flows**
  - [ ] Sign up for free account
  - [ ] Upgrade from free to paid
  - [ ] Downgrade from paid to lower tier
  - [ ] Cancel subscription
  - [ ] Reactivate canceled subscription
  - [ ] Add/remove add-ons

- [ ] **Organization Plans**
  - [ ] Team creation and invitation
  - [ ] User seat management
  - [ ] Consolidated billing
  - [ ] Admin controls working

- [ ] **Usage Tracking**
  - [ ] Storage usage calculated correctly
  - [ ] API calls counted accurately
  - [ ] Workflow runs tracked
  - [ ] Overage charges applied

- [ ] **Edge Cases**
  - [ ] Payment failure handling
  - [ ] Trial expiration
  - [ ] Grace period for past due
  - [ ] Proration on upgrades
  - [ ] Multiple subscription prevention

---

## 9. Launch Checklist

### Week Before Launch
- [ ] Finalize Stripe products and prices
- [ ] Test all payment flows
- [ ] Prepare customer support docs
- [ ] Set up monitoring dashboards
- [ ] Train support team

### Launch Day
- [ ] Enable billing system
- [ ] Announce pricing on all channels
- [ ] Monitor for issues
- [ ] Track initial conversions
- [ ] Gather user feedback

### Post-Launch (Week 1)
- [ ] Analyze conversion metrics
- [ ] Address user concerns
- [ ] Fix any bugs found
- [ ] Optimize based on data
- [ ] Plan A/B tests

---

## Support Resources

### Common Questions & Answers

**Q: Can I change plans anytime?**
A: Yes, upgrades take effect immediately with proration. Downgrades apply at the next billing cycle.

**Q: Is there a free trial?**
A: Yes, all paid plans include a 14-day free trial. No credit card required to start.

**Q: What happens if I exceed my limits?**
A: You'll receive notifications and prompts to upgrade. Critical features continue working with rate limiting.

**Q: Can I self-host Exprsn?**
A: Yes, with an Enterprise plan. Contact sales for deployment options.

**Q: Do you offer nonprofit discounts?**
A: Yes, verified nonprofits receive 50% off all paid plans.

### Contact Information
- **Sales**: sales@exprsn.io
- **Support**: support@exprsn.io
- **Billing**: billing@exprsn.io

---

*This implementation guide provides the technical foundation for rolling out Exprsn's pricing strategy. Follow the steps sequentially and test thoroughly before launch.*