import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WhiteLabelSettings {
  id: string;
  user_id: string;
  logo_url: string | null;
  company_name: string | null;
  is_active: boolean;
  subscription_status: string;
}

export function useWhiteLabel() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [isWhiteLabelAdmin, setIsWhiteLabelAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRoles = useCallback(async () => {
    if (!user) {
      setIsWhiteLabelAdmin(false);
      setIsSuperAdmin(false);
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      // Check user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roleList = (roles || []).map(r => r.role);
      setIsWhiteLabelAdmin(roleList.includes('white_label_admin'));
      setIsSuperAdmin(roleList.includes('super_admin'));

      // Fetch white label settings if applicable
      if (roleList.includes('white_label_admin')) {
        const { data: wlSettings } = await supabase
          .from('white_label_settings')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        setSettings(wlSettings);
      }
    } catch (error) {
      console.error('Error checking white label status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkRoles();
  }, [checkRoles]);

  const updateLogo = useCallback(async (logoUrl: string) => {
    if (!user || !settings) return { error: 'No active white label settings' };

    try {
      const { error } = await supabase
        .from('white_label_settings')
        .update({ logo_url: logoUrl })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, logo_url: logoUrl } : null);
      return { error: null };
    } catch (error) {
      console.error('Error updating logo:', error);
      return { error: 'Failed to update logo' };
    }
  }, [user, settings]);

  const updateCompanyName = useCallback(async (companyName: string) => {
    if (!user || !settings) return { error: 'No active white label settings' };

    try {
      const { error } = await supabase
        .from('white_label_settings')
        .update({ company_name: companyName })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, company_name: companyName } : null);
      return { error: null };
    } catch (error) {
      console.error('Error updating company name:', error);
      return { error: 'Failed to update company name' };
    }
  }, [user, settings]);

  return {
    settings,
    isWhiteLabelAdmin,
    isSuperAdmin,
    loading,
    updateLogo,
    updateCompanyName,
    refresh: checkRoles,
  };
}

export default useWhiteLabel;
