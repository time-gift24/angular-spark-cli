/**
 * Extended MarkdownFormatterService Tests
 *
 * Tests for the extended markdown formatter service with code highlighting.
 * Verifies service creation, dependency injection, and stub behavior.
 *
 * Phase 9.1, Step 4: Write Tests
 */

import { TestBed } from '@angular/core/testing';
import { MarkdownFormatterServiceExtended } from './markdown-formatter.service';
import { ShiniHighlighter } from '../core/shini-highlighter';
import { ThemeService } from '../core/theme.service';
import { MarkdownBlock } from '../core/models';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MarkdownFormatterServiceExtended', () => {
  let service: MarkdownFormatterServiceExtended;
  let shiniHighlighter: ShiniHighlighter;
  let themeService: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MarkdownFormatterServiceExtended,
        ShiniHighlighter,
        ThemeService
      ]
    });

    service = TestBed.inject(MarkdownFormatterServiceExtended);
    shiniHighlighter = TestBed.inject(ShiniHighlighter);
    themeService = TestBed.inject(ThemeService);
  });

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be provided at root level', () => {
      // Service should be singleton
      const service2 = TestBed.inject(MarkdownFormatterServiceExtended);
      expect(service).toBe(service2);
    });
  });

  describe('Dependency Injection', () => {
    it('should inject ShiniHighlighter', () => {
      expect(shiniHighlighter).toBeTruthy();
    });

    it('should inject ThemeService', () => {
      expect(themeService).toBeTruthy();
    });

    it('should have access to ShiniHighlighter methods', () => {
      expect(shiniHighlighter.highlight).toBeDefined();
      expect(shiniHighlighter.isReady).toBeDefined();
    });

    it('should have access to ThemeService methods', () => {
      expect(themeService.getCurrentTheme).toBeDefined();
    });
  });

  describe('formatCodeBlock', () => {
    it('should have formatCodeBlock method', () => {
      expect(service.formatCodeBlock).toBeDefined();
    });

    it('should accept MarkdownBlock as parameter', () => {
      const testBlock: MarkdownBlock = {
        id: 'test-id',
        type: 'code' as any,
        content: 'console.log("hello");',
        isComplete: true,
        position: 0,
        language: 'typescript'
      };

      // Should not throw error
      expect(() => service.formatCodeBlock(testBlock)).not.toThrow();
    });

    it('should handle code blocks without language (defaults to text)', () => {
      const testBlock: MarkdownBlock = {
        id: 'test-id',
        type: 'code' as any,
        content: 'some code',
        isComplete: true,
        position: 0
      };

      const result = service.formatCodeBlock(testBlock);
      expect(result).toBeTruthy();
    });

    it('should handle empty code blocks', () => {
      const testBlock: MarkdownBlock = {
        id: 'test-id',
        type: 'code' as any,
        content: '',
        isComplete: true,
        position: 0,
        language: 'javascript'
      };

      const result = service.formatCodeBlock(testBlock);
      expect(result).toBe('');
    });

    it('should handle incomplete code blocks', () => {
      const testBlock: MarkdownBlock = {
        id: 'test-id',
        type: 'code' as any,
        content: 'console.log("incomplete',
        isComplete: false,
        position: 0,
        language: 'javascript'
      };

      const result = service.formatCodeBlock(testBlock);
      expect(result).toBeTruthy();
    });
  });

  describe('formatCodeBlock - Phase 9.2 Implementation', () => {
    describe('when Shini is ready', () => {
      beforeEach(() => {
        // Mock Shini as ready
        vi.spyOn(shiniHighlighter, 'isReady').mockReturnValue(true);
        vi.spyOn(themeService, 'getCurrentTheme').mockReturnValue('light');
      });

      it('should call Shini highlight with correct parameters', () => {
        const testBlock: MarkdownBlock = {
          id: 'test-id',
          type: 'code' as any,
          content: 'const x = 1;',
          isComplete: true,
          position: 0,
          language: 'typescript'
        };

        const highlightSpy = vi.spyOn(shiniHighlighter, 'highlight').mockReturnValue('<span>const x = 1;</span>');

        service.formatCodeBlock(testBlock);

        expect(shiniHighlighter.highlight).toHaveBeenCalledWith(
          'const x = 1;',
          'typescript',
          'light'
        );
      });

      it('should return highlighted HTML from Shini', () => {
        const testBlock: MarkdownBlock = {
          id: 'test-id',
          type: 'code' as any,
          content: 'const x = 1;',
          isComplete: true,
          position: 0,
          language: 'typescript'
        };

        const highlightedHtml = '<span class="token-keyword">const</span> x = 1;';
        vi.spyOn(shiniHighlighter, 'highlight').mockReturnValue(highlightedHtml);

        const result = service.formatCodeBlock(testBlock);

        expect(result).toContain(highlightedHtml);
      });

      it('should use "text" as default language when not specified', () => {
        const testBlock: MarkdownBlock = {
          id: 'test-id',
          type: 'code' as any,
          content: 'plain code',
          isComplete: true,
          position: 0
        };

        const highlightSpy = vi.spyOn(shiniHighlighter, 'highlight').mockReturnValue('plain code');

        service.formatCodeBlock(testBlock);

        expect(highlightSpy).toHaveBeenCalledWith('plain code', 'text', 'light');
      });

      it('should wrap highlighted HTML with IDE features', () => {
        const testBlock: MarkdownBlock = {
          id: 'test-id',
          type: 'code' as any,
          content: 'const x = 1;',
          isComplete: true,
          position: 0,
          language: 'typescript'
        };

        const highlightedHtml = '<span>const x = 1;</span>';
        vi.spyOn(shiniHighlighter, 'highlight').mockReturnValue(highlightedHtml);

        const result = service.formatCodeBlock(testBlock);

        // Should contain the highlighted HTML
        expect(result).toContain(highlightedHtml);
      });
    });

    describe('when Shini is not ready', () => {
      beforeEach(() => {
        // Mock Shini as not ready
        vi.spyOn(shiniHighlighter, 'isReady').mockReturnValue(false);
      });

      it('should return escaped HTML as fallback', () => {
        const testBlock: MarkdownBlock = {
          id: 'test-id',
          type: 'code' as any,
          content: '<div>&"test"</div>',
          isComplete: true,
          position: 0,
          language: 'html'
        };

        const result = service.formatCodeBlock(testBlock);

        // Should escape HTML special characters
        expect(result).toContain('&lt;div&gt;&amp;&quot;test&quot;&lt;/div&gt;');
        expect(result).not.toContain('<div>');
      });

      it('should not call Shini highlight when not ready', () => {
        const testBlock: MarkdownBlock = {
          id: 'test-id',
          type: 'code' as any,
          content: 'const x = 1;',
          isComplete: true,
          position: 0,
          language: 'typescript'
        };

        const highlightSpy = vi.spyOn(shiniHighlighter, 'highlight');

        service.formatCodeBlock(testBlock);

        expect(highlightSpy).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        vi.spyOn(shiniHighlighter, 'isReady').mockReturnValue(true);
        vi.spyOn(themeService, 'getCurrentTheme').mockReturnValue('light');
      });

      it('should return escaped HTML when Shini throws error', () => {
        const testBlock: MarkdownBlock = {
          id: 'test-id',
          type: 'code' as any,
          content: '<script>alert("xss")</script>',
          isComplete: true,
          position: 0,
          language: 'javascript'
        };

        vi.spyOn(shiniHighlighter, 'highlight').mockImplementation(() => {
          throw new Error('Shini highlight error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = service.formatCodeBlock(testBlock);

        // Should fallback to escaped HTML
        expect(result).toContain('&lt;script&gt;');
        expect(consoleSpy).toHaveBeenCalledWith(
          '[MarkdownFormatterService] Highlight error:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      it('should handle empty content gracefully', () => {
        const testBlock: MarkdownBlock = {
          id: 'test-id',
          type: 'code' as any,
          content: '',
          isComplete: true,
          position: 0,
          language: 'typescript'
        };

        vi.spyOn(shiniHighlighter, 'highlight').mockReturnValue('');

        const result = service.formatCodeBlock(testBlock);

        expect(result).toBe('');
      });
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      const result = service['escapeHtml']('a & b');
      expect(result).toBe('a &amp; b');
    });

    it('should escape less than sign', () => {
      const result = service['escapeHtml']('<div>');
      expect(result).toBe('&lt;div&gt;');
    });

    it('should escape greater than sign', () => {
      const result = service['escapeHtml']('a > b');
      expect(result).toBe('a &gt; b');
    });

    it('should escape multiple special characters', () => {
      const result = service['escapeHtml']('<div>&"test"</div>');
      expect(result).toBe('&lt;div&gt;&amp;&quot;test&quot;&lt;/div&gt;');
    });

    it('should handle empty string', () => {
      const result = service['escapeHtml']('');
      expect(result).toBe('');
    });

    it('should handle string without special characters', () => {
      const result = service['escapeHtml']('const x = 1;');
      expect(result).toBe('const x = 1;');
    });

    it('should escape all occurrences of special characters', () => {
      const result = service['escapeHtml']('<<<&&&>>>');
      expect(result).toBe('&lt;&lt;&lt;&amp;&amp;&amp;&gt;&gt;&gt;');
    });
  });

  describe('wrapWithIdeFeatures', () => {
    it('should return HTML unchanged (stub implementation)', () => {
      const html = '<span class="token">code</span>';
      const language = 'typescript';

      const result = service['wrapWithIdeFeatures'](html, language);

      expect(result).toBe(html);
    });

    it('should handle empty HTML', () => {
      const result = service['wrapWithIdeFeatures']('', 'typescript');
      expect(result).toBe('');
    });

    it('should handle different languages', () => {
      const html = '<span>code</span>';

      const result1 = service['wrapWithIdeFeatures'](html, 'typescript');
      const result2 = service['wrapWithIdeFeatures'](html, 'python');

      expect(result1).toBe(html);
      expect(result2).toBe(html);
    });
  });

  describe('Inheritance', () => {
    it('should inherit from MarkdownFormatterService', () => {
      // Extended service should have parent methods
      expect(service.format).toBeDefined();
      expect(service.formatInline).toBeDefined();
    });

    it('should call parent format method', () => {
      const testBlock: MarkdownBlock = {
        id: 'test-id',
        type: 'paragraph' as any,
        content: 'Test paragraph',
        isComplete: true,
        position: 0
      };

      // Should not throw error - inherits format() from parent
      expect(() => service.format(testBlock)).not.toThrow();
    });

    it('should call parent formatInline method', () => {
      // Should not throw error - inherits formatInline() from parent
      expect(() => service.formatInline('**bold text**')).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should have access to ShiniHighlighter for future highlighting', () => {
      // Verify shini is accessible (private property)
      expect(service['shini']).toBeDefined();
      expect(service['shini']).toBe(shiniHighlighter);
    });

    it('should have access to ThemeService for theme-aware highlighting', () => {
      // Verify themeService is accessible (private property)
      expect(service['themeService']).toBeDefined();
      expect(service['themeService']).toBe(themeService);
    });

    it('should be ready for Phase 9.2 implementation', () => {
      // Verify all integration points are in place
      const testBlock: MarkdownBlock = {
        id: 'test-id',
        type: 'code' as any,
        content: 'const x = 1;',
        isComplete: true,
        position: 0,
        language: 'typescript'
      };

      // Should have all dependencies ready
      expect(service['shini']).toBeTruthy();
      expect(service['themeService']).toBeTruthy();
      expect(service.formatCodeBlock).toBeDefined();

      // Method signature is correct
      expect(() => service.formatCodeBlock(testBlock)).not.toThrow();
    });
  });
});
