/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class FridgeDevice extends Homey.Device
{
    /**
     * onInit is called when the device is initialized.
     */
    async onInit()
    {
        this.log( 'FridgeDevice has been initializing' );
        const devData = this.getData();

        if ( this.hasCapability( 'target_temperature.onedoor' ) )
        {
            await this.removeCapability('target_temperature.onedoor');
        }

        if ( this.hasCapability( 'target_temperature.main' ) )
        {
            await this.removeCapability('target_temperature.main');
        }

        if ( this.hasCapability( 'measure_temperature.main' ) )
        {
            await this.removeCapability('measure_temperature.main');
        }

        if ( this.hasCapability( 'measure_temperature.onedoor' ) )
        {
            await this.removeCapability('measure_temperature.onedoor');
        }

        if ( this.hasCapability( 'alarm_contact.cvroom' ) )
        {
            await this.removeCapability('alarm_contact.cvroom');
        }

        if ( this.hasCapability( 'alarm_contact.freezer' ) )
        {
            await this.removeCapability('alarm_contact.freezer');
        }

        if ( this.hasCapability( 'alarm_contact.cooler' ) )
        {
            await this.removeCapability('alarm_contact.cooler');
        }

        if ( this.hasCapability( 'alarm_contact.onedoor' ) )
        {
            await this.removeCapability('alarm_contact.onedoor');
        }

        if ( this.hasCapability( 'rapid_freezing.main' ) && this.hasCapability( 'rapid_cooling.main' ) )
        {
            await this.removeCapability('rapid_freezing.main');
        }

        const capabilities = this.getCapabilities();
        for ( let c = 0; c < capabilities.length; c++ )
        {
            const dotCapability = capabilities[ c ];
            let components = dotCapability.split( "." );

            if (components[0] === 'onoff')
            {
                this.registerCapabilityListener( dotCapability, this.onCapabilityOnoff.bind( this,  components[1]) );
            }
            else if (components[0] === 'target_temperature')
            {
                this.registerCapabilityListener( dotCapability, this.onCapabilityTargetTemperature.bind( this,  components[1]) );
            }
            else if (components[0] === 'rapid_freezing')
            {
                this.registerCapabilityListener( dotCapability, this.onCapabilityRapidFreezing_set.bind( this,  components[1]) );
            }
            else if (components[0] === 'rapid_cooling')
            {
                this.registerCapabilityListener( dotCapability, this.onCapabilityRapidCooling_set.bind( this,  components[1]) );
            }
        }

        //await this.getDeviceValues().catch(this.error);

        this.log( 'FridgeDevice has been initialized' );
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log( 'FridgeDevice has been added' );
    }

    // this method is called when the Homey device has requested a state change (turned on or off)
    async onCapabilityOnoff( component, value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            // The device requires 'off' and 'on'
            var data = 'off';
            if ( value )
            {
                data = 'on';
            }

            let body = {
                "commands": [
                {
                    "component": component,
                    "capability": "switch",
                    "command": data,
                    "arguments": []
                } ]
            };

            // Set the switch Value on the device using the unique feature ID stored during pairing
            await this.homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityOnoff Error " + this.homey.app.varToString( err.message ) );
        }
    }

    // this method is called when the Homey device has requested a temperature set point change
    async onCapabilityTargetTemperature( component, value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": component,
                    "capability": "thermostatCoolingSetpoint",
                    "command": "setCoolingSetpoint",
                    "arguments": [ value ]
                } ]
            };

            // Get the device information stored during pairing
            const devData = this.getData();

            // Set the dim Value on the device using the unique feature ID stored during pairing
            await this.homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityTargetTemperature " + this.homey.app.varToString( err.message ) );
        }
    }

    // this method is called when the Homey device has requested a state change (turned on or off)
    async onCapabilityRapidFreezing_set( component, value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            // The device requires 'off' and 'on'
            var data = 'off';
            if ( value )
            {
                data = 'on';
            }

            let body = {
                "commands": [
                {
                    "component": component,
                    "capability": "refrigeration",
                    "command": "setRapidFreezing",
                    "arguments": [ data ]
                } ]
            };

            // Set the switch Value on the device using the unique feature ID stored during pairing
            await this.homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityOnoff Error " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a state change (turned on or off)
    async onCapabilityRapidCooling_set( component, value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            // The device requires 'off' and 'on'
            var data = 'off';
            if ( value )
            {
                data = 'on';
            }

            let body = {
                "commands": [
                {
                    "component": component,
                    "capability": "refrigeration",
                    "command": "setRapidCooling",
                    "arguments": [ data ]
                } ]
            };

            // Set the switch Value on the device using the unique feature ID stored during pairing
            await this.homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityOnoff Error " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async getDeviceValues()
    {
        if (this.getingDeviceValues)
        {
            return;
        }

        this.getingDeviceValues = true;
        const devData = this.getData();

        var capabilityCache = {};
        const capabilities = this.getCapabilities();
        for ( var c = 0; c < capabilities.length; c++ )
        {
            const dotCapability = capabilities[ c ];
            const combinedCapability = dotCapability.split(".");
            try
            {
                var mapEntry = this.homey.app.getStCapabilitiesForCapability(combinedCapability[0]);

                // get the entry from the table for this capability
                if ( mapEntry )
                {
                    if ( mapEntry.dataEntry.length === 0 )
                    {
                        // Write only entry
                        continue;
                    }

                    var value = null;
                    const cacheName = `${mapEntry.capabilityID}.${combinedCapability[1]}`;
                    if ( mapEntry.keep )
                    {
                        // Check the cache first
                        if ( capabilityCache[ cacheName ] )
                        {
                            value = capabilityCache[ cacheName ];
                        }
                    }

                    if ( !value )
                    {
                        value = await this.homey.app.getDeviceCapabilityValue( devData.id, combinedCapability[1], mapEntry.capabilityID );
                    }

                    if (value)
                    {
                        if ( mapEntry.keep )
                        {
                            // cache the data
                            capabilityCache = Object.assign( capabilityCache,
                            {
                                [ cacheName ]: value
                            } );
                        }

                        for ( var i = 1; i < mapEntry.dataEntry.length; i++ )
                        {
                            value = value[ mapEntry.dataEntry[ i ] ];

                        }

                        if ((value === null) && (this.getCapabilityValue( dotCapability ) === null))
                        {
                            await this.removeCapability( dotCapability );
                            if (dotCapability === "measure_temperature.freezer")
                            {
                                await this.removeCapability( "target_temperature.freezer" );
                            }
                        }
                        else if ( mapEntry.boolCompare )
                        {
                            value = ( value === mapEntry.boolCompare );
                            this.homey.app.updateLog( "Set Capability: " + dotCapability + " - Value: " + value );
                            let lastValue = this.getCapabilityValue( dotCapability );
                            this.setCapabilityValue( dotCapability, value ).catch(this.error);
                            if ( combinedCapability[0] === 'remote_status' )
                            {
                                this.remoteControlEnabled = value;
                            }

                            if ( mapEntry.flowTrigger )
                            {
                                this.homey.app.updateLog( "Trigger Check: " + dotCapability + " = " + value + " was " + lastValue );
                                if ( lastValue != value )
                                {
                                    this.homey.app.updateLog( "Trigger change: " + dotCapability, " = " + value );

                                    let tokens = {
                                        'value': value
                                    };

                                    this.driver.flowTriggers[ mapEntry.flowTrigger ]
                                        .trigger( this, tokens )
                                        .catch( this.error );
                                }

                            }
                        }
                        else
                        {
                            if ( mapEntry.arrayIdx )
                            {
                                // Value contains an array of values so extract the required one 
                                value = value[ mapEntry.arrayIdx ];
                            }

                            if ( mapEntry.lowValue )
                            {
                                let lowValue;
                                if (typeof mapEntry.lowValue === 'string')
                                {
                                    // Fetch the setting
                                    lowValue = this.getSetting(mapEntry.lowValue);
                                }
                                else
                                {
                                    lowValue = mapEntry.lowValue;
                                }

                                if (value < lowValue)
                                {
                                    continue;
                                }
                                
                                value -= lowValue;

                                if ( mapEntry.hiValue )
                                {
                                    let hiValue;
                                    if (typeof mapEntry.hiValue === 'string')
                                    {
                                        // Fetch the setting
                                        hiValue = this.getSetting(mapEntry.hiValue);
                                    }
                                    else
                                    {
                                        hiValue = mapEntry.hiValue;
                                    }

                                    const divider = hiValue - lowValue;
                                    value /= divider;
                                }
                            }

                            if ( mapEntry.divider > 0 )
                            {
                                value /= mapEntry.divider;
                            }
                            else if ( mapEntry.dateTime )
                            {
                                // Format date and time to fit
                                if ( value.length > 5 )
                                {
                                    var d = new Date( value );
                                    value = d.getHours() + ":" + ( d.getMinutes() < 10 ? "0" : "" ) + d.getMinutes() + " " + ( d.getDate() < 10 ? "0" : "" ) + d.getDate() + "-" + ( d.getMonth() < 10 ? "0" : "" ) + d.getMonth();
                                }
                            }

                            if ( mapEntry.invert )
                            {
                                value = 1 - value;
                            }

                            this.homey.app.updateLog( "Set Capability: " + combinedCapability + " - Value: " + value );
                            let lastValue = this.getCapabilityValue( dotCapability );
                            try
                            {
                                if (Array.isArray(value))
                                {
                                    value = value.toString();
                                }
                                await this.setCapabilityValue( dotCapability, value );
                            }
                            catch( err )
                            {
                                this.log( err);
                            }

                            if ( mapEntry.flowTrigger )
                            {
                                this.homey.app.updateLog( "Trigger Check: " + combinedCapability + " = ", value + " was " + lastValue );
                                if ( lastValue != value )
                                {
                                    this.homey.app.updateLog( "Trigger change: " + combinedCapability + " = " + value );

                                    let state = {
                                        'value': value
                                    };

                                    let tokens;
                                    if (mapEntry.flowTag)
                                    {
                                        tokens = {
                                            'value': this.getCapabilityValue(mapEntry.flowTag)
                                        };
                                    }
                                    else
                                    {
                                        tokens = {
                                            'value': value
                                        };
                                    }

                                    this.driver.flowTriggers[ mapEntry.flowTrigger ]
                                        .trigger( this, tokens, state )
                                        .catch( this.error );
                                }

                            }
                        }
                    }
                    else
                    {
                        this.removeCapability( dotCapability );
                    }
                }
            }
            catch ( err )
            {
                this.homey.app.updateLog( "getDeviceValues error: " + this.homey.app.varToString( err.message ) + " for capability: " + this.homey.app.varToString( combinedCapability ) );
            }
        }

        this.getingDeviceValues = false;
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings( { oldSettings, newSettings, changedKeys } )
    {
        this.log( 'MyDevice settings where changed' );
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed( name )
    {
        this.log( 'MyDevice was renamed' );
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log( 'MyDevice has been deleted' );
    }
}

module.exports = FridgeDevice;