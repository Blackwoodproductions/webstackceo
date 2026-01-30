/**
 * Performance Monitoring Hook
 * 
 * Tracks Core Web Vitals and component render performance.
 * Provides actionable insights for optimization.
 */

import { useEffect, useRef, useCallback } from 'react';

// ─── Types ───
interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number;  // Largest Contentful Paint
  fid?: number;  // First Input Delay
  cls?: number;  // Cumulative Layout Shift
  fcp?: number;  // First Contentful Paint
  ttfb?: number; // Time to First Byte
  inp?: number;  // Interaction to Next Paint
  
  // Custom metrics
  componentRenderTime?: number;
  hydrationTime?: number;
  dataFetchTime?: number;
}

interface PerformanceEntry {
  timestamp: number;
  route: string;
  metrics: PerformanceMetrics;
}

// ─── Constants ───
const METRICS_STORAGE_KEY = 'webstack_performance_metrics';
const MAX_ENTRIES = 50;
const REPORT_THRESHOLD = {
  lcp: 2500,   // Good < 2.5s
  fid: 100,    // Good < 100ms
  cls: 0.1,    // Good < 0.1
  fcp: 1800,   // Good < 1.8s
  ttfb: 800,   // Good < 800ms
  inp: 200,    // Good < 200ms
};

// ─── Utility Functions ───
function getPerformanceRating(metric: keyof typeof REPORT_THRESHOLD, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = REPORT_THRESHOLD[metric];
  if (value <= threshold) return 'good';
  if (value <= threshold * 2.5) return 'needs-improvement';
  return 'poor';
}

function saveMetrics(entry: PerformanceEntry): void {
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    const entries: PerformanceEntry[] = raw ? JSON.parse(raw) : [];
    entries.push(entry);
    
    // Keep only recent entries
    if (entries.length > MAX_ENTRIES) {
      entries.splice(0, entries.length - MAX_ENTRIES);
    }
    
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('[Performance] Failed to save metrics:', e);
  }
}

function loadMetrics(): PerformanceEntry[] {
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Web Vitals Collection ───
function observeWebVitals(callback: (metrics: Partial<PerformanceMetrics>) => void): () => void {
  const metrics: Partial<PerformanceMetrics> = {};
  const observers: PerformanceObserver[] = [];
  
  // LCP Observer
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metrics.lcp = lastEntry.startTime;
        callback({ lcp: metrics.lcp });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    observers.push(lcpObserver);
  } catch { /* Not supported */ }
  
  // FID Observer
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming | undefined;
      if (firstEntry) {
        metrics.fid = firstEntry.processingStart - firstEntry.startTime;
        callback({ fid: metrics.fid });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    observers.push(fidObserver);
  } catch { /* Not supported */ }
  
  // CLS Observer
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Use type assertion safely
        const layoutShift = entry as unknown as { hadRecentInput: boolean; value: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
          metrics.cls = clsValue;
          callback({ cls: metrics.cls });
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    observers.push(clsObserver);
  } catch { /* Not supported */ }
  
  // FCP from Navigation Timing
  try {
    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
        callback({ fcp: metrics.fcp });
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });
    observers.push(paintObserver);
  } catch { /* Not supported */ }
  
  // TTFB from Navigation Timing
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
      callback({ ttfb: metrics.ttfb });
    }
  } catch { /* Not supported */ }
  
  // INP Observer (Interaction to Next Paint)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      for (const entry of entries) {
        const inp = entry.processingEnd - entry.startTime;
        if (!metrics.inp || inp > metrics.inp) {
          metrics.inp = inp;
          callback({ inp: metrics.inp });
        }
      }
    });
    inpObserver.observe({ type: 'event', buffered: true });
    observers.push(inpObserver);
  } catch { /* Not supported */ }
  
  return () => {
    observers.forEach(o => o.disconnect());
  };
}

