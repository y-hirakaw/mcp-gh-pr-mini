// ログ機能
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
class Logger {
    level;
    constructor(level = LogLevel.INFO) {
        this.level = level;
    }
    setLevel(level) {
        this.level = level;
    }
    shouldLog(level) {
        return level >= this.level;
    }
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}] mcp-gh-pr-mini:`;
        if (args.length > 0) {
            console.error(prefix, message, ...args);
        }
        else {
            console.error(prefix, message);
        }
    }
    debug(message, ...args) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            this.formatMessage('DEBUG', message, ...args);
        }
    }
    info(message, ...args) {
        if (this.shouldLog(LogLevel.INFO)) {
            this.formatMessage('INFO', message, ...args);
        }
    }
    warn(message, ...args) {
        if (this.shouldLog(LogLevel.WARN)) {
            this.formatMessage('WARN', message, ...args);
        }
    }
    error(message, ...args) {
        if (this.shouldLog(LogLevel.ERROR)) {
            this.formatMessage('ERROR', message, ...args);
        }
    }
}
// シングルトンインスタンス
export const logger = new Logger(process.env.LOG_LEVEL ?
    parseInt(process.env.LOG_LEVEL) :
    LogLevel.INFO);
