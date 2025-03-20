const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');
const { noTrueLogging } = require('sequelize/lib/utils/deprecations');

const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, foreignKey: true },

    user_id_fk: { type: DataTypes.INTEGER, allowNull: true },
    amount: { type: DataTypes.FLOAT, allowNull: noTrueLogging },
    comm: { type: DataTypes.FLOAT, allowNull: true },

    credit_type: { type: DataTypes.INTEGER,  defaultValue: 0,allowNull: true },
    remark: { type: DataTypes.STRING, allowNull: true },
    sdate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true, 
      },
    status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Inactive' },
    created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW } // ✅ Manually added

}, {
    tableName: 'transactions',
    timestamps: false
});

module.exports = Transaction;