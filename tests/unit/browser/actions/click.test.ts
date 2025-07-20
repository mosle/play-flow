import { describe, it, expect, vi } from 'vitest';
import { ClickHandler } from '../../../../src/browser/actions/click';
import { ClickAction } from '../../../../src/types';

describe('ClickHandler', () => {
  it('should click element', async () => {
    const handler = new ClickHandler();
    const mockPage = {
      click: vi.fn().mockResolvedValue(undefined),
    };

    const action: ClickAction = {
      type: 'click',
      selector: 'button#submit',
    };

    await handler.execute(action, mockPage as any);

    expect(mockPage.click).toHaveBeenCalledWith('button#submit', {
      timeout: 10000,
    });
  });
});