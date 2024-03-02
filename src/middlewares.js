import multer from "multer"; // 파일업로드용 미들웨어
import multerS3 from "multer-s3"; // AWS S3용 파일 저장엔진
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    apiVersion: "2022-10-07",
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

const multerUploader = multerS3({
  s3: s3,
  bucket: "withpink",
  acl: "public-read",
});

// pug에서 session 내용을 사용하기 위함 : locals 이용
export const localMiddleware = (req, res, next) => {
  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.siteName = "Wetube";
  res.locals.loggedInUser = req.session.user || {};
  next();
};

// 주소창에 바로 url을 쳤을 때, (/users/edit, /login..)
// 해당 페이지로 이동하는 것을 방지하기 위한 미들웨어 생성 -- 2가지
// 1. 로그인 상태 -> 로그아웃 페이지, 수정 페이지 이동 방어
export const protectorMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Not authorized ✖");
    return res.redirect("/login"); // 로그인 안되어 있으면 로그인페이지로 이동
  }
};

// 2. 로그아웃 상태 -> 로그인, 가입 페이지 이동 방어
export const publicOnlyMiddleware = (req, res, next) => {
  if (!req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Not authorized ✖");
    return res.redirect("/"); // 로그인 되어있으면 홈페이지로 이동
  }
};

// multer 미들웨어 생성 (사용자가 파일 업로드 시, 해당파일을 upload 폴더에 저장) / dest = destination
export const avatarUpload = multer({
  dest: "upload/avatars/",
  limits: { filesize: 3000000 },
  storage: multerUploader,
});
export const videoUpload = multer({
  dest: "upload/videos/",
  limits: { filesize: 10000000 },
  storage: multerUploader,
});
