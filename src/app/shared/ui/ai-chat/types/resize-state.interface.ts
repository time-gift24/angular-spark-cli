import { ResizeEdge } from './resize-edge.type';

export interface ResizeState {
  readonly startMouseX: number;
  readonly startMouseY: number;
  readonly startTop: number;
  readonly startBottom: number;
  readonly startLeft: number;
  readonly startRight: number;
  readonly startWidth: number;
  readonly startHeight: number;
  readonly activeEdge: ResizeEdge;
}
