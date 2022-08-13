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
            else if (components[0] === 'fridge_mode')
            {
                this.registerCapabilityListener( dotCapability, this.onCapabilityFridgeMode.bind( this,  components[1]) );
            }
        }

        this.getDeviceValues().catch(this.error);

        this.log( 'FridgeDevice has been initialized' );
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        const devData = this.getData();

        if ( this.hasCapability( 'target_temperature.onedoor' ) )
        {
            this.removeCapability('target_temperature.onedoor');
        }

        if ( this.hasCapability( 'target_temperature.main' ) )
        {
            this.removeCapability('target_temperature.main');
        }

        if ( this.hasCapability( 'measure_temperature.main' ) )
        {
            this.removeCapability('measure_temperature.main');
        }

        if ( this.hasCapability( 'measure_temperature.onedoor' ) )
        {
            this.removeCapability('measure_temperature.onedoor');
        }

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

    // this method is called when the Homey device has requested a temperature set point change
    async onCapabilityFridgeMode( component, value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": component,
                    "capability": "custom.fridgeMode",
                    "command": "setFridgeMode",
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

    async getDeviceValues()
    {
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

                        if ( mapEntry.boolCompare )
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
                }
            }
            catch ( err )
            {
                this.homey.app.updateLog( "getDeviceValues error: " + this.homey.app.varToString( err.message ) + " for capability: " + this.homey.app.varToString( combinedCapability ) );
            }
        }



        // try
        // {
        //     let value = 0;
            
        //     if ( this.hasCapability( 'alarm_contact' ) )
        //     {
        //         // Get the door open state
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'onedoor', 'contactSensor' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'alarm_contact', value.contact.value === 'open' ).catch(this.error);
        //         }
        //     }

        //     if ( this.hasCapability( 'target_temperature' ) )
        //     {
        //         // Get the Target temperature
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'freezer', 'thermostatCoolingSetpoint' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'target_temperature', value.coolingSetpoint.value ).catch(this.error);
        //         }
        //     }

        //     if ( this.hasCapability( 'onoff' ) )
        //     {
        //         // Get the rapid freeze state
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'refrigeration' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'onoff', value.rapidFreezing.value === 'on' ).catch(this.error);
        //         }
        //     }

        //     if ( this.hasCapability( 'fridge_deodor_filter' ) )
        //     {
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'custom.deodorFilter' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'fridge_deodor_filter', value ).catch(this.error);
        //         }
        //     }

        //     if ( this.hasCapability( 'fridge_device_report_state_configuration' ) )
        //     {
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'custom.deviceReportStateConfiguration' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'fridge_device_report_state_configuration', value ).catch(this.error);
        //         }
        //     }

        //     if ( this.hasCapability( 'fidge_mode' ) )
        //     {
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'custom.fridgeMode' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'fidge_mode', value ).catch(this.error);
        //         }
        //     }

        //     if ( this.hasCapability( 'fridge_water_filter' ) )
        //     {
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'custom.waterFilter' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'fridge_water_filter', value ).catch(this.error);
        //         }
        //     }

        //     if ( this.hasCapability( 'fridge_power_cool' ) )
        //     {
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'samsungce.powerCool' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'fridge_power_cool', value ).catch(this.error);
        //         }
        //     }

        //     if ( this.hasCapability( 'fridge_power_freeze' ) )
        //     {
        //         value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'samsungce.powerFreeze' );
        //         if ( value )
        //         {
        //             this.setCapabilityValue( 'fridge_power_freeze', value ).catch(this.error);
        //         }
        //     }
        // }
        // catch ( err )
        // {
        //     this.log( "Get Device values Error ", err.message );
        // }
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