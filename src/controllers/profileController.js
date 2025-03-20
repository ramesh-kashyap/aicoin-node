const sequelize = require('../config/connectDB'); // Import Sequelize connection
const { QueryTypes } = require('sequelize');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User"); // User Model Import Karein
const TelegramUser = require("../models/telegram"); 
require('dotenv').config();


const updateUserProfile = async (req, res) => {
    try {
        
        const userId = req.user.id; 

        const { fullname } = req.body; 

        if (!fullname) {
            return res.status(400).json({ message: "user_name is required" });
        }

        // ✅ User ka name update karein
        const updatedRows = await User.update({ fullname }, { where: { id: userId } });

        res.json({ message: "Profile updated successfully", updatedRows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const updateUserFullName = async (req, res) => {
    try {
        
        const userId = req.user.id; 

        const { fullname } = req.body; 

        if (!fullname) {
            return res.status(400).json({ message: "fullname is required" });
        }

        // ✅ User ka name update karein
        const updatedRows = await User.update({ fullname }, { where: { id: userId } });

    

        res.json({ message: "Profile updated successfully", updatedRows });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong! Please try again." });
    }
};


const telegramToken = async (req, res) => {
    try {
        
        const userId = req.user.id; 
         
        if (!userId) {
            return res.status(400).json({ message: "User not authenticated" });
        }   

        
        const user = await User.findOne({
            where: { id: userId },
            attributes: ["telegram_id"], // Only fetch telegram_id for efficiency
        });

        // If user not found, return an error
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if telegram_id is null
        if (user.telegram_id === null) {
            return res.status(400).json({ message: "Telegram ID is not set" });
        }

       
        const telegramUser = await TelegramUser.findOne({
            where: { telegram_id: user.telegram_id },
            attributes: ["coin_balance"], // Fetch only coin value
        });

        // If no matching telegram user found, return an error
        if (!telegramUser) {
            return res.status(404).json({ message: "Telegram user not found" });
        }
        

    

        res.json({ status: true,message: "fetch coin successfully", coin: telegramUser.coin_balance});
    } catch (error) {
        res.status(500).json({ error: "Something went wrong! Please try again." });
    }
};




module.exports = { updateUserProfile,updateUserFullName,telegramToken};

