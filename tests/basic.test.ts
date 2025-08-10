// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Setup environment variables for testing
process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'test-token-123';

describe('Basic Test', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have environment variables set', () => {
    expect(process.env.GITHUB_PERSONAL_ACCESS_TOKEN).toBe('test-token-123');
  });

  it('should have fetch mocked', () => {
    expect(global.fetch).toBeDefined();
    expect(jest.isMockFunction(global.fetch)).toBe(true);
  });
});