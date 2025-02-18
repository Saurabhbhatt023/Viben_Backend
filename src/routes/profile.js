  const express  = require('express');
 const { auth } = require("../middlewares/auth");  // Change this line at the top of your file
 const {validateEditProfileData}  = require("../utils/validation")
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

  profileRouter.patch("/profile/edit" , auth, async (req , res) => {
     try { 

      if(validateEditProfileData(req)){
         throw new Error("invalid Edit Request")
      }

      const loggedInUser = req.user;
      Object.keys(req.body).forEach( (key)=> {loggedInUser(key) = req.body[key]})

       console.log(loggedInUser);

       res.send( `${loggedInUser.firstName} , Profile updated Successfully`)
     } catch (err){


      res.status(400).json({ message: "Something went wrong" });

     }
  })
      
  module.exports  =  profileRouter;