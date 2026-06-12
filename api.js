/*jslint node: true */

module.exports = {
    async getLog( { homey, query } )
    {
        return homey.app.getFormattedDiagLog();
    },
    async getDetect( { homey, query } )
    {
        if ( !homey.app.hasApiAccess() )
        {
            return {
                error: 'No SmartThings authentication available. Pair or repair the device again.',
                authenticated: false,
                devices: homey.app.detectedDevices || null,
            };
        }

        // Keep this endpoint non-blocking for the settings UI. Any background
        // fetch failures are swallowed to prevent unhandled rejections/crashes.
        homey.app.getDevices( true ).catch( () => null );

        return {
            authenticated: true,
            devices: homey.app.detectedDevices || null,
        };
    },
    async clearLog( { homey, body } )
    {
        homey.app.diagLog = "";
        return homey.app.getFormattedDiagLog();
    },
    async sendCmd( { homey, body } )
    {
        var result = await homey.app.GetURL( body.command );
        if ( result )
        {
            let searchData = JSON.parse( result.body );
            return searchData;
        }

        throw new Error( "No Response" );
    },
    async SendDeviceLog({ homey, body })
    {
        return homey.app.sendLog('deviceLog', body.email, body.description);
    },
    async SendInfoLog({ homey, body })
    {
        return homey.app.sendLog('infoLog', body.email, body.description);
    },
};