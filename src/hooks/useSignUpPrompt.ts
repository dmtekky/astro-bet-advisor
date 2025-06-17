import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VISIT_COOKIE = 'astro_visits';
const PROMPT_SHOWN_COOKIE = 'astro_prompt_shown';
const PROMPT_COUNT_COOKIE = 'astro_prompt_count';
const PROMPT_DATE_COOKIE = 'astro_prompt_date';

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
    if (currentUser) {
      console.debug('[useSignUpPrompt] User is authenticated, skipping prompt logic');
      return;
    }
    
    console.debug('[useSignUpPrompt] Initializing prompt logic');
    
    // Set first visit time if not set
    const firstVisit = getCookie('astro_first_visit');
    if (!firstVisit) {
      console.debug('[useSignUpPrompt] Setting first visit timestamp');
      setCookie('astro_first_visit', Date.now().toString(), 1);
    } else {
      console.debug(`[useSignUpPrompt] First visit timestamp: ${new Date(parseInt(firstVisit)).toLocaleString()}`);
    }
    
    // Increment visit count only when pathname changes
    const visitCount = parseInt(getCookie(VISIT_COOKIE) || '0', 10) + 1;
    console.debug(`[useSignUpPrompt] Incrementing visit count to ${visitCount}`);
    setCookie(VISIT_COOKIE, visitCount.toString(), 1);
    
    setIsInitialized(true);
  }, [location.pathname]); // Only run on pathname change

  // Check if we should show the prompt
  useEffect(() => {
    if (currentUser || !isInitialized) return;
    
    const now = Date.now();
    const firstVisit = parseInt(getCookie('astro_first_visit') || '0', 10);
    const visitCount = parseInt(getCookie(VISIT_COOKIE) || '0', 10);
    const lastPromptDate = getCookie(PROMPT_DATE_COOKIE);
    let promptCount = parseInt(getCookie(PROMPT_COUNT_COOKIE) || '0', 10);
    
    // Reset prompt count if it's a new day
    if (lastPromptDate) {
      const lastDate = new Date(parseInt(lastPromptDate));
      const today = new Date();
      if (lastDate.getDate() !== today.getDate() || 
          lastDate.getMonth() !== today.getMonth() || 
          lastDate.getFullYear() !== today.getFullYear()) {
        console.debug('[useSignUpPrompt] New day - resetting prompt count');
        promptCount = 0;
        setCookie(PROMPT_COUNT_COOKIE, '0', 1);
        setCookie(PROMPT_DATE_COOKIE, Date.now().toString(), 1);
      }
    }
    
    console.debug(`[useSignUpPrompt] Current visit count: ${visitCount}, Prompt count: ${promptCount}`);
    
    // Check if we should show the prompt
    const timeElapsed = (now - firstVisit) / 60000; // minutes
    const shouldShowByTime = timeElapsed >= 3; // 3 minutes
    const shouldShowByVisits = visitCount >= 5; // 5 page views
    const underDailyLimit = promptCount < 4; // max 4 per day
    
    console.debug(`[useSignUpPrompt] Conditions - Time: ${timeElapsed.toFixed(1)}min (>=3min? ${shouldShowByTime}), Visits: ${visitCount} (>=5? ${shouldShowByVisits}), Daily limit: ${promptCount}/4`);
    
    // Prevent showing on first page load
    const isFirstPage = visitCount === 1;
    
    if ((shouldShowByTime || shouldShowByVisits) && underDailyLimit && !isFirstPage) {
      console.debug('[useSignUpPrompt] Conditions met - showing prompt');
      setShowPrompt(true);
      
      // Update prompt count
      const newCount = promptCount + 1;
      console.debug(`[useSignUpPrompt] Incrementing prompt count to ${newCount}`);
      setCookie(PROMPT_COUNT_COOKIE, newCount.toString(), 1);
      setCookie(PROMPT_DATE_COOKIE, Date.now().toString(), 1);
    } else {
      console.debug('[useSignUpPrompt] Conditions not met - not showing prompt');
    }
  }, [currentUser, isInitialized, getCookie, setCookie]);

  // Reset prompt when navigating to new pages
  useEffect(() => {
    if (showPrompt) {
      console.debug('[useSignUpPrompt] Resetting prompt for new page');
      setShowPrompt(false);
      const timer = setTimeout(() => {
        if (!currentUser) setShowPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleClose = useCallback(() => {
    console.debug('[useSignUpPrompt] Closing prompt');
    setShowPrompt(false);
    setCookie(PROMPT_SHOWN_COOKIE, 'true', 1); // Don't show again today
  }, [setCookie]);

  return { showPrompt, handleClose };
};

export default useSignUpPrompt;
