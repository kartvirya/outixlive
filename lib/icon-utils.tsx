import React from 'react';
import {
  Zap,
  Fuel,
  Wrench,
  AlertCircle,
  HelpCircle,
  Phone,
  MessageSquare,
  Bell,
  ShieldCheck,
  Truck,
  Droplets,
  Settings,
} from 'lucide-react-native';

export type ActionIconType =
  | 'zap'
  | 'fuel'
  | 'wrench'
  | 'alert'
  | 'help'
  | 'phone'
  | 'message'
  | 'bell'
  | 'shield'
  | 'truck'
  | 'droplets'
  | 'settings';

export type ContactType = 'email' | 'sms' | 'username';

export type PriceType = 'none' | 'fixed' | 'user-input';

const ICON_MAP: Record<ActionIconType, React.ComponentType<{ size?: number; color?: string; style?: any }>> = {
  zap: Zap,
  fuel: Fuel,
  wrench: Wrench,
  alert: AlertCircle,
  help: HelpCircle,
  phone: Phone,
  message: MessageSquare,
  bell: Bell,
  shield: ShieldCheck,
  truck: Truck,
  droplets: Droplets,
  settings: Settings,
};

export const getActionIconComponent = (iconId: ActionIconType) => {
  return ICON_MAP[iconId] || Zap;
};
