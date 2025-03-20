const sequelize = require('../config/connectDB'); // Import Sequelize connection
const { QueryTypes } = require('sequelize');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // User Model Import Karein
const  resetpass = require('../models/resetpass');
require('dotenv').config();

const path = require("path");

// Register User Function
const register = async (req, res) => {
  try {
      const { name, phone, email, password, sponsor } = req.body;
      
      if (!name || !phone || !email || !password || !sponsor) {
          return res.status(400).json({ error: "All fields are required!" });
      }

      // Check if user already exists
      const [existingUser] = await db.execute(
          "SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone]
      );
      
      if (existingUser.length > 0) {
          return res.status(400).json({ error: "Email or Phone already exists!" });
      }

      // Check if sponsor exists
      const [sponsorUser] = await db.execute(
          "SELECT * FROM users WHERE username = ?", [sponsor]
      );
      if (sponsorUser.length === 0) {
          return res.status(400).json({ error: "Sponsor does not exist!" });
      }

      // Generate username & transaction password
      const username = Math.random().toString(36).substring(2, 10);
      const tpassword = Math.random().toString(36).substring(2, 8);

      // Hash passwords
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedTPassword = await bcrypt.hash(tpassword, 10);

      // Get parent ID
      const [lastUser] = await db.execute("SELECT id FROM users ORDER BY id DESC LIMIT 1");
      const parentId = lastUser.length > 0 ? lastUser[0].id : null;

      // Provide a default for sponsor level if it's undefined or null
      const sponsorLevel = (sponsorUser[0].level !== undefined && sponsorUser[0].level !== null)
          ? sponsorUser[0].level
          : 0;

      // Construct new user object
      const newUser = {
          name,
          phone,
          email,
          username,
          password: hashedPassword,
          tpassword: hashedTPassword,
          PSR: password,
          TPSR: tpassword,
          sponsor: sponsorUser[0].id,
          level: sponsorLevel + 1,  // Default to 0 if sponsor level is not defined, then add 1
          ParentId: parentId
      };

      // Optional: Log newUser for debugging (avoid logging sensitive info in production)
      // console.log("New User Data:", newUser);

      // Insert new user into the database
      await db.execute("INSERT INTO users SET ?", newUser);

      return res.status(201).json({ message: "User registered successfully!", username });

  } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).json({ error: "Server error", details: error.message });
  }
};




// Export function



