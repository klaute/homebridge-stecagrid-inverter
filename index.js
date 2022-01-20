"use strict";
/*
    run script in strict mode; i.e. not allowing
    - use of undeclared var
    - deleting var or obj
    - deleting function
    - etc....

    I think most other languages just don't allow it.
    JS without strict mode seems just too flexible.
*/

// declare variables for easy access to often-used long-named variables
let Service, Characteristic;
const http = require('http');   // HTTP POST / GET method.
const { SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION } = require('constants');

module.exports = function (homebridge) {
    /*
        API.registerAccessory(PluginIdentifier,
            AccessoryName, AccessoryPluginConstructor)
    */

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-stecagrid-inverter', 'StecaGrid_inverter_power', power);
};

/* 
    AccessoryPlugin = new constructor(logger,
        accessoryConfig, this.api);

    Excerpted from Homebridge server code
    This is called for each accessory definition in
    homebridge's config file
*/

function power(log, config, api) {
    this.log = log;
    this.config = config;
    this.homebridge = api;
    this.power = 0;

    if (this.config.powermax)
        this.powermax = this.config.powermax;
    else
        this.powermax = 1000; // default 1000 watt

    if (this.config.hostname)
        this.hostname = this.config.hostname;
    else
        this.hostname = "127.0.0.1";

    if (this.config.port)
        this.port = this.config.port;
    else
        this.port = "80";

    if (this.config.refreshInterval)
        this.refreshInterval = this.config.refreshInterval;
    else
        this.refreshInterval = 1000; // time as ms

    // polling
    this.timer = setTimeout(this.poll.bind(this), this.refreshInterval);
};

power.prototype = {
    getServices: function() {
        const infoService =  new Service.AccessoryInformation();
        infoService.setCharacteristic(Characteristic.Manufacturer, 'StecaGrid inverter')
        return [infoService];
    },    
    getPower: function(callback) {
        this.log('getPower');
	var HTMLParser = require('node-html-parser');

        // read stecaGrid inverter power info
        let req = http.get('http://' + this.hostname + ':' + this.port + '/gen.measurements.table.js', res => {
            let recv_data = '';
            res.on('data', chunk => { recv_data += chunk});
            res.on('end', () => {
                // recv_data contains power info.
                let parsed_data = HTMLParser.parse(recv_data);
		this.log(parsed_data.structure)
		let pwr = parsed_data.querySelector("P AC"); // TODO  read out the correct data
                this.log('Read from StecaGrid inverter; power: ' + pwr);
                this.pwd = pwr;

                callback(null, this.pwr > 0);
            });
        });
        req.on('error', err => {
            this.log("Error in getPower: "+ err.message);
            callback(err);
        })
    },
    updateUI: function () {
        setTimeout( () => {
            this.bulb.getCharacteristic(Characteristic.Power).updateValue(this.power);
            this.bulb.getCharacteristic(Characteristic.On).updateValue(this.power>0);
        }, 100);
    },
    poll: function() {
        if(this.timer) clearTimeout(this.timer);
        this.timer = null;

        // volume update from Sonos
        this.getPower( (err, poweron) => {  //this.power updated.
            // update UI
            this.updateUI();
        });

        this.timer = setTimeout(this.poll.bind(this), this.refreshInterval)
    }
}