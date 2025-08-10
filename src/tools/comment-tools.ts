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
    position: number;
  }): Promise<ToolResult> {
    return await this.executeOperation('add review comment to PR', async () => {
      // PRの詳細を取得してcommit_idを取得
      const prData = await this.api.getPullRequest(
        params.owner, 
        params.repo, 
        params.pr_number
      ) as PullRequest;
      
      const commit_id = prData.head.sha;

      const commentData = await this.api.addReviewComment(
        params.owner,
        params.repo,
        params.pr_number,
        {
          body: AI_COMMENT_IDENTIFIER + params.body,
          commit_id,
          path: params.path,
          position: params.position
        }
      ) as PullRequestReviewComment;

      return this.createSuccessResponse(
        `Review comment added successfully to PR #${params.pr_number}\nFile: ${params.path} (position ${params.position})\nComment URL: ${commentData.html_url}`
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