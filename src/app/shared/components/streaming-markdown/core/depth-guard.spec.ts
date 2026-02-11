import { DepthGuard, MAX_NEST_DEPTH } from './depth-guard';
import { BlockType, BlockquoteBlock, ListBlock, ParagraphBlock } from './models';

describe('DepthGuard', () => {
  const listBlock: ListBlock = {
    id: 'test-list-1',
    type: BlockType.LIST,
    content: 'test content',
    subtype: 'unordered',
    items: ['item1', 'item2'],
    isComplete: true,
    position: 0
  };

  const blockquoteBlock: BlockquoteBlock = {
    id: 'test-bq-1',
    type: BlockType.BLOCKQUOTE,
    content: 'test quote',
    blocks: [],
    isComplete: true,
    position: 0
  };

  const paragraphBlock: ParagraphBlock = {
    id: 'test-para-1',
    type: BlockType.PARAGRAPH,
    content: 'test paragraph',
    isComplete: true,
    position: 0
  };

  it('exposes MAX_NEST_DEPTH=2', () => {
    expect(MAX_NEST_DEPTH).toBe(2);
  });

  it('allows nesting list/blockquote within depth limit', () => {
    expect(DepthGuard.canNest(listBlock, 0)).toBe(true);
    expect(DepthGuard.canNest(listBlock, 2)).toBe(true);
    expect(DepthGuard.canNest(listBlock, 3)).toBe(false);

    expect(DepthGuard.canNest(blockquoteBlock, 0)).toBe(true);
    expect(DepthGuard.canNest(blockquoteBlock, 2)).toBe(true);
    expect(DepthGuard.canNest(blockquoteBlock, 3)).toBe(false);
  });

  it('never allows non-nestable block types', () => {
    expect(DepthGuard.canNest(paragraphBlock, 0)).toBe(false);
    expect(DepthGuard.canNest(paragraphBlock, 2)).toBe(false);
  });

  it('reports max-depth threshold correctly', () => {
    expect(DepthGuard.isAtMaxDepth(0)).toBe(false);
    expect(DepthGuard.isAtMaxDepth(1)).toBe(false);
    expect(DepthGuard.isAtMaxDepth(2)).toBe(true);
    expect(DepthGuard.isAtMaxDepth(3)).toBe(true);
  });
});
