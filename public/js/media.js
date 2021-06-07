const socket = io("/");
// import * as dayjs from "./dayjs.min.js";

peers = {};
const videGrid = document.getElementById("video-grid"); // Getting our video grid div
const teacherGrid = document.getElementById("teacher"); // Getting our video grid div
const peer =
  host == "localhost"
    ? new Peer(
        undefined, // to let the server handle id generation. assign a value to manage it yourself
        { host: "/", port: "3000", path: "/" }
      )
    : new Peer(
        undefined, // to let the server handle id generation. assign a value to manage it yourself
        { host: host, path: "/" }
      );
const myVideo = document.createElement("video");
myVideo.muted = true;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: {
      width: { ideal: 600 },
      height: { ideal: 450 },
      facingMode: "user",
    },
  })
  .then(async (stream) => {
    // handle comments
    socket.on("get-comments", async (comList) => {
      comments = comments;
      console.log("Gotten comments: ", comList);
      const div = document.getElementById("commentList");
      for (const comment of comList) {
        await createCommentLi(comment, div);
      }
    });
    socket.emit("request-comments", ROOM_ID);
    socket.on("new-comment", async (comment) => {
      const div = document.getElementById("commentList");
      await createCommentLi(comment, div);
    });
    socket.emit("request-user", UIN);
    socket.on("get-user", (user) => {
      console.log("User: ", user);
      USER = user;
    });
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const peerVideo = document.createElement("video");

      call.on("stream", (peerStream) => {
        addVideoStream(peerVideo, peerStream);
      });
    });
    socket.on("user-connected", (peerId, usertype) => {
      console.log("new user type: ", usertype);
      connectToNewUser(peerId, stream, usertype);
    });

    socket.on("user-disconnected", (peerId) => {
      console.log("disconnected userId: ", peerId);
      if (peers[peerId]) {
        peers[peerId].close();
      }
    });
  })
  .catch((err) => console.log("Media Error: ", err));

peer.on("open", (peerId) => {
  console.log("My PeerId: ", peerId);

  socket.emit("join-room", ROOM_ID, peerId, type);
});

function addVideoStream(video, stream, usertype) {
  video.srcObject = stream;
  //   console.log("My stream: ", stream);
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  if (
    type == "lt" ||
    type == "teacher" ||
    usertype == "lt" ||
    usertype == "teacher"
  ) {
    // video.style.width = "90%";
    console.log(" user is teacher");
    video.className = "video1";
    teacherGrid.append(video);
  } else {
    console.log("user is student");
    video.className = "video2";
    videGrid.append(video);
  }
}

async function createCommentLi(comment, div) {
  const container = document.createElement("div");
  container.classList = "list-group-item list-group-item-action ";
  const username = document.createElement("span");
  const header = document.createElement("div");
  header.classList = "d-flex w-100 justify-content-between";
  const small = document.createElement("small");
  small.classList = "comment-date text-warning";
  username.classList = "m-2 fw-bold mb-1";
  const span2 = document.createElement("span");

  const commentP = document.createElement("p");
  commentP.classList = "mb-1";

  username.textContent = comment?.username.split("@")[0] + "  ";

  commentP.textContent = comment.comment;

  small.textContent = await formatDate({ date: comment.commentDate });

  header.append(username);
  header.append(small);

  container.append(header);
  container.append(commentP);
  div.append(container);
}

function connectToNewUser(peerId, stream, usertype) {
  const alreadyExist = peers[peerId];
  if (!alreadyExist) {
    const call = peer.call(peerId, stream);
    call.on("stream", (userVideoStream) => {
      const userVideoExist = getElementById(peerId);
      if (!userVideoExist) {
        const userVideo = document.createElement("video");
        userVideo.id = peerId;
        addVideoStream(userVideo, userVideoStream, usertype);
      } else {
        console.log("User video already exist");
      }
      call.on("close", () => {
        userVideo.remove();
      });
    });
    peers[peerId] = call;
  }
}
