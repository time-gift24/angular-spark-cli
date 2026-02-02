/**
 * Demo Streaming Markdown Component
 *
 * This component provides a demo page for the streaming markdown feature.
 * It integrates MockAIApi service and provides UI controls to start, stop, and reset streaming.
 *
 * Phase 8 Implementation:
 * - Task 8.2: Define DemoStreamingMarkdownComponent interface with streaming controls
 * - Task 8.3: Define StreamControl interface for lifecycle management
 */

import { Component, Injectable, OnDestroy, Inject, signal } from '@angular/core';
import { Observable, Subject, EMPTY, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StreamingMarkdownComponent } from '@app/shared/components/streaming-markdown/streaming-markdown.component';
import { IMockAIApi, MockAIApi, StreamPattern } from './mock-ai.service';

/**
 * Interface for stream lifecycle control.
 * Defines the contract for managing streaming operations.
 *
 * Implementations handle:
 * - Starting new streams
 * - Stopping active streams
 * - Resetting stream state
 * - Querying active state
 *
 * @example
 * ```typescript
 * const control: StreamControl = {
 *   start: () => console.log('Started'),
 *   stop: () => console.log('Stopped'),
 *   reset: () => console.log('Reset'),
 *   isActive: () => true
 * };
 * ```
 */
export interface StreamControl {
  /**
   * Starts the markdown streaming process.
   * Should initialize a new stream and begin emitting chunks.
   */
  start(): void;

  /**
   * Stops the currently active stream.
   * Should complete the stream and clean up resources.
   */
  stop(): void;

  /**
   * Resets the streaming state.
   * Should clear all accumulated content and prepare for new stream.
   */
  reset(): void;

  /**
   * Checks if a stream is currently active.
   *
   * @returns true if streaming, false otherwise
   */
  isActive(): boolean;
}

/**
 * Default implementation of StreamControl.
 * Manages active stream state and subscriptions.
 */
@Injectable({ providedIn: 'root' })
export class DefaultStreamControl implements StreamControl, OnDestroy {
  /** Subject for stopping active streams */
  private stopSubject$ = new Subject<void>();

  /** Flag indicating if stream is active */
  private active = false;

  /** Subscription to the current stream */
  private streamSubscription: Subscription | null = null;

  /**
   * Starts streaming by clearing any previous stop signal.
   */
  start(): void {
    this.stopSubject$ = new Subject<void>();
    this.active = true;
  }

  /**
   * Stops streaming by emitting stop signal.
   */
  stop(): void {
    this.stopSubject$.next();
    this.active = false;
    this.streamSubscription?.unsubscribe();
    this.streamSubscription = null;
  }

  /**
   * Resets streaming state completely.
   */
  reset(): void {
    this.stop();
    this.stopSubject$ = new Subject<void>();
  }

  /**
   * Checks if stream is currently active.
   *
   * @returns true if active, false otherwise
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Gets the stop subject for stream cancellation.
   *
   * @returns Subject that emits when stream should stop
   */
  getStopSignal(): Subject<void> {
    return this.stopSubject$;
  }

  /**
   * Sets the current stream subscription for cleanup.
   *
   * @param subscription - Subscription to track
   */
  setStreamSubscription(subscription: Subscription): void {
    this.streamSubscription = subscription;
  }

  /**
   * Cleanup on destroy.
   */
  ngOnDestroy(): void {
    this.stop();
  }
}

/**
 * Demo component for streaming markdown.
 *
 * This component serves as a demo page for the streaming
 * markdown feature. It provides UI controls and integrates all components:
 * - MockAIApi service for simulated streaming
 * - StreamingMarkdownComponent for rendering
 * - StreamControl for lifecycle management
 *
 * @example
 * ```html
 * <app-demo-streaming-markdown>
 *   <!-- Displays streaming markdown with controls -->
 * </app-demo-streaming-markdown>
 * ```
 */
@Component({
  selector: 'app-demo-streaming-markdown',
  standalone: true,
  imports: [StreamingMarkdownComponent, CommonModule],
  providers: [
    // Provide concrete implementations for interfaces
    { provide: 'IMockAIApi', useClass: MockAIApi },
    { provide: 'StreamControl', useClass: DefaultStreamControl }
  ],
  templateUrl: './demo-streaming-markdown.component.html',
  styleUrl: './demo-streaming-markdown.component.css',
  host: {
    'style': 'display: block; width: 100%;'
  }
})
export class DemoStreamingMarkdownComponent {
  /**
   * Observable stream of markdown text chunks.
   * Bound to StreamingMarkdownComponent input.
   */
  aiStream$ = new Observable<string>();

  /**
   * Flag indicating if streaming is currently active.
   * Used for UI state (e.g., disabling start button when active).
   */
  isStreaming = false;

  /**
   * Accumulated raw markdown content.
   * Updated by StreamingMarkdownComponent via rawContentChange event.
   */
  rawMarkdown = '';

  /**
   * Signal tracking the copy to clipboard state.
   * Used for UI feedback (icon change after copy).
   */
  protected copied = signal<boolean>(false);

