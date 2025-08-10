// Personal Access Token 認証クライアント

import { AuthMethod } from '../api/types.js';
import { GitHubAuthClient } from './github-auth.js';
import { logger } from '../utils/logger.js';

export class PatClient implements GitHubAuthClient {
  readonly method = AuthMethod.PAT;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * PAT認証が有効かチェック
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      logger.debug('Checking PAT authentication...');
      
      const response = await fetch('https://api.github.com/user', {
        headers: await this.getAuthHeaders()
      });

      if (response.ok) {
        const user = await response.json();
        logger.debug(`PAT authentication valid for user: ${user.login}`);
        return true;
      } else {
        logger.debug(`PAT authentication failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.debug('PAT authentication check failed:', error);
      return false;
    }
  }

  /**
   * PAT認証ヘッダーを取得
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'mcp-gh-pr-mini/1.0',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  /**
   * 認証済みユーザー情報を取得
   */
  async getUserInfo(): Promise<{ login: string }> {
    logger.debug('Getting user info via PAT...');
    
    const response = await fetch('https://api.github.com/user', {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
    }

    const user = await response.json();
    logger.debug(`Retrieved user info: ${user.login}`);
    
    return { login: user.login };
  }
}