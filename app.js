/*jslint node: true */
'use strict';

if ( process.env.DEBUG === '1' )
{
    require( 'inspector' ).open( 9227, '0.0.0.0', true );
}

const Homey = require( 'homey' );
const https = require( "https" );
const nodemailer = require( 'nodemailer' );
const URL = require( 'url' ).URL;
const fs = require( 'fs' );
const path = require('path');

const CapabilityMap1 = {
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
        dataEntry: [ 'audioMute', 'mute', 'value' ],
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
        flowTrigger: 'alarm_contact',
		valueType: 'boolean'
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
        dataEntry: [ 'powerConsumptionReport', 'powerConsumption', 'value', 'energy' ],
        capabilityID: 'powerConsumptionReport',
        diffBetween: 'meter_power',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        keep: true
    },
    "meter_power.delta":
    {
        dataEntry: [ 'powerConsumptionReport', 'powerConsumption', 'value', 'deltaEnergy' ],
        capabilityID: 'powerConsumptionReport',
        divider: 0,
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
	"meter_gas":
	{
		dataEntry: ['gasMeter', 'gasMeter', 'value' ],
		capabilityID: 'gasMeter',
		divider: 0,
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
		valueType: 'string',
		supportValues: "supportedMachineStates",
        keep: true
    },
    "washer_job_status":
    {
        dataEntry: [ 'washerOperatingState', 'washerJobState', 'value' ],
        capabilityID: 'washerOperatingState',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'job_status_changed',
		valueType: 'string',
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
        flowTrigger: null,
        checkTUnits: true
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
		supportValues: "supportedWasherSpinLevel",
        flowTrigger: null
    },
    "rinse_cycles":
    {
        dataEntry: [ 'custom.washerRinseCycles', 'washerRinseCycles', 'value' ],
        capabilityID: 'custom.washerRinseCycles',
        divider: 0,
        boolCompare: '',
		supportValues: "supportedWasherRinseCycles",
        flowTrigger: null
    },
    "alarm_presence":
    {
        dataEntry: [ 'presenceSensor', 'presence', 'value' ],
        capabilityID: 'presenceSensor',
        divider: 0,
        boolCompare: 'present',
        flowTrigger: null
    },
    "alarm_motion":
    {
        dataEntry: [ 'motionSensor', 'motion', 'value' ],
        capabilityID: 'motionSensor',
        divider: 0,
        boolCompare: [ 'motion', 'active' ],
        flowTrigger: null
    },
    "alarm_object":
    {
        dataEntry: [ 'objectDetection', 'detected', 'value', 'value' ],
        capabilityID: 'objectDetection',
        divider: 0,
        boolCompare: [ 'human', 'active' ],
        flowTrigger: null
    },
    "measure_object_type":
    {
        dataEntry: [ 'objectDetection', 'detected', 'value', 'value' ],
        capabilityID: 'objectDetection',
        divider: 0,
        flowTrigger: null
    },
    "image_capture":
    {
        dataEntry: [ 'imageCapture', 'image', 'value' ],
        capabilityID: 'imageCapture',
        divider: 0,
        boolCompare: '',
        flowTrigger: null
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
        flowTrigger: "measure_temperature",
        checkTUnits: true
    },
    "target_temperature":
    {
        dataEntry: [ 'thermostatCoolingSetpoint', 'coolingSetpoint', 'value' ],
        capabilityID: 'thermostatCoolingSetpoint',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        checkTUnits: true
    },
    "target_temperature.heating":
    {
        dataEntry: [ 'thermostatHeatingSetpoint', 'heatingSetpoint', 'value' ],
        capabilityID: 'thermostatHeatingSetpoint',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        checkTUnits: true
    },
    "thermostat_mode2":
    {
        dataEntry: [ 'thermostatMode', 'thermostatMode', 'value' ],
        capabilityID: 'thermostatMode',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'thermostat_mode2_changed',
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
        flowTrigger: 'dustStatus_changed',
		valueType: 'boolean'
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
        capabilityID: 'refrigeration',
        divider: 0,
        boolCompare: 'on',
        flowTrigger: null,
        keep: true
    },
    "defrost":
    {
        dataEntry: [ 'refrigeration', 'defrost', 'value' ],
        capabilityID: 'refrigeration',
        divider: 0,
        boolCompare: 'on',
        flowTrigger: null,
        keep: true
    },
    "rapid_cooling":
    {
        dataEntry: [ 'refrigeration', 'rapidCooling', 'value' ],
        capabilityID: 'refrigeration',
        divider: 0,
        boolCompare: 'on',
        flowTrigger: null,
        keep: true
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
        flowTrigger: 'doorStatus_changed',
		valueType: 'boolean'
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
        flowTrigger: 'alarm_water_changed',
		valueType: 'boolean'
    },
    "alarm_acceleration":
    {
        dataEntry: [ 'acceleration', 'acceleration', 'value' ],
        capabilityID: 'accelerationSensor',
        divider: 0,
        boolCompare: 'active',
        flowTrigger: 'alarm_acceleration_changed',
		valueType: 'boolean'
    },
    "acceleration_x":
    {
        dataEntry: [ 'threeAxis', 'threeAxis', 'value' ],
        capabilityID: 'threeAxis',
        divider: 0,
        flowTrigger: 'acceleration_x_changed',
		valueType: 'number',
        keep: true,
        arrayIdx: 0
    },
    "acceleration_y":
    {
        dataEntry: [ 'threeAxis', 'threeAxis', 'value' ],
        capabilityID: 'threeAxis',
        divider: 0,
        flowTrigger: 'acceleration_y_changed',
		valueType: 'number',
        keep: true,
        arrayIdx: 1
    },
    "acceleration_z":
    {
        dataEntry: [ 'threeAxis', 'threeAxis', 'value' ],
        capabilityID: 'threeAxis',
        divider: 0,
        flowTrigger: 'acceleration_z_changed',
		valueType: 'number',
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
		valueType: 'string',
        keep: true
    },
    "dryer_job_status":
    {
        dataEntry: [ 'dryerOperatingState', 'dryerJobState', 'value' ],
        capabilityID: 'dryerOperatingState',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'job_status_changed',
		valueType: 'string',
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
        flowTrigger: null,
        checkTUnits: true
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
		supportValues: "supportedInputSources",
        flowTrigger: null
    },
	"media_input_source_vd":
	{
		dataEntry: ['samsungvd.mediaInputSource', 'inputSource', 'value'],
		capabilityID: 'samsungvd.mediaInputSource',
		divider: 0,
		boolCompare: '',
		supportValues: "supportedInputSourcesMap",
		flowTrigger: null
	},
    "tag_button_status":
    {
        dataEntry: [ 'tag.tagButton', 'tagButton', 'value' ],
        capabilityID: 'tag.tagButton',
        divider: 0,
        boolCompare: '',
        keep: true
    },
    "tag_button_timestamp":
    {
        dataEntry: [ 'tag.tagButton', 'tagButton', 'timestamp' ],
        capabilityID: 'tag.tagButton',
        divider: 0,
        boolCompare: '',
        keep: true,
        flowTrigger: 'tag_button_status_changed',
		valueType: 'string',
        flowTagST: 'tagButton.value'
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
        keep: true,
        flowTrigger: 'button_status_changed',
		valueType: 'string',
        flowTag: 'button_status'
    },
    "dishwasher_job_status":
    {
        dataEntry: [ 'samsungce.dishwasherJobState', 'dishwasherJobState', 'value' ],
        capabilityID: 'samsungce.dishwasherJobState',
        divider: 0,
        boolCompare: '',
		valueType: 'string',
        flowTrigger: 'job_status_changed',
    },
    "dishwasher_auto_door_release":
    {
        dataEntry: [ 'samsungce.autoDoorRelease', 'autoDoorReleaseEnabled', 'value' ],
        capabilityID: 'samsungce.autoDoorRelease',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "dishwasher_drum_self_cleaning":
    {
        dataEntry: [ 'samsungce.drumSelfCleaning', 'washingCountAfterSelfClean', 'value' ],
        capabilityID: 'samsungce.drumSelfCleaning',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "dishwasher_operation":
    {
        dataEntry: [ 'samsungce.dishwasherOperation', 'operatingState', 'value' ],
        capabilityID: 'samsungce.dishwasherOperation',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "dishwasher_washing_course":
    {
        dataEntry: [ 'samsungce.dishwasherWashingCourse', 'washingCourse', 'value' ],
        capabilityID: 'samsungce.dishwasherWashingCourse',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "dishwasher_zone":
    {
        dataEntry: [ 'samsungce.dishwasherWashingOptions', 'selectedZone', 'value', 'value' ],
        capabilityID: 'samsungce.dishwasherWashingOptions',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
        keep: true
    },
    "dishwasher_speed_booster":
    {
        dataEntry: [ 'samsungce.dishwasherWashingOptions', 'speedBooster', 'value', 'value' ],
        capabilityID: 'samsungce.dishwasherWashingOptions',
        divider: 0,
        boolCompare: 'true',
        flowTrigger: null,
        keep: true
    },
    "dishwasher_sanitize":
    {
        dataEntry: [ 'samsungce.dishwasherWashingOptions', 'sanitize', 'value', 'value' ],
        capabilityID: 'samsungce.dishwasherWashingOptions',
        divider: 0,
        boolCompare: 'true',
        flowTrigger: null,
        keep: true
    },
    "error_alarm_state":
    {
        dataEntry: [ 'samsungce.errorAndAlarmState', 'events', 'value', 'description' ],
        capabilityID: 'samsungce.errorAndAlarmState',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "dishwasher_remaining_time":
    {
        dataEntry: [ 'samsungce.dishwasherOperation', 'remainingTimeStr', 'value' ],
        capabilityID: 'samsungce.dishwasherOperation',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "dishwasher_progress_percentage":
    {
        dataEntry: [ 'samsungce.dishwasherOperation', 'progressPercentage', 'value' ],
        capabilityID: 'samsungce.dishwasherOperation',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "dishwasher_dertergent":
    {
        dataEntry: [ 'samsungce.detergentState', 'detergentType', 'value' ],
        capabilityID: 'samsungce.detergentState',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "fridge_deodor_filter":
    {
        dataEntry: [ 'custom.deodorFilter', 'deodorFilter', 'value' ],
        capabilityID: 'custom.deodorFilter',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    // "fridge_device_report_state_configuration":
    // {
    //     dataEntry: [ 'custom.deviceReportStateConfiguration', 'deviceReportStateConfiguration', 'value' ],
    //     capabilityID: 'custom.deviceReportStateConfiguration',
    //     divider: 0,
    //     boolCompare: '',
    //     flowTrigger: null,
    // },
    "fridge_water_filter":
    {
        dataEntry: [ 'custom.waterFilter', 'waterFilterUsage', 'value' ],
        capabilityID: 'custom.waterFilter',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'fridge_water_filter_changed',
    },
    "fridge_power_cool":
    {
        dataEntry: [ 'samsungce.powerCool', 'activated', 'value' ],
        capabilityID: 'samsungce.powerCool',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "fridge_power_freeze":
    {
        dataEntry: [ 'samsungce.powerFreeze', 'activated', 'value' ],
        capabilityID: 'samsungce.powerFreeze',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "kids_lock":
    {
        dataEntry: [ 'samsungce.kidsLock', 'lockState', 'value' ],
        capabilityID: 'samsungce.kidsLock',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "measure_pm25":
    {
        dataEntry: [ 'dustSensor', 'fineDustLevel', 'value' ],
        capabilityID: 'dustSensor',
        divider: 0,
        boolCompare: '',
        flowTrigger: null,
    },
    "measure_pm10":
    {
        dataEntry: [ 'dustSensor', 'dustLevel', 'value' ],
        capabilityID: 'dustSensor',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'measure_pm10_changed',
		valueType: 'number',

    },
    "measure_pm1":
    {
        dataEntry: [ 'veryFineDustSensor', 'veryFineDustLevel', 'value' ],
        capabilityID: 'veryFineDustSensor',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'measure_pm1_changed',
		valueType: 'number',
    },
    "measure_odor":
    {
        dataEntry: [ 'odorSensor', 'odorLevel', 'value' ],
        capabilityID: 'odorSensor',
        divider: 0,
        boolCompare: '',
        flowTrigger: 'measure_odor_changed',
		valueType: 'number',
        keep: true
    },
    "pm10_status":
    {
        dataEntry: [ 'dustHealthConcern', 'dustHealthConcern', 'value' ],
        capabilityID: 'dustHealthConcern',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
    },
    "pm25_status":
    {
        dataEntry: [ 'fineDustHealthConcern', 'fineDustHealthConcern', 'value' ],
        capabilityID: 'fineDustHealthConcern',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
    },
    "pm1_status":
    {
        dataEntry: [ 'veryFineDustHealthConcern', 'veryFineDustHealthConcern', 'value' ],
        capabilityID: 'veryFineDustHealthConcern',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
    },
    "odor_status":
    {
        dataEntry: [ 'odorSensor', 'odorLevel', 'value' ],
        capabilityID: 'odorSensor',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
        valueType: 'string',
        keep: true
    },
    "alarm_smoke":
    {
        dataEntry: [ 'smokeDetector', 'smokeDetector', 'value' ],
        capabilityID: 'smokeDetector',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
    },
    "windowcoverings_state":
    {
        dataEntry: [ 'windowShade', 'windowShade', 'value' ],
        capabilityID: 'windowShade',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
        valueType: 'string',
    },
    "windowcoverings_set.real":
    {
        dataEntry: [ 'windowShadeLevel', 'windowShadeLevel', 'value' ],
        capabilityID: 'windowShadeLevel',
        divider: 100,
        boolCompare: '',
        flowTrigger: '',
        valueType: 'number',
    },
    "my_position":
    {
        dataEntry: [ 'windowShadePreset', 'windowShadePreset', 'value' ],
        capabilityID: 'windowShadePreset',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
    },
    "siren":
    {
        dataEntry: [ 'alarm', 'alarm', 'value' ],
        capabilityID: 'alarm',
        divider: 0,
        boolCompare: '',
        flowTrigger: '',
    },
};

const CapabilityMap2 = {
    "switch":
    {
        class: "",
        exclude: [ "custom.fridgeMode" ], // Ignore if the device has this ST capability
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
        exclude: [ "tag.tagButton" ],
        capabilities: [ "measure_battery" ],
        icon: "",
        iconPriority: 0
    },
    "tag.tagButton":
    {
        class: "button",
        exclude: "",
        capabilities: [ "tag_button_status" ],
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
    "objectDetection":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ "alarm_object", "measure_object_type" ],
        icon: "presence.svg",
        iconPriority: 3
    },
    "imageCapture":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ "image_capture" ],
        icon: "presence.svg",
        iconPriority: 3
    },
    "powerConsumptionReport":
    {
        class: "",
        exclude: [ "custom.fridgeMode" ], // Ignore if the device has this ST capability
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
        exclude: [ 'samsungce.dishwasherJobState' ],
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
        class: "fan",
        exclude: "",
        capabilities: [ 'aircon_fan_mode' ],
        icon: "air-purifier.svg",
        iconPriority: 4
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
    "thermostatHeatingSetpoint":
    {
        class: "thermostat",
        exclude: "",
        capabilities: [ 'target_temperature.heating' ],
        icon: "thermostat.svg",
        iconPriority: 2
    },
    "thermostatMode":
    {
        class: "",
        exclude: "",
        capabilities: [ 'thermostat_mode2' ],
        icon: "thermostat.svg",
        iconPriority: 2
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
        iconPriority: 1
    },
    "powerMeter":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'meter_power' ],
        icon: "energy.svg",
        iconPriority: 1
    },
	"gasMeter":
	{
		class: "sensor",
		exclude: "",
		capabilities: ['meter_gas'],
		icon: "energy.svg",
		iconPriority: 1
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
        statusEntry: 'referenceTable', // lookup this entry in the device status to find out which capability to add
        statusValue: [ 'Table_00', 'Table_02' ] // The value that matches here determines the index of the capability to add from the capabilities list
    },
    // "windowShade":
    // {
    //     class: "windowcoverings",
    //     exclude: "",
    //     capabilities: [ 'windowcoverings_set' ],
    //     icon: "rollerblind.svg",
    //     iconPriority: 5
    // },
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
        class: "speaker",
		exclude: ["samsungvd.mediaInputSource"], // Ignore if the device has this ST capability
        capabilities: [ 'media_input_source' ],
        icon: "media.svg",
        iconPriority: 2
    },
	"samsungvd.mediaInputSource":
	{
		class: "speaker",
		exclude: "",
		capabilities: ['media_input_source_vd'],
		icon: "media.svg",
		iconPriority: 2
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
    "samsungce.dishwasherWashingOptions":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'dishwasher_zone' ],
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
        capabilities: [ 'dishwasher_operation', 'dishwasher_remaining_time', 'dishwasher_progress_percentage' ],
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
    // "custom.deodorFilter":
    // {
    //     class: "other",
    //     exclude: "",
    //     capabilities: [ 'fridge_deodor_filter' ],
    //     icon: "refrigerator.svg",
    //     iconPriority: 5
    // },
    // "custom.deviceReportStateConfiguration":
    // {
    //     class: "other",
    //     exclude: "",
    //     capabilities: [ 'fridge_device_report_state_configuration' ],
    //     icon: "refrigerator.svg",
    //     iconPriority: 5
    // },
    "custom.waterFilter":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'fridge_water_filter' ],
        icon: "refrigerator.svg",
        iconPriority: 5
    },
    "samsungce.powerCool":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'fridge_power_cool' ],
        icon: "refrigerator.svg",
        iconPriority: 5
    },
    "samsungce.powerFreeze":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'fridge_power_freeze' ],
        icon: "refrigerator.svg",
        iconPriority: 5
    },
    "samsungce.kidsLock":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'kids_lock' ],
        icon: "washingmachine.svg",
        iconPriority: 5
    },
    "dustSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'measure_pm25', 'measure_pm10' ],
        icon: "air-purifier.svg",
        iconPriority: 5
    },
    "veryFineDustSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'measure_pm1' ],
        icon: "air-purifier.svg",
        iconPriority: 5
    },
    "odorSensor":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'measure_odor', 'odor_status' ],
        icon: "",
        iconPriority: 0
    },
    "dustHealthConcern":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'pm10_status' ],
        icon: "",
        iconPriority: 0
    },
    "fineDustHealthConcern":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'pm25_status' ],
        icon: "",
        iconPriority: 0
    },
    "veryFineDustHealthConcern":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'pm1_status' ],
        icon: "",
        iconPriority: 0
    },
    "smokeDetector":
    {
        class: "sensor",
        exclude: "",
        capabilities: [ 'alarm_smoke' ],
        icon: "smoke-detector.svg",
        iconPriority: 5
    },
    "windowShade":
    {
        class: "windowcoverings",
        exclude: "",
        capabilities: [ 'windowcoverings_state' ],
        icon: "rollerblind.svg",
        iconPriority: 5
    },
    "windowShadeLevel":
    {
        class: "windowcoverings",
        exclude: "",
        capabilities: [ 'windowcoverings_set.real' ],
        icon: "rollerblind.svg",
        iconPriority: 5
    },
    "windowShadePreset":
    {
        class: "windowcoverings",
        exclude: "",
        capabilities: [ 'my_position' ],
        icon: "rollerblind.svg",
        iconPriority: 5
    },
    "alarm":
    {
        class: "other",
        exclude: "",
        capabilities: [ 'siren' ],
        icon: "siren.svg",
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

        this.gettingDevices = false;
		this.logEnabled = this.homey.settings.get( 'logEnabled' );

        this.homeyHash = await this.homey.cloud.getHomeyId();
        this.homeyHash = this.hashCode( this.homeyHash ).toString();

        this.BearerToken = this.homey.settings.get( 'BearerToken' );
		this.pollInterval = Number(this.homey.settings.get('pollInterval'));
		if (this.pollInterval < 5 )
        {
            this.homey.settings.set( 'pollInterval', 5 );
        }
		else if (this.pollInterval > 60 )
		{
			this.homey.settings.set( 'pollInterval', 60 );
		}

        this.log( "SmartThings has started with Key: " + this.BearerToken + " Polling every " + this.homey.settings.get( 'pollInterval' ) + " seconds" );

		// Time between fetching each capability. This is to prevent overloading Homey and the SmartThings API. It is incremented each time a fetch returns error 429 or a cpuwarn event is received.
		this.fetchPause = 0;

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
				this.homey.clearTimeout(this.homey.app.timerID );
				if (this.homey.app.BearerToken && !this.homey.app.timerProcessing )
                {
					this.homey.app.pollInterval = Number(this.homey.settings.get('pollInterval'));
					if (this.homey.app.pollInterval > 1 )
                    {
						this.timerID = this.homey.setTimeout(this.homey.app.onPoll, this.homey.app.pollInterval * 1000 );
                    }
                }
            }

			if ( setting === 'logEnabled' )
			{
				this.homey.app.logEnabled = this.homey.settings.get( 'logEnabled' );
			}
        } );

		this.homey.on('memwarn', (data) =>
		{
			if (data)
			{
				this.diagLog = '';
				this.updateLog(`memwarn! ${data.count} of ${data.limit}`, true);
			}
			else
			{
				this.updateLog('memwarn', true);
			}
		});

		this.homey.on('cpuwarn', (data) =>
		{
			if (data)
			{
				this.homey.clearTimeout(this.timerID);
				this.fetchPause += 10;	// Add a 10ms delay between each capability fetch

				let interval = Number(this.homey.settings.get('pollInterval'));
				if (interval <= 60)
				{
					interval += 5;
					this.homey.settings.set('pollInterval', interval);
				}
				this.timerID = this.homey.setTimeout(this.onPoll, interval * 1000);
				this.updateLog(`cpuwarn! ${data.count} of ${data.limit}: Poll interval = ${interval}, delay = ${this.fetchPause}`, true);
			}
			else
			{
				this.updateLog('cpuwarn', true);
			}
		});

        let ac_auto_cleaning_mode_action = this.homey.flow.getActionCard( 'ac_auto_cleaning_mode_action' );
        ac_auto_cleaning_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "ac_auto_cleaning_mode_action: arg = " + args.ac_auto_cleaning_option + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_auto_cleaning_mode', args.ac_auto_cleaning_option = "auto" ); // Promise<void>
            } );

        let ac_sound_mode_action = this.homey.flow.getActionCard( 'ac_sound_mode_action' );
        ac_sound_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "ac_sound_mode_action: arg = " + args.ac_sound_option + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'silent_mode', args.ac_sound_option == "on" ); // Promise<void>
            } );

        let ac_fan_mode_action = this.homey.flow.getActionCard( 'ac_fan_mode_action' );
        ac_fan_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "ac_fan_mode_action: arg = " + args.ac_fan_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_fan_mode', args.ac_fan_mode ); // Promise<void>
            } );

        let ac_fan_oscillation_mode_action = this.homey.flow.getActionCard( 'ac_fan_oscillation_mode_action' );
        ac_fan_oscillation_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "ac_fan_oscillation_mode_action: arg = " + args.ac_fan_oscillation_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_fan_oscillation_mode', args.ac_fan_oscillation_mode ); // Promise<void>
            } );

        let ac_lights_action = this.homey.flow.getActionCard( 'ac_lights_action' );
        ac_lights_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "ac_lights_action: arg = " + args.ac_lights_option + " - state = " + state );
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
                this.updateLog( "ac_mode_action: arg = " + args.ac_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_mode', args.ac_mode ); // Promise<void>
            } );

        let ac_options_action = this.homey.flow.getActionCard( 'ac_options_action' );
        ac_options_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "ac_options_action: arg = " + args.ac_option + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'aircon_option', args.ac_option ); // Promise<void>
            } );

        let door_action = this.homey.flow.getActionCard( 'door_action' );
        door_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "door_action: arg = " + args.garage_door + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'alarm_garage_door', args.garage_door === 'open' ); // Promise<void>
            } );

        let washing_mode_action = this.homey.flow.getActionCard( 'washing_machine_mode_action' );
        washing_mode_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "washing_machine_mode_action: arg = " + args.washer_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'washer_mode', args.washer_mode ); // Promise<void>
            } );

        let washing_mode_02_action = this.homey.flow.getActionCard( 'washing_machine_mode_02_action' );
        washing_mode_02_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "washing_machine_mode_02_action: arg = " + args.washer_mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'washer_mode_02', args.washer_mode ); // Promise<void>
            } );

        let washing_machine_temperature_action = this.homey.flow.getActionCard( 'washing_machine_temperature_action' );
        washing_machine_temperature_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "washing_machine_temperature_action: arg = " + args.water_temperature + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'water_temperature', args.water_temperature ); // Promise<void>
            } );

        let washing_machine_status_action = this.homey.flow.getActionCard( 'washing_machine_status_action' );
        washing_machine_status_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "washing_machine_status_action: arg = " + args.washer_status + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'washer_status', args.washer_status ); // Promise<void>
            } );

        let washing_machine_rinse_cycles_action = this.homey.flow.getActionCard( 'washing_machine_rinse_cycles_action' );
        washing_machine_rinse_cycles_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "washing_machine_rinse_cycles_action: arg = " + args.rinse_cycles + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'rinse_cycles', args.rinse_cycles ); // Promise<void>
            } );

		const washing_machine_spin_level_action = this.homey.flow.getActionCard('washing_machine_spin_level_action');
		washing_machine_spin_level_action.registerArgumentAutocompleteListener(
			"spin_level",
			async (query, args) =>
			{
				const { values } = args.device.getCapabilityOptions("spin_level");
				const languageCode = this.homey.i18n.getLanguage();

				// Transform the values array to include id and name entries based on the language code
				const transformedValues = values.map(value => ({
					id: value.id,
					name: value.title[languageCode] || value.title['en'] // Fallback to 'en' if the language code is not found
				}));

				// Filter based on the query
				return transformedValues.filter(result =>
				{
					return result.name.toLowerCase().includes(query.toLowerCase());
				});
			}
		);
		washing_machine_spin_level_action
			.registerRunListener(async (args, state) =>
			{
				this.updateLog("washing_machine_spin_level_action: arg = " + args.spin_level + " - state = " + state);
				return await args.device.triggerCapabilityListener('spin_level', args.spin_level.id); // Promise<void>
			});

        let robot_vacuum_start_action = this.homey.flow.getActionCard( 'robot_vacuum_start_action' );
        robot_vacuum_start_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "robot_vacuum_start_action: arg = " + args.robotCleanerCleaningMode * ", " + args.robotCleanerCleaningMovement + " - state = " + state );
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
                this.updateLog( "dryer_status_action: arg = " + args.dryer_status + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'dryer_status', args.dryer_status ); // Promise<void>
            } );

        let media_input_source_action = this.homey.flow.getActionCard( 'media_input_source_action' );
        media_input_source_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "media_input_source_action: arg = " + args.media_input_source + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'media_input_source', args.media_input_source ); // Promise<void>
            } );

        let target_temperature_heating_action = this.homey.flow.getActionCard( 'target_temperature_heating_set' );
        target_temperature_heating_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "target_temperature_heating_action: arg = " + args.target_temperature + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'target_temperature.heating', args.target_temperature ); // Promise<void>
            } );

        let thermostat_mode2_action = this.homey.flow.getActionCard( 'thermostat_mode2_action' );
        thermostat_mode2_action
            .registerRunListener( async ( args, state ) =>
            {
                this.updateLog( "thermostat_mode2_action: arg = " + args.mode + " - state = " + state );
                return await args.device.triggerCapabilityListener( 'thermostat_mode2', args.mode ); // Promise<void>
            } );

		let windowcoverings_set_v2 = this.homey.flow.getActionCard( 'windowcoverings_set_real' );
		windowcoverings_set_v2
			.registerRunListener( async ( args, state ) =>
			{
				this.updateLog( "windowcoverings_set.real: arg = " + args.windowcoverings_set + " - state = " + state );
				return await args.device.triggerCapabilityListener( 'windowcoverings_set.real', args.windowcoverings_set ); // Promise<void>
			} );

		this.homey.flow.getActionCard('set_my_position')
			.registerRunListener(async (args, state) =>
			{
				this.log('set_my_position');
				return args.device.triggerCapabilityListener( 'my_position', true );
			});


		let siren_mode_action = this.homey.flow.getActionCard( 'siren_mode_action' );
		siren_mode_action
			.registerRunListener( async ( args, state ) =>
			{
				this.updateLog( "siren_mode_action: arg = " + args.siren_mode + " - state = " + state );
				return await args.device.triggerCapabilityListener( 'siren', args.siren_mode ); // Promise<void>
			} );


		const media_input_source_vd_action = this.homey.flow.getActionCard('media_input_source_vd_action');
		media_input_source_vd_action.registerArgumentAutocompleteListener(
			"media_input_source",
			async (query, args) =>
			{
				const { values } = args.device.getCapabilityOptions("media_input_source_vd");
				const languageCode = this.homey.i18n.getLanguage();

				// Transform the values array to include id and name entries based on the language code
				const transformedValues = values.map(value => ({
					id: value.id,
					name: value.title[languageCode] || value.title['en'] // Fallback to 'en' if the language code is not found
				}));

				// Filter based on the query
				return transformedValues.filter(result =>
				{
					return result.name.toLowerCase().includes(query.toLowerCase());
				});
			}
		);
		media_input_source_vd_action
			.registerRunListener(async (args, state) =>
			{
				this.updateLog("media_input_source_vd_action: arg = " + args.media_input_source + " - state = " + state);
				return await args.device.triggerCapabilityListener('media_input_source_vd', args.media_input_source.id); // Promise<void>
			});


        this.onPoll = this.onPoll.bind( this );

        if ( this.BearerToken )
        {
            if ( this.homey.settings.get( 'pollInterval' ) > 1 )
            {
                this.updateLog( "Start Polling" );
				this.homey.clearTimeout( this.timerID );
                this.timerID = this.homey.setTimeout( this.onPoll, 10000 );
            }
        }

        this.updateLog( '************** App has initialised. ***************' );
    }

    hashCode( s )
    {
        let h = 0;
        for ( let i = 0; i < s.length; i++ )
        {
            h = Math.imul( 31, h ) + s.charCodeAt( i ) | 0;
        }
        return h;
    }

    async asyncDelay(period)
    {
        await new Promise(resolve => this.homey.setTimeout(resolve, period));
    }

    async getDevices( LogOnly = false )
    {
        function isExcluded( capabilities, exclusions )
        {
            for ( const capability of capabilities )
            {
                const idx = exclusions.indexOf( capability.id );
                if ( idx >= 0 )
                {
                    // Excluded
                    return true;
                }
            }

            return false;
        }

        this.gettingDevices = true;
        while (this.timerProcessing)
        {
            await this.asyncDelay(100);
        }

        //https://api.smartthings.com/v1/devices
        const url = "devices";
        let searchResult = await this.GetURL( url );
        if ( searchResult )
        {
            let searchData = JSON.parse( searchResult.body );
            this.detectedDevices = JSON.stringify( searchData, null, 2 );
            if ( LogOnly )
            {
                this.gettingDevices = false;
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
                this.updateLog( "Found device: " );
                this.updateLog( JSON.stringify( device, null, 2 ) );

                var components = device.components;
                var iconName = "";
                var iconPriority = 0;
				const settings = { noDisabledCapabilities: true };

                // Find if 'main - custom.disabledComponents' exists
                let disabledComponents = null;
                for ( const component of components )
                {
                    if (component.id === 'main')
                    {
                        for ( const deviceCapability of component.capabilities )
                        {
                            if (deviceCapability.id === 'custom.disabledComponents')
                            {
                                disabledComponents = await this.getDeviceCapabilityValue( device.deviceId, 'main', 'custom.disabledComponents' );
                                break;
                            }
                        }
                        break;
                    }
                }

                for ( const component of components )
                {
                    if ( disabledComponents && disabledComponents.disabledComponents && disabledComponents.disabledComponents.value && disabledComponents.disabledComponents.value.findIndex( ( element ) => element === component.id ) >= 0 )
                    {
                        // This component is disabled
                        this.updateLog( `Component: ${device.label}, ${this.varToString( component )} is disabled` );
                        continue;
                    }

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
						if (deviceCapability.id === 'custom.disabledComponents')
						{
							settings.noDisabledCapabilities = false;
							continue;
						}

                        const capabilityMapEntry = CapabilityMap2[ deviceCapability.id ];
                        if ( capabilityMapEntry )
                        {
                            // Make sure the entry has no exclusion condition or that the capabilities for the device does not have the excluded item
                            if ( ( capabilityMapEntry.exclude == "" ) || ( !isExcluded( deviceCapabilities, capabilityMapEntry.exclude ) ) )
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
                                    this.updateLog( `Capability status for: ${deviceCapability.id} = ${this.varToString( capabilityStatus )}` );
                                    if ( capabilityStatus && capabilityStatus[ capabilityMapEntry.statusEntry ] )
                                    {
                                        const option = capabilityStatus[ capabilityMapEntry.statusEntry ];
                                        let found = false;
                                        for ( let entry = 0; entry < capabilityMapEntry.statusValue.length; entry++ )
                                        {
                                            if ( option.value && option.value.id && ( option.value.id === capabilityMapEntry.statusValue[ entry ] ) )
                                            {
                                                capabilities.push( capabilityMapEntry.capabilities[ entry ] );
                                                found = true;
                                                break;
                                            }
                                        }

                                        if (!found)
                                        {
                                            this.updateLog( `Capability type unknown: ${deviceCapability.id}, ${capabilityStatus}` );
                                        }
                                    }
                                    else
                                    {
                                        this.updateLog( `Capability type unknown: ${deviceCapability.id}, ${capabilityStatus}` );
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
                                this.updateLog( "Excluded Capability: " + deviceCapability.id );
                            }
                        }
                    }
                    if ( capabilities.length > 0 )
                    {
                        // Add this device to the table
                        this.updateLog( `Adding device ${device.label} with ${this.varToString( capabilities )}` );
                        devices.push(
                        {
                            "name": device.label + ": " + component.id,
                            "icon": iconName, // relative to: /drivers/<driver_id>/assets/
                            "class": className,
                            "capabilities": capabilities,
							settings,
                            data
                        } );
                    }
                }
            }
            this.gettingDevices = false;
            return devices;
        }
        else
        {
            this.gettingDevices = false;
            this.updateLog( "Getting API Key returned NULL" );
            throw new Error( "HTTPS Error: Nothing returned" );
        }
    }

    getCapabilitiesForSTCapability( stCapability )
    {
        const capabilityMapEntry = CapabilityMap2[ stCapability ];
        if ( capabilityMapEntry )
        {
            return capabilityMapEntry.capabilities;
        }

        return null;
    }

    getStCapabilitiesForCapability( Capability )
    {
        const capabilityMapEntry = CapabilityMap1[ Capability ];
        if ( capabilityMapEntry )
        {
            return capabilityMapEntry;
        }

        return null;
    }

    async getDevicesByCategory( category )
    {
        function myFind( element )
        {
            return element.name === category;
        }

        function isExcluded( capabilities, exclusions )
        {
            for ( const capability of capabilities )
            {
                const idx = exclusions.indexOf( capability.id );
                if ( idx >= 0 )
                {
                    // Excluded
                    return true;
                }
            }

            return false;
        }


        //https://api.smartthings.com/v1/devices
        const url = "devices";
        let searchResult = await this.GetURL( url );
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

                let label = null;
                for ( const component of components )
                {
                    if ( component.id === 'main' )
                    {
                        if ( component.categories.findIndex( myFind ) >= 0 )
                        {
                            this.updateLog( "Found device: " );
                            this.updateLog( JSON.stringify( device, null, 2 ) );
                            label = device.label;
                        }

                        break;
                    }
                }

                if ( label )
                {
                    let supportedComponets = [];
                    var capabilities = [];
                    var capabilitiesOptions = {};

                    const disabledComponents = await this.getDeviceCapabilityValue( device.deviceId, 'main', 'custom.disabledComponents' );
                    for ( const component of components )
                    {
                        if ( disabledComponents && disabledComponents.disabledComponents && disabledComponents.disabledComponents.value && disabledComponents.disabledComponents.value.findIndex( ( element ) => element === component.id ) >= 0 )
                        {
                            // This component is disabled
                            continue;
                        }

                        supportedComponets.push( component.id );

                        const disabledCapabilities = await this.getDeviceCapabilityValue( device.deviceId, component.id, 'custom.disabledCapabilities' );

                        // Find supported capabilities
                        var deviceCapabilities = component.capabilities;
                        for ( const deviceCapability of deviceCapabilities )
                        {
                            if ( disabledCapabilities && disabledCapabilities.disabledCapabilities && disabledCapabilities.disabledCapabilities.value && disabledCapabilities.disabledCapabilities.value.findIndex( ( element ) => element === deviceCapability.id ) >= 0 )
                            {
                                // This capability is disabled
                                continue;
                            }

                            const capabilityMapEntry = CapabilityMap2[ deviceCapability.id ];
                            if ( capabilityMapEntry )
                            {
                                // Make sure the entry has no exclusion condition or that the capabilities for the device does not have the excluded item
                                if ( ( capabilityMapEntry.exclude == "" ) || ( !isExcluded( deviceCapabilities, capabilityMapEntry.exclude ) ) )
                                {
                                    //Add to the table
                                    if ( capabilityMapEntry.statusEntry )
                                    {
                                        // We need to check the value status to get more information about which capability to add
                                        const capabilityStatus = await this.getDeviceCapabilityValue( device.deviceId, component.id, deviceCapability.id );
                                        this.updateLog( `Capability status for: ${deviceCapability.id} = ${this.varToString( capabilityStatus )}` );
                                        if ( capabilityStatus && capabilityStatus[ capabilityMapEntry.statusEntry ] )
                                        {
                                            const option = capabilityStatus[ capabilityMapEntry.statusEntry ];
                                            for ( let entry = 0; entry < capabilityMapEntry.statusValue.length; entry++ )
                                            {
                                                if ( option.value && option.value.id && ( option.value.id === capabilityMapEntry.statusValue[ entry ] ) )
                                                {
                                                    capabilities.push( `${capabilityMapEntry.capabilities[ entry ]}.${component.id}` );
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        for ( const element of capabilityMapEntry.capabilities )
                                        {
                                            capabilities.push( `${element}.${component.id}` );
                                            capabilitiesOptions[ `${element}.${component.id}` ] = {};
                                            let componentTitle = this.homey.__( `${category}.${element}_${component.id}` );
                                            if ( componentTitle )
                                            {
                                                capabilitiesOptions[ `${element}.${component.id}` ].title = componentTitle;
                                            }

                                            if ( `${element}.${component.id}` === 'target_temperature.freezer' )
                                            {
                                                capabilitiesOptions[ `${element}.${component.id}` ].min = -25;
                                                capabilitiesOptions[ `${element}.${component.id}` ].max = -5;
                                            }
                                            else if ( `${element}.${component.id}` === 'target_temperature.cooler' )
                                            {
                                                capabilitiesOptions[ `${element}.${component.id}` ].min = 0;
                                                capabilitiesOptions[ `${element}.${component.id}` ].max = 10;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    var data = {};
                    data = {
                        "id": device.deviceId,
                        "components": supportedComponets,
                    };

                    // Add this device to the table
                    devices.push(
                    {
                        "name": device.label,
                        "capabilities": capabilities,
                        "capabilitiesOptions": capabilitiesOptions,
                        data
                    } );
                }
            }
            return devices;
        }
        else
        {
            this.updateLog( "Getting API Key returned NULL" );
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
            this.updateLog( "Get all device: " + url + "\nResult: " + JSON.stringify( searchData, null, 2 ) );
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
            this.updateLog( "Get component: " + url + "\nResult: " + JSON.stringify( searchData, null, 2 ) );
            return searchData;
        }

        return -1;
    }

    async getDeviceCapabilityValue( DeviceID, ComponentID, CapabilityID )
    {
        if ( ( process.env.DEBUG === '1' ) )
        {
            let simData = this.homey.settings.get( 'simDataData' );
            if ( simData )
            {
                simData = JSON.parse( simData );
                if ( simData.data )
                {
                    if ( simData.data[ DeviceID ] )
                    {
                        if ( simData.data[ DeviceID ][ ComponentID ] )
                        {
                            return simData.data[ DeviceID ][ ComponentID ][ CapabilityID ];
                        }
                    }
                }

                if ( simData.deviceId === DeviceID )
                {
                    const component = simData.components[ ComponentID ];
                    return component[ CapabilityID ];
                }

                if (simData.items)
                {
                    for ( const device of simData.items )
                    {
                        if (device.deviceId === DeviceID )
                        {
                            var components = device.components;
                            for ( const component of components )
                            {
                                if (component.id === ComponentID)
                                {
                                    var deviceCapabilities = component.capabilities;
                                    for ( const deviceCapability of deviceCapabilities )
                                    {
                                        if (deviceCapability.id === CapabilityID)
                                        {
                                            if (deviceCapability.value)
                                            {
                                                return deviceCapability.value;
                                            }

                                            return 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
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
                this.updateLog( "Get device: " + url + "\nResult: " + JSON.stringify( searchData, null, 2 ) );
                return searchData;
            }
        }
        catch ( err )
        {
            this.updateLog( "Get device error: " + url + "\nError: " + JSON.stringify( err, null, 2 ) );
			if (err.statusCode === 422)
			{
				throw err;
			}
        }
        return null;
    }

    async setDeviceCapabilityValue( DeviceID, Commands )
    {
        while ( this.timerProcessing )
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
            this.updateLog( "Set device: " + url + "\nResult: " + JSON.stringify( searchData, null, 2 ) );
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

        this.updateLog( url );

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                if ( !this.BearerToken )
                {
                    reject(
                    {
                        statusCode: 401,
                        message: "No Token specified"
                    } );
                }

                let https_options = {
                    host: "api.smartthings.com",
                    path: "/v1/" + url,
                    headers:
                    {
                        "Authorization": "Bearer " + this.BearerToken,
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
                        this.updateLog( "HTTPS Error: " + res.statusCode + ": " + message );
                        reject(
                        {
                            statusCode: res.statusCode,
                            message: "HTTPS Error: " + message
                        } );
                    }
                } ).on( 'error', ( err ) =>
                {
                    this.updateLog( this.varToString( err ));
                    reject(
                    {
                        statusCode: -1,
                        message: "HTTPS Catch : " + err
                    } );
                } );
            }
            catch ( err )
            {
                this.updateLog( err.message );
                reject(
                {
                    statusCode: -2,
                    message: "HTTPS Catch: " + err.message
                } );
            }
        } );
    }

    async PostURL( url, body )
    {
        this.updateLog( "PostURL url: " + url );
        let bodyText = JSON.stringify( body );
        this.updateLog( "PostUrl body: " + bodyText );

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
                if ( !this.BearerToken )
                {
                    reject(
                    {
                        statusCode: 401,
                        message: "No Token specified"
                    } );
                }

                let https_options = {
                    host: "api.smartthings.com",
                    path: "/v1/" + url,
                    method: "POST",
                    headers:
                    {
                        "Authorization": "Bearer " + this.BearerToken,
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
                            //                            this.updateLog( "Done PostRUL" );
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
                        this.updateLog( "HTTPS Error: " + res.statusCode + ": " + message );
                        reject(
                        {
                            statusCode: res.statusCode,
                            message: "HTTPS Error: " + message
                        } );
                    }
                } ).on( 'error', ( err ) =>
                {
					this.updateLog(this.varToString(err) );
                    reject(
                    {
                        statusCode: -1,
                        message: "HTTPS Catch : " + err
                    } );
                } );
                req.write( bodyText );
                req.end();
            }
            catch ( err )
            {
                this.updateLog( this.varToString( err.message ) );
                reject(
                {
                    statusCode: -2,
                    message: "HTTPS Catch: " + err.message
                } );
            }
        } );
    }

    getUserDataPath(filename)
    {
        return path.join('/userdata', filename);
    }

    async GetImage( url, devData )
    {
        this.updateLog( url );

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                if ( !this.BearerToken )
                {
                    reject(
                    {
                        statusCode: 401,
                        message: "No Token specified"
                    } );
                }

                const urlComponents = new URL( url );

                let https_options = {
                    host: urlComponents.host,
                    path: urlComponents.pathname + urlComponents.search,
                    headers:
                    {
                        "Authorization": "Bearer " + this.BearerToken,
                    },
                };

                let imageFilename = 'eventImage' + devData.id;
                imageFilename = imageFilename.replace( /[^a-z0-9]/gi, '_' ).toLowerCase();
                imageFilename += ".jpg";
                const eventImagePath = this.getUserDataPath(imageFilename);

                https.get( https_options, ( res ) =>
                {
                    if ( res.statusCode === 200 )
                    {
                        res.pipe( fs.createWriteStream( eventImagePath ) )
                            .on( 'error', reject )
                            .once( 'close', () => resolve( eventImagePath ) );
                    }
                    else
                    {
                        res.resume();
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
                        this.updateLog( "HTTPS Error: " + res.statusCode + ": " + message );
                        reject(
                        {
                            statusCode: res.statusCode,
                            message: "HTTPS Error: " + message
                        } );
                    }
                } ).on( 'error', ( err ) =>
                {
					this.updateLog(this.varToString(err) );
                    reject(
                    {
                        statusCode: -1,
                        message: "HTTPS Catch : " + err
                    } );
                } );
            }
            catch ( err )
            {
                this.updateLog( err.message );
                reject(
                {
                    statusCode: -2,
                    message: "HTTPS Catch: " + err.message
                } );
            }
        } );
    }

    async onPoll()
    {
		var nextInterval = this.homey.app.pollInterval * 1000;
		if (nextInterval < 1000)
		{
			nextInterval = 5000;
		}

		let showInterval = false;

		if (!this.gettingDevices)
        {
            this.timerProcessing = true;
            this.updateLog( "!!!!!! Polling started" );
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
							try
							{
	                            await device.getDeviceValues();
							}
							catch (err)
							{
								this.updateLog( "Error getting device values: " + this.varToString( err.message ), true );
								if (err.statusCode === 429)
								{
									// Too many requests so slow down the polling
									this.fetchPause += 100;
									nextInterval = 60000;
									showInterval = true;
									break;
								}
							}

							if (this.fetchPause > 0)
							{
								await this.asyncDelay(this.fetchPause)
							}
                        }
                    }
                }

                this.updateLog( "!!!!!! Polling finished" );
            }
            catch ( err )
            {
				if (err.statusCode === 429)
				{
					// Too many requests so slow down the polling
					this.fetchPause += 100;
					nextInterval = 60000;
					showInterval = true;
				}
				this.updateLog("Polling Error: " + this.varToString(err.message), true );
            }
        }

		this.updateLog(`Next Interval = ${nextInterval}, delay = ${this.fetchPause}`, showInterval );
        this.timerID = this.homey.setTimeout( this.onPoll, nextInterval );
        this.timerProcessing = false;
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

    updateLog( newMessage, error = false )
    {
		if (error || this.homey.app.logEnabled)
        {
			const nowTime = new Date(Date.now());

			this.diagLog += "\r\n* ";
			this.diagLog += (nowTime.getHours());
			this.diagLog += ":";
			this.diagLog += nowTime.getMinutes();
			this.diagLog += ":";
			this.diagLog += nowTime.getSeconds();
			this.diagLog += ".";
			let milliSeconds = nowTime.getMilliseconds().toString();
			if (milliSeconds.length == 2)
			{
				this.diagLog += '0';
			}
			else if (milliSeconds.length == 1)
			{
				this.diagLog += '00';
			}
			this.diagLog += milliSeconds;
			this.diagLog += ": ";
			this.diagLog += "\r\n";

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

    async sendLog( logType, email, description )
    {
        let tries = 5;
        this.log( 'Send Log' );
        while ( tries-- > 0 )
        {
            try
            {
                let subject = '';
                let text = `${email}\n${description}\n\n-------------------------------------------------------\n\n`;
                if ( logType === 'infoLog' )
                {
                    subject = `SmartThings Information log`;
                    text += this.varToString( this.diagLog );
                }
                else if ( logType === 'deviceLog' )
                {
                    subject = 'SmartThings device log';
                    text += this.varToString( this.detectedDevices );
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
                }, );

                // send mail with defined transport object
                const response = await transporter.sendMail(
                {
                    from: `"Homey User" <${Homey.env.MAIL_USER}>`, // sender address
                    to: Homey.env.MAIL_RECIPIENT, // list of receivers
                    subject, // Subject line
                    text, // plain text body
                }, );

                return {
                    error: response.err,
                    message: response.err ? null : 'OK',
                };
            }
            catch ( err )
            {
				this.updateLog('Send log error', this.varToString(err) );
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