
 const mongoose = require("mongoose");

  const connectDb = async ()=> {


       await mongoose.connect(
        
<<<<<<< HEAD
  process.env.DB_CONNECTION_SECRET
=======
              process.env.DB_CONNECTION_SECRET
>>>>>>> 711f781 (Adding the feature of Email  when user sends the request or  made the connection . done by aws Ses)

        
       );
   }
   module.exports  = connectDb;
