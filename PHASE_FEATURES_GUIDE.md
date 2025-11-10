# Phase A-D Features Guide

## What You Should See NOW (No Picks Needed)

### 1. New Pick Creation Form
**Location:** `/creator/dashboard/picks/new`

**Phase A Features:**
- ✅ Structured fields: Sport, League, Bet Type, Selection, Odds (American), Units Risked
- ✅ Game Start Time picker (required)
- ✅ Units ↔ USD auto-sync (based on your unit value)
- ✅ Write-up field for analysis

**Phase B Features:**
- ✅ **"Search Games" button** - Click this after selecting a sport to search for games from the API
- ✅ Game selection modal with date picker
- ✅ Auto-fills game text and start time when game is selected

**To Test:**
1. Go to `/creator/dashboard/picks/new`
2. Select a sport (e.g., "Basketball")
3. Click "Search Games" button
4. Select a game from the modal
5. Fill in bet type, selection, odds, units
6. Set game start time (must be in future)
7. Submit pick

### 2. Settings Page
**Location:** `/creator/dashboard/settings`

**Phase A Features:**
- ✅ Set default unit value (e.g., $100 per unit)
- ✅ View creator stats (once you have picks)

**To Test:**
1. Go to `/creator/dashboard/settings`
2. Set your unit value (e.g., 100)
3. Save

### 3. Pick Edit Page
**Location:** `/creator/dashboard/picks/[id]/edit`

**Phase A Features:**
- ✅ Full edit functionality with all structured fields
- ✅ Locked pick warning (if game has started)
- ✅ Admin can edit locked picks with reason

### 4. Admin Panel
**Location:** `/admin/picks`

**Phase A Features:**
- ✅ View all picks from all creators
- ✅ Filter by status (flagged, pending, locked, graded, disputed)
- ✅ Edit locked picks (with reason requirement)
- ✅ Flag picks for review

---

## What Requires Picks to Be Created

### Phase A Features (Need Picks)

#### Verification Badges
**When you'll see it:**
- After creating a pick with `gameStartTime` in the future
- Pick will show "Verified" badge if posted before game start

**To Test:**
1. Create a pick with game start time 1 hour in the future
2. Go to `/creator/dashboard/picks`
3. You should see a green "Verified" badge

#### Pick Cards with Units
**When you'll see it:**
- After creating picks
- Cards show: Selection, Bet Type, Odds, Units Risked, Amount Risked, Verification Status

**To Test:**
1. Create a few picks
2. Go to `/creator/dashboard/picks`
3. See structured pick cards with all Phase A fields

---

### Phase B Features (Need Picks + Games)

#### Auto-Grading
**When it happens:**
- After picks are created with `gameId`
- After games finish (grading job runs every 10 minutes if enabled)
- Picks automatically get graded as win/loss/push

**To Test:**
1. Create pick with `gameId` (use game search)
2. Wait for game to finish
3. Check pick status - should be "graded" with result

#### Verified Badges (API)
**When you'll see it:**
- Pick posted before game start with `gameId`
- `isVerified: true` and `verificationSource: 'api'`

---

### Phase C Features (Need Picks + Data)

#### Transparency Scores
**When you'll see it:**
- After you have picks
- Background job runs hourly (if `ENABLE_STATS_SCHEDULER=true`)
- Shown on creator profiles

**To Test:**
1. Create several picks
2. Wait for stats computation job to run (or trigger manually)
3. Check creator profile - should show transparency score

#### Leaderboards
**When you'll see it:**
- After verified picks exist
- Visit `/api/leaderboards?type=units` (or create frontend page)

**To Test:**
1. Create verified picks
2. Visit `/api/leaderboards?type=units&timeframe=30d`
3. See ranked creators by units won

#### Fraud Detection
**When it happens:**
- Automatically when picks are created
- Checks for outliers, timing patterns, odds mismatches
- Flags suspicious picks

**To Test:**
1. Create a pick with unusually high units (outlier)
2. Check pick - should be flagged
3. View flags in admin panel

---

### Phase D Features (Need API Keys + Picks)

#### Public API
**When you can use it:**
- After creating API keys
- After picks exist

**To Test:**
1. Create API key: `POST /api/api-keys`
2. Use key to query: `GET /api/public/picks?isVerified=true`
3. Headers: `X-API-Key: your-key-here`

#### Ledger Entries
**When they're created:**
- Automatically when picks are created/edited/graded
- Tamper-proof verification

**To Test:**
1. Create a pick
2. Check ledger: `GET /api/public/ledger/:pickId`
3. See immutable hash chain

---

## Quick Test Checklist

### ✅ Immediate (No Picks Needed)
- [ ] Visit `/creator/dashboard/picks/new` - See new structured form
- [ ] Click "Search Games" button - See game search modal
- [ ] Visit `/creator/dashboard/settings` - Set unit value
- [ ] Visit `/admin/picks` - See admin panel

### ⏳ After Creating Picks
- [ ] Create pick with future game start time - See "Verified" badge
- [ ] Create pick with gameId - See auto-grading after game finishes
- [ ] Create several picks - See transparency score update
- [ ] Visit `/api/leaderboards` - See leaderboard rankings
- [ ] Create outlier pick - See fraud detection flag it

### 🔑 Advanced (Requires Setup)
- [ ] Create API key - Use public API
- [ ] Query ledger - See immutable verification

---

## Environment Variables Needed

For full functionality, set these in your backend:

```env
# Phase B: Grading Scheduler
ENABLE_GRADING_SCHEDULER=true

# Phase A: Stats Computation Scheduler
ENABLE_STATS_SCHEDULER=true

# Phase B: Sports API (if using)
SPORTS_API_PROVIDER=your-provider
SPORTS_API_KEY=your-key
SPORTS_API_BASE_URL=your-api-url
```

---

## Summary

**You're right - most Phase B, C, and D features require picks to be created first!**

The visible changes you should see NOW:
1. ✅ New structured pick creation form
2. ✅ Game search button/modal
3. ✅ Settings page for unit value
4. ✅ Pick edit page

After creating picks, you'll see:
- Verification badges
- Auto-grading results
- Transparency scores
- Leaderboards
- Fraud detection flags

Create a few test picks to see the full system in action! 🚀

