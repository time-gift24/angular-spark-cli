import { InjectionToken } from '@angular/core';
import { LlmProviderConfig } from '../models';

export const LLM_CONFIG = new InjectionToken<LlmProviderConfig>('LLM_CONFIG', {
  providedIn: 'root',
  factory: () => {
    throw new Error('LLM_CONFIG must be provided at app level');
  }
});
