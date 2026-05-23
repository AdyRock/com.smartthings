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
        'r:locations:*',
        'r:scenes:*',
        'x:scenes:*'
    ];

    get _clientId()
    {
        return this.__clientId || this._token?.client_id || super._clientId;
    }

    set _clientId( value )
    {
        this.__clientId = value;
    }

    get _clientSecret()
    {
        return this.__clientSecret || this._token?.client_secret || super._clientSecret;
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
        return this.getToken();
    }

    async onRefreshToken()
    {
        const token = this.getToken();
        if ( !token )
        {
            throw new OAuth2Error( 'Missing Token' );
        }

        if ( !token.isRefreshable() )
        {
            throw new OAuth2Error( 'Token cannot be refreshed' );
        }

        const body = new URLSearchParams();
        body.append( 'grant_type', 'refresh_token' );
        body.append( 'client_id', this._clientId );
        body.append( 'client_secret', this._clientSecret );
        body.append( 'refresh_token', token.refresh_token );

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
            return this.onHandleRefreshTokenError( { response } );
        }

        this._token = await this.onHandleRefreshTokenResponse( { response } );
        this.save();
        return this.getToken();
    }

    async onShouldRefreshToken( { status } )
    {
        if ( this.getToken()?.refresh_token === null )
        {
            return false;
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
