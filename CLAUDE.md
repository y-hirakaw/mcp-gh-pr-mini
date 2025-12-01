# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
必ず日本語でチャットを返してください。

## Project Overview

This is a minimal MCP (Model Context Protocol) server for GitHub pull request operations with dual authentication support. The project provides a focused set of tools for creating, listing, reviewing, and commenting on GitHub pull requests via MCP. It features a modular architecture with support for both Personal Access Token (PAT) and GitHub CLI authentication methods.

## Key Commands

### Development Commands
- `npm run build` - Compile TypeScript to JavaScript and set executable permissions
- `npm test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npx mcp-gh-pr-mini` - Run the built MCP server directly

### Environment Setup

#### Authentication Methods (Auto-detected)
1. **GitHub CLI (Recommended)**: `gh auth login`
2. **Personal Access Token**: Set `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable
   - Required token permissions: Pull requests (read/write), Issues (read/write), Contents (read/write)

#### Debug Mode
- Set `DEBUG=true` environment variable for detailed logging

## Architecture

### Core Structure

#### New Modular Architecture
- **Main Entry Point**: `src/index.ts` - MCP server setup and tool registration
- **Authentication Layer**: `src/auth/` - Dual authentication system
  - `github-auth.ts` - Authentication manager with auto-detection
  - `pat-client.ts` - Personal Access Token authentication client
  - `cli-client.ts` - GitHub CLI authentication client
- **API Layer**: `src/api/` - GitHub API abstraction
  - `github-api.ts` - Unified API client supporting both auth methods
  - `types.ts` - Common type definitions
- **Tools Layer**: `src/tools/` - MCP tool implementations
  - `base-tool.ts` - Base class with common functionality
  - `pr-tools.ts` - Pull request related tools
  - `comment-tools.ts` - Comment related tools
- **Utilities**: `src/utils/` - Helper functions and utilities
  - `logger.ts` - Configurable logging system
  - `helpers.ts` - Common helper functions

#### Key Technologies
- **MCP SDK integration**: Uses `@modelcontextprotocol/sdk` for server framework
- **Dual Authentication**: Supports both PAT and GitHub CLI with automatic fallback
- **TypeScript**: Full type safety with proper interface definitions
- **Zod validation**: Request parameters validated using Zod schemas
- **Modular Design**: Clean separation of concerns with dependency injection

### MCP Tools Provided
1. `create_pull_request` - Create new pull requests (supports draft PRs with `draft: true`)
2. `update_pull_request` - Update existing pull requests (title, body, state, base)
3. `list_open_pull_requests` - List open PRs with metadata
4. `get_pull_request` - Get detailed PR information (title, body, state, author, branches)
5. `get_pull_request_diff` - Get PR diffs in unified format
6. `request_reviewers` - Add reviewers to existing PRs
7. `add_pr_comment` - Add general comments to PRs
8. `add_review_comment` - Add position-specific code review comments
9. `get_pr_comments` - Retrieve all comments (both conversation and review)
10. `get_pr_changes_for_commenting` - Get file changes with commentable positions

### Key Implementation Details

#### Authentication Features
- **Auto-detection**: Automatically detects and selects the best available authentication method
- **PAT Priority**: Prefers Personal Access Token if available for consistency
- **CLI Fallback**: Falls back to GitHub CLI authentication if PAT is not configured
- **Comprehensive Error Handling**: Clear error messages for authentication failures
- **Debug Logging**: Detailed authentication flow logging for troubleshooting

#### API Features
- **Unified API Interface**: Single API client works with both authentication methods
- **Method-specific Routing**: Automatically routes requests through appropriate method (fetch vs CLI)
- **Diff Support**: Special handling for GitHub diff API with proper content-type headers
- **Error Standardization**: Consistent error handling across authentication methods

#### Tool Features
- **Base Tool Class**: Common functionality shared across all tools via inheritance
- **Consistent Response Format**: Standardized success/error response patterns
- **Operation Logging**: Detailed logging of all tool operations
- **AI Comment Identification**: All AI-generated comments prefixed with `[AI] Generated using MCP` identifier
- **Position-specific Comments**: Support for both general PR comments and code review comments
- **Draft PR Support**: Create draft PRs with optional `draft: true` parameter (v1.4.0)

### Testing
- `tests/github-api.test.ts` - GitHub API function unit tests (12 tests, including draft PR)
- `tests/comment-position.test.ts` - Comment position calculation tests (13 tests)
- `tests/get-pull-request.test.ts` - PR retrieval tests (17 tests)
- `tests/basic.test.ts` - Basic environment and setup tests (3 tests)
- All core functionality is covered by unit tests for reliable refactoring

### Configuration Pattern

The MCP server supports flexible configuration in VSCode `settings.json`:

#### Option 1: GitHub CLI Authentication (Recommended)
```json
"mcp": {
  "servers": {
    "mcp-gh-pr-mini": {
      "command": "npx",
      "args": ["mcp-gh-pr-mini"]
    }
  }
}
```

#### Option 2: Personal Access Token
```json
"mcp": {
  "servers": {
    "mcp-gh-pr-mini": {
      "command": "npx",
      "args": ["mcp-gh-pr-mini"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "{token}"
      }
    }
  }
}
```

#### Option 3: Debug Mode
```json
"mcp": {
  "servers": {
    "mcp-gh-pr-mini": {
      "command": "npx",
      "args": ["mcp-gh-pr-mini"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```