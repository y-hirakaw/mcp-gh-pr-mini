// ユーティリティ関数

import { FileChangeInfo, PullRequestFile } from '../api/types.js';

/**
 * AIコメントの識別子
 */
export const AI_COMMENT_IDENTIFIER = "[AI] Generated using MCP\n\n";

/**
 * パッチからコメント可能な位置を計算
 */
export function calculateCommentPositions(patch: string | undefined): number[] {
  const positions: number[] = [];
  
  if (!patch) {
    return positions;
  }

  let position = 0;
  const lines = patch.split('\n');
  
  for (const line of lines) {
    position++;
    // 追加された行（+で始まる行）の位置を記録
    // +++で始まるヘッダー行は除外
    if (line.startsWith('+') && !line.startsWith('+++')) {
      positions.push(position);
    }
  }

  return positions;
}

/**
 * ファイル変更情報にコメント位置を追加
 */
export function enrichFileChanges(files: PullRequestFile[]): FileChangeInfo[] {
  return files.map(file => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch,
    positions: calculateCommentPositions(file.patch)
  }));
}

/**
 * プルリクエストの一覧を整形
 */
export function formatPullRequestList(pullRequests: any[], owner: string, repo: string): string {
  if (pullRequests.length === 0) {
    return `No open pull requests found in ${owner}/${repo}`;
  }

  const formattedPRs = pullRequests.map(pr => 
    [
      `#${pr.number}: ${pr.title}`,
      `Created by: ${pr.user.login} on ${new Date(pr.created_at).toLocaleString()}`,
      `${pr.head.label} → ${pr.base.label}`,
      `${pr.requested_reviewers?.length || 0} reviewers requested`,
      `URL: ${pr.html_url}`,
      "---",
    ].join("\n")
  );

  return `Open Pull Requests in ${owner}/${repo}:\n\n${formattedPRs.join("\n")}`;
}

/**
 * プルリクエストのコメントを整形
 */
export function formatComments(
  issueComments: any[], 
  reviewComments: any[], 
  prNumber: number
): string {
  if (issueComments.length === 0 && reviewComments.length === 0) {
    return `No comments found for PR #${prNumber}`;
  }

  let formattedContent = `Comments for PR #${prNumber}:\n\n`;

  // 通常のコメント（会話）のフォーマット
  if (issueComments.length > 0) {
    formattedContent += "## Conversation Comments\n\n";
    const formattedIssueComments = issueComments.map(comment => 
      [
        `Comment by: ${comment.user.login}`,
        `Date: ${new Date(comment.created_at).toLocaleString()}`,
        `${comment.body}`,
        `URL: ${comment.html_url}`,
        "---",
      ].join("\n")
    );
    formattedContent += formattedIssueComments.join("\n") + "\n\n";
  }

  // レビューコメント（コードに紐づくもの）のフォーマット
  if (reviewComments.length > 0) {
    formattedContent += "## Code Review Comments\n\n";
    const formattedReviewComments = reviewComments.map(comment => 
      [
        `Comment by: ${comment.user.login}`,
        `Date: ${new Date(comment.created_at).toLocaleString()}`,
        `File: ${comment.path}${comment.position ? ` (line ${comment.position})` : ''}`,
        `${comment.body}`,
        `URL: ${comment.html_url}`,
        "---",
      ].join("\n")
    );
    formattedContent += formattedReviewComments.join("\n");
  }

  return formattedContent;
}

/**
 * ファイル変更情報を整形
 */
export function formatFileChanges(fileChanges: FileChangeInfo[], prNumber: number): string {
  const formattedOutput = fileChanges.map(file => {
    return [
      `File: ${file.filename}`,
      `Status: ${file.status}`,
      `Changes: +${file.additions}/-${file.deletions} (total: ${file.changes})`,
      `Comment Positions: ${file.positions.join(', ') || 'None'}`,
      file.patch ? `\nPatch:\n${file.patch}` : '',
      '---'
    ].join('\n');
  }).join('\n\n');

  return `Changes in PR #${prNumber}:\n\n${formattedOutput}`;
}

/**
 * エラーメッセージを生成
 */
export function createErrorMessage(operation: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Failed to ${operation}: ${message}`;
}