// プルリクエスト関連ツール

import { BaseTool, ToolResult } from './base-tool.js';
import { formatPullRequestList, formatFileChanges, enrichFileChanges } from '../utils/helpers.js';
import { PullRequest, PullRequestFile } from '../api/types.js';

export class PullRequestTools extends BaseTool {
  /**
   * プルリクエストを作成
   */
  async createPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<ToolResult> {
    return await this.executeOperation('create pull request', async () => {
      const prData = await this.api.createPullRequest(params.owner, params.repo, {
        title: params.title,
        body: params.body,
        head: params.head,
        base: params.base
      }) as PullRequest;

      return this.createSuccessResponse(
        `Pull request created successfully!\n\nPR #${prData.number}: ${prData.title}\nURL: ${prData.html_url}`
      );
    });
  }

  /**
   * プルリクエストを更新
   */
  async updatePullRequest(params: {
    owner: string;
    repo: string;
    pr_number: number;
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    base?: string;
  }): Promise<ToolResult> {
    return await this.executeOperation('update pull request', async () => {
      // 更新対象のフィールドのみ送信
      const updateData: any = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.body !== undefined) updateData.body = params.body;
      if (params.state !== undefined) updateData.state = params.state;
      if (params.base !== undefined) updateData.base = params.base;

      if (Object.keys(updateData).length === 0) {
        return this.createSuccessResponse("No fields specified for update. Please specify at least one field to update (title, body, state, or base).");
      }

      const prData = await this.api.updatePullRequest(
        params.owner,
        params.repo,
        params.pr_number,
        updateData
      ) as PullRequest;

      const updatedFields = Object.keys(updateData).join(', ');
      return this.createSuccessResponse(
        `Pull request #${prData.number} updated successfully!\n\nUpdated fields: ${updatedFields}\nTitle: ${prData.title}\nURL: ${prData.html_url}`
      );
    });
  }

  /**
   * オープンなプルリクエスト一覧を取得
   */
  async listOpenPullRequests(params: {
    owner: string;
    repo: string;
    limit?: number;
  }): Promise<ToolResult> {
    return await this.executeOperation('list open pull requests', async () => {
      const pullRequests = await this.api.listOpenPullRequests(
        params.owner,
        params.repo,
        params.limit || 10
      ) as PullRequest[];

      const formattedList = formatPullRequestList(pullRequests, params.owner, params.repo);
      return this.createSuccessResponse(formattedList);
    });
  }

  /**
   * プルリクエストのdiffを取得
   */
  async getPullRequestDiff(params: {
    owner: string;
    repo: string;
    pr_number: number;
  }): Promise<ToolResult> {
    return await this.executeOperation('get pull request diff', async () => {
      const diffText = await this.api.getPullRequestDiff(
        params.owner, 
        params.repo, 
        params.pr_number
      );

      if (!diffText || diffText.trim() === "") {
        return this.createSuccessResponse(`No changes found in PR #${params.pr_number}`);
      }

      // PRのメタデータも取得
      const prData = await this.api.getPullRequest(
        params.owner, 
        params.repo, 
        params.pr_number
      ) as PullRequest;

      return this.createSuccessResponse(
        `Diff for PR #${params.pr_number}: ${prData.title}\n\n\`\`\`diff\n${diffText}\n\`\`\``
      );
    });
  }

  /**
   * プルリクエストにレビュアーをリクエスト
   */
  async requestReviewers(params: {
    owner: string;
    repo: string;
    pr_number: number;
    reviewers: string[];
  }): Promise<ToolResult> {
    return await this.executeOperation('request reviewers', async () => {
      if (!params.reviewers || params.reviewers.length === 0) {
        return this.createSuccessResponse("No reviewers specified. Please provide at least one reviewer username.");
      }

      await this.api.requestReviewers(
        params.owner, 
        params.repo, 
        params.pr_number, 
        params.reviewers
      );

      return this.createSuccessResponse(
        `Successfully requested ${params.reviewers.length} reviewer${params.reviewers.length > 1 ? 's' : ''} for PR #${params.pr_number}: ${params.reviewers.join(', ')}`
      );
    });
  }

  /**
   * プルリクエストのファイル変更を取得（コメント位置付き）
   */
  async getChangesForCommenting(params: {
    owner: string;
    repo: string;
    pr_number: number;
  }): Promise<ToolResult> {
    return await this.executeOperation('get PR changes for commenting', async () => {
      const files = await this.api.getFiles(
        params.owner, 
        params.repo, 
        params.pr_number
      ) as PullRequestFile[];

      const fileChanges = enrichFileChanges(files);
      const formattedOutput = formatFileChanges(fileChanges, params.pr_number);
      
      return this.createSuccessResponse(formattedOutput);
    });
  }
}

// シングルトンインスタンス
export const prTools = new PullRequestTools();