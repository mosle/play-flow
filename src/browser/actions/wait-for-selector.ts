import { Page } from 'playwright';
import { WaitForSelectorAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class WaitForSelectorHandler implements ActionHandler<WaitForSelectorAction> {
  async execute(action: WaitForSelectorAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.waitForSelector(action.selector, {
      state: 'visible',
    });
  }
}