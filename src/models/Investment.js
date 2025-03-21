const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');

const Investment = sequelize.define('Investment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id_fk: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, foreignKey: true },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    roiCandition: {
        type: DataTypes.INTEGER, // Or DataTypes.FLOAT if it needs to be a float
        allowNull: true, // Adjust based on whether it's a required field
      },
      walletAddress: {
        type: DataTypes.STRING, // Or DataTypes.FLOAT if it needs to be a float
        allowNull: true, // Adjust based on whether it's a required field
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      active_from: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sdate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      walletType: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      token: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, 
      },
    status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Inactive' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW } // ✅ Manually added

}, {
    tableName: 'investments',
    timestamps: false
});

module.exports = Investment;