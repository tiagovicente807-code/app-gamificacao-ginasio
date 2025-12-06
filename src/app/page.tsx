"use client";

import { useState, useEffect } from "react";
import { Trophy, Flame, Target, Award, TrendingUp, Users, QrCode, MapPin, Calendar, Medal, Star, Zap, ChevronRight, Crown, Gift, CheckCircle2, Lock, Sparkles, TrendingDown, BarChart3, Activity, Radio, LogOut } from "lucide-react";
import { getCurrentUser, signOut } from "@/lib/auth";
import { 
  getUserData, 
  getGyms, 
  performCheckIn, 
  getRecentCheckIns, 
  getRankings,
  getActiveChallenges,
  getUserChallenges,
  getAllBadges,
  getUserBadges,
  getRewards,
  getPointsEvolution
} from "@/lib/gym-service";
import AuthModal from "@/components/auth/AuthModal";

type View = "dashboard" | "checkin" | "rankings" | "challenges" | "profile";

export default function GymLeague() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedGym, setSelectedGym] = useState("");
  const [gyms, setGyms] = useState<any[]>([]);
  const [rankingPeriod, setRankingPeriod] = useState<"monthly" | "quarterly" | "seasonal" | "annual">("monthly");
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  
  // Real-time data
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [pointsEvolution, setPointsEvolution] = useState<any[]>([]);

  // Load user and initial data
  useEffect(() => {
    loadUser();
    loadGyms();
  }, []);

  // Load user-specific data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Simulate GPS activation
  useEffect(() => {
    if (currentView === "checkin") {
      const timer = setTimeout(() => setGpsActive(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setGpsActive(false);
    }
  }, [currentView]);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setSelectedGym(currentUser.gym_id);
      } else {
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setShowAuthModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadGyms = async () => {
    try {
      const gymsData = await getGyms();
      setGyms(gymsData);
    } catch (error) {
      console.error("Error loading gyms:", error);
    }
  };

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load all user data in parallel
      const [
        workoutsData,
        rankingsData,
        challengesData,
        userChallengesData,
        badgesData,
        userBadgesData,
        rewardsData,
        evolutionData,
      ] = await Promise.all([
        getRecentCheckIns(user.id, 10),
        getRankings(user.gym_id, rankingPeriod),
        getActiveChallenges(),
        getUserChallenges(user.id),
        getAllBadges(),
        getUserBadges(user.id),
        getRewards(),
        getPointsEvolution(user.id, 7),
      ]);

      setRecentWorkouts(workoutsData);
      setRankings(rankingsData);
      setChallenges(challengesData);
      setUserChallenges(userChallengesData);
      setBadges(badgesData);
      setUserBadges(userBadgesData);
      setRewards(rewardsData);
      setPointsEvolution(evolutionData);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !selectedGym) return;

    try {
      const result = await performCheckIn(user.id, selectedGym, 'regular');
      setCheckInResult(result);
      setShowCheckInSuccess(true);
      setShowConfetti(true);
      
      // Refresh user data
      const updatedUser = await getUserData(user.id);
      setUser(updatedUser);
      await loadUserData();

      setTimeout(() => setShowCheckInSuccess(false), 3000);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Erro ao fazer check-in. Tente novamente.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setShowAuthModal(true);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Confetti Component
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)]
            }}
          />
        </div>
      ))}
    </div>
  );

  // Format evolution data for charts
  const formatPointsEvolution = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: days[date.getDay()],
        points: 0,
        date: date.toISOString().split('T')[0]
      };
    });

    pointsEvolution.forEach(pe => {
      const date = new Date(pe.timestamp).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.date === date);
      if (dayData) {
        dayData.points += pe.points_earned;
      }
    });

    return last7Days;
  };

  // Merge user challenges with challenge data
  const getMergedChallenges = () => {
    return challenges.map(challenge => {
      const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id);
      const daysLeft = challenge.end_date 
        ? Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30;

      return {
        id: challenge.id,
        title: challenge.name,
        description: challenge.description,
        progress: userChallenge?.progress || 0,
        total: challenge.goal_value,
        reward: challenge.reward_points,
        type: challenge.type,
        daysLeft,
        color: challenge.color_gradient || 'from-purple-500 to-pink-600',
        completed: userChallenge?.completed || false,
      };
    });
  };

  // Merge badges with user badges
  const getMergedBadges = () => {
    return badges.map(badge => {
      const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
      const isRecent = userBadge && 
        (Date.now() - new Date(userBadge.unlocked_at).getTime()) < 7 * 24 * 60 * 60 * 1000;

      return {
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        unlocked: !!userBadge,
        description: badge.description,
        recent: isRecent,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onSuccess={loadUser}
        />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="w-20 h-20 text-purple-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">GymLeague</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Gamificação para Ginásios</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </>
    );
  }

  const chartData = formatPointsEvolution();
  const mergedChallenges = getMergedChallenges();
  const mergedBadges = getMergedBadges();
  const currentGym = gyms.find(g => g.id === selectedGym);
  const userRank = rankings.findIndex(r => r.id === user.id) + 1;

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-6 pb-24">
      {/* Header Stats */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-1">{user.name}</h2>
            <p className="text-purple-200 text-sm">Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-center animate-pulse-slow">
            <div className="text-2xl font-bold">#{userRank || '-'}</div>
            <div className="text-xs text-purple-200">Ranking</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-300 animate-pulse" fill="currentColor" />
              <span className="font-semibold">Nível {user.level}</span>
            </div>
            <span className="text-sm text-purple-200">{user.xp} / {user.level * 3000} XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-500 relative"
              style={{ width: `${(user.xp % 3000 / 3000) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all cursor-pointer transform hover:scale-105">
            <Flame className="w-6 h-6 mx-auto mb-1 text-orange-400 animate-pulse" />
            <div className="text-2xl font-bold">{user.current_streak}</div>
            <div className="text-xs text-purple-200">Dias Seguidos</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all cursor-pointer transform hover:scale-105">
            <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
            <div className="text-2xl font-bold">{user.points}</div>
            <div className="text-xs text-purple-200">Pontos</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all cursor-pointer transform hover:scale-105">
            <Target className="w-6 h-6 mx-auto mb-1 text-green-400" />
            <div className="text-2xl font-bold">{user.total_workouts}</div>
            <div className="text-xs text-purple-200">Treinos</div>
          </div>
        </div>
      </div>

      {/* Evolution Charts */}
      <div className="space-y-4">
        {/* Points Evolution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Evolução de Pontos
            </h3>
            <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Última semana
            </span>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {chartData.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-purple-500 hover:to-purple-300 cursor-pointer relative group"
                  style={{ height: `${day.points > 0 ? Math.max((day.points / 300) * 100, 10) : 0}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.points} pts
                  </div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Challenges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Desafios Ativos</h3>
          <button 
            onClick={() => setCurrentView("challenges")}
            className="text-purple-600 dark:text-purple-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {mergedChallenges.filter(c => !c.completed).slice(0, 2).map(challenge => (
            <div key={challenge.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{challenge.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.description}</p>
                </div>
                <div className={`bg-gradient-to-br ${challenge.color} rounded-xl px-3 py-1.5 ml-3 shadow-md animate-pulse-slow`}>
                  <div className="flex items-center gap-1 text-white">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-bold">+{challenge.reward}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{challenge.progress}/{challenge.total}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`bg-gradient-to-r ${challenge.color} h-full rounded-full transition-all duration-500 relative`}
                    style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {challenge.daysLeft} dias restantes
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Badges with Animation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Conquistas Recentes</h3>
          <button 
            onClick={() => setCurrentView("profile")}
            className="text-purple-600 dark:text-purple-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {mergedBadges.filter(b => b.unlocked).slice(0, 4).map((badge, idx) => (
            <div 
              key={badge.id} 
              className={`bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 text-center border-2 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-110 ${
                badge.recent ? 'animate-bounce-slow' : ''
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="text-4xl mb-2 relative">
                {badge.icon}
                {badge.recent && (
                  <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                )}
              </div>
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{badge.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workouts */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Histórico Recente</h3>
        <div className="space-y-2">
          {recentWorkouts.slice(0, 4).map((workout, idx) => {
            const date = new Date(workout.timestamp);
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday = date.toDateString() === yesterday.toDateString();
            
            let dateLabel = date.toLocaleDateString('pt-BR');
            if (isToday) dateLabel = 'Hoje';
            else if (isYesterday) dateLabel = 'Ontem';

            return (
              <div key={workout.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-lg transition-all">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-2.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{dateLabel}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {workout.duration_minutes && ` • ${workout.duration_minutes}min`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600 dark:text-purple-400">+{workout.points_earned}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">pontos</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Check-in View
  const CheckInView = () => (
    <div className="space-y-6 pb-24">
      {showConfetti && <Confetti />}
      
      {/* Success Modal */}
      {showCheckInSuccess && checkInResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check-in Realizado!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Você ganhou +{checkInResult.pointsEarned} XP</p>
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Pontos base</span>
                <span className="font-bold text-purple-600">+{checkInResult.breakdown.base} XP</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Bônus streak</span>
                <span className="font-bold text-orange-600">+{checkInResult.breakdown.streakBonus} XP</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Bônus nível</span>
                <span className="font-bold text-green-600">+{checkInResult.breakdown.levelBonus} XP</span>
              </div>
            </div>
            <button 
              onClick={() => setShowCheckInSuccess(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check-in no Ginásio</h2>
        <p className="text-gray-600 dark:text-gray-400">Escaneie o QR Code para registrar sua presença</p>
      </div>

      {/* Gym Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Ginásio Selecionado</label>
        <select 
          value={selectedGym}
          onChange={(e) => setSelectedGym(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        >
          {gyms.map(gym => (
            <option key={gym.id} value={gym.id}>{gym.name} ({gym.members_count} membros)</option>
          ))}
        </select>
      </div>

      {/* QR Code Scanner */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="bg-white rounded-2xl p-8 mb-6 aspect-square flex items-center justify-center relative overflow-hidden">
          <div className="text-center z-10">
            <QrCode className="w-32 h-32 mx-auto text-purple-600 mb-4 animate-pulse" />
            <p className="text-gray-600 font-medium">Escaneie o QR Code do ginásio</p>
          </div>
          {/* Scanner animation */}
          <div className="absolute inset-0 border-4 border-purple-500 rounded-2xl animate-scan" />
        </div>
        
        {/* GPS Status with Animation */}
        <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 transition-all duration-500 ${
          gpsActive ? 'border-2 border-green-400' : 'border-2 border-white/20'
        }`}>
          <div className="flex items-center gap-3 text-white">
            <div className="relative">
              <MapPin className={`w-5 h-5 ${gpsActive ? 'text-green-400' : 'text-gray-400'} transition-colors`} />
              {gpsActive && (
                <Radio className="w-3 h-3 text-green-400 absolute -top-1 -right-1 animate-ping" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm text-purple-200">Localização GPS</div>
              <div className="font-semibold">
                {gpsActive ? 'Localização confirmada ✓' : 'Verificando proximidade...'}
              </div>
            </div>
            <div className={`rounded-full p-1 transition-all ${
              gpsActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <button 
          onClick={handleCheckIn}
          disabled={!gpsActive}
          className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg transform ${
            gpsActive 
              ? 'bg-white text-purple-700 hover:bg-purple-50 hover:scale-105 cursor-pointer' 
              : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          {gpsActive ? 'Fazer Check-in' : 'Aguardando GPS...'}
        </button>
      </div>

      {/* Streak Info */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="text-3xl font-bold">{user.current_streak} dias</div>
            <div className="text-orange-100">Sequência atual</div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
          <div className="text-sm text-orange-100 mb-1">Recorde pessoal</div>
          <div className="text-xl font-bold">{user.longest_streak} dias consecutivos</div>
        </div>
      </div>

      {/* Rewards Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          Recompensas deste Check-in
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Pontos base</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">+150 XP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Bônus de streak</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">+{user.current_streak * 5} XP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Bônus de nível</span>
            <span className="font-bold text-green-600 dark:text-green-400">+{user.level * 2} XP</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-gray-100">Total</span>
            <span className="font-bold text-xl text-purple-600 dark:text-purple-400">+{150 + (user.current_streak * 5) + (user.level * 2)} XP</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Rankings View
  const RankingsView = () => {
    const top3 = rankings.slice(0, 3);
    const restRankings = rankings.slice(3);

    return (
      <div className="space-y-6 pb-24">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Rankings</h2>
          <p className="text-gray-600 dark:text-gray-400">Veja sua posição entre os membros</p>
        </div>

        {/* Period Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg border border-gray-100 dark:border-gray-700 grid grid-cols-4 gap-2">
          {([ 
            { key: "monthly", label: "Mensal" },
            { key: "quarterly", label: "Trimestral" },
            { key: "seasonal", label: "Sazonal" },
            { key: "annual", label: "Anual" }
          ] as const).map(period => (
            <button
              key={period.key}
              onClick={() => {
                setRankingPeriod(period.key);
                getRankings(selectedGym, period.key).then(setRankings);
              }}
              className={`py-2.5 px-3 rounded-xl font-medium text-sm transition-all transform ${
                rankingPeriod === period.key
                  ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 items-end mb-6">
            {/* 2nd Place */}
            <div className="text-center transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl p-4 mb-2 shadow-lg">
                <div className="bg-white rounded-full w-16 h-16 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-gray-700 border-4 border-gray-200">
                  {top3[1].avatar}
                </div>
                <div className="text-white font-bold text-sm mb-1">{top3[1].name.split(' ')[0]}</div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-white" fill="currentColor" />
                  <span className="text-xs text-white">Nv. {top3[1].level}</span>
                </div>
                <div className="text-white text-2xl font-bold">#2</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-2">
                <div className="text-xs text-gray-600 dark:text-gray-400">Pontos</div>
                <div className="font-bold text-gray-900 dark:text-gray-100">{top3[1].points}</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center transform hover:scale-110 transition-all">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 mb-2 shadow-2xl transform scale-110 relative">
                <Crown className="w-6 h-6 text-white mx-auto mb-2 animate-bounce" />
                <div className="bg-white rounded-full w-16 h-16 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-yellow-600 border-4 border-yellow-300">
                  {top3[0].avatar}
                </div>
                <div className="text-white font-bold text-sm mb-1">{top3[0].name.split(' ')[0]}</div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-white" fill="currentColor" />
                  <span className="text-xs text-white">Nv. {top3[0].level}</span>
                </div>
                <div className="text-white text-3xl font-bold">#1</div>
                <Sparkles className="w-4 h-4 text-white absolute top-2 right-2 animate-pulse" />
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-xl p-2">
                <div className="text-xs text-yellow-700 dark:text-yellow-400">Pontos</div>
                <div className="font-bold text-yellow-900 dark:text-yellow-300">{top3[0].points}</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-4 mb-2 shadow-lg">
                <div className="bg-white rounded-full w-16 h-16 mx-auto mb-2 flex items-center justify-center text-xl font-bold text-amber-700 border-4 border-amber-300">
                  {top3[2].avatar}
                </div>
                <div className="text-white font-bold text-sm mb-1">{top3[2].name.split(' ')[0]}</div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-white" fill="currentColor" />
                  <span className="text-xs text-white">Nv. {top3[2].level}</span>
                </div>
                <div className="text-white text-2xl font-bold">#3</div>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-2">
                <div className="text-xs text-amber-700 dark:text-amber-400">Pontos</div>
                <div className="font-bold text-amber-900 dark:text-amber-300">{top3[2].points}</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings List */}
        <div className="space-y-2">
          {rankings.map((rankUser, idx) => {
            const isCurrentUser = rankUser.id === user.id;
            const rank = idx + 1;

            return (
              <div 
                key={rankUser.id}
                className={`rounded-2xl p-4 shadow-md border transition-all hover:shadow-xl cursor-pointer ${
                  isCurrentUser
                    ? "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-300 dark:border-purple-700 shadow-lg transform scale-105"
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:scale-102"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`font-bold text-2xl w-8 text-center ${
                    rank === 1 ? "text-yellow-500" :
                    rank === 2 ? "text-gray-400" :
                    rank === 3 ? "text-amber-600" :
                    "text-gray-400 dark:text-gray-600"
                  }`}>
                    #{rank}
                  </div>
                  <div className={`rounded-full w-12 h-12 flex items-center justify-center font-bold text-white shadow-lg ${
                    isCurrentUser ? "bg-gradient-to-br from-purple-600 to-indigo-600 animate-pulse-slow" : "bg-gradient-to-br from-gray-400 to-gray-500"
                  }`}>
                    {rankUser.avatar}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold flex items-center gap-2 ${isCurrentUser ? "text-purple-900 dark:text-purple-100" : "text-gray-900 dark:text-gray-100"}`}>
                      {rankUser.name} {isCurrentUser && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Você</span>}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {rankUser.total_workouts} treinos
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {rankUser.current_streak}d streak
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" fill="currentColor" />
                        Nv. {rankUser.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-xl ${isCurrentUser ? "text-purple-600 dark:text-purple-400" : "text-gray-900 dark:text-gray-100"}`}>
                      {rankUser.points}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">pontos</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gym Selector */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6" />
            <h3 className="font-bold text-lg">Ginásio Atual</h3>
          </div>
          <select 
            value={selectedGym}
            onChange={(e) => {
              setSelectedGym(e.target.value);
              getRankings(e.target.value, rankingPeriod).then(setRankings);
            }}
            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
          >
            {gyms.map(gym => (
              <option key={gym.id} value={gym.id} className="text-gray-900">{gym.name}</option>
            ))}
          </select>
          <p className="text-purple-200 text-sm mt-3">Rankings são específicos por ginásio</p>
        </div>
      </div>
    );
  };

  // Challenges View
  const ChallengesView = () => {
    const activeChallenges = mergedChallenges.filter(c => !c.completed);
    const completedChallenges = mergedChallenges.filter(c => c.completed);

    return (
      <div className="space-y-6 pb-24">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Desafios</h2>
          <p className="text-gray-600 dark:text-gray-400">Complete desafios e ganhe recompensas</p>
        </div>

        {/* Active Challenges */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
            Desafios Ativos
          </h3>
          <div className="space-y-4">
            {activeChallenges.map((challenge, idx) => (
              <div 
                key={challenge.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all transform hover:scale-102"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">{challenge.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{challenge.description}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${challenge.color} rounded-xl px-4 py-2 ml-4 shadow-lg animate-pulse-slow`}>
                    <div className="flex items-center gap-1 text-white">
                      <Trophy className="w-5 h-5" />
                      <span className="font-bold">+{challenge.reward}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Progresso</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{challenge.progress} / {challenge.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className={`bg-gradient-to-r ${challenge.color} h-full rounded-full transition-all duration-500 relative`}
                      style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                        {Math.round((challenge.progress / challenge.total) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {challenge.daysLeft} dias restantes
                    </span>
                    <span className={`font-semibold flex items-center gap-1 ${
                      (challenge.progress / challenge.total) >= 0.8 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {challenge.total - challenge.progress} restantes
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Desafios Concluídos
            </h3>
            <div className="space-y-3">
              {completedChallenges.map((challenge, idx) => (
                <div key={challenge.id} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 rounded-full p-2 animate-pulse-slow">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">{challenge.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Concluído</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-400">+{challenge.reward}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">pontos</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewards Info */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-8 h-8 animate-bounce-slow" />
            <h3 className="font-bold text-xl">Sistema de Recompensas</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between hover:bg-white/20 transition-all">
              <span>Desafios semanais</span>
              <span className="font-bold">300-800 XP</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between hover:bg-white/20 transition-all">
              <span>Desafios mensais</span>
              <span className="font-bold">1000-2500 XP</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between hover:bg-white/20 transition-all">
              <span>Desafios especiais</span>
              <span className="font-bold">5000+ XP</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile View
  const ProfileView = () => (
    <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-6 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold text-purple-600 shadow-lg animate-pulse-slow">
            {user.avatar}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
            <div className="flex items-center gap-2 text-purple-200">
              <Star className="w-4 h-4" fill="currentColor" />
              <span>Nível {user.level}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="text-2xl font-bold">{user.total_workouts}</div>
            <div className="text-xs text-purple-200">Treinos</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="text-2xl font-bold">{user.longest_streak}</div>
            <div className="text-xs text-purple-200">Melhor Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center hover:bg-white/20 transition-all transform hover:scale-105">
            <div className="text-2xl font-bold">{userBadges.length}</div>
            <div className="text-xs text-purple-200">Badges</div>
          </div>
        </div>
      </div>

      {/* All Badges */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-500" />
          Todas as Conquistas
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {mergedBadges.map((badge, idx) => (
            <div 
              key={badge.id} 
              className={`rounded-2xl p-4 text-center border-2 shadow-lg transition-all transform hover:scale-110 cursor-pointer ${
                badge.unlocked
                  ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700 hover:shadow-2xl"
                  : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-50"
              }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className={`text-4xl mb-2 ${!badge.unlocked && "grayscale"} ${badge.recent && "animate-bounce-slow"}`}>
                {badge.icon}
                {badge.recent && badge.unlocked && (
                  <Sparkles className="w-4 h-4 text-yellow-500 inline-block ml-1 animate-pulse" />
                )}
              </div>
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">{badge.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{badge.description}</div>
              {!badge.unlocked && (
                <div className="mt-2">
                  <Lock className="w-4 h-4 mx-auto text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Estatísticas Gerais</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-2">
                <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Total de Pontos</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">{user.points}</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-2">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Streak Atual</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">{user.current_streak} dias</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Total de Treinos</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">{user.total_workouts}</span>
          </div>
          <div className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Ranking Atual</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">#{userRank || '-'}</span>
          </div>
        </div>
      </div>

      {/* Gym Memberships */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Meus Ginásios</h3>
        <div className="space-y-3">
          {gyms.map(gym => (
            <div key={gym.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-xl transition-all cursor-pointer transform hover:scale-102">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100">{gym.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{gym.members_count} membros ativos</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </button>
    </div>
  );

  return (
    <>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {}}
        onSuccess={loadUser}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-2.5 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">GymLeague</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{currentGym?.name || 'Carregando...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                  <Flame className="w-4 h-4 text-white" />
                  <span className="font-bold text-white">{user.current_streak}</span>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                  <Star className="w-4 h-4 text-white" fill="currentColor" />
                  <span className="font-bold text-white">{user.level}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          {currentView === "dashboard" && <DashboardView />}
          {currentView === "checkin" && <CheckInView />}
          {currentView === "rankings" && <RankingsView />}
          {currentView === "challenges" && <ChallengesView />}
          {currentView === "profile" && <ProfileView />}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50">
          <div className="max-w-2xl mx-auto px-4">
            <div className="grid grid-cols-5 gap-1 py-2">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all transform hover:scale-105 ${
                  currentView === "dashboard"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span className="text-xs font-medium">Início</span>
              </button>
              <button
                onClick={() => setCurrentView("checkin")}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all transform hover:scale-105 ${
                  currentView === "checkin"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-medium">Check-in</span>
              </button>
              <button
                onClick={() => setCurrentView("rankings")}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all transform hover:scale-105 ${
                  currentView === "rankings"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <Medal className="w-5 h-5" />
                <span className="text-xs font-medium">Rankings</span>
              </button>
              <button
                onClick={() => setCurrentView("challenges")}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all transform hover:scale-105 ${
                  currentView === "challenges"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <Target className="w-5 h-5" />
                <span className="text-xs font-medium">Desafios</span>
              </button>
              <button
                onClick={() => setCurrentView("profile")}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all transform hover:scale-105 ${
                  currentView === "profile"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <Award className="w-5 h-5" />
                <span className="text-xs font-medium">Perfil</span>
              </button>
            </div>
          </div>
        </nav>

        <style jsx global>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes confetti {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes scan {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          .animate-confetti {
            animation: confetti linear forwards;
          }
          .animate-scan {
            animation: scan 2s infinite;
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s infinite;
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s infinite;
          }
          .hover\\:scale-102:hover {
            transform: scale(1.02);
          }
        `}</style>
      </div>
    </>
  );
}
