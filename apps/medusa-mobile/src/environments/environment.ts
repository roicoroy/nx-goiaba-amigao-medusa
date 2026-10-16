// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.


export const environment = {
  production: false,
  // SECURITY: These values are replaced at build time by scripts/set-env.js
  // For local development, fallback values are used below
  MEDUSA_PUBLISHABLE_KEY: "pk_638b7ed0834ed541daf24ca5d859c8336e0f430766f1ecfb221c422f9d0f0d19",
  MEDUSA_API_BASE_PATH: "http://localhost:9000",
  MEDUSA_BACKEND_URL: "http://localhost:9000",
  // MEDUSA_API_BASE_PATH: "https://fine-currently-gazelle.ngrok-free.app",
  // MEDUSA_BACKEND_URL: "https://fine-currently-gazelle.ngrok-free.app",
  STRIPE_PUBLISHABLE_KEY: "pk_test_2qqvb6DTqKondL46mnEjZ68e",
  // Error logging configuration
  errorLogging: {
    enabled: true, // Enable in development
    maxSize: 50, // Store up to 50 errors in development
    logStackTraces: true, // Include stack traces in development
    minSeverity: 'low' // Log all severities in development
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
