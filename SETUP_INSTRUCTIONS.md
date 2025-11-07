# Lineup Platform Setup Instructions

This document provides instructions for setting up the complete Lineup platform with dynamic creator pages, Stripe Connect integration, and analytics.

## Overview

The platform allows each creator to have their own page at `lineup.com/creator/[handle]` using dynamic routing. All data is stored in MongoDB and payments are processed through Stripe Connect.

## What's Already Implemented

✅ **Dynamic Routing**: `/creator/[handle]` route that queries database for creator data
✅ **Storefront System**: Creators can create and customize their storefronts
✅ **Database Models**: Storefront, Plan, Pick, Subscription, Transaction models
✅ **Creator Dashboard**: Full dashboard for managing picks, plans, and storefront
✅ **Backend API**: RESTful API endpoints for all operations

## What Needs to be Completed

### 1. Install Stripe SDK

```bash
cd server
npm install stripe
```

### 2. Set Up Environment Variables

Add to `server/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000

# Platform Fee Percentage (default: 10%)
PLATFORM_FEE_PERCENTAGE=10
```

### 3. Update Stripe Routes

The `server/routes/stripe.js` file contains mock implementations. You need to:

1. **Uncomment and implement Stripe SDK calls**:
   - Replace mock account IDs with real Stripe Connect account creation
   - Implement real payment intent creation
   - Add webhook signature verification

2. **Example implementation**:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In /connect/onboard route:
const account = await stripe.accounts.create({
  type: 'express',
  country: req.body.country || 'US',
  email: req.user.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});

const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${process.env.FRONTEND_URL}/creator/dashboard/payments?refresh=true`,
  return_url: `${process.env.FRONTEND_URL}/creator/dashboard/payments?success=true`,
  type: 'account_onboarding',
});

res.json({
  accountId: account.id,
  onboardingUrl: accountLink.url
});
```

### 4. Set Up Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` (for Connect accounts)
4. Copy webhook secret to `.env`

### 5. Install Stripe Elements (Frontend)

```bash
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 6. Create Payment Component

Create `client/components/PaymentForm.tsx`:

```typescript
'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PaymentForm({ planId, amount }: { planId: string, amount: number }) {
  // Implementation for collecting payment
  // See Stripe documentation for full implementation
}
```

### 7. Add Analytics Service (Optional)

For production analytics, choose one:

**Option A: Google Analytics**
1. Add Google Analytics script to `client/app/layout.tsx`
2. Update analytics tracking in `client/app/creator/[handle]/page.tsx`

**Option B: Custom Analytics**
1. Create `server/models/AnalyticsEvent.js` model
2. Update `server/routes/analytics.js` to save events to database
3. Create analytics dashboard in creator dashboard

### 8. Fix SEO Metadata

The creator page currently uses `Head` component which doesn't work in Next.js App Router. Update to use Next.js metadata API:

**Option A: Use generateMetadata (Recommended)**
```typescript
export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const storefront = await fetchStorefront(params.handle)
  
  return {
    title: `${storefront.displayName} - Sports Picks | Lineup`,
    description: storefront.description || storefront.aboutText,
    openGraph: {
      title: `${storefront.displayName} - Sports Picks`,
      description: storefront.description,
      images: [storefront.bannerImage || storefront.logoImage],
    },
  }
}
```

**Option B: Use Metadata in layout.tsx**
Create `client/app/creator/[handle]/layout.tsx` with metadata export.

### 9. Creator Onboarding Flow

The onboarding page is created at `/creator/onboarding`. To enable it:

1. Add link in dashboard for new creators
2. Redirect creators without storefronts to onboarding
3. Update `client/app/creator/dashboard/layout.tsx` to check for storefront

### 10. Testing

1. **Test Creator Setup**:
   - Register as creator
   - Complete onboarding at `/creator/onboarding`
   - Verify storefront created at `/creator/[handle]`

2. **Test Payments**:
   - Create a plan in creator dashboard
   - Subscribe to plan as customer
   - Verify Stripe webhook received
   - Check subscription created in database

3. **Test Analytics**:
   - Visit creator page
   - Check analytics endpoint receives events
   - Verify analytics data in creator dashboard

## Production Checklist

- [ ] Set up Stripe Connect accounts
- [ ] Configure webhook endpoints
- [ ] Set up analytics service (Google Analytics, Mixpanel, etc.)
- [ ] Add SSL certificate for webhook endpoint
- [ ] Configure CORS for production domain
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Add rate limiting
- [ ] Set up database backups
- [ ] Configure CDN for images
- [ ] Add caching layer (Redis)
- [ ] Set up email service for notifications
- [ ] Add SMS notifications (Twilio, etc.)
- [ ] Implement content moderation
- [ ] Add automated testing
- [ ] Set up CI/CD pipeline

## Key Features

### Dynamic Creator Pages
- Each creator gets unique URL: `lineup.com/creator/[handle]`
- Pages are generated dynamically from database
- SEO optimized with metadata
- Analytics tracking built-in

### Stripe Connect Integration
- Creators receive payouts directly
- Platform takes configurable fee (default 10%)
- Supports subscriptions and one-off purchases
- Automatic payout scheduling

### Analytics
- Page view tracking
- Conversion tracking
- Creator-specific metrics
- Revenue analytics

## Support

For issues or questions:
1. Check server logs for errors
2. Verify environment variables are set
3. Check Stripe Dashboard for payment status
4. Review MongoDB connection
5. Check API endpoints in browser network tab

## Next Steps

1. Complete Stripe integration (steps 1-6)
2. Set up analytics (step 7)
3. Fix SEO metadata (step 8)
4. Test end-to-end flow (step 10)
5. Deploy to production

