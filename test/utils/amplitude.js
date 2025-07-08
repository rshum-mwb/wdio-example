import axios from 'axios';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import zlib from 'zlib';
import { FileUtils } from '../../utils/fileUtils.js';
import dotenv from 'dotenv';
import { join } from 'path';

// Constants for Amplitude analytics
export const AMPLITUDE_API_CONFIG = {
  BASE_URL: 'https://amplitude.com/api/2',
  ENDPOINTS: {
    EXPORT: '/export',
  },
  // Default timeframes for event queries (in milliseconds)
  DEFAULT_TIME_RANGE: {
    // Default to 6 hours (allowing time for events to be processed)
    START_TIME_OFFSET: 6 * 60 * 60 * 1000,
    // Default to current time
    END_TIME_OFFSET: 0,
  },
};

export class Amplitude {
  constructor(environment = null, debug = false) {
    this.environment = (() => {
      dotenv.config();

      const env = environment || process.env.TARGET_ENV || 'stage';

      dotenv.config({ path: join(process.cwd(), `.env.${env}`) });

      return env;
    })();

    this.debug = debug;

    this.log(`Initializing Amplitude client for environment: ${this.environment}`);

    if (!process.env.AMPLITUDE_API_KEY || !process.env.AMPLITUDE_API_SECRET) {
      throw new Error(`Missing Amplitude configuration for environment: ${this.environment}`);
    }

    this.auth = {
      username: process.env.AMPLITUDE_API_KEY,
      password: process.env.AMPLITUDE_API_SECRET,
    };

    this.baseUrl = AMPLITUDE_API_CONFIG.BASE_URL;
  }

  /**
   * Log messages only when in debug mode
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.debug) {
      console.log(message);
    }
  }

  /**
   * Export events from Amplitude within a specific time range
   * @param {Date} startTime - Start time as Date object
   * @param {Date} endTime - End time as Date object
   * @returns {Promise<object>} - Parsed events data
   */
  async exportEvents(startTime, endTime) {
    try {
      this.log(`Exporting events from ${startTime.toISOString()} to ${endTime.toISOString()}`);

      // Format dates as YYYYMMDDTHH as required by Amplitude API
      const formatDateForAmplitude = (date) => {
        return date.toISOString().replace(/[-:]/g, '').substring(0, 11);
      };

      const startFormatted = formatDateForAmplitude(startTime);
      const endFormatted = formatDateForAmplitude(endTime);

      // Create temp directory for zip file
      const tempDir = './temp';
      // Clean up temp directory before starting to avoid accumulating files
      this.log('Cleaning up temp directory before operation');
      FileUtils.clearDirectory(tempDir);
      FileUtils.ensureDirectoryExists(tempDir);
      const zipFileName = `amplitude_data_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      const zipFilePath = path.join(tempDir, zipFileName);

      this.log(`Requesting data with start=${startFormatted}, end=${endFormatted}`);

      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}${AMPLITUDE_API_CONFIG.ENDPOINTS.EXPORT}`,
        params: {
          start: startFormatted,
          end: endFormatted,
        },
        auth: this.auth,
        responseType: 'arraybuffer',
      });

      // Validate response before saving to file system
      this.validateAmplitudeResponse(response);

      // Save the validated zip file
      fs.writeFileSync(zipFilePath, response.data);
      this.log(`Saved zip file to ${zipFilePath}`);

      // Extract and process the JSON files from the zip archive
      const zip = new AdmZip(zipFilePath);
      const zipEntries = zip.getEntries();
      this.log(`Zip file contains ${zipEntries.length} entries`);

      // Log information about each entry in the zip file
      zipEntries.forEach((entry, index) => {
        this.log(`Entry ${index + 1}: ${entry.entryName} (${entry.header.size} bytes)`);
      });

      const extractDir = path.join(tempDir, `extracted_${new Date().getTime()}`);
      FileUtils.ensureDirectoryExists(extractDir);

      this.log(`Extracting zip contents to ${extractDir}`);
      zip.extractAllTo(extractDir, true);

