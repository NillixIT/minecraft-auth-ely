// utils/ErrorHandler.ts

import { MojangErrorCode, MojangErrorBody, MojangResponse } from '../types/MojangTypes';

export function decipherErrorCode(body: MojangErrorBody): MojangErrorCode {
  if (!body || !body.error) {
    return MojangErrorCode.UNKNOWN;
  }

  const error = body.error.toLowerCase();
  
  switch (error) {
    case 'method not allowed':
      return MojangErrorCode.ERROR_METHOD_NOT_ALLOWED;
    case 'not found':
      return MojangErrorCode.ERROR_NOT_FOUND;
    case 'forbiddenoperationexception':
      if (body.errorMessage?.includes('Invalid credentials')) {
        return MojangErrorCode.ERROR_INVALID_CREDENTIALS;
      }
      if (body.errorMessage?.includes('Invalid token')) {
        return MojangErrorCode.ERROR_INVALID_TOKEN;
      }
      return MojangErrorCode.ERROR_INVALID_CREDENTIALS;
    case 'unsupported media type':
      return MojangErrorCode.ERROR_UNSUPPORTED_MEDIA_TYPE;
    case 'gone':
      return MojangErrorCode.ERROR_GONE;
    default:
      return MojangErrorCode.UNKNOWN;
  }
}

export function isInternalError(errorCode: MojangErrorCode): boolean {
  const internalErrors = [
    MojangErrorCode.ERROR_METHOD_NOT_ALLOWED,
    MojangErrorCode.ERROR_NOT_FOUND,
    MojangErrorCode.ERROR_UNSUPPORTED_MEDIA_TYPE,
    MojangErrorCode.ERROR_UNREACHABLE,
    MojangErrorCode.UNKNOWN
  ];
  
  return internalErrors.includes(errorCode);
}

export function handleRequestError<T>(
  operation: string,
  error: any,
  dataProvider: () => T
): MojangResponse<T> {
  const response: MojangResponse<T> = {
    data: dataProvider(),
    responseStatus: 'ERROR'
  };

  // Handle network errors - check multiple ways an error can be a network error
  if (error.message?.includes('Network error') || 
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.name === 'FetchError' ||
      (error.type === 'system' && error.code === 'ENOTFOUND')) {
    response.mojangErrorCode = MojangErrorCode.ERROR_UNREACHABLE;
    // Store the original error for later use
    (response as any).originalError = error;
  } else if (error.response) {
    // HTTP Error
    response.mojangErrorCode = decipherErrorCode(error.response.body);
  } else {
    response.mojangErrorCode = MojangErrorCode.UNKNOWN;
    // Store the original error in case it's a network error we didn't catch
    (response as any).originalError = error;
  }

  response.isInternalError = isInternalError(response.mojangErrorCode!);
  
  return response;
}
