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
    let message = ""
    res.render("UserInfo", {message});

  });

app.post('/start', async function(req, res) { // The action of going from signup to home page and saving userinfo to database(DB)
  let user = req.body.name;
  let email = req.body.email;

  if(user.length == 0 || email.length == 0) {
    let message = "One of the required fields was left empty"
    res.render("UserInfo", {message});

  }

  let rows = await userInfoAction(req.body);
  let puzzlePercent = await getPuzzlePercent(req.body)
  let quizPercent = await getQuizPercent(req.body)
  let score = await calculateScore(req.body);
  let codePercent = await getCodePercent(req.body)

  res.render('home.ejs', {user, email, puzzlePercent, quizPercent , score, codePercent});
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

app.post("/probOneSubmit", async function(req, res){ //the action of submitting coding challenge 1 and goin to problemTwo
  let user = req.body.name;
  let email = req.body.email;

  let rows = await submitProbOne(req.body)
  let score = await calculateScore(req.body);


  res.render("problemTwo", {user, email });
});

app.post("/probTwoSubmit", async function(req, res){ //the action of submitting coding challenge 2 and goin to home
  let user = req.body.name;
  let email = req.body.email;

  let puzzlePercent = await getPuzzlePercent(req.body)
  let quizPercent = await getQuizPercent(req.body)
  let score =  await calculateScore(req.body);
  let codePercent = await getCodePercent(req.body)

  res.render("home.ejs", {user, email, puzzlePercent, quizPercent, score, codePercent});
});

app.post("/coinSubmit", async function(req, res){ //The action of submitting the coin puzzle to the DB and going to the bucket challenge
  let user = req.body.name 
  let email = req.body.email
  console.log(req.body)

  let rows = await coinSubmit(req.body);
  let score = await calculateScore(req.body);

  res.render("buckets.ejs", {user, email});
});

app.post("/bucketSubmit", async function(req, res){ //The action of submitting the bucket puzzle to the DB and going back to the home page 
  let user = req.body.name 
  let email = req.body.email
  
  let rows = await bucketSubmit(req.body);
  let puzzlePercent = await getPuzzlePercent(req.body)
  let quizPercent = await getQuizPercent(req.body)
  let score =  await calculateScore(req.body);
  let codePercent = await getCodePercent(req.body)

  res.render("home.ejs", {user, email, puzzlePercent, quizPercent, score, codePercent});
});

app.post("/gradeMultipleChoice", async  function(req, res){ //This is the action of submitting the multiple choice page to the DB and go to some page undetermined
  let correct = gradeMultipleChoice(req.body);
  let rows = await multipleChoiceSubmit(req.body, correct);

  let user = req.body.name 
  let email = req.body.email
  let puzzlePercent = await getPuzzlePercent(req.body)
  let quizPercent = await getQuizPercent(req.body)
  let score = await calculateScore(req.body);
  let codePercent = await getCodePercent(req.body)

  res.render("home", {user, email, puzzlePercent, quizPercent, score, codePercent})
});


//all non page rendering functions below.

async function calculateScore(body) {
  let values = await getValues(body);
  let score = 0;

  //Coin problem scoring (correct answer is 2)
  if(values[0].coinProblem == 2) {score += 1100} // they get a bonus 100 points for being correct
  else if (values[0].coinProblem != null){
    let temp = 1.25 * (100 * (Math.abs(values[0].coinProblem - 2))) // they lose 125 points by each number they are off
    if(temp >= 1000) { score += 0 } // they were very wrong 
    else { score += 1000 - temp } // they were wrong by some amount of numbers
  }
  //console.log("Score with coinProblem: " + score)

  //Bucket Problem scoring (correct answer is 8)
  if(values[0].bucketProblem == 8) {score += 1100} // they get a bonus 100 points for being correct
  else if (values[0].bucketProblem != null){
    let temp = 0.75 * (100 * (Math.abs(values[0].bucketProblem - 8))) // they lose 75 points by each number they are off
    if(temp >= 1000) { score += 0 } // they were very wrong 
    else { score += 1000 - temp } // they were wrong by some amount of numbers
  }
  //console.log("Score with bucketProblem: " + score)

  //MultipleChoice Scoring
  if(values[0].multipleChoiceCorrect == 10) {score += 1100} // they get a bonus 100 points for being correct
  else if (values[0].multipleChoiceCorrect != null){
    let temp = 1 * (100 * (Math.abs(values[0].multipleChoiceCorrect - 10))) // they lose 100 points for each wrong answer
    if(temp >= 1000) { score += 0 } // they were very wrong 
    else { score += 1000 - temp } // they were wrong by some amount of numbers
  }
  //console.log("Score with multiple Choice: " + score)

  //Grading Coding problem One
  let probOne = values[0].probOne
  let answer = "aacccccceiiiiiilllmmnnnnooooooooopprrsssstuuv"
  if(probOne == answer) {score += 1500} // they get a bonus 500 points for being correct
  else {
    let temp = 0;
    if(probOne.length < answer) {
      for(i = 0; i < probOne.length; i++) {
        if(answer[i] == probOne[i]) {temp += 25} // 25 points for each letter in the right position casue 25 x 45 is ~ 1000  on the generous side
      }
    } else if(probOne.length >= answer) {
      for(i = 0; i < answer.length; i++) {
        if(answer[i] == probOne[i]) {temp += 25} // 25 points for each letter in the right position
      }
    } else { temp = 0}
    score += temp
  }
  //console.log(score + ": score with coding prob One")

  let rows = await submitScore(body, score)
  return score;
}

function gradeMultipleChoice(body){ // Will return the number of correct answers on multiple choice page
  let correct = 0;
  if(body.question1 == "option1") { correct++}
  if(body.question2 == "option1") { correct++}
  if(body.question3 == "option1") { correct++}
  if(body.question4 == "option1") { correct++}
  if(body.question5 == "option1") { correct++}
  if(body.question6 == "option1") { correct++}
  if(body.question7 == "option2") { correct++}
  if(body.question8 == "option1") { correct++}
  if(body.question9 == "option1") { correct++}
  if(body.question10 == "option3") { correct++}

  return correct;
}


async function getQuizPercent(body) { //gets the status for the home page if the multiple choice quiz is done
  let quizDone = await quizProgress(body);
  let quizPercent = ""

    if(quizDone[0].multipleChoiceCorrect != null) { quizPercent = "Finished" }
    else { quizPercent = "Incomplete" }

    return quizPercent


}


async function getPuzzlePercent(body){ // This function is used to figure out the status for the puzzzles on the home page
  let puzzlesDone = await puzzleProgress(body)
  let puzzlePercent = ""

  if(puzzlesDone[0].coinProblem != null && puzzlesDone[0].bucketProblem != null) {
    puzzlePercent = "Complete";
  } else if(puzzlesDone[0].coinProblem != null && puzzlesDone[0].bucketProblem == null || puzzlesDone[0].coinProblem == null && puzzlesDone[0].bucketProblem != null) {
    puzzlePercent = "In progress"
  } else { puzzlePercent = "Incomplete" }

  return puzzlePercent
}


async function getCodePercent(body){ // This function is used to figure out the status for the multiple choice on the home page
  let codeDone = await codeProgress(body)
  let codePercent = ""

  if(codeDone[0].probOne != null && codeDone[0].probTwo != null) {
    codePercent = "Complete";
  } else if(codeDone[0].probOne != null && codeDone[0].probTwo == null || codeDone[0].probOne == null && codeDone[0].probTwo != null) {
    codePercent = "In progress"
  } else { codePercent = "Incomplete" }

  return codePercent
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

function multipleChoiceSubmit(body, correct){ //This function will submit the users answer for the bucket problem to the DB
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `UPDATE userinfo
                     SET multipleChoiceCorrect =?
                     WHERE name =? AND email=?`;
       
          let params = [correct, body.name, body.email];
          conn.query(sql, params, function (err, rows, fields) {
             if (err) throw err;
             //res.send(rows);
             conn.end();
             resolve(rows);
          });
       });//connect
   });//promise 
}

