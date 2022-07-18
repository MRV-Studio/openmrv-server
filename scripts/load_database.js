// presort for load speed
var { nanoid } = require("nanoid");
var myCursor = db.sample_weather_source.find().sort ( { time : 1 } );
while (myCursor.hasNext()) {
   var doc = myCursor.next();
   db.weather.insertOne({ "_id": nanoid(), "ts": ISODate(doc.time), "metadata": { "station": "Moratalaz", "region": "Madrid" },
   "location": { "type": "Point", "coordinates": [-3.7025600, 40.4165000] }, 
    "temperature": doc.temperature, "humidity": doc.humidity, "pressure": doc.barometric_pressure,
     "wind_speed": doc.wind_speed, "wind_direction": doc.wind_direction, "precipitation": doc.precipitation,
   "solar_radiation": doc.solar_radiation });

   printjson(doc);
}
db.weather.createIndex( { location : "2dsphere" } )
