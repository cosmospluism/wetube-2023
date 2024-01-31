import bcrypt from "bcrypt"; // 비밀번호 해싱
import User from "../models/User"; // 몽고DB 유저 컬렉션

export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate({
    path: "videos",
    populate: {
      path: "owner",
      model: "User",
    },
  });
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User Not Found" });
  }
  return res.render("users/profile", {
    pageTitle: user.name,
    user,
  });
};

// 회원가입
// -> 가입화면 띄우기
export const getJoin = (req, res) =>
  res.render("users/join", { pageTitle: "Join" });

// --> 가입하기 (유저 정보 저장)
// 1. 비밀번호 재확인 2.이미 있는 id, 이메일인지 체크 3. 유저정보 저장
export const postJoin = async (req, res) => {
  const { name, email, username, password, password2, location } = req.body;
  const pageTitle = "Join";
  // 비밀번호 재확인
  if (password !== password2) {
    return res.status(400).render("users/join", {
      pageTitle,
      errorMessage: "Sorry, password confirmation does not match.",
    });
  }
  // username : id , username or email 중 적어도 하나가 동일한 유저 정보가 있다면 에러
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    return res.status(400).render("users/join", {
      pageTitle,
      errorMessage: "Sorry, this username/email is already taken.",
    });
  }
  // try catch 문(에러 처리용)
  try {
    await User.create({
      avatarUrl: "",
      name,
      email,
      username,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("users/join", {
      pageTitle,
      errorMessage: error._message,
    });
  }
};

// 로그인
// -> 로그인화면 띄우기
export const getLogin = (req, res) =>
  res.render("users/login", { pageTitle: "Login" });

// --> 로그인하기
// 1. username(ID) & password 로 로그인
export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";
  // username, socialOnly: false 조건에 해당하는 유저 정보 찾기
  const user = await User.findOne({ username, socialOnly: false });

  // 조건에 맞는 유저가 없다면 에러처리
  if (!user) {
    return res.status(400).render("users/login", {
      pageTitle,
      errorMessage: "This username does not exist.",
    });
  }
  // 조건에 맞는 유저 정보 있음. -> 해싱된 비밀번호가 동일한 지 체크
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).render("users/login", {
      pageTitle,
      errorMessage: "Wrong password. Please check it.",
    });
  }
  // 조건에 맞는 유저정보 있음 & 해싱된 비밀번호 역시 동일 -> 로그인 OK (세션에 정보 넣어줌)
  // session에 정보저장
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

// 소셜 계정으로 로그인
// 소셜 로그인의 전반적인 흐름 : 사이트 -> 깃헙사이트 권한 승인 페이지 이동 -> 권한 승인 -> 깃허브 코드 발행 -> 코드로 엑세스 토큰 전환 -> 토큰으로 깃헙API를 통해 유저정보 획득
export const startGithubLogin = (req, res) => {
  // /github/start 으로 이동시킬 url생성
  const baseUrl = "https://github.com/login/oauth/authorize"; // oauth 프로토콜 사용
  const config = {
    // 쿼리스트링에 필요한 요소들
    client_id: process.env.GH_CLIENT, // 환경변수 사용
    allow_signup: false,
    scope: "read:user user:email", // 권한 범위 설정, 스페이스바로 복수 작성 가능
  };
  const params = new URLSearchParams(config).toString(); // config 객체 값 -> 쿼리스트링 포맷
  const finalUrl = `${baseUrl}?${params}`; // 최종 url 생성 = oauth 프로토콜 주소 + 유저 아이디&회원가입 유무설정&권한 범위설정
  return res.redirect(finalUrl); // 위에서 생성한 최종 url로 이동(깃헙 권한 승인 페이지)
};

