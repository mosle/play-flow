import { Command } from 'commander';
import chalk from 'chalk';
import { WorkflowManager } from '../../core/workflow-manager';
import { validateWorkflow } from '../../utils/validation';

export const executeCommand = new Command('execute')
  .description('Execute a workflow without recording')
  .argument('<workflow>', 'Name of the workflow to execute')
  .option('--save-session <name>', 'Save browser session with specified name')
  .option('--session <name>', 'Load browser session with specified name')
  .action(async (workflowName: string, options: { saveSession?: string; session?: string }) => {
    try {
      console.log(chalk.cyan(`Executing workflow: ${workflowName}`));
      
      // Load and validate workflow
      const workflowManager = new WorkflowManager();
      const workflow = await workflowManager.loadWorkflow(workflowName);
      
      const validation = validateWorkflow(workflow);
      if (!validation.valid) {
        console.error(chalk.red('Workflow validation failed:'));
        validation.errors?.forEach(error => {
          console.error(chalk.red(`  - ${error.message}`));
        });
        process.exit(1);
      }
      
      // Execute workflow without recording
      const result = await workflowManager.executeWorkflow(workflow, {
        saveSession: options.saveSession,
        loadSession: options.session,
        record: false
      });
      
      if (result.success) {
        console.log(chalk.green('\nWorkflow executed successfully!'));
        if (options.saveSession) {
          console.log(chalk.gray(`Session saved as: ${options.saveSession}`));
        }
        console.log(chalk.gray(`Duration: ${(result.duration! / 1000).toFixed(3)}s`));
      } else {
        console.error(chalk.red(`\nWorkflow execution failed: ${result.error?.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });