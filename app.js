const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const jwtSecret = 'nodejs';
const bcryptSecret = 'password';

function newJWT(username) {
  return jwt.sign({ username: username }, jwtSecret, { expiresIn: '24h' });
};

function verifyJWT(token) {
  let verifiedToken;
  if (token == null) {
    return false;
  }
  try {
    verifiedToken = jwt.verify(token, jwtSecret);
    return verifiedToken;
  } catch (err) {
    console.log(err);
    return false;
  }
};

let webGetLogin = function (req, res) {
  console.log('\n/login GET');
  res.sendFile(__dirname + '/public/html/login.html');
};

let webGetSignup = function (req, res) {
  console.log('\n/signup GET');
  res.sendFile(__dirname + '/public/html/signup.html');
};

let webGetSignout = function (req, res) {
  console.log('\n/signout GET');
  res.sendFile(__dirname + '/public/html/signout.html');
};

let webGetIndex = function (req, res) {
  console.log('\n/index GET');
  res.sendFile(__dirname + '/public/html/index.html');
};

let webPostLogin = function (req, res) {
  console.log('\n/login POST');

  let db = new sqlite3.Database('note.db');
  let username = req.body.username;
  let password = req.body.password;  
  console.log('username: ' + username);
  console.log('password: ' + password);

  db.get(`SELECT pswd FROM user_acc WHERE usrn="${username}"`, function(err, row) {
    // Check if username exists
    if (row != undefined) {
      console.log('Username found');
      let hash = row.pswd;
      console.log('hash: ' + hash);
      compareRes = bcrypt.compareSync(password, hash);
      console.log(compareRes);
      if (compareRes == true) {
        console.log('Username verified');
        token = newJWT(username);
        console.log('token: ' + token);
        response = {result: true, token};
        res.json(response);
      } else {
        res.json({result: false, reason: 'wrongPassword'});
      }
    } else {
      res.json({result: false, reason: 'usernameNotFound'});
    }
  });
};

let webGetCreate = function (req, res) {
    console.log('\n/create GET');
    res.sendFile(__dirname + '/public/html/create.html');
};

let webGetRead = function (req, res) {
  console.log('\n/read GET');
  res.sendFile(__dirname + '/public//html/read.html');
};

let webGetEdit = function (req, res) {
  console.log('\n/edit/:id GET');
  let id = req.params.id;
  res.sendFile(__dirname + '/public/html/edit.html');
};

let apiPostSignup = function (req, res) {
  console.log('\n/api/signup POST');
  console.log(req.body);

  let db = new sqlite3.Database('note.db');
  let username = req.body.username;
  let password = req.body.password;
  let hash = bcrypt.hashSync(password, 5);  
  let datetime = Date.now();

  console.log(username);
  console.log(datetime);

  // Check empty username
  if (username == undefined) {
    console.log('Username is empty');
    res.json({result: false, reason: 'emptyUsername'});
  }
  // Check empty password
  if (password == undefined) {
    console.log('Password is empty');
    res.json({result: false, reason: 'emptyPassword'});
  }

  db.get(`SELECT usrn FROM user_acc WHERE usrn="${username}"`,
  function(err, row) {
    // Check if username is already used
    if (row != undefined) {
      console.log('Username already exists');
      res.json({result: false, reason: 'usernameExists'});
    }
    // Otherwise, create a new account
    db.run(`INSERT INTO user_acc(usrn, pswd, creation, lastupdated) VALUES 
    ("${username}", "${hash}", "${datetime}", "${datetime}")`, function (err) {
      console.log('Username created');
      res.json({result: true});
    });
  });
};

let apiPostCreate = function (req, res) {
  function note_tag_link(db, noteId, tagId) {
    db.run(`INSERT INTO notes_tags(notes_id, tags_id) VALUES (?, ?)`,
      [noteId, tagId], function (err) {
        if (err) { console.error(err.message); }
        console.log('tagId ' + tagId + ' added to noteId ' + noteId);
      });
  }

  console.log('\n/api/create POST');  

  let content = req.body.content;
  let tagsString = req.body.tags;  
  let token = req.body.token;
  let datetime = Date.now();
  
  if (token == null) {
    console.log('Token needed');
    res.json({result: false, status: 'Token needed'});
  }
  else {
    username = verifyJWT(token);
    if (username == false) {
      console.log('No username found');
      res.redirect('/login');
    }
    else {
      console.log('Token verified');
      console.log('username: ' + username.username);
  
      let db = new sqlite3.Database('note.db');
    
      // Searching for user with this username
      db.get(`SELECT id FROM user_acc WHERE usrn = "${username.username}"`,
      function (err, row) {
        if (row == undefined) {
          console.log('No user found');
          res.redirect('/login');
        }
        else {
          console.log('User found');
          let user_acc_id = row.id;
          console.log(user_acc_id);
          let tags = tagsString.split(','); //new RegExp("/ *[,.;] *")
      
          // Inserting note into DB
          db.run(`INSERT INTO notes(user_id, content, creation, lastupdated)
          VALUES ("${user_acc_id}", "${content}", "${datetime}", "${datetime}")`,
          function (err) {
            if (err) {
              console.error(err.message);
            }
            let noteId = this.lastID;
            console.log('noteId: ' + noteId);
        
            if (noteId != null) {
              console.log('Note created');
              console.log('Adding tags');
              for (i in tags) {
                tag = tags[i];
                console.log('tag: ' + tag);
  
                db.all(`SELECT * FROM tags WHERE tag = ?`, [tag],
                function (err, rows) {
                  if (err) {
                    console.error(err.message);
                  }
  
                  if (rows.length == 0) {
                    db.run(`INSERT INTO tags(tag) VALUES (?)`, [tag],
                    function (err) {
                      if (err) { console.error(err.message); }
                      console.log('tag ' + tag + ' created');
                      note_tag_link(db, noteId, this.lastID);
                    });
                  }
                  else {
                    console.log('tag ' + tag + ' already exists');
                    note_tag_link(db, noteId, rows[0].id);
                  }
                });
              }
            }
            res.json({result: true});
          });
        }      
      });
    }
  }
};

