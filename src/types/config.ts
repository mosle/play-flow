export interface BrowserConfig {
  headless: boolean;
  slowMo: number;
  viewport: {
    width: number;
    height: number;
  };
  defaultTimeout?: number;      // Default timeout for all actions (ms)
  navigationTimeout?: number;   // Timeout for navigation actions like goto (ms)
}

export interface VideoConfig {
  size: {
    width: number;
    height: number;
  };
  fps: number;
  skipAllVtt?: boolean;
  skipAllChapters?: boolean;
}

export interface GlobalConfig {
  browser: BrowserConfig;
  video: VideoConfig;
}

export interface WorkflowConfig {
  browser?: Partial<BrowserConfig>;
  video?: Partial<VideoConfig>;
}