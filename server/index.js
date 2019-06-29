const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

const redis = require('redis');

app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
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




pgClient.on('error', () => console.log('Lost PG connection'));

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
  //pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
});
