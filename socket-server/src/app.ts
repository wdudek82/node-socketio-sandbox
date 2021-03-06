import express, { Express } from "express";
import cors from "cors";
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import path from "path";
import { Message } from "../models/message";
import { ChatUser } from "../models/chat-user";

const corsOptions = {
  origin: "*",
  method: "GET, POST, PUT",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

class App {
  private readonly port: number;
  private readonly app: Express;
  private readonly httpServer: HttpServer;
  private chatUsers: ChatUser[] = [];
  private socketsIds: string[] = [];

  constructor(port: number) {
    this.port = port;
    this.app = express();
    this.httpServer = new HttpServer(this.app);

    this.enableMiddlewares();
    this.enableRouting();
  }

  private enableMiddlewares(): void {
    this.app.use(express.static(path.join("../client")));
    this.app.use(cors(corsOptions));
  }

  private enableRouting(): void {
    this.app.get("/", (req, res): void => {
      res.sendFile(path.resolve("../client/index.html"));
    });
  }

  public start(): void {
    this.httpServer.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`);
    });
  }

  public startIo(): void {
    const io: Server = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    io.on("connection", (socket: Socket) => {
      this.handleSelfConnected(socket);

      this.getConnectedUsers(io.sockets.sockets);

      this.handleNewClientConnected(io);
      this.handleMessageEvent(io, socket);
      this.handleClientDisconnect(io, socket);
    });
  }

  private handleSelfConnected(socket: Socket) {
    socket.emit("youAreConnected", true)
    this.socketsIds.push(socket.id);
  }

  private handleNewClientConnected(io: Server) {
    io.sockets.emit("newUserConnected", this.chatUsers);
  }

  private handleMessageEvent(io: Server, socket: Socket): void {
    socket.on("message", (message: Message) => {
      console.log("Message received:", message);

      io.sockets.emit("message", message);
    });
  }

  private handleClientDisconnect(io: Server, socket: Socket): void {
    socket.on("disconnect", (reason) => {
      console.log("user disconnected:", reason);
      this.getConnectedUsers(io.sockets.sockets);
      io.sockets.emit("userDisconnected", this.chatUsers);
    });
  }

  private getConnectedUsers(srvSockets: Map<string, Socket>): void {
    this.chatUsers = [];
    this.socketsIds.forEach((sid) => {
      const srvSocket = srvSockets.get(sid);
      if (srvSocket && srvSocket["connected"]) {
        this.chatUsers.push({ id: sid, username: ""});
      } else {
        this.socketsIds = this.socketsIds.filter((socketId) => socketId !== sid);
      }
    });
  }
}

const port = 3000;
const app: App = new App(port);

app.start();
app.startIo();
