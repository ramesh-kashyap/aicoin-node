const { OAuth2Client } = require('google-auth-library');
const db = require("../config/connectDB");
const { User } = require('../models'); // Import User model


const jwt = require('jsonwebtoken');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(req, res) {
  try {
      const { token } = req.body;
      console.log("Token received:", token);

      if (!token || typeof token !== "string") {
          throw new Error("Invalid token: Expected a non-empty string");
      }

      // Verify Google token
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      // Extract user details from Google payload
      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name || '';

      // Find or create the user in the database
      let user = await User.findOne({ where: { google_id: googleId } });

      if (!user) {
          user = await User.create({
              google_id: googleId,
              email: email,
              name: name,
          });
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
          {
              userId: user.id,
              googleId: user.google_id,
              email: user.email,
          },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
      );

      console.log('JWT Token generated:', jwtToken);

      return res.status(201).json({ success: true, jwtToken });

  } catch (error) {
      console.error('Error verifying Google token:', error);
      return res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
}

module.exports = { verifyGoogleToken };
