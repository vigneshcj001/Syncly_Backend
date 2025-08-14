const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const sendEmail = require("./SendEmail");
const SwipeModel = require("../models/swipe");

// This job will run at 8 AM in the morning every day
cron.schedule("0 8 * * *", async () => {
  try {
    const yesterday = subDays(new Date(), 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    // Find all requests from yesterday with connectionStatus "Vibe"
    const pendingRequests = await SwipeModel.find({
      connectionStatus: "Vibe",
      createdAt: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    }).populate("recipientID initiatorID");

    // Get unique recipient emails
    const listOfEmails = [
      ...new Set(pendingRequests.map((req) => req.recipientID.emailID)),
    ];

    console.log("Emails to notify:", listOfEmails);

    // Send reminder emails
    for (const email of listOfEmails) {
      try {
        const res = await sendEmail.run(
          "New Friend Requests pending for " + email,
          "There are friend requests pending. Please log in to DevTinder.in to accept or reject the requests."
        );
        console.log("Email sent to", email, ":", res);
      } catch (err) {
        console.error("Failed to send email to", email, ":", err);
      }
    }
  } catch (err) {
    console.error("Cron job error:", err);
  }
});
