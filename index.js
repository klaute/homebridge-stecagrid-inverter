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
    homebridge.registerAccessory('homebridge-stecagrid-inverter', 'StecaGrid_Inverter', power);
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
    this.percent = 0;

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

    this.bulb = new Service.Lightbulb(this.config.name);

    // Set up Event Handler for bulb on/off
    this.bulb.getCharacteristic(Characteristic.On)
        .on("get", this.getPower.bind(this))
        .on("set", this.setPower.bind(this));

    this.bulb.getCharacteristic(Characteristic.Brightness)
        .on("get", this.getPercent.bind(this))
        .on("set", this.setPercent.bind(this));

    // polling
    this.timer = setTimeout(this.poll.bind(this), this.refreshInterval);
};

power.prototype = {
    getServices: function() {
        if (!this.bulb) return [];
        const infoService =  new Service.AccessoryInformation();

        infoService.setCharacteristic(Characteristic.Manufacturer, 'klaute')

        return [infoService, this.bulb];
    },

    getPercent: function (callback) {
        this.log('getPercent');

        // callback with percent read in getPercent
        callback(null,this.percent);
    },

    setPercent: function(percent, callback) {

        if (percent==100) {
            callback(null);
            return;
        }

        this.log('setPercent ' + percent);

        // drop the new value
        //this.percent = percent;
        this.triggeredby = 'slider';

        this.updateUI();

        callback(null);
    },

    getPower: function(callback) {
        this.log('getPower');
        var HTMLParser = require('node-html-parser');

        // read stecaGrid inverter power info
        let req = http.get('http://' + this.hostname + ':' + this.port + '/gen.measurements.table.js', res => {
            let recv_data = '';
            res.on('data', chunk => { recv_data += chunk});
            res.on('end', () => {
                // recv_data contains power info
                let parsed_data = HTMLParser.parse(recv_data);
                let tmp_pwr = (HTMLParser.parse(parsed_data.getElementsByTagName('td')[41])).text.trim();
                if (tmp_pwr == "---")
                {
                    tmp_pwr = "0"; // no power is gained
                }

                // DEBUG parameter tmp_pwr = "1001.7";

                let pwr = parseFloat(tmp_pwr);

                this.power = pwr;

                // convert it to percentual value to fit into Brightness characteristic of the bulb
                this.percent = Math.round(this.power * 100 / this.powermax);

                this.updateUI();

                this.log('Read data from StecaGrid inverter; power: ' + pwr + "W = " + this.percent + "% of powermax = " + this.powermax + "W");

                callback(null, this.power > 0);
            });
        });

    },

    setPower: function(on, callback) {

        if (this.triggeredby=='slider') {
            this.log('setPower triggered by slider')
            delete this.triggeredby;
        }
        this.log('setPower ' + on);

        this.updateUI();

        callback(null);
    },

    updateUI: function () {
        setTimeout( () => {
            this.bulb.getCharacteristic(Characteristic.Brightness).updateValue(this.percent);
            this.bulb.getCharacteristic(Characteristic.On).updateValue(this.power>0);
        }, 100);
    },

    poll: function() {
        if(this.timer) clearTimeout(this.timer);
        this.timer = null;

        // power value update from stecagrid
        this.getPower( (err, poweron) => {  //this.power updated.
            // update UI
            this.updateUI();
        });

        this.timer = setTimeout(this.poll.bind(this), this.refreshInterval)
    }
}
