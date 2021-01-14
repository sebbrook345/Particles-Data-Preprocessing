# Particles-Data-Preprocessing

Dieses Modul verarbeitet die Sensor-Daten.
Es erwartet Daten von AndroSensor und es findet keine initiale Validierung der AndroSensor-Daten statt, d.h. AndroSensor muss den folgenden Einstellungen folgen:
* Linear Accelerometer (an)
* alles andere ausgeschaltet

## Usage

`node index.js --input [array of input files] --output output-folder --quantiles [array of quantiles, e.g. 0.9, 0.95...]`
