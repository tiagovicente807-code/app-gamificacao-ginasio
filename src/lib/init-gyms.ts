import { supabase } from './supabase';

// Ginásios iniciais que devem estar sempre disponíveis
const INITIAL_GYMS = [
  { name: 'Lift Fitness – Lagos', members_count: 0 },
  { name: 'Fit Club – Faro', members_count: 0 },
  { name: 'Energy Gym – Portimão', members_count: 0 },
  { name: 'Power House – Albufeira', members_count: 0 },
  { name: 'BodyLab – Tavira', members_count: 0 },
];

/**
 * Inicializa os ginásios no banco de dados se ainda não existirem
 * Esta função é chamada automaticamente quando necessário
 */
export async function initializeGyms() {
  try {
    // Verificar se já existem ginásios
    const { data: existingGyms, error: fetchError } = await supabase
      .from('gyms')
      .select('name');

    if (fetchError) {
      console.error('Erro ao verificar ginásios existentes:', fetchError);
      return;
    }

    // Se já existem ginásios, não fazer nada
    if (existingGyms && existingGyms.length > 0) {
      return;
    }

    // Inserir ginásios iniciais
    const { error: insertError } = await supabase
      .from('gyms')
      .insert(INITIAL_GYMS);

    if (insertError) {
      console.error('Erro ao inserir ginásios iniciais:', insertError);
      return;
    }

    console.log('✅ Ginásios iniciais criados com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar ginásios:', error);
  }
}

/**
 * Garante que os ginásios iniciais existam
 * Adiciona apenas os que estão faltando
 */
export async function ensureInitialGyms() {
  try {
    const { data: existingGyms } = await supabase
      .from('gyms')
      .select('name');

    const existingNames = new Set(existingGyms?.map(g => g.name) || []);
    const missingGyms = INITIAL_GYMS.filter(gym => !existingNames.has(gym.name));

    if (missingGyms.length > 0) {
      await supabase.from('gyms').insert(missingGyms);
      console.log(`✅ ${missingGyms.length} ginásios adicionados`);
    }
  } catch (error) {
    console.error('Erro ao garantir ginásios iniciais:', error);
  }
}
