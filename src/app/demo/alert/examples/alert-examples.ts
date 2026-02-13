import type { AlertExample } from '../types/alert-demo.types';


/**
 * Alert variants example configuration
 */
export const alertVariants: AlertExample[] = [
  {
    label: 'Default',
    variant: 'default',
    description:
      'This is a default alert with neutral styling for general information.',
  },
  {
    label: 'Destructive',
    variant: 'destructive',
    description:
      'This alert indicates a destructive action or error state that requires attention.',
  },
  {
    label: 'Warning',
    variant: 'warning',
    description:
      'This alert warns about potential issues or important considerations.',
  },
  {
    label: 'Success',
    variant: 'success',
    description:
      'This alert confirms a successful operation or completion.',
  },
  {
    label: 'Info',
    variant: 'info',
    description: 'This alert provides additional information or guidance.',
  },
];

/**
 * Alert with title examples
 */
export const alertWithTitle: AlertExample[] = [
  {
    label: 'Default with Title',
    variant: 'default',
    title: 'Update Available',
    description:
      'A new version of the application is available for download.',
  },
  {
    label: 'Destructive with Title',
    variant: 'destructive',
    title: 'Critical Error',
    description:
      'An unexpected error occurred. Your work may not have been saved.',
  },
  {
    label: 'Warning with Title',
    variant: 'warning',
    title: 'Storage Limit',
    description:
      'You are approaching your storage limit. Consider upgrading your plan.',
  },
  {
    label: 'Success with Title',
    variant: 'success',
    title: 'Changes Saved',
    description: 'Your changes have been successfully saved to the server.',
  },
  {
    label: 'Info with Title',
    variant: 'info',
    title: 'New Feature',
    description:
      'A new feature has been added to help you work more efficiently.',
  },
];

/**
 * Dismissible alert examples
 */
export const dismissibleAlerts: AlertExample[] = [
  {
    label: 'Dismissible Default',
    variant: 'default',
    title: 'Notification',
    description: 'This alert can be dismissed by clicking the close button.',
    dismissible: true,
  },
  {
    label: 'Dismissible Destructive',
    variant: 'destructive',
    title: 'Action Required',
    description: 'Please review and confirm the requested changes.',
    dismissible: true,
  },
  {
    label: 'Dismissible Warning',
    variant: 'warning',
    title: 'Attention Needed',
    description: 'Some settings need your attention before continuing.',
    dismissible: true,
  },
  {
    label: 'Dismissible Success',
    variant: 'success',
    title: 'Complete',
    description: 'The task has been completed successfully.',
    dismissible: true,
  },
  {
    label: 'Dismissible Info',
    variant: 'info',
    title: 'Tip',
    description: 'You can use keyboard shortcuts to navigate faster.',
    dismissible: true,
  },
];
