import { Page } from 'playwright';
import { TypeAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class TypeHandler implements ActionHandler<TypeAction> {
  async execute(action: TypeAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.type(action.selector, action.text, {
      delay: 50, // Simulate human typing
    });
  }
}