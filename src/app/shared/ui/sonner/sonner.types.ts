/**
 * Sonner component type definitions
 */

export type SonnerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center';

export type SonnerVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

export interface SonnerOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: SonnerVariant;
  position?: SonnerPosition;
  duration?: number;
  action?: SonnerAction;
  dismissible?: boolean;
}

export interface SonnerAction {
  label: string;
  onClick: () => void;
}

export interface SonnerData {
  id: string;
  title: string;
  description: string;
  variant: SonnerVariant;
  position: SonnerPosition;
  duration: number;
  action?: SonnerAction;
  dismissible: boolean;
  timestamp: number;
}

export interface SonnerProps {
  position?: SonnerPosition;
  expand?: boolean;
  duration?: number;
  richColors?: boolean;
  closeButton?: boolean;
  toastClasses?: string;
}
