const { Op } = require("sequelize");
const { Income, Investment, Withdraw ,User} = require("../models");
const Transaction = require("../models/Transaction");
const CryptoJS = require("crypto-js");
const getHistory = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query; // Pagination parameters

        const offset = (page - 1) * limit; // Calculate offset

        let whereCondition = {}; // Removed user-based filtering

        if (search) {
            whereCondition = {
                [Op.or]: [
                    { remark: { [Op.like]: `%${search}%` } },
                    { amount: { [Op.like]: `%${search}%` } },
                    { created_at: { [Op.like]: `%${search}%` } },
                    { user_id_fk: { [Op.like]: `%${search}%` } },
                ]
            };
        }

        const { count, rows } = await Transaction.findAndCountAll({
            where: whereCondition,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit), 
            offset: parseInt(offset),
        });

        res.json({
            success: true,
            data: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error("Error fetching transaction history:", error.message, error.stack);
        res.status(500).json({ error: error.message });
    }
};
const secretKey = "Rameshk"; // Same key as encryption

const decryptID = (encryptedHex) => {
  try {
    const base64String = CryptoJS.enc.Hex.parse(encryptedHex).toString(CryptoJS.enc.Base64);
    const decryptedBytes = CryptoJS.AES.decrypt(base64String, secretKey);
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decryptedText;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

const encryptID = (userId) => {
  try {
    const ciphertext = CryptoJS.AES.encrypt(userId.toString(), secretKey).toString();
    const encryptedHex = CryptoJS.enc.Base64.parse(ciphertext).toString(CryptoJS.enc.Hex);
    return encryptedHex;
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
};

const StakeRecord = async (req, res) => {
    try {
      const { userId,
        amount_in_usdt,
        token,
        txnHash, } = req.body;
     
        if (!req.user || !req.user.id) {
          return res.status(401).json({ error: "Unauthorized: User not found" });
        }
        const decryptedValue = decryptID(userId);

        console.log(decryptedValue);
        if (decryptedValue !== req.user.id.toString()) {
          return res.status(403).json({ error: "Forbidden: User ID mismatch" });
        }
      
  
      const userid = req.user.id;
      const user = req.user;
      // Validate input
      if (!amount_in_usdt ) {
        return res.status(400).json({
          status: false,
          message: "amount_in_usdt are required.",
        });
      }
    

      if (!token ) {
        return res.status(400).json({
          status: false,
          message: "Token are required.",
        });
      }
      if (!txnHash ) {
        return res.status(400).json({
          status: false,
          message: "txnHash are required.",
        });
      }
    
      const invoice = Math.random().toString().slice(2, 9);
      const investmentData = {
        // plan: plan,
        orderId: invoice,
        transaction_id: txnHash,
        user_id: userid,
        user_id_fk: user.username,
        amount: amount_in_usdt,
        // payment_mode: paymentMode,
        token:token,
        status: "Active",
        sdate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        active_from: user.username,
        walletType: 1,
        created_at: new Date(),
      };
  
      const data2 = {
        transaction_id: txnHash,               // Unique transaction ID
        user_id: userId,     // User ID from the authenticated user
        user_id_fk: user.username, // Another identifier for the user
        amount: amount_in_usdt,    
        remark:"Deposit"  ,         // Original amount
        credit_type:1,              // Account details
        status: "Active",    // Default status
                // Assuming 1 represents a particular wallet type
        sdate: new Date().toISOString().split("T")[0],                // Current date in YYYY-MM-DD format
      };
     const investment= await Investment.create(investmentData);
   const check = await User.update(
      { active_status: 'Active',adate:new Date().toISOString().split("T")[0] },
      { where: { id: investment.user_id } }
    );
  console.log(check, investment.user_id);
     await Transaction.create(data2);
     const result = await addDirectIncome(userid, amount_in_usdt);
     console.log(result);
     if (result) {
        console.log('Direct income added successfully.');
      } else {
        console.log('Failed to add direct income.',result);
      }
      return res.status(200).json({
        status: true,
        message: "Data saved successfully",
        data:investment, // Optionally, return the created record
      });
      // Retrieve a pending OTP record matching the submitted email and OTP
      
    } catch (error) {
      console.error("Error :", error);
      return res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error.",
      });
    }
  };

  async function addDirectIncome(id, amt) {
    try {
      // Retrieve the current user's data
      console.log("Decrypted User ID:", id);
  
      const userData = await User.findOne({
        where: { id },
        order: [['id', 'DESC']],
      });
      if (!userData) {
        console.log("USer Data not Found",userData);
      return;
      }
     
  
      // Extract user details
      const user_username = userData.username;
      const fullname = userData.name;
      const rname = userData.username;
      const user_mid = userData.id;
  
      const cnt = 1;
      // Convert amount by dividing by 100
      const amount = amt / 100;
  
      // Get sponsor information from current user
      const sponsorUser = await User.findOne({
        where: { id: user_mid },
        order: [['id', 'DESC']],
      });
      const sponsor = sponsorUser.sponsor;
      
      // Initialize variables
      let sponsorStatus = null;
      let sp_status = "Pending";
      let sponsorCount = 0;
      let total_profit = 0;
      let total_get = 0;
  
      if (sponsor) {
        // Fetch sponsor's record
        sponsorStatus = await User.findOne({
          where: { id: sponsor },
          order: [['id', 'DESC']],
        });
        sp_status = sponsorStatus.active_status;
  
        // Count how many active users the sponsor has
        sponsorCount = await User.count({
          where: { sponsor: sponsor, active_status: 'Active' },
        });
  
        // Sum the amounts of all active investments for the sponsor
        const investments = await Investment.findAll({
          where: { user_id: sponsorStatus.id, status: 'Active' },
        });
        const lastPackage = investments.reduce(
          (sum, inv) => sum + parseFloat(inv.amount),
          0
        );
  
        // Sum the commission amounts for the sponsor from incomes
        const incomes = await Income.findAll({
          where: { user_id: sponsorStatus.id },
        });
       
        total_profit = incomes.reduce(
          (sum, inc) => sum + parseFloat(inc.comm),
          0
        );
  
        // Calculate total get (200% of the last package)
        total_get = (lastPackage * 200) / 100;
      }
      
      
      const percent = 5;
      // Calculate commission (pp) based on the given percentage
      let pp = amount * percent;
    
      const spid = sponsorStatus ? sponsorStatus.id : 0;
      
      const max_income = total_get;
      const n_m_t = max_income - total_profit;
      console.log("Decrypted Amount:",spid,pp);
  
      // Proceed to create a direct income record if sponsor exists and commission is greater than zero
      if (spid > 0 && pp > 0) {
        const incomeData = {
          user_id: spid, // The sponsor's ID
          user_id_fk: sponsorStatus.username, // Sponsor's username
          amt: amt,
          comm: pp,
          remarks: "Direct Income",
          level: cnt,
          rname: rname,
          fullname: fullname,
          ttime: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
        };
      
        const data2 = {
                       // Unique transaction ID
          user_id: spid,     // User ID from the authenticated user
          user_id_fk: sponsorStatus.username, // Another identifier for the user
          amount: pp,    
          remark:"Direct Income"  ,         // Original amount
          credit_type:1,              // Account details
          status: "Active",    // Default status
                  // Assuming 1 represents a particular wallet type
          sdate: new Date().toISOString().split("T")[0],                // Current date in YYYY-MM-DD format
        };

        await Transaction.create(data2);
        await Income.create(incomeData);
        return true;
      }
  
    
    } catch (error) {
      console.error("Error in addDirectIncome:", error);
      return false;
    }
  }

  module.exports = {StakeRecord, getHistory }