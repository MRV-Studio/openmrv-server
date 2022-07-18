db.weather.drop();

db.createCollection("weather", {
    // timeseries: {
    //     timeField: "ts",
    //     metaField: "metadata",
    //     granularity: "hours"
    // }
});

db.weather.createIndex({ "metadata": 1, "ts": 1 });