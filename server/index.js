const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

/* app:
   object to receive and respond to any http requests
   that are coming or going back to the react application */
const app = express();

/* cors: cross origin sharing : 
   allow us to make to make request from one domain
   (the react application we are running on)
   to another domain or different port in this case, 
    that the express api is host on   */
app.use(cors());

/* bodyParser: 
   parse incoming request from the react application,
   and turn the body of the post request into a json object,
   that our express api can easily work with  */
app.use(bodyParser.json());


const redis = require('redis');

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));
/*
pgClient.connect();
const query = pgClient.query("CREATE TABLE IF NOT EXISTS values(number INT)", (err,res) => {
	console.log('pgClientpgClientpgClientpgClientpgClientpgClientpgClient',err,res);
});
*/

// Redis Client Setup
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();






redisClient.on('connect', function() {
    console.log('Redis client connected');
});
/*
pgClient.query("CREATE TABLE IF NOT EXISTS values(number INT)", (err,res) => {
	console.log(err,res);
});
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)').catch(err => console.log(err));
pool.query('CREATE TABLE IF NOT EXISTS values (number INT)', (err, result) => {
  if (err) {
    return console.error('Error executing query CREATE TABLE values', err.stack)
  }
  console.log('CREATE TABLE values OK') // brianc
});*/



// Express route handlers

app.get('/', (req, res) => {

  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  const xvalues = await pgClient.query("CREATE TABLE IF NOT EXISTS values(number INT)");
  const values = await pgClient.query('SELECT * from values');

  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  console.log('request made to /values url ');
  const index = req.body.index;
  console.log('request made with index: '+index);
  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  //pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)');
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

/*
pgClient.on('connect', () => {
  console.log('connected to the Database');
  pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)');
});
*/


app.listen(5000, err => {
  console.log('Listening');
});
