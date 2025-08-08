
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { colors } from '../styles/commonStyles';
import Button from '../components/Button';
import { commonStyles, buttonStyles } from '../styles/commonStyles';
import { Text, View, ScrollView, TextInput, Alert, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleGuard } from '../components/RoleGuard';

interface GameOdds {
  team1: string;
  team2: string;
  team1Odds: number;
  team2Odds: number;
  team1OddsFraction: string;
  team2OddsFraction: string;
  week: number;
}

interface GameResult {
  team1: string;
  team2: string;
  winner: string;
  week: number;
}

interface PlayerPick {
  playerName: string;
  team1: string;
  team2: string;
  week: number;
  submittedAt?: string; // ISO string timestamp
  isLate?: boolean; // Flag for late submissions
}

interface SeasonSettings {
  isSeasonStarted: boolean;
  seasonStartDate: string;
  lockedPlayers: string[];
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

interface TotalPotData {
  totalPot: number;
  accumulatorWinnings: number;
  playerWinnings: number;
}

interface KickerBet {
  week: number;
  selectedMatch: string;
  selectedBy: string;
  predictions: KickerBetPrediction[];
}

interface KickerBetPrediction {
  playerName: string;
  homeScore: number;
  awayScore: number;
  week: number;
  submittedAt?: string;
  isLate?: boolean;
}

interface KickerBetOdds {
  playerName: string;
  odds: number;
  oddsFraction: string;
  week: number;
}

interface KickerBetResult {
  week: number;
  actualHomeScore: number;
  actualAwayScore: number;
  winners: string[];
}

interface WeeklyWinner {
  week: number;
  playerName: string;
  earnings: number;
}

interface OddsLockState {
  week: number;
  isLocked: boolean;
}

const styles = {
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 60, // Move title halfway between left and center
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#d0d0d0',
    marginBottom: 4,
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  input: {
    backgroundColor: colors.surface,
    color: '#d0d0d0',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  smallInput: {
    backgroundColor: colors.surface,
    color: '#d0d0d0',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    flex: 1,
    marginHorizontal: 4,
    textAlign: 'center' as const,
  },
  compactOddsInput: {
    backgroundColor: colors.surface,
    color: '#d0d0d0',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    fontSize: 12,
    width: 60,
    textAlign: 'center' as const,
    marginHorizontal: 4,
  },
  narrowKBOddsInput: {
    backgroundColor: colors.surface,
    color: '#d0d0d0',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    fontSize: 12,
    width: 50,
    textAlign: 'center' as const,
    marginLeft: 8,
  },
  disabledInput: {
    backgroundColor: colors.textMuted + '30',
    color: colors.textMuted,
    borderColor: colors.textMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    marginVertical: 4,
  },
  lockedOddsInput: {
    backgroundColor: colors.textMuted + '20',
    color: colors.textMuted,
    borderColor: colors.textMuted + '50',
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    fontSize: 12,
    width: 60,
    textAlign: 'center' as const,
    marginHorizontal: 4,
  },
  lockedKBOddsInput: {
    backgroundColor: colors.textMuted + '20',
    color: colors.textMuted,
    borderColor: colors.textMuted + '50',
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    fontSize: 12,
    width: 50,
    textAlign: 'center' as const,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginVertical: 8,
  },
  playerItem: {
    backgroundColor: colors.surface,
    padding: 8,
    marginVertical: 2,
    marginHorizontal: 4,
    borderRadius: 6,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  removeButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#d0d0d0',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  // Updated section title to match Squad Picks and Squad Accumulator style from weekly stats
  sectionTitle: {
    color: colors.primary,
    fontSize: 14, // Reduced from 18 to match weekly stats
    fontWeight: '600', // Changed from 'bold' to '600' to match weekly stats
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5, // Added letter spacing to match weekly stats
    textTransform: 'uppercase', // Added uppercase to match weekly stats
  },
  statusText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginVertical: 8,
  },
  consolidatedPlayerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    width: '100%',
    maxWidth: '100%',
  },
  playerNameHeader: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    textAlign: 'left' as const,
  },
  weeklyPicksSection: {
    backgroundColor: colors.background + '50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  kickerBetSection: {
    backgroundColor: colors.background + '50',
    borderRadius: 8,
    padding: 12,
  },
  teamName: {
    color: '#d0d0d0',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  oddsLabel: {
    color: '#d0d0d0',
    fontSize: 12,
    marginRight: 4,
    minWidth: 35,
  },
  checkboxContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginLeft: 8,
  },
  checkboxColumn: {
    alignItems: 'center' as const,
    marginHorizontal: 15, // Increased from 10 to 15 for more spacing between checkboxes
  },
  checkboxHeader: {
    color: '#d0d0d0',
    fontSize: 10,
    fontWeight: 'bold' as const,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLost: {
    backgroundColor: '#cc4444',
    borderColor: '#cc4444',
  },
  checkboxText: {
    color: '#d0d0d0',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  checkboxTextLost: {
    color: '#d0d0d0',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  fractionExample: {
    color: '#666666', // Changed to dark grey
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  currentOddsText: {
    color: colors.primary,
    fontSize: 10,
    fontStyle: 'italic' as const,
    marginLeft: 4,
  },
  compactCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: '100%',
  },
  compactButton: {
    backgroundColor: '#4a7c59',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginVertical: 4,
  },
  compactButtonText: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  disabledButton: {
    backgroundColor: colors.textMuted + '50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 6,
  },
  disabledButtonText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  lockOddsButton: {
    backgroundColor: '#cc4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 8,
  },
  lockOddsButtonText: {
    color: '#d0d0d0',
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  lockedOddsButton: {
    backgroundColor: colors.grey + '50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 8,
  },
  lockedOddsButtonText: {
    color: colors.grey,
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  // Updated advance week button to match the bright green styling
  advanceWeekButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    marginHorizontal: 8,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.25)',
    elevation: 6,
  },
  advanceWeekButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  disabledAdvanceWeekButton: {
    backgroundColor: colors.textMuted + '50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  disabledAdvanceWeekButtonText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  accumulatorCard: {
    backgroundColor: colors.card + '80',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  accumulatorTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  accumulatorText: {
    color: '#d0d0d0',
    fontSize: 12,
    marginVertical: 2,
  },
  accumulatorTeams: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  accumulatorTeamsList: {
    marginTop: 8,
  },
  accumulatorTeamItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginVertical: 2,
    backgroundColor: colors.background + '50',
    borderRadius: 4,
  },
  accumulatorTeamName: {
    color: '#d0d0d0',
    fontSize: 12,
    flex: 1,
  },
  teamRemoveButton: {
    backgroundColor: '#cc4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  teamRemoveButtonText: {
    color: '#d0d0d0',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  disabledTeamRemoveButton: {
    backgroundColor: colors.textMuted + '50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  disabledTeamRemoveButtonText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  kickerBetManagementCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: colors.primary + '50',
    width: '100%',
    maxWidth: '100%',
  },
  kickerBetManagementTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  predictionScore: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  vsText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginHorizontal: 12,
  },
  winnerInput: {
    backgroundColor: colors.surface,
    color: '#d0d0d0',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    marginVertical: 4,
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    marginVertical: 8,
    marginHorizontal: 8,
  },
  lateFlag: {
    color: colors.error,
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  teamPickRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.card + '50',
    borderRadius: 6,
  },
  kbSingleLineRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginVertical: 4,
  },
  kbPredictionText: {
    color: '#d0d0d0',
    fontSize: 14,
    flex: 1,
  },
  kbOddsAndWonContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  kbWonContainer: {
    alignItems: 'center' as const,
    marginLeft: 8,
  },
  kbWonLabel: {
    color: '#d0d0d0',
    fontSize: 10,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  playersHorizontalContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  compactPlayerInput: {
    backgroundColor: colors.surface,
    color: '#d0d0d0',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 4,
    fontSize: 14,
  },
  backButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.15)',
    elevation: 4,
    marginTop: 20,
    marginHorizontal: 8,
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
  noPicksText: {
    color: '#d0d0d0', // Changed from black to off-white
    fontStyle: 'italic',
  },
  // New style for the Set KB Result button to match weekly picks button
  setKBResultButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.25)',
    elevation: 6,
  },
  setKBResultButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Combined submit button style to match weekly picks page
  combinedSubmitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.25)',
    elevation: 6,
  },
  combinedSubmitText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Debug card styles
  debugCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: '100%',
  },
};

