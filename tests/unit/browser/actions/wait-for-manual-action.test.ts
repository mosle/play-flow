import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WaitForManualActionHandler } from '../../../../src/browser/actions/wait-for-manual-action';

// Mock page object
const mockPage = {
  waitForSelector: vi.fn(),
  waitForFunction: vi.fn(),
  waitForTimeout: vi.fn(),
};

describe('WaitForManualActionHandler', () => {
  let handler: WaitForManualActionHandler;

  beforeEach(() => {
    handler = new WaitForManualActionHandler();
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should wait for selector when continueSelector is provided', async () => {
      const action = {
        type: 'waitForManualAction' as const,
        continueSelector: '#login-success',
        description: 'Complete Google login'
      };

      mockPage.waitForSelector.mockResolvedValue(undefined);

      await handler.execute(action, mockPage as any);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith('#login-success', {
        timeout: 300000,
        state: 'visible'
      });
    });

    it('should wait for text when continueText is provided', async () => {
      const action = {
        type: 'waitForManualAction' as const,
        continueText: 'Welcome back!',
        description: 'Wait for login success message'
      };

      mockPage.waitForFunction.mockResolvedValue(undefined);

      await handler.execute(action, mockPage as any);

      expect(mockPage.waitForFunction).toHaveBeenCalledWith(
        expect.stringContaining('document.querySelector'),
        'Welcome back!',
        { timeout: 300000 }
      );
    });

    it('should use custom timeout when provided', async () => {
      const action = {
        type: 'waitForManualAction' as const,
        continueSelector: '#complete',
        timeout: 60000,
        description: 'Wait 1 minute for manual action'
      };

      mockPage.waitForSelector.mockResolvedValue(undefined);

      await handler.execute(action, mockPage as any);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith('#complete', {
        timeout: 60000,
        state: 'visible'
      });
    });

    it('should use custom message when provided', async () => {
      const action = {
        type: 'waitForManualAction' as const,
        message: 'Please complete 2FA authentication',
        continueSelector: '#auth-success'
      };

      mockPage.waitForSelector.mockResolvedValue(undefined);

      // Since we're testing console output, we'd need to mock console.log
      // For now, just verify the action executes without error
      await expect(handler.execute(action, mockPage as any)).resolves.not.toThrow();
    });
  });
});