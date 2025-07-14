// tests/refactored-integration.test.ts

import {
  MojangAuthProvider,
  MojangRestAPI,
  ClientTokenGenerator,
  StatusManager,
  MojangStatus,
  MojangErrorCode,
  MojangStatusColor,
} from "../src/index";
import { AuthContext } from "@nillixit/minecraft-auth-types";
import nock from "nock";

describe("Refactored Minecraft Auth MS Integration Tests", () => {
  let mockAuthContext: AuthContext;

  beforeEach(() => {
    mockAuthContext = {
      showModal: jest.fn(),
      closeModal: jest.fn(),
      saveSession: jest.fn(),
    };

    // Clear all nock interceptors
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("Modular Architecture Tests", () => {
    it("should export all expected modules", () => {
      // Test that all modules are properly exported
      expect(MojangAuthProvider).toBeDefined();
      expect(MojangRestAPI).toBeDefined();
      expect(ClientTokenGenerator).toBeDefined();
      expect(StatusManager).toBeDefined();
      expect(MojangErrorCode).toBeDefined();
      expect(MojangStatusColor).toBeDefined();
    });

    it("should have correct MojangAuthProvider structure", () => {
      expect(MojangAuthProvider.id).toBe("mojang");
      expect(MojangAuthProvider.name).toBe("Mojang Login");
      expect(MojangAuthProvider.description).toBe(
        "Login with Mojang account using email and password"
      );
      expect(typeof MojangAuthProvider.authenticate).toBe("function");
    });
  });

  describe("ClientTokenGenerator", () => {
    it("should generate unique UUID v4 tokens", () => {
      const token1 = ClientTokenGenerator.generate();
      const token2 = ClientTokenGenerator.generate();

      // Should be different tokens
      expect(token1).not.toBe(token2);

      // Should match UUID v4 format
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(token1).toMatch(uuidV4Regex);
      expect(token2).toMatch(uuidV4Regex);
    });

    it("should generate tokens with version 4 indicator", () => {
      for (let i = 0; i < 10; i++) {
        const token = ClientTokenGenerator.generate();
        // Check that the version field (13th character) is '4'
        expect(token.charAt(14)).toBe("4");
      }
    });
  });

  describe("StatusManager", () => {
    it("should provide default statuses", () => {
      const statuses = StatusManager.getDefaultStatuses();

      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);

      // Check essential services are included
      const essentialServices = statuses.filter((s) => s.essential);
      expect(essentialServices.length).toBeGreaterThan(0);

      // Check structure of status objects
      statuses.forEach((status) => {
        expect(status).toHaveProperty("service");
        expect(status).toHaveProperty("status");
        expect(status).toHaveProperty("name");
        expect(status).toHaveProperty("essential");
        expect(typeof status.essential).toBe("boolean");
      });
    });

    it("should convert status colors to hex values", () => {
      expect(StatusManager.statusToHex("green")).toBe("#a5c325");
      expect(StatusManager.statusToHex("yellow")).toBe("#eac918");
      expect(StatusManager.statusToHex("red")).toBe("#c32625");
      expect(StatusManager.statusToHex("grey")).toBe("#848484");
      expect(StatusManager.statusToHex("unknown")).toBe("#848484");
    });
  });

  describe("MojangRestAPI", () => {
    it("should have correct endpoints configured", () => {
      expect(MojangRestAPI.AUTH_ENDPOINT).toBe("https://authserver.ely.by");
    });

    it("should have correct Minecraft agent", () => {
      expect(MojangRestAPI.MINECRAFT_AGENT).toEqual({
        name: "Minecraft",
        version: 1,
      });
    });

    describe("Authentication", () => {
      it("should successfully authenticate with valid credentials", async () => {
        const mockResponse = {
          selectedProfile: {
            id: "test-uuid-1234",
            name: "TestUser",
          },
          accessToken: "mock-access-token-123",
          clientToken: "mock-client-token",
        };

        nock("https://authserver.ely.by")
          .post("/auth/authenticate")
          .reply(200, mockResponse);

        const response = await MojangRestAPI.authenticate(
          "test@example.com",
          "password123",
          "client-token-123"
        );

        expect(response.responseStatus).toBe("SUCCESS");
        expect(response.data).toEqual(mockResponse);
      });

      it("should handle authentication failures", async () => {
        nock("https://authserver.ely.by")
          .post("/auth/authenticate")
          .reply(403, { error: "Invalid credentials" });

        const response = await MojangRestAPI.authenticate(
          "invalid@example.com",
          "wrongpassword",
          "client-token-123"
        );

        expect(response.responseStatus).toBe("ERROR");
        expect(response.data).toBeNull();
        expect(response.mojangErrorCode).toBeDefined();
      });
    });

    describe("Token Validation", () => {
      it("should validate valid tokens", async () => {
        nock("https://authserver.ely.by").post("/auth/validate").reply(204);

        const response = await MojangRestAPI.validate(
          "valid-access-token",
          "valid-client-token"
        );

        expect(response.responseStatus).toBe("SUCCESS");
        expect(response.data).toBe(true);
      });

      it("should reject invalid tokens", async () => {
        nock("https://authserver.ely.by").post("/auth/validate").reply(403);

        const response = await MojangRestAPI.validate(
          "invalid-access-token",
          "invalid-client-token"
        );

        expect(response.responseStatus).toBe("SUCCESS");
        expect(response.data).toBe(false);
      });
    });
  });

  describe("End-to-End Authentication Flow", () => {
    it("should complete full authentication workflow", async () => {
      const mockCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockApiResponse = {
        selectedProfile: {
          id: "user-uuid-5678",
          name: "TestPlayer",
        },
        accessToken: "session-token-xyz",
        clientToken: "client-token-abc",
      };

      // Mock the credential prompt
      const mockShowModal = mockAuthContext.showModal as jest.Mock;
      mockShowModal.mockImplementation(({ onSubmit }) => {
        setTimeout(() => onSubmit(mockCredentials), 0);
      });

      // Mock the API response
      nock("https://authserver.ely.by")
        .post("/auth/authenticate")
        .reply(200, mockApiResponse);

      // Execute authentication
      const session = await MojangAuthProvider.authenticate(mockAuthContext);

      // Verify results
      expect(session).toEqual({
        uuid: "user-uuid-5678",
        username: "TestPlayer",
        accessToken: "session-token-xyz",
        expiresAt: expect.any(Number),
      });

      // Verify expiration time is reasonable (should be ~2 hours from now)
      const expectedExpiry = Date.now() + 2 * 60 * 60 * 1000;
      const tolerance = 5000; // 5 second tolerance
      expect(session.expiresAt).toBeGreaterThan(expectedExpiry - tolerance);
      expect(session.expiresAt).toBeLessThan(expectedExpiry + tolerance);
    });

    it("should handle network errors gracefully", async () => {
      const mockCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockShowModal = mockAuthContext.showModal as jest.Mock;
      mockShowModal.mockImplementation(({ onSubmit }) => {
        setTimeout(() => onSubmit(mockCredentials), 0);
      });

      // Mock network error
      nock("https://authserver.ely.by")
        .post("/auth/authenticate")
        .replyWithError("Network error");

      // Should throw appropriate error
      await expect(
        MojangAuthProvider.authenticate(mockAuthContext)
      ).rejects.toThrow("Network error");
    });

    it("should handle authentication failures with proper error messages", async () => {
      const mockCredentials = {
        email: "banned@example.com",
        password: "password123",
      };

      const mockShowModal = mockAuthContext.showModal as jest.Mock;
      mockShowModal.mockImplementation(({ onSubmit }) => {
        setTimeout(() => onSubmit(mockCredentials), 0);
      });

      // Mock authentication failure
      nock("https://authserver.ely.by")
        .post("/auth/authenticate")
        .reply(403, { error: "Account suspended" });

      // Should throw appropriate error
      await expect(
        MojangAuthProvider.authenticate(mockAuthContext)
      ).rejects.toThrow("Failed to authenticate with Mojang");
    });
  });

  describe("Error Handling System", () => {
    it("should properly classify error codes", () => {
      // Test that error codes are properly defined
      expect(MojangErrorCode.ERROR_INVALID_CREDENTIALS).toBeDefined();
      expect(MojangErrorCode.ERROR_UNREACHABLE).toBeDefined();
      expect(MojangErrorCode.ERROR_RATELIMITED).toBeDefined();
      expect(MojangErrorCode.UNKNOWN).toBeDefined();
    });

    it("should handle various HTTP error codes", async () => {
      const testCases = [
        { status: 401, expectedError: "Failed to authenticate with Mojang" },
        { status: 403, expectedError: "Failed to authenticate with Mojang" },
        { status: 500, expectedError: "Failed to authenticate with Mojang" },
      ];

      for (const testCase of testCases) {
        const mockCredentials = {
          email: "test@example.com",
          password: "password",
        };
        const mockShowModal = mockAuthContext.showModal as jest.Mock;
        mockShowModal.mockImplementation(({ onSubmit }) => {
          setTimeout(() => onSubmit(mockCredentials), 0);
        });

        nock("https://authserver.ely.by")
          .post("/auth/authenticate")
          .reply(testCase.status, { error: "Test error" });

        await expect(
          MojangAuthProvider.authenticate(mockAuthContext)
        ).rejects.toThrow(testCase.expectedError);

        nock.cleanAll();
      }
    });
  });

  describe("Configuration and Constants", () => {
    it("should use proper session expiry configuration", async () => {
      const mockCredentials = {
        email: "test@example.com",
        password: "password",
      };
      const mockApiResponse = {
        selectedProfile: { id: "test-id", name: "TestUser" },
        accessToken: "test-token",
      };

      const mockShowModal = mockAuthContext.showModal as jest.Mock;
      mockShowModal.mockImplementation(({ onSubmit }) => {
        setTimeout(() => onSubmit(mockCredentials), 0);
      });

      nock("https://authserver.ely.by")
        .post("/auth/authenticate")
        .reply(200, mockApiResponse);

      const beforeAuth = Date.now();
      const session = await MojangAuthProvider.authenticate(mockAuthContext);
      const afterAuth = Date.now();

      // Session should expire 2 hours from authentication time
      const expectedMinExpiry = beforeAuth + 2 * 60 * 60 * 1000;
      const expectedMaxExpiry = afterAuth + 2 * 60 * 60 * 1000;

      expect(session.expiresAt).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(session.expiresAt).toBeLessThanOrEqual(expectedMaxExpiry);
    });
  });
});
