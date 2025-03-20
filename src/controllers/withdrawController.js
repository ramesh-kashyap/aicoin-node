
const db = require("../config/connectDB");
const { User, Investment, Withdraw, Income,Transaction } = require('../models');
const Otp = require('../models/Otp');
const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const authMiddleware = require('../middleware/authMiddleware');
const { calculateAvailableBalance } = require("../helper/helper");
const crypto = require("crypto");



    const getWithdrawHistory = async (req, res) => {
            try {
        const user = req.user;
        // console.log("Authenticated User:", user);

        if (!user || !user.id) {
            return res.status(400).json({ error: "User not authenticated" });
        }   
        const userId = user.id;
    
        const WithdrawHistory = await Withdraw.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']] // Order by created_at in descending order
        });


        res.json({ success: true, data: WithdrawHistory });
    } catch (error) {
        console.error("Error fetching investment history:", error.message, error.stack);
        res.status(500).json({ error: error.message });
    }
};

function generateNumericOtp(length = 6, validityInMinutes = 10) {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += digits.charAt(crypto.randomInt(0, digits.length));
    }
    const expiresAt = new Date(Date.now() + validityInMinutes * 60000);
    return { otp, expiresAt };
  }
  
  /**
   * Generates an OTP for a given user and saves it in the database.
   * Expected request body: { userId: <number> }
   */
  const generateOtp = async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized: User not found"
        });
      }
  
      const userId = req.user.id; // Authenticated User ID
  
      // Generate a new OTP and expiration time
      const { otp, expiresAt } = generateNumericOtp();
  
      // Look for an existing pending OTP record for this user
      const existingOtpRecord = await Otp.findOne({
        where: { userId, status: "Pending" }
      });
  
      if (existingOtpRecord) {
        // Update the existing record with new OTP and expiry
        existingOtpRecord.otp = otp;
        existingOtpRecord.expiresAt = expiresAt;
        await existingOtpRecord.save();
  
        return res.status(200).json({
          status: true,
          message: "OTP updated successfully.",
          data: {
            otp, // Remove or mask this in production
            expiresAt,
          },
        });
      } else {
        // Create a new OTP record since none exists
        const otpRecord = await Otp.create({
          otp,
          userId,
          expiresAt,
          status: "Pending",
        });
  
        return res.status(200).json({
          status: true,
          message: "OTP generated successfully.",
          data: {
            otp, // Remove or mask this in production
            expiresAt,
          },
        });
      }
    } catch (error) {
      console.error("Error generating OTP:", error);
      return res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error.",
      });
    }
  };
  
  


const withdraw = async (req, res) => {
    try {
      const {walletAddress, amount } = req.body;
      const userId = req.user.id; 
      // Validate input fields
      
      if (!req.user || !req.user.id) {
        return res.status(401).json({  status: false,
            message: "Unauthorized: User not found" });
      }
      
      const balanceData = await calculateAvailableBalance(userId);
      const requestedAmount = Number(amount);
      const MIN_WITHDRAWAL = 20;
      if (isNaN(requestedAmount) || requestedAmount < MIN_WITHDRAWAL) {
        return res.status(400).json({
          status: false,
          message: `Minimum withdrawal amount is ${MIN_WITHDRAWAL}.`,
        });
      }

      if ( !walletAddress || !amount) {
        return res.status(400).json({
          status: false,
          message:
            "Missing required fields: wallet, walletAddress, and amount are required.",
        });
      }
      const pendingWithdrawal = await Withdraw.findOne({
        where: { user_id: userId, status: "Pending" },
      });
  
      if (pendingWithdrawal) {
        return res.status(400).json({
          status: false,
          message: "Withdraw is pending",
        });
      }
  
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "User not found",
        });
      }
      // Validate that amount is a positive number
      if (isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({
          status: false,
          message:
            "Invalid amount. Please enter a valid number greater than zero.",
        });
      }
      if (balanceData.available_balance <= Number(amount)) {
        return res.status(400).json({ 
          status: false, 
          message: "Insufficient available balance for OTP generation or withdrawal" 
        });
      }

    const adminFeePercentage = 0.2;
    const adminFee = requestedAmount * adminFeePercentage;
    const netAmount = requestedAmount - adminFee;

      // Log the withdrawal request (simulate processing)
      console.log(
        `Received  Wallet Address: ${walletAddress}, Amount: ${amount}`
      );
      const txn_id = crypto
      .createHash("md5")
      .update(Date.now() + Math.random().toString())
      .digest("hex");
      const wdate = new Date().toISOString().split("T")[0];
      // Simulate withdrawal processing (replace with your business logic)
      // For example, you might update a database record, call an external API, etc.
      const data = {
        txn_id,               // Unique transaction ID
        user_id: userId,     // User ID from the authenticated user
        user_id_fk: user.username, // Another identifier for the user
        amount,               // Original amount
        payable_amt: netAmount, 
        charge: adminFee,     
        account: walletAddress,              // Account details
        status: "Pending",    // Default status
        walletType: 1,        // Assuming 1 represents a particular wallet type
        wdate,                // Current date in YYYY-MM-DD format
      };

      const data2 = {
        transaction_id: txn_id,               // Unique transaction ID
        user_id: userId,     // User ID from the authenticated user
        user_id_fk: user.username, // Another identifier for the user
        amount,    
        remark:"Withdraw"  ,         // Original amount
        payable_amt: netAmount, 
        charge: adminFee,     
        account: walletAddress,              // Account details
        status: "Pending",    // Default status
                // Assuming 1 represents a particular wallet type
        sdate:wdate,                // Current date in YYYY-MM-DD format
      };
  
      // Save the data to the database using Sequelize
      const withdrawal = await Withdraw.create(data);
      await Transaction.create(data2);
     
      return res.status(200).json({
        status: true,
        message: "Withdrawal request submitted successfully.",
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error.",
      });
    }
  };



const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    // Validate input
    if (!otp) {
      return res.status(400).json({
        status: false,
        message: "OTP is required.",
      });
    }

    // Retrieve a pending OTP record matching the submitted OTP
    const otpRecord = await Otp.findOne({
      where: { otp, status: "Pending" },
    });

    if (!otpRecord) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP.",
      });
    }

    // Check if the OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        status: false,
        message: "OTP has expired.",
      });
    }

    // Mark OTP as verified
    otpRecord.status = "Verified";
    await otpRecord.save();
    
    // Optionally, perform additional business logic (e.g., update user status)

    return res.status(200).json({
      status: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error.",
    });
  }
};



  module.exports = {
    withdraw,getWithdrawHistory,verifyOtp ,generateOtp
  };
  


