import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VISIT_COOKIE = 'astro_visits';
const PROMPT_SHOWN_COOKIE = 'astro_prompt_shown';

const useSignUpPrompt = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get cookie value by name
  const getCookie = useCallback((name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }, []);

  // Set cookie with expiry
  const setCookie = useCallback((name: string, value: string, days: number) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;samesite=lax`;
  }, []);

  // Track page visits
  useEffect(() => {
    if (currentUser || isInitialized) return;
    
    const visitCount = parseInt(getCookie(VISIT_COOKIE) || '0', 10) + 1;
    setCookie(VISIT_COOKIE, visitCount.toString(), 1); // 1 day expiry
    
    const hasSeenPrompt = getCookie(PROMPT_SHOWN_COOKIE) === 'true';
    
    // Show prompt after 5 page views or 5 minutes on site
    if (visitCount >= 5 || (Date.now() - parseInt(getCookie('astro_first_visit') || '0', 10) > 5 * 60 * 1000)) {
      if (!hasSeenPrompt) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
          setCookie(PROMPT_SHOWN_COOKIE, 'true', 1); // Show once per day
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    
    // Set first visit time if not set
    if (!getCookie('astro_first_visit')) {
      setCookie('astro_first_visit', Date.now().toString(), 1);
    }
    
    setIsInitialized(true);
  }, [currentUser, getCookie, setCookie, isInitialized]);

  // Reset prompt when navigating to new pages
  useEffect(() => {
    if (showPrompt) {
      setShowPrompt(false);
      const timer = setTimeout(() => setShowPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleClose = useCallback(() => {
    setShowPrompt(false);
    setCookie(PROMPT_SHOWN_COOKIE, 'true', 1); // Don't show again today
  }, [setCookie]);

  return { showPrompt, handleClose };
};

export default useSignUpPrompt;
