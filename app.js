const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
//const cors = require("cors");
// const mysql = require('mysql2');

const app = express();
const port = process.env.port;
const fs = require("fs");
const dbconnect = require("./util/database");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");

console.log("something " + port);

const routes = require("./routes/index");

// //mysql db connection
// const connection = mysql.createConnection({
//   host: 'host',
//   user: 'user',
//   password: 'password',
//   database: 'database'
// });

const accessStream = fs.createWriteStream("./access.log", { flags: "a" });

app.use(bodyParser.json());

//cors
//const corsOptions = { optionsSuccessStatus: 200 };
//app.use(cors(corsOptions));
//app.options('*',cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-type, Authorization");
  next();
});
app.use(helmet());
app.use(morgan("combined", { stream: accessStream }));

app.use("/evansportal", routes);
console.log("db password - " + process.env.dbPassword);
//sync app with database
dbconnect
  .sync()
  .then((result) => {
    console.log("database synced successfully");
    //start server
    app.listen(port, () => {
      console.log("server started at port - " + port);
    });
  })
  .catch((err) => {
    console.log(err);
  });

//pp.listen(port,()=>{console.log('app works')})
