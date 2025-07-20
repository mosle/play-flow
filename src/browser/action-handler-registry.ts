import { ActionExecutor } from './action-executor';
import { GotoHandler } from './actions/goto';
import { ClickHandler } from './actions/click';
import { FillHandler } from './actions/fill';
import { TypeHandler } from './actions/type';
import { PressHandler } from './actions/press';
import { HoverHandler } from './actions/hover';
import { ScreenshotHandler } from './actions/screenshot';
import { WaitForSelectorHandler } from './actions/wait-for-selector';
import { WaitForTimeoutHandler } from './actions/wait-for-timeout';
import { WaitForManualActionHandler } from './actions/wait-for-manual-action';
import { SelectOptionHandler } from './actions/select-option';
import { CheckHandler } from './actions/check';
import { UncheckHandler } from './actions/uncheck';
import { EvaluateHandler } from './actions/evaluate';
import { ShowMessageHandler } from './actions/show-message';

export function registerActionHandlers(executor: ActionExecutor): void {
  executor.registerHandler('goto', new GotoHandler());
  executor.registerHandler('click', new ClickHandler());
  executor.registerHandler('fill', new FillHandler());
  executor.registerHandler('type', new TypeHandler());
  executor.registerHandler('press', new PressHandler());
  executor.registerHandler('hover', new HoverHandler());
  executor.registerHandler('screenshot', new ScreenshotHandler());
  executor.registerHandler('waitForSelector', new WaitForSelectorHandler());
  executor.registerHandler('waitForTimeout', new WaitForTimeoutHandler());
  executor.registerHandler('waitForManualAction', new WaitForManualActionHandler());
  executor.registerHandler('selectOption', new SelectOptionHandler());
  executor.registerHandler('check', new CheckHandler());
  executor.registerHandler('uncheck', new UncheckHandler());
  executor.registerHandler('evaluate', new EvaluateHandler());
  executor.registerHandler('showMessage', new ShowMessageHandler());
}