import { Page } from 'playwright';
import { ActionHandler } from '../action-executor';
import { WaitForManualActionAction } from '../../types';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { UIInjector } from '../ui-injector';

export class WaitForManualActionHandler implements ActionHandler<WaitForManualActionAction> {
  async execute(action: WaitForManualActionAction, page: Page): Promise<void> {
    const message = action.message || action.description || 'Please complete the manual action';
    const timeout = action.timeout || 300000; // Default 5 minutes
    
    console.log(chalk.yellow('\n🔔 Manual Action Required:'));
    console.log(chalk.yellow(`   ${message}`));
    
    // Show overlay if requested
    if (action.showOverlay) {
      await UIInjector.showOverlay(page, {
        title: action.overlayOptions?.title || 'Manual Action Required',
        message: action.overlayOptions?.instruction || message,
        backdrop: action.overlayOptions?.backdrop !== false,
        progress: action.overlayOptions?.progress,
        position: 'center',
        style: 'info'
      });
    }
    
    if (action.continueSelector) {
      console.log(chalk.gray(`   Waiting for: ${action.continueSelector}`));
      console.log(chalk.gray(`   Timeout: ${timeout / 1000} seconds`));
      
      // Wait for the selector that indicates manual action is complete
      await page.waitForSelector(action.continueSelector, { 
        timeout,
        state: 'visible' 
      });
      
      console.log(chalk.green('✓ Manual action completed'));
      
      // Remove overlay if shown
      if (action.showOverlay) {
        await UIInjector.removeOverlay(page);
      }
    } else if (action.continueText) {
      console.log(chalk.gray(`   Waiting for text: "${action.continueText}"`));
      console.log(chalk.gray(`   Timeout: ${timeout / 1000} seconds`));
      
      // Wait for text to appear on the page
      await page.waitForFunction(
        `(text) => {
          const body = document.querySelector('body');
          return body ? body.innerText.includes(text) : false;
        }`,
        action.continueText,
        { timeout }
      );
      
      console.log(chalk.green('✓ Manual action completed'));
      
      // Remove overlay if shown
      if (action.showOverlay) {
        await UIInjector.removeOverlay(page);
      }
    } else {
      // If no selector or text specified, show instructions and wait for Enter key
      console.log(chalk.cyan('\n   📌 Instructions:'));
      console.log(chalk.cyan('   1. Complete the manual action in the browser'));
      console.log(chalk.cyan('   2. Create a file named ".continue" in the project root to continue'));
      console.log(chalk.cyan('   3. The workflow will automatically continue when the file is detected'));
      console.log(chalk.gray(`\n   Timeout: ${timeout / 1000} seconds`));
      
      // Poll for .continue file
      const startTime = Date.now();
      const continueFilePath = join(process.cwd(), '.continue');
      
      while (Date.now() - startTime < timeout) {
        try {
          readFileSync(continueFilePath);
          // File exists, delete it and continue
          const fs = await import('fs/promises');
          await fs.unlink(continueFilePath);
          console.log(chalk.green('\n✓ Manual action completed (.continue file detected)'));
          
          // Remove overlay if shown
          if (action.showOverlay) {
            await UIInjector.removeOverlay(page);
          }
          
          break;
        } catch {
          // File doesn't exist, wait and try again
          await page.waitForTimeout(1000);
        }
      }
      
      // Check if we timed out
      if (Date.now() - startTime >= timeout) {
        throw new Error(`Manual action timed out after ${timeout / 1000} seconds`);
      }
    }
  }
}