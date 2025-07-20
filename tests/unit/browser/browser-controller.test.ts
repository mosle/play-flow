import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserController } from '../../../src/browser/browser-controller';
import { BrowserConfig } from '../../../src/types';
import { chromium } from 'playwright';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
  firefox: {
    launch: vi.fn(),
  },
  webkit: {
    launch: vi.fn(),
  },
}));

describe('BrowserController', () => {
  let controller: BrowserController;
  let mockBrowser: any;
  let mockContext: any;
  let mockPage: any;
  let mockVideo: any;

  const defaultConfig: BrowserConfig = {
    headless: true,
    slowMo: 0,
    viewport: {
      width: 1920,
      height: 1080,
    },
  };

  beforeEach(() => {
    controller = new BrowserController();
    
    mockVideo = {
      path: vi.fn().mockResolvedValue('/path/to/video.mp4'),
      saveAs: vi.fn().mockResolvedValue(undefined),
    };

    mockPage = {
      close: vi.fn().mockResolvedValue(undefined),
      video: vi.fn().mockReturnValue(mockVideo),
    };

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('launch', () => {
    it('should launch browser with config', async () => {
      await controller.launch(defaultConfig);

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        slowMo: 0,
      });

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: defaultConfig.viewport,
        recordVideo: {
          dir: 'output/temp-videos',
          size: defaultConfig.viewport,
        },
      });

      expect(mockContext.newPage).toHaveBeenCalled();
      expect(controller.isInitialized()).toBe(true);
    });
  });

  describe('getPage', () => {
    it('should return page after launch', async () => {
      await controller.launch(defaultConfig);
      const page = controller.getPage();
      
      expect(page).toBe(mockPage);
    });

    it('should throw error if not initialized', () => {
      expect(() => controller.getPage()).toThrow('Page not initialized');
    });
  });

  describe('close', () => {
    it('should close all resources', async () => {
      await controller.launch(defaultConfig);
      await controller.close();

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockContext.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(controller.isInitialized()).toBe(false);
    });

    it('should handle close when not initialized', async () => {
      await expect(controller.close()).resolves.not.toThrow();
    });
  });

  describe('video methods', () => {
    it('should get video path', async () => {
      await controller.launch(defaultConfig);
      const path = await controller.getVideoPath();

      expect(path).toBe('/path/to/video.mp4');
    });

    it('should save video', async () => {
      await controller.launch(defaultConfig);
      await controller.saveVideo('/output/video.mp4');

      expect(mockVideo.saveAs).toHaveBeenCalledWith('/output/video.mp4');
    });

    it('should throw error if page not initialized', async () => {
      await expect(controller.getVideoPath()).rejects.toThrow('Page not initialized');
      await expect(controller.saveVideo('/output/video.mp4')).rejects.toThrow('Page not initialized');
    });
  });
});