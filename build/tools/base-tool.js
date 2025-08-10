// 共通ツール基底クラス
import { githubApi } from '../api/github-api.js';
import { logger } from '../utils/logger.js';
import { createErrorMessage } from '../utils/helpers.js';
export class BaseTool {
    api = githubApi;
    /**
     * 成功時のレスポンスを作成
     */
    createSuccessResponse(message) {
        return {
            content: [
                {
                    type: "text",
                    text: message,
                },
            ],
        };
    }
    /**
     * エラーレスポンスを作成
     */
    createErrorResponse(operation, error) {
        const errorMessage = createErrorMessage(operation, error);
        logger.error(`Tool error: ${errorMessage}`, error);
        return {
            content: [
                {
                    type: "text",
                    text: errorMessage,
                },
            ],
        };
    }
    /**
     * 操作を安全に実行してレスポンスを返す
     */
    async executeOperation(operation, fn) {
        try {
            logger.info(`Executing ${operation}...`);
            const result = await fn();
            logger.info(`${operation} completed successfully`);
            return result;
        }
        catch (error) {
            return this.createErrorResponse(operation, error);
        }
    }
}
