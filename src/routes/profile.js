  const express  = require('express');
 const { auth } = require("../middlewares/auth");  // Change this line at the top of your file

  const profileRouter = express.Router();

  profileRouter.get("/profile", auth , async (req, res) => {
    try {
      
      const user = req.user
      if (!user) {
        return res.status(404).json({ message: "User does not exist" });
      }
  
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

      
  module.exports  =  profileRouter;