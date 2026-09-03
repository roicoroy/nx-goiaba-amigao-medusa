import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ErrorActions, LoggedError } from './errors.actions';
import { environment } from 'src/environments/environment';

// Re-export LoggedError for use in other files
export type { LoggedError } from './errors.actions';

export interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  lastError?: string;
}

export interface ErrorStateModel {
  errors: LoggedError[];
  stats: ErrorStats;
  maxSize: number; // Configurable limit (default: 50 dev, 20 prod)
  enabled: boolean; // Can be disabled in production
}

const DEFAULT_MAX_SIZE = environment.production ? 20 : 50;
const ERROR_LOGGING_CONFIG = environment.errorLogging || {
  enabled: !environment.production,
  maxSize: DEFAULT_MAX_SIZE,
  logStackTraces: !environment.production,
  minSeverity: environment.production ? 'high' : 'low'
};

@State<ErrorStateModel>({
  name: 'errors',
  defaults: {
    errors: [],
    stats: {
      total: 0,
      byType: {},
      bySeverity: {}
    },
    maxSize: ERROR_LOGGING_CONFIG.maxSize || DEFAULT_MAX_SIZE,
    enabled: ERROR_LOGGING_CONFIG.enabled !== false
  }
})
@Injectable()
export class ErrorState {
  // Size limits to prevent memory issues
  private readonly MAX_STACK_LENGTH = 2000;
  private readonly MAX_MESSAGE_LENGTH = 1000;
  private readonly MAX_URL_LENGTH = 500;
  private readonly MAX_CONTEXT_SIZE = 10240; // 10KB

  @Selector()
  static getErrors(state: ErrorStateModel): LoggedError[] {
    return state.errors;
  }

  @Selector()
  static getRecentErrors(state: ErrorStateModel) {
    return (count: number = 10): LoggedError[] => {
      return state.errors.slice(-count);
    };
  }

  @Selector()
  static getErrorStats(state: ErrorStateModel): ErrorStats {
    return state.stats;
  }

  @Selector()
  static getErrorsByType(state: ErrorStateModel) {
    return (type: 'http' | 'global' | 'application'): LoggedError[] => {
      return state.errors.filter(e => e.type === type);
    };
  }

  @Selector()
  static getErrorsBySeverity(state: ErrorStateModel) {
    return (severity: 'low' | 'medium' | 'high' | 'critical'): LoggedError[] => {
      return state.errors.filter(e => e.severity === severity);
    };
  }

  @Selector()
  static isEnabled(state: ErrorStateModel): boolean {
    return state.enabled;
  }

  @Action(ErrorActions.LogError)
  logError(ctx: StateContext<ErrorStateModel>, { error }: ErrorActions.LogError): void {
    // Check if logging is enabled
    if (!ctx.getState().enabled) {
      return;
    }

    // Check severity threshold
    const minSeverity = ERROR_LOGGING_CONFIG.minSeverity || 'low';
    const severityOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    if (severityOrder[error.severity] < severityOrder[minSeverity]) {
      return;
    }

    // Sanitize and truncate error data
    const sanitizedError = this.sanitizeError(error);

    // Get current state
    const state = ctx.getState();
    let errors = [...state.errors];

    // Circular buffer: remove oldest error if at max size
    if (errors.length >= state.maxSize) {
      errors = errors.slice(1);
    }

    // Add new error
    errors.push(sanitizedError);

    // Update stats
    const stats = this.updateStats(state.stats, sanitizedError);

    ctx.patchState({
      errors,
      stats
    });
  }

  @Action(ErrorActions.ClearErrors)
  clearErrors(ctx: StateContext<ErrorStateModel>): void {
    ctx.patchState({
      errors: [],
      stats: {
        total: 0,
        byType: {},
        bySeverity: {}
      }
    });
  }

  @Action(ErrorActions.ClearOldErrors)
  clearOldErrors(ctx: StateContext<ErrorStateModel>, { olderThan }: ErrorActions.ClearOldErrors): void {
    const state = ctx.getState();
    const cutoffTime = olderThan.getTime();

    const errors = state.errors.filter(error => {
      if (!error.timestamp) {
        return true; // Keep errors without timestamps
      }
      const errorTime = new Date(error.timestamp).getTime();
      return errorTime >= cutoffTime;
    });

    // Recalculate stats after cleanup
    const stats: ErrorStats = {
      total: errors.length,
      byType: {},
      bySeverity: {}
    };

    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    ctx.patchState({
      errors,
      stats
    });
  }

  /**
   * Sanitize error data to prevent memory issues
   */
  private sanitizeError(error: LoggedError): LoggedError {
    // Generate ID if not provided
    const id = error.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Truncate message
    const message = this.truncateString(error.message, this.MAX_MESSAGE_LENGTH);

    // Truncate URL
    const url = error.url ? this.truncateString(error.url, this.MAX_URL_LENGTH) : undefined;

    // Truncate stack trace (only if logging is enabled)
    let stack = error.stack;
    if (stack && ERROR_LOGGING_CONFIG.logStackTraces) {
      stack = this.truncateString(stack, this.MAX_STACK_LENGTH);
    } else {
      stack = undefined; // Don't store stack if not enabled
    }

    // Limit context size
    let context = error.context;
    if (context) {
      const contextStr = JSON.stringify(context);
      if (contextStr.length > this.MAX_CONTEXT_SIZE) {
        // Try to truncate or remove context
        try {
          const truncated = JSON.parse(contextStr.substring(0, this.MAX_CONTEXT_SIZE - 50));
          context = { ...truncated, _truncated: true };
        } catch {
          context = { _truncated: true, _size: contextStr.length };
        }
      }
    }

    return {
      ...error,
      id,
      timestamp: error.timestamp || new Date().toISOString(),
      message,
      url,
      stack,
      context
    };
  }

  /**
   * Update error statistics
   */
  private updateStats(currentStats: ErrorStats, error: LoggedError): ErrorStats {
    const stats: ErrorStats = {
      total: currentStats.total + 1,
      byType: { ...currentStats.byType },
      bySeverity: { ...currentStats.bySeverity }
    };

    // Update type count
    stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

    // Update severity count
    stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

    // Update last error timestamp
    stats.lastError = error.timestamp;

    return stats;
  }

  /**
   * Truncate string to max length
   */
  private truncateString(str: string, maxLength: number): string {
    if (!str || str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - 3) + '...';
  }
}
