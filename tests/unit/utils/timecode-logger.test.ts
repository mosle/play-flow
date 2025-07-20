import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import { TimecodeLogger } from '../../../src/utils/timecode-logger';
import { Action } from '../../../src/types';

vi.mock('fs');

describe('TimecodeLogger', () => {
  let logger: TimecodeLogger;
  const mockWrite = vi.fn();
  const mockAppend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.writeFileSync).mockImplementation(mockWrite);
    vi.mocked(fs.appendFileSync).mockImplementation(mockAppend);
    
    logger = new TimecodeLogger('output', 'test-workflow', '2025-01-18_12-00-00');
  });

  describe('initialization', () => {
    it('should create log file with header', () => {
      expect(mockWrite).toHaveBeenCalledTimes(1);
      
      const [filePath, content] = mockWrite.mock.calls[0];
      expect(filePath).toBe('output/test-workflow_2025-01-18_12-00-00_timecode.txt');
      expect(content).toContain('Workflow: test-workflow');
      expect(content).toContain('TIME\t\tDURATION\tACTION\t\t\tDESCRIPTION');
    });
  });

  describe('logAction', () => {
    it('should log action with custom description', () => {
      const action: Action = {
        type: 'click',
        description: 'Click submit button'
      };

      logger.logAction(action, 0);

      expect(mockAppend).toHaveBeenCalled();
      const logContent = mockAppend.mock.calls[0][1];
      expect(logContent).toContain('click');
      expect(logContent).toContain('Click submit button');
    });

    it('should generate default description when not provided', () => {
      const action: any = {
        type: 'goto',
        url: 'https://example.com'
      };

      logger.logAction(action, 0);

      expect(mockAppend).toHaveBeenCalled();
      const logContent = mockAppend.mock.calls[0][1];
      expect(logContent).toContain('Navigate to https://example.com');
    });

    it('should format time correctly', () => {
      // Create a new logger and immediately mock Date.now
      vi.clearAllMocks();
      const startTime = 1705579200000;
      vi.spyOn(Date, 'now').mockReturnValueOnce(startTime); // For constructor
      
      const testLogger = new TimecodeLogger('output', 'test-workflow', '2025-01-18_12-00-00');
      
      // Now mock for the action logging (1m 5s 300ms later)
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 65300);

      const action: Action = {
        type: 'click',
        description: 'Test click'
      };

      testLogger.logAction(action, 0);

      // Skip the header write call and check the append call
      const appendCalls = vi.mocked(fs.appendFileSync).mock.calls;
      const logContent = appendCalls[appendCalls.length - 1][1];
      expect(logContent).toContain('01:05.300'); // 1 minute 5 seconds 300ms

      vi.restoreAllMocks();
    });
  });

  describe('logActionComplete', () => {
    it('should log action completion with duration', () => {
      const action: Action = {
        type: 'waitForTimeout'
      };

      logger.logActionComplete(action, 2, 1500);

      expect(mockAppend).toHaveBeenCalled();
      const logContent = mockAppend.mock.calls[0][1];
      expect(logContent).toContain('+1500ms');
      expect(logContent).toContain('[Completed #3]');
    });
  });

  describe('logError', () => {
    it('should log error with action details', () => {
      const action: Action = {
        type: 'click'
      };
      const error = new Error('Element not found');

      logger.logError(action, 1, error);

      expect(mockAppend).toHaveBeenCalled();
      const logContent = mockAppend.mock.calls[0][1];
      expect(logContent).toContain('[ERROR]');
      expect(logContent).toContain('click');
      expect(logContent).toContain('Element not found');
    });
  });

  describe('finalize', () => {
    it('should add footer with total duration', () => {
      logger.finalize(125750); // 2m 5s 750ms

      expect(mockAppend).toHaveBeenCalled();
      const logContent = mockAppend.mock.calls[0][1];
      expect(logContent).toContain('Total duration: 2m 5s 750ms');
      expect(logContent).toContain('Completed at:');
    });

    it('should format short durations correctly', () => {
      logger.finalize(5250); // 5s 250ms

      const logContent = mockAppend.mock.calls[0][1];
      expect(logContent).toContain('Total duration: 5s 250ms');
    });
  });

  describe('getLogFilePath', () => {
    it('should return the correct log file path', () => {
      const path = logger.getLogFilePath();
      expect(path).toBe('output/test-workflow_2025-01-18_12-00-00_timecode.txt');
    });
  });

  describe('default descriptions', () => {
    it('should generate appropriate default descriptions for all action types', () => {
      const testCases = [
        { action: { type: 'fill', selector: '#email', value: 'test@example.com' }, expected: 'Fill #email with "test@example.com"' },
        { action: { type: 'type', selector: '#comment' }, expected: 'Type text in #comment' },
        { action: { type: 'press', key: 'Enter' }, expected: 'Press Enter' },
        { action: { type: 'hover', selector: '.tooltip' }, expected: 'Hover over .tooltip' },
        { action: { type: 'screenshot', filename: 'home' }, expected: 'Take screenshot (home)' },
        { action: { type: 'screenshot' }, expected: 'Take screenshot' },
        { action: { type: 'waitForSelector', selector: '#loading' }, expected: 'Wait for #loading' },
        { action: { type: 'waitForTimeout', timeout: 2000 }, expected: 'Wait 2000ms' },
        { action: { type: 'selectOption', selector: '#country' }, expected: 'Select option in #country' },
        { action: { type: 'check', selector: '#agree' }, expected: 'Check #agree' },
        { action: { type: 'uncheck', selector: '#newsletter' }, expected: 'Uncheck #newsletter' },
        { action: { type: 'evaluate' }, expected: 'Execute JavaScript' },
      ];

      testCases.forEach(({ action, expected }) => {
        logger.logAction(action as any, 0);
        const logContent = mockAppend.mock.calls[mockAppend.mock.calls.length - 1][1];
        expect(logContent).toContain(expected);
      });
    });
  });
});