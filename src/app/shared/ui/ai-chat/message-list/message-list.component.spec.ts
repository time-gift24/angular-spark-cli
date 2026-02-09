import { TestBed } from '@angular/core/testing';
import { MessageListComponent } from './message-list.component';
import { ChatMessage } from '@app/shared/models';

describe('MessageListComponent', () => {
  it('should display empty state when no messages', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [MessageListComponent],
    }).createComponent(MessageListComponent);

    fixture.componentRef.setInput('messages', []);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should display messages when provided', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [MessageListComponent],
    }).createComponent(MessageListComponent);

    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      },
    ];

    fixture.componentRef.setInput('messages', messages);
    fixture.detectChanges();

    const bubbles = fixture.nativeElement.querySelectorAll('ai-message-bubble');
    expect(bubbles.length).toBe(1);
  });
});
