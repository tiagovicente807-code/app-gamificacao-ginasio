import { supabase, type User, type CheckIn, type Challenge, type UserChallenge, type Badge, type UserBadge } from './supabase';
import { ensureInitialGyms } from './init-gyms';

// Get user data with all stats
export async function getUserData(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// Get all gyms
export async function getGyms() {
  // Garantir que os ginásios iniciais existam
  await ensureInitialGyms();
  
  const { data, error } = await supabase
    .from('gyms')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

// Check-in functionality
export async function performCheckIn(userId: string, gymId: string, checkInType: string = 'regular') {
  const user = await getUserData(userId);
  
  // Calculate points with bonuses
  const basePoints = 150;
  const streakBonus = Math.floor(user.current_streak * 5);
  const levelBonus = Math.floor(user.level * 2);
  const totalPoints = basePoints + streakBonus + levelBonus;

  // Insert check-in
  const { data: checkIn, error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      user_id: userId,
      gym_id: gymId,
      check_in_type: checkInType,
      points_earned: totalPoints,
    })
    .select()
    .single();

  if (checkInError) throw checkInError;

  // Update user stats
  const newXp = user.xp + totalPoints;
  const newLevel = Math.floor(newXp / 3000) + 1;
  const newTotalWorkouts = user.total_workouts + 1;

  // Calculate streak
  const lastCheckIn = await getLastCheckIn(userId);
  let newStreak = user.current_streak;
  
  if (lastCheckIn) {
    const lastDate = new Date(lastCheckIn.timestamp);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const newLongestStreak = Math.max(user.longest_streak, newStreak);

  const { error: updateError } = await supabase
    .from('users')
    .update({
      xp: newXp,
      level: newLevel,
      points: user.points + totalPoints,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      total_workouts: newTotalWorkouts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) throw updateError;

  // Update challenge progress
  await updateChallengeProgress(userId);

  // Check and unlock badges
  await checkAndUnlockBadges(userId);

  return {
    checkIn,
    pointsEarned: totalPoints,
    breakdown: {
      base: basePoints,
      streakBonus,
      levelBonus,
    },
    newLevel,
    newStreak,
  };
}

// Get last check-in
async function getLastCheckIn(userId: string) {
  const { data } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  return data;
}

// Get recent check-ins
export async function getRecentCheckIns(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get rankings by period and gym
export async function getRankings(gymId: string, period: 'monthly' | 'quarterly' | 'seasonal' | 'annual' = 'monthly') {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case 'monthly':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarterly':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'seasonal':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'annual':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('gym_id', gymId)
    .order('points', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

// Get active challenges
export async function getActiveChallenges() {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get user challenge progress
export async function getUserChallenges(userId: string) {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

// Update challenge progress
async function updateChallengeProgress(userId: string) {
  const challenges = await getActiveChallenges();
  const user = await getUserData(userId);

  for (const challenge of challenges) {
    let progress = 0;

    switch (challenge.type) {
      case 'frequency':
        // Count check-ins this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const { count } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('timestamp', weekStart.toISOString());
        progress = count || 0;
        break;

      case 'monthly':
        // Count check-ins this month
        const monthStart = new Date();
        monthStart.setDate(1);
        const { count: monthCount } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('timestamp', monthStart.toISOString());
        progress = monthCount || 0;
        break;

      case 'streak':
        progress = user.current_streak;
        break;
    }

    const completed = progress >= challenge.goal_value;

    // Upsert user challenge
    const { error } = await supabase
      .from('user_challenges')
      .upsert({
        user_id: userId,
        challenge_id: challenge.id,
        progress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,challenge_id'
      });

    if (error && error.code !== '23505') { // Ignore unique constraint errors
      console.error('Error updating challenge:', error);
    }

    // Award points if completed
    if (completed) {
      const { data: existingChallenge } = await supabase
        .from('user_challenges')
        .select('completed')
        .eq('user_id', userId)
        .eq('challenge_id', challenge.id)
        .single();

      if (existingChallenge && !existingChallenge.completed) {
        await supabase
          .from('users')
          .update({
            points: user.points + challenge.reward_points,
            xp: user.xp + challenge.reward_points,
          })
          .eq('id', userId);
      }
    }
  }
}

// Get all badges
export async function getAllBadges() {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('requirement_value');

  if (error) throw error;
  return data;
}

// Get user badges - CORRIGIDO: busca separada sem JOIN
export async function getUserBadges(userId: string) {
  // Buscar user_badges do usuário
  const { data: userBadgesData, error: userBadgesError } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (userBadgesError) throw userBadgesError;
  
  // Se não tem badges, retornar array vazio
  if (!userBadgesData || userBadgesData.length === 0) {
    return [];
  }

  // Buscar os badges correspondentes
  const badgeIds = userBadgesData.map(ub => ub.badge_id);
  const { data: badgesData, error: badgesError } = await supabase
    .from('badges')
    .select('*')
    .in('id', badgeIds);

  if (badgesError) throw badgesError;

  // Combinar os dados manualmente
  return userBadgesData.map(userBadge => ({
    ...userBadge,
    badges: badgesData?.find(b => b.id === userBadge.badge_id) || null
  }));
}

// Check and unlock badges
async function checkAndUnlockBadges(userId: string) {
  const badges = await getAllBadges();
  const user = await getUserData(userId);
  const userBadges = await getUserBadges(userId);
  const unlockedBadgeIds = userBadges.map(ub => ub.badge_id);

  for (const badge of badges) {
    if (unlockedBadgeIds.includes(badge.id)) continue;

    let shouldUnlock = false;

    switch (badge.requirement_type) {
      case 'first_workout':
        shouldUnlock = user.total_workouts >= 1;
        break;

      case 'streak':
        shouldUnlock = user.current_streak >= badge.requirement_value;
        break;

      case 'total_workouts':
        shouldUnlock = user.total_workouts >= badge.requirement_value;
        break;

      case 'morning_workouts':
        const { count: morningCount } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('check_in_type', 'morning');
        shouldUnlock = (morningCount || 0) >= badge.requirement_value;
        break;

      case 'night_workouts':
        const { count: nightCount } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('check_in_type', 'night');
        shouldUnlock = (nightCount || 0) >= badge.requirement_value;
        break;

      case 'rank_1':
        const rankings = await getRankings(user.gym_id, 'monthly');
        shouldUnlock = rankings[0]?.id === userId;
        break;
    }

    if (shouldUnlock) {
      await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
        });
    }
  }
}

// Get rewards
export async function getRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('points_required');

  if (error) throw error;
  return data;
}

// Get points evolution data
export async function getPointsEvolution(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('check_ins')
    .select('timestamp, points_earned')
    .eq('user_id', userId)
    .gte('timestamp', startDate.toISOString())
    .order('timestamp');

  if (error) throw error;
  return data;
}
