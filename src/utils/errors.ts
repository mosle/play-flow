import { Action } from '../types';

export class ValidationError extends Error {
  constructor(
    message: string, 
    public actionIndex?: number, 
    public actionType?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ExecutionError extends Error {
  constructor(
    message: string, 
    public actionIndex: number, 
    public action: Action
  ) {
    super(message);
    this.name = 'ExecutionError';
  }
}

export class ConfigError extends Error {
  constructor(message: string, public configPath?: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class FileSystemError extends Error {
  constructor(message: string, public path?: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}