var express = require('express');
var app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");

const { Timer } = require('timer-node');
const timer = new Timer({ label: 'test-timer' });

const port = process.env.PORT || 8000;

app.set('view engine', 'ejs');
app.use(express.static("css"));
app.use(express.static("img"));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true}));

app.get("/",  function(req, res){    //Starting Page 
    res.render("welcome");
  });

  app.get("/signUp",  function(req, res){    //Page were you type name/email...etc
    res.render("UserInfo");

  });

app.post('/start', async function(req, res) { // The action of going from signup to home page and saving userinfo to database(DB)
  let user = req.body.name;
  let email = req.body.email;

  let rows = await userInfoAction(req.body);
  let puzzlePercent = await getPuzzlePercent(req.body)

  res.render('home.ejs', {user, email, puzzlePercent });
});

app.post('/startPuzzles', async function(req, res) { // The action of going from home to coin game page 
  let user = req.body.name;
  let email = req.body.email;

  res.render('coin.ejs', {user, email });
});

app.post('/startCoding', async function(req, res) { // The action of going from home to the coding challeges, problemOne page Specifically 
  let user = req.body.name;
  let email = req.body.email;

  res.render('problemOne.ejs', {user, email });
});

app.post('/startQuiz', async function(req, res) { // The action of going from home to multiple choice quiz page 
  let user = req.body.name;
  let email = req.body.email;

  res.render('multipleChoice.ejs', {user, email });
});

app.post("/probOneSubmit", function(req, res){ //the action of submitting coding challenge 1 and goin to problemTwo
  let user = req.body.name;
  let email = req.body.email;

  res.render("probTwo", {user, email });
});

app.post("/coinSubmit", async function(req, res){ //The action of submitting the coin puzzle to the DB and going to the bucket challenge
  let user = req.body.name 
  let email = req.body.email
  console.log(req.body)

  let rows = await coinSubmit(req.body);

  res.render("buckets.ejs", {user, email});
});

app.post("/bucketSubmit", async function(req, res){ //The action of submitting the bucket puzzle to the DB and going back to the home page 
  let user = req.body.name 
  let email = req.body.email
  let puzzleStatus = ""
  console.log(req.body)
  
  let rows = await bucketSubmit(req.body);
  let puzzlePercent = await getPuzzlePercent(req.body)
  console.log(puzzlePercent)


  res.render("home.ejs", {user, email, puzzlePercent});
});

app.post("/gradeMultipleChoice",  function(req, res){ //This is the action of submitting the multiple choice page to the DB and go to some page undetermined
  console.log(req.body)
  let correct = 0;
  if(req.body.question1 == "/* comment */") {
    correct++;
  }
  console.log(correct + " correct answers")


  let user = req.body.name 
  let email = req.body.email
  res.render("home", {user, email})
});


async function getPuzzlePercent(body){ // This function is used to figure out the percentage for the puzzzles on the home page
  let puzzlesDone = await puzzleProgress(body)
  let puzzlePercent = ""

  if(puzzlesDone[0].coinProblem != null && puzzlesDone[0].bucketProblem != null) {
    puzzlePercent = "100%";
  } else if(puzzlesDone[0].coinProblem != null && puzzlesDone[0].bucketProblem == null || puzzlesDone[0].coinProblem == null && puzzlesDone[0].bucketProblem != null) {
    puzzlePercent = "50%"
  } else {
    puzzlePercent = "0%"
  }
  return puzzlePercent


}

function userInfoAction(body){ // This function submits the user info to the DB like name, email, linkedIn....etc
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
          console.log("Connected userInfo!");
       
          let sql = `INSERT INTO userinfo
                       (name, email)
                        VALUES (?,?)`;
       
          let params = [body.name, body.email];
          conn.query(sql, params, function (err, rows, fields) {
             if (err) throw err;
             //res.send(rows);
             conn.end();
             resolve(rows);
          });
       
       });//connect
   });//promise 
}

function coinSubmit(body){ //This function will submit the users answer for the coin problem to the DB
  
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `UPDATE userinfo
                     SET coinProblem =?
                     WHERE name =? AND email=?`;
       
          let params = [body.coinGuess, body.name, body.email];
          conn.query(sql, params, function (err, rows, fields) {
             if (err) throw err;
             //res.send(rows);
             conn.end();
             resolve(rows);
          });
       });//connect
   });//promise 
}

function bucketSubmit(body){ //This function will submit the users answer for the bucket problem to the DB
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `UPDATE userinfo
                     SET bucketProblem =?
                     WHERE name =? AND email=?`;
       
          let params = [body.bucketGuess, body.name, body.email];
          conn.query(sql, params, function (err, rows, fields) {
             if (err) throw err;
             //res.send(rows);
             conn.end();
             resolve(rows);
          });
       });//connect
   });//promise 
}


function puzzleProgress(body){ //This function gets users puzzle answers to help get the percentage done for the home page
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `SELECT coinProblem, bucketProblem
                     FROM userinfo
                     WHERE name =? AND email=?`;
       
          let params = [body.name, body.email];
          conn.query(sql, params, function (err, rows, fields) {
             if (err) throw err;
             //res.send(rows);
             conn.end();
             resolve(rows);
          });
       });//connect
   });//promise 
}


  //This allows us to connect to the database it uses heroku its called JawsDB
function dbConnection(){
  let connection = mysql.createConnection({
      host: 'xlf3ljx3beaucz9x.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
      user: 'h9q8zn8q3hq8it7e',
      password: 'dz7edod4ywrjeea9',
      database: 'wi1mn51lp91tvquw'
    })

    return connection
}


function dbSetup() { // This creates the table to insert data for the DB
  let connection = dbConnection();
  
  connection.connect()
  var createuserinfo = `CREATE TABLE IF NOT EXISTS userinfo
                      (id int NOT NULL AUTO_INCREMENT,
                      name varchar(60) NOT NULL,
                      email varchar(75) NOT NULL,
                      coinProblem SMALLINT,
                      bucketProblem SMALLINT,
                      multipleChoiceCorrect SMALLINT,
                      PRIMARY KEY(id)
                      );`
  connection.query(createuserinfo, function (err, rows, fields) {
      if (err) {
          throw err
      }
  })
  
  
  connection.end()
}
  
dbSetup()

//This lets us connect to the page
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
  });