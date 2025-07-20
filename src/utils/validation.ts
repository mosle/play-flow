import { z } from 'zod';

const BaseActionSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  skipVtt: z.boolean().optional(),
  skipChapter: z.boolean().optional(),
});

const GotoActionSchema = BaseActionSchema.extend({
  type: z.literal('goto'),
  url: z.string().url(),
});

const ClickActionSchema = BaseActionSchema.extend({
  type: z.literal('click'),
  selector: z.string().min(1),
});

const FillActionSchema = BaseActionSchema.extend({
  type: z.literal('fill'),
  selector: z.string().min(1),
  value: z.string(),
});

const TypeActionSchema = BaseActionSchema.extend({
  type: z.literal('type'),
  selector: z.string().min(1),
  text: z.string(),
});

const PressActionSchema = BaseActionSchema.extend({
  type: z.literal('press'),
  key: z.string().min(1),
});

const HoverActionSchema = BaseActionSchema.extend({
  type: z.literal('hover'),
  selector: z.string().min(1),
});

const ScreenshotActionSchema = BaseActionSchema.extend({
  type: z.literal('screenshot'),
  path: z.string().optional(),
  filename: z.string().optional(),
  fullPage: z.boolean().optional(),
});

const WaitForSelectorActionSchema = BaseActionSchema.extend({
  type: z.literal('waitForSelector'),
  selector: z.string().min(1),
});

const WaitForTimeoutActionSchema = BaseActionSchema.extend({
  type: z.literal('waitForTimeout'),
  timeout: z.number().positive(),
});

const SelectOptionActionSchema = BaseActionSchema.extend({
  type: z.literal('selectOption'),
  selector: z.string().min(1),
  value: z.union([z.string(), z.array(z.string())]),
});

const CheckActionSchema = BaseActionSchema.extend({
  type: z.literal('check'),
  selector: z.string().min(1),
});

const UncheckActionSchema = BaseActionSchema.extend({
  type: z.literal('uncheck'),
  selector: z.string().min(1),
});

const EvaluateActionSchema = BaseActionSchema.extend({
  type: z.literal('evaluate'),
  script: z.string().min(1),
});

const WaitForManualActionSchema = BaseActionSchema.extend({
  type: z.literal('waitForManualAction'),
  message: z.string().optional(),
  continueSelector: z.string().optional(),
  continueText: z.string().optional(),
  timeout: z.number().positive().optional(),
  showOverlay: z.boolean().optional(),
  overlayOptions: z.object({
    title: z.string().optional(),
    instruction: z.string().optional(),
    backdrop: z.boolean().optional(),
    progress: z.boolean().optional(),
  }).optional(),
});

const ShowMessageActionSchema = BaseActionSchema.extend({
  type: z.literal('showMessage'),
  message: z.string(),
  position: z.enum(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'center']).optional(),
  duration: z.number().nonnegative().optional(),
  style: z.enum(['info', 'warning', 'error', 'success']).optional(),
  closeButton: z.boolean().optional(),
  waitForClose: z.boolean().optional(),
});

export const ActionSchema = z.discriminatedUnion('type', [
  GotoActionSchema,
  ClickActionSchema,
  FillActionSchema,
  TypeActionSchema,
  PressActionSchema,
  HoverActionSchema,
  ScreenshotActionSchema,
  WaitForSelectorActionSchema,
  WaitForTimeoutActionSchema,
  WaitForManualActionSchema,
  SelectOptionActionSchema,
  CheckActionSchema,
  UncheckActionSchema,
  EvaluateActionSchema,
  ShowMessageActionSchema,
]);

export const BrowserConfigSchema = z.object({
  headless: z.boolean(),
  slowMo: z.number().nonnegative(),
  viewport: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  showBrowserUI: z.boolean().optional(),
  defaultTimeout: z.number().positive().optional(),
  navigationTimeout: z.number().positive().optional(),
});

export const VideoConfigSchema = z.object({
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  fps: z.number().positive().max(60),
  skipAllVtt: z.boolean().optional(),
  skipAllChapters: z.boolean().optional(),
});

export const GlobalConfigSchema = z.object({
  browser: BrowserConfigSchema,
  video: VideoConfigSchema,
});

export const WorkflowConfigSchema = z.object({
  browser: BrowserConfigSchema.partial().optional(),
  video: VideoConfigSchema.partial().optional(),
});

export const WorkflowSchema = z.object({
  name: z.string().min(1),
  actions: z.array(ActionSchema),
  config: WorkflowConfigSchema.optional(),
});

export function validateAction(action: unknown, index?: number) {
  try {
    const result = ActionSchema.parse(action);
    return { valid: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((err: z.ZodIssue) => ({
          message: err.message,
          actionIndex: index,
          field: err.path.join('.'),
        })),
      };
    }
    return {
      valid: false,
      errors: [{ message: 'Unknown validation error', actionIndex: index }],
    };
  }
}

export function validateWorkflow(workflow: unknown) {
  try {
    const result = WorkflowSchema.parse(workflow);
    return { valid: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((err: z.ZodIssue) => ({
          message: err.message,
          field: err.path.join('.'),
        })),
      };
    }
    return {
      valid: false,
      errors: [{ message: 'Unknown validation error' }],
    };
  }
}