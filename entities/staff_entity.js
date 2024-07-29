const { Model } = require('sequelize');
const Sequelize=require('sequelize');
const sequelize=require('../util/database');

class Staff extends Model{}

Staff.init({
    staffid:{type: Sequelize.TEXT, primaryKey: true },
    stafsurname:Sequelize.TEXT,
    stafirstname: Sequelize.TEXT,
    passme: Sequelize.STRING(7),

}, {sequelize, createdAt:false, updatedAt:false, timestamps:false, modelName:'staff'});

module.exports=Staff;
