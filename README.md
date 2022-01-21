<p align="center">
<img alt="Home Bridge logotype" src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">
</p>

# Homebridge Platform StecaGrid Inverters Plugin

This is a plugin for StecaGrid Inverters

1.0.0 - 1.0.4: First version
1.0.5 - 1.0.7: Testing with - power usage
1.1 - null check for current power usage
1.2 - Changed Eve stats from 9 min to 10 min.
1.3 - Fix Eve stats bug
1.4 - Trying to fix Unreachable prolem when inverter goes offline at night.

# Default config

```json
"platforms": [
    {
        "name": "StecaGrid Inverter Energy",
        "ip": "192.168.0.x",
        "port": "80",
        "UpdateTime": 5,
        "MaxProduction": 10000,
        "ViewElectricPowerProduction": false,
        "EveLoging": false,
        "Debug": false,
        "platform": "StecaGridInverterEnergy"
    }
]
```