// ─── Main Hook ───
export function usePerformanceMonitor(componentName?: string) {
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});
  const renderStartRef = useRef<number>(performance.now());
  const mountTimeRef = useRef<number>(0);
  
  // Track component render time
  useEffect(() => {
    mountTimeRef.current = performance.now() - renderStartRef.current;
    metricsRef.current.componentRenderTime = mountTimeRef.current;
    
    if (componentName && mountTimeRef.current > 100) {
      console.warn(`[Performance] ${componentName} slow render: ${mountTimeRef.current.toFixed(1)}ms`);
    }
  }, [componentName]);
  
  // Observe Core Web Vitals
  useEffect(() => {
    const handleMetrics = (newMetrics: Partial<PerformanceMetrics>) => {
      metricsRef.current = { ...metricsRef.current, ...newMetrics };
      
      // Log warnings for poor metrics
      if (newMetrics.lcp && newMetrics.lcp > REPORT_THRESHOLD.lcp * 2) {
        console.warn(`[Performance] LCP is poor: ${newMetrics.lcp.toFixed(0)}ms (threshold: ${REPORT_THRESHOLD.lcp}ms)`);
      }
      if (newMetrics.cls && newMetrics.cls > REPORT_THRESHOLD.cls * 2) {
        console.warn(`[Performance] CLS is poor: ${newMetrics.cls.toFixed(3)} (threshold: ${REPORT_THRESHOLD.cls})`);
      }
    };
    
    const cleanup = observeWebVitals(handleMetrics);
    
    // Save metrics on page hide
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveMetrics({
          timestamp: Date.now(),
          route: window.location.pathname,
          metrics: metricsRef.current,
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Track data fetch time
  const trackFetch = useCallback((startTime: number) => {
    const duration = performance.now() - startTime;
    metricsRef.current.dataFetchTime = duration;
    
    if (duration > 3000) {
      console.warn(`[Performance] Slow data fetch: ${duration.toFixed(0)}ms`);
    }
    
    return duration;
  }, []);
  
  // Get performance report
  const getReport = useCallback(() => {
    const entries = loadMetrics();
    const current = metricsRef.current;
    
    const ratings: Record<string, { value: number; rating: string }> = {};
    
    if (current.lcp) {
      ratings.lcp = { value: current.lcp, rating: getPerformanceRating('lcp', current.lcp) };
    }
    if (current.fid) {
      ratings.fid = { value: current.fid, rating: getPerformanceRating('fid', current.fid) };
    }
    if (current.cls !== undefined) {
      ratings.cls = { value: current.cls, rating: getPerformanceRating('cls', current.cls) };
    }
    if (current.fcp) {
      ratings.fcp = { value: current.fcp, rating: getPerformanceRating('fcp', current.fcp) };
    }
    if (current.ttfb) {
      ratings.ttfb = { value: current.ttfb, rating: getPerformanceRating('ttfb', current.ttfb) };
    }
    if (current.inp) {
      ratings.inp = { value: current.inp, rating: getPerformanceRating('inp', current.inp) };
    }
    
    return {
      current: ratings,
      history: entries.slice(-10),
      recommendations: generateRecommendations(current),
    };
  }, []);
  
  return {
    metrics: metricsRef.current,
    trackFetch,
    getReport,
    mountTime: mountTimeRef.current,
  };
}

// ─── Recommendations Generator ───
function generateRecommendations(metrics: Partial<PerformanceMetrics>): string[] {
  const recommendations: string[] = [];
  
  if (metrics.lcp && metrics.lcp > REPORT_THRESHOLD.lcp) {
    recommendations.push('LCP is slow - consider lazy loading images and optimizing largest elements');
  }
  
  if (metrics.cls && metrics.cls > REPORT_THRESHOLD.cls) {
    recommendations.push('Layout shifts detected - add explicit dimensions to images and embeds');
  }
  
  if (metrics.fid && metrics.fid > REPORT_THRESHOLD.fid) {
    recommendations.push('First Input Delay is high - reduce JavaScript blocking time');
  }
  
  if (metrics.ttfb && metrics.ttfb > REPORT_THRESHOLD.ttfb) {
    recommendations.push('TTFB is slow - consider edge caching or CDN optimization');
  }
  
  if (metrics.componentRenderTime && metrics.componentRenderTime > 100) {
    recommendations.push('Component render time is high - use React.memo and useMemo for expensive components');
  }
  
  if (metrics.dataFetchTime && metrics.dataFetchTime > 3000) {
    recommendations.push('Data fetching is slow - implement caching and parallel requests');
  }
  
  return recommendations;
}

// ─── Utility Hook for Render Tracking ───
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  useEffect(() => {
    if (renderCount.current > 10) {
      console.warn(`[Performance] ${componentName} has rendered ${renderCount.current} times - check for unnecessary re-renders`);
    }
  });
  
  return renderCount.current;
}

// ─── Export Performance Report Function ───
export function getPerformanceReport(): { metrics: PerformanceEntry[]; summary: Record<string, number> } {
  const entries = loadMetrics();
  
  // Calculate averages
  const summary: Record<string, number> = {};
  const counts: Record<string, number> = {};
  
  for (const entry of entries) {
    for (const [key, value] of Object.entries(entry.metrics)) {
      if (typeof value === 'number') {
        summary[key] = (summary[key] || 0) + value;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }
  
  // Calculate averages
  for (const key of Object.keys(summary)) {
    summary[key] = summary[key] / counts[key];
  }
  
  return { metrics: entries, summary };
}
