import { useRef, useEffect, useState, useCallback } from "react";

interface InteractiveGridProps {
  className?: string;
  cellSize?: number;
  glowRadius?: number;
  glowColor?: string;
  glowIntensity?: number;
}

const InteractiveGrid = ({
  className = "",
  cellSize = 60,
  glowRadius = 150,
  glowColor = "var(--primary)",
  glowIntensity = 0.4,
}: InteractiveGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get computed color value
  const getComputedColor = useCallback(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const primaryHsl = style.getPropertyValue("--primary").trim();
    if (primaryHsl) {
      return `hsl(${primaryHsl})`;
    }
    return "#3b82f6";
  }, []);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // For fixed position grids, use viewport coordinates directly
      // For absolute position grids, use container-relative coordinates
      if (containerRef.current) {
        const style = window.getComputedStyle(containerRef.current);
        if (style.position === 'fixed') {
          mousePos.current = {
            x: e.clientX,
            y: e.clientY,
          };
        } else {
          const rect = containerRef.current.getBoundingClientRect();
          mousePos.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
        }
      }
    };

    const handleMouseLeave = () => {
      mousePos.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const computedColor = getComputedColor();

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const { x: mx, y: my } = mousePos.current;
      
      // Draw grid lines with proximity-based highlighting
      const cols = Math.ceil(dimensions.width / cellSize) + 1;
      const rows = Math.ceil(dimensions.height / cellSize) + 1;

      // Draw vertical lines
      for (let i = 0; i <= cols; i++) {
        const x = i * cellSize;
        const distX = Math.abs(x - mx);
        
        for (let j = 0; j < rows; j++) {
          const y1 = j * cellSize;
          const y2 = (j + 1) * cellSize;
          const midY = (y1 + y2) / 2;
          const dist = Math.sqrt(distX * distX + (midY - my) * (midY - my));
          
          const intensity = Math.max(0, 1 - dist / glowRadius);
          const alpha = 0.08 + intensity * glowIntensity;
          
          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          
          if (intensity > 0) {
            ctx.strokeStyle = computedColor;
            ctx.globalAlpha = intensity * glowIntensity;
            ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = "currentColor";
            ctx.globalAlpha = 0.08;
            ctx.lineWidth = 1;
          }
          ctx.stroke();
        }
      }

      // Draw horizontal lines
      for (let j = 0; j <= rows; j++) {
        const y = j * cellSize;
        const distY = Math.abs(y - my);
        
        for (let i = 0; i < cols; i++) {
          const x1 = i * cellSize;
          const x2 = (i + 1) * cellSize;
          const midX = (x1 + x2) / 2;
          const dist = Math.sqrt((midX - mx) * (midX - mx) + distY * distY);
          
          const intensity = Math.max(0, 1 - dist / glowRadius);
          
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          
          if (intensity > 0) {
            ctx.strokeStyle = computedColor;
            ctx.globalAlpha = intensity * glowIntensity;
            ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = "currentColor";
            ctx.globalAlpha = 0.08;
            ctx.lineWidth = 1;
          }
          ctx.stroke();
        }
      }

      // Draw intersection highlights (dots at grid intersections)
      ctx.globalAlpha = 1;
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * cellSize;
          const y = j * cellSize;
          const dist = Math.sqrt((x - mx) * (x - mx) + (y - my) * (y - my));
          const intensity = Math.max(0, 1 - dist / (glowRadius * 0.8));
          
          if (intensity > 0.15) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5 + intensity * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = computedColor;
            ctx.globalAlpha = intensity * 0.6;
            ctx.fill();
          }
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, cellSize, glowRadius, glowColor, glowIntensity, getComputedColor]);

  return (
    <div ref={containerRef} className={`absolute inset-0 ${className}`}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ color: "hsl(var(--border))" }}
      />
    </div>
  );
};

export default InteractiveGrid;
