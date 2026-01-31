import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ChatInputComponent } from './chat-input.component';
import { By } from '@angular/platform-browser';

// Vitest imports
import { beforeEach, describe, it, expect, vi } from 'vitest';

@Component({
  standalone: true,
  imports: [ChatInputComponent],
  template: `
    <app-chat-input
      [inputValue]="inputValue"
      [canSend]="canSend"
      (inputChange)="onInputChange($event)"
      (messageSend)="onMessageSend()"
    />
  `,
})
class TestHostComponent {
  inputValue = signal('');
  canSend = signal(false);
  inputChangeEvents: string[] = [];
  messageSendEvents: number = 0;

  onInputChange(value: string): void {
    this.inputChangeEvents.push(value);
  }

  onMessageSend(): void {
    this.messageSendEvents++;
  }
}

describe('ChatInputComponent', () => {
  let component: ChatInputComponent;
  let fixture: ComponentFixture<ChatInputComponent>;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatInputComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInputComponent);
    component = fixture.componentInstance;

    // Setup test host with required inputs
    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have MAX_HEIGHT constant set to 120', () => {
      expect(component.MAX_HEIGHT).toBe(120);
    });

    it('should have MIN_HEIGHT constant set to 24', () => {
      expect(component.MIN_HEIGHT).toBe(24);
    });

    it('should initialize textareaHeight with MIN_HEIGHT', () => {
      expect(component.textareaHeight()).toBe(24);
    });

    it('should initialize isFocused as false', () => {
      expect(component.isFocused()).toBe(false);
    });
  });

  describe('Input Handling', () => {
    it('should emit inputChange event when textarea value changes', () => {
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('textarea')).nativeElement;
      textarea.value = 'Hello AI';
      textarea.dispatchEvent(new Event('input'));

      hostFixture.detectChanges();

      expect(hostComponent.inputChangeEvents).toHaveLength(1);
      expect(hostComponent.inputChangeEvents[0]).toBe('Hello AI');
    });

    it('should emit inputChange with empty string when textarea is cleared', () => {
      hostComponent.inputValue.set('Some text');
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('textarea')).nativeElement;
      textarea.value = '';
      textarea.dispatchEvent(new Event('input'));

      hostFixture.detectChanges();

      expect(hostComponent.inputChangeEvents).toHaveLength(1);
      expect(hostComponent.inputChangeEvents[0]).toBe('');
    });
  });

  describe('Message Sending', () => {
    it('should not emit messageSend when canSend is false', () => {
      hostComponent.canSend.set(false);
      hostFixture.detectChanges();

      const sendButton = hostFixture.debugElement.query(By.css('.send-button')).nativeElement;
      sendButton.click();

      hostFixture.detectChanges();

      expect(hostComponent.messageSendEvents).toBe(0);
    });

    it('should emit messageSend when canSend is true and button is clicked', () => {
      hostComponent.canSend.set(true);
      hostFixture.detectChanges();

      const sendButton = hostFixture.debugElement.query(By.css('.send-button')).nativeElement;
      sendButton.click();

      hostFixture.detectChanges();

      expect(hostComponent.messageSendEvents).toBe(1);
    });

    it('should emit messageSend when Enter key is pressed (without Shift)', () => {
      hostComponent.canSend.set(true);
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('textarea')).nativeElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      textarea.dispatchEvent(event);

      hostFixture.detectChanges();

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(hostComponent.messageSendEvents).toBe(1);
    });

    it('should not emit messageSend when Shift+Enter is pressed', () => {
      hostComponent.canSend.set(true);
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('textarea')).nativeElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });

      textarea.dispatchEvent(event);

      hostFixture.detectChanges();

      expect(hostComponent.messageSendEvents).toBe(0);
    });

    it('should not send message with Enter when canSend is false', () => {
      hostComponent.canSend.set(false);
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('textarea')).nativeElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });

      textarea.dispatchEvent(event);

      hostFixture.detectChanges();

      expect(hostComponent.messageSendEvents).toBe(0);
    });
  });

  describe('Focus State', () => {
    it('should set isFocused to true when textarea is focused', () => {
      expect(component.isFocused()).toBe(false);

      const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement;
      textarea.dispatchEvent(new Event('focus'));
      fixture.detectChanges();

      expect(component.isFocused()).toBe(true);
    });

    it('should set isFocused to false when textarea loses focus', () => {
      component.isFocused.set(true);

      const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement;
      textarea.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(component.isFocused()).toBe(false);
    });
  });

  describe('Template Rendering', () => {
    it('should render textarea with placeholder', () => {
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('textarea'));
      expect(textarea).toBeTruthy();
      expect(textarea.nativeElement.placeholder).toBe('Ask AI anything...');
    });

    it('should render send button', () => {
      hostFixture.detectChanges();

      const button = hostFixture.debugElement.query(By.css('.send-button'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.textContent).toContain('Send');
    });

    it('should disable send button when canSend is false', () => {
      hostComponent.canSend.set(false);
      hostFixture.detectChanges();

      const button = hostFixture.debugElement.query(By.css('.send-button'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('should enable send button when canSend is true', () => {
      hostComponent.canSend.set(true);
      hostFixture.detectChanges();

      const button = hostFixture.debugElement.query(By.css('.send-button'));
      expect(button.nativeElement.disabled).toBe(false);
    });

    it('should bind textarea value to inputValue signal', () => {
      hostComponent.inputValue.set('Test message');
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('textarea'));
      expect(textarea.nativeElement.value).toBe('Test message');
    });

    it('should apply textarea height dynamically', () => {
      component.textareaHeight.set(50);
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('textarea'));
      expect(textarea.nativeElement.style.height).toBe('50px');
    });
  });

  describe('CSS Classes', () => {
    it('should have input-container wrapper', () => {
      hostFixture.detectChanges();

      const container = hostFixture.debugElement.query(By.css('.input-container'));
      expect(container).toBeTruthy();
    });

    it('should apply chat-textarea class to textarea', () => {
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('.chat-textarea'));
      expect(textarea).toBeTruthy();
    });

    it('should apply send-button class to button', () => {
      hostFixture.detectChanges();

      const button = hostFixture.debugElement.query(By.css('.send-button'));
      expect(button).toBeTruthy();
    });
  });
});
