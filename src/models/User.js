import bcrypt from "bcrypt";
import mongoose from "mongoose"; // 몽고DB를 노드에서 사용하도록 도와주는 라이브러리(기능 집합소)

// 스키마 : 모델(컬렉션)에 저장될 데이터의 형식을 정의하는 객체
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  avatarUrl: String,
  socialOnly: { type: Boolean, default: false },
  username: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String, required: true },
  location: String,
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

// 유저정보 저장 전, 패스워드 해싱
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 5);
  }
});

// 몽고DB 모델(컬렉션) 생성 / 인수 - (컬렉션 이름, 스키마)
const User = mongoose.model("User", userSchema);

export default User;
