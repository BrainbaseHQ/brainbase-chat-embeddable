import React from 'react';
import {
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  HelpCircle,
  Headphones,
  Bot,
  Sparkles,
  Send,
  Mail,
  Phone,
  Users,
  Heart,
  Star,
  Zap,
  Coffee,
  Smile,
  type LucideIcon,
} from 'lucide-react';

// Map of available icon names to Lucide components
export const iconMap: Record<string, LucideIcon> = {
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  'messages-square': MessagesSquare,
  'help-circle': HelpCircle,
  'headphones': Headphones,
  'bot': Bot,
  'sparkles': Sparkles,
  'send': Send,
  'mail': Mail,
  'phone': Phone,
  'users': Users,
  'heart': Heart,
  'star': Star,
  'zap': Zap,
  'coffee': Coffee,
  'smile': Smile,
};

// List of available icon names for documentation/validation
export const availableIcons = Object.keys(iconMap) as IconName[];

// Type for icon names
export type IconName = keyof typeof iconMap;

// Helper to get an icon component by name
export function getIconByName(name: string): React.ReactNode | null {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    console.warn(`[Brainbase Chat] Unknown icon name: "${name}". Available icons: ${availableIcons.join(', ')}`);
    return null;
  }
  return <IconComponent />;
}

// Check if a string is a valid icon name
export function isValidIconName(name: string): name is IconName {
  return name in iconMap;
}
