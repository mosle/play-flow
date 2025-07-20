import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { Action } from '../types';

export class TimecodeLogger {
  private startTime: number;
  private logFilePath: string;
  private vttFilePath: string;
  private chapterFilePath: string;
  private logs: Array<{ time: string; duration: number; action: string; description: string }> = [];
  private vttMarkers: Array<{ startTime: number; endTime: number; text: string }> = [];
  private chapters: Array<{ time: number; title: string }> = [];
  private isFirstAction: boolean = true;
  private config: { skipAllVtt?: boolean; skipAllChapters?: boolean } = {};

  constructor(workflowOutputDir: string, workflowName: string, _timestamp: string, config?: { skipAllVtt?: boolean; skipAllChapters?: boolean }) {
    this.startTime = Date.now();
    this.logFilePath = join(workflowOutputDir, 'timecode.txt');
    this.vttFilePath = join(workflowOutputDir, 'markers.vtt');
    this.chapterFilePath = join(workflowOutputDir, 'chapters.txt');
    this.config = config || {};
    this.initializeLog(workflowName);
  }

  private initializeLog(workflowName: string): void {
    const header = [
      `Workflow: ${workflowName}`,
      `Started at: ${new Date(this.startTime).toISOString()}`,
      '='.repeat(80),
      '',
      'TIME\t\tDURATION\tACTION\t\t\tDESCRIPTION',
      '-'.repeat(80),
      ''
    ].join('\n');

    writeFileSync(this.logFilePath, header);
  }

  logAction(action: Action, _index: number): void {
    // Reset start time on first action (usually goto) to sync with video start
    if (this.isFirstAction && action.type === 'goto') {
      this.startTime = Date.now();
      this.isFirstAction = false;
    }
    
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;
    const timeString = this.formatTime(elapsed);
    
    const actionType = action.type.padEnd(20);
    const description = action.description || this.getDefaultDescription(action);
    
    const logEntry = `${timeString}\t\t+0ms\t\t${actionType}\t${description}`;
    
    this.logs.push({
      time: timeString,
      duration: 0,
      action: action.type,
      description
    });

    appendFileSync(this.logFilePath, logEntry + '\n');
    
    // Add VTT marker if not skipped
    const shouldAddVtt = !this.config.skipAllVtt && !action.skipVtt;
    if (shouldAddVtt) {
      this.vttMarkers.push({
        startTime: elapsed,
        endTime: elapsed + 3000, // Show marker for 3 seconds
        text: description
      });
    }
    
    // Add chapter if not skipped
    const shouldAddChapter = !this.config.skipAllChapters && !action.skipChapter;
    if (shouldAddChapter) {
      this.chapters.push({
        time: elapsed,
        title: description
      });
    }
  }

  logActionComplete(_action: Action, index: number, duration: number): void {
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;
    const timeString = this.formatTime(elapsed);
    
    // Update the last log entry with actual duration
    if (this.logs.length > 0) {
      const lastLog = this.logs[this.logs.length - 1];
      if (lastLog) {
        lastLog.duration = duration;
      }
    }

    // Add completion marker
    const completionLog = `${timeString}\t\t+${duration}ms\t\t[Completed #${index + 1}]`;
    appendFileSync(this.logFilePath, completionLog + '\n');
  }

  logError(action: Action, _index: number, error: Error): void {
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;
    const timeString = this.formatTime(elapsed);
    
    const errorLog = `${timeString}\t\t[ERROR]\t\t${action.type}\t\t${error.message}`;
    appendFileSync(this.logFilePath, errorLog + '\n');
  }

  finalize(totalDuration: number): void {
    const footer = [
      '',
      '-'.repeat(80),
      `Total duration: ${this.formatDuration(totalDuration)}`,
      `Completed at: ${new Date().toISOString()}`,
      ''
    ].join('\n');

    appendFileSync(this.logFilePath, footer);
    
    // Generate WebVTT file for markers
    this.generateWebVTT();
    
    // Generate chapters file
    this.generateChapters();
  }
  
  private generateWebVTT(): void {
    let vttContent = 'WEBVTT\n\n';
    
    this.vttMarkers.forEach((marker, index) => {
      const startTime = this.formatVTTTime(marker.startTime);
      const endTime = this.formatVTTTime(marker.endTime);
      
      vttContent += `${index + 1}\n`;
      vttContent += `${startTime} --> ${endTime}\n`;
      vttContent += `${marker.text}\n\n`;
    });
    
    writeFileSync(this.vttFilePath, vttContent);
  }
  
  private generateChapters(): void {
    let chapterContent = ';FFMETADATA1\n';
    
    this.chapters.forEach((chapter, index) => {
      // Use milliseconds for better precision
      const startTimeMs = chapter.time;
      const endTimeMs = index < this.chapters.length - 1 
        ? this.chapters[index + 1]!.time
        : undefined; // Omit END for last chapter
      
      chapterContent += `\n[CHAPTER]\n`;
      chapterContent += `TIMEBASE=1/1000\n`;
      chapterContent += `START=${startTimeMs}\n`;
      if (endTimeMs !== undefined) {
        chapterContent += `END=${endTimeMs}\n`;
      }
      chapterContent += `title=${chapter.title}\n`;
    });
    
    writeFileSync(this.chapterFilePath, chapterContent);
  }
  
  private formatVTTTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    
    return `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s ${ms}ms`;
    }
    
    return `${seconds}s ${ms}ms`;
  }

  private getDefaultDescription(action: Action): string {
    switch (action.type) {
      case 'goto':
        return `Navigate to ${(action as any).url}`;
      case 'click':
        return `Click ${(action as any).selector}`;
      case 'fill':
        return `Fill ${(action as any).selector} with "${(action as any).value}"`;
      case 'type':
        return `Type text in ${(action as any).selector}`;
      case 'press':
        return `Press ${(action as any).key}`;
      case 'hover':
        return `Hover over ${(action as any).selector}`;
      case 'screenshot':
        return `Take screenshot${(action as any).filename ? ` (${(action as any).filename})` : ''}`;
      case 'waitForSelector':
        return `Wait for ${(action as any).selector}`;
      case 'waitForTimeout':
        return `Wait ${(action as any).timeout}ms`;
      case 'selectOption':
        return `Select option in ${(action as any).selector}`;
      case 'check':
        return `Check ${(action as any).selector}`;
      case 'uncheck':
        return `Uncheck ${(action as any).selector}`;
      case 'evaluate':
        return 'Execute JavaScript';
      case 'waitForManualAction':
        return (action as any).message || 'Wait for manual action';
      default:
        return 'Execute action';
    }
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }
  
  getChapterFilePath(): string {
    return this.chapterFilePath;
  }
  
  generateFiles(): void {
    // Generate VTT and chapter files without finalizing the log
    this.generateWebVTT();
    this.generateChapters();
  }
}