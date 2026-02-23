/**
 * Provider Registry - Following ClawX patterns
 * Reference: ClawX/electron/utils/provider-registry.ts
 */

// Built-in provider types matching ClawX
export const BUILTIN_PROVIDER_TYPES = [
  'anthropic',
  'openai',
  'google',
  'openrouter',
  'moonshot',
  'siliconflow',
  'ollama',
];

// Provider backend metadata
const REGISTRY = {
  anthropic: {
    envVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'anthropic/claude-opus-4-6',
    providerConfig: null, // Uses OpenClaw's built-in Anthropic provider
  },
  openai: {
    envVar: 'OPENAI_API_KEY',
    defaultModel: 'openai/gpt-4o',
    providerConfig: null, // Uses OpenClaw's built-in OpenAI provider
  },
  google: {
    envVar: 'GOOGLE_API_KEY',
    defaultModel: 'google/gemini-2.0-flash-exp',
    providerConfig: null, // Uses OpenClaw's built-in Google provider
  },
  openrouter: {
    envVar: 'OPENROUTER_API_KEY',
    defaultModel: 'openrouter/anthropic/claude-opus-4-6',
    providerConfig: {
      baseUrl: 'https://openrouter.ai/api/v1',
      api: 'openai-completions',
      apiKeyEnv: 'OPENROUTER_API_KEY',
      models: [
        {
          id: 'anthropic/claude-opus-4-6',
          name: 'Claude Opus 4.6',
          contextWindow: 200000,
          maxOutputTokens: 16384,
          supportsImages: true,
          supportsPromptCache: true,
        },
        {
          id: 'anthropic/claude-sonnet-4-6',
          name: 'Claude Sonnet 4.6',
          contextWindow: 200000,
          maxOutputTokens: 16384,
          supportsImages: true,
          supportsPromptCache: true,
        },
      ],
    },
  },
  moonshot: {
    envVar: 'MOONSHOT_API_KEY',
    defaultModel: 'moonshot/kimi-k2.5',
    providerConfig: {
      baseUrl: 'https://api.moonshot.cn/v1',
      api: 'openai-completions',
      apiKeyEnv: 'MOONSHOT_API_KEY',
      models: [
        {
          id: 'kimi-k2.5',
          name: 'Kimi K2.5',
          contextWindow: 128000,
          maxOutputTokens: 16384,
          supportsImages: false,
          supportsPromptCache: false,
        },
      ],
    },
  },
  siliconflow: {
    envVar: 'SILICONFLOW_API_KEY',
    defaultModel: 'siliconflow/Pro/moonshotai/Kimi-K2.5',
    providerConfig: {
      baseUrl: 'https://api.siliconflow.cn/v1',
      api: 'openai-completions',
      apiKeyEnv: 'SILICONFLOW_API_KEY',
      models: [
        {
          id: 'Pro/moonshotai/Kimi-K2.5',
          name: 'Kimi K2.5 (Pro)',
          contextWindow: 128000,
          maxOutputTokens: 16384,
          supportsImages: false,
          supportsPromptCache: false,
        },
        {
          id: 'Pro/Qwen/Qwen2.5-72B-Instruct',
          name: 'Qwen 2.5 72B',
          contextWindow: 32768,
          maxOutputTokens: 8192,
          supportsImages: false,
          supportsPromptCache: false,
        },
      ],
    },
  },
  ollama: {
    envVar: null, // Ollama doesn't require API key
    defaultModel: 'ollama/llama3.2',
    providerConfig: {
      baseUrl: 'http://localhost:11434',
      api: 'openai-completions',
      apiKeyEnv: null,
      models: [
        {
          id: 'llama3.2',
          name: 'Llama 3.2',
          contextWindow: 128000,
          maxOutputTokens: 4096,
          supportsImages: false,
          supportsPromptCache: false,
        },
        {
          id: 'qwen2.5',
          name: 'Qwen 2.5',
          contextWindow: 32768,
          maxOutputTokens: 8192,
          supportsImages: false,
          supportsPromptCache: false,
        },
      ],
    },
  },
};

