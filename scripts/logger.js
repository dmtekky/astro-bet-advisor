/**
 * Simple logger utility
 */

// Get environment variables
const nodeEnv = process.env.NODE_ENV || 'development';

/**
 * Logger with different log levels
 */
const logger = {
  /**
   * Log debug messages (only in development)
   * @param  {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (nodeEnv !== 'production') {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  /**
   * Log info messages
   * @param  {...any} args - Arguments to log
   */
  info: (...args) => {
    console.log('[INFO]', ...args);
  },
  
  /**
   * Log warning messages
   * @param  {...any} args - Arguments to log
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  
  /**
   * Log error messages
   * @param  {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};

export default logger;
