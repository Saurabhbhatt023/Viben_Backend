const { subDays, endOfDay, startOfDay, addMinutes } = require("date-fns");
const ConnectionRequest = require("../models/connectionRequest");
const sendEmail = require("./sendEmail");

/**
 * Schedules email notification job to run at a specific time
 * @param {number} minutesFromNow - Minutes from now to run the job
 * @returns {NodeJS.Timeout} - Timeout object for the scheduled job
 */
const scheduleEmailJob = (minutesFromNow = 4) => {
  const now = new Date();
  const scheduledTime = addMinutes(now, minutesFromNow);
  
  console.log(`Current time: ${now.toLocaleTimeString()}`);
  console.log(`Job scheduled for: ${scheduledTime.toLocaleTimeString()}`);
  
  const timeoutMillis = minutesFromNow * 60 * 1000;
  
  // Schedule the job to run after the specified delay
  const timeoutId = setTimeout(async () => {
    console.log(`Running scheduled job at: ${new Date().toLocaleTimeString()}`);
    
    try {
      // Get yesterday's date range
      const yesterday = subDays(new Date(), 1);
      const yesterdayStart = startOfDay(yesterday);
      const yesterdayEnd = endOfDay(yesterday);
      
      console.log(`Checking for pending requests between ${yesterdayStart.toISOString()} and ${yesterdayEnd.toISOString()}`);
      
      // Find pending requests from yesterday
      const pendingRequests = await ConnectionRequest.find({
        status: "interested",
        createdAt: {
          $gte: yesterdayStart,
          $lte: yesterdayEnd
        }
      }).populate("fromUserId toUserId");
      
      console.log(`Found ${pendingRequests.length} pending requests`);
      
      if (pendingRequests.length === 0) {
        console.log("No pending requests found to send emails for.");
        return;
      }
      
      // Extract unique recipient emails
      const listOfEmails = [...new Set(pendingRequests.map(req => 
        req.toUserId && req.toUserId.emailId ? req.toUserId.emailId : null
      ).filter(email => email !== null))];
      
      console.log(`Sending reminders to ${listOfEmails.length} users`);
      
      // Send email to each recipient
      for (const email of listOfEmails) {
        try {
          const subject = "Pending Connection Requests";
          const body = `You have pending connection requests on VibenWeb. Please log in to review them.`;
          
          const res = await sendEmail.run(subject, body, email);
          console.log(`Email sent successfully to ${email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
        }
      }
      
      console.log("Scheduled job completed successfully");
    } catch (err) {
      console.error("Error in scheduled job:", err);
    }
  }, timeoutMillis);
  
  return timeoutId;
};

module.exports = { scheduleEmailJob };