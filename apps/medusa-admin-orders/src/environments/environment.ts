// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  MEDUSA_ADMIN_KEY: "sk_162a0b83f04d6c5891568151df0e91048c26cbb4fa4a4093794b54911a021ca7",
  MEDUSA_API_BASE_PATH: "http://localhost:9000",
  MEDUSA_BACKEND_URL: "http://localhost:9000",
  MEDUSA_SSE_URL: "http://localhost:9000/events",
  MEDUSA_WS_URL: "http://localhost:9000", // WebSocket URL for Socket.IO (uses HTTP/HTTPS, not ws://)
  MEDUSA_PUBLISHABLE_KEY: "pk_ab8dae5e0d336c81b3e9686f11378adb01e0df114b58564ed979d0702063de54" // Add your publishable key here
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
