const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const router = express.Router();

// Stripe Connect integration
// This file handles Stripe Connect for creator payouts and payment processing

// @route   POST /api/stripe/connect/onboard
// @desc    Create Stripe Connect account for creator
// @access  Private (creator only)
router.post('/connect/onboard', auth, async (req, res) => {
  try {
    // Check if user is a creator
    if (!req.user.roles || !req.user.roles.includes('creator')) {
      return res.status(403).json({ message: 'Only creators can create Stripe accounts' });
    }

    // In production, you would use Stripe SDK:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const account = await stripe.accounts.create({
    //   type: 'express',
    //   country: req.body.country || 'US',
    //   email: req.user.email,
    //   capabilities: {
    //     card_payments: { requested: true },
    //     transfers: { requested: true },
    //   },
    // });

    // For now, we'll simulate this:
    const mockStripeAccountId = `acct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update user with Stripe account ID
    req.user.stripeAccountId = mockStripeAccountId;
    await req.user.save();

    // In production, return the account link:
    // const accountLink = await stripe.accountLinks.create({
    //   account: account.id,
    //   refresh_url: `${process.env.FRONTEND_URL}/creator/dashboard/payments?refresh=true`,
    //   return_url: `${process.env.FRONTEND_URL}/creator/dashboard/payments?success=true`,
    //   type: 'account_onboarding',
    // });

    res.json({
      accountId: mockStripeAccountId,
      onboardingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/dashboard/payments?onboarding=complete`,
      message: 'Stripe account created. Complete onboarding to receive payouts.'
    });
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stripe/connect/status
// @desc    Get Stripe Connect account status
// @access  Private (creator only)
router.get('/connect/status', auth, async (req, res) => {
  try {
    if (!req.user.roles || !req.user.roles.includes('creator')) {
      return res.status(403).json({ message: 'Only creators can access this' });
    }

    if (!req.user.stripeAccountId) {
      return res.json({
        connected: false,
        message: 'No Stripe account connected'
      });
    }

    // In production, check account status:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const account = await stripe.accounts.retrieve(req.user.stripeAccountId);
    // const chargesEnabled = account.charges_enabled;
    // const payoutsEnabled = account.payouts_enabled;

    res.json({
      connected: true,
      accountId: req.user.stripeAccountId,
      chargesEnabled: true, // In production, use account.charges_enabled
      payoutsEnabled: true, // In production, use account.payouts_enabled
      message: 'Stripe account is active'
    });
  } catch (error) {
    console.error('Stripe Connect status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/stripe/payment/create-intent
// @desc    Create payment intent for subscription or one-off purchase
// @access  Private
router.post('/payment/create-intent', auth, async (req, res) => {
  try {
    const { planId, oneOffPriceCents, pickId } = req.body;

    // In production, use Stripe SDK:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    let amount = 0;
    let creatorId = null;
    let description = '';

    if (planId) {
      // Subscription payment
      const plan = await Plan.findById(planId).populate('creator');
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      const billingVariant = plan.billingVariants[0]; // Use first variant for now
      amount = billingVariant.priceCents;
      creatorId = plan.creator._id;
      description = `Subscription to ${plan.name}`;

      // In production:
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: amount,
      //   currency: 'usd',
      //   application_fee_amount: Math.round(amount * 0.1), // 10% platform fee
      //   transfer_data: {
      //     destination: plan.creator.stripeAccountId,
      //   },
      //   metadata: {
      //     userId: req.user._id.toString(),
      //     planId: planId,
      //     type: 'subscription'
      //   }
      // });
    } else if (oneOffPriceCents && pickId) {
      // One-off pick purchase
      const Pick = require('../models/Pick');
      const pick = await Pick.findById(pickId).populate('creator');
      if (!pick) {
        return res.status(404).json({ message: 'Pick not found' });
      }
      
      amount = oneOffPriceCents;
      creatorId = pick.creator._id;
      description = `Purchase: ${pick.title}`;
    }

    // Mock payment intent for development
    const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      clientSecret: mockPaymentIntentId,
      amount,
      description,
      message: 'Payment intent created. In production, use Stripe Elements to collect payment.'
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/stripe/webhook
// @desc    Handle Stripe webhooks
// @access  Public (Stripe signature verification required)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // In production, verify webhook signature:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // For now, we'll handle mock events
    const event = req.body;

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        const paymentIntent = event.data.object;
        const { userId, planId, pickId, type } = paymentIntent.metadata;

        if (type === 'subscription' && planId) {
          // Create subscription
          const plan = await Plan.findById(planId);
          if (plan) {
            const periodEnd = new Date();
            periodEnd.setDate(periodEnd.getDate() + (plan.freeTrialDays > 0 ? plan.freeTrialDays : 30));

            const subscription = new Subscription({
              subscriber: userId,
              creator: plan.creator,
              plan: planId,
              status: 'active',
              currentPeriodEnd: periodEnd
            });
            await subscription.save();

            // Create transaction record
            const transaction = new Transaction({
              buyer: userId,
              creator: plan.creator,
              type: 'subscription',
              amountCents: paymentIntent.amount,
              feeCents: Math.round(paymentIntent.amount * 0.1), // 10% platform fee
              stripePaymentId: paymentIntent.id
            });
            await transaction.save();
          }
        } else if (type === 'oneoff' && pickId) {
          // Record one-off purchase
          const Pick = require('../models/Pick');
          const pick = await Pick.findById(pickId);
          if (pick) {
            const transaction = new Transaction({
              buyer: userId,
              creator: pick.creator,
              type: 'oneoff',
              amountCents: paymentIntent.amount,
              feeCents: Math.round(paymentIntent.amount * 0.1),
              stripePaymentId: paymentIntent.id,
              pick: pickId
            });
            await transaction.save();
          }
        }
        break;

      case 'payment_intent.payment_failed':
        // Handle failed payment
        console.error('Payment failed:', event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ message: 'Webhook error' });
  }
});

module.exports = router;