function submitScore(body, score){ //This function will submit the users answer for the bucket problem to the DB
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `UPDATE userinfo
                     SET score =?
                     WHERE name =? AND email=?`;
       
          let params = [score, body.name, body.email];
          conn.query(sql, params, function (err, rows, fields) {
             if (err) throw err;
             //res.send(rows);
             conn.end();
             resolve(rows);
          });
       });//connect
   });//promise 
}

function submitProbOne(body){ //This function will submit the users answer for the first coding problem to the DB
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `UPDATE userinfo
                     SET probOne =?
                     WHERE name =? AND email=?`;
       
          let params = [body.probOne, body.name, body.email];
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

function codeProgress(body){ //This function gets users puzzle answers to help get the percentage done for the home page
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `SELECT probOne, probTwo
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

function quizProgress(body){ //This function gets users multiple choice score to help get the percentage done for the home page
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `SELECT multipleChoiceCorrect
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

function getValues(body){ //This function gets users multiple choice score to help get the percentage done for the home page
   
  let conn = dbConnection();
   return new Promise(function(resolve, reject){
       conn.connect(function(err) {
          if (err) throw err;
       
          let sql = `SELECT coinProblem, bucketProblem, multipleChoiceCorrect, probOne
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
                      probOne varchar(75),
                      probTwo varchar(75),
                      score MEDIUMINT,
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