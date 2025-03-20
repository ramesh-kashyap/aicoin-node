// controllers/croncontroller.js
const cron = require('node-cron');


const { Investment, Income,User,Transaction } = require("../models"); // Import Sequelize models
const { Op } = require("sequelize");
const moment = require("moment");
async function calculateRoiIncome() {
    try {
      // Fetch investments where roiCandition is 0 and status is 'Active'
      const investments = await Investment.findAll({
        where: {
          roiCandition: 0,
          status: "Active",
        },
      });
  
      for (const investment of investments) {
        const amount = investment.amount;
        const totalGetAmount = amount * 2;
        let roiAmount = 0;
  
        // Calculate ROI based on investment amount
        // Calculate ROI based on the updated percentages
        if (amount >= 100 && amount <= 1000) {
            roiAmount = (amount * 0.16) / 100; // Basic
          } else if (amount >= 1001 && amount <= 5000) {
            roiAmount = (amount * 0.20) / 100; // Advance
          } else if (amount >= 5001 && amount <= 10000) {
            roiAmount = (amount * 0.23) / 100; // Professional
          } else if (amount >= 10001 && amount <= 20000) {
            roiAmount = (amount * 0.26) / 100; // Elite
          } else if (amount >= 20001 && amount <= 35000) {
            roiAmount = (amount * 0.33) / 100; // Leadership
          } else if (amount >= 35001 && amount <= 50000) {
            roiAmount = (amount * 0.40) / 100; // Ultra Leadership
          }
  
        
        const today = moment().format("YYYY-MM-DD");
  
        // Sum ROI Bonus income for this investment
        const roiCount = await Income.sum("comm", {
          where: {
            invest_id: investment.id,
           
          },
        });
  
        // Sum Team Commission income for this user
        const workIncomeSum = await Income.sum("comm", {
          where: {
            user_id: investment.user_id,
            remarks: "Team Commission",
          },
        });
  
        // Check if an income record for today already exists
        const todayRoiCount = await Income.count({
          where: {
            invest_id: investment.id,
            remarks: "Roi Income",
            ttime: today,
          },
        });
  
        // If no ROI Bonus entry exists for today and investment has started
        if (todayRoiCount === 0 && today >= investment.sdate) {
          if (roiCount <= totalGetAmount) {
            console.log(`ID: ${investment.user_id_fk} Roi: ${roiAmount}`);
  
            // Add ROI income
            await Income.create({
              user_id: investment.user_id,
              user_id_fk: investment.user_id_fk,
              amt: amount,
              comm: roiAmount,
              level: 0,
              ttime: today,
              invest_id: investment.id,
              remarks: "Roi Income",
            });
           
            const data2 = {
              // Unique transaction ID
              user_id: investment.user_id,
              user_id_fk: investment.user_id_fk,
              amount: roiAmount,    
              remarks: "Roi Income",        // Original amount
    credit_type:1,              // Account details
       // Default status
         // Assuming 1 represents a particular wallet type
    sdate: new Date().toISOString().split("T")[0],                // Current date in YYYY-MM-DD format
    };
    
    await Transaction.create(data2);
            // Add level income (Assuming you have a function for this)
            await distributeCommissions(investment.user_id, roiAmount);
          } else {
            // Update roiCandition if limit reached
            await investment.update({ roiCandition: 1 });
          }
        }
      }
    } catch (error) {
      console.error("Error calculating ROI income:", error);
    }
  }
  
  
const LEVEL_PERCENTAGES = {
    1: 20,
    2: 10,
    3: 5,
    4: 3,
    5: 2,
    // Levels 6–10: 1%
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
    // Levels 11–20: 0.5%
    11: 0.5,
    12: 0.5,
    13: 0.5,
    14: 0.5,
    15: 0.5,
    16: 0.5,
    17: 0.5,
    18: 0.5,
    19: 0.5,
    20: 0.5,
    // Levels 21–30: 0.25%
    21: 0.25,
    22: 0.25,
    23: 0.25,
    24: 0.25,
    25: 0.25,
    26: 0.25,
    27: 0.25,
    28: 0.25,
    29: 0.25,
    30: 0.25,
  };
  
  
  
  const distributeCommissions = async (userId, amount) => {
   
      if (!userId || !amount) {
        console.log("userId and amount are required" ) ;
      }

      const user = await User.findOne({
        where: { id: userId }
      });

      if (user.active_status !== "Active") {
        console.log("User is not active");
        return;
      }
    let currentUser = await User.findByPk(userId);
    let level = 1;
  
    while (currentUser && currentUser.sponsor && level <= 30) {
      const referrer = await User.findByPk(currentUser.sponsor);
  
      if (!referrer) break;
  
      // Fetch the correct percentage from LEVEL_PERCENTAGES or default to 0
      const percentage = LEVEL_PERCENTAGES[level] || 0;
      const commission = (amount * percentage) / 100;
  
      if (commission > 0) {
        
        await referrer.update({
          earnings: referrer.earnings + commission,
        });
  
       
        await Income.create({
          user_id: referrer.id,
          user_id_fk: currentUser.id,
          amount: amount,
          comm: commission,
          remarks: "Level Income",
          level,
          ttime: new Date(),
          type: "commission"
        });
        const data2 = {
          // Unique transaction ID
          user_id: referrer.id,
          user_id_fk: currentUser.id,
          amount: commission,    
          remarks: "Level Income",        // Original amount
credit_type:1,              // Account details
   // Default status
     // Assuming 1 represents a particular wallet type
sdate: new Date().toISOString().split("T")[0],                // Current date in YYYY-MM-DD format
};

await Transaction.create(data2);
        console.log(
          `Level ${level}: User ${referrer.id} earned ${commission.toFixed(2)}`
        );
      }
  
      currentUser = referrer;
      level++;
    }
  };

  


cron.schedule("0 0 * * *", async () => {
    console.log("🚀 Daily ROI calculation started:", new Date());

    
    try {
      await calculateRoiIncome(); 
      console.log("✅ Daily ROI calculation completed.");
    } catch (error) {
      console.error("❌ Error in ROI calculation:", error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata", 
  });
  
  console.log("✅ Daily cron job scheduled to run at midnight IST.");
  
  module.exports = { calculateRoiIncome };
