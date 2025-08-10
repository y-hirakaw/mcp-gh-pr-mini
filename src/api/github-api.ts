// GitHub API抽象化レイヤー

import { githubAuth } from '../auth/github-auth.js';
import { CliClient } from '../auth/cli-client.js';
import { AuthMethod, RequestOptions, GitHubError } from './types.js';
import { logger } from '../utils/logger.js';

export class GitHubApi {
  private readonly baseUrl: string = 'https://api.github.com';

  constructor() {
    // 認証初期化は必要時に行う
  }

  /**
   * 認証が初期化されているか確認し、必要に応じて初期化
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!await githubAuth.isAuthenticated()) {
      await githubAuth.initialize();
    }
  }

  /**
   * GitHub API リクエストを実行
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    await this.ensureAuthenticated();
    
    const config = githubAuth.getConfig();
    
    // CLI認証の場合はgh コマンド経由でリクエスト
    if (config.method === AuthMethod.CLI) {
      return await this.requestViaCli<T>(endpoint, options);
    } else {
      return await this.requestViaFetch<T>(endpoint, options);
    }
  }

  /**
   * fetch を使用したAPIリクエスト (PAT認証用)
   */
  private async requestViaFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = await githubAuth.getAuthHeaders();
    
    // オプションのヘッダーをマージ
    const finalHeaders = { ...headers, ...options.headers };
    
    logger.debug(`API Request (fetch): ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: finalHeaders,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const responseBody = await this.parseResponseBody(response);

    if (!response.ok) {
      throw this.createApiError(response.status, responseBody);
    }

    return responseBody as T;
  }

  /**
   * GitHub CLI を使用したAPIリクエスト
   */
  private async requestViaCli<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const client = githubAuth.getClient() as CliClient;
    const method = options.method || 'GET';
    
    // エンドポイントから '/api/v1' などのプレフィックスを除去
    const cleanEndpoint = endpoint.replace(/^https:\/\/api\.github\.com/, '');
    
    logger.debug(`API Request (CLI): ${method} ${cleanEndpoint}`);
    
    try {
      return await client.apiRequest(method, cleanEndpoint, options.body);
    } catch (error) {
      logger.error(`GitHub CLI API request failed:`, error);
      throw new Error(`GitHub CLI API request failed: ${error}`);
    }
  }

  /**
   * レスポンス本文をパース
   */
  private async parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  /**
   * GitHub API エラーを作成
   */
  private createApiError(status: number, responseBody: unknown): GitHubError {
    const message = typeof responseBody === 'string' 
      ? responseBody 
      : JSON.stringify(responseBody);
    
    const error: GitHubError = {
      message: `GitHub API error! Status: ${status}, Message: ${message}`,
      status,
      response: responseBody
    };
    
    return new Error(error.message) as Error & GitHubError;
  }

  /**
   * プルリクエストを作成
   */
  async createPullRequest(owner: string, repo: string, data: {
    title: string;
    body: string;
    head: string;
    base: string;
  }) {
    return await this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: data
    });
  }

  /**
   * オープンなプルリクエストを一覧取得
   */
  async listOpenPullRequests(owner: string, repo: string, perPage: number = 10) {
    return await this.request(`/repos/${owner}/${repo}/pulls?state=open&per_page=${perPage}`);
  }

  /**
   * プルリクエストの詳細を取得
   */
  async getPullRequest(owner: string, repo: string, prNumber: number) {
    return await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}`);
  }

  /**
   * プルリクエストのdiffを取得
   */
  async getPullRequestDiff(owner: string, repo: string, prNumber: number): Promise<string> {
    await this.ensureAuthenticated();
    
    const config = githubAuth.getConfig();
    const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;
    
    if (config.method === AuthMethod.CLI) {
      // CLI経由でdiffを取得
      const client = githubAuth.getClient() as CliClient;
      const result = await client.executeCommand([
        'api', `/repos/${owner}/${repo}/pulls/${prNumber}`,
        '--header', 'Accept: application/vnd.github.v3.diff'
      ]);
      
      if (!result.success) {
        throw new Error(`Failed to get PR diff via CLI: ${result.stderr}`);
      }
      
      return result.stdout;
    } else {
      // fetch経由でdiffを取得
      const headers = await githubAuth.getAuthHeaders();
      const response = await fetch(url, {
        headers: {
          ...headers,
          'Accept': 'application/vnd.github.v3.diff'
        }
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw this.createApiError(response.status, errorBody);
      }
      
      return await response.text();
    }
  }

  /**
   * プルリクエストにレビュアーをリクエスト
   */
  async requestReviewers(owner: string, repo: string, prNumber: number, reviewers: string[]) {
    return await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`, {
      method: 'POST',
      body: { reviewers }
    });
  }

  /**
   * プルリクエストにコメントを追加
   */
  async addComment(owner: string, repo: string, prNumber: number, body: string) {
    return await this.request(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
      method: 'POST',
      body: { body }
    });
  }

  /**
   * プルリクエストにレビューコメントを追加
   */
  async addReviewComment(owner: string, repo: string, prNumber: number, data: {
    body: string;
    commit_id: string;
    path: string;
    position: number;
  }) {
    return await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/comments`, {
      method: 'POST',
      body: data
    });
  }

  /**
   * プルリクエストのコメントを取得
   */
  async getComments(owner: string, repo: string, prNumber: number) {
    const [issueComments, reviewComments] = await Promise.all([
      this.request(`/repos/${owner}/${repo}/issues/${prNumber}/comments`),
      this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/comments`)
    ]);

    return { issueComments, reviewComments };
  }

  /**
   * プルリクエストのファイル変更を取得
   */
  async getFiles(owner: string, repo: string, prNumber: number) {
    return await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/files`);
  }
}

// シングルトンインスタンス
export const githubApi = new GitHubApi();