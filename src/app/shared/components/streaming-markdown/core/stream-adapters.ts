import { Observable } from 'rxjs';

export interface SseAdapterOptions {
  eventName?: string;
  signal?: AbortSignal;
}

export interface FetchStreamAdapterOptions {
  request?: RequestInit;
  signal?: AbortSignal;
  decoder?: TextDecoder;
}

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

function parseSseDataChunk(rawChunk: string): string[] {
  const payloads: string[] = [];
  const events = rawChunk.split('\n\n');

  for (const event of events) {
    if (!event.trim()) {
      continue;
    }

    const dataLines = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart());

    if (dataLines.length > 0) {
      payloads.push(dataLines.join('\n'));
    }
  }

  return payloads;
}

export function sseToMarkdownStream$(
  source: string | EventSource,
  options: SseAdapterOptions = {}
): Observable<string> {
  const { eventName = 'message', signal } = options;

  return new Observable<string>((subscriber) => {
    const eventSource = typeof source === 'string' ? new EventSource(source) : source;

    const onMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        subscriber.next(event.data);
      }
    };

    const onError = (event: Event) => {
      subscriber.error(toError(event, 'SSE stream failed'));
    };

    eventSource.addEventListener(eventName, onMessage as EventListener);
    eventSource.addEventListener('error', onError);

    const onAbort = () => {
      subscriber.complete();
      eventSource.close();
    };

    signal?.addEventListener('abort', onAbort);

    return () => {
      signal?.removeEventListener('abort', onAbort);
      eventSource.removeEventListener(eventName, onMessage as EventListener);
      eventSource.removeEventListener('error', onError);
      eventSource.close();
    };
  });
}

export function fetchStreamToMarkdownStream$(
  input: RequestInfo | URL,
  options: FetchStreamAdapterOptions = {}
): Observable<string> {
  const { request, signal, decoder = new TextDecoder() } = options;

  return new Observable<string>((subscriber) => {
    const abortController = new AbortController();

    const relayAbort = () => abortController.abort();
    signal?.addEventListener('abort', relayAbort);

    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch(input, {
          ...request,
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`Fetch stream request failed: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Fetch stream response body is empty');
        }

        const reader = response.body.getReader();
        let buffer = '';

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          if (!value) {
            continue;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const segments = buffer.split('\n\n');
          buffer = segments.pop() ?? '';

          for (const segment of segments) {
            const payloads = parseSseDataChunk(segment);
            if (payloads.length === 0 && segment.trim().length > 0) {
              subscriber.next(segment);
              continue;
            }

            for (const payload of payloads) {
              subscriber.next(payload);
            }
          }
        }

        const trailing = decoder.decode();
        if (trailing) {
          buffer += trailing;
        }

        if (buffer.trim().length > 0) {
          const payloads = parseSseDataChunk(buffer);
          if (payloads.length > 0) {
            for (const payload of payloads) {
              subscriber.next(payload);
            }
          } else {
            subscriber.next(buffer);
          }
        }

        subscriber.complete();
      } catch (error) {
        if (abortController.signal.aborted) {
          subscriber.complete();
          return;
        }

        subscriber.error(toError(error, 'Fetch stream failed'));
      }
    };

    run();

    return () => {
      cancelled = true;
      signal?.removeEventListener('abort', relayAbort);
      abortController.abort();
    };
  });
}
