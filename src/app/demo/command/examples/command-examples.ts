import type { CommandItem } from '../types/command-demo.types';

export const basicItems: CommandItem[] = [
  { label: 'Profile', value: 'profile', shortcut: 'P' },
  { label: 'Billing', value: 'billing', shortcut: 'B' },
  { label: 'Settings', value: 'settings', shortcut: 'S' },
  { label: 'Keyboard shortcuts', value: 'keyboard-shortcuts', shortcut: 'K' },
  { label: 'Team', value: 'team', shortcut: 'T' },
];

export const navigationItems: CommandItem[] = [
  { label: 'Go to Dashboard', value: 'dashboard', shortcut: 'G then D' },
  { label: 'Go to Projects', value: 'projects', shortcut: 'G then P' },
  { label: 'Go to Settings', value: 'settings-nav', shortcut: 'G then S' },
  { label: 'Go to Documentation', value: 'docs', shortcut: 'G then D' },
];

export const actionsItems: CommandItem[] = [
  { label: 'New Project', value: 'new-project', shortcut: 'N' },
  { label: 'Search...', value: 'search', shortcut: '/' },
  { label: 'Share', value: 'share', shortcut: 'S' },
  { label: 'Copy to Clipboard', value: 'copy', shortcut: 'C' },
  { label: 'Delete', value: 'delete', destructive: true, shortcut: 'D' },
];

export const settingsItems: CommandItem[] = [
  { label: 'Appearance', value: 'appearance', shortcut: 'A' },
  { label: 'Display', value: 'display', shortcut: 'D' },
  { label: 'Accessibility', value: 'a11y', shortcut: 'A' },
  { label: 'Keyboard', value: 'keyboard-settings', shortcut: 'K' },
  { label: 'Theme', value: 'theme', shortcut: 'T' },
];

export const disabledItems: CommandItem[] = [
  { label: 'Enabled Item', value: 'enabled', shortcut: 'E' },
  { label: 'Disabled Item', value: 'disabled', shortcut: 'D', disabled: true },
  { label: 'Another Enabled', value: 'another-enabled', shortcut: 'A' },
];
