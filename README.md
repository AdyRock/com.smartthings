# SmartThings

Add devices from SmartThings to Homey

## OAuth2 Setup

This app now supports Homey OAuth2 pairing using `homey-oauth2app`.

This now follows the official Homey SmartThings pattern more closely:

1. During pairing, the user provides a SmartThings Personal Access Token.
2. The app creates a per-user SmartThings `API_ONLY` app.
3. The app uses the returned OAuth client credentials for the Homey OAuth2 login flow.
4. Access and refresh tokens are then managed through Homey's OAuth2 session.

Upgrade compatibility:

- Existing installs that still only have a legacy SmartThings PAT continue to work as an automatic fallback after update.
- The legacy PAT is only removed after a real OAuth2 session exists.
- New pairing and repair still use the OAuth2 flow.

Optional app environment variables:

- `SMARTTHINGS_API_URL` (optional, default: `https://api.smartthings.com`)
- `SMARTTHINGS_AUTHORIZATION_URL` (optional, default: `https://api.smartthings.com/oauth/authorize`)
- `SMARTTHINGS_TOKEN_URL` (optional, default: `https://auth-global.api.smartthings.com/oauth/token`)

Create a SmartThings OAuth app and configure redirect URI:

- `https://callback.athom.com/oauth2/callback`

Pairing flow now starts with Homey's OAuth2 login step on supported drivers.
