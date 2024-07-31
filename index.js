import http from "http";
import path from "path";
import { spawn } from "child_process";
import express from "express";
import { Server as SocketIO } from "socket.io";
import cors from "cors";

const app = express();
const app2 = express();
const server = http.createServer(app);
const io = new SocketIO(server);

let ffmpegProcess;

app2.use(express.json());
app2.use(express.urlencoded({ extended: false }));
const corsOptions = {
  origin: "*",
  methods: "GET, POST, DELETE, PATCH, PUT, HEAD",
};

app2.use(cors(corsOptions));
app2.post("/api", (req, res) => {
  const { rtmpUrl } = req.body;
  console.log("Received RTMP URL:", rtmpUrl);

  const options = [
    "-i",
    "-",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "zerolatency",
    "-r",
    "25",
    "-g",
    "50",
    "-keyint_min",
    "25",
    "-crf",
    "25",
    "-pix_fmt",
    "yuv420p",
    "-sc_threshold",
    "0",
    "-profile:v",
    "main",
    "-level",
    "3.1",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ar",
    "32000",
    "-f",
    "flv",
    rtmpUrl,
  ];

  // Start the ffmpeg process with the RTMP URL
  ffmpegProcess = spawn("ffmpeg", options);

  ffmpegProcess.stdout.on("data", (data) => {
    console.log(`ffmpeg stdout: ${data}`);
  });

  ffmpegProcess.stderr.on("data", (data) => {
    console.error(`ffmpeg stderr: ${data}`);
  });

  ffmpegProcess.on("close", (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
    ffmpegProcess = null; // Reset the process to null when it closes
  });

  res.sendStatus(200); // Respond with success
});

app.use(express.static(path.resolve("./public")));

io.on("connection", (socket) => {
  console.log("Socket Connected", socket.id);
  socket.on("binarystream", (stream) => {
    if (ffmpegProcess && !ffmpegProcess.killed) {
      console.log("Binary Stream Incoming...");
      ffmpegProcess.stdin.write(stream, (err) => {
        if (err) console.log("Err", err);
      });
    } else {
      console.error("FFmpeg process is not running.");
    }
  });
});

app2.listen(4000, () => console.log(`API Server is running on PORT 4000`));
server.listen(3000, () => console.log(`HTTP Server is running on PORT 3000`));
