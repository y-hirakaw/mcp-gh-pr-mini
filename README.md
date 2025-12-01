# mcp-gh-pr-mini

A minimal MCP (Model Context Protocol) server for interacting with GitHub pull requests with dual authentication support.

This tool allows you to create, list, view details and diffs, request reviewers, and comment on pull requests in GitHub repositories via MCP. It supports both Personal Access Token (PAT) and GitHub CLI authentication methods.

**Latest Version: 1.4.0** - Added draft PR creation support with `draft` parameter.

## ✨ Features

### 🎯 MCP Tools Available

#### `create_pull_request`
Creates a new pull request in a GitHub repository.
- **Parameters**: owner, repo, title, body, head (source branch), base (target branch), draft (optional)
- **Returns**: PR number and URL for immediate access
- **Features**:
  - ✅ Create ready-for-review PRs (default)
  - ✅ Create draft PRs with `draft: true` 🆕 v1.4.0
  - ✅ Draft status displayed in success message
- **Tested**: ✅ Works with both PAT and GitHub CLI authentication

#### `update_pull_request`
Updates an existing pull request in a GitHub repository.
- **Parameters**: owner, repo, pr_number, optional title, body, base, state (open/closed)
- **Returns**: Updated PR details with confirmation
- **Features**:
  - ✅ Update title and description
  - ✅ Change target branch (base)
  - ✅ Open or close pull requests
  - ✅ Partial updates (only specified fields are modified)
- **Tested**: ✅ Successfully updates PR metadata and state

#### `list_open_pull_requests`
Lists all open pull requests in a repository.
- **Parameters**: owner, repo, optional limit (default: 10)
- **Returns**: PR numbers, titles, authors, and URLs
- **Tested**: ✅ Handles repositories with no open PRs gracefully

#### `get_pull_request` 🆕 v1.3.0
Gets detailed information about a specific pull request.
- **Parameters**: owner, repo, pr_number
- **Returns**: PR title, description, state, author, branches, and metadata
- **Features**:
  - ✅ Retrieves complete PR details including title and body
  - ✅ Shows PR state, author, and branch information
  - ✅ Displays creation and update timestamps
  - ✅ Provides direct URL to the PR
- **Use Case**: Similar to `gh pr view {pr_number} --repo {owner/repository} --json title,body`
- **Tested**: ✅ 17 comprehensive unit tests covering all edge cases

#### `get_pull_request_diff`
Retrieves the unified diff for a pull request.
- **Parameters**: owner, repo, pr_number
- **Returns**: Complete diff in unified format showing all file changes
- **Tested**: ✅ Correctly formats diffs for new, modified, and deleted files

#### `request_reviewers`
Adds reviewers to an existing pull request.
- **Parameters**: owner, repo, pr_number, reviewers (array of GitHub usernames)
- **Returns**: Confirmation of reviewer assignment
- **Tested**: ✅ Successfully assigns reviewers to pull requests

#### `add_pr_comment`
Adds a general comment to a pull request conversation.
- **Parameters**: owner, repo, pr_number, body (comment text)
- **Returns**: Comment ID and URL for reference
- **Special Features**: 
  - ✅ Automatically prefixes comments with "[AI] Generated using MCP"
  - ✅ Tested with both authentication methods

#### `add_review_comment`
Adds a position-specific code review comment to changed lines.
- **Parameters**: owner, repo, pr_number, body, path (file path), position
- **Returns**: Review comment ID and URL
- **Tested**: ✅ Successfully adds inline code comments at specific positions

#### `get_pr_comments`
Retrieves all comments from a pull request.
- **Parameters**: owner, repo, pr_number
- **Returns**: Categorized list of conversation and review comments
- **Features**:
  - ✅ Separates general PR comments from code review comments
  - ✅ Shows comment metadata (author, date, URLs)
  - ✅ Displays AI-generated comment identifiers

#### `get_pr_changes_for_commenting`
Gets file changes with positions available for adding review comments.
- **Parameters**: owner, repo, pr_number
- **Returns**: Detailed file changes with commentable positions
- **Features**:
  - ✅ Lists all changed files with their status (added, modified, deleted)
  - ✅ Provides exact position numbers for inline comments
  - ✅ Shows complete patch information for each file

### Authentication Methods 🔐
- **Personal Access Token (PAT)**: Traditional token-based authentication
- **GitHub CLI**: Leverage existing `gh` CLI authentication  
- **Auto-detection**: Automatically selects the best available authentication method
- **Intelligent Fallback**: Seamlessly switches between authentication methods when one fails
  - Primary: PAT authentication (if configured)
  - Fallback: GitHub CLI authentication (if available)
  - Zero user intervention required during authentication failures
  - Maintains consistent API responses across authentication methods

## 🛠️ Setup

