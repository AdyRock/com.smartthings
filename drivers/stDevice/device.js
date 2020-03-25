'use strict';

const Homey = require('homey');

class STDevice extends Homey.Device {

	onInit() {
		this.log('STDevice has been inited');
		this.deviceOn = true;
		this.remoteControlEnabled = false;
		this.washerSpinLevel = '1400';
		this.washerWaterTemperature = '40';
		this.machineState = "stop";
		this.presence = "";

		this.flowTrigger_WasherStatus = new Homey.FlowCardTriggerDevice('washer_status_changed');
		this.flowTrigger_WasherStatus
			.register()
			.registerRunListener((args, state) => {
				console.log(args);
				console.log(state);
				// If true, this flow should run
				return Promise.resolve(args.washer_status === state.washer_status);
			});

		this.flowTrigger_PresenceStatus = new Homey.FlowCardTriggerDevice('presenceStatus_changed');
		this.flowTrigger_PresenceStatus
			.register();

		// register a capability listeners
		if (this.hasCapability('onoff')) {
			this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
		}

		if (this.hasCapability('dim')) {
			this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
		}

		if (this.hasCapability('rinse_cycles')) {
			this.registerCapabilityListener('rinse_cycles', this.onCapabilityRinseCycles.bind(this));
		}

		if (this.hasCapability('spin_level')) {
			this.registerCapabilityListener('spin_level', this.onCapabilitySpinLevel.bind(this));
		}

		if (this.hasCapability('washer_status')) {
			this.registerCapabilityListener('washer_status', this.onCapabilityWasherStatus.bind(this));
		}

		if (this.hasCapability('water_temperature')) {
			this.registerCapabilityListener('water_temperature', this.onCapabilityWasherWaterTemperature.bind(this));
		}

		if (this.hasCapability('onoff')) {
			this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
		}

		if (this.hasCapability('volume_set')) {
			this.registerCapabilityListener('volume_set', this.onCapabilityVolume.bind(this));
		}

		if (this.hasCapability('volume_down')) {
			this.registerCapabilityListener('volume_down', this.onCapabilityVolumeDown.bind(this));
		}

		if (this.hasCapability('volume_up')) {
			this.registerCapabilityListener('volume_down', this.onCapabilityVolumeUp.bind(this));
		}

		if (this.hasCapability('volume_mute')) {
			this.registerCapabilityListener('volume_mute', this.onCapabilityVolumeMute.bind(this));
		}

		if (this.hasCapability('channel_down')) {
			this.registerCapabilityListener('channel_down', this.onCapabilityChannelDown.bind(this));
		}

		if (this.hasCapability('channel_up')) {
			this.registerCapabilityListener('channel_up', this.onCapabilityChannelUp.bind(this));
		}

		this.getDeviceValues();
	}

	async onAdded() {
		// Try to select the best class based on the capabilities that have been found
		if (this.hasCapability('dim')) {
			this.setClass('light');
		} else if (this.hasCapability('contactSensor')) {
			this.setClass('sensor');
		} else if (this.hasCapability('channel_down')) {
			this.setClass('TV');
		} else if (this.hasCapability('onoff') && !this.hasCapability('washer_mode')) {
			this.setClass('socket');
		}
	}

