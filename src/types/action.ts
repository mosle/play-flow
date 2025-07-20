export type ActionType = 
  | 'goto' 
  | 'click' 
  | 'fill' 
  | 'type' 
  | 'press' 
  | 'hover' 
  | 'screenshot' 
  | 'waitForSelector' 
  | 'waitForTimeout' 
  | 'waitForManualAction'
  | 'selectOption' 
  | 'check' 
  | 'uncheck' 
  | 'evaluate';

export interface BaseAction {
  type: ActionType;
  description?: string;
  skipVtt?: boolean;
  skipChapter?: boolean;
}

export interface GotoAction extends BaseAction {
  type: 'goto';
  url: string;
}

export interface ClickAction extends BaseAction {
  type: 'click';
  selector: string;
}

export interface FillAction extends BaseAction {
  type: 'fill';
  selector: string;
  value: string;
}

export interface TypeAction extends BaseAction {
  type: 'type';
  selector: string;
  text: string;
}

export interface PressAction extends BaseAction {
  type: 'press';
  key: string;
}

export interface HoverAction extends BaseAction {
  type: 'hover';
  selector: string;
}

export interface ScreenshotAction extends BaseAction {
  type: 'screenshot';
  path?: string;
  filename?: string;
  fullPage?: boolean;
}

export interface WaitForSelectorAction extends BaseAction {
  type: 'waitForSelector';
  selector: string;
}

export interface WaitForTimeoutAction extends BaseAction {
  type: 'waitForTimeout';
  timeout: number;
}

export interface SelectOptionAction extends BaseAction {
  type: 'selectOption';
  selector: string;
  value: string | string[];
}

export interface CheckAction extends BaseAction {
  type: 'check';
  selector: string;
}

export interface UncheckAction extends BaseAction {
  type: 'uncheck';
  selector: string;
}

export interface EvaluateAction extends BaseAction {
  type: 'evaluate';
  script: string;
}

export interface WaitForManualActionAction extends BaseAction {
  type: 'waitForManualAction';
  message?: string;
  continueSelector?: string;
  continueText?: string;
  timeout?: number;
}

export type Action = 
  | GotoAction 
  | ClickAction 
  | FillAction 
  | TypeAction 
  | PressAction 
  | HoverAction 
  | ScreenshotAction 
  | WaitForSelectorAction 
  | WaitForTimeoutAction 
  | WaitForManualActionAction
  | SelectOptionAction 
  | CheckAction 
  | UncheckAction 
  | EvaluateAction;