
# Accumulator System Fixes

## Issues Identified:

1. **Button Text Issue (Week 1)**: 
   - Fixed: Changed "Pick Weekly Picks" to "Submit weekly picks" for week 1 only

2. **Accumulator Generation Issues**:
   - Problem: Accumulators weren't being generated reliably when players submitted picks
   - Fix: Added manual "Generate/Update Accumulators" button in admin
   - Fix: Improved useEffect trigger to be more reliable
   - Fix: Added better logging to track when accumulators are generated

3. **Odds Calculation Issues**:
   - Problem: Accumulator calculations weren't finding the correct odds
   - Fix: Improved odds lookup logic with better debugging
   - Fix: Added fallback to default odds (2.0) when specific odds not found
   - Fix: Added logging to show which odds are being used for each team

4. **Data Flow Issues**:
   - Problem: The flow from player picks → admin odds input → accumulator calculation wasn't working smoothly
   - Fix: Added automatic recalculation of potential winnings when odds change
   - Fix: Improved the accumulator update logic to recalculate both potential and actual winnings

## How the System Should Work:

1. **Players submit picks** → Triggers accumulator generation
2. **Admin inputs odds** → Updates accumulator potential winnings
3. **Admin marks team results** → Updates accumulator actual winnings
4. **Leaderboard displays** → Shows both individual and accumulator returns

## Key Changes Made:

- Fixed button text for week 1
- Added manual accumulator generation button
- Improved odds calculation logic
- Enhanced debugging and logging
- Better error handling for missing odds
- Automatic recalculation when odds change

The accumulator system should now work correctly with proper data flow from player picks through to the final leaderboard calculations.