// Login User Function
const login = async (req, res) => {
    console.log('hello');

    try {
      // Destructure username and password from the request body.
      const { email, password } = req.body;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
          console.log('Invalid email address');
          return res.status(400).json({ error: "Invalid email address" });
      }
      if (!email || !password) {
        console.log('User not found!');
        return res.status(400).json({ error: "Username and Password are required!" });
      }
         
      // Find the user using Sequelize
      const user = await User.findOne({ where: { email } });
       
      if (!user) {
        console.log('User not found!')
        return res.status(400).json({ error: "User not found!" });

      }
      console.log("user:",user );
      // Compare the provided password with the stored hashed password.
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Invalid credentials!')
        return res.status(400).json({ error: "Invalid credentials!" });
      }
  
      // Generate a JWT token.
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,  
       
      );
  
      return res.status(200).json({
        status:true,
        message: "Login successful!",
        username: user.username,
        token,
      });
    } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).json({ status:false , error: "Server error", details: error.message });
    }
  };
  

  const forget = async (req,res) =>{
    try {
      const { email } = req.body;
         
      // Find the user using Sequelize
      const user = await User.findOne({ where: { email } });
       
      if (!user) {
        console.log('User not found!')
        return res.status(400).json({ error: "User not found!" });

      }
      console.log("user:",user );
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // const expiresAt = new Date(Date.now() + validityInMinutes * 60000);
      const isnot = await resetpass.findOne({
        where: { email: user.email }  // ✅ Correct usage of WHERE clause
    });
    
        if(!isnot){
       await resetpass.create({
        email: user.email,
        token: otp, 
      });
    }
    else{
      await resetpass.update(
        { token: otp }, 
        { where: { email: user.email } }  // ✅ Correct WHERE condition
    );
    

    }

      console.log(`OTP for ${email}: ${otp}`);

      return res.status(200).json({
        status:true,
        message: "Otp Send successful!",
        email,
      });
    } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).json({ status:false , error: "Server error", details: error.message });
    }
  };
   
  const forgetOtp = async (req, res) => {
    try {
      const { email, pin } = req.body;
     
      
      // Validate input
      if (!email || !pin) {
        return res.status(400).json({
          status: false,
          message: "Email and OTP are required.",
        });
      }
  
      // Retrieve a pending OTP record matching the submitted email and OTP
      const otpRecord = await resetpass.findOne({
        where: { email },
      });
  
      if (!otpRecord) {
        return res.status(400).json({
          status: false,
          message: "Invalid OTP.",
        });
      }
  
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

  const confirmPass = async (req, res) => {
    try {
      const { email, password } = req.body;
     
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          status: false,
          message: "Email and OTP are required.",
        });
      }
  
      // Retrieve a pending OTP record matching the submitted email and OTP
      const otpRecord = await User.findOne({
        where: { email },
      });
  
      if (!otpRecord) {
        return res.status(400).json({
          status: false,
          message: "User Not found",
        });
      }
      const hashedPassword = await bcrypt.hash(password.toString(), 10);
      await User.update(
        { password: hashedPassword, PSR :password}, 
        { where: { email: email } }  // ✅ Correct WHERE condition
    );
      // Optionally, perform additional business logic (e.g., update user status)
  
      return res.status(200).json({
        status: true,
        message: "Pasword updated successfully.",
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({
        status: false,
        message: error.message || "Internal Server Error.",
      });
    }
  };
  

  const setPin = async (req, res) => {
    try {
      console.log("Request received:", req.body); // Debugging
      const { email, pin } = req.body;

      // ✅ Corrected Query using `where`
      const user = await User.findOne({ where: { email: email } });

      console.log("User Found:", user ? user.email : "No user found"); // Debugging

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const hashedPin = await bcrypt.hash(pin, 10); // 10 = Salt Rounds

      // PIN ko update karo
      user.has_pin = hashedPin;
      user.pin = pin;
      await user.save();


       // Generate a JWT token.
       const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,  
       
      );
  
      return res.status(200).json({
        status:true,
        message: "Login successful!",
        username: user.username,
        token,
      });
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
};

  

const verifyPin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pin } = req.body;

    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ status: false, error: "User not found!" });
    }

    // Check if PIN matches
    const isPinMatch = await bcrypt.compare(pin, user.has_pin);
    if (!isPinMatch) {
      console.log("PIN Mismatch: Incorrect old PIN");
      return res.status(400).json({ status: false, error: "Incorrect PIN!" });
    }

    return res.json({ status: true, message: "Old PIN verified successfully!" });

  } catch (error) {
    console.error("Server Error:", error.message);
    return res.status(500).json({ status: false, error: "Server error", details: error.message });
  }
};

  


  const updatePin = async (req, res) => {
    try {
      const userId = req.user.id;
      const { newPin, confirmPin } = req.body;
  
      if (!newPin || !confirmPin) {
        return res.status(400).json({ status: false, error: "Both PIN fields are required!" });
      }
  
      if (newPin.length !== 4) {
        return res.status(400).json({ status: false, error: "PIN must be exactly 4 digits!" });
      }
  
      if (newPin !== confirmPin) {
        return res.status(400).json({ status: false, error: "New PIN and Confirm PIN do not match!" });
      }
  
      const hashedPin = await bcrypt.hash(newPin, 10);
  
      await User.update({ pin: newPin, has_pin: hashedPin }, { where: { id: userId } });
  
      return res.json({ status: true, message: "PIN updated successfully!" });
  
    } catch (error) {
      console.error("Error updating PIN:", error.message);
      return res.status(500).json({ status: false, error: "Server error", details: error.message });
    }
  };
  
  


const logout = async (req, res) => {
    try {
        return res.json({ message: "User logged out successfully!" });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ error: "Server error" });
    }
};


const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
const userSessions = {}; // Declare userSessions object

bot.onText(/\/start (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id; 
    const referrerId = match[1]; // Extract referral ID

    console.log("Chat ID:", chatId, "Referrer ID:", referrerId);
    userSessions[chatId] = { referrerId };
    console.log("Stored Data:", userSessions);
        
});

