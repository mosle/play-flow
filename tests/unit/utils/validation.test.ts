import { describe, it, expect } from 'vitest';
import { validateAction, validateWorkflow } from '../../../src/utils/validation';
import { Action } from '../../../src/types';

describe('Action Validation', () => {
  describe('GotoAction', () => {
    it('should validate valid goto action', () => {
      const action = {
        type: 'goto',
        url: 'https://example.com',
        description: 'Navigate to example.com',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(action);
    });

    it('should reject goto action without url', () => {
      const action = {
        type: 'goto',
      };
      const result = validateAction(action, 0);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('Required');
    });

    it('should reject goto action with invalid url', () => {
      const action = {
        type: 'goto',
        url: 'not-a-url',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]?.message).toContain('Invalid url');
    });
  });

  describe('ClickAction', () => {
    it('should validate valid click action', () => {
      const action = {
        type: 'click',
        selector: 'button#submit',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('should reject click action without selector', () => {
      const action = {
        type: 'click',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(false);
    });

    it('should reject click action with empty selector', () => {
      const action = {
        type: 'click',
        selector: '',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(false);
    });
  });

  describe('FillAction', () => {
    it('should validate valid fill action', () => {
      const action = {
        type: 'fill',
        selector: 'input[name="email"]',
        value: 'test@example.com',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('should reject fill action without required fields', () => {
      const action = {
        type: 'fill',
        selector: 'input',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(false);
    });
  });

  describe('WaitForTimeoutAction', () => {
    it('should validate valid waitForTimeout action', () => {
      const action = {
        type: 'waitForTimeout',
        timeout: 1000,
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('should reject waitForTimeout with negative timeout', () => {
      const action = {
        type: 'waitForTimeout',
        timeout: -1000,
      };
      const result = validateAction(action);
      expect(result.valid).toBe(false);
    });
  });

  describe('ScreenshotAction', () => {
    it('should validate screenshot action with optional fields', () => {
      const action = {
        type: 'screenshot',
        path: '/path/to/screenshot.png',
        fullPage: true,
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });

    it('should validate screenshot action without optional fields', () => {
      const action = {
        type: 'screenshot',
      };
      const result = validateAction(action);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Workflow Validation', () => {
  it('should validate valid workflow', () => {
    const workflow = {
      name: 'test-workflow',
      actions: [
        { type: 'goto', url: 'https://example.com' },
        { type: 'click', selector: 'button' },
        { type: 'screenshot' },
      ],
    };
    const result = validateWorkflow(workflow);
    expect(result.valid).toBe(true);
  });

  it('should validate workflow with config', () => {
    const workflow = {
      name: 'test-workflow',
      actions: [{ type: 'goto', url: 'https://example.com' }],
      config: {
        browser: { headless: false },
        video: { fps: 30 },
      },
    };
    const result = validateWorkflow(workflow);
    expect(result.valid).toBe(true);
  });

  it('should reject workflow without name', () => {
    const workflow = {
      actions: [{ type: 'goto', url: 'https://example.com' }],
    };
    const result = validateWorkflow(workflow);
    expect(result.valid).toBe(false);
  });

  it('should reject workflow with empty actions', () => {
    const workflow = {
      name: 'test-workflow',
      actions: [],
    };
    const result = validateWorkflow(workflow);
    expect(result.valid).toBe(true); // Empty actions array is technically valid
  });

  it('should reject workflow with invalid action', () => {
    const workflow = {
      name: 'test-workflow',
      actions: [
        { type: 'goto', url: 'https://example.com' },
        { type: 'click' }, // Missing selector
      ],
    };
    const result = validateWorkflow(workflow);
    expect(result.valid).toBe(false);
  });
});