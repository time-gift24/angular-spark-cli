import { Observable } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LlmMessage, StreamChunk, LlmProviderConfig } from '../models';

/**
 * Abstract base class for LLM provider adapters.
 *
 * This class defines the contract that all LLM provider adapters must implement.
 * It provides shared utilities for building HTTP requests and headers.
 */
@Injectable()
export abstract class LlmProviderAdapter {
  protected http = inject(HttpClient);
  protected readonly config: LlmProviderConfig;

  /**
   * Creates a new adapter instance
   * @param config Provider configuration
   */
  constructor(config: LlmProviderConfig) {
    this.config = config;
  }

  /**
   * Initiates a streaming chat completion request
   * @param messages Array of conversation messages
   * @returns Observable emitting stream chunks
   * @abstract
   */
  abstract streamChat(messages: LlmMessage[]): Observable<StreamChunk>;

  /**
   * Builds the request payload for the chat completion API
   * @param messages Conversation messages
   * @returns HTTP request body
   * @protected
   */
  protected buildRequestPayload(messages: LlmMessage[]): object {
    return {
      model: this.config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      ...(this.config.temperature !== undefined && { temperature: this.config.temperature })
    };
  }

  /**
   * Builds HTTP headers for API requests
   * @returns Headers object with Content-Type and optional Authorization
   * @protected
   */
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}
