import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

/**
 * Utility class for file system operations
 */
export class FileUtils {
  static directoryExists(directoryPath) {
    return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
  }

  static directoryHasContent(path) {
    if (!this.directoryExists(path)) return false;
    return fs.readdirSync(path).length > 0;
  }

  /**
   * Ensures a directory exists, creating it if needed
   * @param {string} directoryPath - Path to ensure
   */
  static ensureDirectoryExists(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }

  /**
   * Removes a directory and its contents
   * @param {string} directoryPath - Path to remove
   */
  static removeDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
      fs.rmSync(directoryPath, { recursive: true, force: true });
    }
  }

  /**
   * Clears the contents of a directory
   * @param {string} directoryPath - Path to the directory to clear
   */
  static clearDirectory(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
      return;
    }

    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        fs.rmSync(curPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(curPath);
      }
    }
  }

  /**
   * Finds entries in a directory that match certain criteria
   * @param {string} directoryPath - Directory to search
   * @param {Function} predicate - Function to test each entry
   * @returns {Array} - Matching directory entries
   */
  static findEntriesInDirectory(directoryPath, predicate) {
    if (!fs.existsSync(directoryPath)) return [];
    return fs.readdirSync(directoryPath, { withFileTypes: true }).filter(predicate);
  }

  /**
   * Recursively copies a directory from src to dest
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   * @returns {Promise<void>}
   */
  static async copyDirectory(src, dest) {
    await fsPromises.mkdir(dest, { recursive: true });
    const entries = await fsPromises.readdir(src, { withFileTypes: true });
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fsPromises.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Safely removes a file, ignoring errors if it doesn't exist
   * @param {string} filePath - Path to the file to remove
   * @returns {Promise<void>}
   */
  static async safeRemoveFile(filePath) {
    try {
      await fsPromises.unlink(filePath);
    } catch (error) {
      // Ignore errors if file doesn't exist
      if (error.code !== 'ENOENT') {
        console.warn(`Failed to remove file ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Finds an item in a directory with specific extension
   * @param {string} directoryPath - Directory to search in
   * @param {string} extension - File extension to look for
   * @param {boolean} isDirectory - Whether to look for directories or files
   * @returns {fs.Dirent|null} - Found directory entry or null
   */
  static findItemWithExtension(directoryPath, extension, isDirectory = false) {
    const items = this.findEntriesInDirectory(
      directoryPath,
      (item) => item.isDirectory() === isDirectory && path.extname(item.name) === extension,
    );
    return items.length > 0 ? items[0] : null;
  }
}
