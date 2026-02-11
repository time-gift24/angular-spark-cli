import { BlockParser } from './block-parser';
import { BlockType, MarkdownBlock, CodeBlock, BlockquoteBlock, ListBlock } from './models';

describe('BlockParser incremental fence-aware boundary', () => {
  it('keeps stable block ids and content unchanged across incremental parses', () => {
    const parser = new BlockParser();
    const chunk1 = ['First paragraph.', '', 'Second line in stable block.', ''].join('\n');
    const chunk2 = `${chunk1}Tail line still streaming`;

    const first = parser.parseIncremental('', chunk1);
    const second = parser.parseIncremental(chunk1, chunk2);

    expect(first.blocks.length).toBeGreaterThan(0);
    expect(second.blocks.length).toBeGreaterThan(0);
    expect(second.blocks[0].id).toBe(first.blocks[0].id);
    expect(second.blocks[0].content).toBe(first.blocks[0].content);
  });

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

  it('parses continuously when no stable boundary is present yet', () => {
    const parser = new BlockParser();
    const chunk1 = '```typescript\nconst value = 1;';
    const chunk2 = `${chunk1}\nconst next = value + 1;`;

    const first = parser.parseIncremental('', chunk1);
    const second = parser.parseIncremental(chunk1, chunk2);

    expect(first.blocks.length).toBe(1);
    expect(second.blocks.length).toBe(1);
    const code = second.blocks[0] as CodeBlock;
    expect(code.type).toBe(BlockType.CODE_BLOCK);
    expect(code.rawContent || code.content).toContain('const next = value + 1;');
  });
});

describe('BlockParser list parsing', () => {
  it('keeps nested lists inside the parent list item', () => {
    const parser = new BlockParser();
    const markdown = ['- parent', '  - child'].join('\n');

    const result = parser.parse(markdown);
    const rootList = result.blocks[0] as ListBlock;

    expect(rootList.type).toBe(BlockType.LIST);
    expect(rootList.items.length).toBe(1);
    expect(rootList.items[0].content).toBe('parent');
    expect(rootList.items[0].blocks?.length).toBe(1);

    const nestedList = rootList.items[0].blocks?.[0] as ListBlock;
    expect(nestedList.type).toBe(BlockType.LIST);
    expect(nestedList.items.length).toBe(1);
    expect(nestedList.items[0].content).toBe('child');
  });

  it('preserves inline tokens for rich list item rendering', () => {
    const parser = new BlockParser();
    const markdown = '- **bold** and `code` with [link](https://example.com)';

    const result = parser.parse(markdown);
    const list = result.blocks[0] as ListBlock;
    const item = list.items[0];
    const children = item.children || [];

    expect(children.some((inline) => inline.type === 'bold')).toBe(true);
    expect(children.some((inline) => inline.type === 'code')).toBe(true);
    expect(children.some((inline) => inline.type === 'link')).toBe(true);
  });
});

describe('BlockParser math formula parsing', () => {
  it('parses inline math delimited by single dollar', () => {
    const parser = new BlockParser();
    const result = parser.parse('Inline math $E=mc^2$ in paragraph.');
    const paragraph = result.blocks[0] as any;
    const children = paragraph.children || [];

    expect(children.some((inline: any) => inline.type === 'math' && inline.content === 'E=mc^2')).toBe(true);
    expect(children.some((inline: any) => inline.type === 'text' && inline.content.includes('Inline math'))).toBe(true);
  });

  it('parses display math delimited by double dollar', () => {
    const parser = new BlockParser();
    const result = parser.parse('$$\\int_0^1 x^2 dx$$');
    const paragraph = result.blocks[0] as any;
    const children = paragraph.children || [];
    const mathInline = children.find((inline: any) => inline.type === 'math');

    expect(mathInline).toBeTruthy();
    expect(mathInline.content).toBe('\\int_0^1 x^2 dx');
    expect(mathInline.displayMode).toBe(true);
  });

  it('keeps escaped dollar signs as plain text', () => {
    const parser = new BlockParser();
    const result = parser.parse('Price is \\$99 and math is $x+1$.');
    const paragraph = result.blocks[0] as any;
    const children = paragraph.children || [];
    const textContent = children
      .filter((inline: any) => inline.type === 'text')
      .map((inline: any) => inline.content)
      .join('');

    expect(textContent).toContain('$99');
    expect(children.some((inline: any) => inline.type === 'math' && inline.content === 'x+1')).toBe(true);
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
      const items = (block as any).items || [];
      for (const item of items) {
        if (!Array.isArray(item?.blocks) || item.blocks.length === 0) {
          continue;
        }

        const nested = findFirstCodeBlock(item.blocks);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return undefined;
}
