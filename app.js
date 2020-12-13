'use strict';

if (process.env.DEBUG === '1') {
	require('inspector').open(9222, '0.0.0.0')
}

const Homey = require( 'homey' );
const https = require( "https" );

const CapabilityMap2 = {
    "switch":
    {
        class: "",
        exclude: "", // Ignore if the device has this ST capability
        capabilities: [ "onoff" ], // The list of Homey capabilities to add
        icon: "socket.svg" // Icon to apply to the device
    },
    "switchLevel":
    {
        class: "light",
        exclude: "",
        capabilities: [ "dim" ],
        icon: "light.svg"
    },
    "contactSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ "alarm_contact" ],
        icon: "door.svg"
    },
    "battery":
    {
        class: "",
        exclude: "",
        capabilities: [ "measure_battery" ],
        icon: ""
    },
    "presenceSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ "alarm_presence" ],
        icon: "presence.svg"
    },
    "motionSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ "alarm_motion" ],
        icon: "presence.svg"
    },
    "powerConsumptionReport":
    {
        class: "",
        exclude: "",
        capabilities: [ "measure_power", "meter_power", "meter_power.delta" ],
        icon: ""
    },
    "remoteControlStatus":
    {
        class: "",
        exclude: "",
        capabilities: [ "remote_status" ],
        icon: ""
    },
    "washerOperatingState":
    {
        class: "",
        exclude: "",
        capabilities: [ "washer_mode", "washer_job_status", "completion_time" ],
        icon: ""
    },
    "custom.washerWaterTemperature":
    {
        class: "",
        exclude: "",
        capabilities: [ "water_temperature" ],
        icon: ""
    },
    "custom.washerSpinLevel":
    {
        class: "",
        exclude: "",
        capabilities: [ "spin_level" ],
        icon: ""
    },
    "custom.washerRinseCycles":
    {
        class: "",
        exclude: "",
        capabilities: [ "rinse_cycles" ],
        icon: ""
    },
    "washerMode":
    {
        class: "other",
        exclude: "",
        capabilities: [ "washer_status" ],
        icon: "washingmachine.svg"
    },
    "audioVolume":
    {
        class: "TV",
        exclude: "airConditionerMode",
        capabilities: [ 'volume_set', 'volume_down', 'volume_up' ],
        icon: ""
    },
    "tvChannel":
    {
        class: "",
        exclude: "",
        capabilities: [ 'channel_down', 'channel_up' ],
        icon: "television.svg"
    },
    "audioMute":
    {
        class: "",
        exclude: "",
        capabilities: [ 'volume_mute' ],
        icon: ""
    },
    "airConditionerMode":
    {
        class: "fan",
        exclude: "",
        capabilities: [ 'aircon_mode', 'ac_lights_on', 'ac_lights_off', 'silent_mode' ],
        icon: "aircon.svg"
    },
    "airConditionerFanMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'aircon_fan_mode' ],
        icon: ""
    },
    "fanOscillationMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'aircon_fan_oscillation_mode' ],
        icon: ""
    },
    "temperatureMeasurement":
    {
        class: "",
        exclude: "",
        capabilities: [ 'measure_temperature' ],
        icon: ""
    },
    "thermostatCoolingSetpoint":
    {
        class: "",
        exclude: "",
        capabilities: [ 'target_temperature' ],
        icon: ""
    },
    "relativeHumidityMeasurement":
    {
        class: "",
        exclude: "",
        capabilities: [ 'measure_humidity' ],
        icon: ""
    },
    "custom.dustFilter":
    {
        class: "",
        exclude: "",
        capabilities: [ 'dust_filter_status' ],
        icon: ""
    },
    "custom.airConditionerOptionalMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'aircon_option'],
        icon: ""
    },
    "custom.autoCleaningMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'aircon_auto_cleaning_mode'],
        icon: ""
    },
    "energyMeter":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'measure_power'],
        icon: ""
    },
    "powerMeter":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'meter_power'],
        icon: ""
    }
}

