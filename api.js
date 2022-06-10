/*jslint node: true */

module.exports = {
    async getLog( { homey, query } )
    {
        return homey.app.diagLog;
    },
    async getDetect( { homey, query } )
    {
        homey.app.getDevices(true);
        return homey.app.detectedDevices;
    },
    async clearLog( { homey, body } )
    {
        homey.app.diagLog = "";
        return "ok";
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
        return homey.app.sendLog('deviceLog');
    },
    async SendInfoLog({ homey, body })
    {
        return homey.app.sendLog('infoLog');
    },
};