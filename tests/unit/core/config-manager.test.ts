import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import { ConfigManager } from '../../../src/core/config-manager';
import { GlobalConfig } from '../../../src/types';

vi.mock('fs');

describe('ConfigManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadGlobalConfig', () => {
    it('should return built-in default config when no config files exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const config = await ConfigManager.loadGlobalConfig();
      
      expect(config).toEqual({
        browser: {
          headless: false,
          slowMo: 0,
          viewport: {
            width: 1920,
            height: 1080,
          },
        },
        video: {
          size: {
            width: 1920,
            height: 1080,
          },
          fps: 30,
        },
      });
    });

    it('should load default config file when user config does not exist', async () => {
      const defaultConfig: GlobalConfig = {
        browser: {
          headless: true,
          slowMo: 50,
          viewport: {
            width: 1600,
            height: 900,
          },
        },
        video: {
          size: {
            width: 1600,
            height: 900,
          },
          fps: 24,
        },
      };

      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(false) // User config doesn't exist
        .mockReturnValueOnce(true); // Default config exists
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(defaultConfig));

      const config = await ConfigManager.loadGlobalConfig();
      expect(config).toEqual(defaultConfig);
    });

    it('should load valid config from file', async () => {
      const customConfig: GlobalConfig = {
        browser: {
          headless: true,
          slowMo: 100,
          viewport: {
            width: 1280,
            height: 720,
          },
        },
        video: {
          size: {
            width: 1280,
            height: 720,
          },
          fps: 60,
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(customConfig));

      const config = await ConfigManager.loadGlobalConfig();
      expect(config).toEqual(customConfig);
    });

    it('should throw error for invalid config', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        browser: {
          headless: 'not-a-boolean', // Invalid
        },
      }));

      await expect(ConfigManager.loadGlobalConfig()).rejects.toThrow('Invalid global config');
    });
  });

  describe('loadWorkflowConfig', () => {
    it('should return null when workflow config does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = await ConfigManager.loadWorkflowConfig('test-workflow');
      expect(config).toBeNull();
    });

    it('should load valid workflow config', async () => {
      const workflowConfig = {
        browser: {
          headless: true,
        },
        video: {
          fps: 24,
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(workflowConfig));

      const config = await ConfigManager.loadWorkflowConfig('test-workflow');
      expect(config).toEqual(workflowConfig);
    });

    it('should throw error for invalid workflow config', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        browser: {
          viewport: {
            width: -100, // Invalid
          },
        },
      }));

      await expect(ConfigManager.loadWorkflowConfig('test-workflow')).rejects.toThrow('Invalid workflow config');
    });
  });

  describe('mergeConfigs', () => {
    it('should return global config when workflow config is null', () => {
      const globalConfig: GlobalConfig = ConfigManager.getDefaultConfig();
      
      const merged = ConfigManager.mergeConfigs(globalConfig, null);
      expect(merged).toEqual(globalConfig);
    });

    it('should merge workflow config with global config', () => {
      const globalConfig: GlobalConfig = {
        browser: {
          headless: false,
          slowMo: 0,
          viewport: {
            width: 1920,
            height: 1080,
          },
        },
        video: {
          size: {
            width: 1920,
            height: 1080,
          },
          fps: 30,
        },
      };

      const workflowConfig = {
        browser: {
          headless: true,
          slowMo: 50,
        },
        video: {
          fps: 60,
        },
      };

      const merged = ConfigManager.mergeConfigs(globalConfig, workflowConfig);
      
      expect(merged).toEqual({
        browser: {
          headless: true,
          slowMo: 50,
          viewport: {
            width: 1920,
            height: 1080,
          },
        },
        video: {
          size: {
            width: 1920,
            height: 1080,
          },
          fps: 60,
        },
      });
    });

    it('should deep merge nested objects', () => {
      const globalConfig: GlobalConfig = ConfigManager.getDefaultConfig();
      
      const workflowConfig = {
        browser: {
          viewport: {
            width: 1280,
          },
        },
      };

      const merged = ConfigManager.mergeConfigs(globalConfig, workflowConfig);
      
      expect(merged.browser.viewport).toEqual({
        width: 1280,
        height: 1080, // From global config
      });
    });
  });

  describe('loadAndMergeConfigs', () => {
    it('should load and merge both configs', async () => {
      const globalConfig: GlobalConfig = {
        browser: {
          headless: false,
          slowMo: 0,
          viewport: {
            width: 1920,
            height: 1080,
          },
        },
        video: {
          size: {
            width: 1920,
            height: 1080,
          },
          fps: 30,
        },
      };

      const workflowConfig = {
        browser: {
          headless: true,
        },
      };

      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(true) // Global config exists
        .mockReturnValueOnce(true); // Workflow config exists
      
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(JSON.stringify(globalConfig))
        .mockReturnValueOnce(JSON.stringify(workflowConfig));

      const config = await ConfigManager.loadAndMergeConfigs('test-workflow');
      
      expect(config.browser.headless).toBe(true); // From workflow
      expect(config.browser.slowMo).toBe(0); // From global
      expect(config.video.fps).toBe(30); // From global
    });
  });
});