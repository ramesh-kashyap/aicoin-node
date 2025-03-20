const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');


    const resetpass = sequelize.define("resetpass", {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true ,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: true, // make sure email is required
      },
    }, {
        tableName: 'password_resets',
        timestamps: false
    });
    
    module.exports = resetpass;

  