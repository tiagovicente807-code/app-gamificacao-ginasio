import { supabase } from './supabase';

export async function signUp(email: string, password: string, name: string, gymId: string) {
  // Criar avatar com iniciais do nome
  const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // 1. Criar usuário no Supabase Auth com metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        gym_id: gymId,
        avatar,
      }
    }
  });

  if (authError) throw authError;

  // NÃO criar perfil aqui - será criado no primeiro login
  // Isso evita o erro de duplicação de email

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Após login bem-sucedido, garantir que o perfil existe
  if (data.user) {
    // Verificar se perfil já existe pelo auth_id
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', data.user.id)
      .maybeSingle();

    // Se perfil não existe, criar agora
    if (!existingProfile) {
      const metadata = data.user.user_metadata;
      
      // Verificar se já existe um perfil com este email (caso de migração)
      const { data: emailProfile } = await supabase
        .from('users')
        .select('id, auth_id')
        .eq('email', data.user.email!)
        .maybeSingle();

      if (emailProfile && !emailProfile.auth_id) {
        // Atualizar perfil existente com auth_id
        await supabase
          .from('users')
          .update({
            auth_id: data.user.id,
            name: metadata.name || emailProfile.name,
            gym_id: metadata.gym_id || emailProfile.gym_id,
            avatar: metadata.avatar || emailProfile.avatar || 'US',
          })
          .eq('id', emailProfile.id);
      } else if (!emailProfile) {
        // Criar novo perfil
        await supabase
          .from('users')
          .insert({
            auth_id: data.user.id,
            name: metadata.name || 'Usuário',
            email: data.user.email!,
            gym_id: metadata.gym_id,
            avatar: metadata.avatar || 'US',
            points: 0,
            current_streak: 0,
            longest_streak: 0,
            level: 1,
            xp: 0,
            total_workouts: 0,
          });
      }
    }
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Buscar perfil pelo auth_id
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .maybeSingle();

  // Se perfil não existe, criar agora (fallback de segurança)
  if (!profile) {
    const metadata = user.user_metadata;
    
    // Verificar se já existe um perfil com este email
    const { data: emailProfile } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email!)
      .maybeSingle();

    if (emailProfile && !emailProfile.auth_id) {
      // Atualizar perfil existente com auth_id
      const { data: updatedProfile } = await supabase
        .from('users')
        .update({
          auth_id: user.id,
          name: metadata.name || emailProfile.name,
          gym_id: metadata.gym_id || emailProfile.gym_id,
          avatar: metadata.avatar || emailProfile.avatar || 'US',
        })
        .eq('id', emailProfile.id)
        .select()
        .single();

      return updatedProfile;
    } else if (!emailProfile) {
      // Criar novo perfil
      const { data: newProfile } = await supabase
        .from('users')
        .insert({
          auth_id: user.id,
          name: metadata.name || 'Usuário',
          email: user.email!,
          gym_id: metadata.gym_id,
          avatar: metadata.avatar || 'US',
          points: 0,
          current_streak: 0,
          longest_streak: 0,
          level: 1,
          xp: 0,
          total_workouts: 0,
        })
        .select()
        .single();

      return newProfile;
    }
  }

  return profile;
}
