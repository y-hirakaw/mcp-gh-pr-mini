// add_review_comment (line/position対応) のユニットテスト

import { CommentTools } from '../src/tools/comment-tools';
import { githubApi } from '../src/api/github-api';

jest.mock('../src/api/github-api', () => ({
  githubApi: {
    getPullRequest: jest.fn(),
    addReviewComment: jest.fn()
  }
}));

const mockedApi = githubApi as jest.Mocked<typeof githubApi>;

const basePr = {
  html_url: 'https://github.com/owner/repo/pull/1',
  number: 1,
  title: 'Test PR',
  state: 'open',
  user: { login: 'testuser' },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  head: { ref: 'feature', label: 'owner:feature', sha: 'abc123' },
  base: { ref: 'main', label: 'owner:main' }
};

describe('CommentTools.addReviewComment', () => {
  let tool: CommentTools;

  beforeEach(() => {
    jest.clearAllMocks();
    tool = new CommentTools();
    mockedApi.getPullRequest.mockResolvedValue(basePr as any);
    mockedApi.addReviewComment.mockResolvedValue({
      id: 1,
      body: 'body',
      user: { login: 'bot' },
      created_at: '2023-01-01T00:00:00Z',
      html_url: 'https://github.com/owner/repo/pull/1#discussion_r1',
      path: 'src/utils.ts',
      position: null,
      commit_id: 'abc123'
    } as any);
  });

  it('sends line/side to the API when line is provided', async () => {
    await tool.addReviewComment({
      owner: 'owner',
      repo: 'repo',
      pr_number: 1,
      body: 'looks off',
      path: 'src/utils.ts',
      line: 124
    });

    expect(mockedApi.addReviewComment).toHaveBeenCalledWith(
      'owner',
      'repo',
      1,
      expect.objectContaining({
        path: 'src/utils.ts',
        commit_id: 'abc123',
        line: 124,
        side: 'RIGHT'
      })
    );
    const sentData = mockedApi.addReviewComment.mock.calls[0][3];
    expect(sentData).not.toHaveProperty('position');
  });

  it('supports start_line for multi-line comments', async () => {
    await tool.addReviewComment({
      owner: 'owner',
      repo: 'repo',
      pr_number: 1,
      body: 'block issue',
      path: 'src/utils.ts',
      line: 20,
      start_line: 15,
      side: 'LEFT'
    });

    expect(mockedApi.addReviewComment).toHaveBeenCalledWith(
      'owner',
      'repo',
      1,
      expect.objectContaining({
        line: 20,
        side: 'LEFT',
        start_line: 15,
        start_side: 'LEFT'
      })
    );
  });

  it('still supports the deprecated position parameter', async () => {
    await tool.addReviewComment({
      owner: 'owner',
      repo: 'repo',
      pr_number: 1,
      body: 'legacy usage',
      path: 'src/utils.ts',
      position: 5
    });

    expect(mockedApi.addReviewComment).toHaveBeenCalledWith(
      'owner',
      'repo',
      1,
      expect.objectContaining({ position: 5 })
    );
    const sentData = mockedApi.addReviewComment.mock.calls[0][3];
    expect(sentData).not.toHaveProperty('line');
  });

  it('sends subject_type file without line/position', async () => {
    await tool.addReviewComment({
      owner: 'owner',
      repo: 'repo',
      pr_number: 1,
      body: 'file level note',
      path: 'src/utils.ts',
      subject_type: 'file'
    });

    const sentData = mockedApi.addReviewComment.mock.calls[0][3];
    expect(sentData).toEqual(
      expect.objectContaining({ subject_type: 'file' })
    );
    expect(sentData).not.toHaveProperty('line');
    expect(sentData).not.toHaveProperty('position');
  });

  it('rejects when both line and position are given', async () => {
    const result = await tool.addReviewComment({
      owner: 'owner',
      repo: 'repo',
      pr_number: 1,
      body: 'ambiguous',
      path: 'src/utils.ts',
      line: 10,
      position: 3
    });

    expect(result.content[0].text).toContain('mutually exclusive');
    expect(mockedApi.addReviewComment).not.toHaveBeenCalled();
  });

  it('rejects when neither line nor position are given', async () => {
    const result = await tool.addReviewComment({
      owner: 'owner',
      repo: 'repo',
      pr_number: 1,
      body: 'missing target',
      path: 'src/utils.ts'
    });

    expect(result.content[0].text).toContain("Either 'line' or 'position' must be provided");
    expect(mockedApi.addReviewComment).not.toHaveBeenCalled();
  });

  it('adds a hint when the API returns 422 for a line-based comment', async () => {
    const apiError = Object.assign(new Error('GitHub API error! Status: 422, Message: Validation Failed'), { status: 422 });
    mockedApi.addReviewComment.mockRejectedValueOnce(apiError);

    const result = await tool.addReviewComment({
      owner: 'owner',
      repo: 'repo',
      pr_number: 1,
      body: 'out of range',
      path: 'src/utils.ts',
      line: 9999
    });

    expect(result.content[0].text).toContain('subject_type: "file"');
  });
});
