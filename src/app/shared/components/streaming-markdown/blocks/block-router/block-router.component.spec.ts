import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { MarkdownBlockRouterComponent } from './block-router.component';
import { MarkdownBlock, BlockType } from '../../core/models';

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

// Mock child components for testing
@Component({
  selector: 'app-markdown-heading',
  standalone: true,
  template: '<div>Heading Component</div>'
})
class MockHeadingComponent {
  @Input() level!: number;
  @Input() content!: string;
  @Input() streaming: boolean = false;
}

@Component({
  selector: 'app-markdown-paragraph',
  standalone: true,
  template: '<div>Paragraph Component</div>'
})
class MockParagraphComponent {
  @Input() content!: string;
  @Input() inlines?: any[];
  @Input() streaming: boolean = false;
}

@Component({
  selector: 'app-markdown-code',
  standalone: true,
  template: '<div>Code Component</div>'
})
class MockCodeComponent {
  @Input() code!: string;
  @Input() language: string = 'text';
  @Input() streaming: boolean = false;
}

@Component({
  selector: 'app-markdown-list',
  standalone: true,
  template: '<div>List Component</div>'
})
class MockListComponent {
  @Input() items!: MarkdownBlock[];
  @Input() ordered: boolean = false;
  @Input() depth: number = 0;
}

@Component({
  selector: 'app-markdown-blockquote',
  standalone: true,
  template: '<div>Blockquote Component</div>'
})
class MockBlockquoteComponent {
  @Input() content!: string;
  @Input() streaming: boolean = false;
}

const createMockBlock = (type: BlockType, content: string = 'test'): MarkdownBlock => ({
  id: `block-${Math.random()}`,
  type,
  content,
  isComplete: true,
  position: 0
});

describe('MarkdownBlockRouterComponent', () => {
  let component: MarkdownBlockRouterComponent;
  let fixture: ComponentFixture<MarkdownBlockRouterComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        MarkdownBlockRouterComponent,
        MockHeadingComponent,
        MockParagraphComponent,
        MockCodeComponent,
        MockListComponent,
        MockBlockquoteComponent
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
      const block = createMockBlock(BlockType.HEADING, 'Test Heading');
      block.level = 2;
      component.block = block;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('app-markdown-heading');
      expect(heading).toBeTruthy();
      expect(heading.getAttribute('ng-reflect-level')).toBe('2');
    });

    it('should pass content to heading component', () => {
      const block = createMockBlock(BlockType.HEADING, 'Heading Content');
      block.level = 1;
      component.block = block;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('app-markdown-heading');
      expect(heading.getAttribute('ng-reflect-content')).toBe('Heading Content');
    });

    it('should use default level 1 if not provided', () => {
      const block = createMockBlock(BlockType.HEADING, 'Heading');
      component.block = block;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('app-markdown-heading');
      expect(heading.getAttribute('ng-reflect-level')).toBe('1');
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

    it('should pass content to paragraph component', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'Paragraph content');
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph.getAttribute('ng-reflect-content')).toBe('Paragraph content');
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

    it('should pass rawContent to code component if available', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'const x = 1;');
      block.rawContent = 'const x = 1;';
      component.block = block;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code.getAttribute('ng-reflect-code')).toBe('const x = 1;');
    });

    it('should fall back to content if rawContent not available', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'code');
      component.block = block;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code.getAttribute('ng-reflect-code')).toBe('code');
    });

    it('should pass language to code component', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'code');
      block.language = 'typescript';
      component.block = block;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code.getAttribute('ng-reflect-language')).toBe('typescript');
    });

    it('should use default language text if not provided', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'code');
      component.block = block;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code.getAttribute('ng-reflect-language')).toBe('text');
    });
  });

  describe('Routing - List Blocks', () => {
    it('should route LIST type to list component', () => {
      const block = createMockBlock(BlockType.LIST, '');
      block.items = [];
      component.block = block;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('app-markdown-list');
      expect(list).toBeTruthy();
    });

    it('should pass items to list component', () => {
      const items = [
        createMockBlock(BlockType.PARAGRAPH, 'Item 1'),
        createMockBlock(BlockType.PARAGRAPH, 'Item 2')
      ];
      const block = createMockBlock(BlockType.LIST, '');
      block.items = items;
      component.block = block;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('app-markdown-list');
      expect(list).toBeTruthy();
    });

    it('should pass ordered=false for unordered list subtype', () => {
      const block = createMockBlock(BlockType.LIST, '');
      block.items = [];
      block.subtype = 'unordered' as any;
      component.block = block;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('app-markdown-list');
      expect(list.getAttribute('ng-reflect-ordered')).toBe('false');
    });

    it('should pass ordered=true for ordered list subtype', () => {
      const block = createMockBlock(BlockType.LIST, '');
      block.items = [];
      block.subtype = 'ordered' as any;
      component.block = block;
      fixture.detectChanges();

      const list = fixture.nativeElement.querySelector('app-markdown-list');
      expect(list.getAttribute('ng-reflect-ordered')).toBe('true');
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

    it('should pass content to blockquote component', () => {
      const block = createMockBlock(BlockType.BLOCKQUOTE, 'This is a quote');
      component.block = block;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('app-markdown-blockquote');
      expect(blockquote.getAttribute('ng-reflect-content')).toBe('This is a quote');
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

    it('should use content for fallback', () => {
      const block = createMockBlock(BlockType.UNKNOWN as any, 'Fallback content');
      component.block = block;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph.getAttribute('ng-reflect-content')).toBe('Fallback content');
    });

    it('should fallback to paragraph for RAW type', () => {
      const block = createMockBlock(BlockType.RAW, 'Raw content');
      component.block = block;
      fixture.detectChanges();

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
    it('should pass streaming=false when isComplete is true', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'test');
      component.block = block;
      component.isComplete = true;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph.getAttribute('ng-reflect-streaming')).toBe('false');
    });

    it('should pass streaming=true when isComplete is false', () => {
      const block = createMockBlock(BlockType.PARAGRAPH, 'test');
      component.block = block;
      component.isComplete = false;
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('app-markdown-paragraph');
      expect(paragraph.getAttribute('ng-reflect-streaming')).toBe('true');
    });

    it('should propagate streaming state to heading', () => {
      const block = createMockBlock(BlockType.HEADING, 'test');
      component.block = block;
      component.isComplete = false;
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('app-markdown-heading');
      expect(heading.getAttribute('ng-reflect-streaming')).toBe('true');
    });

    it('should propagate streaming state to code', () => {
      const block = createMockBlock(BlockType.CODE_BLOCK, 'code');
      component.block = block;
      component.isComplete = false;
      fixture.detectChanges();

      const code = fixture.nativeElement.querySelector('app-markdown-code');
      expect(code.getAttribute('ng-reflect-streaming')).toBe('true');
    });

    it('should propagate streaming state to blockquote', () => {
      const block = createMockBlock(BlockType.BLOCKQUOTE, 'quote');
      component.block = block;
      component.isComplete = false;
      fixture.detectChanges();

      const blockquote = fixture.nativeElement.querySelector('app-markdown-blockquote');
      expect(blockquote.getAttribute('ng-reflect-streaming')).toBe('true');
    });
  });

  describe('ngOnChanges Behavior', () => {
    it('should log warning for unknown block type', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const block = createMockBlock(BlockType.CALLOUT, 'callout content');
      component.block = block;
      component.ngOnChanges({
        block: {
          currentValue: block,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[MarkdownBlockRouter] Unknown block type: callout, rendering as paragraph'
      );

      consoleSpy.mockRestore();
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
