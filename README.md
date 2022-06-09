# openmrv-server
![diagram](assets/diagram.png)
### Requirements 
- [MongoDB](https://docs.mongodb.com/manual/installation/) (local test instance)
- [MongoDB Atlas](https://www.mongodb.com/basics/mongodb-atlas-tutorial) (production)
### Nice to have 
- [MongoDB Compass](https://www.mongodb.com/products/compass)

# Project setup
## logger init:
```sh
sudo mkdir /var/log/openmrv-server
sudo chown -R $USER.$USER /var/log/openmrv-server
```
## .env:
```sh
cp .env.sample .env
# provide appropriate values in .env
```
## load base test data:
```sh
npm i
npm run testbasedata
```
## run tests:
```sh
npm i
npm run test
```

### Load sample data
- [Kaggle weather sample](https://www.kaggle.com/datasets/rober2598/madrid-weather-dataset-by-hours-20192022)

```sh
# imports first 744 rows of sample to localhost/test
mongoimport --uri mongodb://localhost:27017/test --file data/sample/weather_madrid_2019-2022.csv --type csv --collection sample_weather_source --headerline --drop

# transforms to timeseries collection
mongosh mongodb://localhost:27017/test -f scripts/init_database.js
mongosh mongodb://localhost:27017/test -f scripts/load_database.js
```
