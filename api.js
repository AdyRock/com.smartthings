/*jslint node: true */

module.exports = {
    async getRoot( { homey, query } )
    {
        //const result = await Homey.app.getSomething( args );
        console.log( "Get: ", query );
        return "OK";
    },
    async getLog( { homey, query } )
    {
        return homey.app.diagLog;
    },
    async getDetect( { homey, query } )
    {
        return homey.app.detectedDevices;
    },
    async getWebHook( { homey, query } )
    {
        console.log( "Get: ", args );
        return "OK";
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
    async sendRoot( { homey, body } )
    {
        console.log( "Post: ", args );
        return homey.app.addSomething( args );
    },
    async sendWebHook( { homey, body } )
    {
        console.log( "Post: ", args );
        //return homey.app.addSomething( args );

        var response = "";
        if ( body.pingData && body.pingData.challenge )
        {
            response = {
                "pingData":
                {
                    "challenge": body.pingData.challenge
                }

            };
        }
        const result = response;
        console.log( "Post Reply: ", response );
        return result;
    },
    async putWebHook( { homey, body } )
    {
        console.log( "Put: ", args );
        return homey.app.updateSomething( args );
    },
    async deleteWebHook( { homey, body } )
    {
        console.log( "Delete: ", args );
        return homey.app.deleteSomething( args );
    }
};