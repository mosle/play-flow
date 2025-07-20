import { Command } from 'commander';
import chalk from 'chalk';
import { WorkflowManager } from '../../core/workflow-manager';
import { validateAction } from '../../utils/validation';

export function validateCommand(program: Command): void {
  program
    .command('validate <workflow-name>')
    .description('Validate workflow configuration and actions')
    .option('-v, --verbose', 'Show detailed validation results')
    .action(async (workflowName: string, options: any) => {
      try {
        const workflowManager = new WorkflowManager();

        // Load workflow
        console.log(chalk.blue(`Validating workflow: ${workflowName}`));
        let workflow;
        
        try {
          workflow = await workflowManager.loadWorkflow(workflowName);
        } catch (error) {
          console.error(chalk.red('Failed to load workflow:'), error);
          process.exit(1);
        }

        // Validate workflow structure
        const validation = await workflowManager.validateWorkflow(workflow);
        
        if (!validation.valid) {
          console.error(chalk.red('\nWorkflow validation failed:'));
          validation.errors?.forEach((error) => {
            console.error(chalk.red(`✗ ${error.message}`));
            if (error.field) {
              console.error(chalk.red(`  Field: ${error.field}`));
            }
            if (error.actionIndex !== undefined) {
              console.error(chalk.red(`  Action index: ${error.actionIndex}`));
            }
          });
          process.exit(1);
        }

        console.log(chalk.green('✓ Workflow structure is valid'));

        // Validate individual actions if verbose
        if (options.verbose) {
          console.log(chalk.gray('\nValidating individual actions:'));
          
          for (let i = 0; i < workflow.actions.length; i++) {
            const action = workflow.actions[i];
            if (!action) continue;
            
            const actionValidation = validateAction(action, i);
            
            if (actionValidation.valid) {
              console.log(chalk.green(`  ✓ Action ${i + 1}: ${action.type}`));
              if (action.description) {
                console.log(chalk.gray(`    ${action.description}`));
              }
            } else {
              console.log(chalk.red(`  ✗ Action ${i + 1}: ${action.type}`));
              actionValidation.errors?.forEach((error) => {
                console.log(chalk.red(`    ${error.message}`));
              });
            }
          }
        }

        // Summary
        console.log(chalk.blue('\nWorkflow summary:'));
        console.log(chalk.gray(`  Name: ${workflow.name}`));
        console.log(chalk.gray(`  Actions: ${workflow.actions.length}`));
        
        const actionTypes = workflow.actions.reduce((acc, action) => {
          acc[action.type] = (acc[action.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log(chalk.gray('  Action types:'));
        Object.entries(actionTypes).forEach(([type, count]) => {
          console.log(chalk.gray(`    - ${type}: ${count}`));
        });

        console.log(chalk.green('\n✓ Workflow is valid and ready to execute'));

      } catch (error) {
        console.error(chalk.red('Validation error:'), error);
        process.exit(1);
      }
    });
}