	async getDeviceValues() {
		try {
			const devData = this.getData();


			// Retrieve all the devices values
			let result = await Homey.app.getAllDeviceCapabilitiesValues(devData.id);
			this.setAvailable();

			var components = result['components'];


			if (this.hasCapability('dim')) {
				this.setCapabilityValue('dim', components.main.switchLevel.level.value / 100);
			}

			if (this.hasCapability('volume_set')) {
				this.setCapabilityValue('volume_set', components.main.audioVolume.volume.value / 100);
			}

			if (this.hasCapability('volume_mute')) {
				this.setCapabilityValue('volume_mute', components.main.audioMute.mute.value === 'muted');
			}

			if (this.hasCapability('alarm_contact')) {
				this.setCapabilityValue('alarm_contact', components.main.contactSensor.contact.value === 'open');
			}

			if (this.hasCapability('measure_battery')) {
				this.setCapabilityValue('measure_battery', components.main.battery.battery.value);
			}

			if (this.hasCapability('measure_power')) {
				this.setCapabilityValue('measure_power', components.main.powerConsumptionReport.powerConsumption.value.power);
				this.setCapabilityValue('meter_power.delta', components.main.powerConsumptionReport.powerConsumption.value.deltaEnergy);
				this.setCapabilityValue('meter_power', components.main.powerConsumptionReport.powerConsumption.value.energy / 1000);
			}

			// To reduce idle work only check washer capabilities if it is switched on
			if (this.deviceOn && this.hasCapability('washer_mode')) {
				// Get the device washer mode state
				this.setCapabilityValue('washer_mode', components.main.washerMode.washerMode.value);

				// Check for other washer capabilities
				if (this.hasCapability('washer_status')) {
					// Get the device washer mode state
					this.setCapabilityValue('washer_status', components.main.washerOperatingState.machineState.value);
					// Check if the trigger needs to be fired
					if (this.machineState != components.main.washerOperatingState.machineState.value) {
						this.machineState = components.main.washerOperatingState.machineState.value;

						let state = {
							'washer_status': this.machineState
						}

						this.flowTrigger_WasherStatus
							.trigger(this, {}, state)
							.catch(this.error)
					}

					this.setCapabilityValue('washer_job_status', components.main.washerOperatingState.washerJobState.value);

					let value = components.main.washerOperatingState.completionTime.value;
					if (value.length > 5) {
						value = value.substr(0, value.length - 5);
						// make an array of date, time so they can be reversed then if the text does not fit at least the time is displayed
						let dateTime = value.split("T");
						this.setCapabilityValue('completion_time', dateTime[1] + " " + dateTime[0]);
					}
				}

				if (this.hasCapability('water_temperature')) {
					this.washerWaterTemperature = components.main['custom.washerWaterTemperature'].washerWaterTemperature.value;
					this.setCapabilityValue('water_temperature', this.washerWaterTemperature);
				}

				if (this.hasCapability('remote_status')) {
					this.remoteControlEnabled = (components.main.remoteControlStatus.remoteControlEnabled.value === 'true');
					this.setCapabilityValue('remote_status', this.remoteControlEnabled);
					if (this.remoteControlEnabled) {
						this.setWarning(null, null);
					}
				}

				if (this.hasCapability('spin_level')) {
					this.washerSpinLevel = components.main['custom.washerSpinLevel'].washerSpinLevel.value;
					this.setCapabilityValue('spin_level', this.washerSpinLevel);
				}

				if (this.hasCapability('rinse_cycles')) {
					this.washerRinseCycles = components.main['custom.washerRinseCycles'].washerRinseCycles.value;
					this.setCapabilityValue('rinse_cycles', this.washerRinseCycles);
				}
			}

			if (this.hasCapability('alarm_presence')) {
				this.setCapabilityValue('alarm_presence', components.main.presenceSensor.presence.value === 'present');
				if (this.presence != components.main.presenceSensor.presence.value) {
					this.presence = components.main.presenceSensor.presence.value;

					let tokens = {
						'presence_status': this.presence === 'present'
					}

					this.flowTrigger_PresenceStatus
						.trigger(this, tokens)
						.catch(this.error)
				}
			}

			// Putting onoff at the end ensure that parameters that are not normally updated when it is off get one chance to initialise
			if (this.hasCapability('onoff')) {
				this.deviceOn = (components.main.switch.switch.value == 'on');
				this.setCapabilityValue('onoff', this.deviceOn);
			}

		} catch (err) {
			this.log(err);
		}
	}

	// this method is called when the Homey device has requested a state change (turned on or off)
	async onCapabilityOnoff(value, opts) {
		try {
			// Get the device information stored during pairing
			const devData = this.getData();

			// The device requires 'off' and 'on'
			var data = 'off';
			if (value) {
				data = 'on';
			}

			let body = {
				"commands": [{
					"component": "main",
					"capability": "switch",
					"command": data,
					"arguments": []
				}]
			}

			// Set the switch Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityOnoff Error " + JSON.stringify(err));
		}
	}

