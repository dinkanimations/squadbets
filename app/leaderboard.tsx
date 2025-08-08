
import Button from '../components/Button';
import { Text, View, ScrollView, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { colors } from '../styles/commonStyles';
import { commonStyles, buttonStyles } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { RoleGuard } from '../components/RoleGuard';

interface PlayerPick {
  playerName: string;
  team1: string;
  team2: string;
  week: number;
  submittedAt?: string;
  isLate?: boolean;
}

interface GameOdds {
  team1: string;
  team2: string;
  team1Odds: number;
  team2Odds: number;
  team1OddsFraction?: string;
  team2OddsFraction?: string;
  week: number;
}

interface GameResult {
  team1: string;
  team2: string;
  winner: string;
  week: number;
}

interface TeamResult {
  teamName: string;
  hasWon: boolean;
  week: number;
}

interface PlayerPickOdds {
  playerName: string;
  teamName: string;
  odds: number;
  oddsFraction: string;
  week: number;
}

interface AccumulatorBet {
  week: number;
  type: 'max-acca' | '1st-pick-acca';
  stake: number;
  teams: string[];
  potentialWinnings: number;
  isWon: boolean | null;
  actualWinnings: number;
}

interface KickerBetResult {
  week: number;
  actualHomeScore: number;
  actualAwayScore: number;
  winners: string[];
}

interface KickerBetOdds {
  playerName: string;
  odds: number;
  oddsFraction: string;
  week: number;
}

interface WeeklyPlayerStats {
  playerName: string;
  weeklyEarnings: number;
  weeklyWins: number;
  weeklyPicks: number;
  weeklyWinPercentage: number;
  team1: string;
  team2: string;
  team1Won: boolean | null;
  team2Won: boolean | null;
  team1Odds: string;
  team2Odds: string;
  kickerBetWon: boolean;
  kickerBetEarnings: number;
}

interface PotStats {
  totalPot: number;
  totalStaked: number;
  netProfit: number;
  playerWinnings: number;
  accumulatorWinnings: number;
  weeklyBreakdown: { week: number; potContribution: number; totalStaked: number }[];
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerWithLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  scrollableLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Move title slightly to the left to center the 'l' of 'Weekly'
    marginLeft: -25,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d0d0d0',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  // Updated dropdown styling - reduced height by 25% and increased font size
  weekSelectorContainer: {
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  weekSelectorWrapper: {
    width: '100%',
    borderRadius: 16,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.15)',
    elevation: 4,
  },
  weekSelectorButton: {
    borderRadius: 16,
    paddingVertical: 9, // Reduced from 12 to 9 (25% reduction)
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 32, // Reduced from 42 to 32 (25% reduction)
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  weekSelectorText: {
    color: '#d0d0d0',
    fontSize: 20, // Increased from 18 to 20
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    color: '#d0d0d0',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: 20, // Increased from 18 to 20
    textAlign: 'center',
  },
  // Centered table container
  tableContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)',
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center', // Center the table
    alignSelf: 'center', // Center the container itself
    width: '100%',
  },
  tableScrollView: {
    width: '100%',
  },
  tableContent: {
    minWidth: width - 80,
    alignItems: 'center',
    justifyContent: 'center', // Center table content
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Adjusted column widths for better fit - Position column changed to 'Pos.'
  positionColumn: {
    width: 60, // Reduced from 80 to make more compact
    alignItems: 'center',
  },
  playerColumn: {
    flex: 1,
    paddingLeft: 4, // Reduced padding to move player title closer to names
    minWidth: 100,
  },
  returnsColumn: { // Changed from earningsColumn to returnsColumn
    width: 100,
    alignItems: 'center',
  },
  headerText: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cellText: {
    color: '#d0d0d0',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
  playerName: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: '600',
  },
  totalText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  picksContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  // Reduced size section title inside the card
  sectionTitle: {
    color: colors.primary,
    fontSize: 14, // Reduced from 18
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickItem: {
    backgroundColor: colors.surface,
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickPlayerName: {
    color: '#d0d0d0',
    fontSize: 15,
    fontWeight: '600',
  },
  latePickPlayerName: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '600',
  },
  betValueAndOutcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  betValue: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  betOutcome: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  betOutcomeWin: {
    backgroundColor: colors.success + '20',
    color: colors.success,
  },
  betOutcomeLoss: {
    backgroundColor: colors.error + '20',
    color: colors.error,
  },
  pickTeams: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  latePickTeams: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  pickResult: {
    fontSize: 13,
    fontWeight: '600',
  },
  winText: {
    color: colors.success,
  },
  lossText: {
    color: colors.error,
  },
  pendingText: {
    color: colors.textMuted,
  },
  kickerBetSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  kickerBetTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kickerBetText: {
    color: '#d0d0d0',
    fontSize: 12,
    lineHeight: 16,
  },
  kickerBetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kickerBetLeft: {
    flex: 1,
  },
  kickerBetRight: {
    alignItems: 'flex-end',
  },
  accumulatorSection: {
    marginTop: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accumulatorTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  accumulatorBetCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accumulatorBetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accumulatorBetType: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: '600',
  },
  accumulatorOutcome: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  accumulatorOutcomeWon: {
    backgroundColor: colors.success + '20',
    color: colors.success,
  },
  accumulatorOutcomeLoss: {
    backgroundColor: colors.error + '20',
    color: colors.error,
  },
  accumulatorOutcomePending: {
    backgroundColor: colors.textMuted + '20',
    color: colors.textMuted,
  },
  accumulatorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  accumulatorDetailText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  accumulatorReturns: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  accumulatorReturnsWon: {
    color: colors.success,
  },
  accumulatorReturnsLoss: {
    color: colors.error,
  },
  accumulatorReturnsPending: {
    color: colors.textMuted,
  },
  totalWeeklyReturnsContainer: { // Changed from totalWeeklyWinningsContainer
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.25)',
    elevation: 6,
  },
  totalWeeklyReturnsTitle: { // Changed from totalWeeklyWinningsTitle
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalWeeklyReturnsText: { // Changed from totalWeeklyWinningsText
    color: '#d0d0d0',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  // Back button now scrolls with content - removed fixed positioning
  backButtonContainer: {
    marginTop: 32,
    marginBottom: 20,
    width: '100%',
  },
  backButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.15)',
    elevation: 4,
  },
  backButton: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  backButtonText: {
    color: '#d0d0d0',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: Dimensions.get('window').height - 200,
  },
  noDataText: {
    color: '#d0d0d0',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default function LeaderboardScreen() {
  const [playerPicks, setPlayerPicks] = useState<PlayerPick[]>([]);
  const [gameOdds, setGameOdds] = useState<GameOdds[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [playerPickOdds, setPlayerPickOdds] = useState<PlayerPickOdds[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [leaderboard, setLeaderboard] = useState<WeeklyPlayerStats[]>([]);
  const [kickerBetResults, setKickerBetResults] = useState<KickerBetResult[]>([]);
  const [kickerBetOdds, setKickerBetOdds] = useState<KickerBetOdds[]>([]);
  const [accumulatorBets, setAccumulatorBets] = useState<AccumulatorBet[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);

  console.log('LeaderboardScreen rendered');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Set the most recent completed week as default
    const mostRecentWeek = currentWeek - 1;
    if (mostRecentWeek >= 1) {
      setSelectedWeek(mostRecentWeek);
    }
    
    // Generate available weeks (all completed weeks)
    const weeks = [];
    for (let i = 1; i < currentWeek; i++) {
      weeks.push(i);
    }
    setAvailableWeeks(weeks);
    console.log('Available weeks:', weeks, 'Current week:', currentWeek);
  }, [currentWeek]);

  useEffect(() => {
    calculateLeaderboard();
  }, [playerPicks, gameOdds, gameResults, teamResults, playerPickOdds, kickerBetResults, kickerBetOdds, accumulatorBets, selectedWeek]);

  const loadData = async () => {
    try {
      const [
        storedPicks, storedOdds, storedResults, storedTeamResults, 
        storedPlayerPickOdds, storedWeek, storedKickerBetResults, 
        storedKickerBetOdds, storedAccumulatorBets
      ] = await Promise.all([
        AsyncStorage.getItem('playerPicks'),
        AsyncStorage.getItem('gameOdds'),
        AsyncStorage.getItem('gameResults'),
        AsyncStorage.getItem('teamResults'),
        AsyncStorage.getItem('playerPickOdds'),
        AsyncStorage.getItem('currentWeek'),
        AsyncStorage.getItem('kickerBetResults'),
        AsyncStorage.getItem('kickerBetOdds'),
        AsyncStorage.getItem('accumulatorBets'),
      ]);

      if (storedPicks) setPlayerPicks(JSON.parse(storedPicks));
      if (storedOdds) setGameOdds(JSON.parse(storedOdds));
      if (storedResults) setGameResults(JSON.parse(storedResults));
      if (storedTeamResults) setTeamResults(JSON.parse(storedTeamResults));
      if (storedPlayerPickOdds) setPlayerPickOdds(JSON.parse(storedPlayerPickOdds));
      if (storedWeek) setCurrentWeek(parseInt(storedWeek));
      if (storedKickerBetResults) setKickerBetResults(JSON.parse(storedKickerBetResults));
      if (storedKickerBetOdds) setKickerBetOdds(JSON.parse(storedKickerBetOdds));
      if (storedAccumulatorBets) {
        const bets = JSON.parse(storedAccumulatorBets);
        // Migrate old accumulator types to new names
        const migratedBets = bets.map((bet: AccumulatorBet) => ({
          ...bet,
          type: bet.type === 'all-picks' || bet.type === '12-team' ? 'max-acca' : 
                bet.type === '6-team' ? '1st-pick-acca' : bet.type
        }));
        setAccumulatorBets(migratedBets);
      }

      console.log('Leaderboard data loaded');
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    }
  };

  const calculateLeaderboard = () => {
    console.log('Calculating leaderboard for week:', selectedWeek);
    
    if (selectedWeek < 1) {
      console.log('No week data available');
      setLeaderboard([]);
      return;
    }

    const weekPicks = playerPicks.filter(pick => pick.week === selectedWeek);
    const allPlayers = Array.from(new Set(weekPicks.map(pick => pick.playerName)));

    const weeklyStats: WeeklyPlayerStats[] = allPlayers.map(playerName => {
      const pick = weekPicks.find(p => p.playerName === playerName);
      
      if (!pick) {
        return {
          playerName,
          weeklyEarnings: 0,
          weeklyWins: 0,
          weeklyPicks: 0,
          weeklyWinPercentage: 0,
          team1: '',
          team2: '',
          team1Won: null,
          team2Won: null,
          team1Odds: '',
          team2Odds: '',
          kickerBetWon: false,
          kickerBetEarnings: 0,
        };
      }

      // Get team results
      const team1Result = teamResults.find(r => r.teamName === pick.team1 && r.week === selectedWeek);
      const team2Result = teamResults.find(r => r.teamName === pick.team2 && r.week === selectedWeek);

      const team1Won = team1Result?.hasWon === true;
      const team2Won = team2Result?.hasWon === true;

      // Calculate regular bet earnings
      let weeklyEarnings = 0;
      let weeklyWins = 0;

      if (team1Won && team2Won) {
        // Double win - calculate earnings using individual odds
        const team1Odds = playerPickOdds.find(o => 
          o.playerName === playerName && 
          o.teamName === pick.team1 && 
          o.week === selectedWeek
        );
        const team2Odds = playerPickOdds.find(o => 
          o.playerName === playerName && 
          o.teamName === pick.team2 && 
          o.week === selectedWeek
        );

        if (team1Odds && team2Odds) {
          weeklyEarnings = 5 * team1Odds.odds * team2Odds.odds;
          weeklyWins = 1;
        }
      }

      // Check Kicker Bet winnings
      let kickerBetWon = false;
      let kickerBetEarnings = 0;
      
      const kbResult = kickerBetResults.find(r => r.week === selectedWeek);
      if (kbResult && kbResult.winners.includes(playerName)) {
        kickerBetWon = true;
        const kbOdds = kickerBetOdds.find(o => 
          o.playerName === playerName && o.week === selectedWeek
        );
        if (kbOdds) {
          kickerBetEarnings = 1 * kbOdds.odds; // £1 stake
          weeklyEarnings += kickerBetEarnings;
        }
      }

      // Get odds display
      const team1OddsDisplay = playerPickOdds.find(o => 
        o.playerName === playerName && 
        o.teamName === pick.team1 && 
        o.week === selectedWeek
      )?.oddsFraction || '';

      const team2OddsDisplay = playerPickOdds.find(o => 
        o.playerName === playerName && 
        o.teamName === pick.team2 && 
        o.week === selectedWeek
      )?.oddsFraction || '';

      const weeklyPicks = 2; // Always 2 teams per week
      const weeklyWinPercentage = weeklyPicks > 0 ? (weeklyWins / weeklyPicks) * 100 : 0;

      return {
        playerName,
        weeklyEarnings,
        weeklyWins,
        weeklyPicks,
        weeklyWinPercentage,
        team1: pick.team1,
        team2: pick.team2,
        team1Won: team1Result?.hasWon ?? null,
        team2Won: team2Result?.hasWon ?? null,
        team1Odds: team1OddsDisplay,
        team2Odds: team2OddsDisplay,
        kickerBetWon,
        kickerBetEarnings,
      };
    });

    // Sort by weekly earnings (descending)
    weeklyStats.sort((a, b) => b.weeklyEarnings - a.weeklyEarnings);

    setLeaderboard(weeklyStats);
    console.log('Weekly leaderboard calculated for week', selectedWeek);
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.positionColumn}>
        <Text style={styles.headerText}>Pos.</Text>
      </View>
      <View style={styles.playerColumn}>
        <Text style={styles.headerText}>Player</Text>
      </View>
      <View style={styles.returnsColumn}>
        <Text style={styles.headerText}>Returns</Text>
      </View>
    </View>
  );

  const renderPlayerRow = (player: WeeklyPlayerStats, position: number) => (
    <View key={player.playerName} style={styles.tableRow}>
      <View style={styles.positionColumn}>
        <Text style={styles.cellText}>{position}</Text>
      </View>
      <View style={styles.playerColumn}>
        <Text style={styles.playerName}>{player.playerName}</Text>
      </View>
      <View style={styles.returnsColumn}>
        <Text style={styles.cellText}>£{player.weeklyEarnings.toFixed(2)}</Text>
      </View>
    </View>
  );

  const calculateTotalWeeklyWinnings = (displayWeek: number) => {
    // Calculate total player earnings for the week (excluding accumulator returns)
    const totalPlayerEarnings = leaderboard.reduce((sum, player) => sum + player.weeklyEarnings, 0);
    
    // Calculate accumulator winnings for the week using admin-calculated results
    const weekAccumulators = accumulatorBets.filter(bet => bet.week === displayWeek);
    let accumulatorWinnings = 0;
    
    console.log(`Weekly stats - Week ${displayWeek} accumulators:`, weekAccumulators);
    
    weekAccumulators.forEach(bet => {
      // Use the admin-calculated actual winnings directly
      if (bet.isWon === true) {
        accumulatorWinnings += bet.actualWinnings;
        console.log(`Weekly stats - Adding accumulator winnings: ${bet.type} £${bet.actualWinnings}`);
      } else {
        console.log(`Weekly stats - Accumulator ${bet.type}: isWon=${bet.isWon}, no winnings added`);
      }
    });
    
    console.log(`Total weekly winnings for week ${displayWeek}: Player earnings £${totalPlayerEarnings.toFixed(2)} + Accumulator winnings £${accumulatorWinnings.toFixed(2)} = £${(totalPlayerEarnings + accumulatorWinnings).toFixed(2)}`);
    
    return totalPlayerEarnings + accumulatorWinnings;
  };

  const renderTotalRow = () => {
    // Total earnings in table should only be player bet returns (excluding accumulator returns)
    const totalEarnings = leaderboard.reduce((sum, player) => sum + player.weeklyEarnings, 0);

    return (
      <View style={styles.totalRow}>
        <View style={styles.positionColumn}>
          <Text style={styles.totalText}>-</Text>
        </View>
        <View style={styles.playerColumn}>
          <Text style={styles.totalText}>TOTAL</Text>
        </View>
        <View style={styles.returnsColumn}>
          <Text style={styles.totalText}>£{totalEarnings.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  const renderPlayerPicks = () => {
    if (selectedWeek < 1) {
      return (
        <View style={styles.picksContainer}>
          <Text style={styles.sectionTitle}>Squad Picks</Text>
          <Text style={[commonStyles.text, { textAlign: 'center' }]}>
            No previous week data available. Complete Week 1 to see performance data.
          </Text>
        </View>
      );
    }

    const weekPicks = playerPicks.filter(pick => pick.week === selectedWeek);
    const kbResult = kickerBetResults.find(r => r.week === selectedWeek);
    const weekAccumulators = accumulatorBets.filter(bet => bet.week === selectedWeek);

    return (
      <View style={styles.picksContainer}>
        {/* Squad Picks title now inside the card with reduced size */}
        <Text style={styles.sectionTitle}>Squad Picks</Text>
        {weekPicks.map((pick, index) => {
          const player = leaderboard.find(p => p.playerName === pick.playerName);
          if (!player) return null;

          const team1Status = player.team1Won === true ? 'WON' : player.team1Won === false ? 'LOST' : 'PENDING';
          const team2Status = player.team2Won === true ? 'WON' : player.team2Won === false ? 'LOST' : 'PENDING';
          
          const team1Style = player.team1Won === true ? styles.winText : player.team1Won === false ? styles.lossText : styles.pendingText;
          const team2Style = player.team2Won === true ? styles.winText : player.team2Won === false ? styles.lossText : styles.pendingText;

          // Calculate bet returns - show actual potential returns even if lost
          let betReturns = 0;
          const bothTeamsWon = player.team1Won === true && player.team2Won === true;
          const oneOrBothTeamsLost = player.team1Won === false || player.team2Won === false;
          
          // Calculate potential returns regardless of outcome
          const team1Odds = playerPickOdds.find(o => 
            o.playerName === pick.playerName && 
            o.teamName === pick.team1 && 
            o.week === selectedWeek
          );
          const team2Odds = playerPickOdds.find(o => 
            o.playerName === pick.playerName && 
            o.teamName === pick.team2 && 
            o.week === selectedWeek
          );

          if (team1Odds && team2Odds) {
            betReturns = 5 * team1Odds.odds * team2Odds.odds; // Show potential returns
          }
          
          let betOutcomeStyle = {};
          let betOutcomeText = '';
          
          if (bothTeamsWon) {
            betOutcomeStyle = styles.betOutcomeWin;
            betOutcomeText = 'WIN';
          } else if (oneOrBothTeamsLost) {
            betOutcomeStyle = styles.betOutcomeLoss;
            betOutcomeText = 'LOSS';
          } else {
            betOutcomeStyle = { color: colors.textMuted };
            betOutcomeText = 'PENDING';
          }

          return (
            <View key={index} style={styles.pickItem}>
              <View style={styles.pickHeaderRow}>
                <Text style={pick.isLate ? styles.latePickPlayerName : styles.pickPlayerName}>
                  {pick.playerName} {pick.isLate ? '(LATE)' : ''}
                </Text>
                <View style={styles.betValueAndOutcome}>
                  <Text style={styles.betValue}>£{betReturns.toFixed(2)}</Text>
                  <Text style={[styles.betOutcome, betOutcomeStyle]}>
                    {betOutcomeText}
                  </Text>
                </View>
              </View>
              <Text style={pick.isLate ? styles.latePickTeams : styles.pickTeams}>
                {pick.team1} ({player.team1Odds}) + {pick.team2} ({player.team2Odds})
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.pickResult, team1Style]}>
                  {pick.team1}: {team1Status}
                </Text>
                <Text style={[styles.pickResult, team2Style]}>
                  {pick.team2}: {team2Status}
                </Text>
              </View>
              
              {/* Kicker Bet Section with improved layout */}
              {kbResult && (
                <View style={styles.kickerBetSection}>
                  <View style={styles.kickerBetRow}>
                    <View style={styles.kickerBetLeft}>
                      <Text style={styles.kickerBetTitle}>Kicker Bet</Text>
                    </View>
                    <View style={styles.kickerBetRight}>
                      <Text style={styles.kickerBetText}>
                        Result: {kbResult.actualHomeScore} - {kbResult.actualAwayScore}
                      </Text>
                      <Text style={[styles.kickerBetText, player.kickerBetWon ? styles.winText : styles.lossText]}>
                        {player.kickerBetWon ? `WON - £${player.kickerBetEarnings.toFixed(2)}` : 'LOST'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Enhanced Accumulator Bets Section with proper calculations */}
        {weekAccumulators.length > 0 && (
          <View style={styles.accumulatorSection}>
            <Text style={styles.accumulatorTitle}>Squad Accumulators</Text>
            {weekAccumulators.map((bet, index) => {
              console.log('Processing accumulator bet for weekly stats:', bet);
              
              // Use the admin-calculated results directly from the bet object
              let outcomeText = '';
              let outcomeStyle = {};
              let returnsText = '';
              let returnsStyle = {};

              if (bet.isWon === null) {
                outcomeText = 'PENDING';
                outcomeStyle = styles.accumulatorOutcomePending;
                returnsText = `£${bet.potentialWinnings.toFixed(2)}`;
                returnsStyle = styles.accumulatorReturnsPending;
              } else if (bet.isWon === true) {
                outcomeText = 'WON';
                outcomeStyle = styles.accumulatorOutcomeWon;
                returnsText = `£${bet.actualWinnings.toFixed(2)}`;
                returnsStyle = styles.accumulatorReturnsWon;
              } else {
                outcomeText = 'LOSS';
                outcomeStyle = styles.accumulatorOutcomeLoss;
                returnsText = `£0.00`;
                returnsStyle = styles.accumulatorReturnsLoss;
              }

              console.log(`Weekly stats accumulator ${bet.type}: isWon=${bet.isWon}, actualWinnings=${bet.actualWinnings}, outcome=${outcomeText}`);

              return (
                <View key={index} style={styles.accumulatorBetCard}>
                  <View style={styles.accumulatorBetHeader}>
                    <Text style={styles.accumulatorBetType}>
                      {bet.type === 'max-acca' ? 'Max Acca' : '1st Pick Acca'}
                    </Text>
                    <Text style={[styles.accumulatorOutcome, outcomeStyle]}>
                      {outcomeText}
                    </Text>
                  </View>
                  
                  <View style={styles.accumulatorDetails}>
                    <Text style={styles.accumulatorDetailText}>
                      Stake: £{bet.stake.toFixed(2)}
                    </Text>
                    <Text style={styles.accumulatorDetailText}>
                      Teams: {bet.teams.length}
                    </Text>
                  </View>
                  
                  <Text style={[styles.accumulatorReturns, returnsStyle]}>
                    Returns: {returnsText}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        
        {weekPicks.length === 0 && (
          <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 20 }}>
            No picks found for Week {selectedWeek}
          </Text>
        )}
      </View>
    );
  };

  const renderBackButton = () => (
    <View style={styles.backButtonContainer}>
      <TouchableOpacity
        style={styles.backButtonWrapper}
        onPress={() => {
          console.log('Navigating back to home');
          router.back();
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1a4d3a', '#0a0a0a', '#000000']} // Reverted to previous gradient
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <RoleGuard requiredRole="player" fallbackMessage="Please select your role to access weekly stats.">
      <View style={styles.safeContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerWithLogo}>
          <Image
            source={require('../assets/images/60e1ffea-4aeb-4101-9cc0-52f16abfc277.png')}
            style={styles.scrollableLogo}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Weekly Stats</Text>
          </View>
        </View>
        
        {availableWeeks.length > 0 ? (
          <>
            {/* Week Selector - updated with reverted gradient and centered text */}
            <View style={styles.weekSelectorContainer}>
              <View style={styles.weekSelectorWrapper}>
                <LinearGradient
                  colors={['#1a4d3a', '#0a0a0a', '#000000']} // Reverted to previous gradient
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.weekSelectorButton}
                >
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedWeek}
                      onValueChange={(itemValue) => {
                        console.log('Selected week changed to:', itemValue);
                        setSelectedWeek(itemValue);
                      }}
                      style={styles.picker}
                      dropdownIconColor="#d0d0d0"
                    >
                      {availableWeeks.map((week) => (
                        <Picker.Item 
                          key={week} 
                          label={`Week ${week}`} 
                          value={week}
                          color="#d0d0d0"
                        />
                      ))}
                    </Picker>
                  </View>
                </LinearGradient>
              </View>
            </View>
            
            {/* Centered table */}
            <View style={styles.tableContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.tableScrollView}
                contentContainerStyle={styles.tableContent}
              >
                <View>
                  {renderTableHeader()}
                  {leaderboard.map((player, index) => renderPlayerRow(player, index + 1))}
                  {renderTotalRow()}
                </View>
              </ScrollView>
            </View>

            {/* Total Weekly Returns Section - includes accumulator returns */}
            <View style={styles.totalWeeklyReturnsContainer}>
              <Text style={styles.totalWeeklyReturnsTitle}>Total Weekly Returns</Text>
              <Text style={styles.totalWeeklyReturnsText}>
                £{calculateTotalWeeklyWinnings(selectedWeek).toFixed(2)}
              </Text>
              <Text style={[styles.accumulatorDetailText, { textAlign: 'center', marginTop: 8, fontStyle: 'italic' }]}>
                Includes player picks, KB bets, and accumulator winnings
              </Text>
            </View>

            {/* Player picks with Squad Picks title inside the card */}
            {renderPlayerPicks()}
            
            {/* Back button now scrolls with content and is always at bottom */}
            {renderBackButton()}
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No previous week data available.{'\n'}Complete Week 1 to see performance data.
            </Text>
            {/* Back button for no data state - also scrolls with content */}
            {renderBackButton()}
          </View>
        )}
      </ScrollView>
    </View>
    </RoleGuard>
  );
}
