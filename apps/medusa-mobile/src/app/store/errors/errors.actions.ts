export interface LoggedError {
  id?: string;
  timestamp?: string;
  type: 'http' | 'global' | 'application';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status?: number; // HTTP status code
  message: string;
  url?: string; // HTTP request URL
  userMessage?: string; // User-facing message
  stack?: string; // Stack trace (optional, can be large)
  context?: Record<string, any>; // Additional context (limited size)
}

export namespace ErrorActions {
  export class LogError {
    static readonly type = '[Error] Log Error';
    constructor(public error: LoggedError) {}
  }

  export class ClearErrors {
    static readonly type = '[Error] Clear Errors';
  }

  export class ClearOldErrors {
    static readonly type = '[Error] Clear Old Errors';
    constructor(public olderThan: Date) {}
  }
}
