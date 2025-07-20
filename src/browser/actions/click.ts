import { Page } from 'playwright';
import { ClickAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class ClickHandler implements ActionHandler<ClickAction> {
  async execute(action: ClickAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.click(action.selector, {});
  }
}