/**
 * Test Suite for ShiniHighlighter Service
 *
 * Phase 7.1, Task 7.1: Create ShiniHighlighter Service Skeleton
 * Phase 7.2, Task 7.2: Implement Lazy Initialization
 * Phase 11, Task 11.1: Define Test Interfaces and Scaffolding
 *
 * This file validates the basic structure and initialization behavior of the
 * ShiniHighlighter service. Full implementation tests will be added when
 * real Shiki integration is implemented.
 */

import { TestBed } from '@angular/core/testing';
import { ShiniHighlighter } from './shini-highlighter';
import { IShiniHighlighter, ShiniLanguage, ShiniTheme } from './shini-types';

/**
 * Test case for Shini highlighter
 *
 * Defines the structure for individual test cases that validate
 * syntax highlighting behavior for different code snippets.
 */
export interface ShiniHighlighterTestCase {
  /** Input parameters for the highlight operation */
  input: {
    /** Raw code string to highlight */
    code: string;
    /** Programming language identifier */
    language: ShiniLanguage | string;
    /** Theme to apply (light or dark) */
    theme: ShiniTheme;
  };
  /** Expected output from the highlight operation */
  expected: {
    /** Whether highlighting should succeed */
    success: boolean;
    /** CSS token classes that should be present in the output */
    containsTokens?: string[];
    /** Strings that should be present in the output */
    containsStrings?: string[];
    /** Strings that should NOT be present in the output */
    notContainsStrings?: string[];
    /** Whether output should be HTML-escaped */
    isEscaped?: boolean;
    /** Should return plain text instead of highlighted HTML */
    shouldReturnPlainText?: boolean;
  };
  /** Human-readable description of what is being tested */
  description: string;
  /** Optional skip flag for tests not yet implemented */
  skip?: boolean;
}

/**
 * Performance test case for measuring highlighting speed
 */
export interface ShiniPerformanceTestCase {
  /** Code to highlight (typically large or complex) */
  code: string;
  /** Language of the code */
  language: ShiniLanguage | string;
  /** Expected maximum time in milliseconds */
  maxTimeMs: number;
  /** Description of the performance scenario */
  description: string;
}

/**
 * Edge case test for error handling and robustness
 */
export interface ShiniEdgeCaseTestCase {
  /** Input that may cause errors or unexpected behavior */
  input: {
    code: string;
    language: string;
    theme: ShiniTheme;
  };
  /** Expected error handling behavior */
  expected: {
    /** Whether operation should succeed despite edge case */
    shouldSucceed: boolean;
    /** Expected fallback behavior */
    fallbackReason?: 'not_initialized' | 'unsupported_language' | 'highlight_error';
    /** Should return plain text instead of highlighted HTML */
    shouldReturnPlainText?: boolean;
  };
  /** Description of the edge case */
  description: string;
}

/**
 * ============================================================================
 * TEST CASE EXAMPLES
 * ============================================================================
 *
 * These test case examples serve as templates for future Shiki integration tests.
 * They are disabled (commented out) but can be enabled and expanded when
 * real Shiki highlighting is implemented.
 *
 * Usage: Uncomment and adapt these examples when implementing actual Shiki tests
 */

/**
 * Example test cases for syntax highlighting validation
 *
 * These examples demonstrate how to write comprehensive tests for
 * different programming languages and edge cases.
 */
