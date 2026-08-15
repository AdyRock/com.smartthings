/* jslint node: true */
'use strict';

const SmartThingsDriver = require( '../../lib/SmartThingsDriver' );

class SamsungEhsDriver extends SmartThingsDriver
{
    async onOAuth2Init()
    {
        this.log( 'Samsung EHS driver is initialising' );

        this.flowTriggers = {
            ehs_dhw_mode_changed: this.homey.flow.getDeviceTriggerCard( 'ehs_dhw_mode_changed' ),
            ehs_space_mode_changed: this.homey.flow.getDeviceTriggerCard( 'ehs_space_mode_changed' ),
            ehs_reported_power_changed: this.homey.flow.getDeviceTriggerCard( 'ehs_reported_power_changed' ),
            ehs_booster_changed: this.homey.flow.getDeviceTriggerCard( 'ehs_booster_changed' ),
            ehs_defrost_changed: this.homey.flow.getDeviceTriggerCard( 'ehs_defrost_changed' ),
        };

        this.homey.flow.getActionCard( 'ehs_set_dhw_mode' )
            .registerRunListener( ( args ) => args.device.setDhwMode( args.mode ) );
        this.homey.flow.getActionCard( 'ehs_set_space_mode' )
            .registerRunListener( ( args ) => args.device.setSpaceMode( args.mode ) );
        this.homey.flow.getActionCard( 'ehs_set_dhw_temperature' )
            .registerRunListener( ( args ) => args.device.setDhwTemperature( args.temperature ) );
        this.homey.flow.getActionCard( 'ehs_set_space_temperature' )
            .registerRunListener( ( args ) => args.device.setSpaceTemperature( args.temperature ) );
        this.homey.flow.getActionCard( 'ehs_set_away_mode' )
            .registerRunListener( ( args ) => args.device.setAwayMode( args.enabled ) );

        this.homey.flow.getConditionCard( 'ehs_reported_power_above' )
            .registerRunListener( ( args ) => {
                const reportedPower = Number( args.device.getCapabilityValue( 'measure_power' ) );
                const threshold = Number( args.power );
                return Number.isFinite( reportedPower )
                    && Number.isFinite( threshold )
                    && reportedPower > threshold;
            } );
    }

    async onPairListDevices()
    {
        const response = await this.homey.app.GetURL( 'devices' );
        const data = JSON.parse( response.body );
        const devices = [];

        for ( const device of data.items || [] )
        {
            const main = ( device.components || [] ).find( ( component ) => component.id === 'main' );
            const indoor = ( device.components || [] ).find( ( component ) => component.id === 'INDOOR' );
            const mainCapabilities = new Set( ( main?.capabilities || [] ).map( ( capability ) => capability.id ) );
            const indoorCapabilities = new Set( ( indoor?.capabilities || [] ).map( ( capability ) => capability.id ) );

            const isEhs = mainCapabilities.has( 'samsungce.ehsDiverterValve' )
                && mainCapabilities.has( 'samsungce.ehsTemperatureReference' )
                && indoorCapabilities.has( 'samsungce.ehsDefrostMode' );

            if ( !isEhs )
            {
                continue;
            }

            devices.push( {
                name: device.label || 'Samsung EHS Heat Pump',
                data: {
                    id: device.deviceId,
                    product: 'samsung-ehs-combined',
                },
                store: {
                    smartThingsLabel: device.label || 'Eco Heating System',
                },
            } );
        }

        return devices;
    }
}

module.exports = SamsungEhsDriver;
