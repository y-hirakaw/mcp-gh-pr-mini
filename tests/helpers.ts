// Helper functions and mock data

// Mock response helper
export function createMockResponse(data: any, status: number = 200, ok: boolean = true): Response {
  const response = {
    ok,
    status,
    headers: new Map([['content-type', 'application/json']]),
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data))
  };
  
  return response as unknown as Response;
}

// Sample GitHub API data
export const mockPullRequest = {
  html_url: "https://github.com/owner/repo/pull/1",
  number: 1,
  title: "Test PR",
  body: "This is a test PR",
  state: "open",
  user: {
    login: "testuser"
  },
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  requested_reviewers: [
    { login: "reviewer1" }
  ],
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

export const mockComment = {
  id: 123,
  body: "[AI] Generated using MCP\n\nThis is a test comment",
  user: {
    login: "testuser"
  },
  created_at: "2023-01-01T00:00:00Z",
  html_url: "https://github.com/owner/repo/pull/1#issuecomment-123"
};

export const mockReviewComment = {
  ...mockComment,
  path: "src/test.ts",
  position: 10,
  commit_id: "abc123"
};

export const mockFile = {
  filename: "src/test.ts",
  status: "modified",
  additions: 5,
  deletions: 2,
  changes: 7,
  patch: `@@ -1,3 +1,6 @@
 function test() {
-  console.log('old');
+  console.log('new');
+  console.log('added line 1');
+  console.log('added line 2');
 }`
};