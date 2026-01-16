import { createContext, useContext, useState, ReactNode } from "react";

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: false,
  toggleSound: () => {},
});

export const useSoundContext = () => useContext(SoundContext);

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("soundEnabled");
    return saved === "true";
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem("soundEnabled", String(newValue));
      return newValue;
    });
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound }}>
      {children}
    </SoundContext.Provider>
  );
};
