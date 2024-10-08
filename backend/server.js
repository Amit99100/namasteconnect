//Express is imported 
const express = require("express");

const connectDB = require("./config/db");

//cors error , get removed by using cors npm 
var cors = require('cors')



// importing dotenv file for .env my port , secret key , password etc . 
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");


// using dotenv imported 
dotenv.config();
//connecting data base 
connectDB();


require('dotenv').config({ path: path.resolve(__dirname, './env') })



// Instance of express of variable 
const app = express();
app.use(cors());
app.use(express.json()); //I nedd   to  tell server . accept json data






//End point for users etc . 
app.use("/api/user", userRoutes);

//for chat 
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Deplyment 
//current working direcory 

NODE_ENV = "production"
const __dirname1 = path.resolve();
if (NODE_ENV === "production") {

  app.use(express.static(path.join(__dirname1, '/frontend/build')));

  // *for everything 
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
  })

} else {

  app.get("/", (req, res) => {
    res.send("API Running!");
  });


}


// Error Handling middlewares if users is serching some wrong url 
//which is not present from our 
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

const server = app.listen(
  process.env.PORT,
  console.log(`Server running on PORT ${PORT}...`.blue.bold)
);

const io = require("socket.io")(server, {
  // pingTimout is amount of time it will being inactive . 
  //after 60 seconds if no one sends the message it will close the  connnection to 
  // save bandwithd . .
  pingTimeout: 60000,
  cors: {
    // origin: "http://localhost:3000",
    origin: "https://namasteconnect.onrender.com",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");


    //message should recive to other not to me . 
    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
