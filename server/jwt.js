const jsonwebtoken = require('jsonwebtoken');
const {
  Client
} = require('pg');

// JWT Creation
exports.newJWT = function (username, secret) {
  if (username == null || secret == null) {
    console.log('Internal error: no username or secret');
    return false;
  }
  /*
  return jsonwebtoken.sign({
    username: username
  }, secret, {
    expiresIn: '24h'
  });
  */
 return jsonwebtoken.sign({
  username: username
}, secret);
}

// JWT Verification
exports.verifyJWT = function (token, secret) {
  console.log('Function: verifyJWT');
  if (token == null) {
    console.log('Request Error: Token is null');
    return false;
  }
  if (secret == null) {
    console.log('Internal Error: Secret is null');
    return false;
  }
  try {
    return jsonwebtoken.verify(token, secret).username;
  } catch (err) {
    console.log('Request Error: Json Web Token received is invalid');
    return false;
  }
}

// Authentication middleware
exports.auth = function (req, res, next) {
  console.log('Middleware: jwt.auth');
  if (!req.headers['authorization']) {
    console.log('Error: Empty auth header');
    res.sendStatus(401);
    return;
  }

  let username = exports.verifyJWT(req.headers['authorization'].split(' ')[1], 'nodejs');
  if (!username) {
    console.log('Error: JWT Verification failed');
    res.sendStatus(401);
    return;
  }
  
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'notekeeper',
    password: 'postgres',
    port: 5432,
  });
  client.connect();
  client.query('SELECT id FROM user_acc WHERE usrn = $1', [username], function (err, queryRes) {
    res.locals.username = username;
    res.locals.user_id = queryRes.rows[0].id;
    next();
  });
}