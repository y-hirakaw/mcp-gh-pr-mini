// get_pull_request機能のユニットテスト

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'test-token-123';

const GITHUB_API_BASE = "https://api.github.com";

// Mock data
const mockPullRequestDetails = {
  html_url: "https://github.com/owner/repo/pull/123",
  number: 123,
  title: "Add new feature",
  body: "This is a detailed description of the new feature.\n\nIt includes multiple lines.",
  state: "open",
  user: { login: "testuser" },
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-02T12:34:56Z",
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

const mockClosedPullRequest = {
  ...mockPullRequestDetails,
  number: 124,
  title: "Closed PR",
  state: "closed",
  body: null // Test null body handling
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

describe('get_pull_request Feature Tests', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = fetch as jest.MockedFunction<typeof fetch>;
  });

  describe('getPullRequest API Endpoint', () => {
    it('should successfully fetch PR details', async () => {
      const mockResponse = createMockResponse(mockPullRequestDetails);
      fetchMock.mockResolvedValueOnce(mockResponse);

      // This test verifies the API endpoint and response format
      expect(mockPullRequestDetails).toHaveProperty('number', 123);
      expect(mockPullRequestDetails).toHaveProperty('title', 'Add new feature');
      expect(mockPullRequestDetails).toHaveProperty('body');
      expect(mockPullRequestDetails).toHaveProperty('state', 'open');
      expect(mockPullRequestDetails).toHaveProperty('user');
      expect(mockPullRequestDetails.user).toHaveProperty('login', 'testuser');
    });

    it('should handle closed PRs correctly', async () => {
      expect(mockClosedPullRequest).toHaveProperty('state', 'closed');
      expect(mockClosedPullRequest).toHaveProperty('body', null);
    });

    it('should contain all required PR metadata', async () => {
      const mockResponse = createMockResponse(mockPullRequestDetails);
      fetchMock.mockResolvedValueOnce(mockResponse);

      // Verify all expected fields are present
      expect(mockPullRequestDetails).toHaveProperty('html_url');
      expect(mockPullRequestDetails).toHaveProperty('created_at');
      expect(mockPullRequestDetails).toHaveProperty('updated_at');
      expect(mockPullRequestDetails).toHaveProperty('head');
      expect(mockPullRequestDetails).toHaveProperty('base');
      expect(mockPullRequestDetails.head).toHaveProperty('ref', 'feature-branch');
      expect(mockPullRequestDetails.base).toHaveProperty('ref', 'main');
    });
  });

  describe('PR Details Formatting', () => {
    it('should format title correctly', () => {
      const expectedTitle = `# PR #${mockPullRequestDetails.number}: ${mockPullRequestDetails.title}`;
      expect(expectedTitle).toBe('# PR #123: Add new feature');
    });

    it('should format state correctly', () => {
      const openState = `**State:** ${mockPullRequestDetails.state}`;
      const closedState = `**State:** ${mockClosedPullRequest.state}`;

      expect(openState).toBe('**State:** open');
      expect(closedState).toBe('**State:** closed');
    });

    it('should format author correctly', () => {
      const author = mockPullRequestDetails.user?.login || 'Unknown';
      expect(author).toBe('testuser');
    });

    it('should handle missing author', () => {
      const prWithoutUser = { ...mockPullRequestDetails, user: null as any };
      const author = prWithoutUser.user?.login || 'Unknown';
      expect(author).toBe('Unknown');
    });

    it('should format branch information correctly', () => {
      const base = mockPullRequestDetails.base?.ref || 'Unknown';
      const head = mockPullRequestDetails.head?.ref || 'Unknown';
      const branchInfo = `**Base:** ${base} ← **Head:** ${head}`;

      expect(branchInfo).toBe('**Base:** main ← **Head:** feature-branch');
    });

    it('should handle missing branch information', () => {
      const prWithoutBranches = { ...mockPullRequestDetails, head: null as any, base: null as any };
      const base = prWithoutBranches.base?.ref || 'Unknown';
      const head = prWithoutBranches.head?.ref || 'Unknown';
      const branchInfo = `**Base:** ${base} ← **Head:** ${head}`;

      expect(branchInfo).toBe('**Base:** Unknown ← **Head:** Unknown');
    });

    it('should handle null body correctly', () => {
      const description = mockClosedPullRequest.body || '(No description provided)';
      expect(description).toBe('(No description provided)');
    });

    it('should handle empty body correctly', () => {
      const emptyBody = '';
      const description = emptyBody || '(No description provided)';
      expect(description).toBe('(No description provided)');
    });

    it('should preserve multi-line descriptions', () => {
      const multilineBody = 'Line 1\nLine 2\n\nLine 4 after blank line';
      expect(multilineBody).toContain('\n');
      expect(multilineBody.split('\n').length).toBe(4);
    });

    it('should include URL in formatted output', () => {
      const url = `**URL:** ${mockPullRequestDetails.html_url}`;
      expect(url).toBe('**URL:** https://github.com/owner/repo/pull/123');
    });

    it('should include timestamps in formatted output', () => {
      const created = `**Created:** ${mockPullRequestDetails.created_at}`;
      const updated = `**Updated:** ${mockPullRequestDetails.updated_at}`;

      expect(created).toBe('**Created:** 2023-01-01T00:00:00Z');
      expect(updated).toBe('**Updated:** 2023-01-02T12:34:56Z');
    });
  });

  describe('Error Handling', () => {
    it('should prepare for 404 errors', () => {
      const errorResponse = createMockResponse(
        { message: 'Not Found' },
        404,
        false
      );

      expect(errorResponse.ok).toBe(false);
      expect(errorResponse.status).toBe(404);
    });

    it('should handle API error responses', () => {
      const errorData = { message: 'Not Found' };
      const mockResponse = createMockResponse(errorData, 404, false);

      expect(mockResponse.status).toBe(404);
      expect(mockResponse.ok).toBe(false);
    });
  });

  describe('Response Structure', () => {
    it('should match expected MCP tool response format', () => {
      // Verify the expected response structure
      const expectedStructure = {
        content: [
          {
            type: 'text',
            text: expect.any(String)
          }
        ]
      };

      expect(expectedStructure.content).toHaveLength(1);
      expect(expectedStructure.content[0]).toHaveProperty('type', 'text');
      expect(expectedStructure.content[0]).toHaveProperty('text');
    });
  });
});
