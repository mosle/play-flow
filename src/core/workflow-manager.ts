import { join } from 'path';
import { Workflow, ValidationResult, ExecutionResult, ExecuteOptions } from '../types';
import { FileSystemManager } from './file-system-manager';
import { ConfigManager } from './config-manager';
import { validateWorkflow } from '../utils/validation';
import { BrowserController } from '../browser/browser-controller';
import { ActionExecutor } from '../browser/action-executor';
import { registerActionHandlers } from '../browser/action-handler-registry';
// import { PlatformVideoRecorder } from '../video/video-recorder';
import { VideoConverter } from '../utils/video-converter';
import { TimecodeLogger } from '../utils/timecode-logger';
import chalk from 'chalk';

export class WorkflowManager {
  async loadWorkflow(name: string): Promise<Workflow> {
    const workflowPath = join('workflows', name, 'actions.json');
    
    if (!await FileSystemManager.exists(workflowPath)) {
      throw new Error(`Workflow '${name}' not found at ${workflowPath}`);
    }

    const content = await FileSystemManager.readFile(workflowPath);
    const actions = JSON.parse(content);
    
    const workflow: Workflow = {
      name,
      actions,
    };

    // Load workflow-specific config if exists
    const config = await ConfigManager.loadWorkflowConfig(name);
    if (config) {
      workflow.config = config;
    }

    return workflow;
  }

  async validateWorkflow(workflow: Workflow): Promise<ValidationResult> {
    return validateWorkflow(workflow);
  }

  async executeWorkflow(workflow: Workflow, options?: ExecuteOptions): Promise<ExecutionResult> {
    const startTime = Date.now();
    let browser: BrowserController | null = null;
    // let videoRecorder: PlatformVideoRecorder | null = null;
    let videoPath: string | undefined;
    let timecodeLogger: TimecodeLogger | null = null;

    try {
      // Load and merge configs
      const config = await ConfigManager.loadAndMergeConfigs(workflow.name);
      
      console.log(chalk.blue(`Starting workflow: ${workflow.name}`));
      
      // Create workflow output directory
      const timestamp = FileSystemManager.generateTimestamp();
      const workflowOutputDir = FileSystemManager.getWorkflowOutputDirectory(workflow.name, timestamp);
      await FileSystemManager.ensureDirectoryExists(workflowOutputDir);
      await FileSystemManager.ensureDirectoryExists(join(workflowOutputDir, 'screenshots'));
      
      // Initialize browser first
      browser = new BrowserController();
      await browser.launch(config.browser, 'chromium', {
        loadSession: options?.loadSession,
        saveSession: options?.saveSession,
        record: options?.record
      });
      
      // Initialize timecode logger after browser is ready (to sync with video start)
      // Only create logger if recording is enabled
      if (options?.record !== false) {
        timecodeLogger = new TimecodeLogger(workflowOutputDir, workflow.name, timestamp, {
          skipAllVtt: config.video.skipAllVtt,
          skipAllChapters: config.video.skipAllChapters
        });
      }
      
      // Initialize video recorder - using Playwright's built-in recording
      // videoRecorder = new PlatformVideoRecorder();
      // await videoRecorder.start(config.video);
      
      // Initialize action executor
      const actionExecutor = new ActionExecutor();
      actionExecutor.setContext({ workflowOutputDir });
      registerActionHandlers(actionExecutor);
      
      const page = browser.getPage();
      
      // Execute actions
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];
        if (!action) continue;
        
        console.log(chalk.gray(`[${i + 1}/${workflow.actions.length}] ${action.type}: ${action.description || ''}`));
        
        // Log action start
        if (timecodeLogger) {
          timecodeLogger.logAction(action, i);
        }
        
        // Add action description to video
        // if (action.description) {
        //   await videoRecorder.addActionDescription(action.description);
        // }
        
        // Add timecode
        // await videoRecorder.addTimecode(Date.now());
        
        // Execute action with timing
        const actionStartTime = Date.now();
        try {
          await actionExecutor.executeAction(action, page, i);
          const actionDuration = Date.now() - actionStartTime;
          if (timecodeLogger) {
            timecodeLogger.logActionComplete(action, i, actionDuration);
          }
        } catch (error) {
          if (timecodeLogger) {
            timecodeLogger.logError(action, i, error as Error);
          }
          throw error;
        }
        
        // Small delay between actions for visual clarity
        await page.waitForTimeout(500);
      }
      
      console.log(chalk.green('Workflow completed successfully'));
      
      // Close the page first to ensure video is finalized
      const currentPage = browser.getPage();
      await currentPage.close();
      
