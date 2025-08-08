
import Button from '../components/Button';
import { colors } from '../styles/commonStyles';
import { commonStyles, buttonStyles } from '../styles/commonStyles';
import { Text, View, ScrollView, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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

interface AccumulatorBet {
  week: number;
  type: 'max-acca' | '1st-pick-acca';
  stake: number;
  teams: string[];
  potentialWinnings: number;
  isWon: boolean | null;
  actualWinnings: number;
}

interface DetailedPlayerStats {
  playerName: string;
  totalPicks: number;
  wins: number;
  losses: number;
  winPercentage: number;
  totalEarnings: number;
  regularBetEarnings: number;
  kickerBetEarnings: number;
  kickerBetWins: number;
  kickerBetAttempts: number;
  kickerBetWinPercentage: number;
  weeklyPerformance: { 
    week: number; 
    wins: number; 
    picks: number; 
    earnings: number;
    kickerBetWon: boolean;
    kickerBetEarnings: number;
    totalWeeklyWinnings: number;
  }[];
  favoriteTeams: { team: string; picks: number }[];
  totalSeasonWinnings: number;
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
    paddingBottom: 40,
  },
  headerWithLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d0d0d0',
    marginBottom: 4,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  selectorContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dropdownButton: {
    backgroundColor: colors.surface,
    borderColor: colors.primary + '50',
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownButtonText: {
    color: '#d0d0d0',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerName: {
    color: '#d0d0d0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
    paddingHorizontal: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  statValue: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  weeklyPerformanceContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  weeklyPerformanceTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  weekText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  weekEarnings: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
  },
  favoriteTeamsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.accent + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  favoriteTeamsTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  teamText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  teamPicks: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
  },
  kickerBetSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.accent + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  kickerBetTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
    minHeight: 200,
  },
  noDataText: {
    color: '#d0d0d0',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  selectionPrompt: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: '#d0d0d0',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  playerOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playerOptionText: {
    color: '#d0d0d0',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  closeButtonText: {
    color: '#d0d0d0',
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default function StatsScreen() {
  const [playerPicks, setPlayerPicks] = useState<PlayerPick[]>([]);
  const [gameOdds, setGameOdds] = useState<GameOdds[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [playerPickOdds, setPlayerPickOdds] = useState<PlayerPickOdds[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [detailedStats, setDetailedStats] = useState<DetailedPlayerStats[]>([]);
  const [kickerBetResults, setKickerBetResults] = useState<KickerBetResult[]>([]);
  const [kickerBetOdds, setKickerBetOdds] = useState<KickerBetOdds[]>([]);
  const [accumulatorBets, setAccumulatorBets] = useState<AccumulatorBet[]>([]);

  // New: selection state
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);

  console.log('StatsScreen rendered');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateDetailedStats();
  }, [playerPicks, gameOdds, gameResults, teamResults, playerPickOdds, kickerBetResults, kickerBetOdds, accumulatorBets, currentWeek]);

  // Update available players and default selection when picks change
  useEffect(() => {
    const players = Array.from(new Set(playerPicks.map(p => p.playerName)));
    setAvailablePlayers(players);
    if (!selectedPlayer && players.length > 0) {
      setSelectedPlayer(players[0]);
    }
  }, [playerPicks]);

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

      console.log('Stats data loaded');
    } catch (error) {
      console.error('Error loading stats data:', error);
    }
  };

  const calculateTotalWeeklyWinnings = (week: number) => {
    // Calculate total player earnings for the week
    const weekPicks = playerPicks.filter(pick => pick.week === week);
    let totalPlayerEarnings = 0;

    weekPicks.forEach(pick => {
      const team1Result = teamResults.find(r => r.teamName === pick.team1 && r.week === week);
      const team2Result = teamResults.find(r => r.teamName === pick.team2 && r.week === week);

      const team1Won = team1Result?.hasWon === true;
      const team2Won = team2Result?.hasWon === true;

      if (team1Won && team2Won) {
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
          totalPlayerEarnings += 5 * team1Odds.odds * team2Odds.odds;
        }
      }
    });

    // Add KB winnings for the week
    const kbResult = kickerBetResults.find(r => r.week === week);
    if (kbResult) {
      kbResult.winners.forEach(winnerName => {
        const kbOdds = kickerBetOdds.find(o => 
          o.playerName === winnerName && o.week === week
        );
        if (kbOdds) {
          totalPlayerEarnings += 1 * kbOdds.odds;
        }
      });
    }

    // Add accumulator winnings for the week
    const weekAccumulators = accumulatorBets.filter(bet => bet.week === week && bet.isWon === true);
    const accumulatorWinnings = weekAccumulators.reduce((sum, bet) => sum + bet.actualWinnings, 0);
    
    return totalPlayerEarnings + accumulatorWinnings;
  };

  const calculateDetailedStats = () => {
    console.log('Calculating detailed stats...');
    
    const allPlayers = Array.from(new Set(playerPicks.map(pick => pick.playerName)));

    // Calculate player stats
    const playerStats: DetailedPlayerStats[] = allPlayers.map(playerName => {
      let totalPicks = 0;
      let wins = 0;
      let losses = 0;
      let regularBetEarnings = 0;
      let kickerBetEarnings = 0;
      let kickerBetWins = 0;
      let kickerBetAttempts = 0;
      const weeklyPerformance: { 
        week: number; 
        wins: number; 
        picks: number; 
        earnings: number;
        kickerBetWon: boolean;
        kickerBetEarnings: number;
        totalWeeklyWinnings: number;
      }[] = [];
      const teamCounts: { [team: string]: number } = {};
      let totalSeasonWinnings = 0;

      // Calculate stats for each completed week
      for (let week = 1; week < currentWeek; week++) {
        const weekPick = playerPicks.find(pick => pick.playerName === playerName && pick.week === week);
        let weekWins = 0;
        let weekPicks = 0;
        let weekEarnings = 0;
        let weekKickerBetWon = false;
        let weekKickerBetEarnings = 0;

        if (weekPick) {
          weekPicks = 2; // Always 2 teams per week
          totalPicks += weekPicks;

          // Count team picks for favorites
          teamCounts[weekPick.team1] = (teamCounts[weekPick.team1] || 0) + 1;
          teamCounts[weekPick.team2] = (teamCounts[weekPick.team2] || 0) + 1;

          // Check team results
          const team1Result = teamResults.find(r => r.teamName === weekPick.team1 && r.week === week);
          const team2Result = teamResults.find(r => r.teamName === weekPick.team2 && r.week === week);

          const team1Won = team1Result?.hasWon === true;
          const team2Won = team2Result?.hasWon === true;

          if (team1Won) {
            weekWins++;
            wins++;
          } else if (team1Result?.hasWon === false) {
            losses++;
          }

          if (team2Won) {
            weekWins++;
            wins++;
          } else if (team2Result?.hasWon === false) {
            losses++;
          }

          // Calculate regular bet earnings
          if (team1Won && team2Won) {
            // Double win - calculate earnings using individual odds
            const team1Odds = playerPickOdds.find(o => 
              o.playerName === playerName && 
              o.teamName === weekPick.team1 && 
              o.week === week
            );
            const team2Odds = playerPickOdds.find(o => 
              o.playerName === playerName && 
              o.teamName === weekPick.team2 && 
              o.week === week
            );

            if (team1Odds && team2Odds) {
              const earnings = 5 * team1Odds.odds * team2Odds.odds;
              weekEarnings += earnings;
              regularBetEarnings += earnings;
            }
          }
        }

        // Check Kicker Bet for this week
        const kbResult = kickerBetResults.find(r => r.week === week);
        if (kbResult) {
          kickerBetAttempts++;
          if (kbResult.winners.includes(playerName)) {
            kickerBetWins++;
            weekKickerBetWon = true;
            const kbOdds = kickerBetOdds.find(o => 
              o.playerName === playerName && o.week === week
            );
            if (kbOdds) {
              const kbEarning = 1 * kbOdds.odds; // £1 stake
              weekKickerBetEarnings = kbEarning;
              kickerBetEarnings += kbEarning;
              weekEarnings += kbEarning;
            }
          }
        }

        // Calculate total weekly winnings for this week (including accumulator share)
        const totalWeeklyWinnings = calculateTotalWeeklyWinnings(week);
        totalSeasonWinnings += totalWeeklyWinnings;

        weeklyPerformance.push({
          week,
          wins: weekWins,
          picks: weekPicks,
          earnings: weekEarnings,
          kickerBetWon: weekKickerBetWon,
          kickerBetEarnings: weekKickerBetEarnings,
          totalWeeklyWinnings,
        });
      }

      // Note: Accumulator winnings do NOT contribute to individual player earnings
      const totalEarnings = regularBetEarnings + kickerBetEarnings;
      const winPercentage = totalPicks > 0 ? (wins / totalPicks) * 100 : 0;
      const kickerBetWinPercentage = kickerBetAttempts > 0 ? (kickerBetWins / kickerBetAttempts) * 100 : 0;

      // Get favorite teams (top 5)
      const favoriteTeams = Object.entries(teamCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([team, picks]) => ({ team, picks }));

      return {
        playerName,
        totalPicks,
        wins,
        losses,
        winPercentage,
        totalEarnings,
        regularBetEarnings,
        kickerBetEarnings,
        kickerBetWins,
        kickerBetAttempts,
        kickerBetWinPercentage,
        weeklyPerformance,
        favoriteTeams,
        totalSeasonWinnings,
      };
    });

    // Sort by total earnings
    playerStats.sort((a, b) => b.totalEarnings - a.totalEarnings);

    setDetailedStats(playerStats);

    console.log('Detailed stats calculated');
  };

  const calculateTotalSeasonWinnings = () => {
    let totalSeasonWinnings = 0;
    for (let week = 1; week < currentWeek; week++) {
      totalSeasonWinnings += calculateTotalWeeklyWinnings(week);
    }
    return totalSeasonWinnings;
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
          colors={['#1a4d3a', '#0a0a0a', '#000000']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const selectedStats = selectedPlayer
    ? detailedStats.find(p => p.playerName === selectedPlayer)
    : undefined;

  return (
    <RoleGuard requiredRole="player" fallbackMessage="Please select your role to access player stats.">
      <View style={styles.safeContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerWithLogo}>
            <Image
              source={require('../assets/images/60e1ffea-4aeb-4101-9cc0-52f16abfc277.png')}
              style={styles.scrollableLogo}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.pageTitle}>Player Stats</Text>
            </View>
          </View>

          {/* Player selection button */}
          <View style={styles.selectorContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowPlayerModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedPlayer || 'Select Player'}
              </Text>
            </TouchableOpacity>

            {!selectedPlayer && (
              <View style={styles.selectionPrompt}>
                <Text style={commonStyles.text}>
                  Choose a player above to view their detailed statistics.
                </Text>
              </View>
            )}
          </View>

          {detailedStats.length > 0 && selectedPlayer && selectedStats ? (
            <View style={styles.statsContainer}>
              <View key={selectedStats.playerName} style={styles.playerCard}>
                <Text style={styles.playerName}>{selectedStats.playerName}</Text>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Earnings:</Text>
                  <Text style={styles.statValue}>£{selectedStats.totalEarnings.toFixed(2)}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Regular Bets:</Text>
                  <Text style={styles.statValue}>£{selectedStats.regularBetEarnings.toFixed(2)}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Kicker Bets:</Text>
                  <Text style={styles.statValue}>£{selectedStats.kickerBetEarnings.toFixed(2)}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Win Percentage:</Text>
                  <Text style={styles.statValue}>{selectedStats.winPercentage.toFixed(1)}%</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Wins/Picks:</Text>
                  <Text style={styles.statValue}>{selectedStats.wins}/{selectedStats.totalPicks}</Text>
                </View>

                {selectedStats.kickerBetAttempts > 0 && (
                  <View style={styles.kickerBetSection}>
                    <Text style={styles.kickerBetTitle}>Kicker Bet Performance</Text>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>KB Win Rate:</Text>
                      <Text style={styles.statValue}>{selectedStats.kickerBetWinPercentage.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>KB Wins/Attempts:</Text>
                      <Text style={styles.statValue}>{selectedStats.kickerBetWins}/{selectedStats.kickerBetAttempts}</Text>
                    </View>
                  </View>
                )}

                {selectedStats.weeklyPerformance.length > 0 && (
                  <View style={styles.weeklyPerformanceContainer}>
                    <Text style={styles.weeklyPerformanceTitle}>Weekly Performance</Text>
                    {selectedStats.weeklyPerformance.map(week => (
                      <View key={week.week} style={styles.weekRow}>
                        <Text style={styles.weekText}>
                          Week {week.week}: {week.wins}/{week.picks} wins
                          {week.kickerBetWon ? ' + KB' : ''}
                        </Text>
                        <Text style={styles.weekEarnings}>
                          Personal: £{week.earnings.toFixed(2)} | Total: £{week.totalWeeklyWinnings.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedStats.favoriteTeams.length > 0 && (
                  <View style={styles.favoriteTeamsContainer}>
                    <Text style={styles.favoriteTeamsTitle}>Most Picked Teams</Text>
                    {selectedStats.favoriteTeams.map((team, index) => (
                      <View key={index} style={styles.teamRow}>
                        <Text style={styles.teamText}>{team.team}</Text>
                        <Text style={styles.teamPicks}>{team.picks} picks</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : detailedStats.length > 0 && selectedPlayer && !selectedStats ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No statistics found for {selectedPlayer}</Text>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                No player statistics available yet
              </Text>
            </View>
          )}

          {renderBackButton()}
        </ScrollView>

        {/* Player Selection Modal */}
        <Modal
          visible={showPlayerModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPlayerModal(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Player</Text>
              <ScrollView>
                {availablePlayers.map((player, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.playerOption}
                    onPress={() => {
                      setSelectedPlayer(player);
                      setShowPlayerModal(false);
                    }}
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