const connect = async (req, res) => {
  // console.log(req.body);
  try{    
  const { email } = req.body;
  if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
  }    
  const Euser = await User.findOne({ where: { email: email } }); 
  // const queryGetUser = `SELECT * FROM users WHERE email = :email`; 
      // const users = await sequelize.query(queryGetUser, {
      //     replacements: { email },
      //     type: QueryTypes.SELECT, // Ensures it returns an array of objects
      // });
  if(!Euser){
      return res.status(400).json({ success: false, message: "User not Found"});
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;
  const queryInsertUser = `
  INSERT INTO password_resets (email, token) 
  VALUES (:email, :otp)
`;

const [insertResult] = await sequelize.query(queryInsertUser, {
  replacements: { email, otp },
  type: QueryTypes.INSERT,
});
  // console.log(`OTP for ${email}: ${otp}`);
  res.json({ success: true, message: "OTP sent" });
}
catch{
   console.error("Some error in otp generating");
}
};


const otp = async (req, res) => {
  // console.log(req.body);
  const { otp, email, telegram_id } = req.body;
  if (!otp || !email || !telegram_id) {
      return res.status(400).json({ success: false, message: "OTP and Email are required" });
  }
  try {
      const queryGetCode = `
          SELECT * FROM password_resets 
          WHERE email = :email AND token = :otp
      `;
      const codes = await sequelize.query(queryGetCode, {
          replacements: { email, otp },
          type: QueryTypes.SELECT,
      });
      if (codes.length > 0) {
          const queryUpdateUser = `
              UPDATE users 
              SET telegram_id = :telegram_id
              WHERE email = :email
          `;
          await sequelize.query(queryUpdateUser, {
              replacements: { telegram_id, email },
              type: QueryTypes.UPDATE,
          });
          return res.status(200).json({ success: true, message: "OTP match" });
      } else {
          return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
  } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({ success: false, message: "Server error" });
  }
};
const loginWithTelegram = async (req, res) => {
  console.log(req.body);
  try {        
      const { telegram_id, tusername, tname, tlastname, referrerId} = req.body;

      //  console.log( chatId, referrerId);       

      if (!telegram_id) {
          return res.status(200).json({ message: "Telegram ID is required" });
      }
      let sponsor = null;
      // console.log("spons",userSessions[telegram_id]);
      if (userSessions[telegram_id]) {
       const referrerId = userSessions[telegram_id].referrerId;
      
          if (referrerId) {
              sponsor = referrerId;
          }
      }
      
      console.log("Sponsor ID:", sponsor);
      // ✅ Check if user exists
      const queryCheckUser = `
          SELECT * FROM telegram_users WHERE telegram_id = :telegram_id
      `;

      const users = await sequelize.query(queryCheckUser, {
          replacements: { telegram_id },
          type: QueryTypes.SELECT,
      });
      if (users.length > 0) {
          // ✅ User exists, generate JWT token
          const user = users[0]; // Extract first

          const token = jwt.sign(
              { id: user.id, telegram_id: user.telegram_id },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
          );

          return res.status(200).json({
              message: "Login successful",
              telegram_id: telegram_id,
              token,
          });
      } else {
          // ✅ Create new user
          const queryInsertUser = `
              INSERT INTO telegram_users (telegram_id, tusername, tname, tlastname, sponsor) 
              VALUES (:telegram_id, :tusername, :tname, :tlastname, :sponsor)
          `;

          const [insertResult] = await sequelize.query(queryInsertUser, {
              replacements: { telegram_id, tusername, tname, tlastname, sponsor},
              type: QueryTypes.INSERT,
          });

          // ✅ Generate JWT token for new user
          const token = jwt.sign(
              { id: insertResult, telegram_id }, // insertResult contains the new user ID
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
          );

          return res.status(201).json({
              message: "Account created and logged in",
              telegram_id: telegram_id,
              token,
          });
      }
  } catch (error) {
      console.error("❌ Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = { login, register, logout,loginWithTelegram, connect, otp,verifyPin,updatePin,setPin, forget,forgetOtp ,confirmPass};

