require("dotenv").config({ path: "./src/config/.env" });
const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  gender: {
    type: String,
    required: true,
    validate(value) {
      if (value !== "M" && value !== "F") {
        throw new Error("Gender is invalid");
      }
    },
  },
  dob: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isDate(value)) {
        throw new Error("Date is invalid");
      }
    },
  },
  password: { type: String, required: true },
  list: { type: Array },

  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Check if user exists and password
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User does not exists");
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Password is incorrect");
  return user;
};

// Generate Auth tokens
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, process.env.JWT_KEY, { expiresIn: "5h" });
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
