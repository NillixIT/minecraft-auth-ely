// minecraft-auth-mojang/src/index.ts

import { AuthContext, AuthSession, AuthenticationProvider } from '@nillixit/minecraft-auth-types';
import { MojangRestAPI } from './services/MojangRestAPI';
import { ClientTokenGenerator } from './utils/ClientTokenGenerator';
import { CredentialsPrompt } from './ui/CredentialsPrompt';
import { CONFIG } from './config/constants';
import { MojangErrorCode } from './types/MojangTypes';

function getErrorMessage(errorCode?: MojangErrorCode, originalError?: any): string {
  // Handle network errors first
  if (originalError?.message?.includes('Network error')) {
    return 'Network error';
  }
  
  switch (errorCode) {
    case MojangErrorCode.ERROR_UNREACHABLE:
      return 'Failed to authenticate with Mojang';
    case MojangErrorCode.ERROR_INVALID_CREDENTIALS:
      return 'Invalid credentials';
    case MojangErrorCode.ERROR_RATELIMITED:
      return 'Too many requests, please try again later';
    case MojangErrorCode.ERROR_INVALID_TOKEN:
      return 'Invalid token';
    default:
      return 'Failed to authenticate with Mojang';
  }
}

export const MojangAuthProvider: AuthenticationProvider = {
  id: 'mojang',
  name: 'Mojang Login',
  logo: 'https://launchercontent.mojang.com/img/mojang-logo.png',
  description: 'Login with Mojang account using email and password',

  async authenticate(ctx: AuthContext): Promise<AuthSession> {
    try {
      const credentials = await CredentialsPrompt.prompt(ctx);
      const clientToken = ClientTokenGenerator.generate();

      const response = await MojangRestAPI.authenticate(
        credentials.email,
        credentials.password,
        clientToken,
        true
      );

      if (response.responseStatus !== 'SUCCESS' || !response.data) {
        // Check for network error first - look at original error
        const originalError = (response as any).originalError;
        if (originalError?.message?.includes('Network error')) {
          throw new Error('Network error');
        }
        
        // Map specific error codes to user-friendly messages
        const errorMessage = getErrorMessage(response.mojangErrorCode);
        throw new Error(errorMessage);
      }

      const session = response.data;

      if (!session.selectedProfile || !session.accessToken) {
        throw new Error('Invalid response from authentication server');
      }

      return {
        uuid: session.selectedProfile.id,
        username: session.selectedProfile.name,
        accessToken: session.accessToken,
        expiresAt: Date.now() + 1000 * 60 * 60 * CONFIG.SESSION.EXPIRY_HOURS
      };
    } catch (error: any) {
      // Check if this is already a handled error
      if (error.message.includes('Network error') || 
          error.message.includes('Failed to authenticate') ||
          error.message.includes('Invalid')) {
        throw error;
      }
      
      // Handle other errors
      throw new Error('Failed to authenticate with Mojang');
    }
  }
};

// Export additional utilities and services for advanced usage
export { MojangRestAPI } from './services/MojangRestAPI';
export { ClientTokenGenerator } from './utils/ClientTokenGenerator';
export { StatusManager } from './utils/StatusManager';
export * from './types/MojangTypes';
export * from './utils/ErrorHandler';