// 권한이 승인되면 깃헙 내에 작성한 콜백 url 로 이동 = /github/finish
export const finishGithubLogin = async (req, res) => {
  // 코드를 전달하여 엑세스 토큰 받기 위한 url 생성
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT, // 환경변수
    client_secret: process.env.GH_SECRET, // 환경변수
    code: req.query.code, // 쿼리스트링 내 코드
  };
  const params = new URLSearchParams(config).toString(); // 쿼리스트링 포맷 생성
  const finalUrl = `${baseUrl}?${params}`; // 엑세스 토큰 요청을 위한 최종 url 생성 완료

  // 토큰 요청, 해당 주소에 코드를 전달하고 토큰을 가져옴
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json", // 수신 정보의 타입 설정
      },
    })
  ).json(); // fetch해서 가져온 값-> json 형태로 변환

  // 엑세스 토큰이 있는 경우, 엑세스 토큰을 이용하여 api에 접근하여 유저 정보 획득
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com"; // 깃헙 API
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`, // ? 왜 token 을 작성해야하는 것인가
        },
      })
    ).json(); // 깃헙 API/user 사이트에서 엑세스토큰으로 유저 정보 획득
    // 필요한 유저 정보 획득 but, 이메일이 안드러남(null)

    // 잠겨있는 이메일 요청
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`, // 이렇게 쓰는 방식인 듯..
        },
      })
    ).json();
    // (여러 이메일을 받기 때문에) primary & verified 조건을 모두 만족하는 email 서치
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login"); // 조건을 만족하는 이메일 없음) 로그인페이지 이동
    }

    // user에서 동일한 email을 가진 유저 서치
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      // 해당 email을 가진 유저 없음) 깃헙 유저정보로 회원가입
      user = await User.create({
        avatarUrl: userData.avatar_url,
        name: userData.name,
        email: emailObj.email,
        username: userData.login,
        password: "",
        socialOnly: true, // 소셜 로그인이라는 것을 알기 위함
        location: userData.location,
      });
    } // 해당 유저가 있는 경우) 로그인
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login"); // 토큰이 없는 경우) 로그인페이지 이동
  }
};

// 로그아웃
// 세션 정보 삭제 db.sessions.~ (유저 정보는 여전히 남아있음 db.users.~)
export const logout = (req, res) => {
  req.session.user = null;
  req.session.loggedIn = false;
  req.flash("info", "bye bye🖐");
  return res.redirect("/");
};

// 프로필 수정 페이지 렌더링
export const getEdit = (req, res) =>
  res.render("users/edit-profile", { pageTitle: "Edit Profile" });

// 프로필 수정 업로드
export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl }, // req.session.user._id
    },
    body: { name, email, username, location }, // req.body.name ...
    file, // req.file (이미지 파일)
  } = req;

  // 1. 작성값과 기존값이 다른 지 확인
  // 2. 작성값을 포함하고 있는 유저가 있는 지 확인
  // 3. 조건 미충족 시 에러처리
  const usernameExits =
    username !== req.session.username ? await User.findOne({ username }) : null; // null or undefined 상관 없는 지 모르겠음 (해본 바로는 둘다 괜찮음)
  const emailExits =
    email !== req.session.email ? await User.findOne({ email }) : null;
  if (usernameExits || emailExits) {
    return res.status(400).render("users/edit-profile", {
      pageTitle: "Edit Profile",
      errorMessage: usernameExits
        ? "This username is already taken."
        : "This email is already taken.",
    });
  }
  // 4. 유저정보 업데이트
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? file.location : avatarUrl,
      name,
      email,
      username,
      location,
    },
    { new: true }
  );
  req.session.user = updatedUser;
  return res.redirect("/users/edit");
};

// 비밀번호 변경 페이지 렌더링
export const getChangePassword = (req, res) =>
  res.render("users/change-password", { pageTitle: "Change Password" });

// 비밀번호 변경 post
export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id }, // req.session.user._id/password
    },
    body: { oldPassword, newPassword, newPassword2 }, // req.body.newPassword
  } = req;
  const user = await User.findById(_id);
  // 기존 비밀번호 확인
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    // 기존 비번 작성 -> 틀림 ) 틀렸다고 에러처리
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "Old password is wrong, please check it again.",
    });
  }
  // 새 비밀번호 검증
  if (newPassword !== newPassword2) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "New password does not match.",
    });
  }
  // 비밀번호 변경
  user.password = newPassword;
  await user.save();
  return res.redirect("/users/logout");
};
