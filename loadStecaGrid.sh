#!/bin/bash

cd /tmp

wget -q http://192.168.0.80/gen.measurements.table.js

cat gen.measurements.table.js | sed -e "s/<\/tr>/\n/g" | grep "P AC<" | sed -e "s/<tr><td>/{{\"/g" | sed -e "s/<\/td><td .*> /\": /g" | sed -e s"/<\/td><td>/ }, {\"unit\":\"/g" | sed -e "s/<\/td>/\"}/g" | sed -e "s/}<td align='right'>/:/g" | sed -e "s/$/}/g"

rm gen.measurements.table.js

