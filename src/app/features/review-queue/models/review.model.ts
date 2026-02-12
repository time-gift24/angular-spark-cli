/**
 * Review Queue Data Models
 *
 * Type definitions for the DocQ Review Queue feature.
 * All models use Angular Signals for reactive state management.
 */

/**
 * Page-level status for the review queue
 */
export type ReviewStatus = 'loading' | 'ready' | 'submitting' | 'completed' | 'error';

/**
 * Human decision types for review items
 */
export type DecisionType = 'accept' | 'reject' | 'hold' | 'skipped';

/**
 * System conclusion based on automated checks
 */
export type SystemConclusion = 'pass' | 'fail' | 'risk';

/**
 * Draft state for the current item decision (before submit)
 */
export interface ItemDecisionDraft {
  decision: 'accept' | 'reject' | 'hold';
  reason: string;
}

/**
 * Individual output result from a check item
 */
export interface OutputVM {
  outputId: string;
  checkItemName: string;
  score: number;
  passed: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * SOP Document segment (paragraph)
 */
export interface DocumentSegment {
  segmentId: string;
  segmentIndex: number;
  content: string;  // 段落内容
  checkResults: OutputVM[];
}

/**
 * SOP Original Document (long structured document)
 */
export interface OriginalDocument {
  docId: string;
  title: string;  // SOP 文档标题
  content: string;  // 完整文档内容
  segments: DocumentSegment[];  // AI 分段的段落列表
}

/**
 * Single review item with all its outputs
 */
export interface ReviewItemVM {
  itemId: string;
  originalDoc: OriginalDocument;  // 原始 SOP 文档
  currentSegment: DocumentSegment | null;  // 当前评测的段落
  outputs: OutputVM[];  // 当前段落的检测结果
  decision?: DecisionType;
  reason?: string;
  systemConclusion?: SystemConclusion;
}

/**
 * Complete review queue state
 */
export interface ReviewQueueVM {
  cycleId: string;
  totalItems: number;
  currentIndex: number;
  reviewedItems: number;
  acceptedItems: number;
  progressPercent: number;
  passRate: number | null;
  items: ReviewItemVM[];
}

/**
 * Page state container
 */
export interface ReviewPageState {
  status: ReviewStatus;
  queue: ReviewQueueVM | null;
  errorMessage: string | null;
  draftDecision: ItemDecisionDraft | null;
}

// API DTO Types for backend integration

/**
 * Score data from backend API
 */
export interface ScoreDto {
  id: string;
  itemId: string;
  checkItemId: string;
  checkItemName: string;
  score: number;
  passed: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Experiment data from backend API
 */
export interface ExperimentDto {
  id: string;
  name: string;
  cycleId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Upgrade cycle data from backend API
 */
export interface UpgradeCycleDto {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cycle decision submission payload
 */
export interface CycleDecisionDto {
  decision: 'approve' | 'reject' | 'hold';
  reason?: string;
  itemDecisions: ItemDecisionDto[];
}

/**
 * Individual item decision for submission
 */
export interface ItemDecisionDto {
  itemId: string;
  decision: DecisionType;
  reason?: string;
}

/**
 * Route parameters for the review queue page
 */
export interface ReviewQueueRouteParams {
  /** Upgrade cycle ID */
  cycleId: string;
  /** Experiment ID */
  experimentId: string;
  /** Asset ID */
  assetId: string;
}
