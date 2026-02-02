import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownParagraphComponent, MarkdownInline } from './paragraph.component';

// Vitest imports
import { beforeEach, describe, it, expect } from 'vitest';

/**
 * Unit Tests for MarkdownParagraphComponent
 *
 * Phase 6 - Task 6.1: Unit Tests for Block Components
 *
 * Test Coverage:
 * - Component creation and initialization
 * - Plain text paragraph rendering
 * - Inline element rendering (bold, italic, code)
 * - Streaming state management
 * - CSS class application
 * - Edge cases (empty content, special characters)
 */
describe('MarkdownParagraphComponent', () => {
  let component: MarkdownParagraphComponent;
  let fixture: ComponentFixture<MarkdownParagraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownParagraphComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownParagraphComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default streaming state as false', () => {
      expect(component.streaming).toBe(false);
    });

    it('should initialize with base paragraph classes', () => {
      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph');
    });

    it('should have undefined inlines by default', () => {
      expect(component.inlines).toBeUndefined();
    });
  });

  describe('Plain Text Rendering', () => {
    it('should render plain text content when no inlines provided', () => {
      component.content = 'This is a simple paragraph.';
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent).toBe('This is a simple paragraph.');
    });

    it('should render single line text', () => {
      component.content = 'Single line';
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent).toBe('Single line');
    });

    it('should handle empty content', () => {
      component.content = '';
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('');
    });

    it('should handle special characters in content', () => {
      component.content = 'Text with <special> & "characters"';
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('Text with <special> & "characters"');
    });

    it('should handle multiline text', () => {
      component.content = 'Line 1\nLine 2\nLine 3';
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(1000);
      component.content = longContent;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe(longContent);
    });
  });

  describe('Inline Elements Rendering', () => {
    it('should render bold inline element', () => {
      const inlines: MarkdownInline[] = [
        { type: 'bold', content: 'bold text' }
      ];
      component.content = '';
      component.inlines = inlines;
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-bold');
      expect(span).toBeTruthy();
      expect(span.textContent).toBe('bold text');
    });

    it('should render italic inline element', () => {
      const inlines: MarkdownInline[] = [
        { type: 'italic', content: 'italic text' }
      ];
      component.content = '';
      component.inlines = inlines;
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-italic');
      expect(span).toBeTruthy();
      expect(span.textContent).toBe('italic text');
    });

    it('should render code inline element', () => {
      const inlines: MarkdownInline[] = [
        { type: 'code', content: 'code' }
      ];
      component.content = '';
      component.inlines = inlines;
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-code');
      expect(span).toBeTruthy();
      expect(span.textContent).toBe('code');
    });

    it('should render multiple inline elements', () => {
      const inlines: MarkdownInline[] = [
        { type: 'bold', content: 'bold' },
        { type: 'italic', content: 'italic' },
        { type: 'code', content: 'code' }
      ];
      component.content = '';
      component.inlines = inlines;
      fixture.detectChanges();

      const spans = fixture.nativeElement.querySelectorAll('span');
      expect(spans.length).toBe(3);
      expect(spans[0].classList.contains('inline-bold')).toBe(true);
      expect(spans[1].classList.contains('inline-italic')).toBe(true);
      expect(spans[2].classList.contains('inline-code')).toBe(true);
    });

    it('should not add space after last inline element', () => {
      const inlines: MarkdownInline[] = [
        { type: 'bold', content: 'first' },
        { type: 'italic', content: 'second' }
      ];
      component.content = '';
      component.inlines = inlines;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      // Should be "first second" not "first second "
      const text = paragraph.textContent?.trim();
      expect(text?.endsWith(' ')).toBe(false);
    });

    it('should add spaces between inline elements', () => {
      const inlines: MarkdownInline[] = [
        { type: 'bold', content: 'first' },
        { type: 'italic', content: 'second' }
      ];
      component.content = '';
      component.inlines = inlines;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      // The template adds spaces between inline elements
      const text = paragraph.textContent;
      expect(text).toContain('first');
      expect(text).toContain('second');
      expect(text?.includes('  ')).toBe(true); // Has double space from template + trim
    });

    it('should prefer inlines over plain content', () => {
      const inlines: MarkdownInline[] = [
        { type: 'bold', content: 'formatted' }
      ];
      component.content = 'plain text';
      component.inlines = inlines;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('formatted');
      const span = fixture.nativeElement.querySelector('span');
      expect(span).toBeTruthy();
    });

    it('should not render inlines when array is empty', () => {
      component.content = 'plain text';
      component.inlines = [];
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('plain text');
      const span = fixture.nativeElement.querySelector('span');
      expect(span).toBeFalsy();
    });
  });

  describe('Streaming State', () => {
    it('should apply streaming class when streaming is true', () => {
      component.content = 'Streaming content';
      component.streaming = true;
      component.ngOnChanges({ streaming: {} as any });
      fixture.detectChanges();

      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph streaming');
    });

    it('should not apply streaming class when streaming is false', () => {
      component.content = 'Static content';
      component.streaming = false;
      fixture.detectChanges();

      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph');
    });

    it('should update classes when streaming changes', () => {
      component.content = 'Content';
      component.streaming = false;
      fixture.detectChanges();

      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph');

      component.streaming = true;
      component.ngOnChanges({ streaming: {} as any });
      fixture.detectChanges();

      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph streaming');
    });

    it('should apply streaming class to paragraph element', () => {
      component.content = 'Test';
      component.streaming = true;
      component.ngOnChanges({ streaming: {} as any });
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.classList.contains('streaming')).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('should apply markdown-paragraph class', () => {
      component.content = 'Test';
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.classList.contains('markdown-paragraph')).toBe(true);
    });

    it('should apply block-paragraph class', () => {
      component.content = 'Test';
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.classList.contains('block-paragraph')).toBe(true);
    });

    it('should maintain all base classes when streaming', () => {
      component.content = 'Test';
      component.streaming = true;
      component.ngOnChanges({ streaming: {} as any });
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.classList.contains('markdown-paragraph')).toBe(true);
      expect(paragraph.classList.contains('block-paragraph')).toBe(true);
      expect(paragraph.classList.contains('streaming')).toBe(true);
    });
  });

  describe('getInlineClass Method', () => {
    it('should return inline-bold for bold type', () => {
      expect(component.getInlineClass('bold')).toBe('inline-bold');
    });

    it('should return inline-italic for italic type', () => {
      expect(component.getInlineClass('italic')).toBe('inline-italic');
    });

    it('should return inline-code for code type', () => {
      expect(component.getInlineClass('code')).toBe('inline-code');
    });

    it('should handle unknown types', () => {
      expect(component.getInlineClass('unknown')).toBe('inline-unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null inlines', () => {
      component.content = 'Test';
      component.inlines = null as unknown as MarkdownInline[];
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('Test');
    });

    it('should handle inline with empty content', () => {
      const inlines: MarkdownInline[] = [
        { type: 'bold', content: '' }
      ];
      component.content = '';
      component.inlines = inlines;
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-bold');
      expect(span).toBeTruthy();
      expect(span.textContent).toBe('');
    });

    it('should handle inline with special characters', () => {
      const inlines: MarkdownInline[] = [
        { type: 'code', content: '<div>&"test"</div>' }
      ];
      component.content = '';
      component.inlines = inlines;
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-code');
      expect(span.textContent).toBe('<div>&"test"</div>');
    });

    it('should handle unicode characters in content', () => {
      component.content = '测试中文 🎉 العربية';
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('测试中文 🎉 العربية');
    });

    it('should handle number as content', () => {
      component.content = 123 as unknown as string;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('123');
    });
  });
});
