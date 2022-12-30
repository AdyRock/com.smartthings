/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class FridgeDriver extends Homey.Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.flowTriggers = {
            'alarm_contact_main_changed_true': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_main_true' ),
            'alarm_contact_main_changed_false': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_main_false' ),
            'alarm_contact_main_changed': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_main_changed' ),

            'alarm_contact_freezer_changed_true': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_freezer_true' ),
            'alarm_contact_freezer_changed_false': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_freezer_false' ),
            'alarm_contact_freezer_changed': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_freezer_changed' ),

            'alarm_contact_cooler_changed_true': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_cooler_true' ),
            'alarm_contact_cooler_changed_false': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_cooler_false' ),
            'alarm_contact_cooler_changed': this.homey.flow.getDeviceTriggerCard( 'alarm_contact_cooler_changed' ),

            'fridge_water_filter_main_changed': this.homey.flow.getDeviceTriggerCard( 'fridge_water_filter_main_changed' ),

            'measure_temperature_freezer_changed': this.homey.flow.getDeviceTriggerCard( 'measure_temperature_freezer_changed' ),
            'measure_temperature_cooler_changed': this.homey.flow.getDeviceTriggerCard( 'measure_temperature_cooler_changed' ),
        };
        this.log( 'FridgeDriver has been initialized' );
    }

    async onPairListDevices()
    {
        return this.homey.app.getDevicesByCategory( 'Refrigerator' );
    }
}

module.exports = FridgeDriver;