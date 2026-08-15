/* jslint node: true */
'use strict';

const Homey = require( 'homey' );

class SamsungEhsDevice extends Homey.Device
{
    async onInit()
    {
        this.log( 'Samsung EHS device is initialising' );
        this.fetchingValues = false;
        this.lastRanges = {};

        this.registerCapabilityListener( 'ehs_dhw_onoff', ( value ) => this.setComponentPower( 'main', value ) );
        this.registerCapabilityListener( 'ehs_space_onoff', ( value ) => this.setComponentPower( 'INDOOR', value ) );
        this.registerCapabilityListener( 'target_temperature.dhw', ( value ) => this.setDhwTemperature( value ) );
        this.registerCapabilityListener( 'target_temperature.space', ( value ) => this.setSpaceTemperature( value ) );
        this.registerCapabilityListener( 'ehs_dhw_mode', ( value ) => this.setDhwMode( value ) );
        this.registerCapabilityListener( 'ehs_space_mode', ( value ) => this.setSpaceMode( value ) );
        this.registerCapabilityListener( 'ehs_away_mode', ( value ) => this.setAwayMode( value ) );

        if ( !this.homey.app.hasApiAccess() )
        {
            const reason = this.homey.app.getLocalizedText(
                'oauth.unavailableReason',
                'SmartThings authentication failed. Repair or re-pair the device.'
            );
            await this.setUnavailable( reason );
            await this.setWarning( reason, null );
            return;
        }

        this.homey.setTimeout( () => this.getDeviceValues().catch( this.error ), 1500 );
    }

    async sendCommand( component, capability, command, argumentsList = [] )
    {
        const deviceId = this.getData().id;
        const body = {
            commands: [ {
                component,
                capability,
                command,
                arguments: argumentsList,
            } ],
        };

        await this.homey.app.setDeviceCapabilityValue( deviceId, body );
        return true;
    }

    setComponentPower( component, enabled )
    {
        return this.sendCommand( component, 'switch', enabled ? 'on' : 'off' );
    }

    setDhwTemperature( temperature )
    {
        return this.sendCommand( 'main', 'thermostatCoolingSetpoint', 'setCoolingSetpoint', [ Number( temperature ) ] );
    }

    setSpaceTemperature( temperature )
    {
        return this.sendCommand( 'INDOOR', 'thermostatCoolingSetpoint', 'setCoolingSetpoint', [ Number( temperature ) ] );
    }

    setDhwMode( mode )
    {
        return this.sendCommand( 'main', 'airConditionerMode', 'setAirConditionerMode', [ mode ] );
    }

    setSpaceMode( mode )
    {
        return this.sendCommand( 'INDOOR', 'airConditionerMode', 'setAirConditionerMode', [ mode ] );
    }

    setAwayMode( enabled )
    {
        const isEnabled = enabled === true || enabled === 'on';
        return this.sendCommand( 'main', 'custom.outingMode', 'setOutingMode', [ isEnabled ? 'on' : 'off' ] );
    }

    getState( component, capability, attribute )
    {
        return component?.[ capability ]?.[ attribute ];
    }

    async updateValue( capability, value, triggerId = null )
    {
        if ( value === undefined || value === null || !this.hasCapability( capability ) )
        {
            return;
        }

        if ( typeof value === 'number' && !Number.isFinite( value ) )
        {
            return;
        }

        const previous = this.getCapabilityValue( capability );
        await this.setCapabilityValue( capability, value );

        if ( triggerId && previous !== null && previous !== value && this.driver.flowTriggers?.[ triggerId ] )
        {
            await this.driver.flowTriggers[ triggerId ].trigger( this, { value }, { value } );
        }
    }

    async updateTargetRange( capability, minimum, maximum )
    {
        if ( !Number.isFinite( minimum ) || !Number.isFinite( maximum ) || minimum >= maximum )
        {
            return;
        }

        const key = `${minimum}:${maximum}`;
        if ( this.lastRanges[ capability ] === key )
        {
            return;
        }

        const existing = this.getCapabilityOptions( capability ) || {};
        await this.setCapabilityOptions( capability, {
            ...existing,
            min: minimum,
            max: maximum,
            step: 0.5,
            decimals: 1,
        } );
        this.lastRanges[ capability ] = key;
    }

    normalisePowerWatts( power )
    {
        if ( power === undefined || power === null || ( typeof power === 'string' && !power.trim() ) )
        {
            return null;
        }

        const numeric = Number( power );
        if ( !Number.isFinite( numeric ) )
        {
            return null;
        }

        // Samsung EHS reports this field in kW (for example 0.498 = 498 W).
        return numeric < 100 ? numeric * 1000 : numeric;
    }

