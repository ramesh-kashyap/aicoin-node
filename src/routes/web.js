const express = require('express');
let router = express.Router();
const AuthController = require("../controllers/AuthController");
const IncomeController = require("../controllers/incomeController");
const TelegramController = require("../controllers/TelegramController");
const teleAuthController = require("../controllers/teleAuthController");
const InvestController = require("../controllers/InvestController");
const withdrawController = require("../controllers/withdrawController");
const profileController = require("../controllers/profileController");

const userController = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware"); // JWT Auth Middleware
const teleMiddleware = require("../middleware/teleMiddleware");
const  homeController= require('../controllers/homeController');
const passport = require('passport');

const googleController = require('../controllers/googleController');
const teamController = require('../controllers/teamController');
const helper = require('../helper/helper');


router.post('/google', googleController.verifyGoogleToken);
router.post('/register', AuthController.register);
router.post('/set-pin', AuthController.setPin);
router.post('/forgot', AuthController.forget);
router.post('/forget-otp', AuthController.forgetOtp);
router.get("/user-income", authMiddleware, IncomeController.getUserIncome);
router.get("/level-income", authMiddleware, IncomeController.getLevelIncome);
router.get("/Direct-income", authMiddleware, IncomeController.getDirectIncome);
router.get("/Direct-user", authMiddleware, IncomeController.getReferralUser);
router.post('/conformPass', AuthController.confirmPass);
// router.post("/team", authMiddleware ,teamController.getTeam);
router.get('/list', authMiddleware, teamController.listUsers);
// // router.post("/team", authMiddleware,teamController.getTeam);
// router.post('/list', authMiddleware, teamController.fetchUserWithReferralIncome);
// router.post('/team-income',  teamController.distributeCommissions);
router.post('/login', AuthController.login);
router.get("/deposit-History", authMiddleware, InvestController.getHistory);
router.post("/stake-record",  InvestController.StakeRecord);
router.get("/withdraw-History", authMiddleware, withdrawController.getWithdrawHistory);
router.post('/verify-pin',authMiddleware, AuthController.verifyPin);
router.get('/live-data',authMiddleware, homeController.getLiveData);
router.get('/news',authMiddleware, homeController.getAllNews);
router.get('/getBalance',authMiddleware, homeController.getAvailableBalance);
router.get('/getNotifications',authMiddleware, homeController.getNotifications);
router.post('/updatePin',authMiddleware, AuthController.updatePin);
router.get('/user-incomes',authMiddleware, userController.userIncomes);
router.get('/all-income', authMiddleware, IncomeController.allIncome);

router.get('/get-telegram-coin', authMiddleware, profileController.telegramToken);

router.put('/updateUsername', authMiddleware, profileController.updateUserProfile);
router.put('/updateFullName', authMiddleware, profileController.updateUserFullName);
router.post("/withdraw", authMiddleware, withdrawController.withdraw);
router.post("/verify-otp", authMiddleware, withdrawController.verifyOtp);
router.post("/generate-otp", authMiddleware, withdrawController.generateOtp);
router.post("/authverify-otp",  helper.verifyOtp);
router.post("/authgenerate-otp",  helper.generateOtp);
// router.get('/balance',authMiddleware, userController.getAvailableBalance);



 
// telegram api 
router.post('/telegram-login', teleAuthController.loginWithTelegram);
router.post('/telegram-user-detail', TelegramController.getUserByTelegramId);
router.post('/connect', teleAuthController.connect);
router.post('/verify-otp-connect', teleAuthController.otp);
router.post('/updateBalance', teleMiddleware,TelegramController.updateBalance);
router.post('/getTasks', TelegramController.getTasks);
router.post('/startTask', TelegramController.startTask);
router.post('/claimTask', TelegramController.claimTask);

// router.post('/connect', AuthController.otp);
router.post('/baycoin', teleMiddleware,TelegramController.daycoin);
router.post('/claim-day', teleMiddleware,TelegramController.claimday);
router.post('/claim-reward',teleMiddleware,TelegramController.claimtoday);
router.post('/fatchPoint',teleMiddleware,TelegramController.fatchpoint);
router.post('/fatchBalance', teleMiddleware,TelegramController.fatchBalance);



// Mount the router on /api/auth so that /register becomes /api/auth/register
const initWebRouter = (app) => {
    app.use('/api/auth', router);
  };

module.exports = initWebRouter;
