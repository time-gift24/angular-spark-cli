import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownHeadingComponent } from './heading.component';

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
describe('MarkdownHeadingComponent', () => {
  let component: MarkdownHeadingComponent;
  let fixture: ComponentFixture<MarkdownHeadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownHeadingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownHeadingComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default streaming state as false', () => {
      expect(component.streaming).toBe(false);
    });

    it('should initialize with base heading classes', () => {
      expect(component.headingClasses()).toBe('markdown-heading');
    });
  });

  describe('Heading Level Rendering', () => {
    it('should render h1 when level is 1', () => {
      component.level = 1;
      component.content = 'Test Heading 1';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 1');
    });

    it('should render h2 when level is 2', () => {
      component.level = 2;
      component.content = 'Test Heading 2';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 2');
    });

    it('should render h3 when level is 3', () => {
      component.level = 3;
      component.content = 'Test Heading 3';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h3');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 3');
    });

    it('should render h4 when level is 4', () => {
      component.level = 4;
      component.content = 'Test Heading 4';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h4');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 4');
    });

    it('should render h5 when level is 5', () => {
      component.level = 5;
      component.content = 'Test Heading 5';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h5');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 5');
    });

    it('should render h6 when level is 6', () => {
      component.level = 6;
      component.content = 'Test Heading 6';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Test Heading 6');
      // Should not have fallback class when level is valid
      expect(heading.classList.contains('fallback')).toBe(false);
    });

    it('should render only one heading element at a time', () => {
      component.level = 2;
      component.content = 'Test';
      fixture.detectChanges();

      const headings = fixture.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBe(1);
      expect(headings[0].tagName).toBe('H2');
    });
  });

  describe('Invalid Level Fallback', () => {
    it('should fallback to h6 when level is 0', () => {
      component.level = 0;
      component.content = 'Invalid Level 0';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6.fallback');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('Invalid Level 0');
      expect(heading.classList.contains('fallback')).toBe(true);
    });

    it('should fallback to h6 when level is negative', () => {
      component.level = -1;
      component.content = 'Negative Level';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6.fallback');
      expect(heading).toBeTruthy();
      expect(heading.classList.contains('fallback')).toBe(true);
    });

    it('should fallback to h6 when level is greater than 6', () => {
      component.level = 10;
      component.content = 'Level Too High';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6.fallback');
      expect(heading).toBeTruthy();
      expect(heading.classList.contains('fallback')).toBe(true);
    });

    it('should apply fallback styling for invalid levels', () => {
      component.level = 99;
      component.content = 'Invalid';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h6');
      expect(heading.classList.contains('markdown-heading')).toBe(true);
      expect(heading.classList.contains('fallback')).toBe(true);
    });
  });

  describe('Content Rendering', () => {
    it('should display plain text content', () => {
      component.level = 1;
      component.content = 'Simple Heading';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toBe('Simple Heading');
    });

    it('should handle empty content', () => {
      component.level = 2;
      component.content = '';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading.textContent).toBe('');
    });

    it('should handle special characters in content', () => {
      component.level = 3;
      component.content = 'Heading with <special> & "characters"';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h3');
      expect(heading.textContent).toBe('Heading with <special> & "characters"');
    });

    it('should handle long content', () => {
      const longContent = 'A'.repeat(500);
      component.level = 1;
      component.content = longContent;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toBe(longContent);
    });
  });

  describe('Streaming State', () => {
    it('should apply streaming class when streaming is true', () => {
      component.level = 1;
      component.content = 'Streaming Heading';
      component.streaming = true;
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading streaming');
    });

    it('should not apply streaming class when streaming is false', () => {
      component.level = 1;
      component.content = 'Static Heading';
      component.streaming = false;
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading');
    });

    it('should update classes when streaming changes from false to true', () => {
      component.level = 2;
      component.content = 'Content';
      component.streaming = false;
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading');

      component.streaming = true;
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading streaming');
    });

    it('should update classes when streaming changes from true to false', () => {
      component.level = 3;
      component.content = 'Content';
      component.streaming = true;
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading streaming');

      component.streaming = false;
      fixture.detectChanges();

      expect(component.headingClasses()).toBe('markdown-heading');
    });

    it('should apply streaming class to the rendered heading element', () => {
      component.level = 1;
      component.content = 'Streaming';
      component.streaming = true;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.classList.contains('streaming')).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('should always apply markdown-heading class', () => {
      component.level = 4;
      component.content = 'Test';
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h4');
      expect(heading.classList.contains('markdown-heading')).toBe(true);
    });

    it('should maintain base class when streaming', () => {
      component.level = 5;
      component.content = 'Test';
      component.streaming = true;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h5');
      expect(heading.classList.contains('markdown-heading')).toBe(true);
      expect(heading.classList.contains('streaming')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle level as string that converts to number', () => {
      component.level = '2' as unknown as number;
      component.content = 'String Level';
      fixture.detectChanges();

      // Since @switch uses ===, string '2' will not match number 2
      // It should fallback to h6
      const heading = fixture.nativeElement.querySelector('h6.fallback');
      expect(heading).toBeTruthy();
    });

    it('should handle undefined content by setting it', () => {
      component.level = 1;
      component.content = undefined as unknown as string;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toBe('undefined');
    });
  });
});
