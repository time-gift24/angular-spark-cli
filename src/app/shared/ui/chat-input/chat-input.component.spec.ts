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

  describe('Auto-Expanding Textarea (P5-T5.2)', () => {
    it('should initialize with MIN_HEIGHT', () => {
      expect(component.textareaHeight()).toBe(component.MIN_HEIGHT);
    });

    it('should call adjustHeight when input changes', () => {
      hostFixture.detectChanges();

      // Get the actual ChatInputComponent instance from the test host
      const chatInputComponent = hostFixture.debugElement.children[0].componentInstance;
      const textarea = hostFixture.debugElement.query(By.css('textarea')).nativeElement;
      const adjustHeightSpy = vi.spyOn(chatInputComponent as any, 'adjustHeight');

      textarea.value = 'Line 1\nLine 2';
      textarea.dispatchEvent(new Event('input'));

      hostFixture.detectChanges();

      expect(adjustHeightSpy).toHaveBeenCalledWith(textarea);
    });

    it('should adjust height via adjustHeight method', () => {
      const mockTextarea = {
        scrollHeight: 50,
      } as unknown as HTMLTextAreaElement;

      component['adjustHeight'](mockTextarea);

      expect(component.textareaHeight()).toBe(50);
    });

    it('should enforce MAX_HEIGHT constraint in adjustHeight', () => {
      const mockTextarea = {
        scrollHeight: 200,
      } as unknown as HTMLTextAreaElement;

      component['adjustHeight'](mockTextarea);

      expect(component.textareaHeight()).toBe(component.MAX_HEIGHT);
    });

    it('should reset to MIN_HEIGHT when input is empty', () => {
      // First, set a larger height
      component.textareaHeight.set(60);
      expect(component.textareaHeight()).toBe(60);

      const mockTextarea = {
        scrollHeight: 24,
      } as unknown as HTMLTextAreaElement;

      component['adjustHeight'](mockTextarea);

      expect(component.textareaHeight()).toBe(component.MIN_HEIGHT);
    });

    it('should calculate height correctly for various scroll heights', () => {
      // Test with scrollHeight <= MIN_HEIGHT
      expect(component['calculateTextareaHeight'](20)).toBe(component.MIN_HEIGHT);

      // Test with scrollHeight between MIN and MAX
      expect(component['calculateTextareaHeight'](50)).toBe(50);
      expect(component['calculateTextareaHeight'](80)).toBe(80);

      // Test with scrollHeight > MAX_HEIGHT
      expect(component['calculateTextareaHeight'](150)).toBe(component.MAX_HEIGHT);
    });
  });

  describe('Enhanced Keyboard Interactions (P5-T5.3)', () => {
    it('should identify Enter key as send key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
      expect(component['isSendKey'](event)).toBe(true);
    });

    it('should not identify Shift+Enter as send key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      expect(component['isSendKey'](event)).toBe(false);
    });

    it('should not identify other keys as send key', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', shiftKey: false });
      expect(component['isSendKey'](event)).toBe(false);
    });

    it('should send message and prevent default on Enter key', () => {
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

    it('should allow newline with Shift+Enter', () => {
      hostComponent.canSend.set(true);
      hostFixture.detectChanges();

      const textarea = hostFixture.debugElement.query(By.css('textarea')).nativeElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      textarea.dispatchEvent(event);

      hostFixture.detectChanges();

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(hostComponent.messageSendEvents).toBe(0);
    });
  });
});

