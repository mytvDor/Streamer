const userVideo = document.getElementById("user-video");
const startButton = document.getElementById("start-btn");

const state = { media: null };
const socket = io();
let strcode = "YOUR_YT_CODE"
startButton.addEventListener("click", async () => {
  const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${strcode}`;

  try {
    const response = await fetch("http://localhost:4000/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rtmpUrl }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    console.log("RTMP URL sent to server successfully");
  } catch (error) {
    console.error("Failed to send RTMP URL to server:", error);
  }

  const mediaRecorder = new MediaRecorder(state.media, {
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000,
    framerate: 25,
  });

  mediaRecorder.ondataavailable = (ev) => {
    console.log("Binary Stream Available", ev.data);
    socket.emit("binarystream", ev.data);
  };

  mediaRecorder.start(25);
});

window.addEventListener("load", async (e) => {
  const media = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  state.media = media;
  userVideo.srcObject = media;
});
