export interface StreamChunk {
  content: string;
  done: boolean;
  error?: Error;
}
