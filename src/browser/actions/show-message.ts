import { Page } from 'playwright';
import { ShowMessageAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';
import { UIInjector } from '../ui-injector';

export class ShowMessageHandler implements ActionHandler<ShowMessageAction> {
  async execute(action: ShowMessageAction, page: Page, _context?: ActionContext): Promise<void> {
    await UIInjector.showMessage(page, {
      message: action.message,
      position: action.position,
      duration: action.duration !== undefined ? action.duration : 5000,
      style: action.style || 'info',
      closeButton: action.closeButton !== false
    });

    // If waitForClose is true and duration is 0, wait for user to close
    if (action.waitForClose && action.duration === 0) {
      await page.waitForFunction(
        () => !document.querySelector('.playflow-overlay'),
        { timeout: 300000 } // 5 minutes max
      );
    }
  }
}