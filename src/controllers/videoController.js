import Video from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";

export const home = async (req, res) => {
  try {
    const videos = await Video.find({})
      .sort({ createdAt: "desc" })
      .populate("owner");
    return res.render("home", { pageTitle: "Home", videos });
  } catch {
    return res.status(400).render("server-error");
  }
};

export const watch = async (req, res) => {
  const { id } = req.params;
  // populate()메서드 : 한 컬렉션에서 다른 컬렉션을 참조할 때 사용
  // 비디오스키마의 owner: {ref:"User"} 에서 해당 ObjectId 값과 일치하는 유저(document)를 가져와줌
  const video = await Video.findById(id).populate("owner").populate("comments");
  // const comment = await Comment.findById().populate("owner");
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found" });
  }
  return res.render("watch", { pageTitle: video.title, video });
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found" });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  return res.render("edit", { pageTitle: `Editing ${video.title}`, video });
};

export const postEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const { title, description, hashtags } = req.body;
  const video = await Video.findById({ id });
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found" });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "You are not the owner of this video ✖");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: `Upload Video` });
};

export const postUpload = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { title, description, hashtags },
  } = req;
  const { video, thumb } = req.files;
  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl: video[0].location,
      thumbUrl: thumb[0].location,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
    });
    // 새롭게 업로드한 비디오의 id를 유저-videos배열 안에 넣어주기
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    return res.status(400).render("upload", {
      pageTitle: `Upload Video`,
      errorMessage: error._message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found" });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  // user - videos []에서 삭제한 비디오의 아이디 삭제
  const user = await User.findById(_id);
  user.videos.splice(user.videos.indexOf(id), 1);
  user.save();
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        //정규식을 이용한 키워드 필터링 ^ / $ , query operators in MongoDB
        $regex: new RegExp(`${keyword}`, "i"),
      },
    }).populate("owner");
  }
  return res.render("search", { pageTitle: "Search", videos });
};

export const registerView = async (req, res) => {
  // router - url 에서 id 가져오기 > 해당 id 비디오 찾음 > 비디오 조회수 올리기
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views = video.meta.views + 1; // type:Number, default:0
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const {
    params: { id },
    body: { text },
    session: { user },
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    avatarUrl: user.avatarUrl,
    text,
    owner: user._id,
    video: id,
  });
  const commentPopulate = await Comment.findById(comment._id).populate("owner");
  const commentOwnerName = commentPopulate.owner.name;
  video.comments.push(comment._id);
  await video.save();
  return res
    .status(201)
    .json({
      newCommentId: comment._id,
      avatarImg: comment.avatarUrl,
      name: commentOwnerName,
    });
  // res.json() > response를 보냄
  // 프론트엔드에 comment._id를 보내기 위해, json 바디에 담아 보냄

  // const foundUser = await User.findById({ _id: loggedInUser._id }).populate(
  //   "comments"
  // );
  // if (!foundUser) {
  //   res.sendStatus(404);
  // }
  // const userComment = await Comment.findById({ owner: loggedInUser._id });
  // foundUser.comments.push(userComment._id);
  // await foundUser.save();
  // console.log(foundUser);
  // return res.sendStatus(201);
};

export const deleteComment = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { commentId }, // 프론트엔드에서 fetch - body에 담아 전달
  } = req;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.sendStatus(404);
  }
  if (String(_id) !== String(comment.owner._id)) {
    return res.status(403).end();
  }
  await Comment.findByIdAndDelete(commentId);
  const video = await Video.findById(comment.video._id);
  video.comments.splice(video.comments.indexOf(commentId), 1);
  await video.save();
  return res.sendStatus(200);
};
