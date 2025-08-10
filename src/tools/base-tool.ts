// 共通ツール基底クラス

import { githubApi } from '../api/github-api.js';
import { logger } from '../utils/logger.js';
import { createErrorMessage } from '../utils/helpers.js';

export interface ToolResult {
  [x: string]: unknown;
  content: Array<{
    [x: string]: unknown;
    type: "text";
    text: string;
  }>;
  _meta?: { [x: string]: unknown } | undefined;
  isError?: boolean | undefined;
}

export abstract class BaseTool {
  protected api = githubApi;

  /**
   * 成功時のレスポンスを作成
   */
  protected createSuccessResponse(message: string): ToolResult {
    return {
      content: [
        {
          type: "text" as const,
          text: message,
        },
      ],
    };
  }

  /**
   * エラーレスポンスを作成
   */
  protected createErrorResponse(operation: string, error: unknown): ToolResult {
    const errorMessage = createErrorMessage(operation, error);
    logger.error(`Tool error: ${errorMessage}`, error);
    
    return {
      content: [
        {
          type: "text" as const,
          text: errorMessage,
        },
      ],
    };
  }

  /**
   * 操作を安全に実行してレスポンスを返す
   */
  protected async executeOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<ToolResult> {
    try {
      logger.info(`Executing ${operation}...`);
      const result = await fn();
      logger.info(`${operation} completed successfully`);
      return result as ToolResult;
    } catch (error) {
      return this.createErrorResponse(operation, error);
    }
  }
}