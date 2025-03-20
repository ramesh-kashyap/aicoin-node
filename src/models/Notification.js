const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');

    const Notification = sequelize.define("Notification", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    }, {
      timestamps: true, // Enables createdAt and updatedAt automatically
      tableName: "notifications", // Explicit table name
    });
  
  

  
  module.exports =  Notification;