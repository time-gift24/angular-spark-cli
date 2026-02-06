import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownBlockquoteComponent } from './blockquote.component';
import { MarkdownBlock, BlockType } from '../../core/models';

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

const createMockBlock = (type: BlockType, content: string = 'test', overrides: Partial<MarkdownBlock> = {}): MarkdownBlock => ({
  id: `block-${Math.random()}`,
  type,
  content,
  isComplete: true,
  position: 0,
  ...overrides
});

describe('MarkdownBlockquoteComponent', () => {
  let component: MarkdownBlockquoteComponent;
  let fixture: ComponentFixture<MarkdownBlockquoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownBlockquoteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownBlockquoteComponent);
    component = fixture.componentInstance;
    // Provide a default block so the component doesn't error on required input
    component.block = createMockBlock(BlockType.BLOCKQUOTE, '');
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default isComplete state as true', () => {
      expect(component.isComplete).toBe(true);
    });

    it('should initialize with base blockquote classes', () => {
      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote');
    });
  });

  describe('Content Rendering', () => {
    it('should render blockquote element', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'This is a quote');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote).toBeTruthy();
    });

    it('should display plain text content', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Simple quote text');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Simple quote text');
    });

    it('should handle empty content', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('');
    });

    it('should handle single line quote', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Single line quote');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Single line quote');
    });

    it('should handle multiline quote', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Line 1\nLine 2\nLine 3');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle special characters in content', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote with <special> & "characters"');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Quote with <special> & "characters"');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(500);
      component.block = createMockBlock(BlockType.BLOCKQUOTE, longContent);
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe(longContent);
    });

    it('should preserve whitespace in content', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '  Quote with spaces   ');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('  Quote with spaces   ');
    });
  });

  describe('Streaming State', () => {
    it('should apply streaming class when isComplete is false', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Streaming quote');
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote streaming');
    });

    it('should not apply streaming class when isComplete is true', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Static quote');
      component.isComplete = true;
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote');
    });

    it('should update classes when isComplete changes from true to false', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote');
      component.isComplete = true;
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote');

      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote streaming');
    });

    it('should update classes when isComplete changes from false to true', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote');
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote streaming');

      component.isComplete = true;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.blockquoteClasses()).toBe('markdown-blockquote block-blockquote');
    });

    it('should apply streaming class to blockquote element', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote');
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('streaming')).toBe(true);
    });
  });

  describe('Streaming Indicator', () => {
    it('should show streaming indicator when isComplete is false', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote');
      component.isComplete = false;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator).toBeTruthy();
    });

    it('should not show streaming indicator when isComplete is true', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote');
      component.isComplete = true;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator).toBeFalsy();
    });

    it('should hide streaming indicator when streaming stops', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote');
      component.isComplete = false;
      fixture.detectChanges();

      let indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator).toBeTruthy();

      component.isComplete = true;
      fixture.detectChanges();

      indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator).toBeFalsy();
    });

    it('should render streaming indicator as span', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote');
      component.isComplete = false;
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector('.streaming-indicator');
      expect(indicator.tagName).toBe('SPAN');
    });
  });

  describe('CSS Classes', () => {
    it('should apply markdown-blockquote class', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Test');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('markdown-blockquote')).toBe(true);
    });

    it('should apply block-blockquote class', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Test');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('block-blockquote')).toBe(true);
    });

    it('should maintain all base classes when streaming', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Test');
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('markdown-blockquote')).toBe(true);
      expect(blockquote.classList.contains('block-blockquote')).toBe(true);
      expect(blockquote.classList.contains('streaming')).toBe(true);
    });

    it('should not have streaming class when not streaming', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Test');
      component.isComplete = true;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.classList.contains('streaming')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '测试中文 🎉 العربية');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('测试中文 🎉 العربية');
    });

    it('should handle content with only spaces', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '     ');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('     ');
    });

    it('should handle content with newlines only', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '\n\n\n');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('\n\n\n');
    });

    it('should handle tabs in content', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '\tIndented quote\t');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('\tIndented quote\t');
    });

    it('should handle mixed whitespace', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '  \n\t  \n  ');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('  \n\t  \n  ');
    });

    it('should handle number as content', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 123 as unknown as string);
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('123');
    });

    it('should handle undefined content by showing undefined', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, undefined as unknown as string);
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('undefined');
    });
  });

  describe('Template Structure', () => {
    it('should have only one blockquote element', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote');
      fixture.detectChanges();

      const blockquotes = fixture.nativeElement.querySelectorAll('blockquote');
      expect(blockquotes.length).toBe(1);
    });

    it('should render content directly in blockquote', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Direct content');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      // Content should be direct text node, not wrapped in another element
      expect(blockquote.children.length).toBe(0); // No child elements when not streaming
      expect(blockquote.childNodes.length).toBeGreaterThan(0); // Has text nodes
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical markdown quote', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '> This is a quoted text from someone famous');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('> This is a quoted text from someone famous');
    });

    it('should handle multiline blockquote', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, '> First line\n> Second line\n> Third line');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('> First line\n> Second line\n> Third line');
    });

    it('should handle quote with attribution', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'The only way to do great work is to love what you do.\n— Steve Jobs');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('The only way to do great work is to love what you do.\n— Steve Jobs');
    });

    it('should handle code-like content in quote', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'Use `const x = 1;` for declarations');
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('blockquote');
      expect(blockquote.textContent).toBe('Use `const x = 1;` for declarations');
    });
  });
});
