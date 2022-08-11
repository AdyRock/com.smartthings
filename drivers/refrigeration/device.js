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
        this.log( 'FridgeDevice has been initialized' );
        const devData = this.getData();
        var component = 'main';
        if ( devData.component )
        {
            component = devData.component;
        }

        const value = await this.homey.app.getDeviceCapabilityValue( devData.id, component, 'custom.disabledCapabilities' );
        if ( value && value.disabledCapabilities && value.disabledCapabilities.value )
        {
            value.disabledCapabilities.value.forEach(element => {
                const capabilities = this.homey.app.getCapabilitiesForSTCapability(element);
                if (capabilities)
                {
                    capabilities.forEach(capability => {
                        if ( this.hasCapability( capability ) )
                        {
                            this.removeCapability(capability);
                        }
                    });
                }
            });
        }

        this.registerCapabilityListener( 'onoff', this.onCapabilityOnoff.bind( this ) );
        this.registerCapabilityListener( 'target_temperature', this.onCapabilityTargetTemperature.bind( this ) );

        try
        {
            this.getDeviceValues();
        }
        catch ( err )
        {
            this.log( 'FridgeDevice initialized ', err.message );
        }
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log( 'FridgeDevice has been added' );
    }

    // this method is called when the Homey device has requested a state change (turned on or off)
    async onCapabilityOnoff( value, opts )
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
                    "component": "main",
                    "capability": "refrigeration",
                    "command": 'setRapidFreezing',
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
        }
    }

    // this method is called when the Homey device has requested a temperature set point change
    async onCapabilityTargetTemperature( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "freezer",
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

    async getDeviceValues()
    {
        const devData = this.getData();

        try
        {
            let value = 0;
            
            if ( this.hasCapability( 'alarm_contact' ) )
            {
                // Get the door open state
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'onedoor', 'contactSensor' );
                if ( value )
                {
                    this.setCapabilityValue( 'alarm_contact', value.contact.value === 'open' ).catch(this.error);
                }
            }

            if ( this.hasCapability( 'target_temperature' ) )
            {
                // Get the Target temperature
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'freezer', 'thermostatCoolingSetpoint' );
                if ( value )
                {
                    this.setCapabilityValue( 'target_temperature', value.coolingSetpoint.value ).catch(this.error);
                }
            }

            if ( this.hasCapability( 'onoff' ) )
            {
                // Get the rapid freeze state
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'refrigeration' );
                if ( value )
                {
                    this.setCapabilityValue( 'onoff', value.rapidFreezing.value === 'on' ).catch(this.error);
                }
            }

            if ( this.hasCapability( 'fridge_deodor_filter' ) )
            {
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'custom.deodorFilter' );
                if ( value )
                {
                    this.setCapabilityValue( 'fridge_deodor_filter', value ).catch(this.error);
                }
            }

            if ( this.hasCapability( 'fridge_device_report_state_configuration' ) )
            {
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'custom.deviceReportStateConfiguration' );
                if ( value )
                {
                    this.setCapabilityValue( 'fridge_device_report_state_configuration', value ).catch(this.error);
                }
            }

            if ( this.hasCapability( 'fidge_mode' ) )
            {
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'custom.fridgeMode' );
                if ( value )
                {
                    this.setCapabilityValue( 'fidge_mode', value ).catch(this.error);
                }
            }

            if ( this.hasCapability( 'fridge_water_filter' ) )
            {
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'custom.waterFilter' );
                if ( value )
                {
                    this.setCapabilityValue( 'fridge_water_filter', value ).catch(this.error);
                }
            }

            if ( this.hasCapability( 'fridge_power_cool' ) )
            {
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'samsungce.powerCool' );
                if ( value )
                {
                    this.setCapabilityValue( 'fridge_power_cool', value ).catch(this.error);
                }
            }

            if ( this.hasCapability( 'fridge_power_freeze' ) )
            {
                value = await this.homey.app.getDeviceCapabilityValue( devData.id, 'main', 'samsungce.powerFreeze' );
                if ( value )
                {
                    this.setCapabilityValue( 'fridge_power_freeze', value ).catch(this.error);
                }
            }
        }
        catch ( err )
        {
            this.log( "Get Device values Error ", err.message );
        }
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