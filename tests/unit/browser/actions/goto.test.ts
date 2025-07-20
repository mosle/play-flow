import { describe, it, expect, vi } from 'vitest';
import { GotoHandler } from '../../../../src/browser/actions/goto';
import { GotoAction } from '../../../../src/types';

describe('GotoHandler', () => {
  it('should navigate to URL', async () => {
    const handler = new GotoHandler();
    const mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
    };

    const action: GotoAction = {
      type: 'goto',
      url: 'https://example.com',
    };

    await handler.execute(action, mockPage as any);

    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  });
});