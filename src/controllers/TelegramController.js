const sequelize = require('../config/connectDB'); // Import Sequelize connection
const { QueryTypes } = require('sequelize');
const { Op } = require("sequelize");
const TelegramUser = require('../models/telegram');
const Task = require("../models/Task");
const { UserTask } = require("../models"); // Import both models
const User = require('../models/User');
const { connectors } = require('googleapis/build/src/apis/connectors');


let timeNow = Date.now();

const getUserByTelegramId = async (req, res) => {
    try {
        const { telegram_id } = req.body;

        if (!telegram_id) {
            return res.status(400).json({
                message: "Telegram ID is required",
                status: false,
                timeStamp: timeNow,
            });
        }

        const query = `
            SELECT 
                tu.telegram_id, tu.tusername, tu.tname, tu.tlastname,
                u.id AS user_id, u.email, u.name, u.username
            FROM telegram_users tu
            LEFT JOIN users u ON tu.id = u.telegram_id
            WHERE tu.telegram_id = :telegram_id;
        `;
        // Use Sequelize `query()` instead of `mysql.execute()`
        const results = await sequelize.query(query, {
            replacements: { telegram_id },  // Use replacements for security
            type: QueryTypes.SELECT         // Ensures correct result format
        });

        if (results.length === 0) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                timeStamp: timeNow,
            });
        }

        return res.status(200).json({
            user: results[0],
            status: true,
            timeStamp: timeNow
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            status: false,
            timeStamp: timeNow,
        });
    }
};

