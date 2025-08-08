
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { colors } from '../styles/commonStyles';
import Button from '../components/Button';
import { commonStyles, buttonStyles } from '../styles/commonStyles';
import { Text, View, ScrollView, TextInput, Alert, TouchableOpacity, Modal, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleGuard } from '../components/RoleGuard';

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

interface KickerBet {
  week: number;
  selectedMatch: string;
  selectedBy: string; // Previous week's winner
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

interface WeeklyWinner {
  week: number;
  playerName: string;
  earnings: number;
}

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
    justifyContent: 'space-between', // This ensures content spreads out properly
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
    alignItems: 'flex-start', // Move title to the left slightly
    justifyContent: 'center',
    paddingLeft: 20, // Add some left padding to move it left
  },
  pageTitle: {
    fontSize: 30, // Increased from 28 to 30
    fontWeight: '700',
    color: '#d0d0d0', // Changed to match off-white from home screen tiles
    marginBottom: 4,
    letterSpacing: -0.5,
    textAlign: 'left', // Align text to the left
  },
  weeklyPicksTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginVertical: 16,
    marginBottom: 20,
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
    width: 60,
    marginHorizontal: 4,
    textAlign: 'center',
  },
  dropdownButton: {
    backgroundColor: colors.surface,
    borderColor: colors.primary + '50', // Added green outline like KB card
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: '#d0d0d0',
    fontSize: 16,
  },
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    color: '#d0d0d0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  playerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey + '30',
  },
  playerOptionText: {
    color: '#d0d0d0',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.error,
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  closeButtonText: {
    color: '#d0d0d0',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  countdownContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  countdownTitle: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  countdownText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deadlineText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 3,
  },
  latePickText: {
    color: '#d0d0d0',
    fontWeight: 'bold',
  },
  normalPickText: {
    color: '#d0d0d0',
    fontWeight: 'bold',
  },
  latePickTeams: {
    color: colors.textSecondary,
  },
  normalPickTeams: {
    color: colors.textSecondary,
  },
  weeklyPicksCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.primary + '50', // Added green outline like KB card
  },
  kickerBetCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: colors.primary + '50',
    marginHorizontal: 4,
  },
  kickerBetTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  kickerBetSubtitle: {
    color: '#d0d0d0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  scoreLabel: {
    color: '#d0d0d0',
    fontSize: 16,
    marginHorizontal: 8,
  },
  vsText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  predictionItem: {
    backgroundColor: colors.background,
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grey + '30',
  },
  predictionPlayerName: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  predictionScore: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  winnerBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 8,
  },
  winnerText: {
    color: '#d0d0d0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submittedPicksContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  submittedPicksTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  playerPickItem: {
    backgroundColor: colors.background,
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grey + '30',
  },
  playerPickName: {
    color: '#d0d0d0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerPickTeams: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 2,
  },
  playerPickKB: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 2,
  },
  playerPickTimestamp: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  // Updated submit button to match Set KickerBet button styling - made smaller
  combinedSubmitButton: {
    backgroundColor: colors.primary, // Changed to match Set KickerBet button
    borderRadius: 12, // Changed to match Set KickerBet button
    padding: 12, // Reduced from 16 to 12 to make smaller
    marginVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    boxShadow: '0px 4px 12px rgba(0, 255, 136, 0.25)', // Added shadow like Set KickerBet
    elevation: 6, // Added elevation like Set KickerBet
  },
  combinedSubmitText: {
    color: '#000000', // Changed to black text like Set KickerBet button
    fontSize: 16, // Reduced from 18 to 16 to make smaller
    fontWeight: 'bold',
  },
  cardContent: {
    paddingHorizontal: 4,
  },
  playerSelectionPrompt: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  promptText: {
    color: '#d0d0d0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  promptSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  gameweekText: {
    color: '#d0d0d0',
    fontSize: 24, // Increased from 18 to 24
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  seasonNotStartedCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 20, // Move down slightly for better visual appeal in week 1
    marginHorizontal: 4,
  },
  // Back button now scrolls with content - removed fixed positioning
  backButtonContainer: {
    marginTop: 'auto', // This pushes the button to the bottom
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
});

