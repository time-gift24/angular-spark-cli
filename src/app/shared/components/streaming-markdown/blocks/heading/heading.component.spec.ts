import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownHeadingComponent } from './heading.component';
import { MarkdownBlock, BlockType } from '../../core/models';

// Vitest imports
import { beforeEach, describe, it, expect } from 'vitest';

/**
 * Unit Tests for MarkdownHeadingComponent
 *
 * Phase 6 - Task 6.1: Unit Tests for Block Components
 *
 * Test Coverage:
 * - Component creation and initialization
 * - Dynamic heading level rendering (h1-h6)
 * - Invalid level fallback behavior
 * - Streaming state management
 * - CSS class application
 */

const createMockBlock = (type: BlockType, content: string = 'test', overrides: Partial<MarkdownBlock> = {}): MarkdownBlock => ({
  id: `block-${Math.random()}`,
  type,
  content,
  isComplete: true,
  position: 0,
  ...overrides
});

describe('MarkdownHeadingComponent', () => {
  let component: MarkdownHeadingComponent;
  let fixture: ComponentFixture<MarkdownHeadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownHeadingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownHeadingComponent);
    component = fixture.componentInstance;
    // Provide a default block so the component doesn't error on required input
    component.block = createMockBlock(BlockType.HEADING, '', { level: 1 });
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default isComplete state as true', () => {
      expect(component.isComplete).toBe(true);
    });

    it('should initialize with base heading classes', () => {
      expect(component.headingClasses()).toBe('markdown-heading');
    });
  });

  describe('Heading Level Rendering', () => {
    it('should render h1 when level is 1', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test Heading 1', { level: 1 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 1');
    });

    it('should render h2 when level is 2', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test Heading 2', { level: 2 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 2');
    });

    it('should render h3 when level is 3', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test Heading 3', { level: 3 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h3');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 3');
    });

    it('should render h4 when level is 4', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test Heading 4', { level: 4 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h4');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 4');
    });

    it('should render h5 when level is 5', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test Heading 5', { level: 5 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h5');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 5');
    });

    it('should render h6 when level is 6', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test Heading 6', { level: 6 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 6');
      // Should not have fallback class when level is valid
      expect(heading.classList.contains('fallback')).toBe(false);
    });

    it('should render only one heading element at a time', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test', { level: 2 });
      fixture.detectChanges();

      const headings = fixture.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBe(1);
      expect(headings[0].tagName).toBe('H2');
    });
  });

  describe('Invalid Level Fallback', () => {
    it('should fallback to h6 when level is 0', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Invalid Level 0', { level: 0 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6.fallback');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Invalid Level 0');
      expect(heading.classList.contains('fallback')).toBe(true);
    });

    it('should fallback to h6 when level is negative', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Negative Level', { level: -1 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6.fallback');
      expect(heading).toBeTruthy();
      expect(heading.classList.contains('fallback')).toBe(true);
    });

    it('should fallback to h6 when level is greater than 6', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Level Too High', { level: 10 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6.fallback');
      expect(heading).toBeTruthy();
      expect(heading.classList.contains('fallback')).toBe(true);
    });

    it('should apply fallback styling for invalid levels', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Invalid', { level: 99 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6');
      expect(heading.classList.contains('markdown-heading')).toBe(true);
      expect(heading.classList.contains('fallback')).toBe(true);
    });
  });

  describe('Content Rendering', () => {
    it('should display plain text content', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Simple Heading', { level: 1 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toBe('Simple Heading');
    });

    it('should handle empty content', () => {
      component.block = createMockBlock(BlockType.HEADING, '', { level: 2 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading.textContent).toBe('');
    });

    it('should handle special characters in content', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Heading with <special> & "characters"', { level: 3 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h3');
      expect(heading.textContent).toBe('Heading with <special> & "characters"');
    });

    it('should handle long content', () => {
      const longContent = 'A'.repeat(500);
      component.block = createMockBlock(BlockType.HEADING, longContent, { level: 1 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toBe(longContent);
    });
  });

  describe('Streaming State', () => {
    it('should apply streaming class when isComplete is false', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Streaming Heading', { level: 1 });
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading streaming');
    });

    it('should not apply streaming class when isComplete is true', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Static Heading', { level: 1 });
      component.isComplete = true;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading');
    });

    it('should update classes when isComplete changes from true to false', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Content', { level: 2 });
      component.isComplete = true;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading');

      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading streaming');
    });

    it('should update classes when isComplete changes from false to true', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Content', { level: 3 });
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading streaming');

      component.isComplete = true;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading');
    });

    it('should apply streaming class to the rendered heading element', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Streaming', { level: 1 });
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.classList.contains('streaming')).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('should always apply markdown-heading class', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test', { level: 4 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h4');
      expect(heading.classList.contains('markdown-heading')).toBe(true);
    });

    it('should maintain base class when streaming', () => {
      component.block = createMockBlock(BlockType.HEADING, 'Test', { level: 5 });
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h5');
      expect(heading.classList.contains('markdown-heading')).toBe(true);
      expect(heading.classList.contains('streaming')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle level as string that converts to number', () => {
      component.block = createMockBlock(BlockType.HEADING, 'String Level', { level: '2' as unknown as number });
      fixture.detectChanges();

      // Since @switch uses ===, string '2' will not match number 2
      // It should fallback to h6
      const heading = fixture.nativeElement.querySelector('h6.fallback');
      expect(heading).toBeTruthy();
    });

    it('should handle undefined content by setting it', () => {
      component.block = createMockBlock(BlockType.HEADING, undefined as unknown as string, { level: 1 });
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toBe('undefined');
    });
  });
});