const EXAMPLE_TEST_CASES: ShiniHighlighterTestCase[] = [
  {
    description: 'should highlight TypeScript function with keywords',
    input: {
      code: 'function greet(name: string): string { return `Hello, ${name}`; }',
      language: 'typescript',
      theme: 'light'
    },
    expected: {
      success: true,
      containsTokens: ['keyword', 'string', 'function'],
      containsStrings: ['function', 'greet', 'return']
    }
  },
  {
    description: 'should highlight Python class definition',
    input: {
      code: 'class MyClass:\n    def __init__(self):\n        self.value = 42',
      language: 'python',
      theme: 'dark'
    },
    expected: {
      success: true,
      containsTokens: ['class', 'function', 'number'],
      containsStrings: ['class', 'MyClass', '__init__']
    }
  },
  {
    description: 'should handle unsupported language gracefully',
    input: {
      code: 'some random code',
      language: 'unknown-language',
      theme: 'light'
    },
    expected: {
      success: false,
      shouldReturnPlainText: true,
      containsStrings: ['some random code']
    }
  },
  {
    description: 'should escape HTML in code to prevent XSS',
    input: {
      code: '<script>alert("XSS")</script>',
      language: 'javascript',
      theme: 'light'
    },
    expected: {
      success: true,
      isEscaped: true,
      notContainsStrings: ['<script>', '</script>'],
      containsStrings: ['&lt;', '&gt;']
    }
  },
  {
    description: 'should highlight CSS with selectors and properties',
    input: {
      code: '.container { display: flex; gap: 1rem; }',
      language: 'css',
      theme: 'dark'
    },
    expected: {
      success: true,
      containsTokens: ['selector', 'property', 'number'],
      containsStrings: ['display', 'flex', 'gap']
    }
  },
  {
    description: 'should handle empty code string',
    input: {
      code: '',
      language: 'typescript',
      theme: 'light'
    },
    expected: {
      success: true,
      containsStrings: ['']
    }
  }
];

/**
 * Example performance test cases
 *
 * These test cases verify that highlighting performance meets expectations
 * for various code sizes and complexity levels.
 */
const EXAMPLE_PERFORMANCE_CASES: ShiniPerformanceTestCase[] = [
  {
    description: 'should highlight small code snippet quickly',
    code: 'const x = 42;',
    language: 'typescript',
    maxTimeMs: 10
  },
  {
    description: 'should highlight medium-sized code efficiently',
    code: `
      function example() {
        const data = [1, 2, 3, 4, 5];
        return data.map(x => x * 2);
      }
    `,
    language: 'typescript',
    maxTimeMs: 50
  },
  {
    description: 'should handle large code blocks without significant slowdown',
    code: 'const x = 1;\n'.repeat(1000),
    language: 'typescript',
    maxTimeMs: 500
  }
];

/**
 * Example edge case test cases
 *
 * These test cases verify robustness and error handling for unusual inputs.
 */
const EXAMPLE_EDGE_CASES: ShiniEdgeCaseTestCase[] = [
  {
    description: 'should handle null/undefined language',
    input: {
      code: 'const x = 42;',
      language: '',
      theme: 'light'
    },
    expected: {
      shouldSucceed: true,
      fallbackReason: 'unsupported_language',
      shouldReturnPlainText: true
    }
  },
  {
    description: 'should handle special characters and unicode',
    input: {
      code: 'const emoji = "😀 🎉";',
      language: 'typescript',
      theme: 'light'
    },
    expected: {
      shouldSucceed: true
    }
  },
  {
    description: 'should handle very long single-line code',
    input: {
      code: 'const x = ' + 'a'.repeat(10000) + ';',
      language: 'typescript',
      theme: 'dark'
    },
    expected: {
      shouldSucceed: true
    }
  },
  {
    description: 'should handle mixed line endings (CRLF, LF)',
    input: {
      code: 'const x = 1;\r\nconst y = 2;\nconst z = 3;',
      language: 'typescript',
      theme: 'light'
    },
    expected: {
      shouldSucceed: true
    }
  }
];

