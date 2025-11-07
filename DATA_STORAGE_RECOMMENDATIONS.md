# User Data Storage Recommendations

Based on your current setup, here's the optimal way to store user data for your platform.

## Current Architecture (Already Good!)

Your current MongoDB + Mongoose setup is excellent for this use case. Here's what you have:

### ✅ Current Models:
1. **User** - Authentication & profiles
2. **Storefront** - Creator stores (one per creator)
3. **Plan** - Subscription plans
4. **Subscription** - User subscriptions to plans
5. **Pick** - Individual picks/predictions
6. **Transaction** - Payment records
7. **Post** - Social posts
8. **Review** - User reviews
9. **Message** - Messaging system
10. **AuditLog** - Activity tracking

## Recommended Improvements

### 1. User Model Enhancements

Add these fields to better support your use case:

```javascript
// Additional fields to add to User model:
{
  // Payment & Billing
  paymentMethods: [{
    type: { type: String, enum: ['card', 'bank_account'] },
    stripePaymentMethodId: String,
    last4: String,
    brand: String,
    isDefault: Boolean
  }],
  
  // Subscription Management
  activeSubscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
  subscriptionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
  
  // Purchase History
  purchasedPicks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pick' }],
  
  // Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    preferredSports: [{ type: String }],
    currency: { type: String, default: 'USD' }
  },
  
  // Account Status
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'pending_verification'],
    default: 'active'
  },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Analytics
  totalSpent: { type: Number, default: 0 }, // in cents
  totalEarned: { type: Number, default: 0 }, // for creators, in cents
  subscriptionCount: { type: Number, default: 0 },
  
  // Creator Application
  creatorApplicationStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  creatorApplicationDate: Date,
  creatorApplicationNotes: String
}
```

### 2. Database Indexing Strategy

Add these indexes for better performance:

```javascript
// User model indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'roles': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ accountStatus: 1 });

// Storefront model indexes (already has handle index)
storefrontSchema.index({ owner: 1 });
storefrontSchema.index({ createdAt: -1 });

// Subscription model indexes
subscriptionSchema.index({ subscriber: 1, status: 1 });
subscriptionSchema.index({ creator: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 }); // For expiration checks

// Transaction model indexes
transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ creator: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });

// Plan model indexes
planSchema.index({ creator: 1, archived: 1 });
planSchema.index({ storefront: 1 });

// Pick model indexes
pickSchema.index({ creator: 1, createdAt: -1 });
pickSchema.index({ sport: 1 });
pickSchema.index({ isFree: 1 });
pickSchema.index({ publishedAt: 1 });
```

### 3. Data Relationships Flow

```
User (Base Account)
  ├── Can have ONE Storefront (if creator)
  │     ├── Has MANY Plans
  │     └── Has MANY Picks
  ├── Can have MANY Subscriptions (as subscriber)
  ├── Can have MANY Transactions (as buyer or creator)
  └── Can have MANY Purchased Picks
```

### 4. Recommended Data Storage Pattern

**For Regular Users (Subscribers):**
- Store in User collection with role: ['subscriber']
- Link subscriptions via Subscription model
- Track purchases via Transaction model
- Store purchased picks in User.purchasedPicks array

**For Creators (Cappers):**
- Store in User collection with role: ['creator']
- Create ONE Storefront document linked via User.storefront
- All plans and picks reference the Storefront
- Track earnings via Transaction model

**For Dual Users (Both subscriber and creator):**
- User has roles: ['subscriber', 'creator']
- Has both Storefront AND Subscriptions
- Can both sell and buy

### 5. Security Best Practices

1. **Password Hashing**: ✅ Already using bcrypt
2. **JWT Tokens**: ✅ Already implemented
3. **Add Email Verification**: Recommended
4. **Add Rate Limiting**: For login/registration
5. **Add 2FA**: Optional but recommended for creators
6. **Encrypt Sensitive Data**: Stripe account IDs, payment methods

### 6. Performance Optimizations

1. **Use Population Sparingly**: Only populate when needed
2. **Add Caching**: Redis for frequently accessed data
3. **Pagination**: Always paginate lists (subscriptions, picks, etc.)
4. **Aggregation Pipelines**: For complex queries (analytics, reports)

### 7. Data Migration Strategy

When adding new fields:
1. Make fields optional initially
2. Add default values
3. Run migration script to backfill existing users
4. Make required after migration

### 8. Backup & Recovery

1. **Regular Backups**: Daily MongoDB backups
2. **Point-in-Time Recovery**: Enable oplog
3. **Test Restores**: Regularly test backup restoration

## Implementation Priority

### Phase 1 (Essential - Do Now):
1. Add email verification
2. Add account status tracking
3. Add indexes for performance
4. Add purchasedPicks tracking

### Phase 2 (Important - Soon):
1. Add payment methods storage
2. Add preferences
3. Add creator application system
4. Add analytics fields

### Phase 3 (Nice to Have):
1. Add 2FA
2. Add advanced preferences
3. Add social connections
4. Add activity tracking

## Example User Document Structure

```javascript
{
  _id: ObjectId("..."),
  username: "johndoe",
  email: "john@example.com",
  password: "$2a$10$...", // hashed
  firstName: "John",
  lastName: "Doe",
  roles: ["subscriber", "creator"],
  storefront: ObjectId("..."), // if creator
  stripeAccountId: "acct_...", // if creator
  activeSubscriptions: [ObjectId("..."), ObjectId("...")],
  purchasedPicks: [ObjectId("..."), ObjectId("...")],
  accountStatus: "active",
  emailVerified: true,
  totalSpent: 50000, // $500.00 in cents
  totalEarned: 120000, // $1200.00 in cents (if creator)
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T00:00:00Z")
}
```

## Next Steps

1. Review and add recommended fields to User model
2. Add database indexes
3. Update API routes to handle new fields
4. Add email verification flow
5. Implement creator application system
6. Add analytics tracking

