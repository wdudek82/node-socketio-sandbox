import express, { Express } from "express";
import cors from "cors";
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import path from "path";

const corsOptions = {
  origin: "*",
  method: "GET, POST, PUT",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

class App {
  private readonly port: number;
  private readonly app: Express;
  private readonly httpServer: HttpServer;

  constructor(port: number) {
    this.port = port;
    this.app = express();
    this.httpServer = new HttpServer(this.app);

    this.enableMiddlewares();
    this.enableRouting();
  }

  private enableMiddlewares(): void {
    this.app.use(express.static(path.join(__dirname, "../client")));
    this.app.use(cors(corsOptions));
  }

  private enableRouting(): void {
    this.app.get("/", (req, res, next): void => {
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
      console.log("a user connected:", socket.id);

      socket.on("message", (message: string) => {
        console.log("Message received:", message);

        io.sockets.emit("message", message);
      });
    });
  }
}

const port = 3000;
const app: App = new App(port);

app.start();
app.startIo();
