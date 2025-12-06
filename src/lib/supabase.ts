import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type User = {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  gym_id: string;
  points: number;
  current_streak: number;
  longest_streak: number;
  level: number;
  xp: number;
  total_workouts: number;
  avatar: string;
  created_at: string;
  updated_at: string;
};

export type Gym = {
  id: string;
  name: string;
  members_count: number;
  created_at: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  gym_id: string;
  timestamp: string;
  points_earned: number;
  check_in_type: string;
  duration_minutes?: number;
  created_at: string;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  type: string;
  goal_value: number;
  reward_points: number;
  start_date: string;
  end_date?: string;
  status: string;
  color_gradient: string;
  created_at: string;
};

export type UserChallenge = {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string;
  points_required: number;
  stock: number;
  image_url?: string;
  created_at: string;
};
