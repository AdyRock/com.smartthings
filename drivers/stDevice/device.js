'use strict';

const Homey = require('homey');

class STDevice extends Homey.Device {

	onInit() {
		this.log('STDevice has been inited');


		// register a capability listeners
		if (this.hasCapability('onoff')) {
			this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
		}

		if (this.hasCapability('dim')) {
			this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
		}

		if (this.hasCapability('washer_mode')) {
			this.registerCapabilityListener('washer_mode', this.onCapabilityWasherMode.bind(this));
		}

		if (this.hasCapability('washer_status')) {
			this.registerCapabilityListener('washer_status', this.onCapabilityWasherStatus.bind(this));
		}

		this.getDeviceValues();
	}

	async onAdded() {
		if (this.hasCapability('dim')) {
			this.setClass('light');
		}
	}

	async getDeviceValues() {
		try {
			const devData = this.getData();

			if (this.hasCapability('onoff')) {
				// Get the device on / off state
				let result = await Homey.app.getCapabilityValue(devData.id, "switch");
				if (result) {
					let value = result.switch.value;
					await this.setCapabilityValue('onoff', value == 'on');
				}
			}
			if (this.hasCapability('dim')) {
				// Get the device dim state
				let result = await Homey.app.getCapabilityValue(devData.id, "switchLevel");
				if (result) {
					let value = result.level.value;
					await this.setCapabilityValue('dim', value / 100);
				}
			}

			if (this.hasCapability('washer_mode')) {
				// Get the device washer mode state
				let result = await Homey.app.getCapabilityValue(devData.id, "washerMode");
				if (result) {
					let value = result.washerMode.value;
					await this.setCapabilityValue('washer_mode', value);
				}
			}

			if (this.hasCapability('washer_status')) {
				// Get the device washer mode state
				let result = await Homey.app.getCapabilityValue(devData.id, "washerOperatingState");
				if (result) {
					this.log("washerOperatingState= ", JSON.stringify(result));

					let value = result.machineState.value;
					await this.setCapabilityValue('washer_status', value);

					value = result.washerJobState.value;
					await this.setCapabilityValue('washer_job_status', value);

					value = result.completionTime.value;
					value = value.replace("T", " ");
					value = value.substr(0, value.length - 5);
					await this.setCapabilityValue('completion_time', value);
				}
			}

			if (this.hasCapability('remote_status')) {
				let result = await Homey.app.getCapabilityValue(devData.id, "remoteControlStatus");
				if (result) {
					let value = result.remoteControlEnabled.value;
					await this.setCapabilityValue('remote_status', value === 'true');
				}
			}

			if (this.hasCapability('measure_power')) {
				let result = await Homey.app.getCapabilityValue(devData.id, "powerConsumptionReport");
				if (result) {
					let value = result.powerConsumption.value.power;
					await this.setCapabilityValue('measure_power', value);
					value = result.powerConsumption.value.energy;
					await this.setCapabilityValue('meter_power', value / 1000);
				}
			}

			if (this.hasCapability('alarm_addWash')) {
				let result = await Homey.app.getCapabilityValue(devData.id, "custom.washerAddwashAlarm");
				if (result) {
					let value = result.washerAddwashAlarm.value;
					await this.setCapabilityValue('alarm_addWash', value === 'true');
				}
			}

			if (this.hasCapability('measure_spin_level')) {
				let result = await Homey.app.getCapabilityValue(devData.id, "custom.washerSpinLevel");
				if (result) {
					let value = result.washerSpinLevel.value;
					await this.setCapabilityValue('measure_spin_level', value);
				}
			}

			if (this.hasCapability('measure_soil_level')) {
				let result = await Homey.app.getCapabilityValue(devData.id, "custom.washerSoilLevel");
				if (result) {
					let value = result.washerSoilLevel.value;
					await this.setCapabilityValue('measure_soil_level', value);
				}
			}

			if (this.hasCapability('measure_rinse_cycles')) {
				let result = await Homey.app.getCapabilityValue(devData.id, "custom.washerRinseCycles");
				if (result) {
					let value = Number(result.washerRinseCycles.value);
					await this.setCapabilityValue('measure_rinse_cycles', value);
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
			await Homey.app.setCapabilityValue(devData.id, body);
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
			await Homey.app.setCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityOnDimError " + JSON.stringify(err));
		}
	}

	async onCapabilityWasherMode(value, opts) {
		this.log('onCapabilityWasherMode: ', value);
		try {
			let body = {
				"commands": [{
					"component": "main",
					"capability": "washerMode",
					"command": "setWasherMode",
					"arguments": [
						value
					]
				}]
			}

			// Get the device information stored during pairing
			const devData = this.getData();

			// Set the dim Value on the device using the unique feature ID stored during pairing
			await Homey.app.setCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityWasherMode " + JSON.stringify(err));
		}
	}

	async onCapabilityWasherStatus(value, opts) {
		this.log('onCapabilityWasherStatus: ', value);
		try {
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
			await Homey.app.setCapabilityValue(devData.id, body);
		} catch (err) {
			//this.setUnavailable();
			Homey.app.updateLog(this.getName() + " onCapabilityWasherStatus " + JSON.stringify(err));
		}
	}
}

module.exports = STDevice;