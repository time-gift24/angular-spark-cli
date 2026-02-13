import { DemoState } from '../types';
import { SessionStatus } from '@app/shared/models';

export const initialState: DemoState = {
  sessions: new Map([
    [
      'session-1',
      {
        id: 'session-1',
        name: 'Angular 开发讨论',
        messages: [],
        inputValue: '',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 500 },
        lastUpdated: Date.now() - 1000 * 60 * 5,
        status: SessionStatus.IDLE,
        color: 'purple',
        mode: 'docked',
      },
    ],
    [
      'session-2',
      {
        id: 'session-2',
        name: 'TypeScript 类型问题',
        messages: [],
        inputValue: '如何定义泛型类型？',
        position: { x: 150, y: 150 },
        size: { width: 380, height: 480 },
        lastUpdated: Date.now() - 1000 * 60 * 15,
        status: SessionStatus.IDLE,
        color: 'blue',
        mode: 'docked',
      },
    ],
  ]),
  activeSessionId: 'session-1',
  isOpen: true,
  inputValue: '',
};
