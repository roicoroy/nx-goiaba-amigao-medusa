import { Environment } from '../app/shared/interfaces/environment.interface';

export const environment: Environment = {
  production: true,
  MEDUSA_PUBLISHABLE_KEY: "pk_13a55fc2e9bf8a99ee5266b05855c46761e41ad0c62996175014628c1ee3fb51",
  MEDUSA_API_BASE_PATH: "https://fine-currently-gazelle.ngrok-free.app",
  MEDUSA_BACKEND_URL: "https://fine-currently-gazelle.ngrok-free.app",
  STRIPE_PUBLISHABLE_KEY: "pk_test_2qqvb6DTqKondL46mnEjZ68e",
  // Error logging configuration
  errorLogging: {
    enabled: false, // Disable in production (or enable for critical errors only)
    maxSize: 20, // Store fewer errors in production
    logStackTraces: false, // Don't include stack traces in production
    minSeverity: 'high' // Only log high/critical severity errors in production
  }
};
