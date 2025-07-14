# Project Structure

## Directory Structure

```
src/
├── config/
│   └── constants.ts          # Configuration constants and endpoints
├── services/
│   └── MojangRestAPI.ts      # Core API service for Mojang authentication
├── types/
│   └── MojangTypes.ts        # TypeScript interfaces and enums
├── ui/
│   └── CredentialsPrompt.ts  # User interface for credential input
├── utils/
│   ├── ClientTokenGenerator.ts  # UUID generation utility
│   ├── ErrorHandler.ts          # Error handling and response utilities
│   └── StatusManager.ts         # Service status management
└── index.ts                  # Main entry point and provider export
```

## Module Responsibilities

### Core Services
- **MojangRestAPI**: Main service class handling all Mojang API interactions
  - Authentication, validation, token refresh
  - Service status checking
  - Proper error handling and logging

### Types & Interfaces
- **MojangTypes**: Complete type definitions for all API interactions
  - Session, Agent, AuthPayload interfaces
  - Error codes and status enums
  - Response type definitions

### Utilities
- **ErrorHandler**: Centralized error handling logic
  - Error code deciphering
  - Internal error classification
  - Request error handling

- **ClientTokenGenerator**: UUID v4 generation for client tokens
- **StatusManager**: Service status management and color coding

### Configuration
- **constants**: Centralized configuration for endpoints, timeouts, and settings

### User Interface
- **CredentialsPrompt**: Modal-based credential collection interface

## Key Improvements

1. **Separation of Concerns**: Each module has a single responsibility
2. **Type Safety**: Comprehensive TypeScript interfaces
3. **Error Handling**: Centralized and consistent error management
4. **Configuration**: Externalized constants for easy maintenance
5. **Reusability**: Modular components can be easily tested and reused
6. **Maintainability**: Clear structure makes the codebase easier to navigate and modify

## Usage

The main export remains the same (`MojangAuthProvider`), but now additional utilities are available for advanced usage:

```typescript
import { 
  MojangAuthProvider,
  MojangRestAPI,
  ClientTokenGenerator,
  StatusManager,
  MojangStatus,
  MojangErrorCode 
} from '@nillixit/minecraft-auth-ely';
```
