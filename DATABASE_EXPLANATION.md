# Your Database - How It Works

## ✅ You Already Have a Database!

**MongoDB Atlas** is your database - it's already set up and connected! When someone signs up, their data is automatically saved there.

## How Data is Stored

### 1. User Data (All Users)
When someone registers, their data is saved in the **`users`** collection:
- Email
- Password (encrypted)
- First Name
- Last Name
- Phone Number
- Roles (subscriber, creator, admin)
- Subscriptions
- Purchased Picks
- And more...

### 2. Creator Data (Creators Only)
When a user becomes a creator, additional data is stored:

**Storefront** collection:
- Creator's handle/username
- Display name
- Bio/description
- Logo image
- Banner image
- Sports they cover
- Social media links

**Plans** collection:
- Subscription plans they create
- Pricing (monthly, quarterly, yearly)
- Free trial days
- Plan descriptions

**Picks** collection:
- Sports picks they create
- Pick details (sport, event, prediction)
- Whether it's free or paid
- Event dates

**Subscriptions** collection:
- Who subscribed to which creator
- Subscription status
- Payment information
- Subscription dates

## How to View Your Data

### Option 1: MongoDB Atlas Web Interface

1. Go to https://cloud.mongodb.com
2. Log in to your MongoDB Atlas account
3. Click **"Browse Collections"** (left sidebar)
4. You'll see your database and all collections:
   - `users` - All user accounts
   - `storefronts` - Creator storefronts
   - `plans` - Subscription plans
   - `picks` - Sports picks
   - `subscriptions` - User subscriptions
   - And more...

### Option 2: Check Railway Logs

1. Go to Railway → Your backend service
2. Click **"Logs"** tab
3. Look for: `✅ Connected to MongoDB`
4. When someone registers, you'll see logs of the data being saved

## How It Works Automatically

When someone signs up:
1. Frontend sends data to your backend API
2. Backend validates the data
3. Backend saves it to MongoDB Atlas (your database)
4. Data is stored permanently - it remembers everything!

When someone subscribes:
1. Subscription data is saved to `subscriptions` collection
2. User's account is updated with subscription info
3. Creator's data is updated with new subscriber

## Your Database Models

All the data structures are defined in `server/models/`:
- `User.js` - User accounts
- `Storefront.js` - Creator storefronts
- `Plan.js` - Subscription plans
- `Pick.js` - Sports picks
- `Subscription.js` - User subscriptions
- `Transaction.js` - Payment transactions
- And more...

## The Database is Already Working!

✅ MongoDB Atlas is connected
✅ All models are set up
✅ Data is automatically saved when users register
✅ Data persists (it remembers everything)

You don't need to create anything - it's already working! Just check MongoDB Atlas to see your data.

