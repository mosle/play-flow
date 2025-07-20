import { Page } from 'playwright';
import { PressAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class PressHandler implements ActionHandler<PressAction> {
  async execute(action: PressAction, page: Page, _context?: ActionContext): Promise<void> {
    await page.keyboard.press(action.key);
  }
}