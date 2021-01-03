const ioButton = document.getElementById("io-btn");
const mainInput = document.getElementById("main-input");
const chatMsgWindow = document.getElementById("chat-messages");
const chatUsersWindow = document.getElementById("chat-users");
const usernameInput = document.getElementById("username");
const userColorInput = document.getElementById("user-color");

loadChatData();
let userColor = userColorInput.value;

if (!usernameInput.value) {
  usernameInput.value = `User-${makeid(5)}`;
}

ioButton.addEventListener("click", sendMsg);
mainInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMsg();
  }
});
userColorInput.addEventListener("change", (e) => {
  userColor = userColorInput.value;
  usernameInput.style.color = userColorInput.value;
  saveChatData();
});

// const host = "http://localhost:3000"; // local testing
const host = "http://943a2bd1d1bb.ngrok.io";

const socket = io(host, {
  // withCredentials: true,
});

socket.on("youAreConnected", () => {
  const text = `--- Connected to the chat ---`;
  createNotificationNode(text);
});

socket.on("newUserConnected", (chatUsers) => {
  console.log(chatUsers);
  createNotificationNode(`--- New user connected ---`);
  showUserList(chatUsers);
});

socket.on("userDisconnected", (chatUsers) => {
  createNotificationNode(`--- User disconnected ---`);
  showUserList(chatUsers);
})

socket.on("message", ({ username, payload, color }) => {
  const messageNode = createMessageNode(username, payload, color);
  chatMsgWindow.append(messageNode);

  chatMsgWindow.scrollTop = chatMsgWindow.scrollHeight;
});

function showUserList(chatUsers) {
  chatUsersWindow.innerHTML = null;
  chatUsers.forEach((u) => {
    console.log(u);
    const userNode = createNode(u.id, "p");
    userNode.classList.add("chat__user");
    chatUsersWindow.append(userNode);
  });
}

function createMessageNode(username, payload, color = "#000") {
  const userNameEl = createNode(username + ": ");
  userNameEl.classList.add("user-name");
  userNameEl.style.color = color;

  const messageEl = document.createElement("p");
  messageEl.appendChild(createNode(`[${getTimestamp()}] `));
  messageEl.appendChild(userNameEl);
  messageEl.appendChild(createNode(payload));
  messageEl.classList.add("message");

  return messageEl;
}

function createNotificationNode(text) {
  const notification = createNode(
    `[${getTimestamp()}] ${text}`,
    "p"
  );
  notification.classList.add("notification");
  chatMsgWindow.append(notification);
}

function createNode(text = "", elType = "span") {
  const el = document.createElement(elType);
  el.innerText = text;

  return el;
}

function loadChatData() {
  const ngExpressSocketIoChatData = JSON.parse(
    localStorage.getItem("ngExpressSocketIoChatData")
  );

  usernameInput.style.color = getRandomColor();
  if (ngExpressSocketIoChatData) {
    userColorInput.value = ngExpressSocketIoChatData["userColor"];
    usernameInput.style.color = userColorInput.value;
  }
}

function saveChatData() {
  const ngExpressSocketIoChatData = {
    userColor,
  };
  localStorage.setItem(
    "ngExpressSocketIoChatData",
    JSON.stringify(ngExpressSocketIoChatData)
  );
}

function sendMsg() {
  const username = usernameInput.value;
  const payload = mainInput.value;

  if (!username || !payload) return;
  mainInput.value = "";

  socket.emit("message", {
    id: socket.id,
    username,
    payload,
    color: userColor,
  });
}

function getTimestamp() {
  return new Date().toLocaleTimeString();
}

function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
