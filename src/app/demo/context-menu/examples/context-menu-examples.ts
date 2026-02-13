import { ContextMenuIcon, ContextMenuItem } from '@app/shared/ui/context-menu/index';

/**
 * SVG Icons
 */
const ICONS = {
  back: { type: 'icon', name: 'chevron-left' },
  forward: { type: 'icon', name: 'chevron-right' },
  reload: { type: 'icon', name: 'refresh-cw' },
  copy: { type: 'icon', name: 'copy' },
  paste: { type: 'icon', name: 'clipboard' },
  delete: { type: 'icon', name: 'x' },
  bookmark: { type: 'icon', name: 'bookmark' },
  user: { type: 'icon', name: 'user' },
} as const satisfies Record<string, ContextMenuIcon>;

/**
 * Basic Context Menu Items
 */
export const basicMenuItems: ContextMenuItem[] = [
  {
    label: 'Back',
    icon: ICONS.back,
    shortcut: '⌘[',
    action: () => console.log('Back clicked'),
  },
  {
    label: 'Forward',
    icon: ICONS.forward,
    shortcut: '⌘]',
    disabled: true,
    action: () => console.log('Forward clicked'),
  },
  {
    label: 'Reload',
    icon: ICONS.reload,
    shortcut: '⌘R',
    action: () => console.log('Reload clicked'),
  },
  {
    label: 'Copy',
    icon: ICONS.copy,
    shortcut: '⌘C',
    inset: true,
    action: () => console.log('Copy clicked'),
  },
  {
    label: 'Paste',
    icon: ICONS.paste,
    shortcut: '⌘V',
    inset: true,
    action: () => console.log('Paste clicked'),
  },
];

/**
 * Context Menu with Destructive Action
 */
export const destructiveMenuItems: ContextMenuItem[] = [
  {
    label: 'Copy',
    icon: ICONS.copy,
    shortcut: '⌘C',
    action: () => console.log('Copy clicked'),
  },
  {
    label: 'Paste',
    icon: ICONS.paste,
    shortcut: '⌘V',
    action: () => console.log('Paste clicked'),
  },
  {
    label: 'Delete',
    icon: ICONS.delete,
    destructive: true,
    shortcut: '⌫',
    action: () => console.log('Delete clicked'),
  },
];

/**
 * Context Menu with Icons
 */
export const iconsMenuItems: ContextMenuItem[] = [
  {
    label: 'Add Bookmark',
    icon: ICONS.bookmark,
    action: () => console.log('Add Bookmark clicked'),
  },
  {
    label: 'Copy',
    icon: ICONS.copy,
    action: () => console.log('Copy clicked'),
  },
  {
    label: 'Paste',
    icon: ICONS.paste,
    action: () => console.log('Paste clicked'),
  },
  {
    label: 'Profile',
    icon: ICONS.user,
    action: () => console.log('Profile clicked'),
  },
];

/**
 * Context Menu with Disabled Items
 */
export const disabledMenuItems: ContextMenuItem[] = [
  {
    label: 'Enabled Action',
    action: () => console.log('Enabled clicked'),
  },
  {
    label: 'Disabled Action',
    disabled: true,
    action: () => console.log('This should not fire'),
  },
  {
    label: 'Another Enabled',
    action: () => console.log('Another enabled clicked'),
  },
];