This tool runs as an MCP server in your local environment.
You can use it with tools like Copilot Agent or any MCP-compatible client.

### Requirements

- Node.js installed
- VSCode with an MCP-compatible extension (e.g., Copilot Agent)

## 🔐 Authentication System

### Recommended: GitHub CLI Authentication  
```bash
gh auth login  # One-time setup
npx mcp-gh-pr-mini  # Works immediately
```

### Alternative: Personal Access Token
Set the environment variable `GITHUB_PERSONAL_ACCESS_TOKEN` if you prefer PAT authentication.

**Required PAT Permissions:**
| Permission | Access Level |
|------------|--------------|
| **Pull requests** | **Read & Write** |
| **Issues** | **Read & Write** |
| Metadata | Read (automatic) |

### Configure in `settings.json`

#### With GitHub CLI Authentication
```jsonc
"mcp": {
  "servers": {
    "mcp-gh-pr-mini": {
      "command": "npx",
      "args": ["mcp-gh-pr-mini"]
    }
  }
}
```

#### With Personal Access Token
```jsonc
"mcp": {
  "servers": {
    "mcp-gh-pr-mini": {
      "command": "npx",
      "args": ["mcp-gh-pr-mini"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "{Your Fine-Grained GitHub Token}"
      }
    }
  }
}
```

## 🔐 Authentication Details

### Dual Authentication System
This MCP server features an intelligent dual authentication system that automatically detects and uses the best available authentication method:

### GitHub CLI (Recommended) ⭐
- **Seamless Integration**: Uses your existing GitHub CLI authentication
- **Universal Support**: Works with all GitHub CLI authentication methods (OAuth, PAT, SSH)
- **Zero Configuration**: No additional token setup required after `gh auth login`
- **Enterprise Ready**: Full support for organization SSO and SAML
- **Automatic Detection**: Server detects GitHub CLI availability and authentication status

### Personal Access Token (Alternative)
- **Direct API Access**: Uses GitHub's REST API with personal access tokens
- **Fine-Grained Control**: Supports fine-grained personal access tokens for precise permissions
- **Required Permissions**:
  * **Pull requests**: Read and write
  * **Issues**: Read and write  
  * **Contents**: Read and write
- **Fallback Ready**: Automatically used as fallback when GitHub CLI is unavailable

### Authentication Flow 🔄
1. **Detection Phase**: Server checks for available authentication methods on startup
2. **Priority Selection**: Personal Access Token is preferred (if configured) for consistency
3. **Automatic Fallback**: If PAT fails or is invalid, automatically switches to GitHub CLI
4. **Transparent Operation**: Users never see authentication errors - fallback happens seamlessly
5. **Consistent Experience**: All MCP tools work identically regardless of authentication method used

### Tested Scenarios ✅
- ✅ **PAT Only**: Works with valid personal access tokens
- ✅ **GitHub CLI Only**: Works with GitHub CLI authentication alone
- ✅ **Automatic Fallback**: Seamlessly switches from invalid PAT to GitHub CLI
- ✅ **Mixed Environments**: Handles scenarios where one method becomes unavailable
- ✅ **Error Recovery**: Graceful handling of authentication failures without user disruption

## 🚀 Usage Examples

### Basic Workflow Example
```typescript
// 1. Create a pull request
create_pull_request({
  owner: "username",
  repo: "repository",
  title: "Add new feature",
  body: "Description of the changes",
  head: "feature-branch",
  base: "main"
})

// 1a. Create a draft pull request (NEW in v1.4.0)
create_pull_request({
  owner: "username",
  repo: "repository",
  title: "WIP: Add new feature",
  body: "Work in progress - not ready for review yet",
  head: "feature-branch",
  base: "main",
  draft: true  // Creates as draft PR
})

// 1.5. Get PR details to review information
get_pull_request({
  owner: "username",
  repo: "repository",
  pr_number: 1
})

// 1.6. Update the pull request if needed
update_pull_request({
  owner: "username",
  repo: "repository",
  pr_number: 1,
  title: "Add new feature (updated)",
  body: "Updated description with more details"
})

// 2. Get the diff to review changes
get_pull_request_diff({
  owner: "username",
  repo: "repository", 
  pr_number: 1
})

// 3. Add a general comment
add_pr_comment({
  owner: "username",
  repo: "repository",
  pr_number: 1,
  body: "This looks great! Just a few small suggestions."
})

// 4. Add a specific code review comment
add_review_comment({
  owner: "username",
  repo: "repository",
  pr_number: 1,
  body: "Consider using const instead of let here for immutability.",
  path: "src/index.ts",
  position: 15
})

// 5. Request reviewers
request_reviewers({
  owner: "username",
  repo: "repository",
  pr_number: 1,
  reviewers: ["reviewer1", "reviewer2"]
})
```

