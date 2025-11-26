import { useState, useEffect } from 'react';

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const breakpoints: Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive() {
  const [screenSize, setScreenSize] = useState<BreakpointKey>('lg');
  const [windowWidth, setWindowWidth] = useState(0);
  
  // Legacy boolean states for backward compatibility
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      // Determine current breakpoint
      let currentBreakpoint: BreakpointKey = 'xs';
      Object.entries(breakpoints).forEach(([key, value]) => {
        if (width >= value) {
          currentBreakpoint = key as BreakpointKey;
        }
      });
      setScreenSize(currentBreakpoint);
      
      // Legacy boolean states
      setIsMobile(width < breakpoints.md);
      setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
      setIsMobileOrTablet(width < breakpoints.lg);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Utility functions
  const isBreakpoint = (breakpoint: BreakpointKey) => screenSize === breakpoint;
  const isBreakpointUp = (breakpoint: BreakpointKey) => windowWidth >= breakpoints[breakpoint];
  const isBreakpointDown = (breakpoint: BreakpointKey) => windowWidth < breakpoints[breakpoint];
  const isBreakpointBetween = (min: BreakpointKey, max: BreakpointKey) => 
    windowWidth >= breakpoints[min] && windowWidth < breakpoints[max];

  return { 
    // Current state
    screenSize,
    windowWidth,
    
    // Legacy boolean states
    isMobile, 
    isTablet, 
    isMobileOrTablet,
    
    // New boolean states
    isXs: isBreakpoint('xs'),
    isSm: isBreakpoint('sm'),
    isMd: isBreakpoint('md'),
    isLg: isBreakpoint('lg'),
    isXl: isBreakpoint('xl'),
    is2Xl: isBreakpoint('2xl'),
    
    // Utility functions
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween,
    
    // Common responsive checks
    isMobileDevice: windowWidth < breakpoints.sm,
    isSmallTablet: isBreakpointBetween('sm', 'md'),
    isLargeTablet: isBreakpointBetween('md', 'lg'),
    isDesktop: windowWidth >= breakpoints.lg,
    isLargeDesktop: windowWidth >= breakpoints.xl,
  };
}

// Hook for detecting touch devices
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouchDevice();
  }, []);
  
  return isTouchDevice;
}

// Hook for safe window access (SSR compatible)
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
}