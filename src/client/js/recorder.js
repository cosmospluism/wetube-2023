import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
const startBtn = document.getElementById("startBtn");
const startBtnIcon = startBtn.querySelector("i");
const videoPreview = document.getElementById("preview");
const downloadBtn = document.getElementById("downloadBtn");

let stream;
let recorder;
let videoFile;

const handleDownload = async () => {
  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load(); //프로그램이라 로드할 때 시간이 걸리기 떄문에 await 해줌

  // ffmpeg 프로그램의 FS(파일 시스템) 내 메모리에
  // 비디오 파일을 가져와 recording.webm이름으로 파일 생성(writeFile)
  ffmpeg.FS("writeFile", "recording.webm", await fetchFile(videoFile));
  // 생성 파일 webm -> mp4 포맷 변환
  await ffmpeg.run("-i", "recording.webm", "-r", "60", "output.mp4");
  // 생성 파일 webm -> jpg 썸네일 이미지 추출
  await ffmpeg.run(
    "-i",
    "recording.webm",
    "-ss",
    "00:00:01",
    "-frames:v",
    "1",
    "thumbnail.jpg"
  );
  // 포맷변환해 생성한 파일 불러오기
  const mp4File = ffmpeg.FS("readFile", "output.mp4");
  const thumbFile = ffmpeg.FS("readFile", "thumbnail.jpg");

  const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });
  const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });

  const mp4Url = URL.createObjectURL(mp4Blob);
  const thumbUrl = URL.createObjectURL(thumbBlob);

  const a = document.createElement("a");
  a.href = mp4Url;
  a.download = "MyRecording.mp4";
  document.body.appendChild(a);
  a.click();
  videoPreview.pause();

  const thumbA = document.createElement("a");
  thumbA.href = thumbUrl;
  thumbA.download = "MyThumbnail.jpg";
  document.body.appendChild(thumbA);
  thumbA.click();

  // unlink = delete a file
  ffmpeg.FS("unlink", "recording.webm");
  ffmpeg.FS("unlink", "output.mp4");
  ffmpeg.FS("unlink", "thumbnail.jpg");

  // createObjectURL()을 통해 생성한 url해제(메모리 차지 없앰)
  URL.revokeObjectURL(mp4Url);
  URL.revokeObjectURL(thumbUrl);
  URL.revokeObjectURL(videoFile);
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
