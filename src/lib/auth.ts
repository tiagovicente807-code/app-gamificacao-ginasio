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

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function handleOAuthCallback() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Check if user profile exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  // If profile doesn't exist, create one
  if (!existingProfile) {
    // Get first gym as default
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id')
      .limit(1);

    const defaultGymId = gyms?.[0]?.id;

    if (defaultGymId) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          auth_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          gym_id: defaultGymId,
          avatar: user.user_metadata?.avatar_url || 
                  (user.user_metadata?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        });

      if (profileError) throw profileError;
    }
  }

  return user;
}
