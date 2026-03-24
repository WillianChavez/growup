type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  route?: string;
  method?: string;
  userId?: string;
  ip?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

interface ErrorMetadata extends LogContext {
  error: unknown;
}

function buildLogEntry(level: LogLevel, message: string, context?: LogContext) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
}

export function logInfo(message: string, context?: LogContext): void {
  console.info(JSON.stringify(buildLogEntry('info', message, context)));
}

export function logWarn(message: string, context?: LogContext): void {
  console.warn(JSON.stringify(buildLogEntry('warn', message, context)));
}

export function logError(message: string, metadata: ErrorMetadata): void {
  const error =
    metadata.error instanceof Error
      ? {
          name: metadata.error.name,
          message: metadata.error.message,
          stack: metadata.error.stack,
        }
      : { message: String(metadata.error) };

  const context = {
    route: metadata.route,
    method: metadata.method,
    userId: metadata.userId,
    ip: metadata.ip,
    requestId: metadata.requestId,
    details: metadata.details,
  };

  console.error(
    JSON.stringify({
      ...buildLogEntry('error', message, context),
      error,
    })
  );
}
