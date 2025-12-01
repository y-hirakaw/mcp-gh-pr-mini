// 共通型定義

export interface PullRequest {
  html_url: string;
  number: number;
  title: string;
  body?: string;
  state: string;
  draft?: boolean;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  requested_reviewers?: {
    login: string;
  }[];
  head: {
    ref: string;
    label: string;
    sha: string;
  };
  base: {
    ref: string;
    label: string;
  };
}

export interface PullRequestComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  html_url: string;
}

export interface PullRequestReviewComment extends PullRequestComment {
  path: string;
  position: number | null;
  commit_id: string;
}

export interface PullRequestFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface FileChangeInfo {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  positions: number[];
}

export interface GitHubApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface GitHubError {
  message: string;
  status: number;
  response?: any;
}

// 認証関連の型
export enum AuthMethod {
  PAT = 'pat',
  CLI = 'cli'
}

export interface AuthConfig {
  method: AuthMethod;
  token?: string;
}

// API リクエスト関連の型
export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ApiClientConfig {
  baseUrl: string;
  userAgent: string;
  apiVersion: string;
}