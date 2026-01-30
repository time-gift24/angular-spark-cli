import type { InputExample } from './types';

export const examples: InputExample[] = [
  {
    label: 'Default Input',
    type: 'text',
    placeholder: 'Enter text...',
  },
  {
    label: 'Email Input',
    type: 'email',
    placeholder: 'm@example.com',
  },
  {
    label: 'Password Input',
    type: 'password',
    placeholder: '••••••••',
  },
  {
    label: 'Disabled Input',
    type: 'text',
    placeholder: 'Disabled',
    disabled: true,
    description: 'This input is disabled',
  },
  {
    label: 'With Description',
    type: 'text',
    placeholder: 'Enter your username',
    description: 'This will be your public display name.',
  },
];
