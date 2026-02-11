import { BlockType, BlockquoteBlock, ListBlock, ParagraphBlock } from '../../core/models';
import { DepthGuard, MAX_NEST_DEPTH } from '../../core/depth-guard';

describe('BlockRouter Nested Rendering Logic', () => {
  it('allows list nesting up to depth 2', () => {
    const listBlock: ListBlock = {
      id: 'list-1',
      type: BlockType.LIST,
      content: 'item',
      items: ['item'],
      subtype: 'unordered',
      isComplete: true,
      position: 0
    };

    expect(DepthGuard.canNest(listBlock, 0)).toBe(true);
    expect(DepthGuard.canNest(listBlock, 2)).toBe(true);
    expect(DepthGuard.canNest(listBlock, 3)).toBe(false);
  });

  it('allows blockquote nesting up to depth 2', () => {
    const blockquote: BlockquoteBlock = {
      id: 'bq-1',
      type: BlockType.BLOCKQUOTE,
      content: 'quote',
      blocks: [],
      isComplete: true,
      position: 0
    };

    expect(DepthGuard.canNest(blockquote, 0)).toBe(true);
    expect(DepthGuard.canNest(blockquote, 2)).toBe(true);
    expect(DepthGuard.canNest(blockquote, 3)).toBe(false);
  });

  it('supports nested list and blockquote data shape', () => {
    const nestedParagraph: ParagraphBlock = {
      id: 'para-1',
      type: BlockType.PARAGRAPH,
      content: 'nested paragraph',
      isComplete: true,
      position: 0
    };

    const nestedList: ListBlock = {
      id: 'nested-list',
      type: BlockType.LIST,
      content: 'child',
      items: ['child'],
      subtype: 'unordered',
      isComplete: true,
      position: 0
    };

    const blockquote: BlockquoteBlock = {
      id: 'bq-2',
      type: BlockType.BLOCKQUOTE,
      content: 'quote content',
      blocks: [nestedParagraph, nestedList],
      isComplete: true,
      position: 0
    };

    expect(blockquote.blocks.length).toBe(2);
    expect(blockquote.blocks[0].type).toBe(BlockType.PARAGRAPH);
    expect(blockquote.blocks[1].type).toBe(BlockType.LIST);
  });

  it('keeps depth constants aligned', () => {
    expect(MAX_NEST_DEPTH).toBe(2);
    expect(DepthGuard.isAtMaxDepth(1)).toBe(false);
    expect(DepthGuard.isAtMaxDepth(2)).toBe(true);
  });
});
