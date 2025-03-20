const { DataTypes } = require('sequelize');
const sequelize = require('../config/connectDB');

const Withdraw = sequelize.define('Withdraw', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id_fk: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, foreignKey: true },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    status: { type: DataTypes.ENUM('Approved', 'Pending', 'Rejected'), defaultValue: 'Pending' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW } // ✅ Manually added

   ,
   payable_amt: {
    type: DataTypes.DECIMAL(18, 8), // Net amount after admin fee deduction
    allowNull: true,
  },
  charge: {
    type: DataTypes.DECIMAL(18, 8), // Admin fee deducted
    allowNull: true,
  },
    wdate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      account: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      txn_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true, // assuming txn_id is unique
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
}, {
    tableName: 'withdraws',
    timestamps: false
});

module.exports = Withdraw;