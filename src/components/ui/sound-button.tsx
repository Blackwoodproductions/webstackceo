import { ButtonHTMLAttributes, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useSoundContext } from "@/contexts/SoundContext";

interface SoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "hero" | "heroOutline" | "glass";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  asChild?: boolean;
}

const SoundButton = forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ children, onMouseEnter, onClick, ...props }, ref) => {
    const { playSound, triggerHaptic } = useSoundEffects();
    const { soundEnabled } = useSoundContext();

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundEnabled) {
        playSound("hover");
      }
      onMouseEnter?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundEnabled) {
        playSound("click");
        triggerHaptic("light");
      }
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

SoundButton.displayName = "SoundButton";

export { SoundButton };
