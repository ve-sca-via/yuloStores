function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();

  if (meta === undefined) {
    return [`[${timestamp}] ${level}: ${message}`];
  }

  return [`[${timestamp}] ${level}: ${message}`, meta];
}

const logger = {
  info(message, meta) {
    console.info(...formatMessage('INFO', message, meta));
  },
  warn(message, meta) {
    console.warn(...formatMessage('WARN', message, meta));
  },
  error(message, meta) {
    console.error(...formatMessage('ERROR', message, meta));
  },
};

export default logger;
