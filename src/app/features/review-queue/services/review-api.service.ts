import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import type {
  UpgradeCycleDto,
  ExperimentDto,
  ScoreDto,
  CycleDecisionDto,
} from '@app/features/review-queue/models';

/**
 * Base API URL for DocQ backend
 */
const API_BASE = '/api/v1';

/**
 * Review API Service
 *
 * Handles all API calls for the Review Queue feature.
 * Uses Angular HttpClient for REST operations.
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE;

  /**
   * Get upgrade cycle by ID
   */
  getUpgradeCycle(cycleId: string): Observable<UpgradeCycleDto> {
    return this.http.get<UpgradeCycleDto>(
      `${this.baseUrl}/upgrade-cycles/${cycleId}`
    ).pipe(
      catchError((error) => {
        console.error('Failed to fetch upgrade cycle:', error);
        return throwError(() => new Error('Failed to load upgrade cycle'));
      })
    );
  }

  /**
   * Get runs for an upgrade cycle
   */
  getCycleRuns(cycleId: string): Observable<ExperimentDto[]> {
    return this.http.get<ExperimentDto[]>(
      `${this.baseUrl}/upgrade-cycles/${cycleId}/runs`
    ).pipe(
      catchError((error) => {
        console.error('Failed to fetch cycle runs:', error);
        return throwError(() => new Error('Failed to load cycle runs'));
      })
    );
  }

  /**
   * Get evaluation scores for an experiment
   * These are aggregated by item_id for the queue display
   */
  getExperimentScores(experimentId: string): Observable<ScoreDto[]> {
    return this.http.get<ScoreDto[]>(
      `${this.baseUrl}/experiments/${experimentId}/scores`
    ).pipe(
      catchError((error) => {
        console.error('Failed to fetch scores:', error);
        return throwError(() => new Error('Failed to load scores'));
      })
    );
  }

  /**
   * Submit a decision for the entire cycle
   * Includes all item decisions made during review
   */
  submitCycleDecision(
    cycleId: string,
    decision: CycleDecisionDto
  ): Observable<{ success: boolean; decisionId: string }> {
    return this.http.post<{ success: boolean; decisionId: string }>(
      `${this.baseUrl}/upgrade-cycles/${cycleId}/decisions`,
      decision
    ).pipe(
      catchError((error) => {
        console.error('Failed to submit decision:', error);
        return throwError(() => new Error('Failed to submit decision'));
      })
    );
  }

  /**
   * Submit a single item decision (for auto-save during review)
   * Optional: Use if backend supports per-item decision storage
   */
  submitItemDecision(
    cycleId: string,
    itemId: string,
    decision: string,
    reason?: string
  ): Observable<{ success: boolean }> {
    const params = new HttpParams().set('item_id', itemId);
    
    return this.http
      .post<{ success: boolean }>(
        `${this.baseUrl}/upgrade-cycles/${cycleId}/item-decisions`,
        { decision, reason },
        { params }
      )
      .pipe(
        catchError((error) => {
          console.error('Failed to submit item decision:', error);
          return throwError(() => new Error('Failed to save decision'));
        })
      );
  }
}
