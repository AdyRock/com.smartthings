/*jslint node: true */
'use strict';

if ( process.env.DEBUG === '1' )
{
    require( 'inspector' ).open( 9227, '0.0.0.0', true );
}

const Homey = require( 'homey' );
const https = require( "https" );
const nodemailer = require('nodemailer');

const CapabilityMap2 = {
    "switch":
    {
        class: "",
        exclude: "", // Ignore if the device has this ST capability
        capabilities: [ "onoff" ], // The list of Homey capabilities to add
        icon: "socket.svg", // Icon to apply to the device
        iconPriority: 1 // Priority to be used for the device icon. Higher numbers have a higher priority
    },
    "switchLevel":
    {
        class: "light",
        exclude: [ "windowShade" ],
        capabilities: [ "dim" ],
        icon: "light.svg",
        iconPriority: 2
    },
    "colorTemperature":
    {
        class: "light",
        exclude: "",
        capabilities: [ "light_temperature" ],
        icon: "light.svg",
        iconPriority: 2
    },
    "colorControl":
    {
        class: "light",
        exclude: "",
        capabilities: [ "light_hue", "light_saturation" ],
        icon: "light.svg",
        iconPriority: 2
    },
    "contactSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ "alarm_contact" ],
        icon: "door.svg",
        iconPriority: 3
    },
    "battery":
    {
        class: "",
        exclude: "",
        capabilities: [ "measure_battery" ],
        icon: "",
        iconPriority: 0
    },
    "tag.tagButton":
    {
        class: "",
        exclude: "",
        capabilities: [ "tag_button_status", "button_timestamp" ],
        icon: "tag.svg",
        iconPriority: 5
    },
    "button":
    {
        class: "",
        exclude: "",
        capabilities: [ "button_status", "button_timestamp" ],
        icon: "button.svg",
        iconPriority: 5
    },
    "presenceSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ "alarm_presence" ],
        icon: "presence.svg",
        iconPriority: 3
    },
    "motionSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ "alarm_motion" ],
        icon: "presence.svg",
        iconPriority: 3
    },
    "powerConsumptionReport":
    {
        class: "",
        exclude: "",
        capabilities: [ "measure_power", "meter_power", "meter_power.delta" ],
        icon: "",
        iconPriority: 0
    },
    "remoteControlStatus":
    {
        class: "",
        exclude: "",
        capabilities: [ "remote_status" ],
        icon: "",
        iconPriority: 0
    },
    "washerOperatingState":
    {
        class: "other",
        exclude: "",
        capabilities: [ "washer_job_status", "completion_time", "washer_status" ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "custom.washerWaterTemperature":
    {
        class: "",
        exclude: "",
        capabilities: [ "water_temperature" ],
        icon: "",
        iconPriority: 0
    },
    "custom.washerSpinLevel":
    {
        class: "",
        exclude: "",
        capabilities: [ "spin_level" ],
        icon: "",
        iconPriority: 0
    },
    "custom.washerRinseCycles":
    {
        class: "",
        exclude: "",
        capabilities: [ "rinse_cycles" ],
        icon: "",
        iconPriority: 0
    },
    "washerMode":
    {
        class: "other",
        exclude: "",
        capabilities: [ "washer_status" ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "audioVolume":
    {
        class: "tv",
        exclude: [ 'airConditionerMode', 'tag.tagButton' ],
        capabilities: [ 'volume_set', 'volume_down', 'volume_up' ],
        icon: "",
        iconPriority: 0
    },
    "tvChannel":
    {
        class: "",
        exclude: "",
        capabilities: [ 'channel_down', 'channel_up' ],
        icon: "television.svg",
        iconPriority: 5
    },
    "audioMute":
    {
        class: "",
        exclude: ['samsungce.dishwasherJobState'],
        capabilities: [ 'volume_mute' ],
        icon: "",
        iconPriority: 0
    },
    "airConditionerMode":
    {
        class: "fan",
        exclude: "",
        capabilities: [ 'aircon_mode', 'ac_lights_on', 'ac_lights_off', 'silent_mode' ],
        icon: "aircon.svg",
        iconPriority: 5
    },
    "airConditionerFanMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'aircon_fan_mode' ],
        icon: "",
        iconPriority: 0
    },
    "fanOscillationMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'aircon_fan_oscillation_mode' ],
        icon: "",
        iconPriority: 0
    },
    "temperatureMeasurement":
    {
        class: "",
        exclude: "",
        capabilities: [ 'measure_temperature' ],
        icon: "thermometer.svg",
        iconPriority: 1
    },
    "thermostatCoolingSetpoint":
    {
        class: "",
        exclude: "",
        capabilities: [ 'target_temperature' ],
        icon: "",
        iconPriority: 0
    },
    "relativeHumidityMeasurement":
    {
        class: "",
        exclude: "",
        capabilities: [ 'measure_humidity' ],
        icon: "",
        iconPriority: 0
    },
    "custom.dustFilter":
    {
        class: "",
        exclude: "",
        capabilities: [ 'dust_filter_status' ],
        icon: "",
        iconPriority: 0
    },
    "custom.airConditionerOptionalMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'aircon_option' ],
        icon: "",
        iconPriority: 0
    },
    "custom.autoCleaningMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'aircon_auto_cleaning_mode' ],
        icon: "",
        iconPriority: 0
    },
    "energyMeter":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'measure_power' ],
        icon: "energy.svg",
        iconPriority: 0
    },
    "powerMeter":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'meter_power' ],
        icon: "energy.svg",
        iconPriority: 0
    },
    "refrigeration":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'defrost', 'rapid_cooling', 'rapid_freezing' ],
        icon: "refrigerator.svg",
        iconPriority: 5
    },
    "samsungce.washerCycle":
    {
        class: "",
        exclude: "",
        capabilities: [ 'washer_mode', 'washer_mode_02' ],
        icon: "",
        iconPriority: 0,
        statusEntry: 'referenceTable', // lookup this entry in the device status to fins out which capability to add
        statusValue: [ 'Table_00', 'Table_02' ] // The value that matches here determines the index of the capability to add from the capabilities list
    },
    "windowShade":
    {
        class: "windowcoverings",
        exclude: "",
        capabilities: [ 'windowcoverings_set' ],
        icon: "rollerblind.svg",
        iconPriority: 5
    },
    "doorControl":
    {
        class: "garagedoor",
        exclude: "",
        capabilities: [ 'alarm_garage_door' ],
        icon: "garage_door.svg",
        iconPriority: 5
    },
    "lock":
    {
        class: "lock",
        exclude: "",
        capabilities: [ 'locked' ],
        icon: "door_lock.svg",
        iconPriority: 5
    },
    "waterSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'alarm_water' ],
        icon: "leak_detector.svg",
        iconPriority: 5
    },
    "accelerationSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'alarm_acceleration' ],
        icon: "acceleration.svg",
        iconPriority: 5
    },
    "threeAxis":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'acceleration_x', 'acceleration_y', 'acceleration_z' ],
        icon: "acceleration.svg",
        iconPriority: 0
    },
    "robotCleanerCleaningMode":
    {
        class: "vacuumcleaner",
        exclude: "",
        capabilities: [ 'robot_cleaning_mode' ],
        icon: "vacuum_cleaner.svg",
        iconPriority: 5
    },
    "robotCleanerMovement":
    {
        class: "vacuumcleaner",
        exclude: "",
        capabilities: [ 'robot_cleaning_movement' ],
        icon: "vacuum_cleaner.svg",
        iconPriority: 5
    },
    "robotCleanerTurboMode":
    {
        class: "vacuumcleaner",
        exclude: "",
        capabilities: [ 'robot_cleaning_turbo' ],
        icon: "vacuum_cleaner.svg",
        iconPriority: 5
    },
    "dryerOperatingState":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dryer_job_status', 'dryer_completion_time', 'dryer_status' ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "custom.dryerDryLevel":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dryer_dry_level' ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "custom.dryerWrinklePrevent":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dryer_wrinkle_prevent' ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "samsungce.dryerCycle":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dryer_cycle' ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "samsungce.dryerDryingTemperature":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dryer_temperature' ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "samsungce.dryerDryingTime":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dryer_time' ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "mediaInputSource":
    {
        class: "",
        exclude: "",
        capabilities: [ 'media_input_source' ],
        icon: "",
        iconPriority: 0
    },
    "samsungce.dishwasherJobState":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_job_status' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
    "samsungce.autoDoorRelease":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_auto_door_release' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
    "samsungce.detergentState":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_dertergent' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
    "samsungce.dishwasherWashingCourse":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_washing_course' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
    "samsungce.dishwasherWashingCourseDetails":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_washing_course_details' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
    "samsungce.dishwasherWashingOptions":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_washing_options' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
    "samsungce.drumSelfCleaning":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_drum_self_cleaning' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
    "samsungce.dishwasherOperation":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_operation' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
    "samsungce.errorAndAlarmState":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'error_alarm_state' ],
        icon: "dishwasher.svg",
        iconPriority: 5
    },
};

