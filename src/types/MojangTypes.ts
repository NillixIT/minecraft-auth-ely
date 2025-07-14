// types/MojangTypes.ts

export interface Agent {
  name: 'Minecraft';
  version: number;
}

export interface AuthPayload {
  agent: Agent;
  username: string;
  password: string;
  clientToken?: string;
  requestUser?: boolean;
}

export interface Session {
  accessToken: string;
  clientToken: string;
  selectedProfile: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    properties: {
      name: string;
      value: string;
    }[];
  };
}

export enum MojangStatusColor {
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
  GREY = 'grey'
}

export interface MojangStatus {
  service: string;
  status: MojangStatusColor;
  name: string;
  essential: boolean;
}

export interface UptimeSummary {
  slug: string;
  status: 'up' | 'down';
}

export interface MojangErrorBody {
  error?: string;
  errorMessage?: string;
  cause?: string;
}

export enum MojangErrorCode {
  ERROR_METHOD_NOT_ALLOWED = 'ERROR_METHOD_NOT_ALLOWED',
  ERROR_NOT_FOUND = 'ERROR_NOT_FOUND',
  ERROR_USER_MIGRATED = 'ERROR_USER_MIGRATED',
  ERROR_INVALID_CREDENTIALS = 'ERROR_INVALID_CREDENTIALS',
  ERROR_RATELIMITED = 'ERROR_RATELIMITED',
  ERROR_INVALID_TOKEN = 'ERROR_INVALID_TOKEN',
  ERROR_ACCESS_TOKEN_HAS_PROFILE = 'ERROR_ACCESS_TOKEN_HAS_PROFILE',
  ERROR_CREDENTIALS_MISSING = 'ERROR_CREDENTIALS_MISSING',
  ERROR_INVALID_SALT_VERSION = 'ERROR_INVALID_SALT_VERSION',
  ERROR_UNSUPPORTED_MEDIA_TYPE = 'ERROR_UNSUPPORTED_MEDIA_TYPE',
  ERROR_GONE = 'ERROR_GONE',
  ERROR_UNREACHABLE = 'ERROR_UNREACHABLE',
  UNKNOWN = 'UNKNOWN'
}

export interface MojangResponse<T> {
  data: T;
  responseStatus: 'SUCCESS' | 'ERROR';
  mojangErrorCode?: MojangErrorCode;
  isInternalError?: boolean;
}
