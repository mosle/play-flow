import { Page } from 'playwright';
import { CheckAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class CheckHandler implements ActionHandler<CheckAction> {
  async execute(action: CheckAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.check(action.selector, {});
  }
}