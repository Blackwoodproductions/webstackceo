import { useCallback, useRef } from "react";

type SoundType = "hover" | "click" | "success" | "whoosh" | "code";

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastCodeSoundRef = useRef<number>(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case "hover":
          // Soft, subtle hover sound
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(800, now);
          oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
          gainNode.gain.setValueAtTime(0.03, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          oscillator.start(now);
          oscillator.stop(now + 0.08);
          break;

        case "click":
          // Satisfying click sound
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(600, now);
          oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
          gainNode.gain.setValueAtTime(0.08, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;

        case "success":
          // Two-tone success chime
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(523, now); // C5
          oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
          gainNode.gain.setValueAtTime(0.06, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          oscillator.start(now);
          oscillator.stop(now + 0.25);
          break;

        case "whoosh":
          // Soft whoosh for transitions
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(150, now);
          oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.15);
          gainNode.gain.setValueAtTime(0.04, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          oscillator.start(now);
          oscillator.stop(now + 0.15);
          break;

        case "code":
          // Prevent rapid re-triggering (debounce 2 seconds)
          if (now - lastCodeSoundRef.current < 2) break;
          lastCodeSoundRef.current = now;
          
          // Modern computer/tech processing sound - layered tones
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const osc3 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          const gain2 = ctx.createGain();
          const gain3 = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(2000, now);
          filter.frequency.exponentialRampToValueAtTime(800, now + 1.5);
          
          // Base digital hum
          osc1.type = "sawtooth";
          osc1.frequency.setValueAtTime(120, now);
          osc1.frequency.setValueAtTime(140, now + 0.3);
          osc1.frequency.setValueAtTime(100, now + 0.8);
          osc1.frequency.setValueAtTime(130, now + 1.2);
          gain1.gain.setValueAtTime(0.02, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 2);
          
          // High-pitched processing beeps
          osc2.type = "square";
          osc2.frequency.setValueAtTime(1800, now);
          osc2.frequency.setValueAtTime(2200, now + 0.1);
          osc2.frequency.setValueAtTime(1600, now + 0.2);
          osc2.frequency.setValueAtTime(2000, now + 0.4);
          osc2.frequency.setValueAtTime(1400, now + 0.6);
          osc2.frequency.setValueAtTime(2400, now + 0.9);
          osc2.frequency.setValueAtTime(1800, now + 1.2);
          gain2.gain.setValueAtTime(0.015, now);
          gain2.gain.linearRampToValueAtTime(0.02, now + 0.5);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 2);
          
          // Soft sine undertone
          osc3.type = "sine";
          osc3.frequency.setValueAtTime(300, now);
          osc3.frequency.exponentialRampToValueAtTime(200, now + 2);
          gain3.gain.setValueAtTime(0.03, now);
          gain3.gain.exponentialRampToValueAtTime(0.001, now + 2);
          
          osc1.connect(gain1);
          osc2.connect(gain2);
          osc3.connect(gain3);
          gain1.connect(filter);
          gain2.connect(filter);
          gain3.connect(filter);
          filter.connect(ctx.destination);
          
          osc1.start(now);
          osc2.start(now);
          osc3.start(now);
          osc1.stop(now + 2);
          osc2.stop(now + 2);
          osc3.stop(now + 2);
          return; // Early return since we handled our own oscillators
      }
    } catch (e) {
      // Silently fail if audio is not supported
      console.debug("Audio not supported:", e);
    }
  }, [getAudioContext]);

  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" = "light") => {
    if ("vibrate" in navigator) {
      const patterns = {
        light: [5],
        medium: [10],
        heavy: [20],
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return { playSound, triggerHaptic };
};
