/**
 * Test Suite for BlockParser Service
 *
 * Phase 9, Task 9.2: Define Unit Test Interfaces
 *
 * This file defines test case interfaces and provides example test structure
 * for the BlockParser service. Full test implementations will be added in later phases.
 */

import { BlockParser, IBlockParser } from './block-parser';
import { ParserResult, MarkdownBlock, BlockType } from './models';
import { BlockComponentRegistry } from './plugin';
import { beforeEach, describe, expect, it } from 'vitest';

/**
 * Test case interface for basic parsing tests.
 * Defines input markdown and expected parsing results.
 */
export interface ParseTestCase {
  /** Raw markdown input to parse */
  input: string;

  /** Expected number of blocks after parsing */
  expectedBlockCount: number;

  /** Expected types of blocks in order */
  expectedBlockTypes?: BlockType[];

  /** Description of what this test validates */
  description: string;

  /** Optional flag to skip this test during development */
  skip?: boolean;
}

/**
 * Test case interface for incremental parsing tests.
 * Tests the streaming capability with previous and new text.
 */
export interface IncrementalParseTestCase {
  /** Text from the previous parse call */
  previousText: string;

  /** New text to parse incrementally */
  newText: string;

  /** Expected number of blocks in the result */
  expectedBlockCount: number;

  /** Whether the result should have an incomplete block */
  expectedHasIncomplete: boolean;

  /** Description of the incremental scenario */
  description: string;
}

/**
 * Test case interface for block-specific parsing.
 * Validates individual block type detection and content extraction.
 */
export interface BlockParseTestCase {
  /** Input markdown for this block type */
  input: string;

  /** Expected block type */
  expectedType: BlockType;

  /** Expected block content (raw markdown) */
  expectedContent: string;

  /** Expected heading level (for heading blocks) */
  expectedLevel?: number;

  /** Expected language (for code blocks) */
  expectedLanguage?: string;

  /** Description of the block being tested */
  description: string;
}

/**
 * Test case interface for edge cases and error handling.
 */
export interface ParserEdgeCaseTestCase {
  /** Input that might cause errors */
  input: string;

  /** Whether this should result in an error (throw) */
  shouldThrow: boolean;

  /** Expected error message (if shouldThrow is true) */
  expectedError?: string;

  /** Description of the edge case */
  description: string;
}

/**
 * Test suite for BlockParser service.
 *
 * Tests the following capabilities:
 * - Basic markdown parsing into blocks
 * - Incremental parsing for streaming scenarios
 * - Individual block type detection
 * - Edge case and error handling
 */
