/*jslint node: true */
'use strict';

const Homey = require( 'homey' );
const { OAuth2Client, OAuth2Error, fetch } = require( 'homey-oauth2app' );
const SmartThingsOAuth2Token = require( './SmartThingsOAuth2Token' );

class SmartThingsOAuth2Client extends OAuth2Client
{
    static CLIENT_ID = Homey.env.SMARTTHINGS_CLIENT_ID || 'not_used';

    static CLIENT_SECRET = Homey.env.SMARTTHINGS_CLIENT_SECRET || 'not_used';

    static API_URL = Homey.env.SMARTTHINGS_API_URL || 'https://api.smartthings.com';

    static TOKEN_URL = Homey.env.SMARTTHINGS_TOKEN_URL || 'https://auth-global.api.smartthings.com/oauth/token';

    static AUTHORIZATION_URL = Homey.env.SMARTTHINGS_AUTHORIZATION_URL || 'https://api.smartthings.com/oauth/authorize';

    static TOKEN = SmartThingsOAuth2Token;

    static SCOPES = [
        'r:devices:*',
        'w:devices:*',
        'x:devices:*',
        'r:locations:*'
    ];

    static isPlaceholderClientCredential( value )
    {
        if ( typeof value !== 'string' )
        {
            return !value;
        }

        const trimmed = value.trim();
        return !trimmed || ( trimmed === 'not_used' ) || ( trimmed === 'undefined' ) || ( trimmed === 'null' );
    }

    logRefreshDiagnostic( message )
    {
        const line = `OAuth2 refresh: ${message}`;
        const throttledLog = this.homey?.app?.shouldLogThrottled;

        if ( typeof throttledLog === 'function' )
        {
            const key = `oauth2-refresh:${message}`;
            if ( !throttledLog.call( this.homey.app, key, 5000 ) )
            {
                return;
            }
        }

        if ( this.homey?.app && ( typeof this.homey.app.updateLog === 'function' ) )
        {
            this.homey.app.updateLog( line, true );
            return;
        }

        if ( typeof this.log === 'function' )
        {
            this.log( line );
            return;
        }

        console.log( line );
    }

    getTokenDiagnostics( token = this.getToken() )
    {
        const resolvedClientId = this._clientId;
        const resolvedClientSecret = this._clientSecret;
        const tokenObtainedAt = token?.obtained_at ?? token?.obtainedAt ?? null;
        const obtainedAt = Number( tokenObtainedAt || 0 );
        const expiresInSeconds = Number( token?.expires_in );
        let timeLeftSeconds = null;

        if ( Number.isFinite( expiresInSeconds ) && ( expiresInSeconds > 0 ) && ( obtainedAt > 0 ) )
        {
            const expiresAtMs = obtainedAt + ( expiresInSeconds * 1000 );
            timeLeftSeconds = Math.max( 0, Math.floor( ( expiresAtMs - Date.now() ) / 1000 ) );
        }

        return JSON.stringify( {
            accessTokenPresent: !!token?.access_token,
            refreshTokenPresent: !!token?.refresh_token,
            tokenClientIdPresent: !SmartThingsOAuth2Client.isPlaceholderClientCredential( token?.client_id ),
            tokenClientSecretPresent: !SmartThingsOAuth2Client.isPlaceholderClientCredential( token?.client_secret ),
            resolvedClientIdPresent: !SmartThingsOAuth2Client.isPlaceholderClientCredential( resolvedClientId ),
            resolvedClientSecretPresent: !SmartThingsOAuth2Client.isPlaceholderClientCredential( resolvedClientSecret ),
            expiresIn: token?.expires_in ?? null,
            expiresAt: token?.expires_at ?? token?.expires ?? null,
            obtainedAt: tokenObtainedAt,
            timeLeftSeconds,
            scope: token?.scope || null,
            installedAppId: token?.installed_app_id || null,
            appId: token?.app_id || null,
        } );
    }

    async getResponseDiagnostics( response )
    {
        const headers = [
            'www-authenticate',
            'x-request-id',
            'x-correlation-id',
            'date',
            'server',
        ].reduce( ( acc, headerName ) =>
        {
            const headerValue = response?.headers?.get?.( headerName );
            if ( headerValue )
            {
                acc[ headerName ] = headerValue;
            }

            return acc;
        }, {} );

        const headerSummary = Object.keys( headers ).length
            ? `headers: ${JSON.stringify( headers )}`
            : 'headers: <none>';

        try
        {
            const body = await response.clone().text();
            if ( !body )
            {
                return `${headerSummary}; body: <empty body>`;
            }

            const bodySummary = body.length > 512 ? `${body.slice( 0, 512 )}...` : body;
            return `${headerSummary}; body: ${bodySummary}`;
        }
        catch ( err )
        {
            return `${headerSummary}; body: <unreadable body: ${err?.message || err}>`;
        }
    }

    get _clientId()
    {
        return this.__clientId ?? this._token?.client_id ?? null;
    }

    set _clientId( value )
    {
        this.__clientId = value;
    }

    get _clientSecret()
    {
        return this.__clientSecret ?? this._token?.client_secret ?? null;
    }

    set _clientSecret( value )
    {
        this.__clientSecret = value;
    }

