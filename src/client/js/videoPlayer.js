const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const playIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
const muteIcon = muteBtn.querySelector("i");

const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");

const volumeRange = document.getElementById("volume");
const timeline = document.getElementById("timeline");

const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");

const videoControls = document.getElementById("videoControls");

let controlsTimeout = null;
let controlsMovementTimeout = null;

let volumeValue = 0.5;
video.volume = volumeValue;

videoControls.classList.add("hidden");

// PLAY -- PAUSE
const handlePlayClick = () => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
  playIcon.classList = video.paused ? "fa-solid fa-play" : "fa-solid fa-pause";
};

// 스페이스바로 영상 재생/멈춤
const handlePlayKeydown = function (event) {
  const textarea = document.getElementById("textarea");
  if (event.code === "Space" && event.target !== textarea) {
    event.preventDefault();
    handlePlayClick();
    videoControls.classList.remove("hidden");
    controlsMovementTimeout = setTimeout(hideControls, 2500);
  }
};

// MUTE -- UNMUTE
const handleMute = () => {
  if (video.muted) {
    video.muted = false;
    video.volume = volumeValue;
  } else {
    video.muted = true;
  }
  muteIcon.classList = video.muted
    ? "fa-solid fa-volume-xmark"
    : "fa-solid fa-volume-up";
  volumeRange.value = video.muted ? 0 : volumeValue;
};

// 볼륨바
const handleVolumeChange = (event) => {
  const {
    target: { value },
  } = event;
  if (video.muted) {
    video.muted = false;
    muteIcon.classList = "fa-solid fa-volume-up";
  }
  if (value === "0") {
    video.muted = true;
    muteIcon.classList = "fa-solid fa-volume-xmark";
  } else {
    muteIcon.classList = "fa-solid fa-volume-up";
    volumeValue = value;
  }
  video.volume = value;
};

// 시간포맷
const formatTime = (seconds) =>
  new Date(seconds * 1000).toISOString().substring(11, 19);

// 비디오 총 시간
const handleLoadedMetaData = () => {
  totalTime.innerText = formatTime(Math.floor(video.duration)).substring(3, 8);
  return (timeline.max = Math.floor(video.duration));
};

// 비디오 현재 재생 시간
const handleTimeUpdate = () => {
  currentTime.innerText = formatTime(Math.floor(video.currentTime)).substring(
    3,
    8
  );
  timeline.value = video.currentTime;
};

// 타임라인
const handleTimelineChange = (event) => {
  const {
    target: { value },
  } = event;
  video.currentTime = value;
};

// 풀스크린
const handleFullScreen = () => {
  // document.fullscreenElement 프로퍼티 : fullscreen mode시 표시되는 element 반환
  // 값이 null인 경우 fullscreen mode 아님
  if (document.fullscreenElement !== null) {
    // * !== null : 눌이 아님 = 풀스크린모드임
    // -> 버튼 클릭 시 풀스크린 모드 해제
    document.exitFullscreen(); // exit풀스크린은 document 메서드
    fullScreenIcon.classList = "fa-solid fa-expand";
  } else {
    // 풀스크린 모드 아님 > 클릭 시 풀스크린이 됨
    video.requestFullscreen(); // request풀스크린은 element 메서드
    fullScreenIcon.classList = "fa-solid fa-compress";
  }
};

// 비디오 컨트롤러 마우스 위치로 나타났다사라졌다 하기
const hideControls = () => videoControls.classList.add("hidden");

const handleMouseMove = () => {
  // 마우스를 움직이면 1. 클래스 추가 2. 3초후 클랙스 삭제
  // 그 사이에 다시 마우스를 움직이면? 2번 클래스 함수 삭제 - 클래스 추가 - 다시 클랙스 삭제 함수 시행
  // 삭제 함수 시행 중 다시 마우스를 비디오에 올리는 경우 > 삭제
  // controlsTimeout - controlsMovementTimeout = null;
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
    controlsTimeout = null;
  }
  // 삭제 함수가 시행 중인 경우 > 삭제
  if (controlsMovementTimeout) {
    clearTimeout(controlsMovementTimeout);
    controlsMovementTimeout = null;
  }
  videoControls.classList.remove("hidden"); // 1. 클래스 추가 (클래스 추가삭제 반복)
  controlsMovementTimeout = setTimeout(hideControls, 2500); // 2. 움직이지 않으면 클래스 삭제
};
const handleMouseLeave = () => {
  // 3초 후 showing 클래스 삭제 타임아웃 함수
  controlsTimeout = setTimeout(hideControls, 2500);
};

const handleEnded = () => {
  video.currentTime = 0;
  playIcon.classList = "fa-solid fa-play";
  const { id } = videoContainer.dataset;
  fetch(`/api/videos/${id}/view`, {
    method: "POST",
  });
};

// Event
playBtn.addEventListener("click", handlePlayClick);
document.addEventListener("keydown", handlePlayKeydown);
video.addEventListener("click", handlePlayClick);
muteBtn.addEventListener("click", handleMute);
volumeRange.addEventListener("input", handleVolumeChange);
video.addEventListener("loadedmetadata", handleLoadedMetaData);
video.addEventListener("timeupdate", handleTimeUpdate);
timeline.addEventListener("input", handleTimelineChange);
video.addEventListener("ended", handleEnded);
fullScreenBtn.addEventListener("click", handleFullScreen);
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
