import ffmpeg from 'fluent-ffmpeg';
import { VideoConfig } from '../types';
import { FileSystemManager } from '../core/file-system-manager';
import { spawn, ChildProcess } from 'child_process';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

export interface VideoRecorder {
  start(config: VideoConfig): Promise<void>;
  addTimecode(timestamp: number): Promise<void>;
  addActionDescription(description: string): Promise<void>;
  stop(): Promise<string>;
}

export class FFmpegVideoRecorder implements VideoRecorder {
  private ffmpegProcess: ChildProcess | null = null;
  private outputPath: string | null = null;
  private config: VideoConfig | null = null;
  private isRecording = false;
  private overlayTexts: Array<{ text: string; timestamp: number }> = [];

  async start(config: VideoConfig): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    this.config = config;
    this.outputPath = FileSystemManager.getOutputPath('recording', 'video');
    
    // Ensure output directory exists
    await FileSystemManager.ensureDirectoryExists('output');

    // Start FFmpeg recording process
    let args: string[];
    
    if (process.platform === 'darwin') {
      // macOS specific args
      args = [
        '-y', // Overwrite output file
        '-f', 'avfoundation', // macOS screen capture
        '-framerate', String(config.fps),
        '-capture_cursor', '1', // Capture cursor
        '-i', '1:', // Screen index (1 is usually the main screen)
        '-vf', `scale=${config.size.width}:${config.size.height}`, // Scale to desired size
        '-codec:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        this.outputPath,
      ];
    } else if (process.platform === 'win32') {
      // Windows specific args
      args = [
        '-y',
        '-f', 'gdigrab',
        '-framerate', String(config.fps),
        '-i', 'desktop',
        '-vf', `scale=${config.size.width}:${config.size.height}`,
        '-codec:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        this.outputPath,
      ];
    } else {
      // Linux (X11)
      args = [
        '-y',
        '-f', 'x11grab',
        '-video_size', `${config.size.width}x${config.size.height}`,
        '-framerate', String(config.fps),
        '-i', ':0.0',
        '-codec:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        this.outputPath,
      ];
    }

    this.ffmpegProcess = spawn(ffmpegPath.path, args);
    this.isRecording = true;

    // Handle process events
    this.ffmpegProcess.on('error', (error) => {
      console.error('FFmpeg error:', error);
      this.isRecording = false;
    });

    this.ffmpegProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error('FFmpeg exited with code:', code);
      }
      this.isRecording = false;
    });

    // Wait a bit for FFmpeg to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async addTimecode(timestamp: number): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    const date = new Date(timestamp);
    const timeString = date.toISOString().replace('T', ' ').slice(0, -5);
    this.overlayTexts.push({ text: timeString, timestamp });
  }

  async addActionDescription(description: string): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    this.overlayTexts.push({ 
      text: `Action: ${description}`, 
      timestamp: Date.now() 
    });
  }

  async stop(): Promise<string> {
    if (!this.isRecording || !this.ffmpegProcess || !this.outputPath) {
      throw new Error('No recording in progress');
    }

    // Send quit signal to FFmpeg
    this.ffmpegProcess.stdin?.write('q');
    
    // Wait for process to exit
    await new Promise<void>((resolve) => {
      if (!this.ffmpegProcess) {
        resolve();
        return;
      }

      this.ffmpegProcess.on('exit', () => {
        resolve();
      });

      // Force kill after timeout
      setTimeout(() => {
        if (this.ffmpegProcess) {
          this.ffmpegProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    });

    this.isRecording = false;
    const finalPath = this.outputPath;
    
    // Apply overlays if any
    if (this.overlayTexts.length > 0 && this.config) {
      const processedPath = await this.applyOverlays(finalPath, this.config);
      return processedPath;
    }

    return finalPath;
  }

  private async applyOverlays(inputPath: string, _config: VideoConfig): Promise<string> {
    const outputPath = inputPath.replace('.mp4', '_with_overlay.mp4');
    
    return new Promise((resolve) => {
      let command = ffmpeg(inputPath);
      
      // Build filter complex for text overlays
      let filterComplex = '';
      this.overlayTexts.forEach((overlay, index) => {
        const startTime = (overlay.timestamp - (this.overlayTexts[0]?.timestamp || 0)) / 1000;
        filterComplex += `drawtext=text='${overlay.text.replace(/'/g, "\\''")}':`;
        filterComplex += `x=10:y=${30 + index * 30}:`;
        filterComplex += `fontsize=24:fontcolor=white:`;
        filterComplex += `box=1:boxcolor=black@0.5:boxborderw=5:`;
        filterComplex += `enable='gte(t,${startTime})'`;
        
        if (index < this.overlayTexts.length - 1) {
          filterComplex += ',';
        }
      });

      command
        .videoCodec('libx264')
        .outputOptions([
          '-vf', filterComplex,
          '-preset', 'fast',
          '-crf', '22',
        ])
        .on('error', (err) => {
          console.error('Error applying overlays:', err);
          resolve(inputPath); // Return original on error
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .save(outputPath);
    });
  }
}

// Platform-specific screen recording implementation
export class PlatformVideoRecorder implements VideoRecorder {
  private delegate: VideoRecorder;

  constructor() {
    // Use platform-specific recorder
    if (process.platform === 'darwin') {
      this.delegate = new MacOSVideoRecorder();
    } else if (process.platform === 'win32') {
      this.delegate = new WindowsVideoRecorder();
    } else {
      this.delegate = new FFmpegVideoRecorder();
    }
  }

  async start(config: VideoConfig): Promise<void> {
    return this.delegate.start(config);
  }

  async addTimecode(timestamp: number): Promise<void> {
    return this.delegate.addTimecode(timestamp);
  }

  async addActionDescription(description: string): Promise<void> {
    return this.delegate.addActionDescription(description);
  }

  async stop(): Promise<string> {
    return this.delegate.stop();
  }
}

// macOS specific implementation using screencapture
class MacOSVideoRecorder implements VideoRecorder {
  private ffmpegRecorder: FFmpegVideoRecorder;

  constructor() {
    this.ffmpegRecorder = new FFmpegVideoRecorder();
  }

  async start(config: VideoConfig): Promise<void> {
    // For now, delegate to FFmpeg recorder
    // In a real implementation, we could use macOS screen recording APIs
    return this.ffmpegRecorder.start(config);
  }

  async addTimecode(timestamp: number): Promise<void> {
    return this.ffmpegRecorder.addTimecode(timestamp);
  }

  async addActionDescription(description: string): Promise<void> {
    return this.ffmpegRecorder.addActionDescription(description);
  }

  async stop(): Promise<string> {
    return this.ffmpegRecorder.stop();
  }
}

// Windows specific implementation
class WindowsVideoRecorder implements VideoRecorder {
  private ffmpegRecorder: FFmpegVideoRecorder;

  constructor() {
    this.ffmpegRecorder = new FFmpegVideoRecorder();
  }

  async start(config: VideoConfig): Promise<void> {
    // For Windows, we need to use different FFmpeg options
    // This is a simplified version - real implementation would be more complex
    return this.ffmpegRecorder.start(config);
  }

  async addTimecode(timestamp: number): Promise<void> {
    return this.ffmpegRecorder.addTimecode(timestamp);
  }

  async addActionDescription(description: string): Promise<void> {
    return this.ffmpegRecorder.addActionDescription(description);
  }

  async stop(): Promise<string> {
    return this.ffmpegRecorder.stop();
  }
}