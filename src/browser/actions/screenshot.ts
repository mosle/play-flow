import { Page } from 'playwright';
import { ScreenshotAction } from '../../types';
import { ActionHandler, ActionContext } from '../action-executor';
import { FileSystemManager } from '../../core/file-system-manager';

export class ScreenshotHandler implements ActionHandler<ScreenshotAction> {
  async execute(action: ScreenshotAction, page: Page, context?: ActionContext): Promise<void> {
    let path: string;
    
    if (action.path) {
      // If absolute path is provided, use it
      if (action.path.startsWith('/') || action.path.match(/^[A-Z]:\\/)) {
        path = action.path;
      } else {
        // If relative path, extract just the filename
        const pathParts = action.path.split(/[\/\\]/);
        const lastPart = pathParts[pathParts.length - 1];
        const filename = lastPart ? lastPart.replace(/\.(png|jpg|jpeg)$/i, '') : 'screenshot';
        path = context?.workflowOutputDir 
          ? FileSystemManager.getOutputPath('', 'screenshot', filename, context.workflowOutputDir)
          : FileSystemManager.getOutputPath('screenshot', 'screenshot', filename);
      }
    } else if (action.filename) {
      // Use filename if provided
      path = context?.workflowOutputDir 
        ? FileSystemManager.getOutputPath('', 'screenshot', action.filename, context.workflowOutputDir)
        : FileSystemManager.getOutputPath('screenshot', 'screenshot', action.filename);
    } else {
      // Generate default filename
      const filename = `screenshot_${Date.now()}`;
      path = context?.workflowOutputDir 
        ? FileSystemManager.getOutputPath('', 'screenshot', filename, context.workflowOutputDir)
        : FileSystemManager.getOutputPath('screenshot', 'screenshot', filename);
    }

    await page.screenshot({
      path,
      fullPage: action.fullPage ?? false,
    });
  }
}