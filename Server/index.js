  const express = require("express");
  const http = require("http");
  const { Server } = require("socket.io");
  const mongoose = require("mongoose");
  const cors = require("cors");
  const session = require("express-session");

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://ctf-round-client.vercel.app"], // Allow frontend
      methods: ["GET", "POST"], // Allow these HTTP methods
      credentials: true, // Allow cookies & authentication
    },
  });

  // Middleware
  app.use(cors({ origin: ["http://localhost:5173", "https://ctf-round-client.vercel.app"], credentials: true }));

  mongoose.connect("mongodb+srv://CSI:CSI%40123@cluster0.1eckj.mongodb.net/CTF-Round", { useNewUrlParser: true });

  // app.use(cors({origin : '*'}));
  app.use(express.json());
  app.use(session({ secret: "secretKey", resave: false, saveUninitialized: true }));

  const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    deviceId: String,  // Unique identifier for a device
    roomId: String,
    progress: { type: Number, default: 0 }
  });
  const User = mongoose.model("User", UserSchema);

  const RoomSchema = new mongoose.Schema({
    roomId: String,
    users: [String]  // Store user IDs
  });
  const Room = mongoose.model("Room", RoomSchema);

  // Middleware to check unique device login
  const checkUniqueDevice = async (req, res, next) => {
    const { email, deviceId } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.deviceId !== deviceId) {
      return res.status(403).json({ message: "Multiple devices not allowed" });
    }

    next();
  };

  // User login and assign to a room
  app.post("/login", checkUniqueDevice, async (req, res) => {
    const { username, email, deviceId } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      let room = await Room.findOne({ $expr: { $lt: [{ $size: "$users" }, 30] } });
      if (!room) {
        room = new Room({ roomId: `room-${Date.now()}`, users: [] });
        await room.save();
      }

      user = new User({ username, email, deviceId, roomId: room.roomId });
      room.users.push(user._id);
      await room.save();
      await user.save();
    }

    res.json({ message: "Login successful", roomId: user.roomId, userId: user._id });
  });

  // Handle progress update
  app.post("/update-progress", async (req, res) => {
      const { userId, checkpoint } = req.body;
      const user = await User.findById(userId);
    
      if (user && checkpoint <= 10) {
        user.progress = checkpoint;
        await user.save();
    
        // Broadcast progress update to all users in the room, including admin
        io.to(user.roomId).emit("progressUpdate", { userId, checkpoint });
    
        res.json({ message: "Progress updated" });
      } else {
        res.status(400).json({ message: "Invalid checkpoint" });
      }
    });

  //   app.post("/get-progress", async (req, res) => {
  //     const { userId} = req.body;
  //     const user = await User.findById(userId);
  //     console.log(user.progress);
  //     if (user) {
  //       const userprogress=user.progress;
  //       return res.json({ data : userprogress});
  //     } else {
  //       res.status(400).json({ message: "Invalid checkpoint" });
  //     }
  //   });


  app.get("/player/progress/:userId", async (req, res) => {
      try {
        const user = await User.findById(req.params.userId);
        if (user) {
          res.json({ progress: user.progress });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
    
  // Get progress for admin
  app.get("/admin/progress/:roomId", async (req, res) => {
    const players = await User.find({ roomId: req.params.roomId }).select("username progress");
    res.json(players);
  });

  app.get("/", (req, res) => {
    res.send("<h1>Hello!</h1>");
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  server.listen(5000, () => console.log("Server running on port 5000"));
