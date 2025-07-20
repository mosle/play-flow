import { Page } from 'playwright';
import { HoverAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class HoverHandler implements ActionHandler<HoverAction> {
  async execute(action: HoverAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.hover(action.selector, {});
  }
}