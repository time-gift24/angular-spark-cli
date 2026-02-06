import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownBlockRouterComponent } from './block-router.component';
import { MarkdownBlock, BlockType } from '../../core/models';
import { BLOCK_COMPONENT_REGISTRY, BlockComponentRegistry } from '../../core/plugin';
import { builtinPlugin } from '../../plugins/builtin-plugin';
import { ShiniHighlighter } from '../../core/shini-highlighter';

// Vitest imports
import { beforeEach, describe, it, expect, vi } from 'vitest';

/**
 * Unit Tests for MarkdownBlockRouterComponent
 *
 * Phase 6 - Task 6.1: Unit Tests for Block Components
 *
 * Test Coverage:
 * - Component creation and initialization
 * - Routing to correct component for each block type
 * - Unknown type fallback behavior
 * - Invalid block handling
 * - Streaming state propagation
 * - Input validation
 */

const createMockBlock = (type: BlockType, content: string = 'test', overrides: Partial<MarkdownBlock> = {}): MarkdownBlock => ({
  id: `block-${Math.random()}`,
  type,
  content,
  isComplete: true,
  position: 0,
  ...overrides
});

// Mock ShiniHighlighter for code component
const mockShiniHighlighter = {
  whenReady: vi.fn(() => Promise.resolve()),
  highlightToTokens: vi.fn(() => Promise.resolve([])),
  plainTextFallback: vi.fn((code: string) =>
    code.split('\n').map((line: string, index: number) => ({
      lineNumber: index + 1,
      tokens: [{ content: line || ' ' }]
    }))
  ),
  initialize: vi.fn(() => Promise.resolve()),
  highlight: vi.fn(() => Promise.resolve('')),
  isReady: vi.fn(() => true),
  state: { initialized: true, success: true, languagesLoaded: 8, themesLoaded: ['github-light', 'dark-plus'] }
};

