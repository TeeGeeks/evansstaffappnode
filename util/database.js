//const Sequelize = require('sequelize');
//const sequelize=new Sequelize('dbdhagpqgngnga', 'evanspub_adminuser', 'Evanspublishers2019%%',{dialect:'mysql', host:'evanspublishersportal.com'});
// const sequelisze= new Sequelize('mysql://evanspub_adminuser:Evanspublishers2019%%@evanspublishersportal.com:2096/evanspub_adminhr');
//module.exports=sequelize;

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  process.env.dbDatabase,
  process.env.dbUser,
  process.env.dbPassword,
  {
    host: process.env.dbHost,
    port: 3306,
    dialect: "mysql",
  }
);
module.exports = sequelize;