### Working with Comments
```typescript
// Get all comments to review feedback
get_pr_comments({
  owner: "username",
  repo: "repository",
  pr_number: 1
})

// Get file changes to find reviewable positions
get_pr_changes_for_commenting({
  owner: "username", 
  repo: "repository",
  pr_number: 1
})
// Returns positions where you can add review comments
```

### Repository Management
```typescript
// List all open PRs to get an overview
list_open_pull_requests({
  owner: "username",
  repo: "repository",
  limit: 5
})
```

## 💡 Best Practices

### Authentication Setup
1. **Use GitHub CLI for convenience**: Run `gh auth login` once and forget about tokens
2. **PAT for CI/CD**: Use Personal Access Tokens in automated environments
3. **Test authentication**: Verify with `gh auth status` before using the tools

### Comment Management
- **AI Identification**: All AI-generated comments are automatically prefixed with "[AI] Generated using MCP"
- **Position-specific comments**: Use `get_pr_changes_for_commenting` first to find valid positions
- **Review workflow**: Get diff → identify issues → add targeted review comments

### Error Handling
- **Authentication failures**: The system automatically falls back between methods
- **Invalid PRs**: Tools gracefully handle non-existent PRs or repositories
- **Network issues**: Built-in retry logic for transient failures

## 🤔 Why?

This project provides a minimal, focused implementation for essential pull request tasks via MCP.
It's designed to be simple and easy to understand, making it a good reference for building MCP servers.

## 🔧 Troubleshooting

### Authentication Issues

#### "Authentication failed" or "Unauthorized"
1. **Check GitHub CLI status**: Run `gh auth status` to verify authentication
2. **Re-authenticate GitHub CLI**: Run `gh auth login` to refresh credentials
3. **Verify PAT permissions**: Ensure your personal access token has required permissions:
   - Pull requests: Read and write
   - Issues: Read and write  
   - Contents: Read and write
4. **Test with a simple command**: Try `gh pr list` in a GitHub repository to verify CLI access

#### "Repository not found" 
- **Verify repository access**: Ensure your authentication method has access to the target repository
- **Check repository name**: Confirm owner and repository name are spelled correctly
- **Private repository access**: For private repos, ensure your token/CLI has appropriate permissions

#### Authentication Method Priority
The server uses this fallback order:
1. **Personal Access Token** (if `GITHUB_PERSONAL_ACCESS_TOKEN` is set)
2. **GitHub CLI** (if `gh auth status` succeeds)
3. **Error** (if neither method is available)

### Common Issues

#### "Invalid position for review comment"
- Use `get_pr_changes_for_commenting` first to find valid positions
- Position numbers correspond to lines in the diff, not the original file
- Only modified or added lines can receive review comments

#### "Pull request not found"
- Verify the PR number exists and is accessible
- Check if you have read permissions for the repository
- Ensure the PR hasn't been deleted or moved

#### MCP Server Connection Issues
1. **Restart VSCode**: Sometimes MCP connections need to be refreshed
2. **Check settings.json syntax**: Ensure your MCP configuration is valid JSON
3. **Verify npx installation**: Run `npx mcp-gh-pr-mini --version` to test
4. **Enable debug logging**: Add `"DEBUG": "true"` to environment variables

### Debug Mode

Enable detailed logging by adding debug environment variable:

```jsonc
"mcp": {
  "servers": {
    "mcp-gh-pr-mini": {
      "command": "npx",
      "args": ["mcp-gh-pr-mini"],
      "env": {}
    }
  }
}
```

This will show detailed authentication flow and API calls in the MCP server logs.

### Getting Help

If you encounter issues:
1. **Check authentication**: Verify both `gh auth status` and token permissions
2. **Test with minimal example**: Try listing PRs in a public repository first
3. **Review debug logs**: Enable debug mode to see detailed error information
4. **File an issue**: Include debug logs and specific error messages

## 📝 Changelog

### Version 1.4.0 (2025-12-01)
- ✨ Added draft PR creation support with optional `draft` parameter
- 🎯 Create PRs as draft before implementation is complete
- 📊 Draft status displayed in success message
- ✅ Comprehensive test coverage for draft PR functionality

### Version 1.3.0 (2025-11-07)
- ✨ Added `get_pull_request` tool to retrieve detailed PR information (title, body, state, author, branches)
- 📚 Similar functionality to `gh pr view --json title,body`

### Version 1.2.0
- Added `update_pull_request` tool for modifying existing PRs
- Support for partial PR updates (title, body, state, base)

### Version 1.1.0
- Initial release with core PR management features

## 🙏 Note

I'm still new to building MCP servers, so there may be areas that can be improved.
Feedback, suggestions, and contributions are always welcome!
