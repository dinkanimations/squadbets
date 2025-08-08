
import AsyncStorage from '@react-native-async-storage/async-storage';
import { commonStyles, buttonStyles } from '../styles/commonStyles';
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View, ScrollView, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { colors } from '../styles/commonStyles';
import { RoleGuard } from '../components/RoleGuard';
import { router } from 'expo-router';

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

interface PlayerStats {
  playerName: string;
  totalEarnings: number;
  wins: number;
  totalPicks: number;
  winPercentage: number;
  weeklyEarnings: { week: number; earnings: number }[];
  kickerBetWins: number;
  kickerBetEarnings: number;
  totalSeasonWinnings: number;
  correctPicks: number;
  weeklyWins: number;
}

interface PotStats {
  totalPot: number;
  totalStaked: number;
  netProfit: number;
  playerWinnings: number;
  accumulatorWinnings: number;
  weeklyBreakdown: { week: number; potContribution: number; totalStaked: number }[];
}

interface BreakevenStats {
  weeklyBreakeven: { week: number; staked: number; winnings: number; breakeven: number }[];
  totalSeasonBreakeven: number;
  currentWeekBreakeven: number;
  totalStaked: number;
  totalWinnings: number;
  kickerBetStaked: number;
  kickerBetWinnings: number;
  accumulatorStaked: number;
  accumulatorWinnings: number;
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
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -15,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d0d0d0',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  totalSeasonWinningsContainer: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.primary + '50',
  },
  totalSeasonWinningsTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  totalSeasonWinningsText: {
    color: '#d0d0d0',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderBottomWidth: 0,
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 2,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  positionColumn: {
    width: width * 0.08,
    alignItems: 'center',
  },
  playerColumn: {
    width: width * 0.18,
    paddingLeft: 0,
  },
  returnsColumn: {
    width: width * 0.16,
    alignItems: 'center',
  },
  weeklyWinsColumn: {
    width: width * 0.10,
    alignItems: 'center',
  },
  correctPicksColumn: {
    width: width * 0.12,
    alignItems: 'center',
  },
  kbColumn: {
    width: width * 0.10,
    alignItems: 'center',
  },
  percentageColumn: {
    width: width * 0.12,
    alignItems: 'center',
  },
  headerText: {
    color: '#d0d0d0',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cellText: {
    color: '#d0d0d0',
    fontSize: 9,
    textAlign: 'center',
  },
  playerName: {
    color: '#d0d0d0',
    fontSize: 9,
    fontWeight: 'bold',
  },
  totalText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#d0d0d0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  accumulatorSummary: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  accumulatorTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  accumulatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  accumulatorLabel: {
    color: '#d0d0d0',
    fontSize: 14,
  },
  accumulatorValue: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  highlightedAccumulatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  highlightedAccumulatorLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  highlightedAccumulatorValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
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
  week1Container: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: Dimensions.get('window').height - 200,
  },
  week1MessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  week1Message: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  week1MessageText: {
    color: '#d0d0d0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#ff6b6b20',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ff6b6b50',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default function SeasonLeaderboardScreen() {
  const [playerPicks, setPlayerPicks] = useState<PlayerPick[]>([]);
  const [gameOdds, setGameOdds] = useState<GameOdds[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [playerPickOdds, setPlayerPickOdds] = useState<PlayerPickOdds[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [kickerBetResults, setKickerBetResults] = useState<KickerBetResult[]>([]);
  const [kickerBetOdds, setKickerBetOdds] = useState<KickerBetOdds[]>([]);
  const [accumulatorBets, setAccumulatorBets] = useState<AccumulatorBet[]>([]);
  const [breakevenStats, setBreakevenStats] = useState<BreakevenStats>({
    weeklyBreakeven: [],
    totalSeasonBreakeven: 0,
    currentWeekBreakeven: 0,
    totalStaked: 0,
    totalWinnings: 0,
    kickerBetStaked: 0,
    kickerBetWinnings: 0,
    accumulatorStaked: 0,
    accumulatorWinnings: 0,
  });
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  console.log('SeasonLeaderboardScreen rendered');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    try {
      calculateLeaderboard();
      setHasError(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Error calculating leaderboard:', error);
      setHasError(true);
      setErrorMessage('Error calculating season stats. Please check your data.');
    }
  }, [playerPicks, gameOdds, gameResults, teamResults, playerPickOdds, kickerBetResults, kickerBetOdds, accumulatorBets, currentWeek]);

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
        const migratedBets = bets.map((bet: AccumulatorBet) => ({
          ...bet,
          type: bet.type === 'all-picks' || bet.type === '12-team' ? 'max-acca' : 
                bet.type === '6-team' ? '1st-pick-acca' : bet.type
        }));
        setAccumulatorBets(migratedBets);
      }

      console.log('Season leaderboard data loaded');
    } catch (error) {
      console.error('Error loading season leaderboard data:', error);
      setHasError(true);
      setErrorMessage('Error loading data. Please try again.');
    }
  };

  const safeCalculateValue = (calculation: () => number, defaultValue: number = 0): number => {
    try {
      const result = calculation();
      return isNaN(result) || !isFinite(result) ? defaultValue : result;
    } catch (error) {
      console.error('Calculation error:', error);
      return defaultValue;
    }
  };

  const calculateTotalWeeklyWinnings = (week: number): number => {
    return safeCalculateValue(() => {
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

          if (team1Odds && team2Odds && team1Odds.odds > 0 && team2Odds.odds > 0) {
            totalPlayerEarnings += 5 * team1Odds.odds * team2Odds.odds;
          }
        }
      });

      const kbResult = kickerBetResults.find(r => r.week === week);
      if (kbResult) {
        kbResult.winners.forEach(winnerName => {
          const kbOdds = kickerBetOdds.find(o => 
            o.playerName === winnerName && o.week === week
          );
          if (kbOdds && kbOdds.odds > 0) {
            totalPlayerEarnings += 1 * kbOdds.odds;
          }
        });
      }

      const weekAccumulators = accumulatorBets.filter(bet => bet.week === week);
      let accumulatorWinnings = 0;
      
      weekAccumulators.forEach(bet => {
        if (bet.isWon === true && bet.actualWinnings > 0) {
          accumulatorWinnings += bet.actualWinnings;
        }
      });
      
      console.log(`Season stats - Total weekly winnings for week ${week}: Player earnings £${totalPlayerEarnings.toFixed(2)} + Accumulator winnings £${accumulatorWinnings.toFixed(2)} = £${(totalPlayerEarnings + accumulatorWinnings).toFixed(2)}`);
      
      return totalPlayerEarnings + accumulatorWinnings;
    });
  };

  const calculateWeeklyStaked = (week: number): number => {
    return safeCalculateValue(() => {
      const weekPicks = playerPicks.filter(pick => pick.week === week);
      const regularBetStake = weekPicks.length * 5;
      
      const kbResult = kickerBetResults.find(r => r.week === week);
      const kickerBetStake = kbResult ? weekPicks.length * 1 : 0;
      
      const weekAccumulators = accumulatorBets.filter(bet => bet.week === week);
      const accumulatorStake = weekAccumulators.reduce((sum, bet) => sum + (bet.stake || 0), 0);
      
      const totalWeekStaked = regularBetStake + kickerBetStake + accumulatorStake;
      
      console.log(`Week ${week} staked: Regular £${regularBetStake}, KB £${kickerBetStake}, Acca £${accumulatorStake}, Total £${totalWeekStaked}`);
      
      return totalWeekStaked;
    });
  };

  const calculateWeeklyWinner = (week: number): string | null => {
    try {
      const weekPicks = playerPicks.filter(pick => pick.week === week);
      const playerWeeklyEarnings: { [playerName: string]: number } = {};

      weekPicks.forEach(pick => {
        if (!playerWeeklyEarnings[pick.playerName]) {
          playerWeeklyEarnings[pick.playerName] = 0;
        }
      });

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

          if (team1Odds && team2Odds && team1Odds.odds > 0 && team2Odds.odds > 0) {
            playerWeeklyEarnings[pick.playerName] += 5 * team1Odds.odds * team2Odds.odds;
          }
        }
      });

      const kbResult = kickerBetResults.find(r => r.week === week);
      if (kbResult) {
        kbResult.winners.forEach(winnerName => {
          const kbOdds = kickerBetOdds.find(o => 
            o.playerName === winnerName && o.week === week
          );
          if (kbOdds && playerWeeklyEarnings[winnerName] !== undefined && kbOdds.odds > 0) {
            playerWeeklyEarnings[winnerName] += 1 * kbOdds.odds;
          }
        });
      }

      let maxEarnings = 0;
      let winner: string | null = null;

      Object.entries(playerWeeklyEarnings).forEach(([playerName, earnings]) => {
        if (earnings > maxEarnings) {
          maxEarnings = earnings;
          winner = playerName;
        }
      });

      return winner;
    } catch (error) {
      console.error('Error calculating weekly winner:', error);
      return null;
    }
  };

  const calculateLeaderboard = () => {
    try {
      console.log('Calculating season leaderboard...');
      console.log('Current accumulator bets:', accumulatorBets);
      
      const allPlayers = Array.from(new Set(playerPicks.map(pick => pick.playerName)));

      const playerStats: PlayerStats[] = allPlayers.map(playerName => {
        let totalEarnings = 0;
        let wins = 0;
        let totalPicks = 0;
        let kickerBetWins = 0;
        let kickerBetEarnings = 0;
        let correctPicks = 0;
        let weeklyWins = 0;
        const weeklyEarnings: { week: number; earnings: number }[] = [];
        let totalSeasonWinnings = 0;

        for (let week = 1; week < currentWeek; week++) {
          const weekPick = playerPicks.find(pick => pick.playerName === playerName && pick.week === week);
          let weekEarnings = 0;

          if (weekPick) {
            totalPicks += 2;

            const team1Result = teamResults.find(r => r.teamName === weekPick.team1 && r.week === week);
            const team2Result = teamResults.find(r => r.teamName === weekPick.team2 && r.week === week);

            const team1Won = team1Result?.hasWon === true;
            const team2Won = team2Result?.hasWon === true;

            if (team1Won) {
              wins++;
              correctPicks++;
            }
            if (team2Won) {
              wins++;
              correctPicks++;
            }

            if (team1Won && team2Won) {
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

              if (team1Odds && team2Odds && team1Odds.odds > 0 && team2Odds.odds > 0) {
                const earnings = 5 * team1Odds.odds * team2Odds.odds;
                weekEarnings += earnings;
                totalEarnings += earnings;
              }
            }
          }

          const kbResult = kickerBetResults.find(r => r.week === week);
          if (kbResult && kbResult.winners.includes(playerName)) {
            kickerBetWins++;
            const kbOdds = kickerBetOdds.find(o => 
              o.playerName === playerName && o.week === week
            );
            if (kbOdds && kbOdds.odds > 0) {
              const kbEarning = 1 * kbOdds.odds;
              kickerBetEarnings += kbEarning;
              totalEarnings += kbEarning;
              weekEarnings += kbEarning;
            }
          }

          const weekWinner = calculateWeeklyWinner(week);
          if (weekWinner === playerName) {
            weeklyWins++;
          }

          weeklyEarnings.push({ week, earnings: weekEarnings });
          
          const totalWeeklyWinnings = calculateTotalWeeklyWinnings(week);
          totalSeasonWinnings += totalWeeklyWinnings;
        }

        const winPercentage = totalPicks > 0 ? (wins / totalPicks) * 100 : 0;

        return {
          playerName,
          totalEarnings: safeCalculateValue(() => totalEarnings),
          wins,
          totalPicks,
          winPercentage: safeCalculateValue(() => winPercentage),
          weeklyEarnings,
          kickerBetWins,
          kickerBetEarnings: safeCalculateValue(() => kickerBetEarnings),
          totalSeasonWinnings: safeCalculateValue(() => totalSeasonWinnings),
          correctPicks,
          weeklyWins,
        };
      });

      playerStats.sort((a, b) => b.totalEarnings - a.totalEarnings);

      const weeklyBreakeven: { week: number; staked: number; winnings: number; breakeven: number }[] = [];
      let totalStaked = 0;
      let totalWinnings = 0;
      let kickerBetStaked = 0;
      let kickerBetWinnings = 0;
      let accumulatorStaked = 0;
      let accumulatorWinnings = 0;

      for (let week = 1; week < currentWeek; week++) {
        const weekPicks = playerPicks.filter(pick => pick.week === week);
        const weekStaked = weekPicks.length * 5;
        const weekKBStaked = kickerBetResults.find(r => r.week === week) ? weekPicks.length * 1 : 0;
        
        let weekWinnings = 0;
        let weekKBWinnings = 0;

        weekPicks.forEach(pick => {
          const team1Result = teamResults.find(r => r.teamName === pick.team1 && r.week === week);
          const team2Result = teamResults.find(r => r.teamName === pick.team2 && r.week === week);

          if (team1Result?.hasWon && team2Result?.hasWon) {
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

            if (team1Odds && team2Odds && team1Odds.odds > 0 && team2Odds.odds > 0) {
              weekWinnings += 5 * team1Odds.odds * team2Odds.odds;
            }
          }
        });

        const kbResult = kickerBetResults.find(r => r.week === week);
        if (kbResult) {
          kbResult.winners.forEach(winnerName => {
            const kbOdds = kickerBetOdds.find(o => 
              o.playerName === winnerName && o.week === week
            );
            if (kbOdds && kbOdds.odds > 0) {
              weekKBWinnings += 1 * kbOdds.odds;
            }
          });
        }

        const weekAccumulators = accumulatorBets.filter(bet => bet.week === week);
        const weekAccumulatorStake = weekAccumulators.reduce((sum, bet) => sum + (bet.stake || 0), 0);
        const weekAccumulatorWinnings = weekAccumulators
          .filter(bet => bet.isWon === true)
          .reduce((sum, bet) => sum + (bet.actualWinnings || 0), 0);

        weekWinnings += weekAccumulatorWinnings;

        const totalWeekStaked = weekStaked + weekKBStaked + weekAccumulatorStake;
        const totalWeekWinnings = weekWinnings + weekKBWinnings;
        const weekBreakeven = totalWeekWinnings - totalWeekStaked;

        weeklyBreakeven.push({
          week,
          staked: totalWeekStaked,
          winnings: totalWeekWinnings,
          breakeven: weekBreakeven,
        });

        totalStaked += weekStaked;
        totalWinnings += weekWinnings;
        kickerBetStaked += weekKBStaked;
        kickerBetWinnings += weekKBWinnings;
        accumulatorStaked += weekAccumulatorStake;
        accumulatorWinnings += weekAccumulatorWinnings;
      }

      const totalSeasonBreakeven = (totalWinnings + kickerBetWinnings) - (totalStaked + kickerBetStaked + accumulatorStaked);
      const currentWeekBreakeven = weeklyBreakeven.length > 0 ? weeklyBreakeven[weeklyBreakeven.length - 1].breakeven : 0;

      setLeaderboard(playerStats);
      setBreakevenStats({
        weeklyBreakeven,
        totalSeasonBreakeven: safeCalculateValue(() => totalSeasonBreakeven),
        currentWeekBreakeven: safeCalculateValue(() => currentWeekBreakeven),
        totalStaked: safeCalculateValue(() => totalStaked + kickerBetStaked + accumulatorStaked),
        totalWinnings: safeCalculateValue(() => totalWinnings + kickerBetWinnings),
        kickerBetStaked: safeCalculateValue(() => kickerBetStaked),
        kickerBetWinnings: safeCalculateValue(() => kickerBetWinnings),
        accumulatorStaked: safeCalculateValue(() => accumulatorStaked),
        accumulatorWinnings: safeCalculateValue(() => accumulatorWinnings),
      });

      console.log('Season leaderboard calculated');
    } catch (error) {
      console.error('Error in calculateLeaderboard:', error);
      throw error;
    }
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.positionColumn}>
        <Text style={styles.headerText}>Pos.</Text>
      </View>
      <View style={styles.playerColumn}>
        <Text style={styles.headerText}>Player</Text>
      </View>
      <View style={styles.weeklyWinsColumn}>
        <Text style={styles.headerText}>Weekly{'\n'}Wins</Text>
      </View>
      <View style={styles.correctPicksColumn}>
        <Text style={styles.headerText}>Correct{'\n'}Picks</Text>
      </View>
      <View style={styles.kbColumn}>
        <Text style={styles.headerText}>KB{'\n'}Wins</Text>
      </View>
      <View style={styles.percentageColumn}>
        <Text style={styles.headerText}>Win %</Text>
      </View>
      <View style={styles.returnsColumn}>
        <Text style={styles.headerText}>Returns</Text>
      </View>
    </View>
  );

  const renderPlayerRow = (player: PlayerStats, position: number) => (
    <View key={player.playerName} style={styles.tableRow}>
      <View style={styles.positionColumn}>
        <Text style={styles.cellText}>{position}</Text>
      </View>
      <View style={styles.playerColumn}>
        <Text style={styles.playerName}>{player.playerName}</Text>
      </View>
      <View style={styles.weeklyWinsColumn}>
        <Text style={styles.cellText}>{player.weeklyWins}</Text>
      </View>
      <View style={styles.correctPicksColumn}>
        <Text style={styles.cellText}>{player.correctPicks}</Text>
      </View>
      <View style={styles.kbColumn}>
        <Text style={styles.cellText}>{player.kickerBetWins}</Text>
      </View>
      <View style={styles.percentageColumn}>
        <Text style={styles.cellText}>{player.winPercentage.toFixed(1)}%</Text>
      </View>
      <View style={styles.returnsColumn}>
        <Text style={styles.cellText}>£{player.totalEarnings.toFixed(2)}</Text>
      </View>
    </View>
  );

  const calculateTotalSeasonWinnings = (): number => {
    return safeCalculateValue(() => {
      let totalSeasonWinnings = 0;
      for (let week = 1; week < currentWeek; week++) {
        totalSeasonWinnings += calculateTotalWeeklyWinnings(week);
      }
      return totalSeasonWinnings;
    });
  };

  const renderTotalRow = () => {
    const totalPlayerEarnings = leaderboard.reduce((sum, player) => sum + player.totalEarnings, 0);
    const totalCorrectPicks = leaderboard.reduce((sum, player) => sum + player.correctPicks, 0);
    const totalPicks = leaderboard.reduce((sum, player) => sum + player.totalPicks, 0);
    const totalWinPercentage = totalPicks > 0 ? (totalCorrectPicks / totalPicks) * 100 : 0;

    return (
      <View style={styles.totalRow}>
        <View style={styles.positionColumn}>
          <Text style={styles.totalText}></Text>
        </View>
        <View style={styles.playerColumn}>
          <Text style={styles.totalText}></Text>
        </View>
        <View style={styles.weeklyWinsColumn}>
          <Text style={styles.totalText}></Text>
        </View>
        <View style={styles.correctPicksColumn}>
          <Text style={styles.totalText}>TOTAL</Text>
        </View>
        <View style={styles.kbColumn}>
          <Text style={styles.totalText}></Text>
        </View>
        <View style={styles.percentageColumn}>
          <Text style={styles.totalText}>{totalWinPercentage.toFixed(1)}%</Text>
        </View>
        <View style={styles.returnsColumn}>
          <Text style={styles.totalText}>£{totalPlayerEarnings.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  const renderAccumulatorSummary = () => {
    try {
      console.log('=== ACCUMULATOR SUMMARY DEBUG ===');
      console.log('Current week:', currentWeek);
      console.log('All accumulator bets:', JSON.stringify(accumulatorBets, null, 2));
      
      const completedWeeks = [];
      for (let week = 1; week < currentWeek; week++) {
        completedWeeks.push(week);
      }
      console.log('Completed weeks:', completedWeeks);
      
      const completedAccumulatorBets = accumulatorBets.filter(bet => completedWeeks.includes(bet.week));
      console.log('Completed accumulator bets:', JSON.stringify(completedAccumulatorBets, null, 2));
      
      const maxAccaBets = completedAccumulatorBets.filter(bet => bet.type === 'max-acca');
      const firstPickAccaBets = completedAccumulatorBets.filter(bet => bet.type === '1st-pick-acca');
      
      console.log('Max acca bets:', JSON.stringify(maxAccaBets, null, 2));
      console.log('First pick acca bets:', JSON.stringify(firstPickAccaBets, null, 2));
      
      const totalMaxAccaReturns = maxAccaBets
        .filter(bet => bet.isWon === true)
        .reduce((sum, bet) => {
          console.log(`Max acca week ${bet.week}: isWon=${bet.isWon}, actualWinnings=${bet.actualWinnings}`);
          return sum + (bet.actualWinnings || 0);
        }, 0);
      
      const totalFirstPickAccaReturns = firstPickAccaBets
        .filter(bet => bet.isWon === true)
        .reduce((sum, bet) => {
          console.log(`First pick acca week ${bet.week}: isWon=${bet.isWon}, actualWinnings=${bet.actualWinnings}`);
          return sum + (bet.actualWinnings || 0);
        }, 0);
      
      const totalAccumulatorReturns = totalMaxAccaReturns + totalFirstPickAccaReturns;
      
      const totalMaxAccaStake = maxAccaBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
      const totalFirstPickAccaStake = firstPickAccaBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
      const totalAccumulatorStake = totalMaxAccaStake + totalFirstPickAccaStake;
      
      const wonMaxAccas = maxAccaBets.filter(bet => bet.isWon === true).length;
      const lostMaxAccas = maxAccaBets.filter(bet => bet.isWon === false).length;
      const wonFirstPickAccas = firstPickAccaBets.filter(bet => bet.isWon === true).length;
      const lostFirstPickAccas = firstPickAccaBets.filter(bet => bet.isWon === false).length;
      
      const totalWonAccas = wonMaxAccas + wonFirstPickAccas;
      const totalLostAccas = lostMaxAccas + lostFirstPickAccas;

      console.log('=== FINAL CALCULATIONS ===');
      console.log('Total Max Acca Returns:', totalMaxAccaReturns);
      console.log('Total First Pick Acca Returns:', totalFirstPickAccaReturns);
      console.log('Total Accumulator Returns:', totalAccumulatorReturns);
      console.log('Total Accumulator Stake:', totalAccumulatorStake);
      console.log('Won Accas:', totalWonAccas, 'Lost Accas:', totalLostAccas);
      console.log('=== END DEBUG ===');

      if (completedWeeks.length === 0) {
        return (
          <View style={styles.accumulatorSummary}>
            <Text style={styles.accumulatorTitle}>Season Accumulator Summary</Text>
            <View style={styles.accumulatorRow}>
              <Text style={styles.accumulatorLabel}>No completed weeks yet</Text>
              <Text style={styles.accumulatorValue}>-</Text>
            </View>
          </View>
        );
      }

      if (completedAccumulatorBets.length === 0) {
        return (
          <View style={styles.accumulatorSummary}>
            <Text style={styles.accumulatorTitle}>Season Accumulator Summary</Text>
            <View style={styles.accumulatorRow}>
              <Text style={styles.accumulatorLabel}>No accumulator data available yet</Text>
              <Text style={styles.accumulatorValue}>-</Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.accumulatorSummary}>
          <Text style={styles.accumulatorTitle}>Season Accumulator Summary</Text>
          
          <View style={styles.accumulatorRow}>
            <Text style={styles.accumulatorLabel}>Max Acca Returns:</Text>
            <Text style={[styles.accumulatorValue, { color: colors.primary }]}>
              £{totalMaxAccaReturns.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.accumulatorRow}>
            <Text style={styles.accumulatorLabel}>First Pick Acca Returns:</Text>
            <Text style={[styles.accumulatorValue, { color: colors.primary }]}>
              £{totalFirstPickAccaReturns.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.accumulatorRow}>
            <Text style={styles.accumulatorLabel}>Total Accumulator Stake:</Text>
            <Text style={styles.accumulatorValue}>£{totalAccumulatorStake.toFixed(2)}</Text>
          </View>
          
          <View style={styles.accumulatorRow}>
            <Text style={styles.accumulatorLabel}>Accumulator Profit/Loss:</Text>
            <Text style={[styles.accumulatorValue, { 
              color: (totalAccumulatorReturns - totalAccumulatorStake) >= 0 ? colors.primary : '#ff6b6b'
            }]}>
              £{(totalAccumulatorReturns - totalAccumulatorStake).toFixed(2)}
            </Text>
          </View>

          <View style={styles.accumulatorRow}>
            <Text style={styles.accumulatorLabel}>Won Accumulators:</Text>
            <Text style={[styles.accumulatorValue, { color: colors.primary }]}>
              {totalWonAccas} (Max: {wonMaxAccas}, First Pick: {wonFirstPickAccas})
            </Text>
          </View>

          <View style={styles.accumulatorRow}>
            <Text style={styles.accumulatorLabel}>Lost Accumulators:</Text>
            <Text style={[styles.accumulatorValue, { color: '#ff6b6b' }]}>
              {totalLostAccas} (Max: {lostMaxAccas}, First Pick: {lostFirstPickAccas})
            </Text>
          </View>

          <View style={styles.highlightedAccumulatorRow}>
            <Text style={styles.highlightedAccumulatorLabel}>Total Acca Returns:</Text>
            <Text style={styles.highlightedAccumulatorValue}>
              £{totalAccumulatorReturns.toFixed(2)}
            </Text>
          </View>

          <Text style={[styles.accumulatorLabel, { marginTop: 8, fontSize: 12, fontStyle: 'italic', textAlign: 'center' }]}>
            Note: Accumulator returns contribute to total team earnings but not individual player earnings
          </Text>
        </View>
      );
    } catch (error) {
      console.error('Error rendering accumulator summary:', error);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading accumulator summary</Text>
        </View>
      );
    }
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
          colors={['#000000', '#1a4d3a']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (hasError) {
    return (
      <RoleGuard requiredRole="player" fallbackMessage="Please select your role to access season stats.">
        <View style={styles.safeContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.headerWithLogo}>
              <Image
                source={require('../assets/images/60e1ffea-4aeb-4101-9cc0-52f16abfc277.png')}
                style={styles.scrollableLogo}
              />
              <View style={styles.titleContainer}>
                <Text style={styles.pageTitle}>Season Stats</Text>
              </View>
            </View>
            
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Text style={styles.errorText}>Please check your data and try again.</Text>
            </View>
            
            {renderBackButton()}
          </ScrollView>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="player" fallbackMessage="Please select your role to access season stats.">
      <View style={styles.safeContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerWithLogo}>
          <Image
            source={require('../assets/images/60e1ffea-4aeb-4101-9cc0-52f16abfc277.png')}
            style={styles.scrollableLogo}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Season Stats</Text>
          </View>
        </View>
        
        {currentWeek === 1 && (
          <View style={styles.week1Container}>
            <View style={styles.week1MessageContainer}>
              <View style={styles.week1Message}>
                <Text style={styles.week1MessageText}>
                  No season data available yet.{'\n\n'}
                  Complete some weeks to see the season leaderboard and accumulator summary.
                </Text>
              </View>
            </View>
            {renderBackButton()}
          </View>
        )}
        
        {currentWeek > 1 && (
          <>
            <View style={styles.totalSeasonWinningsContainer}>
              <Text style={styles.totalSeasonWinningsTitle}>Total Season Returns</Text>
              <Text style={styles.totalSeasonWinningsText}>
                £{calculateTotalSeasonWinnings().toFixed(2)}
              </Text>
            </View>

            <View style={styles.tableContainer}>
              {renderTableHeader()}
              {leaderboard.map((player, index) => renderPlayerRow(player, index + 1))}
              {renderTotalRow()}
            </View>

            {renderAccumulatorSummary()}

            {leaderboard.length === 0 && (
              <View style={[commonStyles.card, { marginHorizontal: 4 }]}>
                <Text style={[commonStyles.text, { textAlign: 'center' }]}>
                  No season data available yet. Complete some weeks to see the season leaderboard.
                </Text>
              </View>
            )}

            {renderBackButton()}
          </>
        )}
      </ScrollView>
    </View>
    </RoleGuard>
  );
}
