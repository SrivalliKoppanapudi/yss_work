import { supabase } from '../../lib/Superbase';

export const getCurrentUserName = async (): Promise<string> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return 'User';
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;
    return data?.name || 'User';
  } catch (err) {
    console.error('Error fetching user name:', err);
    return 'User';
  }
};
