const express = require("express");
const session = require('express-session');
const mysql = require("mysql");
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 8000;

app.set("view engine", "ejs");
app.use(express.static("public")); //folder for images, css, js
app.use('/public', express.static('public'));
app.use(express.static("css"));
app.use(bodyParser.json())


app.get("/",  function(req, res){    
    res.render("test");
  });

app.get("/userInfo",  function(req, res){    
  res.render("userInfo");
});  

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
  var createUserInfo = `CREATE TABLE IF NOT EXISTS UserInfo
                      (id int NOT NULL AUTO_INCREMENT,
                      name varchar(60) NOT NULL,
                      email varchar(75) NOT NULL,
                      PRIMARY KEY(id)
                      );`
  connection.query(createUserInfo, function (err, rows, fields) {
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