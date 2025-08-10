// プルリクエスト関連ツール
import { BaseTool } from './base-tool.js';
import { formatPullRequestList, formatFileChanges, enrichFileChanges } from '../utils/helpers.js';
export class PullRequestTools extends BaseTool {
    /**
     * プルリクエストを作成
     */
    async createPullRequest(params) {
        return await this.executeOperation('create pull request', async () => {
            const prData = await this.api.createPullRequest(params.owner, params.repo, {
                title: params.title,
                body: params.body,
                head: params.head,
                base: params.base
            });
            return this.createSuccessResponse(`Pull request created successfully!\n\nPR #${prData.number}: ${prData.title}\nURL: ${prData.html_url}`);
        });
    }
    /**
     * オープンなプルリクエスト一覧を取得
     */
    async listOpenPullRequests(params) {
        return await this.executeOperation('list open pull requests', async () => {
            const pullRequests = await this.api.listOpenPullRequests(params.owner, params.repo, params.limit || 10);
            const formattedList = formatPullRequestList(pullRequests, params.owner, params.repo);
            return this.createSuccessResponse(formattedList);
        });
    }
    /**
     * プルリクエストのdiffを取得
     */
    async getPullRequestDiff(params) {
        return await this.executeOperation('get pull request diff', async () => {
            const diffText = await this.api.getPullRequestDiff(params.owner, params.repo, params.pr_number);
            if (!diffText || diffText.trim() === "") {
                return this.createSuccessResponse(`No changes found in PR #${params.pr_number}`);
            }
            // PRのメタデータも取得
            const prData = await this.api.getPullRequest(params.owner, params.repo, params.pr_number);
            return this.createSuccessResponse(`Diff for PR #${params.pr_number}: ${prData.title}\n\n\`\`\`diff\n${diffText}\n\`\`\``);
        });
    }
    /**
     * プルリクエストにレビュアーをリクエスト
     */
    async requestReviewers(params) {
        return await this.executeOperation('request reviewers', async () => {
            if (!params.reviewers || params.reviewers.length === 0) {
                return this.createSuccessResponse("No reviewers specified. Please provide at least one reviewer username.");
            }
            await this.api.requestReviewers(params.owner, params.repo, params.pr_number, params.reviewers);
            return this.createSuccessResponse(`Successfully requested ${params.reviewers.length} reviewer${params.reviewers.length > 1 ? 's' : ''} for PR #${params.pr_number}: ${params.reviewers.join(', ')}`);
        });
    }
    /**
     * プルリクエストのファイル変更を取得（コメント位置付き）
     */
    async getChangesForCommenting(params) {
        return await this.executeOperation('get PR changes for commenting', async () => {
            const files = await this.api.getFiles(params.owner, params.repo, params.pr_number);
            const fileChanges = enrichFileChanges(files);
            const formattedOutput = formatFileChanges(fileChanges, params.pr_number);
            return this.createSuccessResponse(formattedOutput);
        });
    }
}
// シングルトンインスタンス
export const prTools = new PullRequestTools();
