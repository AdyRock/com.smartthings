/*jslint node: true */
'use strict';

const {
    OAuth2Driver,
    OAuth2Util,
    fetch,
} = require( 'homey-oauth2app' );

const SMARTTHINGS_API_URL = 'https://api.smartthings.com';

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

class SmartThingsDriver extends OAuth2Driver
{
    async createApiClientFromPat( { apikey, OAuth2SessionId, OAuth2ConfigId } )
    {
        const appName = `homey-${OAuth2SessionId}-${Date.now()}`;

        const response = await fetch( `${SMARTTHINGS_API_URL}/v1/apps`,
        {
            method: 'POST',
            headers:
            {
                Authorization: `Bearer ${apikey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
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
                        'r:locations:*',
                        'r:scenes:*',
                        'x:scenes:*'
                    ],
                    redirectUris: [ 'https://callback.athom.com/oauth2/callback' ],
                },
            } ),
        } );

        if ( !response.ok )
        {
            const error = new Error( await getResponseErrorMessage( response ) );
            error.statusCode = response.status;
            throw error;
        }

        const json = await response.json();
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
            headers:
            {
                Authorization: `Bearer ${apikey}`,
            },
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

        session.setHandler( 'hasClient', async () => !!client );

        session.setHandler( 'validateKey', async ( apikey ) =>
        {
            this.log( `Creating API Client with API Key ${apikey}...` );

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
                    const authorizationUrl = client.getAuthorizationUrl();
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
                    const authorizationUrl = client.getAuthorizationUrl();
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
