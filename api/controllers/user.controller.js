const User = require("../models/user");
const jwt = require("jsonwebtoken");
const brcrypt = require("bcryptjs");
const sendOtp = require("../utils/sendOtp")

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({
        message: "All Fields are required (name, email, password)",
      });
    }
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~])[A-Za-z\d!@#$%^&*()_\-+=<>?{}[\]~]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character.",
      });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const otp = Math.floor(100000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      console.log("User found:", user);
      console.log("Current Date: ", new Date());
      console.log("OTP Expires At: ", user.otpExpiresAt);

      const otpExpiryDate = new Date(user.otpExpiresAt);

      if (!user.isVerified && new Date() > otpExpiryDate) {
        console.log("Deleting unverified user", normalizedEmail);
        const deleteResult = await User.deleteOne({ email: normalizedEmail });
        console.log("Delete result:", deleteResult);

        user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          console.log("User deleted successfully, no user found.");
        } else {
          console.log("User still found after deletion", user);
        }
      }

      if (user) {
        console.log("User with this email already present");
        return res.status(400).json({
          message: "User present with this email",
        });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await sendOtp(normalizedEmail, otp);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      otp,
      otpExpiresAt,
    });

    await newUser.save();

    return res.status(200).json({
      message: "OTP sent successfully to your email",
      userId: newUser._id,
      email: newUser.email,
    });
  } catch (err) {
    res.status(500).json({
      message: `Some Error Occured:-  ${err}`,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).session(
      session
    );
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.otp || !user.otpExpiresAt) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "No valid OTP found. Please request a new OTP.",
      });
    }

    const isOtpValid =
      String(user.otp) === String(otp) && user.otpExpiresAt > Date.now();

    if (!isOtpValid) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save({ session });
    await session.commitTransaction();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("verifyOtp error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  } finally {
    session.endSession();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    return res.status(400).json({
      message: "Email and password are required",
    });

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your account before login",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        joinedSince: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    console.log("Decoded JWT:", decoded);

    if (!decoded.id) {
      return res
        .status(400)
        .json({ message: "Invalid token: missing user ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