      // Wait a bit for video to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Handle video recording if enabled
      if (options?.record !== false) {
        // Get video path from temp directory
        const tempVideos = await FileSystemManager.listFiles('output/temp-videos', /\.webm$/);
        if (tempVideos.length > 0) {
        // Get the most recent video file
        const latestVideo = tempVideos[tempVideos.length - 1];
        if (latestVideo) {
          const tempVideoPath = join('output/temp-videos', latestVideo);
        
        // Generate output paths
        const webmPath = FileSystemManager.getOutputPath(workflow.name, 'video', 'video.webm', workflowOutputDir);
        const mp4Path = FileSystemManager.getOutputPath(workflow.name, 'video', 'video', workflowOutputDir);
        
        // Copy video to output directory
        if (webmPath) {
          await FileSystemManager.copyFile(tempVideoPath, webmPath);
          
          // Generate chapters and VTT before video conversion
          if (timecodeLogger) {
            timecodeLogger.generateFiles();
          }
          
          // Convert to MP4 with chapters
          console.log(chalk.gray('Converting video to MP4 format...'));
          const chapterPath = timecodeLogger?.getChapterFilePath();
          videoPath = await VideoConverter.convertAndCleanup(webmPath, mp4Path, chapterPath);
          console.log(chalk.gray(`Video saved as MP4: ${videoPath}`));
          
          // Clean up temp video
          await FileSystemManager.deleteFile(tempVideoPath);
        }
        }
      }
      }
      
      // Save session if requested
      if (options?.saveSession && browser) {
        await browser.saveSession(options.saveSession);
      }
      
      await browser.close();
      
      const duration = Date.now() - startTime;
      
      // Finalize timecode log
      if (timecodeLogger) {
        timecodeLogger.finalize(duration);
        console.log(chalk.gray(`Timecode log saved: ${timecodeLogger.getLogFilePath()}`));
      }
      
      return {
        success: true,
        videoPath,
        outputDirectory: workflowOutputDir,
        duration,
      };
    } catch (error) {
      console.error(chalk.red(`Error executing workflow: ${error}`));
      
      // Try to save Playwright video even on error
      if (browser && browser.isInitialized()) {
        try {
          const currentPage = browser.getPage();
          await currentPage.close();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const tempVideos = await FileSystemManager.listFiles('output/temp-videos', /\.webm$/);
          if (tempVideos.length > 0) {
            const latestVideo = tempVideos[tempVideos.length - 1];
            if (!latestVideo) throw new Error('No video found');
            const tempVideoPath = join('output/temp-videos', latestVideo);
            
            const workflowOutputDir = FileSystemManager.getWorkflowOutputDirectory(workflow.name);
            await FileSystemManager.ensureDirectoryExists(workflowOutputDir);
            const webmPath = FileSystemManager.getOutputPath(workflow.name, 'video', 'video.webm', workflowOutputDir);
            const mp4Path = FileSystemManager.getOutputPath(workflow.name, 'video', 'video', workflowOutputDir);
            
            if (webmPath) {
              await FileSystemManager.copyFile(tempVideoPath, webmPath);
              const chapterPath = timecodeLogger?.getChapterFilePath();
              videoPath = await VideoConverter.convertAndCleanup(webmPath, mp4Path, chapterPath);
              // Clean up temp video even on error
              await FileSystemManager.deleteFile(tempVideoPath);
            }
          }
        } catch (e) {
          console.error(chalk.red(`Failed to save video: ${e}`));
        }
      }
      
      // Clean up browser
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error(chalk.red(`Failed to close browser: ${e}`));
        }
      }
      
      const duration = Date.now() - startTime;
      
      // Finalize timecode log even on error
      if (timecodeLogger) {
        timecodeLogger.finalize(duration);
        console.log(chalk.gray(`Timecode log saved: ${timecodeLogger.getLogFilePath()}`));
      }
      
      return {
        success: false,
        videoPath,
        error: error as Error,
        duration,
      };
    }
  }

  async listWorkflows(): Promise<string[]> {
    const workflowsDir = 'workflows';
    
    if (!await FileSystemManager.exists(workflowsDir)) {
      return [];
    }

    const directories = await FileSystemManager.listDirectories(workflowsDir);
    const workflows: string[] = [];

    for (const dir of directories) {
      const actionsPath = join(workflowsDir, dir, 'actions.json');
      if (await FileSystemManager.exists(actionsPath)) {
        workflows.push(dir);
      }
    }

    return workflows.sort();
  }

  async createWorkflowTemplate(name: string): Promise<void> {
    const workflowDir = join('workflows', name);
    await FileSystemManager.ensureDirectoryExists(workflowDir);

    // Create sample actions.json
    const sampleActions = [
      {
        type: 'goto',
        url: 'https://example.com',
        description: 'Navigate to example.com',
      },
      {
        type: 'waitForSelector',
        selector: 'h1',
        description: 'Wait for page to load',
      },
      {
        type: 'screenshot',
        description: 'Take a screenshot',
      },
    ];

    await FileSystemManager.writeFile(
      join(workflowDir, 'actions.json'),
      JSON.stringify(sampleActions, null, 2)
    );

    // Create sample config.json
    const sampleConfig = {
      browser: {
        headless: false,
      },
      video: {
        fps: 30,
      },
    };

    await FileSystemManager.writeFile(
      join(workflowDir, 'config.json'),
      JSON.stringify(sampleConfig, null, 2)
    );

    console.log(chalk.green(`Created workflow template: ${name}`));
  }
}