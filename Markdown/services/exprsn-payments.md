# Exprsn Payments (exprsn-payments)

**Version:** 1.0.0
**Port:** 3018
**Status:** ✅ Production-Ready
**Author:** Rick Holland <engineering@exprsn.com>

---

## Overview

**Exprsn Payments** is the payment processing service that handles subscriptions, one-time payments, invoicing, and financial transactions using Stripe integration.

---

## Key Features

### Payment Processing
- **Stripe Integration** - Secure payment processing
- **Credit/Debit Cards** - Card payments
- **ACH Transfers** - Bank transfers
- **Digital Wallets** - Apple Pay, Google Pay
- **International** - Multi-currency support

### Subscriptions
- **Recurring Billing** - Automated billing cycles
- **Multiple Plans** - Free, Basic, Pro, Enterprise
- **Trial Periods** - Free trial support
- **Proration** - Upgrade/downgrade handling
- **Cancellation** - Immediate or end-of-period

### Invoicing
- **Invoice Generation** - PDF invoices
- **Payment Links** - Shareable payment URLs
- **Payment History** - Transaction records
- **Receipts** - Email receipts
- **Tax Calculation** - Automated tax

### Revenue Management
- **Revenue Analytics** - Financial dashboards
- **MRR/ARR Tracking** - Recurring revenue metrics
- **Churn Analysis** - Customer retention
- **Refunds** - Refund processing
- **Disputes** - Dispute management

---

## API Endpoints

#### `POST /api/checkout`
Create checkout session.

**Request:**
```json
{
  "planId": "pro-monthly",
  "successUrl": "https://app.exprsn.io/success",
  "cancelUrl": "https://app.exprsn.io/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_abc123",
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

#### `GET /api/subscriptions`
Get user's subscriptions.

#### `POST /api/subscriptions/:id/cancel`
Cancel subscription.

#### `GET /api/invoices`
Get invoice history.

#### `POST /api/refunds`
Process refund.

---

## Configuration

```env
PORT=3018
DB_NAME=exprsn_payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
WEBHOOK_SECRET=whsec_...
CURRENCY=usd
```

---

## Support

- **Email:** engineering@exprsn.com
- **License:** MIT