  /**
   * Constructor with dependency injection.
   *
   * Uses injection tokens to resolve interface-based dependencies.
   *
   * @param mockApi - Mock AI API service for streaming markdown
   * @param streamControl - Stream lifecycle controller
   */
  constructor(
    @Inject('IMockAIApi') private mockApi: IMockAIApi,
    @Inject('StreamControl') private streamControl: StreamControl
  ) {}

  /**
   * Starts the markdown streaming process.
   *
   * Initializes a new stream from the mock API and updates the aiStream$ input.
   * Deactivates the start button and prepares stop/reset functionality.
   *
   * @example
   * ```html
   * <button (click)="startStreaming()">Start Streaming</button>
   * ```
   */
  startStreaming(): void {
    // Don't start if already streaming
    if (this.streamControl.isActive()) {
      console.log('[DemoStreamingMarkdownComponent] Streaming already active');
      return;
    }

    console.log('[DemoStreamingMarkdownComponent] Starting markdown stream...');
    this.streamControl.start();
    this.isStreaming = true;

    // Get new stream from mock API
    this.aiStream$ = this.mockApi.streamMarkdown();

    console.log('[DemoStreamingMarkdownComponent] Stream initialized and bound to component');
  }

  /**
   * Stops the currently active stream.
   *
   * Signals the stream control to stop streaming and cleans up resources.
   * Re-enables the start button for new streams.
   *
   * @example
   * ```html
   * <button (click)="stopStreaming()">Stop</button>
   * ```
   */
  stopStreaming(): void {
    if (!this.streamControl.isActive()) {
      console.log('[DemoStreamingMarkdownComponent] No active stream to stop');
      return;
    }

    console.log('[DemoStreamingMarkdownComponent] Stopping markdown stream...');
    this.streamControl.stop();
    this.isStreaming = false;

    // Replace with empty observable to stop emitting
    this.aiStream$ = EMPTY;

    console.log('[DemoStreamingMarkdownComponent] Stream stopped');
  }

  /**
   * Resets the streaming state completely.
   *
   * Stops any active stream and clears all state.
   * Restores the component to its initial state.
   *
   * @example
   * ```html
   * <button (click)="reset()">Reset</button>
   * ```
   */
  reset(): void {
    console.log('[DemoStreamingMarkdownComponent] Resetting streaming state...');
    this.streamControl.reset();
    this.isStreaming = false;
    this.aiStream$ = EMPTY;
    this.rawMarkdown = '';

    console.log('[DemoStreamingMarkdownComponent] State reset complete');
  }

  /**
   * Starts streaming with a custom pattern.
   *
   * Allows testing different streaming scenarios:
   * - Simple single-chunk streaming
   * - Multi-chunk streaming with delays
   * - Edge cases (empty chunks, very long chunks, etc.)
   *
   * @param pattern - StreamPattern configuration
   *
   * @example
   * ```typescript
   * const pattern: StreamPattern = {
   *   type: 'chunks',
   *   chunks: ['# Test', '\n', 'Content'],
   *   delay: 100
   * };
   * this.startStreamingWithPattern(pattern);
   * ```
   */
  startStreamingWithPattern(pattern: StreamPattern): void {
    if (this.streamControl.isActive()) {
      console.warn('[DemoStreamingMarkdownComponent] Cannot start new stream: already active');
      return;
    }

    console.log('[DemoStreamingMarkdownComponent] Starting stream with custom pattern:', pattern);
    this.streamControl.start();
    this.isStreaming = true;

    this.aiStream$ = this.mockApi.streamMarkdownWithPattern(pattern);

    console.log('[DemoStreamingMarkdownComponent] Custom pattern stream initialized');
  }

  /**
   * Handles raw content updates from StreamingMarkdownComponent.
   * Called when new markdown chunks are received.
   *
   * @param content - Accumulated raw markdown content
   */
  onRawContentChange(content: string): void {
    this.rawMarkdown = content;
  }

  /**
   * Copies the raw markdown content to clipboard.
   * Provides visual feedback by changing the copy button icon.
   *
   * Uses modern Clipboard API with fallback to legacy method.
   */
  async copyToClipboard(): Promise<void> {
    const content = this.rawMarkdown;

    // Guard against empty content
    if (!content) {
      console.warn('[DemoStreamingMarkdownComponent] No content to copy');
      return;
    }

    try {
      // Prefer modern Clipboard API (requires secure context)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        console.log('[DemoStreamingMarkdownComponent] Copied to clipboard via Clipboard API');
      } else {
        // Fallback to legacy execCommand method
        this.fallbackCopy(content);
        console.log('[DemoStreamingMarkdownComponent] Copied to clipboard via fallback method');
      }

      // Update UI state to show success
      this.copied.set(true);

      // Reset UI state after 1.5 seconds
      setTimeout(() => {
        this.copied.set(false);
      }, 1500);

    } catch (error) {
      console.error('[DemoStreamingMarkdownComponent] Copy to clipboard failed:', error);
    }
  }

  /**
   * Fallback method for copying to clipboard in older browsers.
   * Creates a temporary textarea element to copy text.
   *
   * @param content - Text content to copy
   */
  private fallbackCopy(content: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = content;

    // Position off-screen to avoid visual flicker
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    // Execute copy command
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!successful) {
      throw new Error('execCommand("copy") failed');
    }
  }
}
