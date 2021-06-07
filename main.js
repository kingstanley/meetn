const express = require("express");
const { v4: uuid4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
const moment = require("moment");

const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// app.engine(".hbs", exphbs({ extname: ".hbs" }));
// app.set("view engine", ".hbs");
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(bodyParser({ extended: true, limit: "5000mb" }));
app.use(cors());
app.options("*", cors());

// connect to mongodb using mongoose
mongoose
  .connect("mongodb://localhost:27017/ESPDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: true,
  })
  .then((con) => {
    console.log("Connected to mongo db ");
  })
  .catch((err) => console.log("Mongo Error: ", err.message));

// import models
const Lecture = require("./models/lecture");
const User = require("./models/user");

app.get("/", (req, res) => {
  res.render("index", { host: req.hostname });
  // res.redirect(`/${uuid4()}`);
});

app.get("/:room", async (req, res) => {
  try {
    const type = req.query.type;
    const uin = req.query.uin;
    const host = req.hostname || "localhost";
    const lectureId = req.params.room;
    console.log("UIN: ", parseInt(uin));
    // console.log("User Type: ", type, "uin: ", uin, " lectureId: ", lectureId);
    let user;
    let lecture;
    if (type && uin && lectureId) {
      lecture = await Lecture.findOne({ _id: lectureId.trim() });
      // console.log("User: ", user);
      // console.log("Lecture: ", lecture);
    } else {
      return res.render("error", {
        errors: {
          typeError: "No user type",
          uinError: "No UIN",
          lectureError: "No Lecture Id",
        },
        layout: "layout/layout",
      });
    }
    console.log("host: ", host);
    return res.render("room", {
      host,
      roomId: lectureId,
      type: type,
      UIN: uin,
      commentList: lecture?.comments,
      lecture,
      layout: false,
    });
  } catch (error) {
    console.log("Error 1: ", error);
  }
});
app.get("/user/:uin", async (req, res) => {
  const uin = req.params.uin;
  const user = await User.findOne({ UIN: uin });
  res.json(user);
});
app.post("/formatdate", (req, res) => {
  const date = req.body.date;
  const fromNow = moment(date).fromNow();
  res.json({ fromNow });
});
app.post("/comment", async (req, res) => {
  try {
    const data = req.body;
    console.log("Comment: ", data);
    const found = await Lecture.findOne(
      { _id: data.lectureId }
      // {
      //   comments: { $push: { UIN: data.UIN, comment: data.comment } },
      // }
    );
    if (found) {
      found.comments.unshift(data);
      const saved = await found.save();
      const comment = saved.comments[0];
      comment.commentDate = moment(comment.commentDate);
      return res.json(comment);
    }
    return res.json({ message: "Comment not saved" });
  } catch (error) {
    console.log("Error 2: ", error.message);
  }
});
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const peerServer = ExpressPeerServer(server, {
  path: "/",
});
app.use("/", peerServer);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("app started on ", port);
});

io.on("connection", (socket) => {
  socket.on("disconnect", (userId) => {
    console.log("discconnected Id: ", userId);
    socket.emit("user-disconnected", userId);
  });
  console.log("socketId: ", socket.id);
  socket.on("join-room", (roomId, peerId, usertype) => {
    console.log(" roomId: ", roomId, " peerId: ", peerId, usertype);
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", peerId, usertype);

    // Handle comments request
    socket.on("request-comments", async (lectureId) => {
      console.log("LectureId: ", lectureId);
      const lecture = await Lecture.findOne({ _id: lectureId });
      const sortedComments = lecture.comments.sort(
        (a, b) =>
          new Date(a.commentDate).getTime() - new Date(b.commentDate).getTime()
      );
      socket.emit("get-comments", sortedComments);
    });

    socket.on("request-user", async (uin) => {
      const user = await User.findOne({ UIN: uin });
      // console.log("User: ", user);
      socket.emit("get-user", user);
    });

    socket.on("new-comment", (data) => {
      // console.log("new comment: ", data);
      socket.to(roomId).emit("new-comment", data);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", peerId);
    });
  });
});
