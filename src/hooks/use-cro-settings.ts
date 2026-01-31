import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CROSetting {
  key: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface CROSettings {
  exit_intent_popup: CROSetting | null;
  social_proof_toast: CROSetting | null;
  urgency_banner: CROSetting | null;
  sticky_bottom_cta: CROSetting | null;
}

// Track an interaction for analytics
export async function trackCROInteraction(
  component: string,
  action: 'view' | 'click' | 'dismiss' | 'convert',
  metadata?: Record<string, any>
) {
  try {
    const sessionId = sessionStorage.getItem('visitor_session_id') || 'anonymous';
    const pagePath = window.location.pathname;

    await supabase.from('cro_interactions').insert({
      component,
      action,
      session_id: sessionId,
      page_path: pagePath,
      metadata: metadata || {}
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience for analytics
    console.debug('[CRO] Failed to track interaction:', error);
  }
}

// Hook to get CRO settings
export function useCROSettings() {
  const [settings, setSettings] = useState<CROSettings>({
    exit_intent_popup: null,
    social_proof_toast: null,
    urgency_banner: null,
    sticky_bottom_cta: null
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cro_settings')
        .select('key, enabled, config');

      if (!error && data) {
        const settingsMap: CROSettings = {
          exit_intent_popup: null,
          social_proof_toast: null,
          urgency_banner: null,
          sticky_bottom_cta: null
        };

        data.forEach((row: { key: string; enabled: boolean; config: any }) => {
          if (row.key in settingsMap) {
            settingsMap[row.key as keyof CROSettings] = {
              key: row.key,
              enabled: row.enabled,
              config: typeof row.config === 'object' ? row.config : {}
            };
          }
        });

        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('[CRO] Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Helper to check if a component is enabled
  const isEnabled = useCallback((key: keyof CROSettings): boolean => {
    return settings[key]?.enabled ?? true; // Default to enabled if not found
  }, [settings]);

  // Helper to get config value
  const getConfig = useCallback(<T = any>(key: keyof CROSettings, configKey: string, defaultValue: T): T => {
    return (settings[key]?.config?.[configKey] as T) ?? defaultValue;
  }, [settings]);

  return {
    settings,
    loading,
    isEnabled,
    getConfig,
    refetch: fetchSettings
  };
}

export default useCROSettings;