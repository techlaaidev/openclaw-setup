/**
 * Zod validation schemas for OpenClaw configuration
 */

import { z } from 'zod';

// Provider types
export const providerTypeSchema = z.enum([
  'anthropic',
  'openai',
  'google',
  'openrouter',
  'moonshot',
  'siliconflow',
  'ollama',
  'custom'
]);

// Channel types
export const channelTypeSchema = z.enum([
  'telegram',
  'zalo',
  'whatsapp'
]);

// Provider configuration schema
export const providerConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: providerTypeSchema,
  baseUrl: z.string().url().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Channel configuration schema
export const channelConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: channelTypeSchema,
  enabled: z.boolean().default(true),
  config: z.record(z.any()),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Server configuration schema
export const serverConfigSchema = z.object({
  host: z.string().default('0.0.0.0'),
  port: z.number().int().min(1).max(65535).default(18789),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

// Skill configuration schema
export const skillConfigSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional()
});

// Main OpenClaw configuration schema
export const openclawConfigSchema = z.object({
  server: serverConfigSchema.optional(),
  providers: z.array(providerConfigSchema).optional(),
  channels: z.array(channelConfigSchema).optional(),
  skills: z.array(skillConfigSchema).optional(),
  settings: z.record(z.any()).optional()
});

// Environment variables schema
export const envSchema = z.object({
  // Gateway
  OPENCLAW_GATEWAY_PORT: z.string().regex(/^\d+$/).optional(),

  // Providers
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  MOONSHOT_API_KEY: z.string().optional(),
  SILICONFLOW_API_KEY: z.string().optional(),

  // Channels
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  ZALO_APP_ID: z.string().optional(),
  ZALO_APP_SECRET: z.string().optional(),
  ZALO_OA_ID: z.string().optional(),
  ZALO_WEBHOOK_URL: z.string().url().optional(),
  ZALO_VERIFY_TOKEN: z.string().optional(),

  // Ollama
  OLLAMA_BASE_URL: z.string().url().optional()
}).passthrough(); // Allow additional env vars

// Validation helper functions
export function validateConfig(config) {
  try {
    const validated = openclawConfigSchema.parse(config);
    return { valid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
      };
    }
    return { valid: false, errors: [{ message: error.message }] };
  }
}

export function validateProvider(provider) {
  try {
    const validated = providerConfigSchema.parse(provider);
    return { valid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { valid: false, errors: [{ message: error.message }] };
  }
}

export function validateChannel(channel) {
  try {
    const validated = channelConfigSchema.parse(channel);
    return { valid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { valid: false, errors: [{ message: error.message }] };
  }
}

export function validateEnv(env) {
  try {
    const validated = envSchema.parse(env);
    return { valid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { valid: false, errors: [{ message: error.message }] };
  }
}
