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
		} else if (this.hasCapability('onoff')) {
			this.setClass('socket');
		} else if (this.hasCapability('contactSensor')) {
			this.setClass('sensor');
		}
	}

	async getDeviceValues() {
		try {
			const devData = this.getData();

			if (this.hasCapability('dim')) {
				// Get the device dim state
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "switchLevel");
				if (result) {
					this.setCapabilityValue('dim', result.level.value / 100);
				}
			}

			if (this.hasCapability('volume_set')) {
				// Get the device dim state
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "audioVolume");
				if (result) {
					this.setCapabilityValue('volume_set', result.volume.value / 100);
				}
			}

			if (this.hasCapability('volume_mute')) {
				// Get the device dim state
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "audioMute");
				if (result) {
					this.setCapabilityValue('volume_mute', result.mute.value === 'muted');
				}
			}

			if (this.hasCapability('alarm_contact')) {
				// Get the device dim state
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "contactSensor");
				if (result) {
					this.setCapabilityValue('alarm_contact', result.contact.value === 'open');
				}
			}

			if (this.hasCapability('measure_battery')) {
				// Get the device dim state
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "battery");
				if (result) {
					this.setCapabilityValue('measure_battery', result.battery.value);
				}
			}

			if (this.hasCapability('measure_power')) {
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "powerConsumptionReport");
				if (result) {
					this.setCapabilityValue('measure_power', result.powerConsumption.value.power);

					this.setCapabilityValue('meter_power.delta', result.powerConsumption.value.deltaEnergy);

					this.setCapabilityValue('meter_power', result.powerConsumption.value.energy / 1000);
				}
			}

			// To reduce idle traffic only check washer capabilities if it is switched on
			if (this.deviceOn && this.hasCapability('washer_mode')) {
				// Get the device washer mode state
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "washerMode");
				if (result) {
					this.setCapabilityValue('washer_mode', result.washerMode.value);
				}

				// Check for other washer capabilities

				if (this.hasCapability('washer_status')) {
					// Get the device washer mode state
					let result = await Homey.app.getDeviceCapabilityValue(devData.id, "washerOperatingState");
					if (result) {
						this.log("washerOperatingState= ", JSON.stringify(result));

						this.setCapabilityValue('washer_status', result.machineState.value);
						if (this.machineState != result.machineState.value) {
							this.machineState = result.machineState.value;
							let tokens = {
								'state': this.machineState
							}

							let washerStatusStartTrigger = new Homey.FlowCardTrigger('washer_status_changed');
							washerStatusStartTrigger
								.register()
								.trigger(tokens)
								.catch(this.error)
								.then(this.log)
						}

						this.setCapabilityValue('washer_job_status', result.washerJobState.value);

						let value = result.completionTime.value;
						value = value.replace("T", " ");
						value = value.substr(0, value.length - 5);
						this.setCapabilityValue('completion_time', value);
					}
				}

				if (this.hasCapability('water_temperature')) {
					let result = await Homey.app.getDeviceCapabilityValue(devData.id, "custom.washerWaterTemperature");
					if (result) {
						this.washerWaterTemperature = result.washerWaterTemperature.value;
						this.setCapabilityValue('water_temperature', this.washerWaterTemperature);
					}
				}

				if (this.hasCapability('remote_status')) {
					let result = await Homey.app.getDeviceCapabilityValue(devData.id, "remoteControlStatus");
					if (result) {
						this.remoteControlEnabled = (result.remoteControlEnabled.value === 'true');
						this.setCapabilityValue('remote_status', this.remoteControlEnabled);
						if (this.remoteControlEnabled) {
							this.setWarning(null, null);
						}
					}
				}

				if (this.hasCapability('alarm_addWash')) {
					let result = await Homey.app.getDeviceCapabilityValue(devData.id, "custom.washerAddwashAlarm");
					if (result) {
						this.setCapabilityValue('alarm_addWash', result.washerAddwashAlarm.value === 'true');
					}
				}

				if (this.hasCapability('spin_level')) {
					let result = await Homey.app.getDeviceCapabilityValue(devData.id, "custom.washerSpinLevel");
					if (result) {
						this.washerSpinLevel = result.washerSpinLevel.value;
						this.setCapabilityValue('spin_level', this.washerSpinLevel);
					}
				}

				if (this.hasCapability('measure_soil_level')) {
					let result = await Homey.app.getDeviceCapabilityValue(devData.id, "custom.washerSoilLevel");
					if (result) {
						this.setCapabilityValue('measure_soil_level', result.washerSoilLevel.value);
					}
				}

				if (this.hasCapability('rinse_cycles')) {
					let result = await Homey.app.getDeviceCapabilityValue(devData.id, "custom.washerRinseCycles");
					if (result) {
						this.washerRinseCycles = result.washerRinseCycles.value;
						this.setCapabilityValue('rinse_cycles', this.washerRinseCycles);
					}
				}
			}

			if (this.hasCapability('alarm_presence')) {
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "presenceSensor");
				if (result) {
					this.setCapabilityValue('alarm_presence', result.presence.value === 'present');
				}
				//await Homey.app.getDeviceCapabilityValue(devData.id, "occupancySensor");
			}

			// Putting onoff at the end ensure that parameters that are not normally updated when it is off get one chance to initialise
			if (this.hasCapability('onoff')) {
				// Get the device on / off state
				let result = await Homey.app.getDeviceCapabilityValue(devData.id, "switch");
				if (result) {
					this.deviceOn = (result.switch.value == 'on');
					this.setCapabilityValue('onoff', this.deviceOn);
				}
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