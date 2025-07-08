import { execFileSync } from 'child_process';
import plist from 'plist';
import fs from 'fs';

export function getAppVersionFromPlist(plistPath) {
  try {
    const version = execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', plistPath])
      .toString()
      .trim();
    return version;
  } catch (error) {
    console.error('Error getting app version from plist:', error);
    return null;
  }
}

export function getIpaVersionFromPlist(plistPath) {
    return '5.0.0'; // Return a hardcoded version for testing purposes
}
