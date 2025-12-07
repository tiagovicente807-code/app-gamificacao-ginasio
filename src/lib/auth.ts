import { supabase } from './supabase';

export async function signUp(email: string, password: string, name: string, gymId: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  if (authData.user) {
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        name,
        email,
        gym_id: gymId,
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      });

    if (profileError) throw profileError;
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  return profile;
}