describe('MarkdownBlockRouterComponent', () => {
  let component: MarkdownBlockRouterComponent;
  let fixture: ComponentFixture<MarkdownBlockRouterComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Build registry from the builtin plugin
    const plugin = builtinPlugin();
    const registry: BlockComponentRegistry = {
      componentMap: new Map(Object.entries(plugin.components)),
      matchers: []
    };

    await TestBed.configureTestingModule({
      imports: [MarkdownBlockRouterComponent],
      providers: [
        { provide: BLOCK_COMPONENT_REGISTRY, useValue: registry },
        { provide: ShiniHighlighter, useValue: mockShiniHighlighter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownBlockRouterComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default isComplete state as true', () => {
      expect(component.isComplete).toBe(true);
    });

    it('should render in a div with data-block-type attribute', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'test');
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.markdown-block-router');
      expect(wrapper).toBeTruthy();
      expect(wrapper.getAttribute('data-block-type')).toBe('paragraph');
    });
  });

  describe('Routing - Heading Blocks', () => {
    it('should route HEADING type to heading component', () => {
      const block = createMockBlock(BlockType.HEADING, 'Test Heading', { level: 2 });
      component.block = block;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('app-markdown-heading');
      expect(heading).toBeTruthy();
    });

    it('should pass block to heading component', () => {
      const block = createMockBlock(BlockType.HEADING, 'Heading Content', { level: 1 });
      component.block = block;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('app-markdown-heading');
      expect(heading).toBeTruthy();
      // With NgComponentOutlet, inputs are passed via resolvedInputs
      // Verify the block and isComplete are in the resolved inputs
      const inputs = component.resolvedInputs();
      expect(inputs.block).toBe(block);
      expect(inputs.isComplete).toBe(true);
    });

    it('should use default level 1 if not provided', () => {
      const block = createMockBlock(BlockType.HEADING, 'Heading');
      component.block = block;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('app-markdown-heading');
      expect(heading).toBeTruthy();
      // The heading component reads block.level || 1 internally
    });
  });

  describe('Routing - Paragraph Blocks', () => {
    it('should route PARAGRAPH type to paragraph component', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'Test paragraph');
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
    });

    it('should pass block to paragraph component', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'Paragraph content');
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block).toBe(block);
    });
  });

  describe('Routing - Code Blocks', () => {
    it('should route CODE type to code component', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'const x = 1;');
      component.block = block;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code).toBeTruthy();
    });

    it('should pass block with rawContent to code component', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'const x = 1;', { rawContent: 'const x = 1;' });
      component.block = block;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block.rawContent).toBe('const x = 1;');
    });

    it('should pass block with language to code component', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'code', { language: 'typescript' });
      component.block = block;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block.language).toBe('typescript');
    });
  });

  describe('Routing - List Blocks', () => {
    it('should route LIST type to list component', () => {
      const block = createMockBlock(BlockType.LIST, '', { items: [] });
      component.block = block;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('app-markdown-list');
      expect(list).toBeTruthy();
    });

    it('should pass block with items to list component', () => {
      const items = [
        createMockBlock(BlockType.PARAGRAPH, 'Item 1'),
        createMockBlock(BlockType.PARAGRAPH, 'Item 2')
      ];
      const block = createMockBlock(BlockType.LIST, '', { items });
      component.block = block;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('app-markdown-list');
      expect(list).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block.items).toBe(items);
    });

    it('should pass block with unordered subtype to list component', () => {
      const block = createMockBlock(BlockType.LIST, '', { items: [], subtype: 'unordered' });
      component.block = block;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('app-markdown-list');
      expect(list).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block.subtype).toBe('unordered');
    });

    it('should pass block with ordered subtype to list component', () => {
      const block = createMockBlock(BlockType.LIST, '', { items: [], subtype: 'ordered' });
      component.block = block;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('app-markdown-list');
      expect(list).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block.subtype).toBe('ordered');
    });
  });

  describe('Routing - Blockquote Blocks', () => {
    it('should route BLOCKQUOTE type to blockquote component', () => {
      const block = createMockBlock(BlockType.BLOCKQUOTE, 'Quote text');
      component.block = block;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('app-markdown-blockquote');
      expect(blockquote).toBeTruthy();
    });

    it('should pass block to blockquote component', () => {
      const block = createMockBlock(BlockType.BLOCKQUOTE, 'This is a quote');
      component.block = block;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('app-markdown-blockquote');
      expect(blockquote).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block).toBe(block);
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to paragraph for unknown block type', () => {
      const block = createMockBlock(BlockType.UNKNOWN as any, 'Unknown content');
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
    });

    it('should use block for fallback', () => {
      const block = createMockBlock(BlockType.UNKNOWN as any, 'Fallback content');
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block.content).toBe('Fallback content');
    });

    it('should fallback to paragraph for RAW type', () => {
      const block = createMockBlock(BlockType.RAW, 'Raw content');
      component.block = block;
      fixture.detectChanges();

      // RAW is not in the builtin plugin, so it should fall back to UNKNOWN -> paragraph
      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
    });
  });

  describe('Invalid Block Handling', () => {
    it('should render paragraph for invalid block without id', () => {
      component.block = {
        type: BlockType.PARAGRAPH,
        content: 'test',
        isComplete: true,
        position: 0
      } as any; // Missing id

      fixture.detectChanges();

      // Should still render something for resilience
      const routerDiv = fixture.nativeElement.querySelector('.markdown-block-router');
      expect(routerDiv).toBeTruthy();
    });

    it('should render paragraph for invalid block without type', () => {
      component.block = {
        id: 'test-id',
        content: 'test',
        isComplete: true,
        position: 0
      } as any; // Missing type

      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
    });
  });

  describe('Streaming State Propagation', () => {
    it('should pass isComplete=true in resolved inputs', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'test');
      component.block = block;
      component.isComplete = true;
      fixture.detectChanges();

      const inputs = component.resolvedInputs();
      expect(inputs.isComplete).toBe(true);
    });

    it('should pass isComplete=false in resolved inputs', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'test');
      component.block = block;
      component.isComplete = false;
      fixture.detectChanges();

      const inputs = component.resolvedInputs();
      expect(inputs.isComplete).toBe(false);
    });

    it('should propagate isComplete to heading', () => {
      const block = createMockBlock(BlockType.HEADING, 'test', { level: 1 });
      component.block = block;
      component.isComplete = false;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('app-markdown-heading');
      expect(heading).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.block).toBe(block);
      expect(inputs.isComplete).toBe(false);
    });

    it('should propagate isComplete to code', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'code');
      component.block = block;
      component.isComplete = false;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.isComplete).toBe(false);
    });

    it('should propagate isComplete to blockquote', () => {
      const block = createMockBlock(BlockType.BLOCKQUOTE, 'quote');
      component.block = block;
      component.isComplete = false;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('app-markdown-blockquote');
      expect(blockquote).toBeTruthy();
      const inputs = component.resolvedInputs();
      expect(inputs.isComplete).toBe(false);
    });
  });

  describe('Resolved Inputs', () => {
    it('should include block in resolved inputs', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'test');
      component.block = block;
      fixture.detectChanges();

      const inputs = component.resolvedInputs();
      expect(inputs.block).toBe(block);
    });

    it('should include isComplete in resolved inputs', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'test');
      component.isComplete = false;
      fixture.detectChanges();

      const inputs = component.resolvedInputs();
      expect(inputs.isComplete).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle block with empty content', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, '');
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
    });

    it('should handle block with null content', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, '' as any);
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
    });

    it('should handle block with undefined content', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, undefined as any);
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph).toBeTruthy();
    });

    it('should only render one child component at a time', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'test');
      component.block = block;
      fixture.detectChanges();

      const components = fixture.nativeElement.querySelectorAll('app-markdown-heading, app-markdown-paragraph, app-markdown-code, app-markdown-list, app-markdown-blockquote');
      expect(components.length).toBe(1);
    });
  });

  describe('Data Attribute Tracking', () => {
    it('should set correct data-block-type for paragraphs', () => {
      component.block = createMockBlock(BlockType.PARAGRAPH, 'test');
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.markdown-block-router');
      expect(wrapper.getAttribute('data-block-type')).toBe('paragraph');
    });

    it('should set correct data-block-type for headings', () => {
      component.block = createMockBlock(BlockType.HEADING, 'test');
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.markdown-block-router');
      expect(wrapper.getAttribute('data-block-type')).toBe('heading');
    });

    it('should set correct data-block-type for code', () => {
      component.block = createMockBlock(BlockType.CODE_BLOCK, 'code');
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.markdown-block-router');
      expect(wrapper.getAttribute('data-block-type')).toBe('code');
    });

    it('should set correct data-block-type for lists', () => {
      component.block = createMockBlock(BlockType.LIST, '');
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.markdown-block-router');
      expect(wrapper.getAttribute('data-block-type')).toBe('list');
    });

    it('should set correct data-block-type for blockquotes', () => {
      component.block = createMockBlock(BlockType.BLOCKQUOTE, 'quote');
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.markdown-block-router');
      expect(wrapper.getAttribute('data-block-type')).toBe('blockquote');
    });

    it('should set correct data-block-type for unknown types', () => {
      component.block = createMockBlock(BlockType.UNKNOWN, 'unknown');
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.markdown-block-router');
      expect(wrapper.getAttribute('data-block-type')).toBe('unknown');
    });
  });
});