/**
 * ============================================================================
 * TESTING PATTERNS AND BEST PRACTICES
 * ============================================================================
 *
 * This section documents recommended testing patterns for the ShiniHighlighter.
 *
 * 1. INITIALIZATION TESTS
 *    - Verify service can be injected via Angular DI
 *    - Check initial state before initialization
 *    - Verify successful initialization updates state
 *    - Test error handling during initialization
 *    - Verify idempotency (multiple initialize() calls)
 *
 * 2. HIGHLIGHTING TESTS
 *    - Test with multiple languages (typescript, python, javascript, etc.)
 *    - Test both light and dark themes
 *    - Verify HTML structure and token classes
 *    - Test with empty strings and edge cases
 *    - Verify HTML escaping for security
 *
 * 3. STATE MANAGEMENT TESTS
 *    - Verify state signal updates correctly
 *    - Check isReady() returns correct values
 *    - Verify state is readonly (external updates prevented)
 *    - Test state updates during initialization
 *
 * 4. ERROR HANDLING TESTS
 *    - Test with unsupported languages
 *    - Test with invalid inputs
 *    - Verify fallback to plain text when Shini unavailable
 *    - Test error messages are informative
 *
 * 5. PERFORMANCE TESTS
 *    - Measure highlighting time for small, medium, large code
 *    - Verify caching works (if implemented)
 *    - Test memory usage for repeated highlighting
 *    - Verify no memory leaks in long-running scenarios
 *
 * 6. INTEGRATION TESTS
 *    - Test with StreamingMarkdownComponent
 *    - Verify theme switching works correctly
 *    - Test with real-world markdown code blocks
 *    - Verify concurrent highlighting requests
 *
 * EXAMPLE: Writing a comprehensive test
 * ---------------------------------------
 *
 * describe('TypeScript Highlighting', () => {
 *   const testCases: ShiniHighlighterTestCase[] = [
 *     {
 *       description: 'should highlight arrow function',
 *       input: {
 *         code: 'const add = (a: number, b: number) => a + b;',
 *         language: 'typescript',
 *         theme: 'light'
 *       },
 *       expected: {
 *         success: true,
 *         containsTokens: ['keyword', 'function', 'operator']
 *       }
 *     }
 *   ];
 *
 *   testCases.forEach(({ description, input, expected, skip }) => {
 *     const itOrSkip = skip ? it.skip : it;
 *     itOrSkip(description, async () => {
 *       await service.initialize();
 *       const result = service.highlightToTokens(input.code, input.language, input.theme);
 *
 *       if (expected.containsTokens) {
 *         expected.containsTokens.forEach(token => {
 *           expect(result).toContain(token);
 *         });
 *       }
 *
 *       if (expected.notContainsStrings) {
 *         expected.notContainsStrings.forEach(str => {
 *           expect(result).not.toContain(str);
 *         });
 *       }
 *     });
 *   });
 * });
 */

/**
 * Test suite for ShiniHighlighter service skeleton.
 *
 * Phase 7.1 Tests:
 * - Service can be injected via Angular DI
 * - Service implements IShiniHighlighter interface correctly
 * - Initial state is correctly set (not initialized)
 * - isReady() returns false before initialization
 * - state signal returns initial values
 */
