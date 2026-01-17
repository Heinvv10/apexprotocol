# OAuth Configuration Guide

This guide explains how to set up OAuth credentials for social media channel connections in Apex.

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# =============================================================================
# SOCIAL MEDIA OAUTH (Required for channel connections)
# =============================================================================

# OAuth Token Encryption Key
# Used to encrypt stored OAuth access/refresh tokens
# Generate with: openssl rand -hex 32
OAUTH_ENCRYPTION_KEY=

# LinkedIn OAuth
# Get credentials from https://www.linkedin.com/developers/apps
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/oauth/linkedin/callback

# Twitter/X OAuth 2.0
# Get credentials from https://developer.twitter.com/en/portal/dashboard
# Enable OAuth 2.0 with PKCE in your app settings
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_REDIRECT_URI=http://localhost:3000/api/oauth/twitter/callback

# Facebook/Meta OAuth (also used for Instagram)
# Get credentials from https://developers.facebook.com/apps/
# Enable Instagram Basic Display API and Facebook Login
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/oauth/facebook/callback

# YouTube/Google OAuth
# Get credentials from https://console.cloud.google.com/apis/credentials
# Enable YouTube Data API v3
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/youtube/callback

# TikTok OAuth
# Get credentials from https://developers.tiktok.com/apps/
# Enable Login Kit and Content Posting API
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=http://localhost:3000/api/oauth/tiktok/callback
```

## Platform-Specific Setup

### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app or select an existing one
3. Under **Auth** tab:
   - Add redirect URL: `http://localhost:3000/api/oauth/linkedin/callback`
4. Under **Products** tab, request access to:
   - Sign In with LinkedIn using OpenID Connect
   - Share on LinkedIn
5. Copy Client ID and Client Secret to your environment

### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app, or select existing
3. Under **User authentication settings**:
   - Enable OAuth 2.0
   - Set App Type: **Web App**
   - Add callback URL: `http://localhost:3000/api/oauth/twitter/callback`
4. Under **Keys and tokens**:
   - Generate OAuth 2.0 Client ID and Client Secret
5. Ensure your app has the following scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access` (for refresh tokens)

### Facebook (also enables Instagram)

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Create a new app (Business type)
3. Add **Facebook Login** product:
   - Enable Web platform
   - Add Valid OAuth Redirect URI: `http://localhost:3000/api/oauth/facebook/callback`
4. Add **Instagram Basic Display** product (for Instagram access)
5. Under **Settings > Basic**:
   - Copy App ID and App Secret

**Required Permissions:**
- `pages_manage_posts`
- `pages_read_engagement`
- `instagram_basic`
- `instagram_content_publish`

### YouTube (Google)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **YouTube Data API v3**
4. Go to **Credentials** > **Create Credentials** > **OAuth Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/oauth/youtube/callback`
7. Copy Client ID and Client Secret

**Required Scopes:**
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube.force-ssl`
- `https://www.googleapis.com/auth/userinfo.profile`

### TikTok

1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create a new app
3. Enable **Login Kit** product
4. Enable **Content Posting API** product
5. Add redirect URI: `http://localhost:3000/api/oauth/tiktok/callback`
6. Copy Client Key and Client Secret

**Required Scopes:**
- `user.info.basic`
- `video.publish`

## Production Setup

For production, update the redirect URIs to use your production domain:

```bash
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/oauth/linkedin/callback
TWITTER_REDIRECT_URI=https://yourdomain.com/api/oauth/twitter/callback
FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/oauth/facebook/callback
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/youtube/callback
TIKTOK_REDIRECT_URI=https://yourdomain.com/api/oauth/tiktok/callback
```

Also update the redirect URIs in each platform's developer console.

## Token Encryption

The `OAUTH_ENCRYPTION_KEY` is used to encrypt OAuth tokens stored in the database. Generate a secure key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**Important:** Never commit this key to version control. Use different keys for each environment.

## API Endpoints

### Connect Channel

```
POST /api/social/oauth/connect
```

Initiates OAuth flow for connecting a social channel.

Request body:
```json
{
  "platform": "linkedin",
  "brandId": "brand_123",
  "returnUrl": "/admin/social-media/channels"
}
```

### Get Connected Accounts

```
GET /api/social/accounts?brandId=brand_123
```

Returns all connected social accounts for a brand.

### Disconnect Account

```
DELETE /api/social/accounts?brandId=brand_123&platform=linkedin
```

Disconnects and removes OAuth tokens for a platform.

### Publish Content

```
POST /api/social/publish
```

Publishes content to connected social platforms.

Request body:
```json
{
  "brandId": "brand_123",
  "platform": "linkedin",
  "content": {
    "text": "Hello from Apex!",
    "link": "https://example.com",
    "linkTitle": "Check this out"
  }
}
```

## Troubleshooting

### "OAuth for {platform} is not yet configured"

This error means the required environment variables are not set. Check that:
1. The platform's client ID/secret are set in `.env.local`
2. The redirect URI matches what's configured in the platform's developer console

### "Token has expired"

OAuth tokens expire after a period (varies by platform). The system will:
1. Mark the connection as "expired"
2. Show a "Reconnect" button in the UI
3. User must re-authorize to get fresh tokens

### "Connection is revoked"

The user revoked access from the platform's settings. They need to:
1. Go to the platform's connected apps settings
2. Remove the Apex app (if listed)
3. Reconnect through Apex

### CORS Errors

If you see CORS errors during OAuth callback:
1. Verify the redirect URI exactly matches in both env vars and platform console
2. Ensure no trailing slashes are mismatched
3. Check that the platform supports your callback domain
