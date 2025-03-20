// services/balanceService.js
const  Otp = require('../models/Otp');
const { Income, Investment, Withdraw } = require("../models");

async function calculateAvailableBalance(userId) {
    // Assume Income, Investment, and Withdraw are imported models
    const [totalIncome, totalInvestment, totalWithdraw] = await Promise.all([
      Income.sum("comm", { where: { user_id: userId } }).then(sum => sum || 0),
      Investment.sum("amount", { where: { user_id: userId } }).then(sum => sum || 0),
      Withdraw.sum("amount", { where: { user_id: userId } }).then(sum => sum || 0)
    ]);
  
    const availableBalance = totalIncome - totalWithdraw;
    return {
      available_balance: availableBalance,
      total_withdrawn: totalWithdraw,
      total_investment: totalInvestment
    };
  }

  // otpController.js

const crypto = require("crypto");
// Import your OTP model (using Sequelize, for example)


/**
 * Generate a numeric OTP of a given length with an expiration time.
 * @param {number} length - The number of digits (default: 6)
 * @param {number} validityInMinutes - Validity period in minutes (default: 10)
 * @returns {Object} Contains the generated OTP and its expiration time.
 */
function generateNumericOtp(length = 6, validityInMinutes = 3) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(crypto.randomInt(0, digits.length));
  }
  const expiresAt = new Date(Date.now() + validityInMinutes * 60000);
  return { otp, expiresAt };
}

/**
 * Controller function to generate (or update) an OTP for a given email.
 * Expected request body: { email: "user@example.com" }
 */
const generateOtp = async (req, res) => {
  try {
    // Retrieve email from request body
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Email is required.",
      });
    }

    // Generate a new OTP and expiration time
    const { otp, expiresAt } = generateNumericOtp();

    // Look for an existing pending OTP record for this email
    const existingOtpRecord = await Otp.findOne({
      where: { email, status: "Pending" },
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
          otp, // In production, do not expose the OTP in the response
          expiresAt,
        },
      });
    } else {
      // Create a new OTP record for this email
      const otpRecord = await Otp.create({
        otp,
        email,
        expiresAt,
        status: "Pending",
      });

      return res.status(200).json({
        status: true,
        message: "OTP generated successfully.",
        data: {
          otp, // In production, do not expose the OTP in the response
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





const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
   
    
    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required.",
      });
    }

    // Retrieve a pending OTP record matching the submitted email and OTP
    const otpRecord = await Otp.findOne({
      where: { email, otp, status: "Pending" },
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






  
  module.exports = { calculateAvailableBalance ,generateOtp,verifyOtp};
  