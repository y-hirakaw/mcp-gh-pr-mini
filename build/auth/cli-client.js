// GitHub CLI 認証クライアント
import { spawn } from 'child_process';
import { AuthMethod } from '../api/types.js';
import { logger } from '../utils/logger.js';
export class CliClient {
    method = AuthMethod.CLI;
    /**
     * GitHub CLI認証が有効かチェック
     */
    async isAuthenticated() {
        try {
            logger.debug('Checking GitHub CLI authentication...');
            const result = await this.executeCommand(['auth', 'status']);
            // `gh auth status` は認証済みの場合は exit code 0 を返す
            if (result.success) {
                logger.debug('GitHub CLI authentication is valid');
                return true;
            }
            else {
                logger.debug('GitHub CLI authentication failed:', result.stderr);
                return false;
            }
        }
        catch (error) {
            logger.debug('GitHub CLI authentication check failed:', error);
            return false;
        }
    }
    /**
     * GitHub CLI認証ヘッダーを取得
     * CLI認証の場合はヘッダーは不要（gh コマンド経由でアクセス）
     */
    async getAuthHeaders() {
        return {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'mcp-gh-pr-mini/1.0',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }
    /**
     * 認証済みユーザー情報を取得
     */
    async getUserInfo() {
        logger.debug('Getting user info via GitHub CLI...');
        const result = await this.executeCommand(['api', 'user']);
        if (!result.success) {
            throw new Error(`Failed to get user info via GitHub CLI: ${result.stderr}`);
        }
        try {
            const user = JSON.parse(result.stdout);
            logger.debug(`Retrieved user info via CLI: ${user.login}`);
            return { login: user.login };
        }
        catch (error) {
            throw new Error(`Failed to parse user info from GitHub CLI: ${error}`);
        }
    }
    /**
     * GitHub CLI コマンドを実行
     */
    async executeCommand(args) {
        return new Promise((resolve) => {
            logger.debug(`Executing gh command: gh ${args.join(' ')}`);
            const process = spawn('gh', args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            process.on('close', (code) => {
                const success = code === 0;
                if (!success) {
                    logger.debug(`gh command failed with exit code ${code}: ${stderr}`);
                }
                resolve({
                    success,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            });
            process.on('error', (error) => {
                logger.debug(`gh command process error:`, error);
                resolve({
                    success: false,
                    stdout: '',
                    stderr: error.message
                });
            });
        });
    }
    /**
     * GitHub CLI で API リクエストを実行
     */
    async apiRequest(method, endpoint, data) {
        const args = ['api', endpoint, '--method', method.toUpperCase()];
        if (data) {
            args.push('--input', '-');
        }
        logger.debug(`GitHub CLI API request: ${method.toUpperCase()} ${endpoint}`);
        return new Promise((resolve, reject) => {
            const process = spawn('gh', args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            process.stdout.on('data', (chunk) => {
                stdout += chunk.toString();
            });
            process.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = stdout ? JSON.parse(stdout) : null;
                        resolve(result);
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse GitHub CLI response: ${error}`));
                    }
                }
                else {
                    reject(new Error(`GitHub CLI API request failed: ${stderr}`));
                }
            });
            process.on('error', (error) => {
                reject(new Error(`GitHub CLI process error: ${error.message}`));
            });
            // データがある場合は stdin に送信
            if (data) {
                process.stdin.write(JSON.stringify(data));
                process.stdin.end();
            }
        });
    }
}
