import { useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef, RefObject } from "react";

interface UseParallaxOptions {
  offset?: number;
  direction?: "up" | "down";
}

export function useParallax(
  options: UseParallaxOptions = {}
): [RefObject<HTMLElement>, MotionValue<number>] {
  const { offset = 50, direction = "up" } = options;
  const ref = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === "up" ? [offset, -offset] : [-offset, offset]
  );

  return [ref, y];
}

export function useParallaxLayer(
  containerRef: RefObject<HTMLElement>,
  speed: number = 0.5
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);
}
