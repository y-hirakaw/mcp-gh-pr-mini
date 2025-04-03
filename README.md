# mcp-gh-pr-mini

A minimal MCP (Model Context Protocol) server for interacting with GitHub pull requests.

This tool allows you to create, list, view diffs, request reviewers, and comment on pull requests in GitHub repositories via MCP.

## ✨ Features

- Create a pull request in a GitHub repository
- List open pull requests
- Get the diff for a pull request
- Request reviewers for a pull request
- Add a comment to a pull request
- Get comments from a pull request

## 🛠️ Setup

This tool runs as an MCP server in your local environment.
You can use it with tools like Copilot Agent or any MCP-compatible client.

### Requirements

- Node.js installed
- VSCode with an MCP-compatible extension (e.g., Copilot Agent)

### Configure in `settings.json`

In your VSCode `settings.json`, add the following:

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

## 🔐 Token Permissions

💡 Use a fine-grained GitHub personal access token
with the following permissions:
* Pull requests: Read and write
* Issues: Read and write
* Contents: Read and write

## 🤔 Why?

The official GitHub MCP plugin requires a Classic token with full repo access, which is too permissive for many use cases.
This project is a safer, minimal alternative focused only on essential pull request tasks.

## 🙏 Note

I’m still new to building MCP servers, so there may be areas that can be improved.
Feedback, suggestions, and contributions are always welcome!
