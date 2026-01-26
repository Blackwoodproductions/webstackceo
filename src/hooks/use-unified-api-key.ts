import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const UNIFIED_KEY_NAME = "webstack_seo_api_key";
const LOCAL_STORAGE_KEY = "webstack_unified_api_key";

interface UseUnifiedApiKeyResult {
  apiKey: string | null;
  isLoading: boolean;
  isConnected: boolean;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
}

/**
 * Unified API key hook for BRON and CADE dashboards.
 * Once set, the key persists permanently and is shared between services.
 */
export function useUnifiedApiKey(): UseUnifiedApiKeyResult {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load API key from database or localStorage on mount
  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoading(true);
      
      try {
        // Check for logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          // Try database first (permanent storage)
          const { data: keyData } = await supabase
            .from("user_api_keys")
            .select("api_key_encrypted")
            .eq("user_id", user.id)
            .eq("service_name", UNIFIED_KEY_NAME)
            .maybeSingle();
          
          if (keyData?.api_key_encrypted) {
            setApiKeyState(keyData.api_key_encrypted);
            // Sync to localStorage for quick access
            localStorage.setItem(LOCAL_STORAGE_KEY, keyData.api_key_encrypted);
            setIsLoading(false);
            return;
          }
          
          // Fallback: check old keys (cade or bron) and migrate
          const { data: oldCadeKey } = await supabase
            .from("user_api_keys")
            .select("api_key_encrypted")
            .eq("user_id", user.id)
            .eq("service_name", "cade")
            .maybeSingle();
          
          if (oldCadeKey?.api_key_encrypted) {
            // Migrate old CADE key to unified key
            await saveKeyToDatabase(user.id, oldCadeKey.api_key_encrypted);
            setApiKeyState(oldCadeKey.api_key_encrypted);
            localStorage.setItem(LOCAL_STORAGE_KEY, oldCadeKey.api_key_encrypted);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to localStorage for quick access or non-logged-in users
        const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY) 
          || localStorage.getItem("cade_api_key"); // Legacy fallback
        
        if (storedKey) {
          setApiKeyState(storedKey);
          // Ensure it's in the new location
          localStorage.setItem(LOCAL_STORAGE_KEY, storedKey);
        }
      } catch (err) {
        console.error("[UnifiedApiKey] Failed to load:", err);
        
        // Last resort fallback
        const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY) 
          || localStorage.getItem("cade_api_key");
        if (storedKey) {
          setApiKeyState(storedKey);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadApiKey();
  }, []);

  // Helper to save key to database
  const saveKeyToDatabase = async (uid: string, key: string) => {
    try {
      await supabase
        .from("user_api_keys")
        .upsert({
          user_id: uid,
          service_name: UNIFIED_KEY_NAME,
          api_key_encrypted: key,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,service_name"
        });
    } catch (err) {
      console.error("[UnifiedApiKey] Failed to save to database:", err);
    }
  };

  // Set API key (persists permanently)
  const setApiKey = useCallback(async (key: string) => {
    if (!key.trim()) return;
    
    // Always save to localStorage immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, key);
    setApiKeyState(key);
    
    // Save to database if user is logged in
    if (userId) {
      await saveKeyToDatabase(userId, key);
    } else {
      // Check if user is logged in now
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await saveKeyToDatabase(user.id, key);
      }
    }
  }, [userId]);

  // Clear API key (disconnect)
  const clearApiKey = useCallback(async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setApiKeyState(null);
    
    if (userId) {
      await supabase
        .from("user_api_keys")
        .delete()
        .eq("user_id", userId)
        .eq("service_name", UNIFIED_KEY_NAME);
    }
  }, [userId]);

  return {
    apiKey,
    isLoading,
    isConnected: !!apiKey,
    setApiKey,
    clearApiKey,
  };
}
