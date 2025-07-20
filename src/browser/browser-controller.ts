import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { BrowserConfig } from '../types';
import { join } from 'path';
import { existsSync } from 'fs';
import { FileSystemManager } from '../core/file-system-manager';

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export class BrowserController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async launch(config: BrowserConfig, browserType: BrowserType = 'chromium', options?: { loadSession?: string; saveSession?: string; record?: boolean }): Promise<void> {
    const browserLauncher = this.getBrowserLauncher(browserType);
    
    this.browser = await browserLauncher.launch({
      headless: config.headless,
      slowMo: config.slowMo,
    });

    // Load session state if specified
    let storageState = undefined;
    if (options?.loadSession) {
      const sessionPath = this.getSessionPath(options.loadSession);
      if (existsSync(sessionPath)) {
        storageState = sessionPath;
        console.log(`Loading session from: ${sessionPath}`);
      } else {
        console.warn(`Session file not found: ${sessionPath}`);
      }
    }

    const contextOptions: any = {
      viewport: config.viewport,
      storageState,
    };

    // Only record video if explicitly requested (default true for backward compatibility)
    if (options?.record !== false) {
      contextOptions.recordVideo = {
        dir: 'output/temp-videos',
        size: config.viewport,
      };
    }

    this.context = await this.browser.newContext(contextOptions);
    
    // Set default timeout for all actions if configured
    if (config.defaultTimeout) {
      this.context.setDefaultTimeout(config.defaultTimeout);
    }
    
    // Set navigation timeout if configured
    if (config.navigationTimeout) {
      this.context.setDefaultNavigationTimeout(config.navigationTimeout);
    }

    this.page = await this.context.newPage();
  }

  async newPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser context not initialized. Call launch() first.');
    }
    return await this.context.newPage();
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('Page not initialized. Call launch() first.');
    }
    return this.page;
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async getVideoPath(): Promise<string | undefined> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const video = this.page.video();
    if (!video) {
      return undefined;
    }

    return await video.path();
  }

  async saveVideo(outputPath: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const video = this.page.video();
    if (!video) {
      throw new Error('No video recording available');
    }

    await video.saveAs(outputPath);
  }

  private getBrowserLauncher(browserType: BrowserType) {
    switch (browserType) {
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      case 'chromium':
      default:
        return chromium;
    }
  }

  isInitialized(): boolean {
    return this.browser !== null && this.context !== null && this.page !== null;
  }

  async saveSession(sessionName: string): Promise<void> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const sessionPath = this.getSessionPath(sessionName);
    const sessionDir = join('sessions');
    
    // Ensure sessions directory exists
    await FileSystemManager.ensureDirectoryExists(sessionDir);
    
    // Save storage state
    await this.context.storageState({ path: sessionPath });
    console.log(`Session saved to: ${sessionPath}`);
  }

  private getSessionPath(sessionName: string): string {
    return join('sessions', `${sessionName}.json`);
  }
}