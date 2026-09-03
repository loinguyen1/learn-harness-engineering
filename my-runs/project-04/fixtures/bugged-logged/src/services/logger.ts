/**
 * logger.ts -- one place that decides what a log line looks like.
 *
 * Two decisions are baked in here, and they are the whole point of the file:
 *
 * 1. WHERE IT GOES. Everything below writes to the main process's stdout.
 *    Electron has two consoles: the renderer's (visible only in devtools, on a
 *    screen, to a human) and the main process's (an ordinary terminal stream).
 *    Services run in the main process. A log an agent in a container cannot
 *    read is not observability, so stdout it is.
 *
 * 2. WHAT IT LOOKS LIKE. One JSON object per line -- greppable by a human,
 *    parseable by a machine, and, more importantly, a shape that makes leaving
 *    a field out feel like an omission.
 */

export type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const ORDER: Level[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

// Default INFO. Set KB_LOG_LEVEL=DEBUG for more, ERROR for near-silence.
const MIN: Level = (process.env.KB_LOG_LEVEL as Level) ?? 'INFO';

type Fields = Record<string, unknown>;

function emit(level: Level, service: string, msg: string, fields?: Fields): void {
  if (ORDER.indexOf(level) < ORDER.indexOf(MIN)) return;
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service,
    msg,
    ...(fields ?? {}),
  }));
}

export interface ServiceLogger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
}

export const logger = {
  /**
   * Tag a logger with its source once, instead of repeating the name at every
   * call site -- where it drifts, gets copy-pasted wrong, and stops being
   * trustworthy.
   */
  forService(service: string): ServiceLogger {
    return {
      debug: (m, f) => emit('DEBUG', service, m, f),
      info:  (m, f) => emit('INFO',  service, m, f),
      warn:  (m, f) => emit('WARN',  service, m, f),
      error: (m, f) => emit('ERROR', service, m, f),
    };
  },
};
