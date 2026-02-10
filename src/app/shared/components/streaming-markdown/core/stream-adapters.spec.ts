import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';
import { fetchStreamToMarkdownStream$, sseToMarkdownStream$ } from './stream-adapters';

class FakeEventSource {
  private listeners = new Map<string, Set<(event: any) => void>>();
  closed = false;

  addEventListener(type: string, listener: (event: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, event: any): void {
    for (const listener of this.listeners.get(type) || []) {
      listener(event);
    }
  }

  close(): void {
    this.closed = true;
  }
}

describe('stream-adapters', () => {
  describe('sseToMarkdownStream$', () => {
    it('should emit message data from EventSource', async () => {
      const eventSource = new FakeEventSource();
      const outputPromise = firstValueFrom(sseToMarkdownStream$(eventSource as unknown as EventSource));

      eventSource.emit('message', { data: 'hello markdown' });

      await expect(outputPromise).resolves.toBe('hello markdown');
    });

    it('should complete and close event source when aborted', async () => {
      const eventSource = new FakeEventSource();
      const controller = new AbortController();

      const completion = firstValueFrom(
        sseToMarkdownStream$(eventSource as unknown as EventSource, { signal: controller.signal }).pipe(
          toArray()
        )
      );

      controller.abort();

      await expect(completion).resolves.toEqual([]);
      expect(eventSource.closed).toBe(true);
    });
  });

  describe('fetchStreamToMarkdownStream$', () => {
    it('should parse SSE-style chunks from fetch readable stream', async () => {
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('data: hello\n\n'));
          controller.enqueue(encoder.encode('data: world\n\n'));
          controller.close();
        }
      });

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(stream, { status: 200 })
      );

      vi.stubGlobal('fetch', fetchMock);

      const chunks = await firstValueFrom(
        fetchStreamToMarkdownStream$('https://example.com/stream').pipe(
          take(2),
          toArray()
        )
      );

      expect(chunks).toEqual(['hello', 'world']);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should emit plain text chunks when response is not SSE framed', async () => {
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('raw chunk text'));
          controller.close();
        }
      });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream, { status: 200 })));

      const chunks = await firstValueFrom(
        fetchStreamToMarkdownStream$('https://example.com/raw').pipe(toArray())
      );

      expect(chunks).toEqual(['raw chunk text']);
    });
  });
});
