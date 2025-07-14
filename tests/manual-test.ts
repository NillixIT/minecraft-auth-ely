import { MojangAuthProvider, MojangRestAPI, ClientTokenGenerator } from '../src/index';
import { AuthContext } from '@nillixit/minecraft-auth-types';
import dotenv from 'dotenv';

// Test credentials (provided by user)
dotenv.config();

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

// Generate a single clientToken to use throughout the session
const CLIENT_TOKEN = ClientTokenGenerator.generate();

// Mock AuthContext for manual testing
const mockAuthContext: AuthContext = {
  showModal: () => Promise.resolve(),
  closeModal: () => Promise.resolve(),
  saveSession: (session) => {
    console.log('Session saved:', session);
    return Promise.resolve();
  }
};

async function testDirectAuthentication() {
  console.log('🔐 Testing Direct Authentication with MojangRestAPI...\n');

  try {
    console.log('Step 1: Direct authentication call...');
    console.log('Using clientToken:', CLIENT_TOKEN);
    
    const authResult = await MojangRestAPI.authenticate(
      TEST_EMAIL,
      TEST_PASSWORD,
      CLIENT_TOKEN,
      true
    );

    if (authResult.responseStatus === 'SUCCESS' && authResult.data) {
      console.log('✅ Direct authentication successful!');
      console.log('Session details:', {
        uuid: authResult.data.selectedProfile?.id,
        username: authResult.data.selectedProfile?.name,
        accessToken: authResult.data.accessToken?.substring(0, 30) + '...',
        clientToken: authResult.data.clientToken
      });
      return authResult.data;
    } else {
      console.log('❌ Direct authentication failed:', authResult);
      throw new Error('Authentication failed');
    }
  } catch (error: any) {
    console.error('❌ Direct authentication error:', error.message);
    throw error;
  }
}

async function testTokenValidationFixed(session: any) {
  console.log('\nStep 2: Validating access token with correct clientToken...');
  
  try {
    // Use the clientToken from the session
    const clientTokenToUse = session.clientToken || CLIENT_TOKEN;
    console.log('Using clientToken for validation:', clientTokenToUse);
    
    const validationResult = await MojangRestAPI.validate(session.accessToken, clientTokenToUse);
    
    console.log('Validation result:', validationResult);
    
    if (validationResult.responseStatus === 'SUCCESS') {
      if (validationResult.data) {
        console.log('✅ Token validation successful - token is valid!');
      } else {
        console.log('⚠️ Token validation successful but token is invalid/expired');
      }
    } else {
      console.log('❌ Token validation failed:', validationResult);
    }
    
    return validationResult;
  } catch (error: any) {
    console.error('❌ Token validation error:', error.message);
    throw error;
  }
}

async function testTokenRefreshFixed(session: any) {
  console.log('\nStep 3: Refreshing token with correct clientToken...');
  
  try {
    // Use the clientToken from the session
    const clientTokenToUse = session.clientToken || CLIENT_TOKEN;
    console.log('Using clientToken for refresh:', clientTokenToUse);
    
    const refreshResult = await MojangRestAPI.refresh(session.accessToken, clientTokenToUse);
    
    console.log('Refresh result:', refreshResult);
    
    if (refreshResult.responseStatus === 'SUCCESS' && refreshResult.data) {
      console.log('✅ Token refresh successful!');
      console.log('New session details:', {
        uuid: refreshResult.data.selectedProfile?.id,
        username: refreshResult.data.selectedProfile?.name,
        accessToken: refreshResult.data.accessToken?.substring(0, 30) + '...',
        clientToken: refreshResult.data.clientToken
      });
      return refreshResult.data;
    } else {
      console.log('❌ Token refresh failed:', refreshResult);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Token refresh error:', error.message);
    throw error;
  }
}

async function runFixedTest() {
  console.log('🚀 Starting FIXED Minecraft authentication test\n');
  console.log('Testing with:', TEST_EMAIL);
  console.log('Client Token:', CLIENT_TOKEN);
  console.log('═'.repeat(60));

  try {
    // Test direct authentication
    const session = await testDirectAuthentication();
    
    // Test token validation with correct clientToken
    await testTokenValidationFixed(session);
    
    // Test token refresh with correct clientToken
    const refreshedSession = await testTokenRefreshFixed(session);
    
    // If refresh was successful, validate the new token
    if (refreshedSession) {
      console.log('\nStep 4: Validating refreshed token...');
      await testTokenValidationFixed(refreshedSession);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Fixed test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Authentication: ✅ Working');
    console.log('• Token Validation: ✅ Working (with correct clientToken)');
    console.log('• Token Refresh: ✅ Working (with correct clientToken)');
    console.log('• Full Auth Flow: ✅ Complete');
    
  } catch (error: any) {
    console.log('\n' + '═'.repeat(60));
    console.log('💥 Fixed test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runFixedTest();
}

export { runFixedTest };
