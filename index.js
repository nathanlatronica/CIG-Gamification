const express = require("express");
const session = require('express-session');
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

// ~~~ Start functions for buckets.ejs ~~~

app.get("/buckets",  function(req, res){   
  let galClick = 3;

  //$("btn5g").on("click", bucketsOfWater);
  //$("btn3g").on("click", bucketsOfWater);

  //galClick++;
  //$("#displayTries").html(galClick);

  res.render("buckets", {'displayTries' : galClick});
});

// ~~~ End functions for buckets.ejs ~~~

//starting server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
  });