    normaliseOnOffState( state )
    {
        const value = state?.value;
        if ( value === 'on' )
        {
            return true;
        }

        if ( value === 'off' )
        {
            return false;
        }

        return null;
    }

    async getDeviceValues()
    {
        if ( this.fetchingValues )
        {
            return;
        }

        this.fetchingValues = true;
        try
        {
            const deviceId = this.getData().id;
            const response = await this.homey.app.GetURL( `devices/${deviceId}/status` );
            const status = JSON.parse( response.body );
            const main = status.components?.main || {};
            const indoor = status.components?.INDOOR || {};

            const mainTemperature = this.getState( main, 'temperatureMeasurement', 'temperature' );
            const mainTarget = this.getState( main, 'thermostatCoolingSetpoint', 'coolingSetpoint' );
            const indoorTemperature = this.getState( indoor, 'temperatureMeasurement', 'temperature' );
            const indoorTarget = this.getState( indoor, 'thermostatCoolingSetpoint', 'coolingSetpoint' );
            const mainMinimum = this.getState( main, 'custom.thermostatSetpointControl', 'minimumSetpoint' );
            const mainMaximum = this.getState( main, 'custom.thermostatSetpointControl', 'maximumSetpoint' );
            const indoorMinimum = this.getState( indoor, 'custom.thermostatSetpointControl', 'minimumSetpoint' );
            const indoorMaximum = this.getState( indoor, 'custom.thermostatSetpointControl', 'maximumSetpoint' );
            const consumption = this.getState( main, 'powerConsumptionReport', 'powerConsumption' )?.value || {};

            await this.updateTargetRange( 'target_temperature.dhw', Number( mainMinimum?.value ), Number( mainMaximum?.value ) );
            await this.updateTargetRange( 'target_temperature.space', Number( indoorMinimum?.value ), Number( indoorMaximum?.value ) );

            await Promise.all( [
                this.updateValue( 'ehs_dhw_onoff', this.normaliseOnOffState( this.getState( main, 'switch', 'switch' ) ) ),
                this.updateValue( 'measure_temperature.dhw', Number( mainTemperature?.value ) ),
                this.updateValue( 'target_temperature.dhw', Number( mainTarget?.value ) ),
                this.updateValue( 'ehs_dhw_mode', this.getState( main, 'airConditionerMode', 'airConditionerMode' )?.value, 'ehs_dhw_mode_changed' ),
                this.updateValue( 'ehs_space_onoff', this.normaliseOnOffState( this.getState( indoor, 'switch', 'switch' ) ) ),
                this.updateValue( 'measure_temperature.space', Number( indoorTemperature?.value ) ),
                this.updateValue( 'target_temperature.space', Number( indoorTarget?.value ) ),
                this.updateValue( 'ehs_space_mode', this.getState( indoor, 'airConditionerMode', 'airConditionerMode' )?.value, 'ehs_space_mode_changed' ),
                this.updateValue( 'measure_power', this.normalisePowerWatts( consumption.power ), 'ehs_reported_power_changed' ),
                this.updateValue( 'meter_power', Number.isFinite( Number( consumption.persistedEnergy ) ) ? Number( consumption.persistedEnergy ) / 1000 : null ),
                this.updateValue( 'ehs_interval_energy', Number( consumption.deltaEnergy ) ),
                this.updateValue( 'ehs_away_mode', this.normaliseOnOffState( this.getState( main, 'custom.outingMode', 'outingMode' ) ) ),
                this.updateValue( 'ehs_valve_position', this.getState( main, 'samsungce.ehsDiverterValve', 'position' )?.value ),
                this.updateValue( 'ehs_booster_active', this.normaliseOnOffState( this.getState( main, 'samsungce.ehsBoosterHeater', 'status' ) ), 'ehs_booster_changed' ),
                this.updateValue( 'ehs_defrost_active', this.normaliseOnOffState( this.getState( indoor, 'samsungce.ehsDefrostMode', 'status' ) ), 'ehs_defrost_changed' ),
            ] );

            if ( !this.getAvailable() )
            {
                await this.setAvailable();
                await this.unsetWarning();
            }
        }
        catch ( err )
        {
            this.homey.app.updateLog( `${this.getName()} EHS polling error: ${this.homey.app.varToString( err.message || err )}` );
            throw err;
        }
        finally
        {
            this.fetchingValues = false;
        }
    }
}

module.exports = SamsungEhsDevice;
