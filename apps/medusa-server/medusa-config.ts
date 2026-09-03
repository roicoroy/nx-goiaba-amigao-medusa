import { loadEnv, defineConfig, Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  plugins: [
    {
      resolve: "wishlist-plugin",
      options: {
        jwtSecret: process.env.JWT_SECRET || "supersecret"
      }
    },
    {
      resolve: "@lambdacurry/medusa-webhooks",
      options: {
        // Add here the subcribers you will define
        subscriptions: ["product.created", "product.updated", "order.created", "order.placed", "order.completed"],
      },
    },
    {
      resolve: "@rsc-labs/medusa-products-bought-together-v2",
      options: {}
    },
    {
      resolve: "@blegaut/medusa-product-reviews-enhanced",
      options: {
        defaultReviewStatus: process.env.REVIEW_DEFAULT_STATUS || "pending",
      },
    },
    {
      resolve: "medusa-documents",
      options: {
        document_language: process.env.DOCUMENT_LANGUAGE || "en"
      }
    },
    // {
    //   resolve: "@devx-commerce/strapi",
    //   options: {
    //     base_url: process.env.STRAPI_URL,
    //     api_key: process.env.STRAPI_API_KEY,
    //   },
    // },
  ],
  modules: {
    auth: {
      resolve: "@medusajs/medusa/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          // other providers...
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          {
            resolve: "@medusajs/medusa/auth-google",
            id: "google",
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl: process.env.GOOGLE_CALLBACK_URL,
            },
          },
        ],
      },
    },
    file: {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "./src/modules/file",
            id: "cloudinary",
            options: {
              cloud_name: process.env.CLOUDINARY_NAME,
              api_key: process.env.CLOUDINARY_KEY,
              api_secret: process.env.CLOUDINARY_SECRET,
              root_folder: process.env.CLOUDINARY_ROOT_FOLDER || "medusa-store",
              use_file_name_as_path: process.env.CLOUDINARY_USE_FILE_NAME_AS_PATH === "true" || false,
            }
          }
        ]
      }
    },

    notification: {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              name: "Local Notification Provider",
              channels: ["feed"],
            },
          },
          {
            resolve: "@perseidesjs/notification-nodemailer/providers/nodemailer",
            id: "nodemailer",
            options: {
              from: process.env.NOTIFICATION_PROVIDER_FROM || "tickets@yourdomain.com",
              channels: ["email"],
              host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
              port: process.env.SMTP_PORT || 2525,
              secure: false,
              auth: {
                user: process.env.SMTP_USER || "2beae0b704cd72",
                pass: process.env.SMTP_PASS || "12947fff4de11b"
              }
            },
          },
        ],
      },
    },

    payment: {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },

    fulfillment: {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
            options: {},
          },
          {
            resolve: "./src/modules/shipstation",
            id: "shipstation",
            options: {
              api_key: process.env.SHIPSTATION_API_KEY,
            },
          },
        ],
      },
    },
    storeAnalytics: {
      resolve: "./src/modules/store-analytics",
      options: {}
    },
    fcm: {
      resolve: "./src/modules/fcm",
      options: {
        firebaseServiceAccount: process.env.FCM_SERVICE_ACCOUNT
          ? (typeof process.env.FCM_SERVICE_ACCOUNT === 'string'
            ? JSON.parse(process.env.FCM_SERVICE_ACCOUNT)
            : process.env.FCM_SERVICE_ACCOUNT)
          : undefined,
        firebaseProjectId: process.env.FCM_PROJECT_ID,
      },
    },
    translation: {
      resolve: "@medusajs/medusa/translation",
    },
  },
  featureFlags: {
    translation: true,
  },

})
