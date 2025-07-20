import { Page } from 'playwright';
import { FillAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class FillHandler implements ActionHandler<FillAction> {
  async execute(action: FillAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.fill(action.selector, action.value, {});
  }
}