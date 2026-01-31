import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiChatPanelComponent } from '@app/shared/ui/ai-chat-panel';
import { ChatMessage } from '@app/shared/models';

/**
 * Demo AI Chat Panel Component
 *
 * Demonstrates the usage of the AI Chat Panel component with simulated AI responses.
 * This demo page showcases all key features:
 * - Multi-session management
 * - Message sending and receiving
 * - Panel positioning and resizing
 * - Session switching
 * - Panel visibility toggle
 * - localStorage persistence
 *
 * @Phase 9 - Task 9.1: Demo Page Component
 */
@Component({
  selector: 'app-demo-ai-chat-panel',
  standalone: true,
  imports: [CommonModule, AiChatPanelComponent],
  templateUrl: './demo-ai-chat-panel.component.html',
  styleUrls: ['./demo-ai-chat-panel.component.css'],
  host: {
    'style': 'display: block; width: 100%; height: 100vh;'
  }
})
export class DemoAiChatPanelComponent {
  /**
   * API endpoint signal for the chat panel.
   * In a real application, this would point to your chat API.
   */
  readonly apiEndpoint = signal('/api/chat');

  /**
   * Local message history for tracking messages in this demo.
   * In production, you might not need this as messages are stored
   * in the session state.
   */
  readonly messageHistory = signal<ChatMessage[]>([]);

  /**
   * Event count tracker for demo statistics.
   */
  private readonly eventCounts = signal({
    messageSend: 0,
    sessionChange: 0,
    panelToggle: 0
  });

  /**
   * Handles message send events from the chat panel.
   *
   * This method:
   * 1. Adds the message to local history
   * 2. Simulates an AI response
   * 3. Updates event counters
   *
   * @param message The message that was sent
   */
  handleMessageSend(message: ChatMessage): void {
    console.log('[Demo] Message sent:', message);

    // Add to local history
    this.messageHistory.update(messages => [...messages, message]);

    // Update event count
    this.eventCounts.update(counts => ({
      ...counts,
      messageSend: counts.messageSend + 1
    }));

    // Simulate AI response
    this.simulateAIResponse(message);
  }

  /**
   * Handles session change events from the chat panel.
   *
   * This is called when the user switches between different sessions.
   *
   * @param sessionId The ID of the new active session
   */
  handleSessionChange(sessionId: string): void {
    console.log('[Demo] Session changed to:', sessionId);

    // Update event count
    this.eventCounts.update(counts => ({
      ...counts,
      sessionChange: counts.sessionChange + 1
    }));
  }

  /**
   * Handles panel toggle events from the chat panel.
   *
   * This is called when the user toggles the messages panel visibility
   * by clicking on the active session tab.
   *
   * @param isVisible The new visibility state
   */
  handlePanelToggle(isVisible: boolean): void {
    console.log('[Demo] Panel toggled:', isVisible ? 'visible' : 'hidden');

    // Update event count
    this.eventCounts.update(counts => ({
      ...counts,
      panelToggle: counts.panelToggle + 1
    }));
  }

  /**
   * Simulates an AI response to the user's message.
   *
   * This method creates a realistic response delay and generates
   * contextual responses based on the user's input.
   *
   * In a real application, you would:
   * 1. Send the message to your API endpoint
   * 2. Handle streaming responses
   * 3. Update the session with the assistant's response
   *
   * @param userMessage The message from the user
   * @private
   */
  private simulateAIResponse(userMessage: ChatMessage): void {
    // Simulate network delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000;

    setTimeout(() => {
      const response: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: this.generateResponse(userMessage.content),
        timestamp: Date.now()
      };

      console.log('[Demo] AI response generated:', response);

      // In a real app, you would add this to the session state
      // For this demo, we just log it
      this.messageHistory.update(messages => [...messages, response]);
    }, delay);
  }

  /**
   * Generates a contextual response based on user input.
   *
   * @param userInput The user's message content
   * @returns A generated response string
   * @private
   */
  private generateResponse(userInput: string): string {
    const lowerInput = userInput.toLowerCase();

    // Simple response generation based on keywords
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return 'Hello! How can I help you today?';
    }

    if (lowerInput.includes('how are you')) {
      return "I'm doing well, thank you for asking! I'm here to assist you with any questions or tasks you have.";
    }

    if (lowerInput.includes('help')) {
      return "I'm here to help! You can ask me questions, have conversations, or request assistance with various tasks. What would you like to know?";
    }

    if (lowerInput.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }

    if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
      return 'Goodbye! Have a great day! Feel free to come back anytime you need assistance.';
    }

    // Default response
    const defaultResponses = [
      "That's interesting! Could you tell me more about that?",
      'I understand. Please continue.',
      "That's a great question. Let me think about that...",
      'I see. What else would you like to discuss?',
      "Thanks for sharing that with me. How can I assist you further?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  /**
   * Gets the current event counts for display.
   */
  readonly eventCounters = this.eventCounts;
}
