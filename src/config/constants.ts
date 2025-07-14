// config/constants.ts

export const CONFIG = {
  ENDPOINTS: {
    AUTH: 'https://authserver.ely.by',
  },
  TIMEOUTS: {
    REQUEST: 2500
  },
  SESSION: {
    EXPIRY_HOURS: 2
  }
} as const;
