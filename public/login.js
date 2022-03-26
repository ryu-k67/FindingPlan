var userName="";
var projectId="";


//新規登録処理
function createUser() {
  userName= document.getElementById('name').value;
  var mailAddress = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  if(userName==""){
    alert("ユーザ名を入力してください");
    return;
  }
  var weekArray=[];
  if(userName==""){
    alert("ユーザ名を入力してください");
    return;
  }
  for(let i=0;i<7;i++){
    for(let j=0;j<144;j++){
      weekArray[i*144+j]=2;
    }
  }
  
  firebase.auth().createUserWithEmailAndPassword(mailAddress, password)
  .then(function(){  
    inputarea.classList.add('hideArea');
    info.textContent = "アカウント作成中です!";

    userid = firebase.auth().currentUser.uid;
    db.collection("account").doc(userid).set({
      name:userName,
      mailadd:mailAddress,
      pass:password,
      joinProject:[""],
      week:weekArray
    })
    .then(function(){
      for(let i=0;i<60;i++){   
        db.collection("account").doc(userid).collection("myScheduleId").doc().set({
          date:-1,
          mySchedule:[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
        })
      }
      setTimeout(function(){
        window.location="mypage.html";
      },  1000*2.5);
    })
    .catch(function (error) { // 失敗した場合に実行される箇所
      console.error("Error adding document: ", error);
    });
  })
  .catch(function(error) {
    alert('登録できません（' + error.message + '）');
  });
}

//ログイン処理
function login() {
  var userName= document.getElementById('name').value;
  var mailAddress = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  if(userName==""){
    alert("ユーザ名を入力してください");
    return;
  }
  
  firebase.auth().signInWithEmailAndPassword(mailAddress, password)
  .then(function(){
    userid = firebase.auth().currentUser.uid;
    let url=location.href;
    if(url.match(/project/)){
      let temp=url.split("project=",2);
      projectId=temp[1];
      window.location="project.html?project="+projectId;
    }
    else if(url.match(/index/)){
      window.location="index.html";
    }
    else{
      loginDisplay();
    }
  })
  .catch(function(error) {
    alert('ログインできません（' + error.message + '）');
  });
}


//ログアウト処理
function logout() {
  firebase.auth().signOut();
  location.reload();
};


//認証状態の確認
firebase.auth().onAuthStateChanged(function(user) {
  if(user) {
    userid = firebase.auth().currentUser.uid;
  }
});


//マイページに遷移
function mypageClick() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      userid = firebase.auth().currentUser.uid;
      window.location = "mypage.html";
    }
    else {
      window.location = "login.html";
    }
  });
}

//ログインした場合に表示
function loginDisplay() {
  inputarea.classList.add('hideArea');
  info.textContent = "ログイン中です!";
  window.location = "mypage.html";
}

//ログインしているユーザ名を取得
function getUserName(uid) {
  if (!uid) {
    uid = firebase.auth().currentUser.uid;
  }
  var userName = db.collection("account").doc(uid).get().data()["name"];
  return userName;
}
