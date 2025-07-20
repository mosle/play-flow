import ffmpeg from 'fluent-ffmpeg';
import { FileSystemManager } from '../core/file-system-manager';

// Use system ffmpeg if available, otherwise use bundled version
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  }
} catch (error) {
  // Use system ffmpeg
  console.log('Using system ffmpeg');
}

export class VideoConverter {
  static async convertWebMToMp4(inputPath: string, outputPath: string, chapterPath?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // First convert to MP4
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '22',
          '-c:a', 'aac',
          '-b:a', '128k'
        ])
        .on('error', (err) => {
          console.error('Error converting video:', err);
          reject(err);
        })
        .on('end', async () => {
          console.log('Video conversion completed');
          
          // If chapters provided, add them in a second pass
          if (chapterPath && FileSystemManager.existsSync(chapterPath)) {
            console.log('Adding chapters from:', chapterPath);
            const tempOutput = outputPath.replace('.mp4', '_temp.mp4');
            
            try {
              await new Promise<void>((resolveChapter, rejectChapter) => {
                ffmpeg(outputPath)
                  .input(chapterPath)
                  .outputOptions([
                    '-map', '0',
                    '-c', 'copy',
                    '-map_metadata', '0',
                    '-map_chapters', '1',
                    '-movflags', 'use_metadata_tags'
                  ])
                  .on('error', (err) => {
                    console.error('Error adding chapters:', err);
                    rejectChapter(err);
                  })
                  .on('end', () => {
                    console.log('Chapters added successfully');
                    resolveChapter();
                  })
                  .save(tempOutput);
              });
              
              // Replace original with chapter version
              await FileSystemManager.deleteFile(outputPath);
              await FileSystemManager.copyFile(tempOutput, outputPath);
              await FileSystemManager.deleteFile(tempOutput);
            } catch (chapterError) {
              console.warn('Failed to add chapters, keeping video without chapters:', chapterError);
            }
          }
          
          resolve(outputPath);
        })
        .save(outputPath);
    });
  }

  static async convertAndCleanup(webmPath: string, mp4Path: string, chapterPath?: string): Promise<string> {
    try {
      // Convert video with chapters if provided
      await VideoConverter.convertWebMToMp4(webmPath, mp4Path, chapterPath);
      
      // Delete original WebM file
      await FileSystemManager.deleteFile(webmPath);
      
      return mp4Path;
    } catch (error) {
      console.error('Failed to convert video, keeping WebM format:', error);
      return webmPath;
    }
  }
}