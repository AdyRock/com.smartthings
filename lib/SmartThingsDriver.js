/*jslint node: true */
'use strict';

const {
    OAuth2Driver,
    OAuth2Util,
    fetch,
} = require( 'homey-oauth2app' );
const SmartThingsOAuth2Client = require( './SmartThingsOAuth2Client' );

const SMARTTHINGS_API_URL = 'https://api.smartthings.com';

function wait( ms )
{
    return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

function isTransientNetworkOrStreamError( err )
{
    const message = `${err?.message || err || ''}`.toLowerCase();
    const code = `${err?.code || err?.cause?.code || ''}`.toUpperCase();

    if ( [ 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT' ].includes( code ) )
    {
        return true;
    }

    return message.includes( 'premature close' )
        || message.includes( 'socket hang up' )
        || message.includes( 'fetch failed' )
        || message.includes( 'invalid response body' )
        || message.includes( 'other side closed' )
        || message.includes( 'network error' );
}

function getSmartThingsFetchHeaders( headers = {} )
{
    const normalizedHeaders = { ...headers };
    const hasAcceptEncoding = Object.keys( normalizedHeaders ).some( ( key ) => key.toLowerCase() === 'accept-encoding' );

    if ( !hasAcceptEncoding )
    {
        normalizedHeaders[ 'Accept-Encoding' ] = 'identity';
    }

    return normalizedHeaders;
}

async function getResponseErrorMessage( response )
{
    let message = `${response.status} ${response.statusText || 'Unknown Error'}`;

    try
    {
        const body = await response.json();
        message = body?.message || body?.error_description || body?.error || message;
    }
    catch ( err )
    {
        try
        {
            const text = await response.text();
            if ( text )
            {
                message = text;
            }
        }
        catch ( readErr )
        {
            // Keep the original HTTP status message.
        }
    }

    return message;
}

function isInvalidOAuth2Identifier( value )
{
    if ( typeof value !== 'string' )
    {
        return !value;
    }

    const trimmed = value.trim();
    return !trimmed || ( trimmed === 'undefined' ) || ( trimmed === 'null' );
}

function hasOAuth2AccessToken( client )
{
    if ( !client || ( typeof client.getToken !== 'function' ) )
    {
        return false;
    }

    const token = client.getToken();
    return !!( token && token.access_token );
}

function ensureSmartThingsAuthorizationUrl( authorizationUrl, log = () => {} )
{
    const expectedBaseUrl = SmartThingsOAuth2Client.AUTHORIZATION_URL || 'https://api.smartthings.com/oauth/authorize';

    try
    {
        const actual = new URL( authorizationUrl );
        const expected = new URL( expectedBaseUrl );
        const matchesSmartThingsHost = actual.hostname.endsWith( 'smartthings.com' );
        const matchesExpectedPath = actual.pathname === expected.pathname;

        if ( matchesSmartThingsHost && matchesExpectedPath )
        {
            return authorizationUrl;
        }

        const repaired = new URL( actual.toString() );
        repaired.protocol = expected.protocol;
        repaired.host = expected.host;
        repaired.pathname = expected.pathname;

        log( `OAuth2 authorization URL corrected from ${actual.origin}${actual.pathname} to ${expected.origin}${expected.pathname}.` );
        return repaired.toString();
    }
    catch ( err )
    {
        log( `OAuth2 authorization URL validation failed: ${err?.message || err}. Using generated URL as-is.` );
        return authorizationUrl;
    }
}

class SmartThingsDriver extends OAuth2Driver
{
    clearExistingOAuth2Client( { OAuth2SessionId, OAuth2ConfigId } )
    {
        try
        {
            const existingClient = this.homey.app.getOAuth2Client( {
                sessionId: OAuth2SessionId,
                configId: OAuth2ConfigId,
            } );

            if ( existingClient && ( typeof existingClient.destroy === 'function' ) )
            {
                existingClient.destroy();
            }
        }
        catch ( err )
        {
            // No registered client for this session/config pair.
        }

        if ( typeof this.homey.app.deleteOAuth2Client === 'function' )
        {
            this.homey.app.deleteOAuth2Client( {
                sessionId: OAuth2SessionId,
                configId: OAuth2ConfigId,
            } );
        }
    }

    async createApiClientFromPat( { apikey, OAuth2SessionId, OAuth2ConfigId } )
    {
        const appName = `homey-${OAuth2SessionId}-${Date.now()}`;
        const requestBody = JSON.stringify(
        {
            appName,
            displayName: 'Homey',
            description: 'SmartThings integration for Homey',
            appType: 'API_ONLY',
            classifications: [ 'DEVICE' ],
            oauth:
            {
                clientName: 'Homey',
                scope: [
                    'r:devices:*',
                    'w:devices:*',
                    'x:devices:*',
                    'r:locations:*'
                ],
                redirectUris: [ 'https://callback.athom.com/oauth2/callback' ],
            },
        } );

        const maxAttempts = 3;
        let json = null;
        let lastErr = null;

        for ( let attempt = 1; attempt <= maxAttempts; attempt += 1 )
        {
            let response = null;

            try
            {
                response = await fetch( `${SMARTTHINGS_API_URL}/v1/apps`,
                {
                    method: 'POST',
                    compress: false,
                    headers:
                    getSmartThingsFetchHeaders(
                    {
                        Authorization: `Bearer ${apikey}`,
                        'Content-Type': 'application/json',
                    } ),
                    body: requestBody,
                } );
            }
            catch ( err )
            {
                lastErr = err;

                if ( isTransientNetworkOrStreamError( err ) && ( attempt < maxAttempts ) )
                {
                    this.homey.app.updateLog( `SmartThings app creation network error (attempt ${attempt}/${maxAttempts}): ${err?.message || err}. Retrying...`, true );
                    await wait( attempt * 500 );
                    continue;
                }

                throw err;
            }

            if ( !response.ok )
            {
                const error = new Error( await getResponseErrorMessage( response ) );
                error.statusCode = response.status;
                throw error;
            }

            try
            {
                json = await response.json();
                break;
            }
            catch ( err )
            {
                lastErr = err;

                if ( isTransientNetworkOrStreamError( err ) && ( attempt < maxAttempts ) )
                {
                    this.homey.app.updateLog( `SmartThings app creation response parse error (attempt ${attempt}/${maxAttempts}): ${err?.message || err}. Retrying...`, true );
                    await wait( attempt * 500 );
                    continue;
                }

                const parseError = new Error( `Invalid response body from SmartThings app creation: ${err?.message || err}` );
                parseError.statusCode = response.status || -1;
                throw parseError;
            }
        }

        if ( !json )
        {
            throw lastErr || new Error( 'Failed to create SmartThings API app due to repeated transient errors.' );
        }

        this.clearExistingOAuth2Client( {
            OAuth2SessionId,
            OAuth2ConfigId,
        } );
        const client = this.homey.app.createOAuth2Client(
        {
            sessionId: OAuth2SessionId,
            configId: OAuth2ConfigId,
        } );

        client._clientId = json.oauthClientId;
        client._clientSecret = json.oauthClientSecret;

        return {
            appId: json.app?.appId || null,
            appName,
            client,
        };
    }

    async validateLegacyPat( apikey )
    {
        const response = await fetch( `${SMARTTHINGS_API_URL}/v1/devices?limit=1`,
        {
            method: 'GET',
            compress: false,
            headers:
            getSmartThingsFetchHeaders(
            {
                Authorization: `Bearer ${apikey}`,
            } ),
        } );

        if ( !response.ok )
        {
            const error = new Error( await getResponseErrorMessage( response ) );
            error.statusCode = response.status;
            throw error;
        }

        return true;
    }

    onPair( session )
    {
        const OAuth2ConfigId = this.getOAuth2ConfigId();
        let OAuth2SessionId = OAuth2Util.getRandomId();

        let appId = null;
        let appName = null;
        let client = null;

        const savedSessions = this.homey.app.getSavedOAuth2Sessions();
        if ( Object.keys( savedSessions ).length )
        {
            OAuth2SessionId = Object.keys( savedSessions )[ 0 ];
            try
            {
                client = this.homey.app.getOAuth2Client(
                {
                    configId: OAuth2ConfigId,
                    sessionId: OAuth2SessionId,
                } );
            }
            catch ( err )
            {
                this.error( err );
            }
        }

        session.setHandler( 'hasClient', async () => hasOAuth2AccessToken( client ) );

        session.setHandler( 'validateKey', async ( apikey ) =>
        {
            this.log( `Creating API Client with API Key ${apikey}...` );

            // Keep the entered PAT as a fallback in case OAuth refresh tokens are later revoked.
            this.homey.settings.set( 'BearerToken', apikey.trim() );

            const result = await this.createApiClientFromPat( {
                apikey,
                OAuth2SessionId,
                OAuth2ConfigId,
            } );

            appId = result.appId;
            appName = result.appName;
            client = result.client;

            return true;
        } );

        session.setHandler( 'showView', async ( viewId ) =>
        {
            if ( viewId === 'login_oauth2' )
            {
                if ( !client )
                {
                    session.emit( 'error', 'Create the SmartThings API client first.' ).catch( this.error );
                    return;
                }

                try
                {
                    const generatedAuthorizationUrl = client.getAuthorizationUrl();
                    const authorizationUrl = ensureSmartThingsAuthorizationUrl( generatedAuthorizationUrl, ( message ) =>
                    {
                        this.homey.app.updateLog( message, true );
                    } );
                    const callback = await this.homey.cloud.createOAuth2Callback( authorizationUrl );

                    callback
                        .on( 'url', ( url ) =>
                        {
                            session.emit( 'url', url ).catch( this.error );
                        } )
                        .on( 'code', ( code ) =>
                        {
                            client.getTokenByCode( { code } )
                                .then( async () =>
                                {
                                    const token = client.getToken();
                                    token.app_id = appId;
                                    token.app_name = appName;
                                    token.client_id = client._clientId;
                                    token.client_secret = client._clientSecret;

                                    // Persist immediately so pair-time API calls can use OAuth2
                                    // even before the add_device event is fired.
                                    client.save();

                                    session.emit( 'authorized' ).catch( this.error );
                                } )
                                .catch( ( err ) =>
                                {
                                    session.emit( 'error', err.message || err.toString() ).catch( this.error );
                                } );
                        } );
                }
                catch ( err )
                {
                    session.emit( 'error', err.message || err.toString() ).catch( this.error );
                }
            }
        } );

        session.setHandler( 'list_devices', async () =>
        {
            const devices = await this.onPairListDevices( { oAuth2Client: client } );
            return devices.map( ( device ) =>
            {
                return {
                    ...device,
                    store:
                    {
                        ...device.store,
                        OAuth2SessionId,
                        OAuth2ConfigId,
                    },
                };
            } );
        } );

        session.setHandler( 'add_device', async () =>
        {
            if ( client )
            {
                client.save();
            }
        } );
    }

    onRepair( session, device )
    {
        let { OAuth2SessionId, OAuth2ConfigId } = device.getStore();
        let client = device.oAuth2Client;
        let appId = null;
        let appName = null;

        if ( isInvalidOAuth2Identifier( OAuth2SessionId ) )
        {
            OAuth2SessionId = OAuth2Util.getRandomId();
        }

        if ( isInvalidOAuth2Identifier( OAuth2ConfigId ) )
        {
            OAuth2ConfigId = this.getOAuth2ConfigId();
        }

        session.setHandler( 'validateKey', async ( apikey ) =>
        {
            try
            {
                this.homey.app.updateLog( `Repair: migrating device ${device.getName()} from PAT to OAuth using session ${OAuth2SessionId} (${OAuth2ConfigId}).`, true );

                // Keep the entered PAT as a fallback in case OAuth refresh tokens are later revoked.
                this.homey.settings.set( 'BearerToken', apikey.trim() );

                const result = await this.createApiClientFromPat( {
                    apikey,
                    OAuth2SessionId,
                    OAuth2ConfigId,
                } );

                appId = result.appId;
                appName = result.appName;
                client = result.client;

                return true;
            }
            catch ( err )
            {
                if ( ( err.statusCode === 401 ) || ( err.statusCode === 403 ) )
                {
                    await this.validateLegacyPat( apikey );

                    this.homey.settings.set( 'BearerToken', apikey.trim() );

                    if ( client && ( typeof client.destroy === 'function' ) )
                    {
                        client.destroy();
                    }

                    client = null;
                    appId = null;
                    appName = null;

                    return {
                        legacyFallback: true,
                    };
                }

                throw err;
            }
        } );

        session.setHandler( 'showView', async ( viewId ) =>
        {
            if ( viewId === 'login_oauth2' )
            {
                try
                {
                    const generatedAuthorizationUrl = client.getAuthorizationUrl();
                    const authorizationUrl = ensureSmartThingsAuthorizationUrl( generatedAuthorizationUrl, ( message ) =>
                    {
                        this.homey.app.updateLog( message, true );
                    } );
                    const callback = await this.homey.cloud.createOAuth2Callback( authorizationUrl );

                    callback
                        .on( 'url', ( url ) =>
                        {
                            session.emit( 'url', url ).catch( this.error );
                        } )
                        .on( 'code', ( code ) =>
                        {
                            client.getTokenByCode( { code } )
                                .then( async () =>
                                {
                                    const token = client.getToken();
                                    token.app_id = appId;
                                    token.app_name = appName;
                                    token.client_id = client._clientId;
                                    token.client_secret = client._clientSecret;
                                    await device.setStoreValue( 'OAuth2SessionId', OAuth2SessionId );
                                    await device.setStoreValue( 'OAuth2ConfigId', OAuth2ConfigId );
                                    device.oAuth2Client = client;
                                    client.save();
                                    session.done().catch( this.error );
                                } )
                                .catch( ( err ) =>
                                {
                                    session.emit( 'error', err.message || err.toString() ).catch( this.error );
                                } );
                        } );
                }
                catch ( err )
                {
                    session.emit( 'error', err.message || err.toString() ).catch( this.error );
                }
            }
        } );
    }
}

module.exports = SmartThingsDriver;