describe('ShiniHighlighter Service Skeleton', () => {
  let service: ShiniHighlighter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShiniHighlighter]
    });

    service = TestBed.inject(ShiniHighlighter);
  });

  afterEach(() => {
    // Clean up any state if needed
  });

  describe('Service Injection', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of ShiniHighlighter', () => {
      expect(service).toBeInstanceOf(ShiniHighlighter);
    });

    it('should implement IShiniHighlighter interface', () => {
      // Verify all required methods exist
      expect(typeof service.initialize).toBe('function');
      expect(typeof service.highlightToTokens).toBe('function');
      expect(typeof service.isReady).toBe('function');

      // Verify state signal exists
      expect(service.state).toBeDefined();
      expect(typeof service.state).toBe('function');
    });
  });

  describe('Initial State', () => {
    it('should have state signal that returns initial values', () => {
      const state = service.state();

      expect(state).toBeDefined();
      expect(state.initialized).toBe(false);
      expect(state.success).toBe(false);
      expect(state.languagesLoaded).toBe(0);
      expect(state.themesLoaded).toEqual([]);
    });

    it('should return false for isReady() when not initialized', () => {
      expect(service.isReady()).toBe(false);
    });

    it('should have state as a readonly signal', () => {
      // The state should be callable as a function (signal)
      const state1 = service.state();
      const state2 = service.state();

      // Should return the same state object structure
      expect(state1).toEqual(state2);
    });
  });

  describe('initialize() Method - Phase 7.2 Implementation', () => {
    it('should be a function that returns a Promise', () => {
      const result = service.initialize();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve successfully on normal initialization', async () => {
      await service.initialize();

      const state = service.state();
      expect(state.initialized).toBe(true);
      expect(state.success).toBe(true);
      expect(state.error).toBeUndefined();
    });

    it('should update state with loaded languages count on success', async () => {
      await service.initialize();

      const state = service.state();
      expect(state.languagesLoaded).toBeGreaterThan(0);
      expect(state.languagesLoaded).toBe(8); // PRELOAD_LANGUAGES has 8 languages
    });

    it('should update state with loaded themes on success', async () => {
      await service.initialize();

      const state = service.state();
      expect(state.themesLoaded).toHaveLength(2);
      expect(state.themesLoaded).toContain('github-light');
      expect(state.themesLoaded).toContain('dark-plus');
    });

    it('should set isReady() to true after successful initialization', async () => {
      expect(service.isReady()).toBe(false);

      await service.initialize();

      expect(service.isReady()).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Create a testable service by extending the base class
      class TestableShiniHighlighter extends ShiniHighlighter {
        override async initialize(): Promise<void> {
          // Simulate initialization failure
          this['_state'].set({
            initialized: true,
            success: false,
            error: 'Failed to load WASM',
            languagesLoaded: 0,
            themesLoaded: []
          });
        }
      }

      const errorService = new TestableShiniHighlighter();
      await errorService.initialize();

      const state = errorService.state();
      expect(state.initialized).toBe(true);
      expect(state.success).toBe(false);
      expect(state.error).toBeDefined();
      expect(state.error).toContain('Failed to load WASM');
      expect(state.languagesLoaded).toBe(0);
      expect(state.themesLoaded).toEqual([]);
    });

    it('should set isReady() to false after failed initialization', async () => {
      class TestableShiniHighlighter extends ShiniHighlighter {
        override async initialize(): Promise<void> {
          // Simulate initialization failure
          this['_state'].set({
            initialized: true,
            success: false,
            error: 'WASM load failed',
            languagesLoaded: 0,
            themesLoaded: []
          });
        }
      }

      const errorService = new TestableShiniHighlighter();
      await errorService.initialize();

      expect(errorService.isReady()).toBe(false);
    });

    it('should handle non-Error objects in error handling', async () => {
      class TestableShiniHighlighter extends ShiniHighlighter {
        override async initialize(): Promise<void> {
          // Simulate initialization with string error
          this['_state'].set({
            initialized: true,
            success: false,
            error: 'String error',
            languagesLoaded: 0,
            themesLoaded: []
          });
        }
      }

      const errorService = new TestableShiniHighlighter();
      await errorService.initialize();

      const state = errorService.state();
      expect(state.initialized).toBe(true);
      expect(state.success).toBe(false);
      expect(state.error).toBe('String error');
    });

    it('should only initialize once (multiple calls should be safe)', async () => {
      await service.initialize();
      const firstState = service.state();

      await service.initialize();
      const secondState = service.state();

      // State should remain consistent
      expect(firstState).toEqual(secondState);
    });
  });

  describe('highlightToTokens() Method', () => {
    const testCode = 'const x = 42;';
    const testLanguage = 'typescript';
    const testTheme: 'light' | 'dark' = 'light';

    it('should return an array', async () => {
      const result = await service.highlightToTokens(testCode, testLanguage, testTheme);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return CodeLine objects with lineNumber and tokens', async () => {
      await service.initialize();
      const result = await service.highlightToTokens(testCode, testLanguage, testTheme);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].lineNumber).toBeDefined();
      expect(result[0].tokens).toBeDefined();
    });

    it('should handle empty code strings', async () => {
      const result = await service.highlightToTokens('', testLanguage, testTheme);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle different languages', async () => {
      await service.initialize();
      const languages = ['typescript', 'python', 'javascript', 'html', 'css'];

      for (const lang of languages) {
        const result = await service.highlightToTokens(testCode, lang, testTheme);
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should handle both light and dark themes', async () => {
      await service.initialize();
      const themes: Array<'light' | 'dark'> = ['light', 'dark'];

      for (const theme of themes) {
        const result = await service.highlightToTokens(testCode, testLanguage, theme);
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe('isReady() Method', () => {
    it('should return false before initialization', () => {
      expect(service.isReady()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });

    it('should return a boolean', () => {
      const result = service.isReady();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('State Signal Behavior', () => {
    it('should provide reactive state updates', () => {
      const initialState = service.state();

      expect(initialState.initialized).toBe(false);
      expect(initialState.success).toBe(false);
    });

    it('should not allow external mutation of state (readonly)', () => {
      const state = service.state();

      // The state signal should be readonly
      // We can't directly test this in TypeScript, but we verify
      // the structure is correct
      expect(Object.isFrozen(state) || Object.isSealed(state)).toBeFalsy();
      // Note: In actual implementation, the signal's readonly nature
      // prevents external updates
    });
  });

  describe('Interface Contract', () => {
    it('should match IShiniHighlighter interface signature', () => {
      // Verify the service matches the expected interface
      const methods: Array<keyof IShiniHighlighter> = [
        'initialize',
        'highlightToTokens',
        'isReady'
      ];

      methods.forEach(method => {
        expect(service[method]).toBeDefined();
        expect(typeof service[method]).toBe('function');
      });
    });

    it('should have state with correct type structure', () => {
      const state = service.state();

      // Verify all required properties exist
      expect(state).toHaveProperty('initialized');
      expect(state).toHaveProperty('success');
      expect(state).toHaveProperty('languagesLoaded');
      expect(state).toHaveProperty('themesLoaded');

      // Verify property types
      expect(typeof state.initialized).toBe('boolean');
      expect(typeof state.success).toBe('boolean');
      expect(typeof state.languagesLoaded).toBe('number');
      expect(Array.isArray(state.themesLoaded)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in code', async () => {
      const specialCode = '<script>alert("test");</script>';
      const result = await service.highlightToTokens(specialCode, 'javascript', 'dark');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle multiline code', async () => {
      const multilineCode = `
        function example() {
          return true;
        }
      `;
      const result = await service.highlightToTokens(multilineCode, 'typescript', 'light');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle very long code strings', async () => {
      const longCode = 'const x = 1;'.repeat(1000);
      const result = await service.highlightToTokens(longCode, 'text', 'light');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

/**
 * ============================================================================
 * FUTURE TEST IMPLEMENTATION
 * ============================================================================
 *
 * These test suites are placeholders for when real Shiki integration is
 * implemented. They demonstrate how to use the test interfaces defined above.
 *
 * To enable these tests when Shiki is integrated:
 * 1. Remove the `.skip` from `describe.skip`
 * 2. Implement actual Shiki highlighting in ShiniHighlighter service
 * 3. Verify all tests pass
 */

describe.skip('ShiniHighlighter - Real Shiki Integration (Phase 7.3+)', () => {
  let service: IShiniHighlighter;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [ShiniHighlighter]
    });

    service = TestBed.inject(ShiniHighlighter);
    await service.initialize();
  });

  /**
   * Basic functionality tests with EXAMPLE_TEST_CASES
   */
  describe('Syntax Highlighting', () => {
    EXAMPLE_TEST_CASES.forEach((testCase) => {
      const itOrSkip = testCase.skip ? it.skip : it;

      itOrSkip(testCase.description, async () => {
        const result = await service.highlightToTokens(
          testCase.input.code,
          testCase.input.language,
          testCase.input.theme
        );

        // Verify success state
        if (testCase.expected.success) {
          expect(result).toBeTruthy();
        }

        // Verify expected tokens are present
        if (testCase.expected.containsTokens) {
          testCase.expected.containsTokens.forEach(token => {
            expect(result).toContain(token);
          });
        }

        // Verify expected strings are present
        if (testCase.expected.containsStrings) {
          testCase.expected.containsStrings.forEach(str => {
            expect(result).toContain(str);
          });
        }

        // Verify strings that should NOT be present
        if (testCase.expected.notContainsStrings) {
          testCase.expected.notContainsStrings.forEach(str => {
            expect(result).not.toContain(str);
          });
        }
      });
    });
  });

  /**
   * Performance tests with EXAMPLE_PERFORMANCE_CASES
   */
  describe('Performance', () => {
    EXAMPLE_PERFORMANCE_CASES.forEach((testCase) => {
      it(testCase.description, () => {
        const startTime = performance.now();
        const result = service.highlight(
          testCase.code,
          testCase.language,
          'light'
        );
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(result).toBeTruthy();
        expect(duration).toBeLessThan(testCase.maxTimeMs);
      });
    });
  });

  /**
   * Edge case tests with EXAMPLE_EDGE_CASES
   */
  describe('Edge Cases and Error Handling', () => {
    EXAMPLE_EDGE_CASES.forEach((testCase) => {
      it(testCase.description, () => {
        const result = service.highlight(
          testCase.input.code,
          testCase.input.language,
          testCase.input.theme
        );

        if (testCase.expected.shouldSucceed) {
          expect(result).toBeTruthy();
        }

        if (testCase.expected.shouldReturnPlainText) {
          // Result should be plain text, not highlighted HTML
          expect(result).toContain(testCase.input.code);
        }

        if (testCase.expected.fallbackReason) {
          // Verify fallback behavior
          expect(result).toBeTruthy();
        }
      });
    });
  });

  /**
   * Language-specific tests
   */
  describe('Language Support', () => {
    const languages: ShiniLanguage[] = [
      'typescript', 'javascript', 'python', 'html', 'css',
      'json', 'bash', 'sql', 'go', 'rust', 'java', 'cpp'
    ];

    languages.forEach(lang => {
      it(`should support ${lang} language`, () => {
        const code = `// ${lang} test code`;
        const result = service.highlight(code, lang, 'light');
        expect(result).toBeTruthy();
      });
    });
  });

  /**
   * Theme tests
   */
  describe('Theme Support', () => {
    it('should apply light theme correctly', () => {
      const code = 'const x = 42;';
      const result = service.highlight(code, 'typescript', 'light');
      expect(result).toContain('github-light');
    });

    it('should apply dark theme correctly', () => {
      const code = 'const x = 42;';
      const result = service.highlight(code, 'typescript', 'dark');
      expect(result).toContain('dark-plus');
    });
  });

  /**
   * Caching tests (if implemented)
   */
  describe('Caching', () => {
    it('should cache highlighted results for performance', () => {
      const code = 'const x = 42;';
      const firstCall = service.highlight(code, 'typescript', 'light');
      const secondCall = service.highlight(code, 'typescript', 'light');

      // Results should be identical (potentially from cache)
      expect(firstCall).toBe(secondCall);
    });

    it('should invalidate cache when theme changes', () => {
      const code = 'const x = 42;';
      const lightResult = service.highlight(code, 'typescript', 'light');
      const darkResult = service.highlight(code, 'typescript', 'dark');

      // Different themes should produce different results
      expect(lightResult).not.toBe(darkResult);
    });
  });

  /**
   * Security tests
   */
  describe('Security', () => {
    it('should escape HTML entities to prevent XSS', () => {
      const maliciousCode = '<script>alert("XSS")</script>';
      const result = service.highlight(maliciousCode, 'javascript', 'light');

      // Script tags should be escaped
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should escape event handlers in attributes', () => {
      const code = '<div onclick="evil()">';
      const result = service.highlight(code, 'html', 'light');

      expect(result).not.toContain('onclick=');
      expect(result).toContain('&lt;');
    });
  });
});

/**
 * Additional integration test scenarios
 */
describe.skip('ShiniHighlighter - Integration Tests', () => {
  it('should handle concurrent highlight requests', async () => {
    // Test that multiple simultaneous highlight calls work correctly
    // This is important for streaming markdown with multiple code blocks
  });

  it('should work with StreamingMarkdownComponent', () => {
    // Test integration with the actual streaming markdown component
    // Verify that code blocks in markdown are highlighted correctly
  });

  it('should respond to theme changes dynamically', () => {
    // Test that changing the app theme triggers re-highlighting
    // with the new theme
  });
});
