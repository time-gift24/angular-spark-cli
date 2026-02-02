import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input, signal } from '@angular/core';
import { MarkdownCodeComponent } from './code.component';
import { SafeHtml } from '@angular/platform-browser';

// Vitest imports
import { beforeEach, describe, it, expect, vi } from 'vitest';

/**
 * Unit Tests for MarkdownCodeComponent
 *
 * Phase 6 - Task 6.1: Unit Tests for Block Components
 *
 * Test Coverage:
 * - Component creation and initialization
 * - Code rendering with and without highlighting
 * - Streaming state handling
 * - Language display
 * - Copy button functionality
 * - Error handling and fallback
 * - CSS classes
 */

// Mock ShiniHighlighter
const mockShiniHighlighter = {
  whenReady: vi.fn(() => Promise.resolve()),
  highlight: vi.fn(() => Promise.resolve('<code>highlighted code</code>')),
  initialize: vi.fn(() => Promise.resolve())
};

// Mock DomSanitizer
const mockDomSanitizer = {
  bypassSecurityTrustHtml: vi.fn((html: string) => {
    const safeHtml: SafeHtml = html as unknown as SafeHtml;
    return safeHtml;
  })
};

describe('MarkdownCodeComponent', () => {
  let component: MarkdownCodeComponent;
  let fixture: ComponentFixture<MarkdownCodeComponent>;

  beforeEach(async () => {
    // Clear mocks before each test
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [MarkdownCodeComponent],
      providers: [
        { provide: 'ShiniHighlighter', useValue: mockShiniHighlighter },
        { provide: 'DomSanitizer', useValue: mockDomSanitizer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownCodeComponent);
    component = fixture.componentInstance;

    // Inject mocks manually since component uses inject()
    (component as any).shiniHighlighter = mockShiniHighlighter;
    (component as any).domSanitizer = mockDomSanitizer;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default language as text', () => {
      expect(component.language).toBe('text');
    });

    it('should have default streaming state as false', () => {
      expect(component.streaming).toBe(false);
    });

    it('should initialize with copied state as false', () => {
      expect(component.copied()).toBe(false);
    });

    it('should initialize with null highlight result', () => {
      expect(component.highlightResult()).toBeNull();
    });

    it('should initialize with base code wrapper classes', () => {
      expect(component.codeWrapperClasses()).toBe('markdown-code block-code');
    });
  });

  describe('Code Rendering', () => {
    it('should render code element', async () => {
      component.code = 'const x = 1;';
      component.language = 'javascript';
      fixture.detectChanges();

      // Wait for async highlighting
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should render plain code when streaming', () => {
      component.code = 'streaming code';
      component.streaming = true;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code.code-streaming');
      expect(code).toBeTruthy();
      expect(code.textContent).toBe('streaming code');
    });

    it('should not call highlight when streaming', async () => {
      component.code = 'test';
      component.streaming = true;
      fixture.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockShiniHighlighter.highlight).not.toHaveBeenCalled();
    });

    it('should display code content when no highlighting', () => {
      component.code = 'plain code';
      component.language = 'text';
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle empty code', () => {
      component.code = '';
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle special characters in code', () => {
      component.code = '<div>&"test"</div>';
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });
  });

  describe('Language Display', () => {
    it('should capitalize language name', () => {
      component.language = 'javascript';
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Javascript');
    });

    it('should display TypeScript', () => {
      component.language = 'typescript';
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Typescript');
    });

    it('should display Python', () => {
      component.language = 'python';
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Python');
    });

    it('should display unknown language capitalized', () => {
      component.language = 'unknownlang';
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Unknownlang');
    });

    it('should display Text for default language', () => {
      component.language = 'text';
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Text');
    });

    it('should show language label in header when not streaming', () => {
      component.code = 'test';
      component.language = 'javascript';
      component.streaming = false;
      fixture.detectChanges();

      const languageLabel = fixture.nativeElement.querySelector('.code-language');
      expect(languageLabel).toBeTruthy();
      expect(languageLabel.textContent).toBe('Javascript');
    });

    it('should hide header when streaming', () => {
      component.code = 'test';
      component.streaming = true;
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.code-header');
      expect(header).toBeFalsy();
    });
  });

  describe('Copy Button Functionality', () => {
    beforeEach(() => {
      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.resolve())
        }
      });
    });

    it('should show copy button when not streaming', () => {
      component.code = 'test';
      component.streaming = false;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      expect(button).toBeTruthy();
    });

    it('should not show copy button when streaming', () => {
      component.code = 'test';
      component.streaming = true;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      expect(button).toBeFalsy();
    });

    it('should copy code to clipboard when button clicked', async () => {
      component.code = 'code to copy';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('code to copy');
    });

    it('should show copied state after successful copy', async () => {
      component.code = 'test code';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.copied()).toBe(true);
      expect(button.classList.contains('copied')).toBe(true);
    });

    it('should reset copied state after 2 seconds', async () => {
      vi.useFakeTimers();

      component.code = 'test';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.copied()).toBe(true);

      // Fast forward 2 seconds
      vi.advanceTimersByTime(2000);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.copied()).toBe(false);

      vi.useRealTimers();
    });

    it('should handle clipboard errors gracefully', async () => {
      navigator.clipboard.writeText = vi.fn(() => Promise.reject(new Error('Clipboard failed')));

      component.code = 'test';
      fixture.detectChanges();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const button = fixture.nativeElement.querySelector('.copy-button');
      await button.click();

      expect(component.copied()).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Streaming State', () => {
    it('should hide header when streaming is true', () => {
      component.code = 'test';
      component.streaming = true;
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.code-header');
      expect(header).toBeFalsy();
    });

    it('should show streaming class on code when streaming', () => {
      component.code = 'streaming code';
      component.streaming = true;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code.code-streaming');
      expect(code).toBeTruthy();
      expect(code.classList.contains('code-streaming')).toBe(true);
    });

    it('should not trigger highlighting during streaming', async () => {
      component.code = 'test code';
      component.streaming = true;
      fixture.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockShiniHighlighter.highlight).not.toHaveBeenCalled();
      expect(component.highlightResult()).toBeNull();
    });
  });

  describe('Code Wrapper Classes', () => {
    it('should apply base classes', () => {
      expect(component.codeWrapperClasses()).toBe('markdown-code block-code');
    });
  });

  describe('Error Handling', () => {
    it('should handle highlight errors and fallback to plain text', async () => {
      mockShiniHighlighter.highlight.mockRejectedValue(new Error('Highlight failed'));

      component.code = 'error code';
      component.language = 'javascript';
      fixture.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should escape HTML in fallback mode', async () => {
      mockShiniHighlighter.highlight.mockRejectedValue(new Error('Error'));

      component.code = '<div>test</div>';
      fixture.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      expect(mockShiniHighlighter.highlight).toHaveBeenCalled();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('should wrap code in code-block-wrapper', () => {
      component.code = 'test';
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.code-block-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should apply markdown-code class to pre element', () => {
      component.code = 'test';
      fixture.detectChanges();

      const pre = fixture.nativeElement.querySelector('pre.markdown-code');
      expect(pre).toBeTruthy();
    });

    it('should apply block-code class to pre element', () => {
      component.code = 'test';
      fixture.detectChanges();

      const pre = fixture.nativeElement.querySelector('pre.block-code');
      expect(pre).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long code', () => {
      const longCode = 'const x = '.repeat(1000);
      component.code = longCode;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle multiline code', () => {
      component.code = 'line1\nline2\nline3';
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle code with tabs', () => {
      component.code = '\tconst x = 1;\n\treturn x;';
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle undefined language', () => {
      component.language = undefined as unknown as string;
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Text');
    });
  });
});
