let db=firebase.firestore();
let userid="";
var userName="";


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
  console.log(userName);
  if(userName==""){
    alert("ユーザ名を入力してください");
    return;
  }
  for(let i=0;i<7;i++){
    for(let j=0;j<144;j++){
      weekArray[i*144+j]=1;
    }
  }
  
  firebase.auth().createUserWithEmailAndPassword(mailAddress, password)
  .then(function(){  
    inputarea.classList.add('hide');
    info.textContent = "アカウント作成中です!";

    userid = firebase.auth().currentUser.uid;
    console.log(userid);
    console.log(userName,mailAddress,password);
    db.collection("account").doc(userid).set({
      name:userName,
      mailadd:mailAddress,
      pass:password,
      joinProject:[""],
      week:weekArray
    })
    .then(function(){
      console.log("登録成功!");
     
      for(let i=0;i<60;i++){   
        console.log(i); 
        db.collection("account").doc(userid).collection("myScheduleId").doc().set({
          date:-1,
          mySchedule:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        })
      }
      setTimeout(function(){
        window.location="mypage.html";
      },  1000*2);
      
    })
    .catch(function (error) { // 失敗した場合に実行される箇所
      console.error("Error adding document: ", error);
    });
  })
  .catch(function(error) {
    alert('登録できません（' + error.message + '）');
  });
}

var projectId="";
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
  window.location="index.html";
};

//認証状態の確認
firebase.auth().onAuthStateChanged(function(user) {
  if(user) {
    userid = firebase.auth().currentUser.uid;
    //loginDisplay();
  }
  else {
  //  logoutDisplay();
  }
});

function loginDisplay() {
//  logout.classList.remove('hide');
  inputarea.classList.add('hide');
  info.textContent = "ログイン中です!";
  window.location="mypage.html";
}

/*  
function logoutDisplay() {
  logout.classList.add('hide');
  inputarea.classList.remove('hide');

  info.textContent = "";
}
*/

//認証状態の確認
function mypageClick() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      userid = firebase.auth().currentUser.uid;
      loginDisplay();
    }
    else {
      window.location = "login.html";
    }
  });
}
function loginDisplay() {
  //  logout.classList.remove('hide');
  inputarea.classList.add('hide');
  //let userName=getUserName(userid);
  info.textContent = "ログイン中です!";
  window.location = "mypage.html";
}
function getUserName(uid) {
  if (!uid) {
    uid = firebase.auth().currentUser.uid;
  }
  console.log(uid);
  var userName = db.collection("account").doc(uid).get().data()["name"];
  return userName;
}

function forProject() {
  var projectName = document.getElementById("project-name").value;
  var projectStartPeriod = document.getElementById("project-start").value;
  var projectFinishPeriod = document.getElementById("project-finish").value;
  console.log(projectName);
  console.log(projectStartPeriod);
  console.log(projectFinishPeriod);
  let temp=new Date();
  let today=new Date(temp.getFullYear(),temp.getMonth(),temp.getDate()).getTime();
  let start=new Date(projectStartPeriod.split("-",3)).getTime();
  let finish=new Date(projectFinishPeriod.split("-",3)).getTime();
  console.log(today);
  console.log(start);
  console.log(finish);
  if (projectName == "") {
    alert("プロジェクト名を入力してください");
    return;
  }
  else if (projectStartPeriod == "") {
    alert("プロジェクトの開始日を入力してください");
    return;
  }
  else if (projectFinishPeriod == "") {
    alert("プロジェクトの終了日を入力してください");
    return;
  }
  else if(start < today){
    alert("開始日には本日以降を選択してください");
    return;
  }
  else if(start > finish){
    alert("終了日は開始日以降を選択してください");
    return;
  }

  var projectId = getProjectId();
  let url = "project.html?project=" + projectId;
  console.log(projectName);
  console.log(url);
  createProject(projectName, projectStartPeriod, projectFinishPeriod, projectId, url);
  console.log("成功");
}

function getProjectId() {
  let collection = db.collection("project");
  let newProjectId = collection.doc().id;
  return newProjectId;
}

//Date型の日付をintの形に変換
function transDateToInt(date) {
  var dividDate = date.split("-", 3);
  /*日時をyyyymmdd(y:年,m:月,d:日)の形に変換*/
  var intDate = parseInt(dividDate[0] * 10000) + parseInt(dividDate[1] * 100) + parseInt(dividDate[2]);
  return intDate;
}

/*プロジェクトを作成する関数.小塚
*projectName            :String
*projectStartPeriod     :Date
*projectEndPeriod       :Date
*/
function createProject(projectName, projectStartPeriod, projectEndPeriod, projectId, url) {
  /*日時をyyyymmdd(y:年,m:月,d:日)の形に変換*/
  var startTime = transDateToInt(projectStartPeriod);
  var endTime = transDateToInt(projectEndPeriod);
  console.log(startTime);
  console.log(endTime);
  console.log(projectId);
  //データベースにドキュメントを更新.決まっていいない値はnullか0
  db.collection("project").doc(projectId).set({
    URL: url,
    memberId: [""],
    projectName: projectName,
    projectPeriod: [startTime, endTime],
    projectDecisionName: 0,
    projectMemberName: [""]
  })
    .then(() => {
      console.log("seikou");
      window.location = url;
    })
}
