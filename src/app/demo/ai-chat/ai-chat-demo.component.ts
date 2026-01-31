/**
 * AI Chat Panel Demo Page
 * Showcases the AI chat panel with sample interactions
 * Mineral & Time Theme - Angular 20+
 */

import { Component, signal } from '@angular/core';
import { AiChatPanelComponent } from '../../shared/ui/ai-chat';
import { BadgeType } from '../../shared/ui/ai-chat/types/chat.types';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Demo page for AI Chat Panel
 */
@Component({
  selector: 'app-ai-chat-demo',
  standalone: true,
  imports: [AiChatPanelComponent],
  template: `
    <div class="demo-page">
      <!-- Header -->
      <header class="demo-header">
        <h1>AI Chat Panel - Demo</h1>
        <p class="subtitle">矿物与时光 (Mineral & Time) Theme</p>
      </header>

      <!-- Description -->
      <section class="demo-description">
        <h2>Features</h2>
        <ul class="feature-list">
          <li>✨ Draggable and resizable chat card</li>
          <li>💾 Persistent user preferences (localStorage)</li>
          <li>🎨 Glass morphism with OKLCH colors</li>
          <li>📱 Responsive design (mobile-friendly)</li>
          <li>⚡ Auto-expanding textarea</li>
          <li>🎭 Animated status badges</li>
          <li>♿ Accessible (WCAG AA compliant)</li>
        </ul>
      </section>

      <!-- Instructions -->
      <section class="demo-instructions">
        <h2>How to Use</h2>
        <ol class="instruction-list">
          <li>点击右下角的 <strong>绿色圆形按钮</strong> 打开对话框</li>
          <li>输入消息并按 Enter 发送</li>
          <li>拖拽聊天卡片顶部的横线来移动位置</li>
          <li>拖拽右下角来调整大小</li>
        </ol>
      </section>

      <!-- AI Chat Panel -->
      <ai-chat-panel
        (messageSend)="onMessageSend($event)"
        (fileUpload)="onFileUpload()"
        (imageUpload)="onImageUpload()"
        (voiceInput)="onVoiceInput()"
      />

      <!-- Console Output -->
      <section class="demo-console">
        <h2>Console Output</h2>
        <div class="console-output">
          @for (log of logs(); track log.id) {
            <div [class]="'log-entry log-' + log.type">
              <span class="log-timestamp">[{{ log.timestamp }}]</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .demo-page {
        min-height: 100vh;
        padding: 24px;
        padding-bottom: 200px;
        background: var(--background);
        color: var(--foreground);
        font-family: var(--font-sans);
      }

      .demo-header {
        text-align: center;
        margin-bottom: 48px;
      }

      .demo-header h1 {
        font-size: 28px;
        font-weight: 600;
        color: var(--foreground);
        margin-bottom: 8px;
      }

      .subtitle {
        font-size: 14px;
        color: var(--muted-foreground);
        margin: 0;
      }

      section {
        max-width: 900px;
        margin: 0 auto 32px;
      }

      h2 {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 16px;
        color: var(--foreground);
      }

      .feature-list,
      .instruction-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .feature-list li,
      .instruction-list li {
        font-size: 14px;
        line-height: 1.8;
        color: var(--foreground);
        margin-bottom: 8px;
      }

      .instruction-list {
        counter-reset: step;
      }

      .instruction-list li {
        counter-increment: step;
        padding-left: 32px;
        position: relative;
      }

      .instruction-list li::before {
        content: counter(step);
        position: absolute;
        left: 0;
        top: 0;
        width: 24px;
        height: 24px;
        background: var(--primary);
        color: var(--primary-foreground);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 500;
      }

      .console-output {
        background: var(--muted);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 16px;
        max-height: 300px;
        overflow-y: auto;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 12px;
      }

      .log-entry {
        padding: 4px 0;
        border-bottom: 1px solid var(--border);
      }

      .log-entry:last-child {
        border-bottom: none;
      }

      .log-timestamp {
        color: var(--muted-foreground);
        margin-right: 8px;
      }

      .log-message {
        color: var(--foreground);
      }

      .log-info .log-message {
        color: var(--primary);
      }

      .log-success .log-message {
        color: oklch(0.55 0.06 195);
      }

      .log-error .log-message {
        color: var(--destructive);
      }

      .console-output::-webkit-scrollbar {
        width: 8px;
      }

      .console-output::-webkit-scrollbar-track {
        background: var(--muted);
        border-radius: 4px;
      }

      .console-output::-webkit-scrollbar-thumb {
        background: var(--muted-foreground);
        border-radius: 4px;
      }

      .console-output::-webkit-scrollbar-thumb:hover {
        background: var(--foreground);
      }
    `,
  ],
})
export class AiChatDemoComponent {
  /**
   * Dark mode state
   */
  readonly isDark = signal(false);

  /**
   * Console logs
   */
  readonly logs = signal<
    Array<{
      id: string;
      timestamp: string;
      message: string;
      type: 'info' | 'success' | 'error';
    }>
  >([]);

  constructor() {
    // Check system preference
    if (typeof window !== 'undefined') {
      this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    // Add initial log
    this.addLog('Demo initialized. Click the green button in the bottom-right corner!', 'info');
  }

  /**
   * Toggle theme
   */
  toggleTheme(): void {
    const newState = !this.isDark();
    this.isDark.set(newState);

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newState);
    }

    this.addLog(`Theme changed to ${newState ? 'dark' : 'light'} mode`, 'info');
  }

  /**
   * Handle message send
   */
  onMessageSend(message: string): void {
    this.addLog(`Message sent: "${message}"`, 'info');

    // Simulate AI response
    setTimeout(() => {
      this.addLog('AI: Thinking...', 'info');
    }, 500);

    setTimeout(() => {
      this.addLog('AI: Typing response...', 'info');
    }, 1500);

    setTimeout(() => {
      this.addLog(
        'AI: Based on your message, I can help you with that. What would you like to know next?',
        'success'
      );
    }, 3000);
  }

  /**
   * Handle file upload
   */
  onFileUpload(): void {
    this.addLog('File upload dialog opened', 'info');
  }

  /**
   * Handle image upload
   */
  onImageUpload(): void {
    this.addLog('Image upload dialog opened', 'info');
  }

  /**
   * Handle voice input
   */
  onVoiceInput(): void {
    this.addLog('Voice input activated', 'info');
  }

  /**
   * Add log entry
   */
  private addLog(message: string, type: 'info' | 'success' | 'error'): void {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    this.logs.set([
      ...this.logs(),
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp,
        message,
        type,
      },
    ]);
  }
}
