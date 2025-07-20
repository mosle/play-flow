import { Page } from 'playwright';
import { Action } from '../types';
import { ExecutionError } from '../utils/errors';

export interface ActionContext {
  workflowOutputDir?: string;
}

export interface ActionHandler<T extends Action = Action> {
  execute(action: T, page: Page, context?: ActionContext): Promise<void>;
}

export class ActionExecutor {
  private handlers: Map<string, ActionHandler> = new Map();
  private context: ActionContext = {};

  constructor() {
    // Handlers will be registered externally
  }

  setContext(context: ActionContext): void {
    this.context = context;
  }

  registerHandler(actionType: string, handler: ActionHandler): void {
    this.handlers.set(actionType, handler);
  }

  async executeAction(action: Action, page: Page, index: number): Promise<void> {
    const handler = this.handlers.get(action.type);
    
    if (!handler) {
      throw new ExecutionError(
        `No handler registered for action type: ${action.type}`,
        index,
        action
      );
    }

    try {
      await handler.execute(action, page, this.context);
    } catch (error) {
      throw new ExecutionError(
        `Failed to execute ${action.type} action: ${error}`,
        index,
        action
      );
    }
  }

}