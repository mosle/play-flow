import { Page } from 'playwright';
import { GotoAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class GotoHandler implements ActionHandler<GotoAction> {
  async execute(action: GotoAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.goto(action.url, {
      waitUntil: 'networkidle',
      // Uses navigationTimeout from browser context
    });
  }
}