import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageBubbleComponent } from './message-bubble.component';
import { ChatMessage } from '@app/shared/models';

describe('MessageBubbleComponent', () => {
  it('should create user message with solid background', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [MessageBubbleComponent],
    }).createComponent(MessageBubbleComponent);

    const userMessage: ChatMessage = {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    };

    fixture.componentRef.setInput('message', userMessage);
    fixture.detectChanges();

    expect(fixture.componentInstance.isUser()).toBe(true);
    expect(fixture.componentInstance.isAI()).toBe(false);
  });

  it('should create AI message with glass effect', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [MessageBubbleComponent],
    }).createComponent(MessageBubbleComponent);

    const aiMessage: ChatMessage = {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: Date.now(),
    };

    fixture.componentRef.setInput('message', aiMessage);
    fixture.detectChanges();

    expect(fixture.componentInstance.isAI()).toBe(true);
    expect(fixture.componentInstance.isUser()).toBe(false);
  });
});