class MyApp extends Homey.App
{
    async onInit()
    {
        this.diagLog = "";
        this.log( 'SmartThings is starting...' );

        this.BearerToken = Homey.ManagerSettings.get( 'BearerToken' );
        if ( Homey.ManagerSettings.get( 'pollInterval' ) < 1 )
        {
            Homey.ManagerSettings.set( 'pollInterval', 5 );
        }

        this.log( "SmartThings has started with Key: " + this.BearerToken + " Polling every " + Homey.ManagerSettings.get( 'pollInterval' ) + " seconds" );

        // Callback for app settings changed
        Homey.ManagerSettings.on( 'set', async function( setting )
        {
            Homey.app.updateLog( "Setting " + setting + " has changed." );

            if ( setting === 'BearerToken' )
            {
                this.BearerToken = Homey.ManagerSettings.get( 'BearerToken' );
            }

            if ( setting === 'pollInterval' )
            {
                clearTimeout( Homey.app.timerID );
                if ( Homey.app.BearerToken && !Homey.app.timerProcessing )
                {
                    if ( Homey.ManagerSettings.get( 'pollInterval' ) > 1 )
                    {
                        Homey.app.timerID = setTimeout( Homey.app.onPoll, Homey.ManagerSettings.get( 'pollInterval' ) * 1000 );
                    }
                }
            }
        } );

        this.onPoll = this.onPoll.bind( this );

        if ( this.BearerToken )
        {
            if ( Homey.ManagerSettings.get( 'pollInterval' ) > 1 )
            {
                this.updateLog( "Start Polling" );
                this.timerID = setTimeout( this.onPoll, 10000 );
            }
        }

        this.updateLog( '************** App has initialised. ***************' );
    }

    async getDevices()
    {
        //https://api.smartthings.com/v1/devices
        const url = "devices";
        let searchResult = await Homey.app.GetURL( url );
        if ( searchResult )
        {
            let searchData = JSON.parse( searchResult.body );
            this.detectedDevices = JSON.stringify( searchData, null, 2 );
            Homey.ManagerApi.realtime( 'com.smartthings.detectedDevicesUpdated', { 'devices': this.detectedDevices } );

            const devices = [];

            // Create an array of devices
            for ( const device of searchData[ 'items' ] )
            {
                Homey.app.updateLog( "Found device: " );
                Homey.app.updateLog( JSON.stringify( device, null, 2 ) );

                var data = {};
                data = {
                    "id": device[ 'deviceId' ],
                };

                var iconName = "";
                var capabilities = [];
                var components = device[ 'components' ];

                for ( const component of components )
                {
                    let className = 'socket';
                    var subCapability = "";

                    if ( component.id != 'main' )
                    {
                        subCapability = "." + component.id;
                    }

                    // Find supported capabilities
                    var deviceCapabilities = component[ 'capabilities' ];
                    for ( const deviceCapability of deviceCapabilities )
                    {
                        const capabilityMapEntry = CapabilityMap2[ deviceCapability[ 'id' ] ];
                        if ( capabilityMapEntry != null )
                        {
                            // Make sure the entry has no exclusion condition or that the capabilities for the device does not have the excluded item
                            if ( ( capabilityMapEntry.exclude == "" ) || ( deviceCapabilities.findIndex( element => element.id == capabilityMapEntry.exclude ) == -1 ) )
                            {
                                if ( capabilityMapEntry.class != "" )
                                {
                                    className = capabilityMapEntry.class;
                                }

                                //Add to the table
                                if ( capabilityMapEntry.icon )
                                {
                                    iconName = capabilityMapEntry.icon;
                                }
                                capabilityMapEntry.capabilities.forEach( element =>
                                {
                                    capabilities.push( element + subCapability );
                                } );
                            }
                            else
                            {
                                Homey.app.updateLog( "Excluded Capability: " + deviceCapability[ 'id' ] );
                            }
                        }
                    }
                    if ( capabilities.length > 0 )
                    {
                        // Add this device to the table
                        devices.push(
                        {
                            "name": device[ 'label' ],
                            "icon": iconName, // relative to: /drivers/<driver_id>/assets/
                            "class": className,
                            "capabilities": capabilities,
                            data
                        } )
                    }
                }
            }
            return devices;
        }
        else
        {
            Homey.app.updateLog( "Getting API Key returned NULL" );
            reject(
            {
                statusCode: -3,
                statusMessage: "HTTPS Error: Nothing returned"
            } );
        }
    }

