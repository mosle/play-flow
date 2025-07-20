import { Page } from 'playwright';
import { SelectOptionAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class SelectOptionHandler implements ActionHandler<SelectOptionAction> {
  async execute(action: SelectOptionAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.selectOption(action.selector, action.value, {});
  }
}