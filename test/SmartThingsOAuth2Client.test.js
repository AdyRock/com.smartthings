const assert = require( 'assert' );
const Module = require( 'module' );
const path = require( 'path' );

const originalLoad = Module._load;

class MockApp {}
class MockDevice {}
class MockDriver {}

const mockHomey = {
    env: {
        SMARTTHINGS_CLIENT_ID: 'not_used',
        SMARTTHINGS_CLIENT_SECRET: 'not_used',
        SMARTTHINGS_API_URL: 'https://api.smartthings.com',
        SMARTTHINGS_TOKEN_URL: 'https://auth-global.api.smartthings.com/oauth/token',
        SMARTTHINGS_AUTHORIZATION_URL: 'https://api.smartthings.com/oauth/authorize',
    },
    manifest: {
        drivers: [ { id: 'test-driver' } ],
    },
    App: MockApp,
    Device: MockDevice,
    Driver: MockDriver,
    settings: {},
};

Module._load = function patchedLoad( request, parent, isMain )
{
    if ( request === 'homey' )
    {
        return mockHomey;
    }

    return originalLoad.call( this, request, parent, isMain );
};

try
{
    const SmartThingsOAuth2Client = require( path.join( __dirname, '..', 'lib', 'SmartThingsOAuth2Client' ) );

    const client = new SmartThingsOAuth2Client( {
        homey: mockHomey,
    } );
    client._clientId = 'not_used';
    client._clientSecret = 'not_used';

    const token = {
        client_id: 'actual-client-id',
        client_secret: 'actual-client-secret',
        access_token: 'access',
        refresh_token: 'refresh',
    };

    client.setToken( { token } );

    assert.strictEqual( client._clientId, 'actual-client-id' );
    assert.strictEqual( client._clientSecret, 'actual-client-secret' );
    console.log( 'SmartThingsOAuth2Client credential resolution regression test passed.' );
}
finally
{
    Module._load = originalLoad;
}
