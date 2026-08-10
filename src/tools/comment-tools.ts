// コメント関連ツール

import { BaseTool, ToolResult } from './base-tool.js';
import { formatComments, AI_COMMENT_IDENTIFIER } from '../utils/helpers.js';
import { PullRequest, PullRequestComment, PullRequestReviewComment } from '../api/types.js';

export class CommentTools extends BaseTool {
  /**
   * プルリクエストにコメントを追加
   */
  async addComment(params: {
    owner: string;
    repo: string;
    pr_number: number;
    body: string;
  }): Promise<ToolResult> {
    return await this.executeOperation('add PR comment', async () => {
      const commentData = await this.api.addComment(
        params.owner, 
        params.repo, 
        params.pr_number, 
        AI_COMMENT_IDENTIFIER + params.body
      ) as PullRequestComment;

      return this.createSuccessResponse(
        `Comment added successfully to PR #${params.pr_number}\nComment URL: ${commentData.html_url}`
      );
    });
  }

  /**
   * プルリクエストにレビューコメントを追加
   */
  async addReviewComment(params: {
    owner: string;
    repo: string;
    pr_number: number;
    body: string;
    path: string;
    position?: number;
    line?: number;
    side?: 'LEFT' | 'RIGHT';
    start_line?: number;
    start_side?: 'LEFT' | 'RIGHT';
    subject_type?: 'line' | 'file';
  }): Promise<ToolResult> {
    return await this.executeOperation('add review comment to PR', async () => {
      const isFileLevel = params.subject_type === 'file';
      const hasLine = params.line !== undefined;
      const hasPosition = params.position !== undefined;

      if (!isFileLevel) {
        if (hasLine && hasPosition) {
          throw new Error("'line' and 'position' are mutually exclusive - specify only one.");
        }
        if (!hasLine && !hasPosition) {
          throw new Error("Either 'line' or 'position' must be provided (or set subject_type: 'file' for a file-level comment).");
        }
      }

      // PRの詳細を取得してcommit_idを取得
      const prData = await this.api.getPullRequest(
        params.owner,
        params.repo,
        params.pr_number
      ) as PullRequest;

      const commit_id = prData.head.sha;

      const requestData: {
        body: string;
        commit_id: string;
        path: string;
        position?: number;
        line?: number;
        side?: 'LEFT' | 'RIGHT';
        start_line?: number;
        start_side?: 'LEFT' | 'RIGHT';
        subject_type?: 'line' | 'file';
      } = {
        body: AI_COMMENT_IDENTIFIER + params.body,
        commit_id,
        path: params.path
      };

      let locationDescription: string;

      if (isFileLevel) {
        requestData.subject_type = 'file';
        locationDescription = 'file-level comment';
      } else if (hasLine) {
        const side = params.side ?? 'RIGHT';
        requestData.line = params.line;
        requestData.side = side;
        if (params.start_line !== undefined) {
          requestData.start_line = params.start_line;
          requestData.start_side = params.start_side ?? side;
          locationDescription = `lines ${params.start_line}-${params.line} (${side})`;
        } else {
          locationDescription = `line ${params.line} (${side})`;
        }
      } else {
        requestData.position = params.position;
        locationDescription = `position ${params.position}`;
      }

      let commentData: PullRequestReviewComment;
      try {
        commentData = await this.api.addReviewComment(
          params.owner,
          params.repo,
          params.pr_number,
          requestData
        ) as PullRequestReviewComment;
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 422 && !isFileLevel) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(
            `${message}\nHint: the specified line/position is likely outside the diff hunk range. Retry with subject_type: "file" for a file-level comment instead.`
          );
        }
        throw error;
      }

      return this.createSuccessResponse(
        `Review comment added successfully to PR #${params.pr_number}\nFile: ${params.path} (${locationDescription})\nComment URL: ${commentData.html_url}`
      );
    });
  }

  /**
   * プルリクエストのコメントを取得
   */
  async getComments(params: {
    owner: string;
    repo: string;
    pr_number: number;
  }): Promise<ToolResult> {
    return await this.executeOperation('retrieve PR comments', async () => {
      const { issueComments, reviewComments } = await this.api.getComments(
        params.owner, 
        params.repo, 
        params.pr_number
      );

      const formattedContent = formatComments(
        issueComments as PullRequestComment[], 
        reviewComments as PullRequestReviewComment[], 
        params.pr_number
      );
      
      return this.createSuccessResponse(formattedContent);
    });
  }
}

// シングルトンインスタンス
export const commentTools = new CommentTools();