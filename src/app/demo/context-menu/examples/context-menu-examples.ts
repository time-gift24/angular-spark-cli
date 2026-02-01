import { ContextMenuItem } from '@app/shared/ui/context-menu/index';

/**
 * SVG Icons
 */
const ICONS = {
  back: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  forward: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
  reload: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`,
  copy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  paste: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`,
  delete: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/></svg>`,
  bookmark: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
};

/**
 * Basic Context Menu Items
 */
export const basicMenuItems: ContextMenuItem[] = [
  {
    label: 'Back',
    icon: ICONS.back,
    shortcut: '⌘[',
    action: () => console.log('Back clicked')
  },
  {
    label: 'Forward',
    icon: ICONS.forward,
    shortcut: '⌘]',
    disabled: true,
    action: () => console.log('Forward clicked')
  },
  {
    label: 'Reload',
    icon: ICONS.reload,
    shortcut: '⌘R',
    action: () => console.log('Reload clicked')
  },
  {
    label: 'Copy',
    icon: ICONS.copy,
    shortcut: '⌘C',
    inset: true,
    action: () => console.log('Copy clicked')
  },
  {
    label: 'Paste',
    icon: ICONS.paste,
    shortcut: '⌘V',
    inset: true,
    action: () => console.log('Paste clicked')
  }
];

/**
 * Context Menu with Destructive Action
 */
export const destructiveMenuItems: ContextMenuItem[] = [
  {
    label: 'Copy',
    icon: ICONS.copy,
    shortcut: '⌘C',
    action: () => console.log('Copy clicked')
  },
  {
    label: 'Paste',
    icon: ICONS.paste,
    shortcut: '⌘V',
    action: () => console.log('Paste clicked')
  },
  {
    label: 'Delete',
    icon: ICONS.delete,
    destructive: true,
    shortcut: '⌫',
    action: () => console.log('Delete clicked')
  }
];

/**
 * Context Menu with Icons
 */
export const iconsMenuItems: ContextMenuItem[] = [
  {
    label: 'Add Bookmark',
    icon: ICONS.bookmark,
    action: () => console.log('Add Bookmark clicked')
  },
  {
    label: 'Copy',
    icon: ICONS.copy,
    action: () => console.log('Copy clicked')
  },
  {
    label: 'Paste',
    icon: ICONS.paste,
    action: () => console.log('Paste clicked')
  },
  {
    label: 'Profile',
    icon: ICONS.user,
    action: () => console.log('Profile clicked')
  }
];

/**
 * Context Menu with Disabled Items
 */
export const disabledMenuItems: ContextMenuItem[] = [
  {
    label: 'Enabled Action',
    action: () => console.log('Enabled clicked')
  },
  {
    label: 'Disabled Action',
    disabled: true,
    action: () => console.log('This should not fire')
  },
  {
    label: 'Another Enabled',
    action: () => console.log('Another enabled clicked')
  }
];
