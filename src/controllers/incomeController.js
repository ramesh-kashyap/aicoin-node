
const db = require("../config/connectDB");
const { User, Investment, Withdraw, Income } = require('../models');
const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const authMiddleware = require('../middleware/authMiddleware');
const Transaction = require("../models/Transaction");




exports.getUserIncome = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming req.user is set after authentication

    if (!userId) {
      return res.status(200).json({ error: "User Id Not found" });
    }

    console.log(`Fetching income for user ID: ${userId}`);

    const incomeData = await Transaction.findAll({
      where: {
        user_id: userId,
        remark: { 
          [Op.or]: ["Direct Income", "Level Income", "Roi Income"] // ✅ Multiple Income Types
        }
      },
      order: [["id", "DESC"]], // Order by id in descending order
      limit: 5, // ✅ Fetch only the latest 5 records
      raw: true, // Returns plain JSON data without extra Sequelize metadata
    });

    console.log("Fetched Income Data:", incomeData);

    return res.status(200).json({ success: true, data: incomeData });
  } catch (error) {
    console.error("Error fetching income data:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getLevelIncome = async (req, res) => {
    try {
        const userId = req.user.userId; // ✅ Use correct field name
  
        if (!userId) {
            return res.status(400).json({ error: "User ID is missing from token" });
        }
  
        console.log("Fetching Level Income for User ID:", userId); // ✅ Debugging
  
        // Fetch Level Income from DB
        const [income] = await db.execute(
            "SELECT * FROM incomes WHERE user_id = ? AND remarks = 'Level Income'", 
            [userId]
        );
  
        console.log("Income Data:", income); // ✅ Debugging database result
  
        return res.status(200).json({ success: true, data: income });
    } catch (error) {
        console.error("Error fetching income:", error.message);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
  };
  
  exports.allIncome = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ error: "User ID is missing from token" });
        }

        const { search = "", page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Filter condition with search query
        const whereCondition = {
            user_id: userId,
            remark: { 
                [Op.like]: `%${search}%` // Search by 'remark' field (adjust field if needed)
            }
        };

        const { count, rows: income } = await Income.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']] // Sort by recent transactions
        });

        const totalPages = Math.ceil(count / limit);

        if (!income.length) {
            return res.status(404).json({ error: "No transactions found." });
        }

        return res.status(200).json({ 
            success: true,
            data: income,
            totalPages 
        });
    } catch (error) {
        console.error("Error fetching income:", error.message);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
};


  exports.getDirectIncome = async (req, res) => {
      try {
          const userId = req.user.id; // Assuming req.user is set after authentication
  
          if (!userId) {
              return res.status(400).json({ error: "User ID is missing from token" });
          }
  
          console.log("Fetching Direct Income for User ID:", userId); // ✅ Debugging
  
          // ✅ Use Sequelize Model to fetch Direct Income sum
          const income = await Transaction.sum("comm", {
              where: {
                  user_id: userId,
                  remark: "Direct Income"
              }
          });
  
          const totalIncome = income || 0; // If no income found, return 0
  
          console.log("Total Income:", totalIncome); // ✅ Debugging database result
  
          return res.status(200).json({ 
              success: true, 
              total_income: totalIncome 
          });
        
      } catch (error) {
          console.error("Error fetching income:", error.message);
          return res.status(500).json({ error: "Server error", details: error.message });
      }
  };
  

  exports.getReferralUser = async (req, res) => {
      try {
          const userId = req.user.id; // Assuming req.user is set after authentication
  
          if (!userId) {
              return res.status(400).json({ error: "User ID is missing from token" });
          }
  
          console.log("Fetching Referral Count for User ID:", userId); 
  
          const referralCount = await User.count({
              where: {
                  sponsor: userId
              }
          });
  
          console.log("Total Referral Users:", referralCount); 
  
          return res.status(200).json({ 
              success: true, 
              total_user: referralCount 
          });
        
      } catch (error) {
          console.error("Error fetching referral count:", error.message);
          return res.status(500).json({ error: "Server error", details: error.message });
      }
  };
  
