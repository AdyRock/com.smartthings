/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class STDriver extends Homey.Driver
{

    onInit()
    {
        this.log( 'STDriver is initialising' );

        this.flowTriggers = {
            'washer_status_changed': this.homey.flow.getDeviceTriggerCard( 'washer_status_changed' ),
            'dryer_status_changed': this.homey.flow.getDeviceTriggerCard( 'dryer_status_changed' ),
            'presenceStatus_changed': this.homey.flow.getDeviceTriggerCard( 'presenceStatus_changed' ),
            'dustStatus_changed': this.homey.flow.getDeviceTriggerCard( 'dustStatus_changed' ),
            'doorStatus_changed': this.homey.flow.getDeviceTriggerCard( 'doorStatus_changed' ),
            'alarm_water_changed': this.homey.flow.getDeviceTriggerCard( 'alarm_water_changed' ),
            'alarm_acceleration_changed': this.homey.flow.getDeviceTriggerCard( 'alarm_acceleration_changed' ),
            'acceleration_x_changed': this.homey.flow.getDeviceTriggerCard( 'acceleration_x_changed' ),
            'acceleration_y_changed': this.homey.flow.getDeviceTriggerCard( 'acceleration_y_changed' ),
            'acceleration_z_changed': this.homey.flow.getDeviceTriggerCard( 'acceleration_z_changed' ),
            'tag_button_status_changed': this.homey.flow.getDeviceTriggerCard( 'tag_button_status_changed' ),
            'button_status_changed': this.homey.flow.getDeviceTriggerCard( 'button_status_changed' ),
            'measure_pm10_changed': this.homey.flow.getDeviceTriggerCard( 'measure_pm10_changed' ),
			'job_status_changed': this.homey.flow.getDeviceTriggerCard( 'job_status_changed' ),
        };

        this.flowTriggers.washer_status_changed
            .registerRunListener( ( args, state ) =>
            {
                // If true, this flow should run
                return Promise.resolve( args.value === state.value );
            } );

        this.flowTriggers.dryer_status_changed
            .registerRunListener( ( args, state ) =>
            {
                // If true, this flow should run
                return Promise.resolve( args.value === state.value );
            } );
    }

    // this is the easiest method to overwrite, when only the template 'Drivers-Pairing-System-Views' is being used.
    async onPairListDevices()
    {
        return this.homey.app.getDevices();
    }
}

module.exports = STDriver;