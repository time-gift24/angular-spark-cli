import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownBlockquoteComponent } from './blockquote.component';

// Vitest imports
import { beforeEach, describe, it, expect } from 'vitest';

/**
 * Unit Tests for MarkdownBlockquoteComponent
 *
 * Phase 6 - Task 6.1: Unit Tests for Block Components
 *
 * Test Coverage:
 * - Component creation and initialization
 * - Content rendering
 * - Streaming state management
 * - CSS class application
 * - Streaming indicator display
 * - Edge cases
 */
describe('MarkdownBlockquoteComponent', () => {
  let component: MarkdownBlockquoteComponent;
  let fixture: ComponentFixture<MarkdownBlockquoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownBlockquoteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownBlockquoteComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default streaming state as false', () => {
      expect(component.streaming).toBe(false);
    });

    it('should initialize with base blockquote classes', () => {
      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote');
    });
  });

  describe('Content Rendering', () => {
    it('should render blockquote element', () => {
      component.content = 'This is a quote';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote).toBeTruthy();
    });

    it('should display plain text content', () => {
      component.content = 'Simple quote text';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Simple quote text');
    });

    it('should handle empty content', () => {
      component.content = '';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('');
    });

    it('should handle single line quote', () => {
      component.content = 'Single line quote';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Single line quote');
    });

    it('should handle multiline quote', () => {
      component.content = 'Line 1\nLine 2\nLine 3';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle special characters in content', () => {
      component.content = 'Quote with <special> & "characters"';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Quote with <special> & "characters"');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(500);
      component.content = longContent;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe(longContent);
    });

    it('should preserve whitespace in content', () => {
      component.content = '  Quote with spaces   ';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('  Quote with spaces   ');
    });
  });

  describe('Streaming State', () => {
    it('should apply streaming class when streaming is true', () => {
      component.content = 'Streaming quote';
      component.streaming = true;
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote streaming');
    });

    it('should not apply streaming class when streaming is false', () => {
      component.content = 'Static quote';
      component.streaming = false;
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote');
    });

    it('should update classes when streaming changes from false to true', () => {
      component.content = 'Quote';
      component.streaming = false;
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote');

      component.streaming = true;
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote streaming');
    });

    it('should update classes when streaming changes from true to false', () => {
      component.content = 'Quote';
      component.streaming = true;
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote streaming');

      component.streaming = false;
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote');
    });

    it('should apply streaming class to blockquote element', () => {
      component.content = 'Quote';
      component.streaming = true;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('streaming')).toBe(true);
    });
  });

  describe('Streaming Indicator', () => {
    it('should show streaming indicator when streaming is true', () => {
      component.content = 'Quote';
      component.streaming = true;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator).toBeTruthy();
    });

    it('should not show streaming indicator when streaming is false', () => {
      component.content = 'Quote';
      component.streaming = false;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator).toBeFalsy();
    });

    it('should hide streaming indicator when streaming stops', () => {
      component.content = 'Quote';
      component.streaming = true;
      fixture.detectChanges();

      let indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator).toBeTruthy();

      component.streaming = false;
      fixture.detectChanges();

      indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator).toBeFalsy();
    });

    it('should render streaming indicator as span', () => {
      component.content = 'Quote';
      component.streaming = true;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator.tagName).toBe('SPAN');
    });
  });

  describe('CSS Classes', () => {
    it('should apply markdown-blockquote class', () => {
      component.content = 'Test';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('markdown-blockquote')).toBe(true);
    });

    it('should apply block-blockquote class', () => {
      component.content = 'Test';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('block-blockquote')).toBe(true);
    });

    it('should maintain all base classes when streaming', () => {
      component.content = 'Test';
      component.streaming = true;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('markdown-blockquote')).toBe(true);
      expect(blockquote.classList.contains('block-blockquote')).toBe(true);
      expect(blockquote.classList.contains('streaming')).toBe(true);
    });

    it('should not have streaming class when not streaming', () => {
      component.content = 'Test';
      component.streaming = false;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('streaming')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters', () => {
      component.content = '测试中文 🎉 العربية';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('测试中文 🎉 العربية');
    });

    it('should handle content with only spaces', () => {
      component.content = '     ';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('     ');
    });

    it('should handle content with newlines only', () => {
      component.content = '\n\n\n';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('\n\n\n');
    });

    it('should handle tabs in content', () => {
      component.content = '\tIndented quote\t';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('\tIndented quote\t');
    });

    it('should handle mixed whitespace', () => {
      component.content = '  \n\t  \n  ';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('  \n\t  \n  ');
    });

    it('should handle number as content', () => {
      component.content = 123 as unknown as string;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('123');
    });

    it('should handle undefined content by showing undefined', () => {
      component.content = undefined as unknown as string;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('undefined');
    });
  });

  describe('Template Structure', () => {
    it('should have only one blockquote element', () => {
      component.content = 'Quote';
      fixture.detectChanges();

      const blockquotes = fixture.nativeElement.querySelectorAll('blockquote');
      expect(blockquotes.length).toBe(1);
    });

    it('should render content directly in blockquote', () => {
      component.content = 'Direct content';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      // Content should be direct text node, not wrapped in another element
      expect(blockquote.children.length).toBe(0); // No child elements when not streaming
      expect(blockquote.childNodes.length).toBeGreaterThan(0); // Has text nodes
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical markdown quote', () => {
      component.content = '> This is a quoted text from someone famous';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('> This is a quoted text from someone famous');
    });

    it('should handle multiline blockquote', () => {
      component.content = '> First line\n> Second line\n> Third line';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('> First line\n> Second line\n> Third line');
    });

    it('should handle quote with attribution', () => {
      component.content = 'The only way to do great work is to love what you do.\n— Steve Jobs';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('The only way to do great work is to love what you do.\n— Steve Jobs');
    });

    it('should handle code-like content in quote', () => {
      component.content = 'Use `const x = 1;` for declarations';
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Use `const x = 1;` for declarations');
    });
  });
});