    async getAllDeviceCapabilitiesValues( DeviceID )
    {
        //https://api.smartthings.com/v1/devices/{deviceId}/status
        let url = "devices/" + DeviceID + "/status";
        let result = await this.GetURL( url );
        if ( result )
        {
            let searchData = JSON.parse( result.body );
            Homey.app.updateLog( JSON.stringify( searchData, null, 2 ) );
            return searchData;
        }

        return -1;
    }

    async getDeviceCapabilityValue( DeviceID, CapabilityID )
    {
        //https://api.smartthings.com/v1/devices/{deviceId}/components/{componentId}/capabilities/{capabilityId}/status
        let url = "devices/" + DeviceID + "/components/main/capabilities/" + CapabilityID + "/status";
        let result = await this.GetURL( url );
        if ( result )
        {
            let searchData = JSON.parse( result.body );
            Homey.app.updateLog( JSON.stringify( searchData, null, 2 ) );
            return searchData;
        }

        return -1;
    }

    async setDeviceCapabilityValue( DeviceID, Commands )
    {
        //https://api.smartthings.com/v1/devices/{deviceId}/commands
        let url = "devices/" + DeviceID + "/commands";
        let result = await this.PostURL( url, Commands );
        if ( result )
        {
            let searchData = JSON.parse( result.body );
            Homey.app.updateLog( JSON.stringify( searchData, null, 2 ) );
            return searchData;
        }

        return -1;
    }

