import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { FileSystemManager } from '../../core/file-system-manager';
import { ConfigManager } from '../../core/config-manager';

export function setupCommand(program: Command): void {
  program
    .command('setup')
    .description('Initialize the system and install browser dependencies')
    .action(async () => {
      try {
        console.log(chalk.blue('Setting up workflow-video-recorder...'));

        // Create directory structure
        console.log(chalk.gray('Creating directory structure...'));
        await FileSystemManager.ensureDirectoryExists('workflows');
        await FileSystemManager.ensureDirectoryExists('output');
        await FileSystemManager.ensureDirectoryExists('output/screenshots');
        await FileSystemManager.ensureDirectoryExists('output/temp-videos');

        // Create default config if not exists
        if (!await FileSystemManager.exists('recording-config.json')) {
          console.log(chalk.gray('Creating default configuration...'));
          const defaultConfig = ConfigManager.getDefaultConfig();
          await FileSystemManager.writeFile(
            'recording-config.json',
            JSON.stringify(defaultConfig, null, 2)
          );
        }

        // Install Playwright browsers
        console.log(chalk.gray('Installing Playwright browsers...'));
        await installPlaywrightBrowsers();

        // Check FFmpeg installation
        console.log(chalk.gray('Checking FFmpeg installation...'));
        const ffmpegInstalled = await checkFFmpeg();
        if (!ffmpegInstalled) {
          console.log(chalk.yellow('Warning: FFmpeg is not installed or not in PATH'));
          console.log(chalk.yellow('Please install FFmpeg for video recording functionality'));
          console.log(chalk.yellow('  macOS: brew install ffmpeg'));
          console.log(chalk.yellow('  Ubuntu: sudo apt-get install ffmpeg'));
          console.log(chalk.yellow('  Windows: Download from https://ffmpeg.org/download.html'));
        } else {
          console.log(chalk.green('FFmpeg is installed'));
        }

        // Create example workflow
        const exampleExists = await FileSystemManager.exists('workflows/example');
        if (!exampleExists) {
          console.log(chalk.gray('Creating example workflow...'));
          const { WorkflowManager } = await import('../../core/workflow-manager');
          const workflowManager = new WorkflowManager();
          await workflowManager.createWorkflowTemplate('example');
        }

        console.log(chalk.green('\nSetup completed successfully!'));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray('  1. Edit workflows/example/actions.json to define your workflow'));
        console.log(chalk.gray('  2. Run: yarn record example'));
        console.log(chalk.gray('  3. Find the recording in the output/ directory'));

      } catch (error) {
        console.error(chalk.red('Setup failed:'), error);
        process.exit(1);
      }
    });
}

async function installPlaywrightBrowsers(): Promise<void> {
  return new Promise((resolve, reject) => {
    const install = spawn('npx', ['playwright', 'install'], {
      stdio: 'inherit',
      shell: true,
    });

    install.on('error', (error) => {
      reject(new Error(`Failed to install Playwright browsers: ${error.message}`));
    });

    install.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Playwright install exited with code ${code}`));
      }
    });
  });
}

async function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version'], {
      stdio: 'pipe',
    });

    ffmpeg.on('error', () => {
      resolve(false);
    });

    ffmpeg.on('exit', (code) => {
      resolve(code === 0);
    });
  });
}