      // Process the extracted JSON and gzipped JSON files recursively
      // Function to recursively find all files in a directory and its subdirectories
      const getAllFiles = (dirPath, arrayOfFiles = []) => {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
          const filePath = path.join(dirPath, file);
          if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
          } else {
            arrayOfFiles.push(filePath);
          }
        });

        return arrayOfFiles;
      };

      const allExtractedFiles = getAllFiles(extractDir);
      this.log(`Found ${allExtractedFiles.length} files in the archive (including subdirectories)`);

      // Combine all JSON events from all files into a single array
      let allEvents = [];
      for (const filePath of allExtractedFiles) {
        const file = path.basename(filePath);
        if (file.endsWith('.json') || file.endsWith('.json.gz')) {
          this.log(`Processing file: ${file}`);

          let fileContent;

          // Handle gzipped files
          if (file.endsWith('.json.gz')) {
            try {
              const gzippedContent = fs.readFileSync(filePath);
              fileContent = zlib.gunzipSync(gzippedContent).toString('utf8');
              this.log(`Successfully decompressed ${file}`);
            } catch (error) {
              console.error(`Error decompressing ${file}:`, error);
              continue;
            }
          } else {
            try {
              fileContent = fs.readFileSync(filePath, 'utf8');
            } catch (error) {
              console.error(`Error reading ${file}:`, error);
              continue;
            }
          }

          // Check if we have content to process
          if (!fileContent || fileContent.trim() === '') {
            this.log(`File ${file} is empty or couldn't be read properly`);
            continue;
          }

          this.log(`File content length: ${fileContent.length} bytes`);

          try {
            // Amplitude export files have one JSON object per line
            const lines = fileContent.split('\n').filter((line) => line.trim().length > 0);
            this.log(`Found ${lines.length} non-empty lines in ${file}`);

            let parsedEvents = [];
            for (let i = 0; i < lines.length; i++) {
              try {
                const event = JSON.parse(lines[i]);
                parsedEvents.push(event);
              } catch (parseError) {
                console.error(`Error parsing JSON at line ${i + 1} in ${file}:`, parseError);
                console.log(`Problematic line content: ${lines[i].substring(0, 100)}...`);
              }
            }

            console.log(`Successfully parsed ${parsedEvents.length} events from ${file}`);
            allEvents = [...allEvents, ...parsedEvents];
          } catch (error) {
            console.error(`Error processing ${file}:`, error);
          }
        }
      }

      console.log(`Successfully processed ${allEvents.length} events`);
      return allEvents;
    } catch (error) {
      console.error('Error exporting events from Amplitude:', error.response?.status, error.response?.statusText);
      throw error;
    }
  }

  /**
   * Export events with default time range (last 4 hours)
   * @returns {Promise<Array>} - Parsed events data
   */
  async exportRecentEvents() {
    const now = new Date();
    const startTime = new Date(now.getTime() - AMPLITUDE_API_CONFIG.DEFAULT_TIME_RANGE.START_TIME_OFFSET);
    const endTime = new Date(now.getTime() - AMPLITUDE_API_CONFIG.DEFAULT_TIME_RANGE.END_TIME_OFFSET);

    return this.exportEvents(startTime, endTime);
  }

  /**
   * Filter events by event type
   * @param {Array} events - Array of event objects
   * @param {string} eventType - Event type to filter by
   * @returns {Array} - Filtered events
   */
  filterEventsByType(events, eventType) {
    return events.filter((event) => event.event_type === eventType);
  }

  /**
   * Filter events by user properties
   * @param {Array} events - Array of event objects
   * @param {object} properties - Properties to match (key-value pairs)
   * @returns {Array} - Filtered events
   */
  filterEventsByUserProperties(events, properties) {
    return events.filter((event) => {
      const userProps = event.user_properties || {};
      return Object.entries(properties).every(
        ([key, value]) => userProps[key] !== undefined && userProps[key] === value,
      );
    });
  }

  /**
   * Filter events by event properties
   * @param {Array} events - Array of event objects
   * @param {object} properties - Properties to match (key-value pairs)
   * @returns {Array} - Filtered events
   */
  filterEventsByEventProperties(events, properties) {
    return events.filter((event) => {
      const eventProps = event.event_properties || {};
      return Object.entries(properties).every(
        ([key, value]) => eventProps[key] !== undefined && eventProps[key] === value,
      );
    });
  }

  /**
   * Save events to a JSON file
   * @param {Array} events - Events to save
   * @param {string} filename - Filename to save to
   * @returns {string} - Full path to the saved file
   */
  /**
   * Validate the response from Amplitude API before saving to disk
   * @param {object} response - The axios response object
   * @throws {Error} If validation fails
   */
  validateAmplitudeResponse(response) {
    // 1. Check response status
    if (response.status !== 200) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    // 2. Check content type if available
    const contentType = response.headers?.['content-type'];
    if (contentType && !contentType.includes('application/zip') && !contentType.includes('application/octet-stream')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    // 3. Verify data is present and not too large (prevent DoS)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB limit
    if (!response.data) {
      throw new Error('Response data is empty');
    }
    if (response.data.length > MAX_SIZE) {
      throw new Error(`Response data too large: ${response.data.length} bytes`);
    }

    // 4. Check ZIP file signature (first 4 bytes should be 0x50 0x4b 0x03 0x04)
    if (!(response.data instanceof Buffer || response.data instanceof ArrayBuffer)) {
      throw new Error('Response data is not binary');
    }

    const data = Buffer.from(response.data);
    if (data.length < 4 || data[0] !== 0x50 || data[1] !== 0x4b || data[2] !== 0x03 || data[3] !== 0x04) {
      throw new Error('Response data does not have a valid ZIP signature');
    }

    this.log('Amplitude API response successfully validated');
  }

  /**
   * Save events to a JSON file
   * @param {Array} events - Events to save
   * @param {string} filename - Filename to save to
   * @returns {string} - Full path to the saved file
   */
  saveEventsToFile(events, filename) {
    const resultsDir = './results/analytics';
    FileUtils.ensureDirectoryExists(resultsDir);

    const filePath = path.join(resultsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2));

    return filePath;
  }
}
