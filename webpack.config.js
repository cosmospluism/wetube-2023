// js 파일과 css 파일을 분리하는 플러그인(:기능 추가를 위한 부가 프로그램)
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

const BASE_JS = "./src/client/js/";

module.exports = {
  entry: {
    main: BASE_JS + "main.js",
    videoPlayer: BASE_JS + "videoPlayer.js",
    recorder: BASE_JS + "recorder.js",
    commentSection: BASE_JS + "commentSection.js",
  }, // webpack 진입지점
  // mode: "development",
  // production(default) or development (production모드 시, 파일이 압축됨)
  // watch: true, // 변경사항 업데이트
  plugins: [new MiniCssExtractPlugin({ filename: "css/styles.css" })],
  output: {
    filename: "js/[name].js", // 결과물 파일 이름 assets/js/main.js <<
    path: path.resolve(__dirname, "assets"), // 결과물 저장경로 설정
    clean: true, // 번들링 폴더(/assets) 정리(제거)
  },
  // 웹팩이 여러 파일들을 이해할 수 있도록 도와주는 loader. 종류 많음
  module: {
    rules: [
      {
        test: /\.js$/, // 변경할 파일종류
        use: {
          loader: "babel-loader", // 바벨로더 사용. 최신 js 코드 변환
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
          },
        },
      },
      {
        test: /\.scss$/,
        // webpack은 뒤에서부터 실행. sass > css > style 순. 따라서 역순으로 작성
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
};
