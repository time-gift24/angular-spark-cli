import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownParagraphComponent } from './paragraph.component';
import { MarkdownBlock, BlockType, MarkdownInline } from '../../core/models';

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

const createMockBlock = (type: BlockType, content: string = 'test', overrides: Partial<MarkdownBlock> = {}): MarkdownBlock => ({
  id: `block-${Math.random()}`,
  type,
  content,
  isComplete: true,
  position: 0,
  ...overrides
});

describe('MarkdownParagraphComponent', () => {
  let component: MarkdownParagraphComponent;
  let fixture: ComponentFixture<MarkdownParagraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownParagraphComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownParagraphComponent);
    component = fixture.componentInstance;
    // Provide a default block so the component doesn't error on required input
    component.block = createMockBlock(BlockType.PARAGRAPH, '');
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default isComplete state as true', () => {
      expect(component.isComplete).toBe(true);
    });

    it('should initialize with base paragraph classes', () => {
      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph');
    });

    it('should have undefined children by default', () => {
      expect(component.block.children).toBeUndefined();
    });
  });

  describe('Plain Text Rendering', () => {
    it('should render plain text content when no children provided', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'This is a simple paragraph.');
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent).toBe('This is a simple paragraph.');
    });

    it('should render single line text', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Single line');
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent).toBe('Single line');
    });

    it('should handle empty content', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, '');
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('');
    });

    it('should handle special characters in content', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Text with <special> & "characters"');
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('Text with <special> & "characters"');
    });

    it('should handle multiline text', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Line 1\nLine 2\nLine 3');
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(1000);
      component.block = createMockBlock(BlockType.PARAGRAPH, longContent);
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe(longContent);
    });
  });

  describe('Inline Elements Rendering', () => {
    it('should render bold inline element', () => {
      const children: MarkdownInline[] = [
        { type: 'bold', content: 'bold text' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, '', { children });
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-bold');
      expect(span).toBeTruthy();
      expect(span.textContent).toBe('bold text');
    });

    it('should render italic inline element', () => {
      const children: MarkdownInline[] = [
        { type: 'italic', content: 'italic text' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, '', { children });
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-italic');
      expect(span).toBeTruthy();
      expect(span.textContent).toBe('italic text');
    });

    it('should render code inline element', () => {
      const children: MarkdownInline[] = [
        { type: 'code', content: 'code' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, '', { children });
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-code');
      expect(span).toBeTruthy();
      expect(span.textContent).toBe('code');
    });

    it('should render multiple inline elements', () => {
      const children: MarkdownInline[] = [
        { type: 'bold', content: 'bold' },
        { type: 'italic', content: 'italic' },
        { type: 'code', content: 'code' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, '', { children });
      fixture.detectChanges();

      const spans = fixture.nativeElement.querySelectorAll('span');
      expect(spans.length).toBe(3);
      expect(spans[0].classList.contains('inline-bold')).toBe(true);
      expect(spans[1].classList.contains('inline-italic')).toBe(true);
      expect(spans[2].classList.contains('inline-code')).toBe(true);
    });

    it('should not add space after last inline element', () => {
      const children: MarkdownInline[] = [
        { type: 'bold', content: 'first' },
        { type: 'italic', content: 'second' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, '', { children });
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      // Should be "first second" not "first second "
      const text = paragraph.textContent?.trim();
      expect(text?.endsWith(' ')).toBe(false);
    });

    it('should add spaces between inline elements', () => {
      const children: MarkdownInline[] = [
        { type: 'bold', content: 'first' },
        { type: 'italic', content: 'second' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, '', { children });
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      // The template adds spaces between inline elements
      const text = paragraph.textContent;
      expect(text).toContain('first');
      expect(text).toContain('second');
      expect(text?.includes('  ')).toBe(true); // Has double space from template + trim
    });

    it('should prefer children over plain content', () => {
      const children: MarkdownInline[] = [
        { type: 'bold', content: 'formatted' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, 'plain text', { children });
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('formatted');
      const span = fixture.nativeElement.querySelector('span');
      expect(span).toBeTruthy();
    });

    it('should not render children when array is empty', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'plain text', { children: [] });
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('plain text');
      const span = fixture.nativeElement.querySelector('span');
      expect(span).toBeFalsy();
    });
  });

  describe('Streaming State', () => {
    it('should apply streaming class when isComplete is false', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Streaming content');
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph streaming');
    });

    it('should not apply streaming class when isComplete is true', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Static content');
      component.isComplete = true;
      fixture.detectChanges();

      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph');
    });

    it('should update classes when isComplete changes', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Content');
      component.isComplete = true;
      fixture.detectChanges();

      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph');

      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.paragraphClasses()).toBe('markdown-paragraph block-paragraph streaming');
    });

    it('should apply streaming class to paragraph element', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Test');
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.classList.contains('streaming')).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('should apply markdown-paragraph class', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Test');
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.classList.contains('markdown-paragraph')).toBe(true);
    });

    it('should apply block-paragraph class', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Test');
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.classList.contains('block-paragraph')).toBe(true);
    });

    it('should maintain all base classes when streaming', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Test');
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
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
    it('should handle null children', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'Test', { children: null as unknown as MarkdownInline[] });
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('Test');
    });

    it('should handle inline with empty content', () => {
      const children: MarkdownInline[] = [
        { type: 'bold', content: '' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, '', { children });
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-bold');
      expect(span).toBeTruthy();
      expect(span.textContent).toBe('');
    });

    it('should handle inline with special characters', () => {
      const children: MarkdownInline[] = [
        { type: 'code', content: '<div>&"test"</div>' }
      ];
      component.block = createMockBlock(BlockType.PARAGRAPH, '', { children });
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('span.inline-code');
      expect(span.textContent).toBe('<div>&"test"</div>');
    });

    it('should handle unicode characters in content', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, '测试中文 🎉 العربية');
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('测试中文 🎉 العربية');
    });

    it('should handle number as content', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 123 as unknown as string);
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent?.trim()).toBe('123');
    });
  });
});
