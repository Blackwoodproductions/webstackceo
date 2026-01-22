import { useCallback, useEffect, useRef } from "react";

type SoundType = "hover" | "click" | "success" | "whoosh" | "code";

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  // Use wall-clock time for debounce because AudioContext.currentTime doesn't advance while suspended.
  const lastCodeSoundAtMsRef = useRef<number>(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Ensure audio can start even when sound was already enabled from localStorage.
  // Many browsers require an explicit user gesture (pointerdown/keydown) to unlock AudioContext.
  useEffect(() => {
    const unlock = () => {
      try {
        const ctx = getAudioContext();
        if (ctx.state === "suspended") {
          void ctx.resume();
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [getAudioContext]);

  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = getAudioContext();

      const exec = () => {
        const now = ctx.currentTime;

        switch (type) {
          case "code": {
            // Prevent rapid re-triggering (debounce 2 seconds)
            const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
            if (nowMs - lastCodeSoundAtMsRef.current < 2000) return;
            lastCodeSoundAtMsRef.current = nowMs;

            // Modern computer/tech processing sound - layered tones (a bit louder)
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            const gain2 = ctx.createGain();
            const gain3 = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(2200, now);
            filter.frequency.exponentialRampToValueAtTime(850, now + 1.5);

            // Base digital hum
            osc1.type = "sawtooth";
            osc1.frequency.setValueAtTime(120, now);
            osc1.frequency.setValueAtTime(140, now + 0.3);
            osc1.frequency.setValueAtTime(100, now + 0.8);
            osc1.frequency.setValueAtTime(130, now + 1.2);
            gain1.gain.setValueAtTime(0.04, now);
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
            gain2.gain.setValueAtTime(0.03, now);
            gain2.gain.linearRampToValueAtTime(0.04, now + 0.5);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 2);

            // Soft sine undertone
            osc3.type = "sine";
            osc3.frequency.setValueAtTime(300, now);
            osc3.frequency.exponentialRampToValueAtTime(200, now + 2);
            gain3.gain.setValueAtTime(0.05, now);
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
            return;
          }

          default: {
            // Single-oscillator sounds
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            switch (type) {
              case "hover":
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
                gainNode.gain.setValueAtTime(0.03, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                oscillator.start(now);
                oscillator.stop(now + 0.08);
                return;

              case "click":
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(600, now);
                oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                return;

              case "success":
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(523, now);
                oscillator.frequency.setValueAtTime(659, now + 0.1);
                gainNode.gain.setValueAtTime(0.06, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                oscillator.start(now);
                oscillator.stop(now + 0.25);
                return;

              case "whoosh":
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.15);
                gainNode.gain.setValueAtTime(0.04, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
                return;
            }
          }
        }
      };

      // Some browsers keep AudioContext suspended until explicitly resumed.
      if (ctx.state === "suspended") {
        ctx.resume().then(exec).catch(() => {
          // Silently fail
        });
        return;
      }

      exec();
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
