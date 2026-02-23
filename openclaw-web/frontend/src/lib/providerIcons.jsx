/**
 * Provider Icon Mapping - Lucide Icons
 * Maps provider types to professional SVG icons
 */
import {
  Bot,           // Anthropic - AI/Bot icon
  Sparkles,      // OpenAI - Magic/AI icon
  Gem,           // Google - Premium/Gemini icon
  Globe,         // OpenRouter - Network/Global icon
  Moon,          // Moonshot - Moon icon (Kimi)
  Waves,         // SiliconFlow - Flow/Waves icon
  Server,        // Ollama - Local server icon
  Settings,      // Custom - Configuration icon
} from 'lucide-react';

export const PROVIDER_ICONS = {
  anthropic: Bot,
  openai: Sparkles,
  google: Gem,
  openrouter: Globe,
  moonshot: Moon,
  siliconflow: Waves,
  ollama: Server,
  custom: Settings,
};

/**
 * ProviderIcon Component
 * Renders the appropriate Lucide icon for a provider type
 */
export function ProviderIcon({ type, className = "w-5 h-5" }) {
  const Icon = PROVIDER_ICONS[type] || Settings;
  return <Icon className={className} />;
}

/**
 * Get icon component for a provider type
 */
export function getProviderIcon(type) {
  return PROVIDER_ICONS[type] || Settings;
}
