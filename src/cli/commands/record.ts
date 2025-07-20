import { Command } from 'commander';
import chalk from 'chalk';
import { WorkflowManager } from '../../core/workflow-manager';

export function recordCommand(program: Command): void {
  program
    .command('record <workflow-name>')
    .description('Execute a workflow and record the browser session')
    .option('-c, --config <path>', 'Path to custom recording config', 'recording-config.json')
    .option('--dry-run', 'Validate workflow without executing')
    .option('--session <name>', 'Load browser session with specified name')
    .option('--save-session <name>', 'Save browser session after recording')
    .action(async (workflowName: string, options: any) => {
      try {
        const workflowManager = new WorkflowManager();

        // Load workflow
        console.log(chalk.blue(`Loading workflow: ${workflowName}`));
        const workflow = await workflowManager.loadWorkflow(workflowName);

        // Validate workflow
        console.log(chalk.gray('Validating workflow...'));
        const validation = await workflowManager.validateWorkflow(workflow);
        
        if (!validation.valid) {
          console.error(chalk.red('Workflow validation failed:'));
          validation.errors?.forEach((error) => {
            console.error(chalk.red(`  - ${error.message}`));
            if (error.field) {
              console.error(chalk.red(`    Field: ${error.field}`));
            }
            if (error.actionIndex !== undefined) {
              console.error(chalk.red(`    Action index: ${error.actionIndex}`));
            }
          });
          process.exit(1);
        }

        console.log(chalk.green('Workflow is valid'));

        if (options.dryRun) {
          console.log(chalk.yellow('Dry run mode - workflow not executed'));
          return;
        }

        // Execute workflow
        console.log(chalk.blue('Executing workflow...'));
        const result = await workflowManager.executeWorkflow(workflow, {
          loadSession: options.session,
          saveSession: options.saveSession,
          record: true
        });

        if (result.success) {
          console.log(chalk.green('\nWorkflow executed successfully!'));
          console.log(chalk.gray(`Video saved to: ${result.videoPath}`));
          console.log(chalk.gray(`Duration: ${(result.duration || 0) / 1000}s`));
          if (options.saveSession) {
            console.log(chalk.gray(`Session saved as: ${options.saveSession}`));
          }
        } else {
          console.error(chalk.red('\nWorkflow execution failed:'));
          console.error(chalk.red(result.error?.message || 'Unknown error'));
          if (result.videoPath) {
            console.log(chalk.yellow(`Partial video saved to: ${result.videoPath}`));
          }
          process.exit(1);
        }

      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });
}