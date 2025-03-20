const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TelegramUser = require("../models/telegram"); 
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN"
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: Token missing" });
        }



        // Token Verify Karna
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

       
        
        // User Fetch Karna
        const user = await User.findByPk(decoded.id);      
        

        if (!user) {
    return res.status(401).json({ error: "Unauthorized: User not found" });
}
            req.user = user;
        
         // ✅ `req.user` me login user store karein
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({ error: "Invalid token", details: error.message });
    }
};

module.exports = authMiddleware;
