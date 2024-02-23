import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
const actionBtn = document.getElementById("actionBtn");
const actionBtnIcon = actionBtn.querySelector("i");
const actionBtnSpan = actionBtn.querySelector("span");
const videoPreview = document.getElementById("preview");
const downloadBtn = document.getElementById("downloadBtn");

let stream;
let recorder;
let videoFile;

const files = {
  input: "recording.webm",
  output: "output.mp4",
  thumb: "thumbnail.jpg",
};

const downloadFunc = function (fileUrl, fileName) {
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
};

const handleDownload = async () => {
  actionBtn.removeEventListener("click", handleDownload);
  actionBtnIcon.className = "";
  actionBtnSpan.innerText = "Transcoding...";
  actionBtn.disabled = true;

  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load(); //프로그램이라 로드할 때 시간이 걸리기 떄문에 await 해줌

  // ffmpeg 프로그램의 FS(파일 시스템) 내 메모리에
  // 비디오 파일을 가져와 recording.webm이름으로 파일 생성(writeFile)
  ffmpeg.FS("writeFile", files.input, await fetchFile(videoFile));
  // 생성 파일 webm -> mp4 포맷 변환
  await ffmpeg.run("-i", files.input, "-r", "60", files.output);
  // 생성 파일 webm -> jpg 썸네일 이미지 추출
  await ffmpeg.run(
    "-i",
    files.input,
    "-ss",
    "00:00:01",
    "-frames:v",
    "1",
    files.thumb
  );
  // 포맷변환해 생성한 파일 불러오기
  const mp4File = ffmpeg.FS("readFile", files.output);
  const thumbFile = ffmpeg.FS("readFile", files.thumb);

  const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });
  const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });

  const mp4Url = URL.createObjectURL(mp4Blob);
  const thumbUrl = URL.createObjectURL(thumbBlob);

  downloadFunc(mp4Url, "MyRecording.mp4");
  videoPreview.pause();
  downloadFunc(thumbUrl, "MyThumbnail.jpg");

  // unlink = delete a file
  ffmpeg.FS("unlink", files.input);
  ffmpeg.FS("unlink", files.output);
  ffmpeg.FS("unlink", files.thumb);

  // createObjectURL()을 통해 생성한 url해제(메모리 차지 없앰)
  URL.revokeObjectURL(mp4Url);
  URL.revokeObjectURL(thumbUrl);
  URL.revokeObjectURL(videoFile);

  actionBtn.disabled = false;
  actionBtnIcon.className = "fas fa-circle";
  actionBtnSpan.innerText = "Recording again";
  actionBtn.addEventListener("click", handleStart);
};

const handleStop = () => {
  actionBtnIcon.className = "fas fa-arrow-down";
  actionBtnSpan.innerText = "Download Video";
  actionBtn.removeEventListener("click", handleStop);
  actionBtn.addEventListener("click", handleDownload);

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
  actionBtnIcon.className = "fas fa-stop";
  actionBtnSpan.innerText = "Stop Recording";
  actionBtn.removeEventListener("click", handleStart);
  actionBtn.addEventListener("click", handleStop);

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

actionBtn.addEventListener("click", handleStart);