export default function PlayerPicksScreen() {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [playerPicks, setPlayerPicks] = useState<PlayerPick[]>([]);
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings>({
    isSeasonStarted: false,
    seasonStartDate: '',
    lockedPlayers: [],
  });
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [isAfterDeadline, setIsAfterDeadline] = useState(false);

  // Kicker Bet states
  const [kickerBets, setKickerBets] = useState<KickerBet[]>([]);
  const [weeklyWinners, setWeeklyWinners] = useState<WeeklyWinner[]>([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  console.log('PlayerPicksScreen rendered');

  useEffect(() => {
    loadData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextSaturday = getNextSaturdayNoon();
      
      const timeDiff = nextSaturday.getTime() - now.getTime();
      
      // Check if we're in the late submission window (Saturday 12PM to Sunday 12PM)
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const isInLateWindow = (currentDay === 6 && currentHour >= 12) || (currentDay === 0 && currentHour < 12);
      
      if (timeDiff <= 0) {
        setCountdown('Deadline Passed');
        setIsAfterDeadline(isInLateWindow);
      } else {
        setIsAfterDeadline(isInLateWindow);
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const getNextSaturdayNoon = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    let daysUntilSaturday = (6 - currentDay) % 7;
    
    // If it's Saturday and before 12:00 PM, the deadline is today
    if (currentDay === 6 && (currentHour < 12 || (currentHour === 12 && currentMinute === 0))) {
      daysUntilSaturday = 0;
    }
    // If it's Saturday and after 12:00 PM, the deadline is next Saturday
    else if (currentDay === 6 && currentHour >= 12) {
      daysUntilSaturday = 7;
    }
    // If daysUntilSaturday is 0 and it's not Saturday, it means it's Sunday, so next Saturday is 6 days away
    else if (daysUntilSaturday === 0) {
      daysUntilSaturday = 7;
    }
    
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(12, 0, 0, 0); // Set to 12:00 PM
    
    return nextSaturday;
  };

  const isPickLate = (submittedAt: string) => {
    const submissionTime = new Date(submittedAt);
    const submissionDay = submissionTime.getDay();
    const submissionHour = submissionTime.getHours();
    
    // Only flag as late if submitted between midday Saturday and midday Sunday
    if (submissionDay === 6 && submissionHour >= 12) {
      // Saturday after 12 PM - this is late
      return true;
    }
    
    if (submissionDay === 0 && submissionHour < 12) {
      // Sunday before 12 PM - this is late
      return true;
    }
    
    // All other times are not late
    return false;
  };

  const loadData = async () => {
    try {
      const [storedWeek, storedPicks, storedSettings, storedKickerBets, storedWeeklyWinners] = await Promise.all([
        AsyncStorage.getItem('currentWeek'),
        AsyncStorage.getItem('playerPicks'),
        AsyncStorage.getItem('seasonSettings'),
        AsyncStorage.getItem('kickerBets'),
        AsyncStorage.getItem('weeklyWinners'),
      ]);

      if (storedWeek) setCurrentWeek(parseInt(storedWeek));
      if (storedPicks) {
        const picks = JSON.parse(storedPicks);
        // Update late flags for existing picks
        const updatedPicks = picks.map((pick: PlayerPick) => ({
          ...pick,
          isLate: pick.submittedAt ? isPickLate(pick.submittedAt) : false,
        }));
        setPlayerPicks(updatedPicks);
      }
      if (storedSettings) {
        setSeasonSettings(JSON.parse(storedSettings));
      }
      if (storedKickerBets) {
        setKickerBets(JSON.parse(storedKickerBets));
      }
      if (storedWeeklyWinners) {
        setWeeklyWinners(JSON.parse(storedWeeklyWinners));
      }

      console.log('Player picks data loaded');
    } catch (error) {
      console.error('Error loading player picks data:', error);
    }
  };

  const savePicks = async (newPicks: PlayerPick[]) => {
    try {
      await AsyncStorage.setItem('playerPicks', JSON.stringify(newPicks));
      console.log('Player picks saved:', newPicks.length);
      console.log('Current week picks:', newPicks.filter(pick => pick.week === currentWeek));
    } catch (error) {
      console.error('Error saving player picks:', error);
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

  const selectPlayer = (playerName: string) => {
    setSelectedPlayer(playerName);
    setShowPlayerModal(false);
  };

  const submitKickerBetMatch = async () => {
    if (!selectedPlayer) {
      Alert.alert('Error', 'Please select a player');
      return;
    }

    if (!selectedMatch.trim()) {
      Alert.alert('Error', 'Please enter the match for the Kicker Bet');
      return;
    }

    // Check if this player is the previous week's winner
    const previousWeekWinner = weeklyWinners.find(w => w.week === currentWeek - 1);
    if (!previousWeekWinner || previousWeekWinner.playerName !== selectedPlayer) {
      Alert.alert('Error', 'Only the previous week\'s winner can select the Kicker Bet match');
      return;
    }

    // Check if KB match already exists for this week
    const existingKB = kickerBets.find(kb => kb.week === currentWeek);
    if (existingKB) {
      Alert.alert('Error', 'Kicker Bet match has already been selected for this week');
      return;
    }

    const newKickerBet: KickerBet = {
      week: currentWeek,
      selectedMatch: selectedMatch.trim(),
      selectedBy: selectedPlayer,
      predictions: [],
    };

    const updatedKickerBets = [...kickerBets, newKickerBet];
    setKickerBets(updatedKickerBets);
    await saveKickerBets(updatedKickerBets);

    setSelectedMatch('');
    Alert.alert('Success', `Kicker Bet match selected: ${selectedMatch.trim()}\n\nAll players can now submit their score predictions!`);
  };

  const submitCombinedPicks = async () => {
    if (!selectedPlayer) {
      Alert.alert('Error', 'Please select a player');
      return;
    }

    // Validate weekly picks
    if (!team1.trim() || !team2.trim()) {
      Alert.alert('Error', 'Please complete both weekly picks.');
      return;
    }

    if (team1.trim().toLowerCase() === team2.trim().toLowerCase()) {
      Alert.alert('Error', 'Please select two different teams');
      return;
    }

    // For weeks after week 1, validate KB predictions if KB exists
    if (currentWeek > 1) {
      const currentKB = kickerBets.find(kb => kb.week === currentWeek);
      if (currentKB) {
        if (!homeScore.trim() || !awayScore.trim()) {
          Alert.alert('Error', 'Please complete both weekly picks and KickerBet predictions.');
          return;
        }
        
        const homeScoreNum = parseInt(homeScore.trim());
        const awayScoreNum = parseInt(awayScore.trim());
        
        if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
          Alert.alert('Error', 'Please enter valid KB scores (0 or higher)');
          return;
        }
      }
    }

    const submissionTime = new Date().toISOString();
    const isLateSubmission = isPickLate(submissionTime);

    // Check if player already has picks for this week
    const existingPick = playerPicks.find(
      pick => pick.playerName === selectedPlayer && pick.week === currentWeek
    );

    let weeklyPicksMessage = '';
    let kickerBetMessage = '';

    // Handle weekly picks submission
    if (existingPick) {
      const updatedPicks = playerPicks.map(pick =>
        pick.playerName === selectedPlayer && pick.week === currentWeek
          ? { 
              ...pick, 
              team1: team1.trim(), 
              team2: team2.trim(),
              submittedAt: submissionTime,
              isLate: isLateSubmission
            }
          : pick
      );
      setPlayerPicks(updatedPicks);
      await savePicks(updatedPicks);
      weeklyPicksMessage = `Weekly picks updated: ${team1.trim()} + ${team2.trim()}`;
    } else {
      const newPick: PlayerPick = {
        playerName: selectedPlayer,
        team1: team1.trim(),
        team2: team2.trim(),
        week: currentWeek,
        submittedAt: submissionTime,
        isLate: isLateSubmission,
      };

      const updatedPicks = [...playerPicks, newPick];
      setPlayerPicks(updatedPicks);
      await savePicks(updatedPicks);
      weeklyPicksMessage = `Weekly picks submitted: ${team1.trim()} + ${team2.trim()}`;
    }

    // Handle Kicker Bet prediction submission (if applicable)
    const currentKB = kickerBets.find(kb => kb.week === currentWeek);
    if (currentKB && homeScore.trim() && awayScore.trim()) {
      const homeScoreNum = parseInt(homeScore.trim());
      const awayScoreNum = parseInt(awayScore.trim());

      if (!isNaN(homeScoreNum) && !isNaN(awayScoreNum) && homeScoreNum >= 0 && awayScoreNum >= 0) {
        const existingPrediction = currentKB.predictions.find(p => p.playerName === selectedPlayer);

        const newPrediction: KickerBetPrediction = {
          playerName: selectedPlayer,
          homeScore: homeScoreNum,
          awayScore: awayScoreNum,
          week: currentWeek,
          submittedAt: submissionTime,
          isLate: isLateSubmission,
        };

        let updatedKickerBets;
        if (existingPrediction) {
          // Update existing prediction
          updatedKickerBets = kickerBets.map(kb => 
            kb.week === currentWeek 
              ? {
                  ...kb,
                  predictions: kb.predictions.map(p => 
                    p.playerName === selectedPlayer ? newPrediction : p
                  )
                }
              : kb
          );
          kickerBetMessage = `\nKicker Bet prediction updated: ${homeScoreNum} - ${awayScoreNum}`;
        } else {
          // Add new prediction
          updatedKickerBets = kickerBets.map(kb => 
            kb.week === currentWeek 
              ? {
                  ...kb,
                  predictions: [...kb.predictions, newPrediction]
                }
              : kb
          );
          kickerBetMessage = `\nKicker Bet prediction submitted: ${homeScoreNum} - ${awayScoreNum}`;
        }

        setKickerBets(updatedKickerBets);
        await saveKickerBets(updatedKickerBets);
        setHomeScore('');
        setAwayScore('');
      }
    }

    // Clear form
    setTeam1('');
    setTeam2('');

    const lateMessage = isLateSubmission ? '\n\n⚠️ WARNING: These picks were submitted during the late window (Saturday 12PM - Sunday 12PM) and will be flagged as late!' : '';
    
    Alert.alert(
      'Success',
      `${weeklyPicksMessage}${kickerBetMessage}\n\nWeek: ${currentWeek}${lateMessage}`
    );
  };

  // Get current week's kicker bet
  const currentKickerBet = kickerBets.find(kb => kb.week === currentWeek);
  const previousWeekWinner = weeklyWinners.find(w => w.week === currentWeek - 1);
  const isPreviousWeekWinner = previousWeekWinner && selectedPlayer === previousWeekWinner.playerName;

  // Get all submitted picks and KB predictions for display
  const currentWeekPicks = playerPicks.filter(pick => pick.week === currentWeek);
  const currentWeekKBPredictions = currentKickerBet?.predictions || [];

  if (!seasonSettings.isSeasonStarted) {
    return (
      <RoleGuard requiredRole="player" fallbackMessage="Please select your role to access weekly picks.">
        <View style={styles.safeContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerWithLogo}>
              <Image
                source={require('../assets/images/60e1ffea-4aeb-4101-9cc0-52f16abfc277.png')}
                style={styles.scrollableLogo}
              />
              <View style={styles.titleContainer}>
                <Text style={styles.pageTitle}>Weekly Picks</Text>
              </View>
            </View>
            <View style={styles.seasonNotStartedCard}>
              <Text style={styles.statusText}>🔴 Season Not Started</Text>
              <Text style={commonStyles.text}>
                Please wait for the admin to start the season and lock the player list.
              </Text>
            </View>
            
            {/* Countdown Timer */}
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownTitle}>⏰ Deadline: {countdown}</Text>
              {isAfterDeadline && (
                <Text style={[styles.deadlineText, { color: colors.error, fontWeight: 'bold' }]}>
                  ⚠️ Late submission window active
                </Text>
              )}
            </View>
          </View>
          
          {/* Back to Home Button - now scrolls with content */}
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
                colors={['#000000', '#1a4d3a']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Back to Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="player" fallbackMessage="Please select your role to access weekly picks.">
      <View style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerWithLogo}>
            <Image
              source={require('../assets/images/60e1ffea-4aeb-4101-9cc0-52f16abfc277.png')}
              style={styles.scrollableLogo}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.pageTitle}>Weekly Picks</Text>
            </View>
          </View>

          {/* Gameweek Number - Increased size */}
          <Text style={styles.gameweekText}>
            Gameweek {currentWeek}
          </Text>

          {/* Player Selection */}
          <TouchableOpacity
            style={[styles.dropdownButton, { marginHorizontal: 4 }]}
            onPress={() => setShowPlayerModal(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedPlayer || 'Select Player'}
            </Text>
          </TouchableOpacity>

          {/* Show prompt if no player selected */}
          {!selectedPlayer && (
            <View style={styles.playerSelectionPrompt}>
              <Text style={styles.promptText}>👆 Please select a player first</Text>
              <Text style={styles.promptSubtext}>
                Choose your name from the dropdown above to start making your picks
              </Text>
            </View>
          )}

          {/* Only show the following sections if a player is selected */}
          {selectedPlayer && (
            <>
              {/* Regular Team Picks */}
              <View style={styles.weeklyPicksCard}>
                <Text style={[commonStyles.text, { marginBottom: 16 }]}>
                  Select your two teams for this week&apos;s double bet. Both teams must win for you to earn money!
                </Text>

                {/* Team Inputs */}
                <TextInput
                  style={styles.input}
                  placeholder="Team 1"
                  placeholderTextColor={colors.textMuted}
                  value={team1}
                  onChangeText={setTeam1}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Team 2"
                  placeholderTextColor={colors.textMuted}
                  value={team2}
                  onChangeText={setTeam2}
                />
              </View>

              {/* Kicker Bet Section - Now below weekly picks */}
              {currentWeek > 1 && (
                <View style={styles.kickerBetCard}>
                  <Text style={styles.kickerBetTitle}>🎯 Kicker Bet (KB)</Text>
                  
                  {!currentKickerBet && isPreviousWeekWinner && (
                    <>
                      <Text style={[commonStyles.text, { marginBottom: 16 }]}>
                        As the previous week&apos;s winner, please select the match for this week&apos;s Kicker Bet:
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Manchester United vs Liverpool"
                        placeholderTextColor={colors.textMuted}
                        value={selectedMatch}
                        onChangeText={setSelectedMatch}
                      />
                      <Button
                        text="Set KickerBet"
                        onPress={submitKickerBetMatch}
                        style={[buttonStyles.instructionsButton, { marginTop: 8, padding: 12 }]}
                        textStyle={{ fontSize: 16 }}
                      />
                    </>
                  )}

                  {currentKickerBet && (
                    <>
                      <Text style={[commonStyles.text, { marginBottom: 8 }]}>
                        Match: {currentKickerBet.selectedMatch}
                      </Text>
                      <Text style={[commonStyles.text, { fontSize: 12, color: '#d0d0d0', marginBottom: 16 }]}>
                        Selected by: {currentKickerBet.selectedBy}
                      </Text>

                      <Text style={[commonStyles.text, { marginBottom: 8 }]}>Enter your score prediction:</Text>
                      <View style={styles.scoreRow}>
                        <TextInput
                          style={styles.smallInput}
                          placeholder="Home"
                          placeholderTextColor={colors.textMuted}
                          value={homeScore}
                          onChangeText={setHomeScore}
                          keyboardType="numeric"
                        />
                        <Text style={styles.vsText}>-</Text>
                        <TextInput
                          style={styles.smallInput}
                          placeholder="Away"
                          placeholderTextColor={colors.textMuted}
                          value={awayScore}
                          onChangeText={setAwayScore}
                          keyboardType="numeric"
                        />
                      </View>
                    </>
                  )}

                  {!currentKickerBet && !isPreviousWeekWinner && previousWeekWinner && (
                    <Text style={commonStyles.text}>
                      Waiting for {previousWeekWinner.playerName} to select the match for this week&apos;s Kicker Bet...
                    </Text>
                  )}

                  {!currentKickerBet && !previousWeekWinner && (
                    <Text style={commonStyles.text}>
                      Weekly winner will be automatically determined from the leaderboard.
                    </Text>
                  )}
                </View>
              )}

              {/* Combined Submit Button - Updated styling to match Set KickerBet button */}
              <TouchableOpacity
                style={styles.combinedSubmitButton}
                onPress={submitCombinedPicks}
              >
                <Text style={styles.combinedSubmitText}>
                  {currentWeek === 1 ? 'Submit weekly picks' : 'Submit Weekly Picks & KB'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Submitted Picks - Title changed and moved to bottom */}
          <View style={styles.submittedPicksContainer}>
            <Text style={styles.submittedPicksTitle}>Submitted Weekly Picks</Text>
            
            {/* Combine and display all player submissions */}
            {seasonSettings.lockedPlayers.map((playerName) => {
              const playerPick = currentWeekPicks.find(pick => pick.playerName === playerName);
              const playerKBPrediction = currentWeekKBPredictions.find(pred => pred.playerName === playerName);
              
              // Only show if player has submitted either weekly picks or KB prediction
              if (!playerPick && !playerKBPrediction) {
                return null;
              }

              return (
                <View key={playerName} style={styles.playerPickItem}>
                  <Text style={styles.playerPickName}>
                    {playerName} {(playerPick?.isLate || playerKBPrediction?.isLate) ? '(Late)' : ''}
                  </Text>
                  
                  {playerPick && (
                    <Text style={styles.playerPickTeams}>
                      Weekly Picks: {playerPick.team1} + {playerPick.team2}
                    </Text>
                  )}
                  
                  {playerKBPrediction && currentKickerBet && (
                    <Text style={styles.playerPickKB}>
                      KB Prediction: {playerKBPrediction.homeScore} - {playerKBPrediction.awayScore}
                    </Text>
                  )}
                  
                  {(playerPick?.submittedAt || playerKBPrediction?.submittedAt) && (
                    <Text style={styles.playerPickTimestamp}>
                      Submitted: {new Date(
                        playerPick?.submittedAt || playerKBPrediction?.submittedAt || ''
                      ).toLocaleString()}
                    </Text>
                  )}
                </View>
              );
            })}
            
            {currentWeekPicks.length === 0 && currentWeekKBPredictions.length === 0 && (
              <Text style={{ color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
                No picks submitted for this week yet
              </Text>
            )}
          </View>

          {/* Countdown Timer */}
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownTitle}>⏰ Deadline: {countdown}</Text>
            {isAfterDeadline && (
              <Text style={[styles.deadlineText, { color: colors.error, fontWeight: 'bold' }]}>
                ⚠️ Late submission window active
              </Text>
            )}
          </View>
        </View>

        {/* Back to Home Button - now scrolls with content and is always at bottom */}
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
              colors={['#000000', '#1a4d3a']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Player Selection Modal */}
      <Modal
        visible={showPlayerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Player</Text>
            <ScrollView>
              {seasonSettings.lockedPlayers.map((player, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.playerOption}
                  onPress={() => selectPlayer(player)}
                >
                  <Text style={styles.playerOptionText}>{player}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPlayerModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </RoleGuard>
  );
}
