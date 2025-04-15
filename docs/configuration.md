# Configuration

This document details the configuration options for the Cribl MCP server, primarily managed through environment variables.

## Environment Variables

Create a `.env` file in the project root (by copying `.env.example`) and populate the following variables based on your Cribl deployment and chosen authentication method.

### Required

*   `CRIBL_BASE_URL`: The base URL of your Cribl API deployment (e.g., `https://your-instance.cribl.cloud` or `https://leader-hostname:9000`).
*   `CRIBL_AUTH_TYPE`: The authentication mode to use. Must be either `cloud` or `local`.

### Authentication Specific

**If `CRIBL_AUTH_TYPE=cloud`:**

*   `CRIBL_CLIENT_ID`: Your Cribl.Cloud Organization Client ID for API access.
*   `CRIBL_CLIENT_SECRET`: Your Cribl.Cloud Organization Client Secret for API access.

**If `CRIBL_AUTH_TYPE=local`:**

*   `CRIBL_USERNAME`: The username for a local Cribl user with API access permissions.
*   `CRIBL_PASSWORD`: The password for the specified local Cribl user.

## Authentication Modes

*   **`cloud`**: Uses Client ID and Client Secret credentials, typically for Cribl.Cloud deployments. The server will automatically handle fetching and refreshing bearer tokens.
*   **`local`**: Uses Username and Password credentials, typically for self-hosted Cribl Stream/Edge deployments. The server will automatically handle fetching and refreshing login tokens.

## Example `.env` File

```dotenv
# Base URL for Cribl API
CRIBL_BASE_URL=https://<your-instance>.cribl.cloud

# Choose authentication type: 'cloud' or 'local'
CRIBL_AUTH_TYPE=cloud

# Cloud Auth Credentials (only needed if CRIBL_AUTH_TYPE=cloud)
CRIBL_CLIENT_ID=your_client_id
CRIBL_CLIENT_SECRET=your_client_secret

# Local Auth Credentials (only needed if CRIBL_AUTH_TYPE=local)
CRIBL_USERNAME=
CRIBL_PASSWORD=
``` 