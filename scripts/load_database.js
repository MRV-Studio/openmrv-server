// presort for load speed
var myCursor = db.sample_weather_source.find().sort ( { time : 1 } );
while (myCursor.hasNext()) {
   var doc = myCursor.next();
   db.weather.insertOne({ "ts": doc.time, "metadata": { "station": "Moratalaz", "region": "Madrid" },
    "temperature": doc.temperature, "humidity": doc.humidity, "pressure": doc.barometric_pressure,
     "wind_speed": doc.wind_speed, "wind_direction": doc.wind_direction, "precipitation": doc.precipitation,
   "solar_radiation": doc.solar_radiation });

   printjson(doc);
}