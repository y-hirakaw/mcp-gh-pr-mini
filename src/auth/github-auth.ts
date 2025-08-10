// GitHub認証管理

import { AuthMethod, AuthConfig } from '../api/types.js';
import { PatClient } from './pat-client.js';
import { CliClient } from './cli-client.js';
import { logger } from '../utils/logger.js';

export interface GitHubAuthClient {
  method: AuthMethod;
  isAuthenticated(): Promise<boolean>;
  getAuthHeaders(): Promise<Record<string, string>>;
  getUserInfo(): Promise<{ login: string }>;
}

export class GitHubAuth {
  private client: GitHubAuthClient | null = null;
  private config: AuthConfig | null = null;

  constructor() {
    // 環境変数からログレベルを設定
    if (process.env.DEBUG === 'true') {
      logger.setLevel(0); // DEBUG
    }
  }

  /**
   * 利用可能な認証方法を自動検出して初期化
   */
  async initialize(): Promise<void> {
    logger.info('Initializing GitHub authentication...');
    
    try {
      // 1. PAT認証を試行
      if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
        logger.info('Found GITHUB_PERSONAL_ACCESS_TOKEN, trying PAT authentication');
        const patClient = new PatClient(process.env.GITHUB_PERSONAL_ACCESS_TOKEN);
        
        if (await patClient.isAuthenticated()) {
          logger.info('PAT authentication successful');
          this.client = patClient;
          this.config = { method: AuthMethod.PAT, token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN };
          return;
        } else {
          logger.warn('PAT authentication failed, token may be invalid');
        }
      }

      // 2. GitHub CLI認証を試行
      logger.info('Trying GitHub CLI authentication');
      const cliClient = new CliClient();
      
      if (await cliClient.isAuthenticated()) {
        logger.info('GitHub CLI authentication successful');
        this.client = cliClient;
        this.config = { method: AuthMethod.CLI };
        return;
      } else {
        logger.warn('GitHub CLI authentication failed or not configured');
      }

      // 3. 認証方法が見つからない場合
      throw new Error('No valid GitHub authentication found. Please set GITHUB_PERSONAL_ACCESS_TOKEN or configure GitHub CLI with `gh auth login`');
    } catch (error) {
      logger.error('Failed to initialize GitHub authentication:', error);
      throw error;
    }
  }

  /**
   * 現在の認証クライアントを取得
   */
  getClient(): GitHubAuthClient {
    if (!this.client) {
      throw new Error('GitHub authentication not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * 現在の認証設定を取得
   */
  getConfig(): AuthConfig {
    if (!this.config) {
      throw new Error('GitHub authentication not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * 認証が有効かチェック
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    return await this.client.isAuthenticated();
  }

  /**
   * 認証ヘッダーを取得
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const client = this.getClient();
    return await client.getAuthHeaders();
  }

  /**
   * 認証済みユーザー情報を取得
   */
  async getUserInfo(): Promise<{ login: string }> {
    const client = this.getClient();
    return await client.getUserInfo();
  }
}

// シングルトンインスタンス
export const githubAuth = new GitHubAuth();