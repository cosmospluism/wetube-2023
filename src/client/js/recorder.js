// import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
const startBtn = document.getElementById("startBtn");
const startBtnIcon = startBtn.querySelector("i");
const videoPreview = document.getElementById("preview");
const downloadBtn = document.getElementById("downloadBtn");

let stream; // 전역변수 선언
let recorder;
let videoFile;

const handleDownload = async () => {
  // const ffmpeg = createFFmpeg({
  //   corePath: "https://unpkg.com/@ffmpeg/core@0.8.5/dist/ffmpeg-core.js",
  //   log: true,
  // });
  // await ffmpeg.load();

  // ffmpeg.FS("writeFile", "recording.webm", await fetchFile(videoFile));
  // await ffmpeg.run("-i", "recording.webm", "-r", "60", "output.mp4");

  // const mp4File = await ffmpeg.FS("readFile", "output.mp4");
  // console.log(mp4File);
  // console.log(mp4File.buffer);

  const a = document.createElement("a");
  a.href = videoFile;
  a.download = "MyRecording.webm";
  document.body.appendChild(a);
  a.click();
  videoPreview.pause();
};

const handleStop = () => {
  startBtnIcon.className = "fas fa-circle";
  startBtn.removeEventListener("click", handleStop);
  startBtn.addEventListener("click", handleStart);

  recorder.stop();
  // 녹화를 종료하면 dataavailable 이벤트 발생
  recorder.ondataavailable = (event) => {
    // 브라우저 상의 메모리에 저장된 데이터 접근을 위한 방식 - url로 접근
    videoFile = URL.createObjectURL(event.data);
    // [영상 녹화 후 프리뷰 작동] srcObject를 비우고 > videoFile src에 녹화 url을 넣음 > 영상 실행
    videoPreview.srcObject = null;
    videoPreview.src = videoFile;
    videoPreview.loop = true;
    videoPreview.play();
  };
};

const handleStart = () => {
  startBtnIcon.className = "fas fa-stop";
  startBtn.removeEventListener("click", handleStart);
  startBtn.addEventListener("click", handleStop);

  recorder = new window.MediaRecorder(stream, { mimeType: "video/webm" });
  recorder.start();
};

const init = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: 400, height: 350 },
  });
  videoPreview.srcObject = stream;
  videoPreview.play();
};
init();

startBtn.addEventListener("click", handleStart);
downloadBtn.addEventListener("click", handleDownload);
