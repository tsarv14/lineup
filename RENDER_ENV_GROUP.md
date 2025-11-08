# Using Environment Groups on Render

## Yes, Environment Groups Work Great!

Using an environment group is actually a good practice - it lets you share variables across multiple services.

## How to Use Environment Group:

### Option 1: Create Environment Group First

1. In Render dashboard, go to **"Environment Groups"** (left sidebar)
2. Click **"New Environment Group"**
3. Name it: `lineup-backend-vars` (or any name)
4. Add all your variables:
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = Any random string
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
5. Click **"Create Environment Group"**

### Option 2: Add to Your Service

1. Go to your web service
2. Click **"Environment"** tab
3. Click **"Link Environment Group"**
4. Select your environment group
5. Click **"Link"**

## Or Add Variables Directly to Service:

If you want to add variables directly to the service (not using a group):

1. Go to your web service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"** (you should be able to add multiple)
4. Add each variable one by one:
   - Click "Add Environment Variable"
   - Enter Key and Value
   - Click "Save"
   - Repeat for each variable

## Both Methods Work!

- **Environment Group**: Good if you'll have multiple services sharing the same variables
- **Direct to Service**: Good if variables are specific to this one service

Either way works perfectly! Just make sure all 4 variables are set:
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV`
- `PORT`

## After Setting Variables:

1. Make sure your service is deployed
2. Check the logs to see if it connects to MongoDB
3. Update Vercel with your Render URL

