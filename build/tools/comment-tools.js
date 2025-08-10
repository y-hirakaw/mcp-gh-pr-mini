// コメント関連ツール
import { BaseTool } from './base-tool.js';
import { formatComments, AI_COMMENT_IDENTIFIER } from '../utils/helpers.js';
export class CommentTools extends BaseTool {
    /**
     * プルリクエストにコメントを追加
     */
    async addComment(params) {
        return await this.executeOperation('add PR comment', async () => {
            const commentData = await this.api.addComment(params.owner, params.repo, params.pr_number, AI_COMMENT_IDENTIFIER + params.body);
            return this.createSuccessResponse(`Comment added successfully to PR #${params.pr_number}\nComment URL: ${commentData.html_url}`);
        });
    }
    /**
     * プルリクエストにレビューコメントを追加
     */
    async addReviewComment(params) {
        return await this.executeOperation('add review comment to PR', async () => {
            // PRの詳細を取得してcommit_idを取得
            const prData = await this.api.getPullRequest(params.owner, params.repo, params.pr_number);
            const commit_id = prData.head.sha;
            const commentData = await this.api.addReviewComment(params.owner, params.repo, params.pr_number, {
                body: AI_COMMENT_IDENTIFIER + params.body,
                commit_id,
                path: params.path,
                position: params.position
            });
            return this.createSuccessResponse(`Review comment added successfully to PR #${params.pr_number}\nFile: ${params.path} (position ${params.position})\nComment URL: ${commentData.html_url}`);
        });
    }
    /**
     * プルリクエストのコメントを取得
     */
    async getComments(params) {
        return await this.executeOperation('retrieve PR comments', async () => {
            const { issueComments, reviewComments } = await this.api.getComments(params.owner, params.repo, params.pr_number);
            const formattedContent = formatComments(issueComments, reviewComments, params.pr_number);
            return this.createSuccessResponse(formattedContent);
        });
    }
}
// シングルトンインスタンス
export const commentTools = new CommentTools();
