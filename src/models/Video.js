import mongoose from "mongoose";

// 스키마 생성 (비디오 구조)
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxLength: 40 },
  fileUrl: { type: String, required: true }, // for 비디오 렌더링
  thumbUrl: { type: String, required: true },
  description: { type: String, required: true, trim: true, maxLength: 70 },
  createdAt: { type: Date, required: true, default: Date.now },
  hashtags: [{ type: String, trim: true }],
  meta: {
    views: { type: Number, default: 0, required: true },
    rating: { type: Number, default: 0, required: true },
  },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" }, // 비디오 업로드한 사용자를 구별하기 위함
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // 배열 []
});

// 정적메서드 생성
videoSchema.static("formatHashtags", function (hashtags) {
  return hashtags
    .split(",")
    .map((word) => (word.startsWith("#") ? word : `#${word}`));
});

// 모델 생성 (=몽고DB 컬렉션 생성)
const Video = mongoose.model("Video", videoSchema);

export default Video;

// videoSchema.pre("save", async function () {
//   this.hashtags = this.hashtags[0]
//     .split(",")
//     .map((word) => (word.startsWith("#") ? word : `#${word}`));
// });