const updateBalance = async (req, res) => {
    try {
        const userId = req.user?.id; // Ensure req.user is not undefined
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID missing" });
        }

        const user = await TelegramUser.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await TelegramUser.increment({ balance: 1, coin_balance: 1 }, { where: { id: userId } });

        const updatedUser = await TelegramUser.findOne({ where: { id: userId } });

        return res.status(200).json({
            message: "Balance updated successfully",
            balance: updatedUser.balance,
            coin_balance: updatedUser.coin_balance,
        });

    } catch (error) {
        console.error("❌ Error updating balance:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


const fatchBalance = async (req, res) =>{
    // console.log(req.body);
    try{
        const userId = req.user?.id; // Ensure req.user is not undefined
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID missing" });
        }
        const user = await TelegramUser.findOne({ where: { id: userId } });
        // console.log(user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const query = `SELECT SUM(coin) AS totalCoin FROM coin_bundle WHERE telegram_id = :telegramId`;
        const result = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { telegramId: user.telegram_id }, // Safe query binding
         });
         return res.status(200).json({
            message: "Balance Fatch successfully",
            balance: user.balance,
        });
    }
    catch (error) {
        console.error("❌ Error updating balance:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


const startTask = async (req, res) => {
    try {
        const { telegram_id, task_id } = req.body;

        const [userTask, created] = await UserTask.findOrCreate({
            where: { telegram_id, task_id },
            defaults: { status: "pending" },
          });
          res.json({ message: created ? "Task started" : "Task already in progress" });

    } catch (error) {
        res.status(500).json({ error: "Error starting task" });
    }
  };


  const claimTask = async (req, res) => {
    try {
        const { telegram_id, task_id } = req.body;
        const task = await Task.findOne({ where: {id:task_id},attributes:['reward']});
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }        
        const user = await TelegramUser.findOne({ where: { telegram_id: telegram_id} });
        // console.log(user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const Euser = await User.findOne({where:{telegram_id:telegram_id}});
        if(!Euser){
            return res.status(404).json({ message: "Account Not Connected" });
        }
        const existingTask = await UserTask.findOne({ where: { task_id: task_id, status: "completed", telegram_id: telegram_id } });
        if (existingTask) {
            return res.status(400).json({ message: "You can't Claim Again" });
        }
        await TelegramUser.update(
            { coin_balance: user.coin_balance + task.reward },
            { where: { telegram_id: telegram_id } }
        );
        await UserTask.update({ status: "completed", bonus: task.reward }, { where: { telegram_id: telegram_id, task_id:task_id} });
        
        res.json({ message: "Task claimed successfully" });

    } catch (error) {
        res.status(500).json({ error: "Error starting task" });
    }
  };

const getTasks = async (req, res) => {
    try {
        const { telegram_id } = req.body;        
        const tasks = await Task.findAll({
            include: [
              {
                model: UserTask,
                as: "userTasks",
                where: { telegram_id },
                required: false,
              },
            ],
          });
      
          // Format response to include status
          const formattedTasks = tasks.map((task) => ({
            id: task.id,
            name: task.name,
            reward: task.reward,
            icon: task.icon,
            status: task.userTasks?.length ? task.userTasks[0].status : "not_started",
          }));
      
          res.json(formattedTasks);

    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  const daycoin = async (req, res) => {
    // console.log("📢 daycoin API called!"); // ✅ Logs when API is hit
    try {
        const userId = req.user?.id;
        if (!userId) {
            // console.log("❌ Unauthorized: User ID missing");
            return res.status(401).json({ message: "Unauthorized: User ID missing" });
        }
        const user = await TelegramUser.findOne({ where: { id: userId } });
        if (!user) {
            // console.log("❌ User not found");
            return res.status(404).json({ message: "User not found" });
        }
        const Euser = await User.findOne({ where: { telegram_id: user.telegram_id } });
        let tid = null;

        if (Euser) {
            tid = Euser.telegram_id; 
        }        
        // Fetch day_coin data
        const query = "SELECT * FROM day_coin";
        const results = await sequelize.query(query, { type: QueryTypes.SELECT });
         
        // console.log("✅ Day Coin Data Fetched:", results);
        return res.json({
            message: "Today Task Coin",
            data: results, // Send fetched data
            telegram_id :tid,
        });

    } catch (error) {
        console.error("❌ Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

  const claimday = async (req,res) =>{
    // console.log("day Claimed Api");
    try{
       const userId = req.user?.id;
       if(!userId){
        return res.json(401,'Unauthorised user');
       }        
       const user = await TelegramUser.findOne({where:{id: userId}});
       if(!user){
        return res.json(401,'user not found');
       }
       const Euser = await User.findOne({ where: { telegram_id: user.telegram_id } });      

        if (!Euser) {
            return res.json("Account Not Connected")
        } 
    //    const query = "SELECT * FROM coin_bundle WHERE telegram_id = :telegramId";
    //    console.log(query);
    const query = `SELECT * FROM coin_bundle WHERE telegram_id = :telegramId ORDER BY created_at DESC LIMIT 1`;
       const result = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { telegramId: user.telegram_id } // Safe query binding
    });
    const lastClaimed = result.length > 0 ? result[0].created_at : null; // Extract last claimed date
        const userClaimsCount = result.length;
     return res.json({ message: "Day task Coin", data: result, userClaimsCount,lastClaimed  });
    }
    catch(error){
       return console.error(error, "Day claim failed");
    }
  }

  const claimtoday = async (req, res) => {
    // console.log("request send", req.body);
    const userId = req.user?.id;
    const { rewardId } = req.body; // Get reward ID from request
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized user" });
    }
    try {
        // Fetch reward details from `day_coin`
        const coines = await sequelize.query(
            "SELECT * FROM day_coin WHERE id = ?",
            { replacements: [rewardId], type: sequelize.QueryTypes.SELECT }
        );
        //   console.log(coines);
        if (!coines.length) {
            return res.status(404).json({ message: "Reward not found" });
        }
        const { coins, id } = coines[0]; // Extract coin and bundle_id
        // console.log(bundle_id);
        // Fetch user details
        const user = await sequelize.query(
            "SELECT * FROM telegram_users WHERE id = ?",
            { replacements: [userId], type: sequelize.QueryTypes.SELECT }
        );
        if (!user.length) {
            return res.status(404).json({ message: "User not found" });
        }
        const telegramId = user[0].telegram_id;
        // Check last claim time
        const lastClaim = await sequelize.query(
            "SELECT * FROM coin_bundle WHERE telegram_id = ? ORDER BY created_at DESC LIMIT 1",
            { replacements: [telegramId], type: sequelize.QueryTypes.SELECT }
        );
        const Euser = await User.findOne({ where: { telegram_id: telegramId } });
         if(!Euser){
            return res.json("User Not connected");
         }
        // if (lastClaim.length) {
        //     const lastClaimedAt = new Date(lastClaim[0].created_at);
        //     const now = new Date();
        //     const timeDiff = (now - lastClaimedAt) / (1000 * 60 * 60); // Convert ms to hours

        //     if (timeDiff < 24) {
        //         return res.status(400).json({
        //             message: "Sorry, you can't claim before 24 hours have passed since your previous claim.",
        //         });
        //     }
        // }
        // Insert new claim entry with coin & bundle_id
        await sequelize.query(
            "INSERT INTO coin_bundle (telegram_id, coin, bundle_id) VALUES (?, ?, ?)",
            { replacements: [telegramId, coins, id] }
        );  
        await TelegramUser.increment({coin_balance: coins }, { where: { telegram_id: telegramId } });
        return res.json({ success: true, message: "🎉 Reward claimed successfully!" });

    } catch (error) {
        console.error("Error in claiming reward:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
   
const fatchpoint = async (req, res) =>{
    // console.log("Api fatching",req.body);
    try{
        const userId = req.user?.id; // Ensure req.user is not undefined
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID missing" });
        }
        const user = await TelegramUser.findOne({ where: { id: userId } });
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        const userCount = await TelegramUser.count();

        const total = user.coin_balance;
        const query = `SELECT SUM(coin) AS totalCoin FROM coin_bundle WHERE telegram_id = :telegramId`;
        const result = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { telegramId: user.telegram_id }, // Safe query binding
         });
         const query1 = `SELECT COALESCE(SUM(coin_balance), 0) AS totalCoin FROM telegram_users`;
         const result1 = await sequelize.query(query1, { type: QueryTypes.SELECT });    
         
         const tid =user.telegram_id;
            // console.log(Euser);
         const totalCoin = parseInt(result[0]?.totalCoin, 10) || 0; // Ensure totalCoin is an integer
         const totalallCoin = parseInt(result1[0]?.totalCoin, 10) || 0; // Ensure newBalance is a float
        //  const totalBalance = parseFloat(totalCoin) + newBalance;
         return res.json({
            telegram_id :tid,
            coin: totalCoin,
            userCount: userCount,
            coin_balance:total,
            totalallCoin:totalallCoin,
         });     
    }
    catch(error){
          return console.error("Somthing wrong in backend");
    }
  }


  
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
   

const fetchfriend = async (req, res) => {
    try {
        const userId = req.user?.id;
         console.log(userId);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID missing" });
        }

        const user = await TelegramUser.findOne({ where: { id: userId } });
        console.log(user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch friends sponsored by this user
        const friends = await TelegramUser.findAll({
            where: { sponsor: user.telegram_id }
        });
        console.log(friends);
        if (friends.length === 0) {
            return res.status(200).json({ message: "No user friends found" });
        }

        // Fetch user's invite bonus (assuming that's a column)
        const userData = await TelegramUser.findOne({
            where: { telegram_id: user.telegram_id },
            attributes: ['invite_bonus'] // only fetch invite_bonus field
        });

        return res.status(200).json({
            message: "Friends fetched successfully",
            totalFriends: friends.length,
            inviteBonus: userData?.invite_bonus || 0,
            friends
        });

    } catch (error) {
        console.error("Error in fetchfriend:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

 
module.exports = { getUserByTelegramId,getTasks,startTask,claimTask,updateBalance, daycoin, claimday,claimtoday ,fatchpoint,fatchBalance, fetchfriend};