describe('BlockParser', () => {
  let parser: IBlockParser;

  /**
   * Test cases for paragraph block parsing.
   */
  const paragraphTestCases: BlockParseTestCase[] = [
    {
      input: 'This is a simple paragraph.',
      expectedType: BlockType.PARAGRAPH,
      expectedContent: 'This is a simple paragraph.',
      description: 'should parse a simple paragraph'
    },
    {
      input: 'First paragraph.\n\nSecond paragraph.',
      expectedType: BlockType.PARAGRAPH,
      expectedContent: 'First paragraph.',
      description: 'should parse first of multiple paragraphs'
    },
    {
      input: '',
      expectedType: BlockType.PARAGRAPH,
      expectedContent: '',
      description: 'should handle empty input'
    }
  ];

  /**
   * Test cases for heading block parsing.
   */
  const headingTestCases: BlockParseTestCase[] = [
    {
      input: '# Heading 1',
      expectedType: BlockType.HEADING,
      expectedContent: 'Heading 1',
      expectedLevel: 1,
      description: 'should parse h1 heading'
    },
    {
      input: '## Heading 2',
      expectedType: BlockType.HEADING,
      expectedContent: 'Heading 2',
      expectedLevel: 2,
      description: 'should parse h2 heading'
    },
    {
      input: '### Heading 3',
      expectedType: BlockType.HEADING,
      expectedContent: 'Heading 3',
      expectedLevel: 3,
      description: 'should parse h3 heading'
    },
    {
      input: '###### Heading 6',
      expectedType: BlockType.HEADING,
      expectedContent: 'Heading 6',
      expectedLevel: 6,
      description: 'should parse h6 heading'
    }
  ];

  /**
   * Test cases for code block parsing.
   */
  const codeBlockTestCases: BlockParseTestCase[] = [
    {
      input: '```typescript\nconst x = 1;\n```',
      expectedType: BlockType.CODE_BLOCK,
      expectedContent: '```typescript\nconst x = 1;\n```',
      expectedLanguage: 'typescript',
      description: 'should parse code block with language'
    },
    {
      input: '```\ncode here\n```',
      expectedType: BlockType.CODE_BLOCK,
      expectedContent: '```\ncode here\n```',
      expectedLanguage: undefined,
      description: 'should parse code block without language'
    },
    {
      input: '```javascript\nconsole.log("hello");',
      expectedType: BlockType.CODE_BLOCK,
      expectedContent: '```javascript\nconsole.log("hello");',
      expectedLanguage: 'javascript',
      description: 'should parse incomplete code block'
    }
  ];

  /**
   * Test cases for block list parsing.
   */
  const listTestCases: BlockParseTestCase[] = [
    {
      input: '- Item 1\n- Item 2\n- Item 3',
      expectedType: BlockType.LIST,
      expectedContent: '- Item 1\n- Item 2\n- Item 3',
      description: 'should parse unordered list'
    },
    {
      input: '1. First\n2. Second\n3. Third',
      expectedType: BlockType.LIST,
      expectedContent: '1. First\n2. Second\n3. Third',
      description: 'should parse ordered list'
    }
  ];

  /**
   * Test cases for blockquote parsing.
   */
  const blockquoteTestCases: BlockParseTestCase[] = [
    {
      input: '> This is a quote',
      expectedType: BlockType.BLOCKQUOTE,
      expectedContent: '> This is a quote',
      description: 'should parse blockquote'
    },
    {
      input: '> Multi\n> line\n> quote',
      expectedType: BlockType.BLOCKQUOTE,
      expectedContent: '> Multi\n> line\n> quote',
      description: 'should parse multi-line blockquote'
    }
  ];

  /**
   * Test cases for thematic break (horizontal rule) parsing.
   */
  const thematicBreakTestCases: BlockParseTestCase[] = [
    {
      input: '---',
      expectedType: BlockType.THEMATIC_BREAK,
      expectedContent: '---',
      description: 'should parse hr with dashes'
    },
    {
      input: '***',
      expectedType: BlockType.THEMATIC_BREAK,
      expectedContent: '***',
      description: 'should parse hr with asterisks'
    },
    {
      input: '___',
      expectedType: BlockType.THEMATIC_BREAK,
      expectedContent: '___',
      description: 'should parse hr with underscores'
    }
  ];

  /**
   * Test cases for basic parsing functionality.
   */
  const basicParseTestCases: ParseTestCase[] = [
    {
      input: '# Heading\n\nParagraph text',
      expectedBlockCount: 2,
      expectedBlockTypes: [BlockType.HEADING, BlockType.PARAGRAPH],
      description: 'should parse heading and paragraph'
    },
    {
      input: 'Para 1\n\nPara 2\n\nPara 3',
      expectedBlockCount: 3,
      expectedBlockTypes: [BlockType.PARAGRAPH, BlockType.PARAGRAPH, BlockType.PARAGRAPH],
      description: 'should parse multiple paragraphs'
    },
    {
      input: '# H1\n## H2\n### H3',
      expectedBlockCount: 3,
      expectedBlockTypes: [BlockType.HEADING, BlockType.HEADING, BlockType.HEADING],
      description: 'should parse multiple headings'
    },
    {
      input: '',
      expectedBlockCount: 0,
      description: 'should return empty result for empty input'
    }
  ];

  /**
   * Test cases for incremental parsing (streaming scenarios).
   */
  const incrementalParseTestCases: IncrementalParseTestCase[] = [
    {
      previousText: '',
      newText: '# Heading',
      expectedBlockCount: 1,
      expectedHasIncomplete: false,
      description: 'should parse first chunk'
    },
    {
      previousText: '# Heading',
      newText: '# Heading\n\nParagraph',
      expectedBlockCount: 2,
      expectedHasIncomplete: false,
      description: 'should parse second chunk'
    },
    {
      previousText: '# Heading\n\nParagr',
      newText: '# Heading\n\nParagraph text',
      expectedBlockCount: 2,
      expectedHasIncomplete: false,
      description: 'should complete incomplete paragraph'
    },
    {
      previousText: '# Heading\n\n',
      newText: '# Heading\n\nParagraph',
      expectedBlockCount: 2,
      expectedHasIncomplete: false,
      description: 'should handle newline at chunk boundary'
    },
    {
      previousText: '',
      newText: '```typescript\nconst x = 1;',
      expectedBlockCount: 1,
      expectedHasIncomplete: true,
      description: 'should detect incomplete code block'
    }
  ];

  /**
   * Test cases for edge cases and error handling.
   */
  const edgeCaseTestCases: ParserEdgeCaseTestCase[] = [
    {
      input: '\n\n\n\n',
      shouldThrow: false,
      description: 'should handle multiple newlines'
    },
    {
      input: '     ', // Only spaces
      shouldThrow: false,
      description: 'should handle whitespace-only input'
    },
    {
      input: '####### Invalid heading', // Too many #
      shouldThrow: false,
      description: 'should handle invalid markdown gracefully'
    }
  ];

  beforeEach(() => {
    parser = new BlockParser();
  });

  describe('Compilation Check', () => {
    it('should instantiate BlockParser', () => {
      expect(parser).toBeDefined();
      expect(parser).toBeInstanceOf(BlockParser);
    });

    it('should call parse() and return ParserResult', () => {
      const result: ParserResult = parser.parse('# Test Heading');
      expect(result).toBeDefined();
      expect(result.blocks).toBeDefined();
      expect(typeof result.hasIncompleteBlock).toBe('boolean');
    });

    it('should call parseIncremental() and return ParserResult', () => {
      const result: ParserResult = parser.parseIncremental('old', 'new');
      expect(result).toBeDefined();
      expect(result.blocks).toBeDefined();
      expect(typeof result.hasIncompleteBlock).toBe('boolean');
    });
  });

  describe('Paragraph Parsing', () => {
    describe('predefined test cases', () => {
      paragraphTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          const result: ParserResult = parser.parse(testCase.input);
          // TODO: Add assertion when implementation is complete
          // expect(result.blocks.length).toBeGreaterThanOrEqual(1);
          // expect(result.blocks[0].type).toBe(testCase.expectedType);
        });
      });
    });
  });

  describe('Heading Parsing', () => {
    describe('predefined test cases', () => {
      headingTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          const result: ParserResult = parser.parse(testCase.input);
          // TODO: Add assertion when implementation is complete
          // expect(result.blocks[0].type).toBe(testCase.expectedType);
          // expect(result.blocks[0].level).toBe(testCase.expectedLevel);
        });
      });
    });
  });

  describe('Code Block Parsing', () => {
    describe('predefined test cases', () => {
      codeBlockTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          const result: ParserResult = parser.parse(testCase.input);
          // TODO: Add assertion when implementation is complete
          // expect(result.blocks[0].type).toBe(testCase.expectedType);
          // expect(result.blocks[0].language).toBe(testCase.expectedLanguage);
        });
      });
    });
  });

  describe('List Parsing', () => {
    describe('predefined test cases', () => {
      listTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          const result: ParserResult = parser.parse(testCase.input);
          // TODO: Add assertion when implementation is complete
          // expect(result.blocks[0].type).toBe(testCase.expectedType);
        });
      });
    });
  });

  describe('Blockquote Parsing', () => {
    describe('predefined test cases', () => {
      blockquoteTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          const result: ParserResult = parser.parse(testCase.input);
          // TODO: Add assertion when implementation is complete
          // expect(result.blocks[0].type).toBe(testCase.expectedType);
        });
      });
    });
  });

  describe('Thematic Break Parsing', () => {
    describe('predefined test cases', () => {
      thematicBreakTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          const result: ParserResult = parser.parse(testCase.input);
          // TODO: Add assertion when implementation is complete
          // expect(result.blocks[0].type).toBe(testCase.expectedType);
        });
      });
    });
  });

  describe('Basic Parsing', () => {
    describe('predefined test cases', () => {
      basicParseTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          const result: ParserResult = parser.parse(testCase.input);
          // TODO: Add assertion when implementation is complete
          // expect(result.blocks.length).toBe(testCase.expectedBlockCount);
        });
      });
    });
  });

  describe('Incremental Parsing', () => {
    describe('predefined test cases', () => {
      incrementalParseTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          const result: ParserResult = parser.parseIncremental(
            testCase.previousText,
            testCase.newText
          );
          // TODO: Add assertion when implementation is complete
          // expect(result.blocks.length).toBe(testCase.expectedBlockCount);
          // expect(result.hasIncompleteBlock).toBe(testCase.expectedHasIncomplete);
        });
      });
    });

    it('should optimize by only processing changed content', () => {
      const previous = '# Heading\n\nPara 1\n\nPara 2';
      const next = '# Heading\n\nPara 1\n\nPara 2 updated';
      const result = parser.parseIncremental(previous, next);
      expect(result).toBeDefined();
      // TODO: Verify optimization in implementation
    });
  });

  describe('Edge Cases', () => {
    describe('predefined test cases', () => {
      edgeCaseTestCases.forEach((testCase) => {
        it(testCase.description, () => {
          if (testCase.shouldThrow) {
            // TODO: Add error assertion when implementation is complete
            // expect(() => parser.parse(testCase.input)).toThrow();
          } else {
            const result: ParserResult = parser.parse(testCase.input);
            expect(result).toBeDefined();
          }
        });
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed block types', () => {
      const input = '# Title\n\nIntro paragraph.\n\n```javascript\ncode\n```\n\n> Quote\n\n---';
      const result = parser.parse(input);
      expect(result).toBeDefined();
      // TODO: Verify all block types are parsed correctly
    });

    it('should handle nested formatting within blocks', () => {
      const input = '**Bold** and *italic* in paragraph';
      const result = parser.parse(input);
      expect(result).toBeDefined();
      // TODO: Verify inline formatting is preserved
    });

    it('should handle streaming chunk accumulation', () => {
      const chunks = ['# He', 'ading', '\n\nPara', 'graph'];
      let current = '';
      chunks.forEach(chunk => {
        const result = parser.parseIncremental(current, current + chunk);
        current += chunk;
        expect(result).toBeDefined();
      });
    });
  });

  describe('Parser Extensions', () => {
    it('should support custom token handler without changing parser switch', () => {
      const registry: BlockComponentRegistry = {
        componentMap: new Map(),
        matchers: [],
        parserExtensions: [
          {
            pluginName: 'callout-parser',
            extension: {
              type: 'paragraph',
              match: (token: any) => typeof token.text === 'string' && token.text.startsWith(':::callout'),
              handler: ({ token, baseBlock }) => {
                const lines = String(token.text || '').split('\n');
                const firstLine = lines[0] || '';
                const calloutType = firstLine.replace(':::callout', '').trim() || 'note';
                const body = lines.slice(1).join('\n').replace(/\n?:::\s*$/, '').trim();

                return {
                  ...baseBlock,
                  id: `${baseBlock.id}-${calloutType}`,
                  type: BlockType.CALLOUT,
                  content: body || calloutType
                };
              }
            }
          }
        ]
      };

      const parserWithExtension = new BlockParser(registry);
      const result = parserWithExtension.parse(':::callout warning\nWatch out\n:::');

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe(BlockType.CALLOUT);
      expect(result.blocks[0].content).toBe('Watch out');
    });

    it('should allow extensions to override built-in token mapping', () => {
      const registry: BlockComponentRegistry = {
        componentMap: new Map(),
        matchers: [],
        parserExtensions: [
          {
            pluginName: 'heading-override',
            extension: {
              type: 'heading',
              handler: ({ token, baseBlock, context }) => ({
                ...baseBlock,
                type: BlockType.PARAGRAPH,
                content: `[custom] ${context.extractText(token)}`
              })
            }
          }
        ]
      };

      const parserWithExtension = new BlockParser(registry);
      const result = parserWithExtension.parse('# Title');

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe(BlockType.PARAGRAPH);
      expect(result.blocks[0].content).toContain('[custom] Title');
    });
  });
});