    async onGetTokenByCode( { code } )
    {
        const body = new URLSearchParams();
        body.append( 'grant_type', 'authorization_code' );
        body.append( 'code', code );
        body.append( 'redirect_uri', this._redirectUrl );

        const response = await fetch( this._tokenUrl,
        {
            headers:
            {
                Authorization: `Basic ${Buffer.from( `${this._clientId}:${this._clientSecret}` ).toString( 'base64' )}`,
            },
            body,
            method: 'POST',
        } );

        if ( !response.ok )
        {
            return this.onHandleGetTokenByCodeError( { response } );
        }

        this._token = await this.onHandleGetTokenByCodeResponse( { response } );
        this._token.obtained_at = Date.now();
        return this.getToken();
    }

    async onRefreshToken()
    {
        const token = this.getToken();
        if ( !token )
        {
            this.logRefreshDiagnostic( 'refresh requested but no token is stored.' );
            throw new OAuth2Error( 'Missing Token' );
        }

        if ( !token.isRefreshable() )
        {
            this.logRefreshDiagnostic( `refresh requested for non-refreshable token: ${this.getTokenDiagnostics( token )}` );
            throw new OAuth2Error( 'Token cannot be refreshed' );
        }

        const clientId = this._clientId;
        const clientSecret = this._clientSecret;
        if ( SmartThingsOAuth2Client.isPlaceholderClientCredential( clientId ) || SmartThingsOAuth2Client.isPlaceholderClientCredential( clientSecret ) )
        {
            const reason = 'SmartThings OAuth client credentials are missing for this session';
            this.logRefreshDiagnostic( `${reason}; token metadata ${this.getTokenDiagnostics( token )}` );

            if ( typeof this.homey?.app?.suspendPollingForOAuth2RefreshFailure === 'function' )
            {
                this.homey.app.suspendPollingForOAuth2RefreshFailure( {
                    statusCode: 401,
                    reason,
                } );
            }

            throw new OAuth2Error( reason, 401 );
        }

        this.logRefreshDiagnostic( `starting refresh via ${this._tokenUrl} with token metadata ${this.getTokenDiagnostics( token )}` );

        const body = new URLSearchParams();
        body.append( 'grant_type', 'refresh_token' );
        body.append( 'client_id', clientId );
        body.append( 'client_secret', clientSecret );
        body.append( 'refresh_token', token.refresh_token );

        const response = await fetch( this._tokenUrl,
        {
            headers:
            {
                Authorization: `Basic ${Buffer.from( `${clientId}:${clientSecret}` ).toString( 'base64' )}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
            method: 'POST',
        } );

        if ( !response.ok )
        {
            const responseDiagnostics = await this.getResponseDiagnostics( response );
            this.logRefreshDiagnostic( `refresh failed with ${response.status} ${response.statusText || 'Unknown Error'}; response: ${responseDiagnostics}` );

            if ( response.status === 401 && ( typeof this.homey?.app?.suspendPollingForOAuth2RefreshFailure === 'function' ) )
            {
                this.homey.app.suspendPollingForOAuth2RefreshFailure( {
                    statusCode: response.status,
                    reason: 'SmartThings rejected the OAuth refresh token',
                    invalidateSession: true,
                    responseDiagnostics,
                } );
            }

            return this.onHandleRefreshTokenError( { response } );
        }

        this._token = await this.onHandleRefreshTokenResponse( { response } );
        this._token.obtained_at = Date.now();
        this.logRefreshDiagnostic( `refresh succeeded; new token metadata ${this.getTokenDiagnostics( this._token )}` );

        if ( typeof this.homey?.app?.clearOAuth2RefreshFailureState === 'function' )
        {
            this.homey.app.clearOAuth2RefreshFailureState();
        }

        this.save();
        return this.getToken();
    }

    async onShouldRefreshToken( { status } )
    {
        const token = this.getToken();
        if ( token?.refresh_token === null )
        {
            this.logRefreshDiagnostic( `received ${status}; skipping refresh because refresh_token is null.` );
            return false;
        }

        if ( status === 401 )
        {
            this.logRefreshDiagnostic( `received 401 from API; refresh will be attempted with token metadata ${this.getTokenDiagnostics( token )}` );
        }

        return status === 401;
    }

    async onHandleNotOK( { body, status, statusText } )
    {
        let message = `${status} ${statusText || 'Unknown Error'}`;
        const normalizeMessage = ( value ) =>
        {
            if ( typeof value === 'string' )
            {
                return value;
            }

            if ( value && typeof value === 'object' )
            {
                try
                {
                    return JSON.stringify( value );
                }
                catch ( err )
                {
                    return String( value );
                }
            }

            return String( value );
        };

        if ( body && typeof body === 'object' )
        {
            if ( body.error_description )
            {
                message = normalizeMessage( body.error_description );
            }
            else if ( body.error )
            {
                message = normalizeMessage( body.error );
            }
            else if ( body.message )
            {
                message = normalizeMessage( body.message );
            }
        }

        const err = new OAuth2Error( message, status );
        err.status = status;
        err.statusCode = status;
        return err;
    }
}

module.exports = SmartThingsOAuth2Client;
