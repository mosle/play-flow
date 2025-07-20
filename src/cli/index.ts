#!/usr/bin/env node

import { Command } from 'commander';
import { setupCommand } from './commands/setup';
import { recordCommand } from './commands/record';
import { executeCommand } from './commands/execute';
import { listCommand } from './commands/list';
import { validateCommand } from './commands/validate';

const program = new Command();

program
  .name('workflow-recorder')
  .description('Web browser automation and video recording CLI tool')
  .version('1.0.0');

// Register commands
setupCommand(program);
recordCommand(program);
program.addCommand(executeCommand);
listCommand(program);
validateCommand(program);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}