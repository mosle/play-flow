import { promises as fs, existsSync } from 'fs';
import { join, dirname } from 'path';
import { FileSystemError } from '../utils/errors';

export class FileSystemManager {
  static async ensureDirectoryExists(path: string): Promise<void> {
    try {
      await fs.mkdir(path, { recursive: true });
    } catch (error) {
      throw new FileSystemError(
        `Failed to create directory: ${error}`,
        path
      );
    }
  }

  static async writeFile(path: string, content: string | Buffer): Promise<void> {
    try {
      // Ensure parent directory exists
      const dir = dirname(path);
      await this.ensureDirectoryExists(dir);
      
      await fs.writeFile(path, content, 'utf-8');
    } catch (error) {
      throw new FileSystemError(
        `Failed to write file: ${error}`,
        path
      );
    }
  }

  static async readFile(path: string): Promise<string> {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return content;
    } catch (error) {
      throw new FileSystemError(
        `Failed to read file: ${error}`,
        path
      );
    }
  }

  static async readFileBuffer(path: string): Promise<Buffer> {
    try {
      const content = await fs.readFile(path);
      return content;
    } catch (error) {
      throw new FileSystemError(
        `Failed to read file: ${error}`,
        path
      );
    }
  }

  static async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  static async listFiles(directory: string, pattern?: RegExp): Promise<string[]> {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      const files = entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name);
      
      if (pattern) {
        return files.filter(file => pattern.test(file));
      }
      
      return files;
    } catch (error) {
      throw new FileSystemError(
        `Failed to list files: ${error}`,
        directory
      );
    }
  }

  static async listDirectories(directory: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      throw new FileSystemError(
        `Failed to list directories: ${error}`,
        directory
      );
    }
  }

  static async copyFile(source: string, destination: string): Promise<void> {
    try {
      // Ensure destination directory exists
      const dir = dirname(destination);
      await this.ensureDirectoryExists(dir);
      
      await fs.copyFile(source, destination);
    } catch (error) {
      throw new FileSystemError(
        `Failed to copy file from ${source} to ${destination}: ${error}`
      );
    }
  }

  static async deleteFile(path: string): Promise<void> {
    try {
      await fs.unlink(path);
    } catch (error) {
      throw new FileSystemError(
        `Failed to delete file: ${error}`,
        path
      );
    }
  }

  static async deleteDirectory(path: string): Promise<void> {
    try {
      await fs.rmdir(path, { recursive: true });
    } catch (error) {
      throw new FileSystemError(
        `Failed to delete directory: ${error}`,
        path
      );
    }
  }

  static generateTimestamp(): string {
    const now = new Date();
    return now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, -5); // Remove milliseconds and Z
  }

  static generateTimestampedFilename(prefix: string, extension: string): string {
    const timestamp = this.generateTimestamp();
    return `${prefix}_${timestamp}.${extension}`;
  }

  static getWorkflowOutputDirectory(workflowName: string, timestamp?: string): string {
    const ts = timestamp || this.generateTimestamp();
    return join('output', `${workflowName}_${ts}`);
  }

  static getOutputPath(workflowName: string, type: 'video' | 'screenshot' | 'timecode', filename?: string, workflowDir?: string): string {
    const baseDir = workflowDir || this.getWorkflowOutputDirectory(workflowName);
    
    if (type === 'screenshot' && filename) {
      return join(baseDir, 'screenshots', `${filename}.png`);
    }
    
    const extension = type === 'video' ? 'mp4' : type === 'timecode' ? 'txt' : 'png';
    const prefix = type === 'timecode' ? 'timecode' : type;
    const generatedFilename = filename ? `${filename}.${extension}` : `${prefix}.${extension}`;
    
    return join(baseDir, generatedFilename);
  }
  
  static existsSync(path: string): boolean {
    return existsSync(path);
  }
}