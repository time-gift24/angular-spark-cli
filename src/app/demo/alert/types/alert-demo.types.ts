import type { AlertVariant } from '@app/shared/ui/alert';

/**
 * Alert display configuration for demo
 */
export interface AlertExample {
  label: string;
  variant: AlertVariant;
  title?: string;
  description?: string;
  dismissible?: boolean;
}

export type { AlertVariant };
