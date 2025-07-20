import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { GlobalConfig, WorkflowConfig } from '../types';
import { GlobalConfigSchema, WorkflowConfigSchema } from '../utils/validation';
import { ConfigError } from '../utils/errors';

export class ConfigManager {
  private static readonly DEFAULT_CONFIG: GlobalConfig = {
    browser: {
      headless: false,
      slowMo: 0,
      viewport: {
        width: 1920,
        height: 1080,
      },
      defaultTimeout: 30000,      // 30 seconds default
      navigationTimeout: 30000,   // 30 seconds for navigation
    },
    video: {
      size: {
        width: 1920,
        height: 1080,
      },
      fps: 30,
    },
  };

  static async loadGlobalConfig(configPath = 'recording-config.json'): Promise<GlobalConfig> {
    try {
      // First, try to load user's custom config
      if (existsSync(configPath)) {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        const validation = GlobalConfigSchema.safeParse(config);
        if (!validation.success) {
          throw new ConfigError(
            `Invalid global config: ${validation.error.errors.map(e => e.message).join(', ')}`,
            configPath
          );
        }

        return validation.data;
      }

      // If user config doesn't exist, try to load default config
      const defaultConfigPath = 'recording-config.default.json';
      if (existsSync(defaultConfigPath)) {
        const configContent = readFileSync(defaultConfigPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        const validation = GlobalConfigSchema.safeParse(config);
        if (!validation.success) {
          throw new ConfigError(
            `Invalid default config: ${validation.error.errors.map(e => e.message).join(', ')}`,
            defaultConfigPath
          );
        }

        console.log('Using default configuration from recording-config.default.json');
        return validation.data;
      }

      // If neither exists, use hardcoded defaults
      console.log('No config files found, using built-in defaults');
      return this.DEFAULT_CONFIG;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      throw new ConfigError(`Failed to load global config: ${error}`, configPath);
    }
  }

  static async loadWorkflowConfig(workflowName: string): Promise<WorkflowConfig | null> {
    const configPath = join('workflows', workflowName, 'config.json');
    
    try {
      if (!existsSync(configPath)) {
        return null;
      }

      const configContent = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      const validation = WorkflowConfigSchema.safeParse(config);
      if (!validation.success) {
        throw new ConfigError(
          `Invalid workflow config: ${validation.error.errors.map(e => e.message).join(', ')}`,
          configPath
        );
      }

      return validation.data;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      throw new ConfigError(`Failed to load workflow config: ${error}`, configPath);
    }
  }

  static mergeConfigs(global: GlobalConfig, workflow?: WorkflowConfig | null): GlobalConfig {
    if (!workflow) {
      return global;
    }

    return {
      browser: {
        ...global.browser,
        ...(workflow.browser || {}),
        viewport: {
          ...global.browser.viewport,
          ...(workflow.browser?.viewport || {}),
        },
      },
      video: {
        ...global.video,
        ...(workflow.video || {}),
        size: {
          ...global.video.size,
          ...(workflow.video?.size || {}),
        },
      },
    };
  }

  static async loadAndMergeConfigs(workflowName: string): Promise<GlobalConfig> {
    const globalConfig = await this.loadGlobalConfig();
    const workflowConfig = await this.loadWorkflowConfig(workflowName);
    return this.mergeConfigs(globalConfig, workflowConfig);
  }

  static getDefaultConfig(): GlobalConfig {
    return { ...this.DEFAULT_CONFIG };
  }
}