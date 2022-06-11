/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

const capabilityMap1 = {
    "onoff":
    { // Homey capability
        dataEntry: [ 'switch', 'switch', 'value' ], // structure build, e.g. switch.switch.value
        capabilityID: 'switch',
        divider: 0, // Factor to convert to homey units
        boolCompare: 'on', // The true state of a boolean value. E.g. ST returns on for true
        flowTrigger: null // The flow to trigger when the value changes
    },
    "dim":
    {
        dataEntry: [ 'switchLevel', 'level', 'value' ],
        capabilityID: 'switchLevel',
        divider: 100,
        boolCompare: '',
        flowTrigger: null
    },
    "light_temperature":
    {
        dataEntry: [ 'colorTemperature', 'colorTemperature', 'value' ],
        capabilityID: 'colorTemperature',
        lowValue: 'minTemperature', // Specify a seting name or a number
        hiValue: 'maxTemperature', // Specify a seting name or a number
        invert: true,
        boolCompare: '',
        flowTrigger: null
    },
    "light_hue":
    {
        dataEntry: [ 'colorControl', 'hue', 'value' ],
        capabilityID: 'colorControl',
        divider: 100,
        boolCompare: '',
        flowTrigger: null
    },
    "light_saturation":
    {
        dataEntry: [ 'colorControl', 'saturation', 'value' ],
        capabilityID: 'colorControl',
        divider: 100,
        boolCompare: '',
        flowTrigger: null
    },
    "volume_set":
    {
        dataEntry: [ 'audioVolume', 'volume', 'value' ],
        capabilityID: 'audioVolume',
        divider: 100,
        boolCompare: '',
        flowTrigger: null
    },
    "volume_mute":
    {
        dataEntry: [ 'audioMute', 'mute.', 'value' ],
        capabilityID: 'audioMute',
        divider: 0,
        boolCompare: 'muted',
        flowTrigger: null
    },
    "alarm_contact":
    {
        dataEntry: [ 'contactSensor', 'contact', 'value' ],
        capabilityID: 'contactSensor',
        divider: 0,
        boolCompare: 'open',
        flowTrigger: ''
    },
    "measure_battery":
    {
        dataEntry: [ 'battery', 'battery', 'value' ],
        capabilityID: 'battery',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "measure_power":
    {
        dataEntry: [ 'powerConsumptionReport', 'powerConsumption', 'value', 'power' ],
        capabilityID: 'powerConsumptionReport',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        keep: true
    },
    "meter_power.delta":
    {
        dataEntry: [ 'powerConsumptionReport', 'powerConsumption', 'value', 'deltaEnergy' ],
        capabilityID: 'powerConsumptionReport',
        divider: 1000,
        boolCompare: '',
        flowTrigger: null,
        keep: true
    },
    "meter_power":
    {
        dataEntry: [ 'powerConsumptionReport', 'powerConsumption', 'value', 'energy' ],
        capabilityID: 'powerConsumptionReport',
        divider: 1000,
        boolCompare: '',
        flowTrigger: null,
        keep: true
    },
    "washer_mode":
    {
        dataEntry: [ 'samsungce.washerCycle', 'washerCycle', 'value' ],
        capabilityID: 'samsungce.washerCycle',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "washer_mode_02":
    {
        dataEntry: [ 'samsungce.washerCycle', 'washerCycle', 'value' ],
        capabilityID: 'samsungce.washerCycle',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "washer_status":
    {
        dataEntry: [ 'washerOperatingState', 'machineState', 'value' ],
        capabilityID: 'washerOperatingState',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'washer_status_changed',
        keep: true
    },
    "washer_job_status":
    {
        dataEntry: [ 'washerOperatingState', 'washerJobState', 'value' ],
        capabilityID: 'washerOperatingState',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        keep: true
    },
    "completion_time":
    {
        dataEntry: [ 'washerOperatingState', 'completionTime', 'value' ],
        capabilityID: 'washerOperatingState',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        dateTime: true,
        keep: true
    },
    "water_temperature":
    {
        dataEntry: [ 'custom.washerWaterTemperature', 'washerWaterTemperature', 'value' ],
        capabilityID: 'custom.washerWaterTemperature',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "remote_status":
    {
        dataEntry: [ 'remoteControlStatus', 'remoteControlEnabled', 'value' ],
        capabilityID: 'remoteControlStatus',
        divider: 0,
        boolCompare: 'true',
        flowTrigger: null
    },
    "spin_level":
    {
        dataEntry: [ 'custom.washerSpinLevel', 'washerSpinLevel', 'value' ],
        capabilityID: 'custom.washerSpinLevel',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "rinse_cycles":
    {
        dataEntry: [ 'custom.washerRinseCycles', 'washerRinseCycles', 'value' ],
        capabilityID: 'custom.washerRinseCycles',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "alarm_presence":
    {
        dataEntry: [ 'presenceSensor', 'presence', 'value' ],
        capabilityID: 'presenceSensor',
        divider: 0,
        boolCompare: 'present',
        flowTrigger: 'presenceStatus_changed'
    },
    "alarm_motion":
    {
        dataEntry: [ 'motionSensor', 'motion', 'value' ],
        capabilityID: 'motionSensor',
        divider: 0,
        boolCompare: 'motion',
        flowTrigger: 'presenceStatus_changed'
    },
    "aircon_mode":
    {
        dataEntry: [ 'airConditionerMode', 'airConditionerMode', 'value' ],
        capabilityID: 'airConditionerMode',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "aircon_fan_mode":
    {
        dataEntry: [ 'airConditionerFanMode', 'fanMode', 'value' ],
        capabilityID: 'airConditionerFanMode',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "aircon_fan_oscillation_mode":
    {
        dataEntry: [ 'fanOscillationMode', 'fanOscillationMode', 'value' ],
        capabilityID: 'fanOscillationMode',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "measure_temperature":
    {
        dataEntry: [ 'temperatureMeasurement', 'temperature', 'value' ],
        capabilityID: 'temperatureMeasurement',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "target_temperature":
    {
        dataEntry: [ 'thermostatCoolingSetpoint', 'coolingSetpoint', 'value' ],
        capabilityID: 'thermostatCoolingSetpoint',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "measure_humidity":
    {
        dataEntry: [ 'relativeHumidityMeasurement', 'humidity', 'value' ],
        capabilityID: 'relativeHumidityMeasurement',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "measure_air_quality":
    {
        dataEntry: [ 'airQualitySensor', 'airQuality', 'value' ],
        capabilityID: 'airQualitySensor',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "aircon_option":
    {
        dataEntry: [ 'custom.airConditionerOptionalMode', 'acOptionalMode', 'value' ],
        capabilityID: 'custom.airConditionerOptionalMode',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "dust_filter_status":
    {
        dataEntry: [ 'custom.dustFilter', 'dustFilterStatus', 'value' ],
        capabilityID: 'custom.dustFilter',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'dustStatus_changed'
    },
    "aircon_auto_cleaning_mode":
    {
        dataEntry: [ 'custom.autoCleaningMode', 'autoCleaningMode', 'value' ],
        capabilityID: 'custom.autoCleaningMode',
        divider: 0,
        boolCompare: 'on',
        flowTrigger: null
    },
    "silent_mode":
    {
        dataEntry: [ 'audioVolume', 'volume', 'value' ],
        capabilityID: 'audioVolume',
        divider: 0,
        boolCompare: '0',
        flowTrigger: null
    },
    "windowcoverings_set":
    {
        dataEntry: [ 'switchLevel', 'level', 'value' ],
        capabilityID: 'switchLevel',
        divider: 100,
        boolCompare: '',
        flowTrigger: null
    },
    "rapid_freezing":
    {
        dataEntry: [ 'refrigeration', 'rapidFreezing', 'value' ],
        capabilityID: 'rapidFreezing',
        divider: 0,
        boolCompare: 'on',
        flowTrigger: null
    },
    "volume_down":
    {
        dataEntry: [],
    },
    "volume_up":
    {
        dataEntry: [],
    },
    "channel_down":
    {
        dataEntry: [],
    },
    "channel_up":
    {
        dataEntry: [],
    },
    "alarm_garage_door":
    {
        dataEntry: [ 'doorControl', 'door', 'value' ],
        capabilityID: 'doorControl',
        divider: 0,
        boolCompare: 'open',
        flowTrigger: 'doorStatus_changed'
    },
    "locked":
    {
        dataEntry: [ 'lock', 'lock', 'value' ],
        capabilityID: 'lock',
        divider: 0,
        boolCompare: 'locked',
        flowTrigger: null
    },
    "alarm_water":
    {
        dataEntry: [ 'water', 'water', 'value' ],
        capabilityID: 'waterSensor',
        divider: 0,
        boolCompare: 'wet',
        flowTrigger: 'alarm_water_changed'
    },
    "alarm_acceleration":
    {
        dataEntry: [ 'acceleration', 'acceleration', 'value' ],
        capabilityID: 'accelerationSensor',
        divider: 0,
        boolCompare: 'active',
        flowTrigger: 'alarm_acceleration_changed'
    },
    "acceleration_x":
    {
        dataEntry: [ 'threeAxis', 'threeAxis', 'value' ],
        capabilityID: 'threeAxis',
        divider: 0,
        flowTrigger: 'acceleration_x_changed',
        keep: true,
        arrayIdx: 0
    },
    "acceleration_y":
    {
        dataEntry: [ 'threeAxis', 'threeAxis', 'value' ],
        capabilityID: 'threeAxis',
        divider: 0,
        flowTrigger: 'acceleration_y_changed',
        keep: true,
        arrayIdx: 1
    },
    "acceleration_z":
    {
        dataEntry: [ 'threeAxis', 'threeAxis', 'value' ],
        capabilityID: 'threeAxis',
        divider: 0,
        flowTrigger: 'acceleration_z_changed',
        keep: true,
        arrayIdx: 2
    },
    "robot_cleaning_mode":
    {
        dataEntry: [ 'robotCleanerCleaningMode', 'robotCleanerCleaningMode', 'value' ],
        capabilityID: 'robotCleanerCleaningMode',
        divider: 0,
        flowTrigger: null
    },
    "robot_cleaning_movement":
    {
        dataEntry: [ 'robotCleanerMovement', 'robotCleanerMovement', 'value' ],
        capabilityID: 'robotCleanerMovement',
        divider: 0,
        flowTrigger: null
    },
    "robot_cleaning_turbo":
    {
        dataEntry: [ 'robotCleanerTurboMode', 'robotCleanerTurboMode', 'value' ],
        capabilityID: 'robotCleanerTurboMode',
        divider: 0,
        flowTrigger: null
    },
    "dryer_status":
    {
        dataEntry: [ 'dryerOperatingState', 'machineState', 'value' ],
        capabilityID: 'dryerOperatingState',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'dryer_status_changed',
        keep: true
    },
    "dryer_job_status":
    {
        dataEntry: [ 'dryerOperatingState', 'dryerJobState', 'value' ],
        capabilityID: 'dryerOperatingState',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        keep: true
    },
    "dryer_completion_time":
    {
        dataEntry: [ 'dryerOperatingState', 'completionTime', 'value' ],
        capabilityID: 'dryerOperatingState',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        dateTime: true,
        keep: true
    },
    "dryer_temperature":
    {
        dataEntry: [ 'samsungce.dryerDryingTemperature', 'dryingTemperature', 'value' ],
        capabilityID: 'samsungce.dryerDryingTemperature',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "dryer_cycle":
    {
        dataEntry: [ 'samsungce.dryerCycle', 'dryerCycle', 'value' ],
        capabilityID: 'samsungce.dryerCycle',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "dryer_time":
    {
        dataEntry: [ 'samsungce.dryerDryingTime', 'dryingTime', 'value' ],
        capabilityID: 'samsungce.dryerDryingTime',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "dryer_dry_level":
    {
        dataEntry: [ 'custom.dryerDryLevel', 'dryerDryLevel', 'value' ],
        capabilityID: 'custom.dryerDryLevel',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "dryer_wrinkle_prevent":
    {
        dataEntry: [ 'custom.dryerWrinklePrevent', 'dryerWrinklePrevent', 'value' ],
        capabilityID: 'custom.dryerWrinklePrevent',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "media_input_source":
    {
        dataEntry: [ 'mediaInputSource', 'inputSource', 'value' ],
        capabilityID: 'mediaInputSource',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
    },
    "tag_button_status":
    {
        dataEntry: [ 'tag.tagButton', 'tagButton', 'timestamp' ],
        capabilityID: 'tag.tagButton',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'tag_button_status_changed',
        keep: true
    },
    "button_status":
    {
        dataEntry: [ 'button', 'button', 'value' ],
        capabilityID: 'button',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
        keep: true
    },
    "button_timestamp":
    {
        dataEntry: [ 'button', 'button', 'timestamp' ],
        capabilityID: 'button',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'button_status_changed',
        flowTag: 'button_status'
    },
};

class STDevice extends Homey.Device
{

    async onInit()
    {
        this.log( 'STDevice is initialising' );
        this.deviceOn = true;
        this.remoteControlEnabled = false;

        if (this.hasCapability('locked') && this.getClass() !== 'lock')
        {
            this.setClass('lock');
        }

        // register a capability listeners
        if ( this.hasCapability( 'onoff' ) )
        {
            this.registerCapabilityListener( 'onoff', this.onCapabilityOnoff.bind( this ) );
        }

        if ( this.hasCapability( 'dim' ) )
        {
            this.registerCapabilityListener( 'dim', this.onCapabilityDim.bind( this ) );
        }

        if ( this.hasCapability( 'light_temperature' ) )
        {
            this.registerCapabilityListener( 'light_temperature', this.onCapabilityLightTemperature.bind( this ) );
        }

        if ( this.hasCapability( 'light_hue' ) )
        {
            this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHueSat.bind(this), 500);
        }

        if ( this.hasCapability( 'rinse_cycles' ) )
        {
            this.registerCapabilityListener( 'rinse_cycles', this.onCapabilityRinseCycles.bind( this ) );
        }

        if ( this.hasCapability( 'spin_level' ) )
        {
            this.registerCapabilityListener( 'spin_level', this.onCapabilitySpinLevel.bind( this ) );
        }

        if ( this.hasCapability( 'washer_status' ) )
        {
            this.registerCapabilityListener( 'washer_status', this.onCapabilityWasherStatus.bind( this ) );
        }

        if ( this.hasCapability( 'washer_mode' ) )
        {
            this.registerCapabilityListener( 'washer_mode', this.onCapabilityWasherMode.bind( this ) );
        }

        if ( this.hasCapability( 'washer_mode_02' ) )
        {
            this.registerCapabilityListener( 'washer_mode_02', this.onCapabilityWasherMode.bind( this ) );
        }

        if ( this.hasCapability( 'dryer_status' ) )
        {
            this.registerCapabilityListener( 'dryer_status', this.onCapabilityDryerStatus.bind( this ) );
        }

        if ( this.hasCapability( 'dryer_cycle' ) )
        {
            this.registerCapabilityListener( 'dryer_cycle', this.onCapabilityDryerCycle.bind( this ) );
        }

        if ( this.hasCapability( 'dryer_time' ) )
        {
            this.registerCapabilityListener( 'dryer_mode', this.onCapabilityDryerTime.bind( this ) );
        }

        if ( this.hasCapability( 'dryer_wrinkle_prevent' ) )
        {
            this.registerCapabilityListener( 'dryer_wrinkle_prevent', this.onCapabilityDryerWrinklePrevention.bind( this ) );
        }

        if ( this.hasCapability( 'water_temperature' ) )
        {
            this.registerCapabilityListener( 'water_temperature', this.onCapabilityWasherWaterTemperature.bind( this ) );
        }

        if ( this.hasCapability( 'volume_set' ) )
        {
            this.registerCapabilityListener( 'volume_set', this.onCapabilityVolume.bind( this ) );
        }

        if ( this.hasCapability( 'volume_down' ) )
        {
            this.registerCapabilityListener( 'volume_down', this.onCapabilityVolumeDown.bind( this ) );
        }

        if ( this.hasCapability( 'volume_up' ) )
        {
            this.registerCapabilityListener( 'volume_up', this.onCapabilityVolumeUp.bind( this ) );
        }

        if ( this.hasCapability( 'volume_mute' ) )
        {
            this.registerCapabilityListener( 'volume_mute', this.onCapabilityVolumeMute.bind( this ) );
        }

        if ( this.hasCapability( 'channel_down' ) )
        {
            this.registerCapabilityListener( 'channel_down', this.onCapabilityChannelDown.bind( this ) );
        }

        if ( this.hasCapability( 'channel_up' ) )
        {
            this.registerCapabilityListener( 'channel_up', this.onCapabilityChannelUp.bind( this ) );
        }

        if ( this.hasCapability( 'target_temperature' ) )
        {
            this.registerCapabilityListener( 'target_temperature', this.onCapabilityTargetTemperature.bind( this ) );
        }

        if ( this.hasCapability( 'aircon_mode' ) )
        {
            this.registerCapabilityListener( 'aircon_mode', this.onCapabilityAirConMode.bind( this ) );
        }

        if ( this.hasCapability( 'aircon_option' ) )
        {
            this.registerCapabilityListener( 'aircon_option', this.onCapabilityAirConOption.bind( this ) );
        }

        if ( this.hasCapability( 'aircon_auto_cleaning_mode' ) )
        {
            this.registerCapabilityListener( 'aircon_auto_cleaning_mode', this.onCapabilityAirCon_auto_cleaning_mode.bind( this ) );
        }

        if ( this.hasCapability( 'aircon_fan_oscillation_mode' ) )
        {
            this.registerCapabilityListener( 'aircon_fan_oscillation_mode', this.onCapabilityAirCon_fan_oscillation_mode.bind( this ) );
        }

        if ( this.hasCapability( 'silent_mode' ) )
        {
            this.registerCapabilityListener( 'silent_mode', this.onCapabilitySilent_mode.bind( this ) );
        }

        if ( this.hasCapability( 'ac_lights_on' ) )
        {
            this.registerCapabilityListener( 'ac_lights_on', this.onCapabilityAc_lights_on.bind( this ) );
        }

        if ( this.hasCapability( 'ac_lights_off' ) )
        {
            this.registerCapabilityListener( 'ac_lights_off', this.onCapabilityAc_lights_off.bind( this ) );
        }

        if ( this.hasCapability( 'windowcoverings_set' ) )
        {
            this.registerCapabilityListener( 'windowcoverings_set', this.onCapabilityWindowCoverings_set.bind( this ) );
        }

        if ( this.hasCapability( 'rapid_freezing' ) )
        {
            this.registerCapabilityListener( 'rapid_freezing', this.onCapabilityRapidFreezing_set.bind( this ) );
        }

        if ( this.hasCapability( 'alarm_garage_door' ) )
        {
            this.registerCapabilityListener( 'alarm_garage_door', this.onCapabilityGarageDoor_set.bind( this ) );
        }

        if ( this.hasCapability( 'locked' ) )
        {
            this.registerCapabilityListener( 'locked', this.onCapabilitylocked.bind( this ) );
        }

        if ( this.hasCapability( 'robot_cleaning_mode' ) )
        {
            this.registerCapabilityListener( 'robot_cleaning_mode', this.onCapabilityRobotCleaningMode.bind( this ) );
        }

        if ( this.hasCapability( 'robot_cleaning_movement' ) )
        {
            this.registerCapabilityListener( 'robot_cleaning_movement', this.onCapabilityRobotCleaningMovement.bind( this ) );
        }

        if ( this.hasCapability( 'robot_cleaning_turbo' ) )
        {
            this.registerCapabilityListener( 'robot_cleaning_turbo', this.onCapabilityRobotCleaningTurboMode.bind( this ) );
        }

        if ( this.hasCapability( 'media_input_source' ) )
        {
            this.registerCapabilityListener( 'media_input_source', this.onCapabilityMediaInputSource.bind( this ) );
        }

        this.getDeviceValues();
    }

    async onAdded() {}


    async getDeviceValues()
    {
        const devData = this.getData();
        var component = 'main';
        if ( devData.component )
        {
            component = devData.component;
        }

        // Update each capability
        var capabilityCache = {};
        const capabilities = this.getCapabilities();
        for ( var c = 0; c < capabilities.length; c++ )
        {
            const capability = capabilities[ c ];
            try
            {
                // Lookup the capability in the map
                //this.homey.app.updateLog( "Capability Processing: " + capability );

                var mapEntry = capabilityMap1[ capability ];

                // get the entry from the table for this capability
                if ( mapEntry )
                {
                    if ( mapEntry.dataEntry.length === 0 )
                    {
                        // Write only entry
                        continue;
                    }

                    var value = null;
                    if ( mapEntry.keep )
                    {
                        // Check the cache first
                        if ( capabilityCache[ mapEntry.capabilityID ] )
                        {
                            value = capabilityCache[ mapEntry.capabilityID ];
                        }
                    }

                    if ( !value )
                    {
                        value = await this.homey.app.getDeviceCapabilityValue( devData.id, component, mapEntry.capabilityID );
                    }

                    if ( mapEntry.keep )
                    {
                        // cache the data
                        capabilityCache = Object.assign( capabilityCache,
                        {
                            [ mapEntry.capabilityID ]: value
                        } );
                    }

                    for ( var i = 1; i < mapEntry.dataEntry.length; i++ )
                    {
                        value = value[ mapEntry.dataEntry[ i ] ];

                    }

                    if ( mapEntry.boolCompare )
                    {
                        value = ( value === mapEntry.boolCompare );
                        this.homey.app.updateLog( "Set Capability: " + capability + " - Value: " + value );
                        let lastValue = this.getCapabilityValue( capability );
                        this.setCapabilityValue( capability, value ).catch(this.error);
                        if ( capability === 'remote_status' )
                        {
                            this.remoteControlEnabled = value;
                        }

                        if ( mapEntry.flowTrigger )
                        {
                            this.homey.app.updateLog( "Trigger Check: " + capability + " = " + value + " was " + lastValue );
                            if ( lastValue != value )
                            {
                                this.homey.app.updateLog( "Trigger change: " + capability, " = " + value );

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

                        this.homey.app.updateLog( "Set Capability: " + capability + " - Value: " + value );
                        let lastValue = this.getCapabilityValue( capability );
                        try
                        {
                            await this.setCapabilityValue( capability, value )
                        }
                        catch( err )
                        {
                            this.log( err);
                        }

                        if ( mapEntry.flowTrigger )
                        {
                            this.homey.app.updateLog( "Trigger Check: " + capability + " = ", value + " was " + lastValue );
                            if ( lastValue != value )
                            {
                                this.homey.app.updateLog( "Trigger change: " + capability + " = " + value );

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
                    this.homey.app.updateLog( "Capability Map entry NOT found for: " + capability );
                }
            }
            catch ( err )
            {
                this.homey.app.updateLog( "getDeviceValues error: " + this.homey.app.varToString( err.message ) + " for capability: " + this.homey.app.varToString( capability ) );
            }
        }
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
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a dim level change ( 0 to 1)
    async onCapabilityDim( value, opts )
    {
        try
        {
            // Homey return a value of 0 to 1 but the real device requires a value of 0 to 100
            value *= 100;

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "switchLevel",
                    "command": "setLevel",
                    "arguments": [
                        Math.round( value )
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityOnDimError " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a color temperature level change ( 0 to 1)
    async onCapabilityLightTemperature( value, opts )
    {
        try
        {
            // Homey return a value of 0 to 1 but the real device requires a value of minTemperature to maxTemperature
            const lowValue = this.getSetting('minTemperature');
            const hiValue = this.getSetting('maxTemperature');
            value = 1 - value;
            value *= (hiValue - lowValue);
            value = value + lowValue;

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "colorTemperature",
                    "command": "setColorTemperature",
                    "arguments": [
                        Math.round( value )
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityLightTemperature " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a Hue level change ( 0 to 1)
    async onCapabilityLightHueSat( values, opts )
    {
        try
        {
            // Homey return a value of 0 to 1 but the real device requires a value of 0 to 100
            const hue = values.light_hue * 100;
            const sat = values.light_saturation * 100;

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "colorControl",
                    "command": "setColor",
                    "arguments": [{
                        "hue": Math.round( hue ),
                        "saturation": Math.round( sat )
                    }]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityLightTemperature " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityRinseCycles( value, opts )
    {
        try
        {
            if ( !this.deviceOn || !this.remoteControlEnabled )
            {
                this.setWarning( "Remote control not enabled", null );
                throw new Error( "Remote control not enabled" );
            }

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "custom.washerRinseCycles",
                    "command": "setWasherRinseCycles",
                    "arguments": [
                        value
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityRinseCycles " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilitySpinLevel( value, opts )
    {
        try
        {
            if ( !this.deviceOn || !this.remoteControlEnabled )
            {
                this.setWarning( "Remote control not enabled", null );
                throw new Error( "Remote control not enabled" );
            }

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "custom.washerSpinLevel",
                    "command": "setWasherSpinLevel",
                    "arguments": [
                        value
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilitySpinLevel " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityWasherStatus( value, opts )
    {
        try
        {
            if ( !this.deviceOn || !this.remoteControlEnabled )
            {
                this.setWarning( "Remote control not enabled", null );
                throw new Error( "Remote control not enabled" );
            }

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "washerOperatingState",
                    "command": "setMachineState",
                    "arguments": [
                        value
                    ]
                } ]
            };

            // Get the device information stored during pairing
            const devData = this.getData();

            // Set the dim Value on the device using the unique feature ID stored during pairing
            let res = await this.homey.app.setDeviceCapabilityValue( devData.id, body );
            console.log( res );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityWasherStatus " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityWasherMode( value, opts )
    {
        try
        {
            if ( !this.deviceOn || !this.remoteControlEnabled )
            {
                this.setWarning( "Remote control not enabled", null );
                throw new Error( "Remote control not enabled" );
            }

            let value2 = value.substr( value.length - 9, 9 );

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "samsungce.washerCycle",
                    "command": "setWasherCycle",
                    "arguments": [
                        value2
                    ]
                } ]
            };

            // Get the device information stored during pairing
            const devData = this.getData();

            // Set the dim Value on the device using the unique feature ID stored during pairing
            let res = await this.homey.app.setDeviceCapabilityValue( devData.id, body );
            console.log( res );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityWasherMode Error" + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityDryerStatus( value, opts )
    {
        try
        {
            if ( !this.deviceOn || !this.remoteControlEnabled )
            {
                this.setWarning( "Remote control not enabled", null );
                throw new Error( "Remote control not enabled" );
            }

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "dryerOperatingState",
                    "command": "setMachineState",
                    "arguments": [
                        value
                    ]
                } ]
            };

            // Get the device information stored during pairing
            const devData = this.getData();

            // Set the dim Value on the device using the unique feature ID stored during pairing
            let res = await this.homey.app.setDeviceCapabilityValue( devData.id, body );
            console.log( res );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityWasherStatus " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityDryerCycle( value, opts )
    {
        try
        {
            if ( !this.deviceOn || !this.remoteControlEnabled )
            {
                this.setWarning( "Remote control not enabled", null );
                throw new Error( "Remote control not enabled" );
            }

            let value2 = value.substr( value.length - 9, 9 );

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "samsungce.dryerCycle",
                    "command": "setDryerCycle",
                    "arguments": [
                        value2
                    ]
                } ]
            };

            // Get the device information stored during pairing
            const devData = this.getData();

            // Set the dim Value on the device using the unique feature ID stored during pairing
            let res = await this.homey.app.setDeviceCapabilityValue( devData.id, body );
            console.log( res );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityDryerCycle Error" + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityDryerTime( value, opts )
    {
        try
        {
            if ( !this.deviceOn || !this.remoteControlEnabled )
            {
                this.setWarning( "Remote control not enabled", null );
                throw new Error( "Remote control not enabled" );
            }

            let value2 = value.substr( value.length - 9, 9 );

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "samsungce.dryerDryingTime",
                    "command": "setDryerTime",
                    "arguments": [
                        value2
                    ]
                } ]
            };

            // Get the device information stored during pairing
            const devData = this.getData();

            // Set the dim Value on the device using the unique feature ID stored during pairing
            let res = await this.homey.app.setDeviceCapabilityValue( devData.id, body );
            console.log( res );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityDryerTime Error" + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }
    
    async onCapabilityDryerWrinklePrevention( value, opts )
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
                    "capability": "custom.dryerWrinklePrevent",
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
            throw new Error( err.message );
        }
    }

    async onCapabilityWasherWaterTemperature( value, opts )
    {
        try
        {
            if ( !this.deviceOn || !this.remoteControlEnabled )
            {
                this.setWarning( "Remote control not enabled", null );
                throw new Error( "Remote control not enabled" );
            }

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "custom.washerWaterTemperature",
                    "command": "setWasherWaterTemperature",
                    "arguments": [
                        value
                    ]
                } ]
            };

            // Get the device information stored during pairing
            const devData = this.getData();

            // Set the dim Value on the device using the unique feature ID stored during pairing
            let res = await this.homey.app.setDeviceCapabilityValue( devData.id, body );
            console.log( res );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityWasherWaterTemperature " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a volume level change ( 0 to 1)
    async onCapabilityVolume( value, opts )
    {
        try
        {
            // Homey return a value of 0 to 1 but the real device requires a value of 0 to 100
            value *= 100;

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "audioVolume",
                    "command": "setVolume",
                    "arguments": [
                        Math.round( value )
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityVolume " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested the previous channel
    async onCapabilityVolumeDown( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "audioVolume",
                    "command": "volumeDown",
                    "arguments": []
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
            this.homey.app.updateLog( this.getName() + " onCapabilityVolumeDown " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested the next channel
    async onCapabilityVolumeUp( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "audioVolume",
                    "command": "volumeUp",
                    "arguments": []
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
            this.homey.app.updateLog( this.getName() + " onCapabilityVolumeUp " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested the volume to be muted
    async onCapabilityVolumeMute( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "audioMute",
                    "command": "setMute",
                    "arguments": [
                        value ? "muted" : "unmuted"
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityVolumeMute " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested the previous channel
    async onCapabilityChannelDown( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "tvChannel",
                    "command": "channelDown",
                    "arguments": []
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
            this.homey.app.updateLog( this.getName() + " onCapabilityChannelDown " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested the next channel
    async onCapabilityChannelUp( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "tvChannel",
                    "command": "channelUp",
                    "arguments": []
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
            this.homey.app.updateLog( this.getName() + " onCapabilityChannelUp " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
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
                    "component": "main",
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
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a temperature set point change
    async onCapabilityAirConOption( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "custom.airConditionerOptionalMode",
                    "command": "setAcOptionalMode",
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
            this.homey.app.updateLog( this.getName() + " onCapabilityAirConOption " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a temperature set point change
    async onCapabilityAirConMode( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "airConditionerMode",
                    "command": "setAirConditionerMode",
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
            this.homey.app.updateLog( this.getName() + " onCapabilityAirConMode " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a temperature set point change
    async onCapabilityAirCon_fan_oscillation_mode( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "fanOscillationMode",
                    "command": "setFanOscillationMode",
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
            this.homey.app.updateLog( this.getName() + " onCapabilityAirCon_fan_oscillation_mode " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityAirCon_auto_cleaning_mode( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "custom.autoCleaningMode",
                    "command": "setAutoCleaningMode",
                    "arguments": [ value ? "auto" : "off" ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityAirCon_auto_cleaning_mode " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilitySilent_mode( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "audioMute",
                    "command": "setMute",
                    "arguments": [ value ? "mute" : "unmute" ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilitySilent_mode " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityAc_lights_on( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "execute",
                    "command": "execute",
                    "arguments": [
                        "mode/vs/0",
                        {
                            "x.com.samsung.da.options": [
                                "Light_On"
                            ]
                        }
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityAc_lights_on " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityAc_lights_off( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "execute",
                    "command": "execute",
                    "arguments": [
                        "mode/vs/0",
                        {
                            "x.com.samsung.da.options": [
                                "Light_Off"
                            ]
                        }
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityAc_lights_off " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a window cover position change ( 0 to 1)
    async onCapabilityWindowCoverings_set( value, opts )
    {
        try
        {
            // Homey return a value of 0 to 1 but the real device requires a value of 0 to 100
            value *= 100;

            // SmartThings actually uses the switchLevel capability to control the position
            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "switchLevel",
                    "command": "setLevel",
                    "arguments": [
                        Math.round( value )
                    ]
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
            this.homey.app.updateLog( this.getName() + " onCapabilityOnDimError " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    // this method is called when the Homey device has requested a state change (turned on or off)
    async onCapabilityRapidFreezing_set( value, opts )
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
                    "capability": "rapidFreezing",
                    "command": "setrapidFreezing",
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
    async onCapabilityGarageDoor_set( value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            // The device requires 'close' and 'open'
            var data = 'close';
            if ( value )
            {
                data = 'open';
            }

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "doorControl",
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
            this.homey.app.updateLog( this.getName() + " onCapabilityGarageDoor_set Error " + this.homey.app.varToString( err.message ) );
            throw ( new Error( err.statusMessage ) );
        }
    }

    // this method is called when the Homey device has requested a state change (turned on or off)
    async onCapabilitylocked( value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            // The device requires 'unlock' and 'lock'
            var data = 'unlock';
            if ( value )
            {
                data = 'lock';
            }

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "lock",
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
            this.homey.app.updateLog( this.getName() + " onCapabilityLocked Error " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }
    
    async onCapabilityRobotCleaningMode( value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "robotCleanerCleaningMode",
                    "command": 'setRobotCleanerCleaningMode',
                    "arguments": [value]
                } ]
            };

            // Set the switch Value on the device using the unique feature ID stored during pairing
            await this.homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityRobotCleaningMode Error " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }
    
    async onCapabilityRobotCleaningMovement( value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "robotCleanerMovement",
                    "command": 'setRobotCleanerMovement',
                    "arguments": [value]
                } ]
            };

            // Set the switch Value on the device using the unique feature ID stored during pairing
            await this.homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityRobotCleaningMovement Error " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }
    
    async onCapabilityRobotCleaningTurboMode( value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "robotCleanerTurboMode",
                    "command": 'setRobotCleanerTurboMode',
                    "arguments": [value]
                } ]
            };

            // Set the switch Value on the device using the unique feature ID stored during pairing
            await this.homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityRobotCleaningTurboMode Error " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }

    async onCapabilityMediaInputSource( value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "mediaInputSource",
                    "command": 'setInputSource',
                    "arguments": [value]
                } ]
            };

            // Set the switch Value on the device using the unique feature ID stored during pairing
            await this.homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            this.homey.app.updateLog( this.getName() + " onCapabilityMediaInputSource Error " + this.homey.app.varToString( err.message ) );
            throw new Error( err.message );
        }
    }
}    


module.exports = STDevice;