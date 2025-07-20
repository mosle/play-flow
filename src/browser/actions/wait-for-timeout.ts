import { Page } from 'playwright';
import { WaitForTimeoutAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class WaitForTimeoutHandler implements ActionHandler<WaitForTimeoutAction> {
  async execute(action: WaitForTimeoutAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.waitForTimeout(action.timeout);
  }
}