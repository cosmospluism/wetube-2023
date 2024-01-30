// import
import express from "express";
import morgan from "morgan";
import session from "express-session";
import flash from "express-flash";
import MongoStore from "connect-mongo";
import rootRouter from "./routers/rootRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import apiRouter from "./routers/apiRouter";
import { localMiddleware } from "./middlewares";

const app = express();
const logger = morgan("dev");

app.set("views", process.cwd() + "/src/views"); // 경로 설정
app.set("view engine", "pug"); // template 으로 pug 사용
app.use(logger); //logger : 기록하는 것
app.use(express.urlencoded({ extended: "true" }));
app.use(express.json()); // 작성한 comment 내용을 req.body안에 넣어줌

// session
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //   maxAge: 5000, // 쿠키 만료시간 설정 > 5000 = 5초 후 쿠키 사라짐
    // },
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }), // session을 MongoDB에 저장
  })
);
app.use(flash()); // session을 이용하기 때문에 session 밑에

// locals in session for pug
app.use(localMiddleware);
app.use((req, res, next) => {
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  next();
});
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// routers
// 업로드한 이미지를 보이게 하기 위해, 이미지 폴더 알림
app.use("/upload", express.static("upload"));
// 위와 동일방식. webpack 작업물 공개
app.use("/static", express.static("assets"));
app.use("/", rootRouter);
app.use("/users", userRouter);
app.use("/videos", videoRouter);
app.use("/api", apiRouter);

export default app;
