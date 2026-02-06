import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownCodeComponent } from './code.component';
import { MarkdownBlock, BlockType, CodeLine } from '../../core/models';
import { ShiniHighlighter } from '../../core/shini-highlighter';

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

const createMockBlock = (type: BlockType, content: string = 'test', overrides: Partial<MarkdownBlock> = {}): MarkdownBlock => ({
  id: `block-${Math.random()}`,
  type,
  content,
  isComplete: true,
  position: 0,
  ...overrides
});

// Mock ShiniHighlighter
const mockHighlightedLines: CodeLine[] = [
  { lineNumber: 1, tokens: [{ content: 'highlighted code', color: '#000' }] }
];

const mockShiniHighlighter = {
  whenReady: vi.fn(() => Promise.resolve()),
  highlightToTokens: vi.fn(() => Promise.resolve(mockHighlightedLines)),
  plainTextFallback: vi.fn((code: string) =>
    code.split('\n').map((line, index) => ({
      lineNumber: index + 1,
      tokens: [{ content: line || ' ' }]
    }))
  ),
  initialize: vi.fn(() => Promise.resolve()),
  highlight: vi.fn(() => Promise.resolve('<code>highlighted code</code>')),
  isReady: vi.fn(() => true),
  state: { initialized: true, success: true, languagesLoaded: 8, themesLoaded: ['github-light', 'dark-plus'] }
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
        { provide: ShiniHighlighter, useValue: mockShiniHighlighter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownCodeComponent);
    component = fixture.componentInstance;
    // Provide a default block so the component doesn't error on required input
    component.block = createMockBlock(BlockType.CODE_BLOCK, '', { rawContent: '' });
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default language as text', () => {
      expect(component.language).toBe('text');
    });

    it('should have default isComplete state as true', () => {
      expect(component.isComplete).toBe(true);
    });

    it('should initialize with copied state as false', () => {
      expect(component.copied()).toBe(false);
    });

    it('should initialize with empty highlighted lines', () => {
      expect(component.highlightedLines()).toEqual([]);
    });

    it('should initialize with base code wrapper classes', () => {
      expect(component.codeWrapperClasses()).toBe('markdown-code block-code');
    });
  });

  describe('Code Rendering', () => {
    it('should render code element', async () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'const x = 1;', { language: 'javascript', rawContent: 'const x = 1;' });
      component.ngOnChanges({ block: {} as any });
      fixture.detectChanges();

      // Wait for async highlighting
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should render plain code when streaming (isComplete=false)', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'streaming code', { rawContent: 'streaming code' });
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code.code-streaming');
      expect(code).toBeTruthy();
      expect(code.textContent).toBe('streaming code');
    });

    it('should not call highlightToTokens when streaming', async () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockShiniHighlighter.highlightToTokens).not.toHaveBeenCalled();
    });

    it('should display code content when no highlighting', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'plain code', { language: 'text', rawContent: 'plain code' });
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle empty code', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '', { rawContent: '' });
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle special characters in code', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '<div>&"test"</div>', { rawContent: '<div>&"test"</div>' });
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });
  });

  describe('Language Display', () => {
    it('should capitalize language name', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '', { language: 'javascript', rawContent: '' });
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('JavaScript');
    });

    it('should display TypeScript', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '', { language: 'typescript', rawContent: '' });
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('TypeScript');
    });

    it('should display Python', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '', { language: 'python', rawContent: '' });
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Python');
    });

    it('should display unknown language capitalized', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '', { language: 'unknownlang', rawContent: '' });
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Unknownlang');
    });

    it('should display Plain Text for default language', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '', { language: 'text', rawContent: '' });
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Plain Text');
    });

    it('should show language label in header when isComplete is true', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { language: 'javascript', rawContent: 'test' });
      component.isComplete = true;
      fixture.detectChanges();

      const languageLabel = fixture.nativeElement.querySelector('.code-language');
      expect(languageLabel).toBeTruthy();
      expect(languageLabel.textContent).toBe('JavaScript');
    });

    it('should hide header when isComplete is false', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
      component.isComplete = false;
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

    it('should show copy button when isComplete is true', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
      component.isComplete = true;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      expect(button).toBeTruthy();
    });

    it('should not show copy button when isComplete is false', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
      component.isComplete = false;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      expect(button).toBeFalsy();
    });

    it('should copy code to clipboard when button clicked', async () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'code to copy', { rawContent: 'code to copy' });
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('code to copy');
    });

    it('should show copied state after successful copy', async () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test code', { rawContent: 'test code' });
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.copy-button');
      button.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.copied()).toBe(true);
      expect(button.classList.contains('copied')).toBe(true);
    });

    it('should reset copied state after 2 seconds', async () => {
      vi.useFakeTimers();

      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
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

      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
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
    it('should hide header when isComplete is false', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
      component.isComplete = false;
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.code-header');
      expect(header).toBeFalsy();
    });

    it('should show streaming class on code when isComplete is false', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'streaming code', { rawContent: 'streaming code' });
      component.isComplete = false;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code.code-streaming');
      expect(code).toBeTruthy();
      expect(code.classList.contains('code-streaming')).toBe(true);
    });

    it('should not trigger highlighting during streaming', async () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test code', { rawContent: 'test code' });
      component.isComplete = false;
      component.ngOnChanges({ isComplete: {} as any });
      fixture.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockShiniHighlighter.highlightToTokens).not.toHaveBeenCalled();
      expect(component.highlightedLines()).toEqual([]);
    });
  });

  describe('Code Wrapper Classes', () => {
    it('should apply base classes', () => {
      expect(component.codeWrapperClasses()).toBe('markdown-code block-code');
    });
  });

  describe('Error Handling', () => {
    it('should handle highlight errors and fallback to plain text', async () => {
      mockShiniHighlighter.highlightToTokens.mockRejectedValue(new Error('Highlight failed'));

      component.block = createMockBlock(BlockType.CODE_BLOCK, 'error code', { language: 'javascript', rawContent: 'error code' });
      component.ngOnChanges({ block: {} as any });
      fixture.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should use plainTextFallback on highlight error', async () => {
      mockShiniHighlighter.highlightToTokens.mockRejectedValue(new Error('Error'));

      component.block = createMockBlock(BlockType.CODE_BLOCK, '<div>test</div>', { rawContent: '<div>test</div>' });
      component.ngOnChanges({ block: {} as any });
      fixture.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();

      expect(mockShiniHighlighter.plainTextFallback).toHaveBeenCalled();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('should wrap code in code-block-wrapper', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.code-block-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should apply markdown-code class to pre element', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
      fixture.detectChanges();

      const pre = fixture.nativeElement.querySelector('pre.markdown-code');
      expect(pre).toBeTruthy();
    });

    it('should apply block-code class to pre element', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'test', { rawContent: 'test' });
      fixture.detectChanges();

      const pre = fixture.nativeElement.querySelector('pre.block-code');
      expect(pre).toBeTruthy();
    });
  });

  describe('Code getter', () => {
    it('should prefer rawContent over content', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'content', { rawContent: 'rawContent' });
      expect(component.code).toBe('rawContent');
    });

    it('should fall back to content if rawContent not available', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'content');
      expect(component.code).toBe('content');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long code', () => {
      const longCode = 'const x = '.repeat(1000);
      component.block = createMockBlock(BlockType.CODE_BLOCK, longCode, { rawContent: longCode });
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle multiline code', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'line1\nline2\nline3', { rawContent: 'line1\nline2\nline3' });
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle code with tabs', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '\tconst x = 1;\n\treturn x;', { rawContent: '\tconst x = 1;\n\treturn x;' });
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('code');
      expect(code).toBeTruthy();
    });

    it('should handle undefined language', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, '', { language: undefined, rawContent: '' });
      fixture.detectChanges();

      expect(component.displayLanguage).toBe('Plain Text');
    });
  });
});
