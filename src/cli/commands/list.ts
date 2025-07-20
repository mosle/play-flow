import { Command } from 'commander';
import chalk from 'chalk';
import { WorkflowManager } from '../../core/workflow-manager';
import { FileSystemManager } from '../../core/file-system-manager';
import { join } from 'path';

export function listCommand(program: Command): void {
  program
    .command('list')
    .description('List all available workflows')
    .option('-d, --details', 'Show workflow details')
    .action(async (options: any) => {
      try {
        const workflowManager = new WorkflowManager();
        const workflows = await workflowManager.listWorkflows();

        if (workflows.length === 0) {
          console.log(chalk.yellow('No workflows found'));
          console.log(chalk.gray('Create a workflow by running: yarn setup'));
          return;
        }

        console.log(chalk.blue(`Found ${workflows.length} workflow(s):\n`));

        for (const workflowName of workflows) {
          console.log(chalk.green(`• ${workflowName}`));

          if (options.details) {
            try {
              // Load and show workflow details
              const workflow = await workflowManager.loadWorkflow(workflowName);
              console.log(chalk.gray(`  Actions: ${workflow.actions.length}`));
              
              // Show first few actions
              const maxActions = 3;
              for (let i = 0; i < Math.min(workflow.actions.length, maxActions); i++) {
                const action = workflow.actions[i];
                if (action) {
                  console.log(chalk.gray(`    ${i + 1}. ${action.type}: ${action.description || ''}`));
                }
              }
              
              if (workflow.actions.length > maxActions) {
                console.log(chalk.gray(`    ... and ${workflow.actions.length - maxActions} more`));
              }

              // Check for custom config
              const configPath = join('workflows', workflowName, 'config.json');
              if (await FileSystemManager.exists(configPath)) {
                console.log(chalk.gray('  Custom config: Yes'));
              }

              console.log();
            } catch (error) {
              console.log(chalk.red(`  Error loading workflow: ${error}`));
            }
          }
        }

        if (!options.details) {
          console.log(chalk.gray('\nUse --details flag to see more information'));
        }

      } catch (error) {
        console.error(chalk.red('Error listing workflows:'), error);
        process.exit(1);
      }
    });
}