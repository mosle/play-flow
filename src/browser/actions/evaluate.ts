import { Page } from 'playwright';
import { EvaluateAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';

export class EvaluateHandler implements ActionHandler<EvaluateAction> {
  async execute(action: EvaluateAction, page: Page, _context?: ActionContext): Promise<void> {
    // Execute the script directly as a string in the browser context
    await page.evaluate(action.script);
  }
}