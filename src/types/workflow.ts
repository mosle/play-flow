import { Action } from './action';
import { WorkflowConfig } from './config';

export interface Workflow {
  name: string;
  actions: Action[];
  config?: WorkflowConfig;
}

export interface ValidationError {
  message: string;
  actionIndex?: number;
  actionType?: string;
  field?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ExecutionResult {
  success: boolean;
  videoPath?: string;
  outputDirectory?: string;
  error?: Error;
  duration?: number;
}

export interface ExecuteOptions {
  saveSession?: string;       // Session name to save
  loadSession?: string;       // Session name to load
  record?: boolean;           // Enable video recording (default: true)
}