// Provider UI metadata (frontend)
export const PROVIDER_TYPE_INFO = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🤖',
    placeholder: 'sk-ant-api03-...',
    model: 'Claude',
    requiresApiKey: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '💚',
    placeholder: 'sk-proj-...',
    model: 'GPT',
    requiresApiKey: true,
  },
  {
    id: 'google',
    name: 'Google',
    icon: '🔷',
    placeholder: 'AIza...',
    model: 'Gemini',
    requiresApiKey: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🌐',
    placeholder: 'sk-or-v1-...',
    model: 'Multi-Model',
    requiresApiKey: true,
  },
  {
    id: 'moonshot',
    name: 'Moonshot (CN)',
    icon: '🌙',
    placeholder: 'sk-...',
    model: 'Kimi',
    requiresApiKey: true,
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModelId: 'kimi-k2.5',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow (CN)',
    icon: '🌊',
    placeholder: 'sk-...',
    model: 'Multi-Model',
    requiresApiKey: true,
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    defaultModelId: 'Pro/moonshotai/Kimi-K2.5',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    icon: '🦙',
    placeholder: 'Not required',
    model: 'Local',
    requiresApiKey: false,
    defaultBaseUrl: 'http://localhost:11434',
    showBaseUrl: true,
    showModelId: true,
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '⚙️',
    placeholder: 'API key...',
    model: 'Custom',
    requiresApiKey: true,
    showBaseUrl: true,
    showModelId: true,
  },
];

/**
 * Get environment variable name for provider
 */
export function getProviderEnvVar(providerType) {
  return REGISTRY[providerType]?.envVar || null;
}

/**
 * Get default model for provider
 */
export function getProviderDefaultModel(providerType) {
  return REGISTRY[providerType]?.defaultModel || null;
}

/**
 * Get provider configuration for OpenClaw
 */
export function getProviderConfig(providerType) {
  return REGISTRY[providerType]?.providerConfig || null;
}

/**
 * Get all provider types that require API keys
 */
export function getKeyableProviderTypes() {
  return BUILTIN_PROVIDER_TYPES.filter(type => REGISTRY[type]?.envVar);
}

/**
 * Get provider type info for UI
 */
export function getProviderTypeInfo(providerType) {
  return PROVIDER_TYPE_INFO.find(p => p.id === providerType) || null;
}

/**
 * Get all provider types (including custom)
 */
export function getAllProviderTypes() {
  return [...BUILTIN_PROVIDER_TYPES, 'custom'];
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(providerType, config) {
  const typeInfo = getProviderTypeInfo(providerType);
  if (!typeInfo) {
    return { valid: false, error: 'Invalid provider type' };
  }

  // Check API key requirement
  if (typeInfo.requiresApiKey && !config.apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  // Check base URL for providers that show it
  if (typeInfo.showBaseUrl && !config.baseUrl) {
    return { valid: false, error: 'Base URL is required' };
  }

  // Check model ID for providers that show it
  if (typeInfo.showModelId && !config.model) {
    return { valid: false, error: 'Model ID is required' };
  }

  return { valid: true };
}

/**
 * Build OpenClaw provider configuration
 */
export function buildOpenClawProviderConfig(providerType, userConfig) {
  const registryConfig = getProviderConfig(providerType);
  const typeInfo = getProviderTypeInfo(providerType);

  // For built-in providers without custom config (anthropic, openai, google)
  if (!registryConfig) {
    return {
      type: providerType,
      apiKey: userConfig.apiKey,
      model: userConfig.model || getProviderDefaultModel(providerType),
    };
  }

  // For providers with custom config (moonshot, siliconflow, ollama, openrouter)
  return {
    type: 'custom',
    name: typeInfo.name,
    baseUrl: userConfig.baseUrl || registryConfig.baseUrl,
    api: registryConfig.api,
    apiKey: userConfig.apiKey || null,
    model: userConfig.model || getProviderDefaultModel(providerType),
    models: registryConfig.models,
  };
}

export default {
  BUILTIN_PROVIDER_TYPES,
  PROVIDER_TYPE_INFO,
  getProviderEnvVar,
  getProviderDefaultModel,
  getProviderConfig,
  getKeyableProviderTypes,
  getProviderTypeInfo,
  getAllProviderTypes,
  validateProviderConfig,
  buildOpenClawProviderConfig,
};
