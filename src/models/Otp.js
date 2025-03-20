const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');


    const Otp = sequelize.define("Otp", {
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true, // make sure email is required
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending", // other value: "Verified"
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    }, {
        tableName: 'otps',
        timestamps: false
    });
    
    module.exports = Otp;

  