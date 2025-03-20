const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectDB");


    const News = sequelize.define('News', {
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paragraph: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    }, {
      tableName: 'news',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });


  module.exports = News;