	// this method is called when the Homey device has requested a dim level change ( 0 to 1)
	async onCapabilityDim(value, opts) {
		try {
			// Homey return a value of 0 to 1 but the real device requires a value of 0 to 100
			value *= 100;

			let body = {
				"commands": [{
					"component": "main",
					"capability": "switchLevel",
					"command": "setLevel",
					"arguments": [
						Math.round(value)
					]
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityOnDimError " + JSON.stringify(err));
		}
	}

	async onCapabilityRinseCycles(value, opts) {
		this.log('onCapabilityRinseCycles: ', value);
		try {
			if (!this.deviceOn || !this.remoteControlEnabled) {
				this.setWarning("Remote control not enabled", null);
				return;
			}

			let body = {
				"commands": [{
					"component": "main",
					"capability": "custom.washerRinseCycles",
					"command": "setWasherRinseCycles",
					"arguments": [
						value
					]
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityRinseCycles " + JSON.stringify(err));
		}
	}

	async onCapabilitySpinLevel(value, opts) {
		this.log('onCapabilitySpinLevel: ', value);
		try {
			if (!this.deviceOn || !this.remoteControlEnabled) {
				this.setWarning("Remote control not enabled", null);
				return;
			}

			let body = {
				"commands": [{
					"component": "main",
					"capability": "custom.washerSpinLevel",
					"command": "setWasherSpinLevel",
					"arguments": [
						value
					]
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilitySpinLevel " + JSON.stringify(err));
		}
	}

	async onCapabilityWasherStatus(value, opts) {
		this.log('onCapabilityWasherStatus: ', value);
		try {
			if (!this.deviceOn || !this.remoteControlEnabled) {
				this.setWarning("Remote control not enabled", null);
				return;
			}

			let body = {
				"commands": [{
					"component": "main",
					"capability": "washerOperatingState",
					"command": "setMachineState",
					"arguments": [
						value
					]
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityWasherStatus " + JSON.stringify(err));
		}
	}

	async onCapabilityWasherWaterTemperature(value, opts) {
		this.log('onCapabilityWasherWaterTemperature: ', value);
		try {
			if (!this.deviceOn || !this.remoteControlEnabled) {
				this.setWarning("Remote control not enabled", null);
				return;
			}

			let body = {
				"commands": [{
					"component": "main",
					"capability": "washerWaterTemperature",
					"command": "setWasherWaterTemperature",
					"arguments": [
						value
					]
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityWasherStatus " + JSON.stringify(err));
		}
	}

	// this method is called when the Homey device has requested a volume level change ( 0 to 1)
	async onCapabilityVolume(value, opts) {
		try {
			// Homey return a value of 0 to 1 but the real device requires a value of 0 to 100
			value *= 100;

			let body = {
				"commands": [{
					"component": "main",
					"capability": "audioVolume",
					"command": "setVolume",
					"arguments": [
						Math.round(value)
					]
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityVolume " + JSON.stringify(err));
		}
	}

	// this method is called when the Homey device has requested the previous channel
	async onCapabilityVolumeDown(value, opts) {
		try {
			let body = {
				"commands": [{
					"component": "main",
					"capability": "audioVolume",
					"command": "volumeDown",
					"arguments": []
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityVolumeDown " + JSON.stringify(err));
		}
	}

	// this method is called when the Homey device has requested the next channel
	async onCapabilityVolumeUp(value, opts) {
		try {
			let body = {
				"commands": [{
					"component": "main",
					"capability": "audioVolume",
					"command": "volumeUp",
					"arguments": []
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityVolumeUp " + JSON.stringify(err));
		}
	}

	// this method is called when the Homey device has requested the volume to be muted
	async onCapabilityVolumeMute(value, opts) {
		try {
			let body = {
				"commands": [{
					"component": "main",
					"capability": "audioMute",
					"command": "setMute",
					"arguments": [
						value ? "muted" : "unmuted"
					]
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityVolumeMute " + JSON.stringify(err));
		}
	}

	// this method is called when the Homey device has requested the previous channel
	async onCapabilityChannelDown(value, opts) {
		try {
			let body = {
				"commands": [{
					"component": "main",
					"capability": "tvChannel",
					"command": "channelDown",
					"arguments": []
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityChannelDown " + JSON.stringify(err));
		}
	}

	// this method is called when the Homey device has requested the next channel
	async onCapabilityChannelUp(value, opts) {
		try {
			let body = {
				"commands": [{
					"component": "main",
					"capability": "tvChannel",
					"command": "channelUp",
					"arguments": []
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setDeviceCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityChannelUp " + JSON.stringify(err));
		}
	}
}

module.exports = STDevice;