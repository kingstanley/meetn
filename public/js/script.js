function submitComment(data) {
  // console.log("Data: ", data);
  fetch("http://localhost:3000/comment", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify(data),
  })
    .then((result) => {
      const json = result.json();
      json.then((data) => {
        socket.emit("new-comment", data);
        const div = document.getElementById("commentList");
        createCommentLi(data, div);
      });
      // console.log("Comment data: ",json.then(data)));
    })
    .catch((err) => console.log("Error: ", err));
}

async function formatDate(date) {
  const result = await fetch("http://localhost:3000/formatdate", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify(date),
  });
  const data = await result.json();
  // console.log("formatdate: ", data.fromNow);
  return data.fromNow;
}