let apiPostRead = function (req, res) {
  console.log('\n/api/read POST');

  let db = new sqlite3.Database('note.db');
  let id = req.body.id;
  let token = req.body.token;

  if (token == null) {
    console.log('Token not found');
    username = null;
  }
  else {
    username = verifyJWT(token);
  }
  if (username == false) {
    console.log('No username found');
    res.redirect('/login');
  }
  else {
    db.get(`SELECT id FROM user_acc WHERE usrn = "${username.username}"`,
    function (err, row) {
      if (row == undefined) {
        console.log('No user found');
        res.json({result: false, status: 'userNotFound'});
      }
      else {
        let userid = row.id;
        console.log('id: ' + id);
        console.log('token:' + token);
        console.log('username: ' + username.username);
        console.log('userid: ' + userid);
    
        if (id === undefined) {
          db.all(`SELECT notes.id, notes.content, notes.lastupdated, tags.tag
          FROM notes LEFT JOIN notes_tags ON notes.id = notes_tags.notes_id
          LEFT JOIN tags ON notes_tags.tags_id = tags.id WHERE notes.user_id = 
          ${userid} ORDER BY notes.id`, function (err, rows) {
            console.log(rows);
            let init = null;
            let noteList = [];
            let note;
            for (let i = 0; i < rows.length; i++) {
              if (init == null) {
                init = rows[i].id;
                note = {
                  id: rows[i].id,
                  tags: [rows[i].tag],
                  content: rows[i].content,
                  lastupdated: rows[i].lastupdated,              
                };
              }
              else if (init == rows[i].id) {
                note.tags.push(rows[i].tag);
              }
              else {
                init = null;
                noteList.push(note);
                i--;
              }
            }
            noteList.push(note);
            console.log(noteList);
            res.send(noteList);
          });
        }
        else {
          db.all(`SELECT notes.id, notes.content, notes.lastupdated, tags.tag
          FROM notes LEFT JOIN notes_tags ON notes.id = notes_tags.notes_id
          LEFT JOIN tags ON notes_tags.tags_id = tags.id WHERE notes.id = ?`,
          [id], function (err, rows) {
            console.log(rows);
            let note = {
              id: rows[0].id,
              content: rows[0].content,
              lastupdated: rows[0].lastupdated,
              tags: [],
            };
            for (let i = 0; i < rows.length; i++) {
              note.tags.push(rows[i].tag);
            }
            res.send(note);
          });
        }
      }
    });
  }  
};

let apiPostEdit = function (req, res) {
  console.log('\n/api/edit POST');

  console.log(req.body);

  let db = new sqlite3.Database('note.db');
  let id = req.body.id;
  let content = req.body.content;
  let tags = req.body.tags;
  let newTags = tags.split(',');
  console.log('tags: ' + tags);
  console.log('newTags: ' + newTags);

  db.all(`SELECT tags.id, tags.tag FROM notes_tags LEFT JOIN tags
    ON notes_tags.tags_id = tags.id WHERE notes_tags.notes_id = ?`, [id],
    function (err, rows) {
      oldTags = [];
      for (let i = 0; i < rows.length; i++) {
        oldTags.push(rows[i].tag);
      }
      console.log('oldTags: ' + oldTags);
      for (let i = 0; i < newTags.length; i++) {
        if (newTags[i] != null && newTags[i] != '' && oldTags.indexOf(newTags[i]) == -1) {
          console.log('insert -> ' + newTags[i]);
          db.run(`INSERT INTO tags(tag) VALUES (?)`, [newTags[i]],
            function (err) {
              newTagId = this.lastID;
              db.run(`INSERT INTO notes_tags(notes_id, tags_id)
                    VALUES (?, ?)`, [id, newTagId]);
            })
        }
      }
      for (let i = 0; i < oldTags.length; i++) {
        if (newTags.indexOf(oldTags[i]) == -1) {
          console.log('remove -> ' + oldTags[i]);
          db.run(`DELETE FROM notes_tags WHERE notes_id = ? 
                AND tags_id = ?`, [id, oldTags[i]]);
        }
      }
    })
  db.run(`UPDATE notes SET content = ? WHERE id = ?`, [content, id]);

  if (req.body.red = true) {
    res.redirect('/read');
  }
  else {
    res.json({status: 'Ok'});
  }
};

let apiGetDelete = function (req, res) {
  console.log('\n/api/delete GET');
  console.log(req.body);

  let db = new sqlite3.Database('note.db');
  let id = req.params.id;

  db.run(`DELETE FROM notes WHERE id = ?`, [id], function (err) {
    db.run(`DELETE FROM notes_tags WHERE notes_id = ?`, [id],
      function (err) {
        res.redirect('/read');
      });
  });
};

let app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', webGetIndex);
app.get('/login', webGetLogin);
app.post('/login', webPostLogin);
app.get('/signup', webGetSignup);
app.get('/signout', webGetSignout);
app.get('/create', webGetCreate);
app.get('/read', webGetRead);
app.get('/edit/:id', webGetEdit);

app.post('/api/signup', apiPostSignup);
app.post('/api/create', apiPostCreate);
app.post('/api/read', apiPostRead);
app.post('/api/edit', apiPostEdit);
app.get('/api/delete/:id', apiGetDelete);

app.listen(8000, function () {
  console.log('Ready');
});