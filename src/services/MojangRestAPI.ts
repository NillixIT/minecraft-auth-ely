// services/MojangRestAPI.ts

import fetch, { RequestInit } from 'node-fetch';
import { 
  Agent, 
  AuthPayload, 
  Session, 
  MojangResponse, 
  MojangStatus, 
  MojangStatusColor,
  UptimeSummary 
} from '../types/MojangTypes';
import { handleRequestError } from '../utils/ErrorHandler';
import { StatusManager } from '../utils/StatusManager';
import { CONFIG } from '../config/constants';

export class MojangRestAPI {
  private static readonly TIMEOUT = CONFIG.TIMEOUTS.REQUEST;
  public static readonly AUTH_ENDPOINT = CONFIG.ENDPOINTS.AUTH;

  public static readonly MINECRAFT_AGENT: Agent = {
    name: 'Minecraft',
    version: 1
  };

  protected static statuses: MojangStatus[] = StatusManager.getDefaultStatuses();

  private static async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number }> {
    const response = await fetch(url, {
      timeout: this.TIMEOUT,
      ...options
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).response = {
        status: response.status,
        body: await response.json().catch(() => ({}))
      };
      throw error;
    }

    return {
      data: await response.json() as T,
      status: response.status
    };
  }

  /**
   * Utility function to report an unexpected success code.
   */
  private static expectSpecificSuccess(operation: string, expected: number, actual: number): void {
    if (actual !== expected) {
      console.warn(`${operation} expected ${expected} response, received ${actual}.`);
    }
  }

  /**
   * Authenticate a user with their Mojang credentials.
   */
  public static async authenticate(
    username: string,
    password: string,
    clientToken: string | null,
    requestUser = true,
    agent: Agent = this.MINECRAFT_AGENT
  ): Promise<MojangResponse<Session | null>> {
    try {
      const payload: AuthPayload = {
        agent,
        username,
        password,
        requestUser
      };

      if (clientToken != null) {
        payload.clientToken = clientToken;
      }

      const { data, status } = await this.makeRequest<Session>(`${this.AUTH_ENDPOINT}/auth/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      this.expectSpecificSuccess('Mojang Authenticate', 200, status);

      return {
        data,
        responseStatus: 'SUCCESS'
      };
    } catch (error) {
      return handleRequestError('Mojang Authenticate', error, () => null);
    }
  }

  /**
   * Validate an access token.
   */
  public static async validate(accessToken: string, clientToken: string): Promise<MojangResponse<boolean>> {
    try {
      const payload = {
        accessToken,
        clientToken
      };

      const response = await fetch(`${this.AUTH_ENDPOINT}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: this.TIMEOUT
      });

      this.expectSpecificSuccess('Mojang Validate', 204, response.status);

      // For Ely.by compatibility, also accept 200 status
      const isValid = response.status === 204 || response.status === 200;

      return {
        data: isValid,
        responseStatus: 'SUCCESS'
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        return {
          data: false,
          responseStatus: 'SUCCESS'
        };
      }
      return handleRequestError('Mojang Validate', error, () => false);
    }
  }

  /**
   * Invalidates an access token.
   */
  public static async invalidate(accessToken: string, clientToken: string): Promise<MojangResponse<undefined>> {
    try {
      const payload = {
        accessToken,
        clientToken
      };

      const response = await fetch(`${this.AUTH_ENDPOINT}/auth/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: this.TIMEOUT
      });

      this.expectSpecificSuccess('Mojang Invalidate', 204, response.status);

      return {
        data: undefined,
        responseStatus: 'SUCCESS'
      };
    } catch (error) {
      return handleRequestError('Mojang Invalidate', error, () => undefined);
    }
  }

  /**
   * Refresh a user's authentication.
   */
  public static async refresh(
    accessToken: string, 
    clientToken: string, 
    requestUser = true
  ): Promise<MojangResponse<Session | null>> {
    try {
      const payload = {
        accessToken,
        clientToken,
        requestUser
      };

      const { data, status } = await this.makeRequest<Session>(`${this.AUTH_ENDPOINT}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      this.expectSpecificSuccess('Mojang Refresh', 200, status);

      return {
        data,
        responseStatus: 'SUCCESS'
      };
    } catch (error) {
      return handleRequestError('Mojang Refresh', error, () => null);
    }
  }
}
