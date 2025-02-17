  const express  = require('express');
const { auth } = require("../middlewares/auth");  // Change this line at the top of your file
  const requestRouter = express.Router();

  requestRouter.post("/sendConnectionRequest",auth , async (req , res) => {


    const user  = req.user;
   console.log("Sending the  connection request ");
 
     res.send(user.firstName + "Sent the connection request");
    
 
   res.send("Connection Request Send");
 })
      
  module.exports  =  requestRouter;