export default function AdminScreen() {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [gameOdds, setGameOdds] = useState<GameOdds[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [playerPicks, setPlayerPicks] = useState<PlayerPick[]>([]);
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [playerPickOdds, setPlayerPickOdds] = useState<PlayerPickOdds[]>([]);
  const [accumulatorBets, setAccumulatorBets] = useState<AccumulatorBet[]>([]);
  const [totalPotData, setTotalPotData] = useState<TotalPotData>({
    totalPot: 0,
    accumulatorWinnings: 0,
    playerWinnings: 0,
  });
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings>({
    isSeasonStarted: false,
    seasonStartDate: '',
    lockedPlayers: [],
  });

  // Kicker Bet states
  const [kickerBets, setKickerBets] = useState<KickerBet[]>([]);
  const [kickerBetOdds, setKickerBetOdds] = useState<KickerBetOdds[]>([]);
  const [kickerBetResults, setKickerBetResults] = useState<KickerBetResult[]>([]);
  const [weeklyWinners, setWeeklyWinners] = useState<WeeklyWinner[]>([]);

  // Odds lock state
  const [oddsLockStates, setOddsLockStates] = useState<OddsLockState[]>([]);

  // Form states
  const [newPlayerName, setNewPlayerName] = useState('');
  const [actualHomeScore, setActualHomeScore] = useState('');
  const [actualAwayScore, setActualAwayScore] = useState('');

  // Individual odds input states
  const [individualOddsInputs, setIndividualOddsInputs] = useState<{[key: string]: string}>({});
  const [kickerBetOddsInputs, setKickerBetOddsInputs] = useState<{[key: string]: string}>({});

  console.log('AdminScreen rendered');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Generate accumulator bets when player picks and odds are available
    const currentWeekPicks = playerPicks.filter(pick => pick.week === currentWeek);
    if (currentWeekPicks.length > 0 && seasonSettings.isSeasonStarted) {
      console.log('Player picks detected for current week, generating accumulators...');
      generateAccumulatorBets();
    }
  }, [playerPicks, playerPickOdds, teamResults, currentWeek, seasonSettings.isSeasonStarted]);

  useEffect(() => {
    // Calculate total pot whenever relevant data changes
    calculateTotalPot();
  }, [accumulatorBets, playerPicks, teamResults, playerPickOdds, kickerBetResults, kickerBetOdds, currentWeek]);

  const loadData = async () => {
    try {
      const [
        storedWeek, storedOdds, storedResults, storedSettings, storedPicks, 
        storedTeamResults, storedPlayerPickOdds, storedAccumulatorBets, storedTotalPotData,
        storedKickerBets, storedKickerBetOdds, storedKickerBetResults, storedWeeklyWinners,
        storedOddsLockStates
      ] = await Promise.all([
        AsyncStorage.getItem('currentWeek'),
        AsyncStorage.getItem('gameOdds'),
        AsyncStorage.getItem('gameResults'),
        AsyncStorage.getItem('seasonSettings'),
        AsyncStorage.getItem('playerPicks'),
        AsyncStorage.getItem('teamResults'),
        AsyncStorage.getItem('playerPickOdds'),
        AsyncStorage.getItem('accumulatorBets'),
        AsyncStorage.getItem('totalPotData'),
        AsyncStorage.getItem('kickerBets'),
        AsyncStorage.getItem('kickerBetOdds'),
        AsyncStorage.getItem('kickerBetResults'),
        AsyncStorage.getItem('weeklyWinners'),
        AsyncStorage.getItem('oddsLockStates'),
      ]);

      if (storedWeek) setCurrentWeek(parseInt(storedWeek));
      if (storedOdds) setGameOdds(JSON.parse(storedOdds));
      if (storedResults) setGameResults(JSON.parse(storedResults));
      if (storedPicks) setPlayerPicks(JSON.parse(storedPicks));
      if (storedTeamResults) setTeamResults(JSON.parse(storedTeamResults));
      if (storedPlayerPickOdds) setPlayerPickOdds(JSON.parse(storedPlayerPickOdds));
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
      if (storedTotalPotData) setTotalPotData(JSON.parse(storedTotalPotData));
      if (storedSettings) setSeasonSettings(JSON.parse(storedSettings));
      if (storedKickerBets) setKickerBets(JSON.parse(storedKickerBets));
      if (storedKickerBetOdds) setKickerBetOdds(JSON.parse(storedKickerBetOdds));
      if (storedKickerBetResults) setKickerBetResults(JSON.parse(storedKickerBetResults));
      if (storedWeeklyWinners) setWeeklyWinners(JSON.parse(storedWeeklyWinners));
      if (storedOddsLockStates) setOddsLockStates(JSON.parse(storedOddsLockStates));

      console.log('Admin data loaded');
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const saveCurrentWeek = async (week: number) => {
    try {
      await AsyncStorage.setItem('currentWeek', week.toString());
      console.log('Current week saved:', week);
    } catch (error) {
      console.error('Error saving current week:', error);
    }
  };

  const saveSeasonSettings = async (settings: SeasonSettings) => {
    try {
      await AsyncStorage.setItem('seasonSettings', JSON.stringify(settings));
      console.log('Season settings saved:', settings);
    } catch (error) {
      console.error('Error saving season settings:', error);
    }
  };

  const saveOdds = async (newOdds: GameOdds[]) => {
    try {
      await AsyncStorage.setItem('gameOdds', JSON.stringify(newOdds));
      console.log('Game odds saved:', newOdds.length);
    } catch (error) {
      console.error('Error saving game odds:', error);
    }
  };

  const saveResults = async (newResults: GameResult[]) => {
    try {
      await AsyncStorage.setItem('gameResults', JSON.stringify(newResults));
      console.log('Game results saved:', newResults.length);
    } catch (error) {
      console.error('Error saving game results:', error);
    }
  };

  const saveTeamResults = async (newTeamResults: TeamResult[]) => {
    try {
      await AsyncStorage.setItem('teamResults', JSON.stringify(newTeamResults));
      console.log('Team results saved:', newTeamResults.length);
    } catch (error) {
      console.error('Error saving team results:', error);
    }
  };

  const savePlayerPickOdds = async (newPlayerPickOdds: PlayerPickOdds[]) => {
    try {
      await AsyncStorage.setItem('playerPickOdds', JSON.stringify(newPlayerPickOdds));
      console.log('Player pick odds saved:', newPlayerPickOdds.length);
    } catch (error) {
      console.error('Error saving player pick odds:', error);
    }
  };

  const saveAccumulatorBets = async (newAccumulatorBets: AccumulatorBet[]) => {
    try {
      await AsyncStorage.setItem('accumulatorBets', JSON.stringify(newAccumulatorBets));
      console.log('Accumulator bets saved:', newAccumulatorBets.length);
    } catch (error) {
      console.error('Error saving accumulator bets:', error);
    }
  };

  const saveTotalPotData = async (newTotalPotData: TotalPotData) => {
    try {
      await AsyncStorage.setItem('totalPotData', JSON.stringify(newTotalPotData));
      console.log('Total pot data saved:', newTotalPotData);
    } catch (error) {
      console.error('Error saving total pot data:', error);
    }
  };

  const saveKickerBets = async (newKickerBets: KickerBet[]) => {
    try {
      await AsyncStorage.setItem('kickerBets', JSON.stringify(newKickerBets));
      console.log('Kicker bets saved:', newKickerBets.length);
    } catch (error) {
      console.error('Error saving kicker bets:', error);
    }
  };

  const saveKickerBetOdds = async (newKickerBetOdds: KickerBetOdds[]) => {
    try {
      await AsyncStorage.setItem('kickerBetOdds', JSON.stringify(newKickerBetOdds));
      console.log('Kicker bet odds saved:', newKickerBetOdds.length);
    } catch (error) {
      console.error('Error saving kicker bet odds:', error);
    }
  };

  const saveKickerBetResults = async (newKickerBetResults: KickerBetResult[]) => {
    try {
      await AsyncStorage.setItem('kickerBetResults', JSON.stringify(newKickerBetResults));
      console.log('Kicker bet results saved:', newKickerBetResults.length);
    } catch (error) {
      console.error('Error saving kicker bet results:', error);
    }
  };

  const saveWeeklyWinners = async (newWeeklyWinners: WeeklyWinner[]) => {
    try {
      await AsyncStorage.setItem('weeklyWinners', JSON.stringify(newWeeklyWinners));
      console.log('Weekly winners saved:', newWeeklyWinners.length);
    } catch (error) {
      console.error('Error saving weekly winners:', error);
    }
  };

  const saveOddsLockStates = async (newOddsLockStates: OddsLockState[]) => {
    try {
      await AsyncStorage.setItem('oddsLockStates', JSON.stringify(newOddsLockStates));
      console.log('Odds lock states saved:', newOddsLockStates.length);
    } catch (error) {
      console.error('Error saving odds lock states:', error);
    }
  };

  const calculateTotalPot = async () => {
    console.log('Calculating total pot...');
    
    let playerWinnings = 0;
    let accumulatorWinnings = 0;
    let kickerBetWinnings = 0;

    // Calculate player winnings from individual bets
    const allPlayers = Array.from(new Set(playerPicks.map(pick => pick.playerName)));
    
    for (let week = 1; week <= currentWeek; week++) {
      const weekPicks = playerPicks.filter(pick => pick.week === week);
      
      weekPicks.forEach(pick => {
        // Check if both teams won (double win)
        const team1Result = teamResults.find(r => r.teamName === pick.team1 && r.week === week);
        const team2Result = teamResults.find(r => r.teamName === pick.team2 && r.week === week);

        const team1Won = team1Result?.hasWon === true;
        const team2Won = team2Result?.hasWon === true;

        if (team1Won && team2Won) {
          // Double win - calculate earnings using individual odds
          const team1Odds = playerPickOdds.find(o => 
            o.playerName === pick.playerName && 
            o.teamName === pick.team1 && 
            o.week === week
          );
          const team2Odds = playerPickOdds.find(o => 
            o.playerName === pick.playerName && 
            o.teamName === pick.team2 && 
            o.week === week
          );

          if (team1Odds && team2Odds) {
            // Calculate double bet winnings: £5 * team1Odds * team2Odds
            const earnings = 5 * team1Odds.odds * team2Odds.odds;
            playerWinnings += earnings;
          }
        }
      });
    }

    // Calculate accumulator winnings (these contribute to total team earnings but not individual player earnings)
    accumulatorBets.forEach(bet => {
      if (bet.isWon === true) {
        accumulatorWinnings += bet.actualWinnings;
      }
    });

    // Calculate kicker bet winnings
    kickerBetResults.forEach(result => {
      result.winners.forEach(winnerName => {
        const odds = kickerBetOdds.find(o => 
          o.playerName === winnerName && o.week === result.week
        );
        if (odds) {
          kickerBetWinnings += 1 * odds.odds; // £1 stake
        }
      });
    });

    const totalPot = playerWinnings + accumulatorWinnings + kickerBetWinnings;

    const newTotalPotData: TotalPotData = {
      totalPot,
      accumulatorWinnings,
      playerWinnings: playerWinnings + kickerBetWinnings,
    };

    setTotalPotData(newTotalPotData);
    await saveTotalPotData(newTotalPotData);

    console.log('Total pot calculated:', newTotalPotData);
  };

  const generateAccumulatorBets = async () => {
    console.log('Generating accumulator bets for week', currentWeek);
    
    const currentWeekPicks = playerPicks.filter(pick => pick.week === currentWeek);
    if (currentWeekPicks.length === 0) {
      console.log('No picks for current week, skipping accumulator generation');
      return;
    }

    // Check if accumulator bets already exist for this week
    const existingBets = accumulatorBets.filter(bet => bet.week === currentWeek);
    if (existingBets.length >= 2) {
      console.log('Accumulator bets already exist for week', currentWeek);
      // Still update existing bets with current results and recalculate potential winnings
      const updatedAccumulatorBets = [...accumulatorBets];
      updatedAccumulatorBets.forEach(bet => {
        if (bet.week === currentWeek) {
          // Recalculate potential winnings in case odds have changed
          bet.potentialWinnings = calculateAccumulatorWinnings(bet.teams, bet.stake, currentWeek);
          
          const { isWon, actualWinnings } = checkAccumulatorResult(bet);
          bet.isWon = isWon;
          bet.actualWinnings = actualWinnings;
          console.log(`Updated accumulator ${bet.type} for week ${bet.week}: potentialWinnings=${bet.potentialWinnings}, isWon=${isWon}, actualWinnings=${actualWinnings}`);
        }
      });
      setAccumulatorBets(updatedAccumulatorBets);
      await saveAccumulatorBets(updatedAccumulatorBets);
      return;
    }

    const newAccumulatorBets: AccumulatorBet[] = [...accumulatorBets];

    // Generate Max Acca (£1 bet consisting of all players weekly picks)
    const allTeams: string[] = [];
    currentWeekPicks.forEach(pick => {
      allTeams.push(pick.team1, pick.team2);
    });

    if (allTeams.length > 0 && !existingBets.find(bet => bet.type === 'max-acca')) {
      const maxAccaPotentialWinnings = calculateAccumulatorWinnings(allTeams, 1, currentWeek);
      const maxAccaBet: AccumulatorBet = {
        week: currentWeek,
        type: 'max-acca',
        stake: 1,
        teams: allTeams,
        potentialWinnings: maxAccaPotentialWinnings,
        isWon: null,
        actualWinnings: 0,
      };
      newAccumulatorBets.push(maxAccaBet);
      console.log('Generated Max Acca bet:', maxAccaBet);
    }

    // Generate 1st Pick Acca (£5 bet consisting of all players' first picks)
    const firstPickTeams: string[] = [];
    currentWeekPicks.forEach(pick => {
      firstPickTeams.push(pick.team1);
    });

    if (firstPickTeams.length > 0 && !existingBets.find(bet => bet.type === '1st-pick-acca')) {
      const firstPickAccaPotentialWinnings = calculateAccumulatorWinnings(firstPickTeams, 5, currentWeek);
      const firstPickAccaBet: AccumulatorBet = {
        week: currentWeek,
        type: '1st-pick-acca',
        stake: 5,
        teams: firstPickTeams,
        potentialWinnings: firstPickAccaPotentialWinnings,
        isWon: null,
        actualWinnings: 0,
      };
      newAccumulatorBets.push(firstPickAccaBet);
      console.log('Generated 1st Pick Acca bet:', firstPickAccaBet);
    }

    // Update win status and actual winnings for all bets for current week
    newAccumulatorBets.forEach(bet => {
      if (bet.week === currentWeek) {
        const { isWon, actualWinnings } = checkAccumulatorResult(bet);
        bet.isWon = isWon;
        bet.actualWinnings = actualWinnings;
        console.log(`Updated accumulator ${bet.type} for week ${bet.week}: isWon=${isWon}, actualWinnings=${actualWinnings}`);
      }
    });

    setAccumulatorBets(newAccumulatorBets);
    await saveAccumulatorBets(newAccumulatorBets);
    console.log('Accumulator bets generated and saved');
  };

  const calculateAccumulatorWinnings = (teams: string[], stake: number, week: number): number => {
    let totalOdds = 1;
    
    console.log(`Calculating accumulator winnings for ${teams.length} teams in week ${week}:`);
    console.log(`Available player pick odds for week ${week}:`, playerPickOdds.filter(o => o.week === week));
    
    teams.forEach(teamName => {
      // Find the odds for this team - look for any player's odds for this team
      // Since all players should have the same odds for the same team, we can use the first one we find
      const teamOdds = playerPickOdds.find(odds => 
        odds.teamName === teamName && odds.week === week
      );
      
      if (teamOdds) {
        totalOdds *= teamOdds.odds;
        console.log(`  ${teamName}: ${teamOdds.odds} (${teamOdds.oddsFraction}) from player ${teamOdds.playerName}`);
      } else {
        // If no specific odds found, use a default of 2.0 (evens)
        totalOdds *= 2.0;
        console.log(`  ${teamName}: 2.0 (default - no odds found for week ${week})`);
        console.log(`  Available odds for week ${week}:`, playerPickOdds.filter(o => o.week === week).map(o => `${o.teamName}: ${o.oddsFraction}`));
      }
    });

    const potentialWinnings = stake * totalOdds;
    console.log(`  Total odds: ${totalOdds}, Stake: £${stake}, Potential winnings: £${potentialWinnings.toFixed(2)}`);
    
    return potentialWinnings;
  };

  const checkAccumulatorResult = (bet: AccumulatorBet, currentTeamResults?: TeamResult[]): { isWon: boolean | null, actualWinnings: number } => {
    // Use provided team results or fall back to state
    const resultsToCheck = currentTeamResults || teamResults;
    
    let allTeamsWon = true;
    let hasResults = false;
    let teamsWithResults = 0;

    console.log(`Checking accumulator result for ${bet.type} week ${bet.week} with ${bet.teams.length} teams:`);

    for (const teamName of bet.teams) {
      const teamResult = resultsToCheck.find(result => 
        result.teamName === teamName && result.week === bet.week
      );
      
      if (teamResult) {
        hasResults = true;
        teamsWithResults++;
        console.log(`  ${teamName}: ${teamResult.hasWon ? 'WON' : 'LOST'}`);
        if (!teamResult.hasWon) {
          allTeamsWon = false;
          // Don't break here - continue to log all results
        }
      } else {
        console.log(`  ${teamName}: NO RESULT YET`);
      }
    }

    console.log(`  Teams with results: ${teamsWithResults}/${bet.teams.length}`);

    // If any team doesn't have a result yet, we can't determine the outcome
    if (teamsWithResults < bet.teams.length) {
      console.log(`  Accumulator result: PENDING (not all teams have results)`);
      return { isWon: null, actualWinnings: 0 };
    }

    if (!hasResults) {
      console.log(`  Accumulator result: PENDING (no results found)`);
      return { isWon: null, actualWinnings: 0 };
    }

    const actualWinnings = allTeamsWon ? bet.potentialWinnings : 0;
    console.log(`  Accumulator result: ${allTeamsWon ? 'WON' : 'LOST'}, Actual winnings: £${actualWinnings.toFixed(2)}`);

    return {
      isWon: allTeamsWon,
      actualWinnings: actualWinnings,
    };
  };

  const removeTeamFromAccumulator = async (betIndex: number, teamToRemove: string) => {
    console.log(`Removing team ${teamToRemove} from accumulator bet ${betIndex}`);
    
    // Check if odds are locked for current week
    const currentWeekLockState = oddsLockStates.find(state => state.week === currentWeek);
    if (currentWeekLockState?.isLocked) {
      Alert.alert('Locked', 'Cannot remove teams from accumulators when odds are locked');
      return;
    }
    
    Alert.alert(
      'Remove Team',
      `Are you sure you want to remove ${teamToRemove} from this accumulator bet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedAccumulatorBets = [...accumulatorBets];
            const bet = updatedAccumulatorBets[betIndex];
            
            // Remove the team from the bet
            bet.teams = bet.teams.filter(team => team !== teamToRemove);
            
            // Recalculate potential winnings with the remaining teams
            if (bet.teams.length > 0) {
              // Use the current playerPickOdds state to recalculate
              bet.potentialWinnings = calculateAccumulatorWinnings(bet.teams, bet.stake, bet.week);
              
              // Recalculate win status and actual winnings
              const { isWon, actualWinnings } = checkAccumulatorResult(bet);
              bet.isWon = isWon;
              bet.actualWinnings = actualWinnings;
              console.log(`Recalculated accumulator after team removal: potentialWinnings=${bet.potentialWinnings}, isWon=${isWon}, actualWinnings=${actualWinnings}`);
            } else {
              // If no teams left, mark as lost
              bet.potentialWinnings = 0;
              bet.isWon = false;
              bet.actualWinnings = 0;
              console.log('Accumulator has no teams left - marked as lost');
            }
            
            setAccumulatorBets(updatedAccumulatorBets);
            await saveAccumulatorBets(updatedAccumulatorBets);
            
            // Recalculate total pot
            calculateTotalPot();
            
            console.log(`Team ${teamToRemove} removed from accumulator bet`);
            Alert.alert('Success', `${teamToRemove} has been removed from the accumulator bet`);
          },
        },
      ]
    );
  };

  const parseFraction = (fraction: string): number => {
    try {
      const trimmed = fraction.trim();
      if (trimmed.includes('/')) {
        const [numerator, denominator] = trimmed.split('/');
        const num = parseFloat(numerator);
        const den = parseFloat(denominator);
        if (den === 0) return 0;
        return (num / den) + 1; // Convert to decimal odds (add 1 for stake)
      } else {
        // If it's already a decimal, just parse it
        return parseFloat(trimmed);
      }
    } catch (error) {
      console.error('Error parsing fraction:', fraction, error);
      return 0;
    }
  };

  const addPlayerToSeason = async () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Error', 'Please enter a player name');
      return;
    }

    if (seasonSettings.isSeasonStarted) {
      Alert.alert('Error', 'Cannot add players after season has started');
      return;
    }

    if (seasonSettings.lockedPlayers.includes(newPlayerName.trim())) {
      Alert.alert('Error', 'Player already exists');
      return;
    }

    const updatedSettings = {
      ...seasonSettings,
      lockedPlayers: [...seasonSettings.lockedPlayers, newPlayerName.trim()],
    };

    setSeasonSettings(updatedSettings);
    await saveSeasonSettings(updatedSettings);
    setNewPlayerName('');
    Alert.alert('Success', `Player ${newPlayerName.trim()} added to season`);
  };

  const removePlayerFromSeason = async (playerName: string) => {
    if (seasonSettings.isSeasonStarted) {
      Alert.alert('Error', 'Cannot remove players after season has started');
      return;
    }

    const updatedSettings = {
      ...seasonSettings,
      lockedPlayers: seasonSettings.lockedPlayers.filter(p => p !== playerName),
    };

    setSeasonSettings(updatedSettings);
    await saveSeasonSettings(updatedSettings);
    Alert.alert('Success', `Player ${playerName} removed from season`);
  };

  const startSeason = async () => {
    if (seasonSettings.lockedPlayers.length === 0) {
      Alert.alert('Error', 'Add at least one player before starting the season');
      return;
    }

    const updatedSettings = {
      ...seasonSettings,
      isSeasonStarted: true,
      seasonStartDate: new Date().toISOString(),
    };

    setSeasonSettings(updatedSettings);
    await saveSeasonSettings(updatedSettings);
    Alert.alert('Success', 'Season started! Player list is now locked.');
  };

  const resetSeason = async () => {
    Alert.alert(
      'Reset Season',
      'This will reset all data including players, picks, odds, and results. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem('seasonSettings'),
                AsyncStorage.removeItem('playerPicks'),
                AsyncStorage.removeItem('gameOdds'),
                AsyncStorage.removeItem('gameResults'),
                AsyncStorage.removeItem('teamResults'),
                AsyncStorage.removeItem('playerPickOdds'),
                AsyncStorage.removeItem('accumulatorBets'),
                AsyncStorage.removeItem('totalPotData'),
                AsyncStorage.removeItem('kickerBets'),
                AsyncStorage.removeItem('kickerBetOdds'),
                AsyncStorage.removeItem('kickerBetResults'),
                AsyncStorage.removeItem('weeklyWinners'),
                AsyncStorage.removeItem('oddsLockStates'),
                AsyncStorage.setItem('currentWeek', '1'),
              ]);

              setSeasonSettings({
                isSeasonStarted: false,
                seasonStartDate: '',
                lockedPlayers: [],
              });
              setGameOdds([]);
              setGameResults([]);
              setPlayerPicks([]);
              setTeamResults([]);
              setPlayerPickOdds([]);
              setAccumulatorBets([]);
              setTotalPotData({
                totalPot: 0,
                accumulatorWinnings: 0,
                playerWinnings: 0,
              });
              setKickerBets([]);
              setKickerBetOdds([]);
              setKickerBetResults([]);
              setWeeklyWinners([]);
              setOddsLockStates([]);
              setCurrentWeek(1);

              Alert.alert('Success', 'Season reset successfully');
            } catch (error) {
              console.error('Error resetting season:', error);
              Alert.alert('Error', 'Failed to reset season');
            }
          },
        },
      ]
    );
  };

  const toggleTeamResult = async (teamName: string) => {
    const existingResult = teamResults.find(
      result => result.teamName === teamName && result.week === currentWeek
    );

    let updatedTeamResults;
    if (existingResult) {
      // Toggle the existing result
      updatedTeamResults = teamResults.map(result =>
        result.teamName === teamName && result.week === currentWeek
          ? { ...result, hasWon: !result.hasWon }
          : result
      );
    } else {
      // Add new result as won
      const newResult: TeamResult = {
        teamName,
        hasWon: true,
        week: currentWeek,
      };
      updatedTeamResults = [...teamResults, newResult];
    }

    setTeamResults(updatedTeamResults);
    await saveTeamResults(updatedTeamResults);
    
    // Update accumulator results for current week
    const updatedAccumulatorBets = [...accumulatorBets];
    let accumulatorsUpdated = false;
    
    updatedAccumulatorBets.forEach(bet => {
      if (bet.week === currentWeek && bet.teams.includes(teamName)) {
        const { isWon, actualWinnings } = checkAccumulatorResult(bet, updatedTeamResults);
        bet.isWon = isWon;
        bet.actualWinnings = actualWinnings;
        accumulatorsUpdated = true;
        console.log(`Updated accumulator ${bet.type} due to ${teamName} result change: isWon=${isWon}, actualWinnings=${actualWinnings}`);
      }
    });
    
    if (accumulatorsUpdated) {
      setAccumulatorBets(updatedAccumulatorBets);
      await saveAccumulatorBets(updatedAccumulatorBets);
    }
    
    console.log(`Team ${teamName} result toggled`);
  };

  const getTeamResult = (teamName: string): boolean | null => {
    const result = teamResults.find(
      result => result.teamName === teamName && result.week === currentWeek
    );
    return result ? result.hasWon : null;
  };

  const updateIndividualOdds = async (playerName: string, teamName: string, oddsFraction: string) => {
    if (!oddsFraction.trim()) {
      // Remove odds if empty
      const updatedOdds = playerPickOdds.filter(
        odds => !(odds.playerName === playerName && odds.teamName === teamName && odds.week === currentWeek)
      );
      setPlayerPickOdds(updatedOdds);
      await savePlayerPickOdds(updatedOdds);
      return;
    }

    const decimalOdds = parseFraction(oddsFraction);
    if (decimalOdds <= 0) {
      Alert.alert('Error', 'Invalid odds format. Use fractions like 5/1 or decimals like 2.5');
      return;
    }

    const existingOddsIndex = playerPickOdds.findIndex(
      odds => odds.playerName === playerName && odds.teamName === teamName && odds.week === currentWeek
    );

    let updatedOdds;
    if (existingOddsIndex >= 0) {
      // Update existing odds
      updatedOdds = [...playerPickOdds];
      updatedOdds[existingOddsIndex] = {
        playerName,
        teamName,
        odds: decimalOdds,
        oddsFraction: oddsFraction.trim(),
        week: currentWeek,
      };
    } else {
      // Add new odds
      const newOdds: PlayerPickOdds = {
        playerName,
        teamName,
        odds: decimalOdds,
        oddsFraction: oddsFraction.trim(),
        week: currentWeek,
      };
      updatedOdds = [...playerPickOdds, newOdds];
    }

    setPlayerPickOdds(updatedOdds);
    await savePlayerPickOdds(updatedOdds);
    
    // Update accumulator potential winnings for current week
    const updatedAccumulatorBets = [...accumulatorBets];
    let accumulatorsUpdated = false;
    
    updatedAccumulatorBets.forEach(bet => {
      if (bet.week === currentWeek && bet.teams.includes(teamName)) {
        // Recalculate potential winnings with updated odds
        bet.potentialWinnings = calculateAccumulatorWinnings(bet.teams, bet.stake, currentWeek);
        
        // Also update actual winnings if the bet is already determined
        const { isWon, actualWinnings } = checkAccumulatorResult(bet);
        bet.isWon = isWon;
        bet.actualWinnings = actualWinnings;
        accumulatorsUpdated = true;
        console.log(`Updated accumulator ${bet.type} due to odds change for ${teamName}: potentialWinnings=${bet.potentialWinnings}, actualWinnings=${actualWinnings}`);
      }
    });
    
    if (accumulatorsUpdated) {
      setAccumulatorBets(updatedAccumulatorBets);
      await saveAccumulatorBets(updatedAccumulatorBets);
    }
    
    console.log(`Updated odds for ${playerName} - ${teamName}: ${oddsFraction}`);
  };

  const getPlayerPickOdds = (playerName: string, teamName: string): string => {
    const odds = playerPickOdds.find(
      odds => odds.playerName === playerName && odds.teamName === teamName && odds.week === currentWeek
    );
    return odds ? odds.oddsFraction : '';
  };

  const getIndividualOddsInputKey = (playerName: string, teamName: string): string => {
    return `${playerName}-${teamName}-${currentWeek}`;
  };

  const updateIndividualOddsInput = (playerName: string, teamName: string, value: string) => {
    const key = getIndividualOddsInputKey(playerName, teamName);
    setIndividualOddsInputs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getIndividualOddsInputValue = (playerName: string, teamName: string): string => {
    const key = getIndividualOddsInputKey(playerName, teamName);
    return individualOddsInputs[key] || getPlayerPickOdds(playerName, teamName);
  };

  // Kicker Bet functions
  const updateKickerBetOdds = async (playerName: string, oddsFraction: string) => {
    if (!oddsFraction.trim()) {
      // Remove odds if empty
      const updatedOdds = kickerBetOdds.filter(
        odds => !(odds.playerName === playerName && odds.week === currentWeek)
      );
      setKickerBetOdds(updatedOdds);
      await saveKickerBetOdds(updatedOdds);
      return;
    }

    const decimalOdds = parseFraction(oddsFraction);
    if (decimalOdds <= 0) {
      Alert.alert('Error', 'Invalid odds format. Use fractions like 5/1 or decimals like 2.5');
      return;
    }

    const existingOddsIndex = kickerBetOdds.findIndex(
      odds => odds.playerName === playerName && odds.week === currentWeek
    );

    let updatedOdds;
    if (existingOddsIndex >= 0) {
      // Update existing odds
      updatedOdds = [...kickerBetOdds];
      updatedOdds[existingOddsIndex] = {
        playerName,
        odds: decimalOdds,
        oddsFraction: oddsFraction.trim(),
        week: currentWeek,
      };
    } else {
      // Add new odds
      const newOdds: KickerBetOdds = {
        playerName,
        odds: decimalOdds,
        oddsFraction: oddsFraction.trim(),
        week: currentWeek,
      };
      updatedOdds = [...kickerBetOdds, newOdds];
    }

    setKickerBetOdds(updatedOdds);
    await saveKickerBetOdds(updatedOdds);
    console.log(`Updated KB odds for ${playerName}: ${oddsFraction}`);
  };

  const getKickerBetOdds = (playerName: string): string => {
    const odds = kickerBetOdds.find(
      odds => odds.playerName === playerName && odds.week === currentWeek
    );
    return odds ? odds.oddsFraction : '';
  };

  const getKickerBetOddsInputKey = (playerName: string): string => {
    return `kb-${playerName}-${currentWeek}`;
  };

  const updateKickerBetOddsInput = (playerName: string, value: string) => {
    const key = getKickerBetOddsInputKey(playerName);
    setKickerBetOddsInputs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getKickerBetOddsInputValue = (playerName: string): string => {
    const key = getKickerBetOddsInputKey(playerName);
    return kickerBetOddsInputs[key] || getKickerBetOdds(playerName);
  };

  const submitKickerBetResult = async () => {
    if (!actualHomeScore.trim() || !actualAwayScore.trim()) {
      Alert.alert('Error', 'Please enter both home and away scores');
      return;
    }

    const homeScoreNum = parseInt(actualHomeScore.trim());
    const awayScoreNum = parseInt(actualAwayScore.trim());

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      Alert.alert('Error', 'Please enter valid scores (0 or higher)');
      return;
    }

    const currentKB = kickerBets.find(kb => kb.week === currentWeek);
    if (!currentKB) {
      Alert.alert('Error', 'No Kicker Bet found for this week');
      return;
    }

    // Find winners (players who predicted the exact score)
    const winners = currentKB.predictions
      .filter(p => p.homeScore === homeScoreNum && p.awayScore === awayScoreNum)
      .map(p => p.playerName);

    const newResult: KickerBetResult = {
      week: currentWeek,
      actualHomeScore: homeScoreNum,
      actualAwayScore: awayScoreNum,
      winners,
    };

    // Update or add result
    const existingResultIndex = kickerBetResults.findIndex(r => r.week === currentWeek);
    let updatedResults;
    if (existingResultIndex >= 0) {
      updatedResults = [...kickerBetResults];
      updatedResults[existingResultIndex] = newResult;
    } else {
      updatedResults = [...kickerBetResults, newResult];
    }

    setKickerBetResults(updatedResults);
    await saveKickerBetResults(updatedResults);

    setActualHomeScore('');
    setActualAwayScore('');

    const winnerText = winners.length > 0 ? `Winners: ${winners.join(', ')}` : 'No winners this week';
    Alert.alert('Success', `Kicker Bet result saved!\n\nActual Score: ${homeScoreNum} - ${awayScoreNum}\n${winnerText}`);
  };

  // Check if all conditions are met to advance to next week
  const canAdvanceToNextWeek = (): boolean => {
    // 1. Check if odds are locked
    const currentWeekLockState = oddsLockStates.find(state => state.week === currentWeek);
    if (!currentWeekLockState?.isLocked) {
      return false;
    }

    // 2. Check if KB scoreline has been input (if there's a KB for this week)
    const currentKB = kickerBets.find(kb => kb.week === currentWeek);
    if (currentKB) {
      const currentKBResult = kickerBetResults.find(r => r.week === currentWeek);
      if (!currentKBResult) {
        return false;
      }
    }

    // 3. Check if all players' weekly picks have had results updated
    const currentWeekPicks = playerPicks.filter(pick => pick.week === currentWeek);
    const allTeamsFromPicks = new Set<string>();
    currentWeekPicks.forEach(pick => {
      allTeamsFromPicks.add(pick.team1);
      allTeamsFromPicks.add(pick.team2);
    });

    // Check if all teams have results
    for (const teamName of allTeamsFromPicks) {
      const teamResult = teamResults.find(r => r.teamName === teamName && r.week === currentWeek);
      if (!teamResult) {
        return false;
      }
    }

    return true;
  };

  const nextWeek = async () => {
    if (!canAdvanceToNextWeek()) {
      Alert.alert(
        'Cannot Advance',
        'Please ensure all of the following are completed before advancing:\n\n' +
        '• All odds are locked\n' +
        '• KB scoreline has been input (if applicable)\n' +
        '• All players\' weekly picks have had results updated'
      );
      return;
    }

    const newWeek = currentWeek + 1;
    
    // Automatically determine and set the weekly winner for the current week (before advancing)
    const existingWinner = weeklyWinners.find(w => w.week === currentWeek);
    
    if (!existingWinner) {
      // Calculate the top player from the current week's leaderboard
      const weekPicks = playerPicks.filter(pick => pick.week === currentWeek);
      const allPlayers = Array.from(new Set(weekPicks.map(pick => pick.playerName)));

      console.log(`Calculating weekly winner for Week ${currentWeek}...`);
      console.log(`Found ${weekPicks.length} picks from ${allPlayers.length} players`);

      const weeklyStats = allPlayers.map(playerName => {
        const pick = weekPicks.find(p => p.playerName === playerName);
        
        if (!pick) {
          return {
            playerName,
            weeklyEarnings: 0,
          };
        }

        // Get team results
        const team1Result = teamResults.find(r => r.teamName === pick.team1 && r.week === currentWeek);
        const team2Result = teamResults.find(r => r.teamName === pick.team2 && r.week === currentWeek);

        const team1Won = team1Result?.hasWon === true;
        const team2Won = team2Result?.hasWon === true;

        console.log(`${playerName}: ${pick.team1} (${team1Won ? 'WON' : 'LOST'}) + ${pick.team2} (${team2Won ? 'WON' : 'LOST'})`);

        // Calculate regular bet earnings
        let weeklyEarnings = 0;

        if (team1Won && team2Won) {
          // Double win - calculate earnings using individual odds
          const team1Odds = playerPickOdds.find(o => 
            o.playerName === playerName && 
            o.teamName === pick.team1 && 
            o.week === currentWeek
          );
          const team2Odds = playerPickOdds.find(o => 
            o.playerName === playerName && 
            o.teamName === pick.team2 && 
            o.week === currentWeek
          );

          if (team1Odds && team2Odds) {
            weeklyEarnings = 5 * team1Odds.odds * team2Odds.odds;
            console.log(`${playerName} double win: £5 * ${team1Odds.odds} * ${team2Odds.odds} = £${weeklyEarnings.toFixed(2)}`);
          }
        }

        // Check Kicker Bet winnings
        const kbResult = kickerBetResults.find(r => r.week === currentWeek);
        if (kbResult && kbResult.winners.includes(playerName)) {
          const kbOdds = kickerBetOdds.find(o => 
            o.playerName === playerName && o.week === currentWeek
          );
          if (kbOdds) {
            const kbWinnings = 1 * kbOdds.odds; // £1 stake
            weeklyEarnings += kbWinnings;
            console.log(`${playerName} KB win: £1 * ${kbOdds.odds} = £${kbWinnings.toFixed(2)}`);
          }
        }

        return {
          playerName,
          weeklyEarnings,
        };
      });

      // Sort by weekly earnings (descending) to find the top player
      weeklyStats.sort((a, b) => b.weeklyEarnings - a.weeklyEarnings);

      console.log(`Week ${currentWeek} leaderboard:`, weeklyStats.map(p => `${p.playerName}: £${p.weeklyEarnings.toFixed(2)}`));

      if (weeklyStats.length > 0 && weeklyStats[0].weeklyEarnings > 0) {
        // Check for ties at the top
        const topEarnings = weeklyStats[0].weeklyEarnings;
        const topPlayers = weeklyStats.filter(p => p.weeklyEarnings === topEarnings);
        
        if (topPlayers.length > 1) {
          console.log(`Tie detected for Week ${currentWeek} top position:`, topPlayers.map(p => p.playerName));
          // In case of a tie, take the first player alphabetically
          topPlayers.sort((a, b) => a.playerName.localeCompare(b.playerName));
        }
        
        // Automatically set the top player as the weekly winner
        const topPlayer = topPlayers[0];
        const newWinner: WeeklyWinner = {
          week: currentWeek,
          playerName: topPlayer.playerName,
          earnings: topPlayer.weeklyEarnings,
        };

        const updatedWinners = [...weeklyWinners, newWinner];
        setWeeklyWinners(updatedWinners);
        await saveWeeklyWinners(updatedWinners);

        console.log(`Automatically set weekly winner for Week ${currentWeek}: ${topPlayer.playerName} with £${topPlayer.weeklyEarnings.toFixed(2)}${topPlayers.length > 1 ? ' (tie-breaker: alphabetical)' : ''}`);
      } else {
        console.log(`No valid winner found for Week ${currentWeek} - no players with earnings > 0`);
      }
    }
    
    setCurrentWeek(newWeek);
    await saveCurrentWeek(newWeek);
    // Clear form inputs for new week
    setIndividualOddsInputs({});
    setKickerBetOddsInputs({});
    setActualHomeScore('');
    setActualAwayScore('');
    Alert.alert('Success', `Advanced to Week ${newWeek}\n\nWeekly winner automatically determined from leaderboard.`);
  };

  const toggleOddsLock = async () => {
    const currentWeekLockState = oddsLockStates.find(state => state.week === currentWeek);
    const isCurrentlyLocked = currentWeekLockState?.isLocked || false;

    if (isCurrentlyLocked) {
      Alert.alert('Info', 'Odds are already locked for this week');
      return;
    }

    Alert.alert(
      'Lock Odds',
      'This will lock all odds input boxes and prevent team removal from accumulators for this week. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock Odds',
          style: 'destructive',
          onPress: async () => {
            const updatedLockStates = [...oddsLockStates];
            const existingStateIndex = updatedLockStates.findIndex(state => state.week === currentWeek);
            
            if (existingStateIndex >= 0) {
              updatedLockStates[existingStateIndex].isLocked = true;
            } else {
              updatedLockStates.push({ week: currentWeek, isLocked: true });
            }

            setOddsLockStates(updatedLockStates);
            await saveOddsLockStates(updatedLockStates);
            
            Alert.alert('Success', `Odds locked for Week ${currentWeek}. No further changes can be made to odds or accumulator teams.`);
          },
        },
      ]
    );
  };

  const isOddsLocked = (): boolean => {
    const currentWeekLockState = oddsLockStates.find(state => state.week === currentWeek);
    return currentWeekLockState?.isLocked || false;
  };

  // Get current week picks and kicker bet
  const currentWeekPicks = playerPicks.filter(pick => pick.week === currentWeek);
  const currentWeekAccumulators = accumulatorBets.filter(bet => bet.week === currentWeek);
  const currentKickerBet = kickerBets.find(kb => kb.week === currentWeek);
  const currentKickerBetResult = kickerBetResults.find(r => r.week === currentWeek);

  // Check if KB winner is already set for previous week
  const previousWeekWinner = weeklyWinners.find(w => w.week === currentWeek - 1);

  // Check if KB result has been submitted for current week (to hide the button)
  const isKBResultSubmitted = currentKickerBetResult !== undefined;

  // Group players with their picks and KB predictions
  const consolidatedPlayerData = seasonSettings.lockedPlayers.map(playerName => {
    const playerPick = currentWeekPicks.find(pick => pick.playerName === playerName);
    const playerKBPrediction = currentKickerBet?.predictions.find(pred => pred.playerName === playerName);
    
    return {
      playerName,
      weeklyPick: playerPick,
      kickerBetPrediction: playerKBPrediction,
    };
  });

  const oddsLocked = isOddsLocked();
  const canAdvance = canAdvanceToNextWeek();

  return (
    <RoleGuard requiredRole="admin" fallbackMessage="Only administrators can access the admin panel.">
      <View style={styles.safeContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerWithLogo}>
          <Image
            source={require('../assets/images/60e1ffea-4aeb-4101-9cc0-52f16abfc277.png')}
            style={styles.scrollableLogo}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Admin</Text>
          </View>
        </View>
        
        <Text style={styles.statusText}>
          Week {currentWeek} | {seasonSettings.isSeasonStarted ? '🟢 Active' : '🔴 Not Started'}
          {oddsLocked && ' | 🔒 Odds Locked'}
        </Text>

        {/* Consolidated Player Predictions & Odds - Removed the title completely */}
        {seasonSettings.isSeasonStarted && consolidatedPlayerData.length > 0 && (
          <>
            {consolidatedPlayerData.map((playerData, index) => (
              <View key={index} style={styles.consolidatedPlayerCard}>
                <Text style={styles.playerNameHeader}>
                  {playerData.playerName}
                  {playerData.weeklyPick?.isLate && <Text style={styles.lateFlag}> (Late)</Text>}
                  {playerData.kickerBetPrediction?.isLate && <Text style={styles.lateFlag}> (KB Late)</Text>}
                </Text>

                {/* Weekly Picks Section */}
                <View style={styles.weeklyPicksSection}>
                  {playerData.weeklyPick ? (
                    <>
                      {/* Won/Lost Headers - Only show once for both picks */}
                      <View style={styles.checkboxContainer}>
                        <View style={{ flex: 1 }} />
                        <View style={styles.checkboxColumn}>
                          <Text style={styles.checkboxHeader}>Won</Text>
                        </View>
                        <View style={styles.checkboxColumn}>
                          <Text style={styles.checkboxHeader}>Lost</Text>
                        </View>
                      </View>

                      {/* Team 1 Row */}
                      <View style={styles.teamPickRow}>
                        <Text style={styles.teamName}>{playerData.weeklyPick.team1}</Text>
                        <Text style={styles.oddsLabel}>Odds:</Text>
                        <TextInput
                          style={oddsLocked ? styles.lockedOddsInput : styles.compactOddsInput}
                          placeholder="5/1"
                          placeholderTextColor="#666666"
                          value={getIndividualOddsInputValue(playerData.playerName, playerData.weeklyPick.team1)}
                          onChangeText={(value) => updateIndividualOddsInput(playerData.playerName, playerData.weeklyPick.team1, value)}
                          onBlur={() => {
                            if (!oddsLocked) {
                              const value = getIndividualOddsInputValue(playerData.playerName, playerData.weeklyPick.team1);
                              updateIndividualOdds(playerData.playerName, playerData.weeklyPick.team1, value);
                            }
                          }}
                          editable={!oddsLocked}
                          keyboardType="numeric"
                        />
                        {getPlayerPickOdds(playerData.playerName, playerData.weeklyPick.team1) && (
                          <Text style={styles.currentOddsText}>
                            ({getPlayerPickOdds(playerData.playerName, playerData.weeklyPick.team1)})
                          </Text>
                        )}
                        <View style={styles.checkboxContainer}>
                          <TouchableOpacity
                            style={[
                              styles.checkbox,
                              getTeamResult(playerData.weeklyPick.team1) === true && styles.checkboxChecked,
                            ]}
                            onPress={() => toggleTeamResult(playerData.weeklyPick.team1)}
                          >
                            {getTeamResult(playerData.weeklyPick.team1) === true && (
                              <Text style={styles.checkboxText}>✓</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.checkbox,
                              getTeamResult(playerData.weeklyPick.team1) === false && styles.checkboxLost,
                            ]}
                            onPress={async () => {
                              const currentResult = getTeamResult(playerData.weeklyPick.team1);
                              let updatedTeamResults;
                              
                              if (currentResult === false) {
                                // If already marked as lost, remove the result
                                updatedTeamResults = teamResults.filter(
                                  result => !(result.teamName === playerData.weeklyPick.team1 && result.week === currentWeek)
                                );
                              } else {
                                // Mark as lost
                                updatedTeamResults = teamResults.map(result =>
                                  result.teamName === playerData.weeklyPick.team1 && result.week === currentWeek
                                    ? { ...result, hasWon: false }
                                    : result
                                );
                                if (!teamResults.find(r => r.teamName === playerData.weeklyPick.team1 && r.week === currentWeek)) {
                                  updatedTeamResults.push({
                                    teamName: playerData.weeklyPick.team1,
                                    hasWon: false,
                                    week: currentWeek,
                                  });
                                }
                              }
                              
                              setTeamResults(updatedTeamResults);
                              await saveTeamResults(updatedTeamResults);
                              
                              // Update accumulator results
                              const updatedAccumulatorBets = [...accumulatorBets];
                              let accumulatorsUpdated = false;
                              
                              updatedAccumulatorBets.forEach(bet => {
                                if (bet.week === currentWeek && bet.teams.includes(playerData.weeklyPick.team1)) {
                                  const { isWon, actualWinnings } = checkAccumulatorResult(bet, updatedTeamResults);
                                  bet.isWon = isWon;
                                  bet.actualWinnings = actualWinnings;
                                  accumulatorsUpdated = true;
                                }
                              });
                              
                              if (accumulatorsUpdated) {
                                setAccumulatorBets(updatedAccumulatorBets);
                                await saveAccumulatorBets(updatedAccumulatorBets);
                              }
                            }}
                          >
                            {getTeamResult(playerData.weeklyPick.team1) === false && (
                              <Text style={styles.checkboxTextLost}>✗</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Team 2 Row */}
                      <View style={styles.teamPickRow}>
                        <Text style={styles.teamName}>{playerData.weeklyPick.team2}</Text>
                        <Text style={styles.oddsLabel}>Odds:</Text>
                        <TextInput
                          style={oddsLocked ? styles.lockedOddsInput : styles.compactOddsInput}
                          placeholder="3/1"
                          placeholderTextColor="#666666"
                          value={getIndividualOddsInputValue(playerData.playerName, playerData.weeklyPick.team2)}
                          onChangeText={(value) => updateIndividualOddsInput(playerData.playerName, playerData.weeklyPick.team2, value)}
                          onBlur={() => {
                            if (!oddsLocked) {
                              const value = getIndividualOddsInputValue(playerData.playerName, playerData.weeklyPick.team2);
                              updateIndividualOdds(playerData.playerName, playerData.weeklyPick.team2, value);
                            }
                          }}
                          editable={!oddsLocked}
                          keyboardType="numeric"
                        />
                        {getPlayerPickOdds(playerData.playerName, playerData.weeklyPick.team2) && (
                          <Text style={styles.currentOddsText}>
                            ({getPlayerPickOdds(playerData.playerName, playerData.weeklyPick.team2)})
                          </Text>
                        )}
                        <View style={styles.checkboxContainer}>
                          <TouchableOpacity
                            style={[
                              styles.checkbox,
                              getTeamResult(playerData.weeklyPick.team2) === true && styles.checkboxChecked,
                            ]}
                            onPress={() => toggleTeamResult(playerData.weeklyPick.team2)}
                          >
                            {getTeamResult(playerData.weeklyPick.team2) === true && (
                              <Text style={styles.checkboxText}>✓</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.checkbox,
                              getTeamResult(playerData.weeklyPick.team2) === false && styles.checkboxLost,
                            ]}
                            onPress={async () => {
                              const currentResult = getTeamResult(playerData.weeklyPick.team2);
                              let updatedTeamResults;
                              
                              if (currentResult === false) {
                                // If already marked as lost, remove the result
                                updatedTeamResults = teamResults.filter(
                                  result => !(result.teamName === playerData.weeklyPick.team2 && result.week === currentWeek)
                                );
                              } else {
                                // Mark as lost
                                updatedTeamResults = teamResults.map(result =>
                                  result.teamName === playerData.weeklyPick.team2 && result.week === currentWeek
                                    ? { ...result, hasWon: false }
                                    : result
                                );
                                if (!teamResults.find(r => r.teamName === playerData.weeklyPick.team2 && r.week === currentWeek)) {
                                  updatedTeamResults.push({
                                    teamName: playerData.weeklyPick.team2,
                                    hasWon: false,
                                    week: currentWeek,
                                  });
                                }
                              }
                              
                              setTeamResults(updatedTeamResults);
                              await saveTeamResults(updatedTeamResults);
                              
                              // Update accumulator results
                              const updatedAccumulatorBets = [...accumulatorBets];
                              let accumulatorsUpdated = false;
                              
                              updatedAccumulatorBets.forEach(bet => {
                                if (bet.week === currentWeek && bet.teams.includes(playerData.weeklyPick.team2)) {
                                  const { isWon, actualWinnings } = checkAccumulatorResult(bet, updatedTeamResults);
                                  bet.isWon = isWon;
                                  bet.actualWinnings = actualWinnings;
                                  accumulatorsUpdated = true;
                                }
                              });
                              
                              if (accumulatorsUpdated) {
                                setAccumulatorBets(updatedAccumulatorBets);
                                await saveAccumulatorBets(updatedAccumulatorBets);
                              }
                            }}
                          >
                            {getTeamResult(playerData.weeklyPick.team2) === false && (
                              <Text style={styles.checkboxTextLost}>✗</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noPicksText}>
                      No weekly picks submitted yet
                    </Text>
                  )}
                </View>

                {/* Kicker Bet Section - Consolidated onto one line */}
                <View style={styles.kickerBetSection}>
                  {playerData.kickerBetPrediction ? (
                    <View style={styles.kbSingleLineRow}>
                      <Text style={styles.kbPredictionText}>
                        KB: {playerData.kickerBetPrediction.homeScore} - {playerData.kickerBetPrediction.awayScore}
                      </Text>
                      <View style={styles.kbOddsAndWonContainer}>
                        <Text style={styles.oddsLabel}>Odds:</Text>
                        <TextInput
                          style={oddsLocked ? styles.lockedKBOddsInput : styles.narrowKBOddsInput}
                          placeholder="10/1"
                          placeholderTextColor="#666666"
                          value={getKickerBetOddsInputValue(playerData.playerName)}
                          onChangeText={(value) => updateKickerBetOddsInput(playerData.playerName, value)}
                          onBlur={() => {
                            if (!oddsLocked) {
                              const value = getKickerBetOddsInputValue(playerData.playerName);
                              updateKickerBetOdds(playerData.playerName, value);
                            }
                          }}
                          editable={!oddsLocked}
                          keyboardType="numeric"
                        />
                        <View style={styles.kbWonContainer}>
                          <Text style={styles.kbWonLabel}>Won</Text>
                          <TouchableOpacity
                            style={[
                              styles.checkbox,
                              currentKickerBetResult?.winners.includes(playerData.playerName) && styles.checkboxChecked,
                            ]}
                            onPress={() => {
                              Alert.alert('Info', 'Use the actual score input in the KB Management section below to determine winners automatically');
                            }}
                          >
                            {currentKickerBetResult?.winners.includes(playerData.playerName) && (
                              <Text style={styles.checkboxText}>✓</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.noPicksText}>
                      No KB prediction submitted yet
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {/* Lock Odds Button */}
            <TouchableOpacity
              style={oddsLocked ? styles.lockedOddsButton : styles.lockOddsButton}
              onPress={toggleOddsLock}
              disabled={oddsLocked}
            >
              <Text style={oddsLocked ? styles.lockedOddsButtonText : styles.lockOddsButtonText}>
                {oddsLocked ? '🔒 Odds Locked' : '🔒 Lock All Odds'}
              </Text>
            </TouchableOpacity>

            {oddsLocked && (
              <Text style={styles.lockedText}>
                All odds are locked for Week {currentWeek}. Team removal from accumulators is also disabled.
              </Text>
            )}

            {!canAdvance && (
              <Text style={[styles.lockedText, { color: colors.error }]}>
                Complete all requirements before advancing: Lock odds, input KB score (if applicable), and update all team results.
              </Text>
            )}
          </>
        )}

        {/* KB Management Section - Below the main predictions with contained input boxes */}
        {seasonSettings.isSeasonStarted && currentKickerBet && (
          <>
            <Text style={styles.sectionTitle}>KB Management</Text>
            <View style={styles.kickerBetManagementCard}>
              <Text style={styles.kickerBetManagementTitle}>🎯 {currentKickerBet.selectedMatch}</Text>
              <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 16 }]}>
                Selected by: {currentKickerBet.selectedBy}
              </Text>

              {/* Actual Score Input - Only show if KB result hasn't been submitted */}
              {!isKBResultSubmitted && (
                <>
                  <Text style={[commonStyles.text, { marginBottom: 8 }]}>
                    Enter Actual Match Score:
                  </Text>
                  <View style={styles.scoreRow}>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="Home"
                      placeholderTextColor="#666666"
                      value={actualHomeScore}
                      onChangeText={setActualHomeScore}
                      keyboardType="numeric"
                    />
                    <Text style={styles.vsText}>-</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="Away"
                      placeholderTextColor="#666666"
                      value={actualAwayScore}
                      onChangeText={setActualAwayScore}
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.setKBResultButton}
                    onPress={submitKickerBetResult}
                  >
                    <Text style={styles.setKBResultButtonText}>Set KB Result</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Show current result */}
              {currentKickerBetResult && (
                <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.background, borderRadius: 8 }}>
                  <Text style={[commonStyles.text, { fontWeight: 'bold' }]}>
                    Result: {currentKickerBetResult.actualHomeScore} - {currentKickerBetResult.actualAwayScore}
                  </Text>
                  <Text style={commonStyles.text}>
                    Winners: {currentKickerBetResult.winners.length > 0 ? currentKickerBetResult.winners.join(', ') : 'None'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Accumulator Bets Display */}
        {seasonSettings.isSeasonStarted && (
          <>
            <Text style={styles.sectionTitle}>Acca Management</Text>
            <View style={styles.compactCard}>
              {/* Generate Accumulator Bets Button */}
              <TouchableOpacity
                style={styles.combinedSubmitButton}
                onPress={generateAccumulatorBets}
              >
                <Text style={styles.combinedSubmitText}>Generate/Update Accumulators</Text>
              </TouchableOpacity>
              
              {currentWeekAccumulators.length > 0 && currentWeekAccumulators.map((bet, betIndex) => (
                <View key={betIndex} style={styles.accumulatorCard}>
                  <Text style={styles.accumulatorTitle}>
                    {bet.type === 'max-acca' ? 'Max Acca' : '1st Pick Acca'}
                  </Text>
                  <Text style={styles.accumulatorText}>
                    Stake: £{bet.stake.toFixed(2)}
                  </Text>
                  <Text style={styles.accumulatorText}>
                    Potential Winnings: £{bet.potentialWinnings.toFixed(2)}
                  </Text>
                  {bet.isWon !== null && (
                    <Text style={[styles.accumulatorText, { 
                      color: bet.isWon === true ? colors.success : colors.error 
                    }]}>
                      Status: {bet.isWon === true ? 'WON' : 'LOST'}
                    </Text>
                  )}
                  {bet.isWon === true && (
                    <Text style={[styles.accumulatorText, { color: colors.success, fontWeight: 'bold' }]}>
                      Actual Winnings: £{bet.actualWinnings.toFixed(2)} (Added to Total Team Earnings)
                    </Text>
                  )}
                  
                  {/* Teams List with Remove Buttons */}
                  <View style={styles.accumulatorTeamsList}>
                    <Text style={[styles.accumulatorText, { fontWeight: 'bold', marginBottom: 4 }]}>
                      Teams ({bet.teams.length}):
                    </Text>
                    {bet.teams.map((team, teamIndex) => (
                      <View key={teamIndex} style={styles.accumulatorTeamItem}>
                        <Text style={styles.accumulatorTeamName}>{team}</Text>
                        <TouchableOpacity
                          style={oddsLocked ? styles.disabledTeamRemoveButton : styles.teamRemoveButton}
                          onPress={() => {
                            if (!oddsLocked) {
                              removeTeamFromAccumulator(
                                accumulatorBets.findIndex(b => b === bet), 
                                team
                              );
                            }
                          }}
                          disabled={oddsLocked}
                        >
                          <Text style={oddsLocked ? styles.disabledTeamRemoveButtonText : styles.teamRemoveButtonText}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              
              {currentWeekAccumulators.length === 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.noPicksText, { textAlign: 'center', marginBottom: 8 }]}>
                    No accumulator bets generated for this week yet.
                  </Text>
                  <Text style={[styles.noPicksText, { textAlign: 'center', fontSize: 12, fontStyle: 'italic' }]}>
                    Accumulators are automatically created when players submit picks and you input odds.
                    Click the button above to manually generate/update them.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Advance to Next Week Button - Moved above Season Management */}
        {seasonSettings.isSeasonStarted && (
          <TouchableOpacity 
            style={canAdvance ? styles.advanceWeekButton : styles.disabledAdvanceWeekButton} 
            onPress={nextWeek}
            disabled={!canAdvance}
          >
            <Text style={canAdvance ? styles.advanceWeekButtonText : styles.disabledAdvanceWeekButtonText}>
              Advance to Week {currentWeek + 1}
            </Text>
          </TouchableOpacity>
        )}

        {/* Season Management */}
        <Text style={styles.sectionTitle}>Season Management</Text>
        
        {!seasonSettings.isSeasonStarted && (
          <View style={styles.compactCard}>
            <Text style={commonStyles.text}>Add Players:</Text>
            <TextInput
              style={styles.compactPlayerInput}
              placeholder="Player Name"
              placeholderTextColor="#666666"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
            />
            <TouchableOpacity style={styles.combinedSubmitButton} onPress={addPlayerToSeason}>
              <Text style={styles.combinedSubmitText}>Add Player</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Players - Horizontal layout */}
        {seasonSettings.lockedPlayers.length > 0 && (
          <View style={styles.compactCard}>
            <Text style={[commonStyles.text, { marginBottom: 8 }]}>
              Players ({seasonSettings.lockedPlayers.length}):
            </Text>
            <View style={styles.playersHorizontalContainer}>
              {seasonSettings.lockedPlayers.map((player, index) => (
                <View key={index} style={styles.playerItem}>
                  <Text style={{ color: colors.text, fontSize: 12 }}>{player}</Text>
                  {!seasonSettings.isSeasonStarted && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePlayerFromSeason(player)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Season Controls */}
        <View style={styles.compactCard}>
          {!seasonSettings.isSeasonStarted ? (
            <TouchableOpacity 
              style={styles.combinedSubmitButton}
              onPress={startSeason}
            >
              <Text style={styles.combinedSubmitText}>Start Season</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.compactButton, { backgroundColor: '#cc4444' }]}
              onPress={resetSeason}
            >
              <Text style={styles.compactButtonText}>Reset Season</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Debug Info - Moved to bottom, just above Season reset button */}
        {seasonSettings.isSeasonStarted && (
          <View style={styles.debugCard}>
            <Text style={[styles.sectionTitle, { fontSize: 12, marginBottom: 8 }]}>Debug Info</Text>
            <Text style={[styles.noPicksText, { fontSize: 10 }]}>
              Picks this week: {currentWeekPicks.length} | 
              Odds entries: {playerPickOdds.filter(o => o.week === currentWeek).length} | 
              Accumulators: {currentWeekAccumulators.length}
            </Text>
            <Text style={[styles.noPicksText, { fontSize: 10 }]}>
              Teams with results: {teamResults.filter(r => r.week === currentWeek).length}
            </Text>
          </View>
        )}

        {/* Back to Home Button - Now scrolls with content */}
        <TouchableOpacity
          style={styles.backButtonWrapper}
          onPress={() => {
            console.log('Navigating back to home');
            router.back();
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#000000', '#1a4d3a']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </RoleGuard>
  );
}