class MyApp extends Homey.App
{
    async onInit()
    {
        this.diagLog = "";
        this.log( 'SmartThings is starting...' );

        if ( process.env.DEBUG === '1' )
        {
            this.homey.settings.set( 'debugMode', true );
        }
        else
        {
            this.homey.settings.set( 'debugMode', false );
        }

        this.homeyHash = await this.homey.cloud.getHomeyId();
        this.homeyHash = this.hashCode(this.homeyHash).toString();

        this.BearerToken = this.homey.settings.get( 'BearerToken' );
        if ( this.homey.settings.get( 'pollInterval' ) < 1 )
        {
            this.homey.settings.set( 'pollInterval', 5 );
        }

        this.log( "SmartThings has started with Key: " + this.BearerToken + " Polling every " + this.homey.settings.get( 'pollInterval' ) + " seconds" );

        // Callback for app settings changed
        this.homey.settings.on( 'set', async function( setting )
        {
            this.homey.app.updateLog( "Setting " + setting + " has changed." );

            if ( setting === 'BearerToken' )
            {
                this.homey.app.BearerToken = this.homey.settings.get( 'BearerToken' );
            }

            if ( setting === 'pollInterval' )
            {
                this.homey.clearTimeout( this.homey.app.timerID );
                if ( this.homey.app.BearerToken && !this.homey.app.timerProcessing )
                {
                    if ( this.homey.settings.get( 'pollInterval' ) > 1 )
                    {
                        this.homey.app.timerID = this.homey.setTimeout( this.homey.app.onPoll, this.homey.settings.get( 'pollInterval' ) * 1000 );
                    }
                }
            }
        } );

        let ac_auto_cleaning_mode_action = this.homey.flow.getActionCard( 'ac_auto_cleaning_mode_action' );
        ac_auto_cleaning_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "ac_auto_cleaning_mode_action: arg = " + args.ac_auto_cleaning_option + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_auto_cleaning_mode', args.ac_auto_cleaning_option = "auto" ); // Promise<void>
            } );

        let ac_sound_mode_action = this.homey.flow.getActionCard( 'ac_sound_mode_action' );
        ac_sound_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "ac_sound_mode_action: arg = " + args.ac_sound_option + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'silent_mode', args.ac_sound_option == "on" ); // Promise<void>
            } );

        let ac_fan_mode_action = this.homey.flow.getActionCard( 'ac_fan_mode_action' );
        ac_fan_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "ac_fan_mode_action: arg = " + args.ac_fan_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_fan_mode', args.ac_fan_mode ); // Promise<void>
            } );

        let ac_fan_oscillation_mode_action = this.homey.flow.getActionCard( 'ac_fan_oscillation_mode_action' );
        ac_fan_oscillation_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "ac_fan_oscillation_mode_action: arg = " + args.ac_fan_oscillation_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_fan_oscillation_mode', args.ac_fan_oscillation_mode ); // Promise<void>
            } );

        let ac_lights_action = this.homey.flow.getActionCard( 'ac_lights_action' );
        ac_lights_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "ac_lights_action: arg = " + args.ac_lights_option + " - state = " + state );
                if ( args.ac_lights_option == "on" )
                {
                    return await args.device.onCapabilityAc_lights_on( true, null );
                }
                else
                {
                    return await args.device.onCapabilityAc_lights_off( true, null );
                }
            } );

        let ac_mode_action = this.homey.flow.getActionCard( 'ac_mode_action' );
        ac_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "ac_mode_action: arg = " + args.ac_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_mode', args.ac_mode ); // Promise<void>
            } );

        let ac_options_action = this.homey.flow.getActionCard( 'ac_options_action' );
        ac_options_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "ac_options_action: arg = " + args.ac_option + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_option', args.ac_option ); // Promise<void>
            } );

        let door_action = this.homey.flow.getActionCard( 'door_action' );
        door_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "door_action: arg = " + args.garage_door + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'alarm_garage_door', args.garage_door === 'open' ); // Promise<void>
            } );

        let washing_mode_action = this.homey.flow.getActionCard( 'washing_machine_mode_action' );
        washing_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "washing_machine_mode_action: arg = " + args.washer_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'washer_mode', args.washer_mode ); // Promise<void>
            } );

        let washing_mode_02_action = this.homey.flow.getActionCard( 'washing_machine_mode_02_action' );
        washing_mode_02_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "washing_machine_mode_02_action: arg = " + args.washer_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'washer_mode_02', args.washer_mode ); // Promise<void>
            } );

        let washing_machine_temperature_action = this.homey.flow.getActionCard( 'washing_machine_temperature_action' );
        washing_machine_temperature_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "washing_machine_temperature_action: arg = " + args.water_temperature + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'water_temperature', args.water_temperature ); // Promise<void>
            } );

        let washing_machine_status_action = this.homey.flow.getActionCard( 'washing_machine_status_action' );
        washing_machine_status_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "washing_machine_status_action: arg = " + args.washer_status + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'washer_status', args.washer_status ); // Promise<void>
            } );

        let washing_machine_rinse_cycles_action = this.homey.flow.getActionCard( 'washing_machine_rinse_cycles_action' );
        washing_machine_rinse_cycles_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "washing_machine_rinse_cycles_action: arg = " + args.rinse_cycles + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'rinse_cycles', args.rinse_cycles ); // Promise<void>
            } );

        let washing_machine_spin_level_action = this.homey.flow.getActionCard( 'washing_machine_spin_level_action' );
        washing_machine_spin_level_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "washing_machine_spin_level_action: arg = " + args.spin_level + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'spin_level', args.spin_level ); // Promise<void>
            } );

        let robot_vacuum_start_action = this.homey.flow.getActionCard( 'robot_vacuum_start_action' );
        robot_vacuum_start_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "robot_vacuum_start_action: arg = " + args.robotCleanerCleaningMode * ", " + args.robotCleanerCleaningMovement + " - state = " + state );
                await args.device.triggerCapabilityListener( 'robot_cleaning_mode', args.robotCleanerCleaningMode ); // Promise<void>
                return await args.device.triggerCapabilityListener( 'robot_cleaning_movement', args.robotCleanerCleaningMovement ); // Promise<void>
            } );

        let doorOpenCondition = this.homey.flow.getConditionCard( 'is_door_open' );
        doorOpenCondition
            .registerRunListener( async ( args, state ) =>
            {
                let doorState = args.device.getCapabilityValue( 'alarm_garage_door' );
                return doorState; // true or false
            } );

        let dryer_status_action = this.homey.flow.getActionCard( 'dryer_status_action' );
        dryer_status_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "dryer_status_action: arg = " + args.dryer_status + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'dryer_status', args.dryer_status ); // Promise<void>
            } );


        let media_input_source_action = this.homey.flow.getActionCard( 'media_input_source_action' );
        media_input_source_action
            .registerRunListener( async ( args, state ) =>
            {
                this.homey.app.updateLog( "media_input_source_action: arg = " + args.media_input_source + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'media_input_source', args.media_input_source ); // Promise<void>
            } );

        this.onPoll = this.onPoll.bind( this );

        if ( this.BearerToken )
        {
            if ( this.homey.settings.get( 'pollInterval' ) > 1 )
            {
                this.updateLog( "Start Polling" );
                this.timerID = this.homey.setTimeout( this.onPoll, 10000 );
            }
        }

        this.updateLog( '************** App has initialised. ***************' );
    }

    hashCode(s)
    {
        let h = 0;
        for (let i = 0; i < s.length; i++)
        {
            h = Math.imul(31, h) + s.charCodeAt(i) | 0;
        }
        return h;
    }

    async getDevices(LogOnly = false)
    {
        function isExcluded(capabilities, exclusions)
        {
            for ( const capability of capabilities )
            {
                const idx = exclusions.indexOf( capability.id );
                if (idx >= 0)
                {
                    // Excluded
                    return true;
                }
            }

            return false;
        }

        //https://api.smartthings.com/v1/devices
        const url = "devices";
        let searchResult = await this.homey.app.GetURL( url );
        if ( searchResult )
        {
            let searchData = JSON.parse( searchResult.body );
            this.detectedDevices = JSON.stringify( searchData, null, 2 );
            if (LogOnly)
            {
                return;
            }

            this.homey.api.realtime( 'com.smartthings.detectedDevicesUpdated',
            {
                'devices': this.detectedDevices
            } );

            const devices = [];

            // Create an array of devices
            for ( const device of searchData.items )
            {
                this.homey.app.updateLog( "Found device: " );
                this.homey.app.updateLog( JSON.stringify( device, null, 2 ) );

                var components = device.components;
                var iconName = "";
                var iconPriority = 0;

                for ( const component of components )
                {
                    var data = {};
                    data = {
                        "id": device.deviceId,
                        "component": component.id,
                    };

                    var capabilities = [];
                    let className = 'socket';

                    // Find supported capabilities
                    var deviceCapabilities = component.capabilities;
                    for ( const deviceCapability of deviceCapabilities )
                    {
                        const capabilityMapEntry = CapabilityMap2[ deviceCapability.id ];
                        if ( capabilityMapEntry )
                        {
                            // Make sure the entry has no exclusion condition or that the capabilities for the device does not have the excluded item
                            if ( ( capabilityMapEntry.exclude == "" ) || (!isExcluded(deviceCapabilities, capabilityMapEntry.exclude) ))
                            {
                                //Add to the table
                                if ( capabilityMapEntry.icon && capabilityMapEntry.iconPriority > iconPriority )
                                {
                                    iconName = capabilityMapEntry.icon;
                                    iconPriority = capabilityMapEntry.iconPriority;

                                    if ( capabilityMapEntry.class != "" )
                                    {
                                        className = capabilityMapEntry.class;
                                    }
                                }

                                if ( capabilityMapEntry.statusEntry )
                                {
                                    // We need to check the value status to get more information about which capability to add
                                    const capabilityStatus = await this.getDeviceCapabilityValue( device.deviceId, component.id, deviceCapability.id );
                                    this.homey.app.updateLog( `Capability status for: ${deviceCapability.id} = ${this.varToString( capabilityStatus )}` );
                                    if ( capabilityStatus[ capabilityMapEntry.statusEntry ] )
                                    {
                                        const option = capabilityStatus[ capabilityMapEntry.statusEntry ];
                                        for ( let entry = 0; entry < capabilityMapEntry.statusValue.length; entry++ )
                                        {
                                            if ( option.value && option.value.id && (option.value.id === capabilityMapEntry.statusValue[ entry ]) )
                                            {
                                                capabilities.push( capabilityMapEntry.capabilities[ entry ] );
                                                break;
                                            }
                                        }
                                    }
                                }
                                else
                                {
                                    for ( const element of capabilityMapEntry.capabilities )
                                    {
                                        capabilities.push( element );
                                    }
                                }
                            }
                            else
                            {
                                this.homey.app.updateLog( "Excluded Capability: " + deviceCapability.id );
                            }
                        }
                    }
                    if ( capabilities.length > 0 )
                    {
                        // Add this device to the table
                        devices.push(
                        {
                            "name": device.label + ": " + component.id,
                            "icon": iconName, // relative to: /drivers/<driver_id>/assets/
                            "class": className,
                            "capabilities": capabilities,
                            data
                        } );
                    }
                }
            }
            return devices;
        }
        else
        {
            this.homey.app.updateLog( "Getting API Key returned NULL" );
            throw new Error( "HTTPS Error: Nothing returned" );
        }
    }

    async getDevicesByCategory( category )
    {
        function myFind( element )
        {
            return element.name === category;
        }

        //https://api.smartthings.com/v1/devices
        const url = "devices";
        let searchResult = await this.homey.app.GetURL( url );
        if ( searchResult )
        {
            let searchData = JSON.parse( searchResult.body );
            this.detectedDevices = JSON.stringify( searchData, null, 2 );
            this.homey.api.realtime( 'com.smartthings.detectedDevicesUpdated',
            {
                'devices': this.detectedDevices
            } );

            const devices = [];
            // Create an array of devices
            for ( const device of searchData.items )
            {
                var components = device.components;

                // Find the main component
                for ( const component of components )
                {
                    if ( component.id === 'main' )
                    {
                        if ( component.categories.findIndex( myFind ) >= 0 )
                        {
                            this.homey.app.updateLog( "Found device: " );
                            this.homey.app.updateLog( JSON.stringify( device, null, 2 ) );

                            var data = {};
                            data = {
                                "id": device.deviceId,
                            };

                            // Add this device to the table
                            devices.push(
                            {
                                "name": device.label,
                                data
                            } );
                        }

                        break;
                    }
                }
            }
            return devices;
        }
        else
        {
            this.homey.app.updateLog( "Getting API Key returned NULL" );
            throw new Error( "HTTPS Error: Nothing returned" );
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
            this.homey.app.updateLog( "Get all device: " + url + "\nResult: " + JSON.stringify( searchData, null, 2 ) );
            return searchData;
        }

        return -1;
    }

    async getComponentCapabilityValue( DeviceID, ComponentID )
    {
        //https://api.smartthings.com/v1/devices/{deviceId}/components/{componentId}/status
        let url = "devices/" + DeviceID + "/components/" + ComponentID + "/status";
        let result = await this.GetURL( url );
        if ( result )
        {
            let searchData = JSON.parse( result.body );
            this.homey.app.updateLog( "Get component: " + url + "\nResult: " + JSON.stringify( searchData, null, 2 ) );
            return searchData;
        }

        return -1;
    }

    async getDeviceCapabilityValue( DeviceID, ComponentID, CapabilityID )
    {
        if ( ( process.env.DEBUG === '1' ) )
        {
            let simData = this.homey.settings.get( 'simData' );
            if ( simData )
            {
                simData = JSON.parse( simData );
                if ( simData.deviceId === DeviceID )
                {
                    const component = simData.components[ ComponentID ];
                    return component[ CapabilityID ];
                }
            }
        }

        //https://api.smartthings.com/v1/devices/{deviceId}/components/{componentId}/capabilities/{capabilityId}/status
        let url = "devices/" + DeviceID + "/components/" + ComponentID + "/capabilities/" + CapabilityID + "/status";
        try
        {
            let result = await this.GetURL( url );
            if ( result )
            {
                let searchData = JSON.parse( result.body );
                this.homey.app.updateLog( "Get device: " + url + "\nResult: " + JSON.stringify( searchData, null, 2 ) );
                return searchData;
            }
        }
        catch (err )
        {
            this.homey.app.updateLog( "Get device error: " + url + "\nError: " + JSON.stringify( err, null, 2 ) );
        }
        return -1;
    }

    async setDeviceCapabilityValue( DeviceID, Commands )
    {
        while ( this.homey.app.timerProcessing )
        {
            // Wait for polling loop to finish fetching
            await new Promise( resolve => this.homey.setTimeout( resolve, 250 ) );
        }

        //https://api.smartthings.com/v1/devices/{deviceId}/commands
        let url = "devices/" + DeviceID + "/commands";
        let result = await this.PostURL( url, Commands );
        if ( result )
        {
            let searchData = JSON.parse( result.body );
            this.homey.app.updateLog( "Set device: " + url + "\nResult: " + JSON.stringify( searchData, null, 2 ) );
            return searchData;
        }

        return -1;
    }

    async GetURL( url )
    {
        if ( ( process.env.DEBUG === '1' ) && ( url === 'devices' ) )
        {
            const simData = this.homey.settings.get( 'simData' );
            if ( simData )
            {
                return {
                    'body': simData
                };
            }
        }

        this.homey.app.updateLog( url );

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                if ( !this.homey.app.BearerToken )
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
                        "Authorization": "Bearer " + this.homey.app.BearerToken,
                    },
                };

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
                        this.homey.app.updateLog( "HTTPS Error: " + res.statusCode + ": " + message );
                        reject(
                        {
                            statusCode: res.statusCode,
                            statusMessage: "HTTPS Error: " + message
                        } );
                    }
                } ).on( 'error', ( err ) =>
                {
                    this.homey.app.updateLog( err );
                    reject(
                    {
                        statusCode: -1,
                        statusMessage: "HTTPS Catch : " + err
                    } );
                } );
            }
            catch ( err )
            {
                this.homey.app.updateLog( err.message );
                reject(
                {
                    statusCode: -2,
                    statusMessage: "HTTPS Catch: " + err.message
                } );
            }
        } );
    }

    async PostURL( url, body )
    {
        this.homey.app.updateLog( "PostURL url: " + url );
        let bodyText = JSON.stringify( body );
        this.homey.app.updateLog( "PostUrl body: " + bodyText );

        if ( ( process.env.DEBUG === '1' ) )
        {
            const simData = this.homey.settings.get( 'simData' );
            if ( simData )
            {
                return;
            }
        }

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                if ( !this.homey.app.BearerToken )
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
                        "Authorization": "Bearer " + this.homey.app.BearerToken,
                        "contentType": "application/json; charset=utf-8",
                        "Content-Length": bodyText.length
                    },
                };

                let req = https.request( https_options, ( res ) =>
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
                            //                            this.homey.app.updateLog( "Done PostRUL" );
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
                        this.homey.app.updateLog( "HTTPS Error: " + res.statusCode + ": " + message );
                        reject(
                        {
                            statusCode: res.statusCode,
                            statusMessage: "HTTPS Error: " + message
                        } );
                    }
                } ).on( 'error', ( err ) =>
                {
                    this.homey.app.updateLog( err );
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
                this.homey.app.updateLog( this.varToString( err.message ) );
                reject(
                {
                    statusCode: -2,
                    statusMessage: "HTTPS Catch: " + err.message
                } );
            }
        } );
    }

    async onPoll()
    {
        this.homey.app.timerProcessing = true;
        this.homey.app.updateLog( "!!!!!! Polling started" );
        const promises = [];
        try
        {
            // Fetch the list of drivers for this app
            const drivers = this.homey.drivers.getDrivers();
            for ( const driver in drivers )
            {
                let devices = this.homey.drivers.getDriver( driver ).getDevices();
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
            this.homey.app.updateLog( "!!!!!! Polling finished" );
        }
        catch ( err )
        {
            this.homey.app.updateLog( "Polling Error: " + this.varToString( err.message ) );
        }

        var nextInterval = Number( this.homey.settings.get( 'pollInterval' ) ) * 1000;
        if ( nextInterval < 1000 )
        {
            nextInterval = 5000;
        }
        this.homey.app.updateLog( "Next Interval = " + nextInterval, true );
        this.homey.app.timerID = this.homey.setTimeout( this.homey.app.onPoll, nextInterval );
        this.homey.app.timerProcessing = false;
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
        if ( this.homey.settings.get( 'logEnabled' ) )
        {
            console.log( newMessage );
            this.diagLog += "* ";
            this.diagLog += newMessage;
            this.diagLog += "\r\n";
            if ( this.diagLog.length > 60000 )
            {
                this.diagLog = this.diagLog.substr( this.diagLog.length - 60000 );
            }
            this.homey.api.realtime( 'com.smartthings.logupdated',
            {
                'log': this.diagLog
            } );
        }
    }

    async sendLog(logType)
    {
        let tries = 5;
        this.log('Send Log');
        while (tries-- > 0)
        {
            try
            {
                let subject = '';
                let text = '';
                if (logType === 'infoLog')
                {
                    subject = `SmartThings Information log`;
                    text = this.varToString(this.diagLog);
                }
                else if (logType === 'deviceLog')
                {
                    subject = 'SmartThings device log';
                    text = this.varToString(this.detectedDevices);
                }

                subject += `(${this.homeyHash} : ${Homey.manifest.version})`;

                // create reusable transporter object using the default SMTP transport
                const transporter = nodemailer.createTransport(
                {
                    host: Homey.env.MAIL_HOST, // Homey.env.MAIL_HOST,
                    port: 465,
                    ignoreTLS: false,
                    secure: true, // true for 465, false for other ports
                    auth:
                    {
                        user: Homey.env.MAIL_USER, // generated ethereal user
                        pass: Homey.env.MAIL_SECRET, // generated ethereal password
                    },
                    tls:
                    {
                        // do not fail on invalid certs
                        rejectUnauthorized: false,
                    },
                },);

                // send mail with defined transport object
                const response = await transporter.sendMail(
                {
                    from: `"Homey User" <${Homey.env.MAIL_USER}>`, // sender address
                    to: Homey.env.MAIL_RECIPIENT, // list of receivers
                    subject, // Subject line
                    text, // plain text body
                },);

                return {
                    error: response.err,
                    message: response.err ? null : 'OK',
                };
            }
            catch (err)
            {
                this.logInformation('Send log error', err);
                return {
                    error: err,
                    message: null,
                };
            }
        }
        return {
            message: 'Failed 5 attempts',
        };
    }

}

module.exports = MyApp;