    async GetURL( url )
    {
        Homey.app.updateLog( url );

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                if ( !Homey.app.BearerToken )
                {
                    reject(
                    {
                        statusCode: 401,
                        statusMessage: "HTTPS: No Token specified"
                    } );
                }

                let https_options = {
                    host: "api.smartthings.com",
                    path: "/v1/" + url,
                    headers:
                    {
                        "Authorization": "Bearer " + Homey.app.BearerToken,
                    },
                }

                https.get( https_options, ( res ) =>
                {
                    if ( res.statusCode === 200 )
                    {
                        let body = [];
                        res.on( 'data', ( chunk ) =>
                        {
                            body.push( chunk );
                        } );
                        res.on( 'end', () =>
                        {
                            resolve(
                            {
                                "body": Buffer.concat( body )
                            } );
                        } );
                    }
                    else
                    {
                        let message = "";
                        if ( res.statusCode === 204 )
                        {
                            message = "No Data Found";
                        }
                        else if ( res.statusCode === 400 )
                        {
                            message = "Bad request";
                        }
                        else if ( res.statusCode === 401 )
                        {
                            message = "Unauthorized";
                        }
                        else if ( res.statusCode === 403 )
                        {
                            message = "Forbidden";
                        }
                        else if ( res.statusCode === 404 )
                        {
                            message = "Not Found";
                        }
                        Homey.app.updateLog( "HTTPS Error: " + res.statusCode + ": " + message );
                        reject(
                        {
                            statusCode: res.statusCode,
                            statusMessage: "HTTPS Error: " + message
                        } );
                    }
                } ).on( 'error', ( err ) =>
                {
                    Homey.app.updateLog( err );
                    reject(
                    {
                        statusCode: -1,
                        statusMessage: "HTTPS Catch : " + err
                    } );
                } );
            }
            catch ( err )
            {
                Homey.app.updateLog( err );
                reject(
                {
                    statusCode: -2,
                    statusMessage: "HTTPS Catch: " + err
                } );
            }
        } );
    }

    async PostURL( url, body )
    {
        Homey.app.updateLog( url );
        let bodyText = JSON.stringify( body );
        Homey.app.updateLog( bodyText );

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                if ( !Homey.app.BearerToken )
                {
                    reject(
                    {
                        statusCode: 401,
                        statusMessage: "HTTPS: No Token specified"
                    } );
                }

                let https_options = {
                    host: "api.smartthings.com",
                    path: "/v1/" + url,
                    method: "POST",
                    headers:
                    {
                        "Authorization": "Bearer " + Homey.app.BearerToken,
                        "contentType": "application/json; charset=utf-8",
                        "Content-Length": bodyText.length
                    },
                }

                Homey.app.updateLog( https_options );

                let req = https.request( https_options, ( res ) =>
                {
                    if ( res.statusCode === 200 )
                    {
                        let body = [];
                        res.on( 'data', ( chunk ) =>
                        {
                            Homey.app.updateLog( "retrieve data" );
                            body.push( chunk );
                        } );
                        res.on( 'end', () =>
                        {
                            Homey.app.updateLog( "Done retrieval of data" );
                            resolve(
                            {
                                "body": Buffer.concat( body )
                            } );
                        } );
                    }
                    else
                    {
                        let message = "";
                        if ( res.statusCode === 204 )
                        {
                            message = "No Data Found";
                        }
                        else if ( res.statusCode === 400 )
                        {
                            message = "Bad request";
                        }
                        else if ( res.statusCode === 401 )
                        {
                            message = "Unauthorized";
                        }
                        else if ( res.statusCode === 403 )
                        {
                            message = "Forbidden";
                        }
                        else if ( res.statusCode === 404 )
                        {
                            message = "Not Found";
                        }
                        Homey.app.updateLog( "HTTPS Error: " + res.statusCode + ": " + message );
                        reject(
                        {
                            statusCode: res.statusCode,
                            statusMessage: "HTTPS Error: " + message
                        } );
                    }
                } ).on( 'error', ( err ) =>
                {
                    Homey.app.updateLog( err );
                    reject(
                    {
                        statusCode: -1,
                        statusMessage: "HTTPS Catch : " + err
                    } );
                } );
                req.write( bodyText );
                req.end();
            }
            catch ( err )
            {
                Homey.app.updateLog( this.varToString( err ) );
                reject(
                {
                    statusCode: -2,
                    statusMessage: "HTTPS Catch: " + err
                } );
            }
        } );
    }

    async onPoll()
    {
        Homey.app.timerProcessing = true;
        const promises = [];
        try
        {
            // Fetch the list of drivers for this app
            const drivers = Homey.ManagerDrivers.getDrivers();
            for ( const driver in drivers )
            {
                let devices = Homey.ManagerDrivers.getDriver( driver ).getDevices();
                for ( var i = 0; i < devices.length; i++ )
                {
                    let device = devices[ i ];
                    if ( device.getDeviceValues )
                    {
                        promises.push( device.getDeviceValues() );
                    }
                }
            }

            await Promise.all( promises );

        }
        catch ( err )
        {
            Homey.app.updateLog( "Polling Error: " + this.varToString( err ) );
        }

        var nextInterval = Number( Homey.ManagerSettings.get( 'pollInterval' ) ) * 1000;
        if ( nextInterval < 1000 )
        {
            nextInterval = 5000;
        }
        Homey.app.updateLog( "Next Interval = " + nextInterval, true );
        Homey.app.timerID = setTimeout( Homey.app.onPoll, nextInterval );
        Homey.app.timerProcessing = false;
    }

    varToString( source )
    {
        if ( source === null )
        {
            return "null";
        }
        if ( source === undefined )
        {
            return "undefined";
        }
        if ( typeof( source ) === "object" )
        {
            return JSON.stringify( source, null, 2 );
        }
        if ( typeof( source ) === "string" )
        {
            return source;
        }

        return source.toString();
    }

    updateLog( newMessage )
    {
        if ( Homey.ManagerSettings.get( 'logEnabled' ) )
        {
            console.log( newMessage );
            this.diagLog += "* ";
            this.diagLog += newMessage;
            this.diagLog += "\r\n";
            if ( this.diagLog.length > 60000 )
            {
                this.diagLog = this.diagLog.substr( -60000 );
            }
            Homey.ManagerApi.realtime( 'com.smartthings.logupdated', { 'log': this.diagLog } );
        }
    }

}

module.exports = MyApp;