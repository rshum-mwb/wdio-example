import admin from 'firebase-admin';
import { getConfig } from '../../env.config.js';

let firebaseInitialized = false;
let remoteConfigInstance = null;

function getRemoteConfig() {
  const config = getConfig();
  if (config.environment === 'prod') {
    console.log('Skipping Firebase initialization in production environment');
    return null;
  }

  if (remoteConfigInstance) {
    return remoteConfigInstance;
  }

  if (!config.firebaseAdminSdkJsonBase64) {
    throw new Error('firebaseAdminSdkJsonBase64 is not set in the config!!');
  }

  try {
    const serviceAccountJSON = Buffer.from(process.env.FIREBASE_ADMIN_SDK_JSON_BASE64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJSON);

    if (!firebaseInitialized) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseInitialized = true;
      } catch (initError) {
        // If app already exists, get the default app
        if (initError.code === 'app/duplicate-app') {
          console.log('Firebase app already initialized, using existing app');
        } else {
          throw initError;
        }
      }
    }

    remoteConfigInstance = admin.remoteConfig();
    return remoteConfigInstance;
  } catch (error) {
    throw new Error(`Invalid firebaseAdminSdkJsonBase64: ${error.message}`);
  }
}

export async function updateRemoteConfig(params) {
  const config = getConfig();
  if (config.environment === 'prod') {
    console.log('Skipping updateRemoteConfig in production environment');
    return;
  }

  const remoteConfig = getRemoteConfig();
  if (!remoteConfig) {
    // In production, remoteConfig will be null.
    return;
  }

  try {
    const template = await remoteConfig.getTemplate();
    let hasChanges = false;

    for (const [paramKey, paramValue] of Object.entries(params)) {
      const currentParam = template.parameters[paramKey];

      if (!currentParam) {
        throw new Error(`Remote Config key "${paramKey}" not found.`);
      }

      if (currentParam.defaultValue.value === String(paramValue)) {
        continue;
      }

      template.parameters[paramKey] = {
        defaultValue: {
          value: String(paramValue),
        },
        description: currentParam.description || 'No description provided',
      };

      hasChanges = true;
    }

    if (hasChanges) {
      console.log('Updating Remote Config...');
      await remoteConfig.publishTemplate(template);
      console.log('Remote Config updated successfully');
    } else {
      console.log('No changes to Remote Config');
    }
  } catch (error) {
    console.error('Error updating Remote Config:', error.message);
    throw error;
  }
}
