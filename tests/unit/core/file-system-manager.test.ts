import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { FileSystemManager } from '../../../src/core/file-system-manager';
import { FileSystemError } from '../../../src/utils/errors';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    access: vi.fn(),
    readdir: vi.fn(),
    copyFile: vi.fn(),
    unlink: vi.fn(),
    rmdir: vi.fn(),
  },
}));

describe('FileSystemManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await FileSystemManager.ensureDirectoryExists('/test/dir');

      expect(fs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should throw FileSystemError on failure', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));

      await expect(FileSystemManager.ensureDirectoryExists('/test/dir'))
        .rejects.toThrow(FileSystemError);
    });
  });

  describe('writeFile', () => {
    it('should write file and create parent directory', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await FileSystemManager.writeFile('/test/dir/file.txt', 'content');

      expect(fs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith('/test/dir/file.txt', 'content', 'utf-8');
    });

    it('should write buffer', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const buffer = Buffer.from('binary content');
      await FileSystemManager.writeFile('/test/file.bin', buffer);

      expect(fs.writeFile).toHaveBeenCalledWith('/test/file.bin', buffer, 'utf-8');
    });
  });

  describe('readFile', () => {
    it('should read file as string', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('file content');

      const content = await FileSystemManager.readFile('/test/file.txt');

      expect(content).toBe('file content');
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('should throw FileSystemError on failure', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(FileSystemManager.readFile('/test/file.txt'))
        .rejects.toThrow(FileSystemError);
    });
  });

  describe('readFileBuffer', () => {
    it('should read file as buffer', async () => {
      const buffer = Buffer.from('binary content');
      vi.mocked(fs.readFile).mockResolvedValue(buffer);

      const content = await FileSystemManager.readFileBuffer('/test/file.bin');

      expect(content).toEqual(buffer);
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.bin');
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const exists = await FileSystemManager.exists('/test/file.txt');

      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));

      const exists = await FileSystemManager.exists('/test/file.txt');

      expect(exists).toBe(false);
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'file1.txt', isFile: () => true, isDirectory: () => false } as any,
        { name: 'file2.js', isFile: () => true, isDirectory: () => false } as any,
        { name: 'dir', isFile: () => false, isDirectory: () => true } as any,
      ]);

      const files = await FileSystemManager.listFiles('/test');

      expect(files).toEqual(['file1.txt', 'file2.js']);
    });

    it('should filter files by pattern', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'file1.txt', isFile: () => true, isDirectory: () => false } as any,
        { name: 'file2.js', isFile: () => true, isDirectory: () => false } as any,
        { name: 'file3.txt', isFile: () => true, isDirectory: () => false } as any,
      ]);

      const files = await FileSystemManager.listFiles('/test', /\.txt$/);

      expect(files).toEqual(['file1.txt', 'file3.txt']);
    });
  });

  describe('listDirectories', () => {
    it('should list directories', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'file.txt', isFile: () => true, isDirectory: () => false } as any,
        { name: 'dir1', isFile: () => false, isDirectory: () => true } as any,
        { name: 'dir2', isFile: () => false, isDirectory: () => true } as any,
      ]);

      const dirs = await FileSystemManager.listDirectories('/test');

      expect(dirs).toEqual(['dir1', 'dir2']);
    });
  });

  describe('generateTimestampedFilename', () => {
    it('should generate filename with timestamp', () => {
      const mockDate = new Date('2024-01-15T10:30:45.123Z');
      vi.setSystemTime(mockDate);

      const filename = FileSystemManager.generateTimestampedFilename('test', 'mp4');

      expect(filename).toBe('test_2024-01-15_10-30-45.mp4');

      vi.useRealTimers();
    });
  });

  describe('getOutputPath', () => {
    it('should generate video output path', () => {
      const mockDate = new Date('2024-01-15T10:30:45.123Z');
      vi.setSystemTime(mockDate);

      const path = FileSystemManager.getOutputPath('my-workflow', 'video');

      expect(path).toBe('output/my-workflow_2024-01-15_10-30-45.mp4');

      vi.useRealTimers();
    });

    it('should generate screenshot output path', () => {
      const mockDate = new Date('2024-01-15T10:30:45.123Z');
      vi.setSystemTime(mockDate);

      const path = FileSystemManager.getOutputPath('my-workflow', 'screenshot');

      expect(path).toBe('output/screenshots/my-workflow_2024-01-15_10-30-45.png');

      vi.useRealTimers();
    });

    it('should use provided filename', () => {
      const path = FileSystemManager.getOutputPath('my-workflow', 'video', 'custom-name.mp4');

      expect(path).toBe('output/custom-name.mp4');
    });
  });
});