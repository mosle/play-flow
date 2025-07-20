import { Page } from 'playwright';
import { UncheckAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class UncheckHandler implements ActionHandler<UncheckAction> {
  async execute(action: UncheckAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.uncheck(action.selector, {});
  }
}