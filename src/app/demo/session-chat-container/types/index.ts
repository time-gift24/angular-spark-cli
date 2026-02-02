import type { SessionData } from '@app/shared/models';

export interface DemoState {
  sessions: Map<string, SessionData>;
  activeSessionId: string;
  isOpen: boolean;
  inputValue: string;
}

