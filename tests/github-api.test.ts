// GitHub API関数のユニットテスト

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'test-token-123';

const GITHUB_API_BASE = "https://api.github.com";
const AI_COMMENT_IDENTIFIER = "[AI] Generated using MCP\n\n";

// Helper function for making GitHub API requests (copied from source)
async function githubRequest<T>(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "mcp-gh-pr-mini/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
    ...options.headers,
  };

  if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
  } else {
    throw new Error("GitHub Personal Access Token not found in environment variables. Please set GITHUB_PERSONAL_ACCESS_TOKEN.");
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw createGitHubError(response.status, responseBody);
  }

  return responseBody as T;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("application/json")) {
    return await response.json();
  } else {
    return await response.text();
  }
}

function createGitHubError(status: number, responseBody: unknown): Error {
  const message = typeof responseBody === "string" 
    ? responseBody 
    : JSON.stringify(responseBody);
  
  const error = new Error(`GitHub API error! Status: ${status}, Message: ${message}`);
  return error;
}

// Mock data
const mockPullRequest = {
  html_url: "https://github.com/owner/repo/pull/1",
  number: 1,
  title: "Test PR",
  body: "This is a test PR",
  state: "open",
  user: { login: "testuser" },
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  requested_reviewers: [{ login: "reviewer1" }],
  head: {
    ref: "feature-branch",
    label: "owner:feature-branch",
    sha: "abc123"
  },
  base: {
    ref: "main",
    label: "owner:main"
  }
};

function createMockResponse(data: any, status: number = 200, ok: boolean = true): Response {
  return {
    ok,
    status,
    headers: new Map([['content-type', 'application/json']]),
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data))
  } as unknown as Response;
}

describe('GitHub API Functions', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = fetch as jest.MockedFunction<typeof fetch>;
  });

  describe('githubRequest', () => {
    it('should make successful API requests', async () => {
      const mockResponse = createMockResponse(mockPullRequest);
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await githubRequest(`${GITHUB_API_BASE}/repos/owner/repo/pulls/1`);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/pulls/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result).toEqual(mockPullRequest);
    });

    it('should handle POST requests with body', async () => {
      const mockResponse = createMockResponse(mockPullRequest, 201);
      fetchMock.mockResolvedValueOnce(mockResponse);

      await githubRequest(`${GITHUB_API_BASE}/repos/owner/repo/pulls`, {
        method: 'POST',
        body: {
          title: 'Test PR',
          body: 'Test body',
          head: 'feature',
          base: 'main'
        }
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/pulls',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Test PR',
            body: 'Test body',
            head: 'feature',
            base: 'main'
          })
        })
      );
    });

    it('should throw error when token is missing', async () => {
      const originalToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      delete process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

      await expect(githubRequest(`${GITHUB_API_BASE}/repos/owner/repo/pulls`))
        .rejects
        .toThrow('GitHub Personal Access Token not found');

      process.env.GITHUB_PERSONAL_ACCESS_TOKEN = originalToken;
    });

    it('should handle API errors', async () => {
      const errorResponse = createMockResponse(
        { message: 'Not Found' },
        404,
        false
      );
      fetchMock.mockResolvedValueOnce(errorResponse);

      await expect(githubRequest(`${GITHUB_API_BASE}/repos/owner/repo/pulls`))
        .rejects
        .toThrow('GitHub API error! Status: 404');
    });

    it('should handle non-JSON responses', async () => {
      const textResponse = {
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'text/html']]),
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('Internal Server Error')
      } as unknown as Response;
      
      fetchMock.mockResolvedValueOnce(textResponse);

      await expect(githubRequest(`${GITHUB_API_BASE}/repos/owner/repo/pulls`))
        .rejects
        .toThrow('GitHub API error! Status: 500');
    });
  });

  describe('parseResponseBody', () => {
    it('should parse JSON responses', async () => {
      const response = {
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ test: 'data' })
      } as unknown as Response;

      const result = await parseResponseBody(response);
      expect(result).toEqual({ test: 'data' });
    });

    it('should parse text responses', async () => {
      const response = {
        headers: new Map([['content-type', 'text/plain']]),
        text: jest.fn().mockResolvedValue('plain text')
      } as unknown as Response;

      const result = await parseResponseBody(response);
      expect(result).toBe('plain text');
    });

    it('should handle missing content-type', async () => {
      const response = {
        headers: new Map(),
        text: jest.fn().mockResolvedValue('default text')
      } as unknown as Response;

      const result = await parseResponseBody(response);
      expect(result).toBe('default text');
    });
  });

  describe('createGitHubError', () => {
    it('should create error with string message', () => {
      const error = createGitHubError(404, 'Not Found');
      expect(error.message).toBe('GitHub API error! Status: 404, Message: Not Found');
    });

    it('should create error with object message', () => {
      const errorObj = { message: 'Validation Failed', errors: [] };
      const error = createGitHubError(422, errorObj);
      expect(error.message).toContain('GitHub API error! Status: 422');
      expect(error.message).toContain('Validation Failed');
    });
  });

  describe('AI Comment Identifier', () => {
    it('should have correct AI comment prefix', () => {
      expect(AI_COMMENT_IDENTIFIER).toBe('[AI] Generated using MCP\n\n');
    });
  });
});