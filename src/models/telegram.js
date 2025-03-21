const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');


const Telegram_user = sequelize.define('Telegram', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tusername: { type: DataTypes.STRING, allowNull: false },
    telegram_id: { type: DataTypes.INTEGER, allowNull: true },
    balance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    coin_balance: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    sponsor: {type: DataTypes.INTEGER, allowNull: false,},
    invite_bonus: {type: DataTypes.INTEGER, allowNull: false,},
}, {
    tableName: 'telegram_users',
    timestamps: false
});



module.exports = Telegram_user;