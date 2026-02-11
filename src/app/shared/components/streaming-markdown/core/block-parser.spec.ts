import { BlockParser } from './block-parser';
import { BlockType, MarkdownBlock, CodeBlock, BlockquoteBlock } from './models';

describe('BlockParser incremental fence-aware boundary', () => {
  it('does not truncate top-level fenced code content with blank lines', () => {
    const parser = new BlockParser();

    const chunk1 = [
      'Intro',
      '',
      '```typescript',
      'const first = 1;',
      '',
      'const second = 2;'
    ].join('\n');

    const chunk2 = `${chunk1}\n\`\`\`\n\nTail paragraph\n`;

    parser.parseIncremental('', chunk1);
    const result = parser.parseIncremental(chunk1, chunk2);

    const codeBlock = findFirstCodeBlock(result.blocks);
    expect(codeBlock).toBeTruthy();
    expect(codeBlock!.rawContent || codeBlock!.content).toContain('const first = 1;');
    expect(codeBlock!.rawContent || codeBlock!.content).toContain('const second = 2;');
    expect(codeBlock!.rawContent || codeBlock!.content).toContain('\n\n');
  });

  it('does not truncate fenced code inside blockquote during streaming', () => {
    const parser = new BlockParser();

    const chunk1 = [
      '> Quote intro',
      '>',
      '> ```typescript',
      '> const a = 1;',
      '>',
      '> const b = 2;'
    ].join('\n');

    const chunk2 = `${chunk1}\n> \`\`\`\n\nAfter quote\n`;

    parser.parseIncremental('', chunk1);
    const result = parser.parseIncremental(chunk1, chunk2);

    const quote = result.blocks.find((block) => block.type === BlockType.BLOCKQUOTE) as BlockquoteBlock | undefined;
    expect(quote).toBeTruthy();

    const nestedCode = quote ? findFirstCodeBlock(quote.blocks) : undefined;
    expect(nestedCode).toBeTruthy();
    expect(nestedCode!.rawContent || nestedCode!.content).toContain('const a = 1;');
    expect(nestedCode!.rawContent || nestedCode!.content).toContain('const b = 2;');
  });
});

function findFirstCodeBlock(blocks: MarkdownBlock[]): CodeBlock | undefined {
  for (const block of blocks) {
    if (block.type === BlockType.CODE_BLOCK) {
      return block as CodeBlock;
    }

    if (block.type === BlockType.BLOCKQUOTE) {
      const nested = findFirstCodeBlock((block as BlockquoteBlock).blocks);
      if (nested) {
        return nested;
      }
    }

    if (block.type === BlockType.LIST) {
      const items = block.items || [];
      for (const item of items) {
        if (typeof item === 'string') {
          continue;
        }
        const nested = findFirstCodeBlock([item]);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return undefined;
}
