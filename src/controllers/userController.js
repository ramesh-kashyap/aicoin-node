const { User, Investment, Withdraw, Income } = require('../models');
const { Op } = require('sequelize');
const { calculateAvailableBalance } = require("../helper/helper");
const userIncomes = async (req, res)=>{
    try {
        const userId = req.user.id; 
        
        if (!userId) {
            console.log("User ID is missing from token");
            return res.status(400).json({ error: "User ID is missing from token" });
        }

        const balanceData = await calculateAvailableBalance(userId);
        const totalInvestmentAmount = await Investment.sum('amount', {
            where: {
                user_id: userId, // Fetch records where id matches userId
              roiCandition: 0 // Filter by roiCandition = 0
            }
          })|| 0;
          console.log("Total Investment Amount:", totalInvestmentAmount); // Log result to verify
          
          const totalRoiAmount = await Income.sum('comm', {
            where: {
              user_id: userId, // Fetch records where id matches userId
              remarks: 'Roi Income'
            },
            logging: console.log
          })|| 0;
          console.log("Total ROI Amount:", totalRoiAmount); // Log result to verify
          
          const totalTeamAmount = await Income.sum('comm', {
            where: {
                user_id: userId, // Fetch records where id matches userId
              remarks: {
                [Op.or]: ['Level Income', 'Direct Income']  // Filter by 'Level Income' OR 'Direct Income'
              }
            }
          })|| 0;
          console.log("Total Team Amount:", totalTeamAmount); // Log result to verify
          
          const totalWithdrawlAmount = await Withdraw.sum('amount', {
            where: { user_id: userId } // Fetch all users with id = userId
          })|| 0;
          console.log("Total Withdrawal Amount:", totalWithdrawlAmount); // Log result to verify
          
        res.json({
          status: true,
          data: {
            totalInvestmentAmount,
            totalRoiAmount,
            totalTeamAmount,
            totalWithdrawlAmount,
            balanceData
          },
          
          message: 'Data Fetch Successfully'
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
          status: false,
          data: null,
          message: 'Error fetching news'
        });
      }
}

// const getAvailableBalance = async (req, res) => {
//   try {
//     const user = req.user; 
//     const userId = user.id; // Authenticated User ID

//     // ✅ Users Income
//     const totalIncome = await Income.sum("comm", { where: { user_id: userId } });


//     // const totalROIIncome = await Income.sum("comm", { 
//     //   where: { 
//     //     user_id: userId,
//     //     remarks: "Roi Income" 
//     //   } 
//     // });
//         // console.log(totalIncome);

//     const totalInvestment = await Investment.sum("amount", { where: { user_id: userId } });

//     // ✅ Withdraw Amount
//     const totalWithdraw = await Withdraw.sum("amount", { where: { user_id: userId } });
//     // console.log(totalWithdraw);

//     // ✅ Available Balance Calculation
//     const balance = (totalIncome || 0) - (totalWithdraw || 0);

//     res.json({ available_balance: balance,withdraw:totalWithdraw,totlinvest:totalInvestment});
//   } catch (error) {
//     console.error("Error fetching balance:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };




module.exports = { userIncomes };