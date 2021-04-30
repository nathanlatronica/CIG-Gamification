var express = require('express');
var app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");

const { Timer } = require('timer-node');
const timer = new Timer({ label: 'test-timer' });



const port = process.env.PORT || 8000;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true}));

app.get("/",  function(req, res){    
    res.render("test");
    timer.start();
    console.log(timer.time());


  });

app.get("/userInfo",  function(req, res){    
  res.render("userInfo");
});

app.get("/problemOne",  function(req, res){    
  res.render("problemOne");
});


app.post('/storeUserInfo', async function(req, res) {
  //console.log("Name: " + req.body.name)\\


  let rows = await userInfoAction(req.body);


  res.render('problemOne');


});

function userInfoAction(body){
   
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


function dbSetup() {
  let connection = dbConnection();
  
  connection.connect()
    /* 
    This is were we create the tables to store information
    Not 100% sure yet what we are gonna store so its kinda blank
    Could be multiple choice questions... There is  name and email .. etc
    */
  var createuserinfo = `CREATE TABLE IF NOT EXISTS userinfo
                      (id int NOT NULL AUTO_INCREMENT,
                      name varchar(60) NOT NULL,
                      email varchar(75) NOT NULL,
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

//starting server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
  });