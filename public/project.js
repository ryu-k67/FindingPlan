/*url取得部分*/
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//Date型の日付をintの形に変換
function transDateToInt(date) {
    var dividDate = date.split("-", 3);
    /*日時をyyyymmdd(y:年,m:月,d:日)の形に変換*/
    var intDate = parseInt(dividDate[0] * 10000) + parseInt(dividDate[1] * 100) + parseInt(dividDate[2]);
    return intDate;
}  
  
//プロジェクトの作成時の条件付け関数
function forProject() {
  var projectName = document.getElementById("project-name").value;
  var projectStartPeriod = document.getElementById("project-start").value;
  var projectFinishPeriod = document.getElementById("project-finish").value;
  let temp=new Date();
  let today=new Date(temp.getFullYear(),temp.getMonth(),temp.getDate()).getTime();
  let start=new Date(projectStartPeriod.split("-",3)).getTime();
  let finish=new Date(projectFinishPeriod.split("-",3)).getTime();
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
  createProject(projectName, projectStartPeriod, projectFinishPeriod, projectId, url);
}

//プロジェクトを作成
function createProject(projectName, projectStartPeriod, projectEndPeriod, projectId, url) {
  /*日時をyyyymmdd(y:年,m:月,d:日)の形に変換*/
  var startTime = transDateToInt(projectStartPeriod);
  var endTime = transDateToInt(projectEndPeriod);
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
      window.location = url;
    });
}

//プロジェクトのIDを取得
function getProjectId() {
  let collection = db.collection("project");
  let newProjectId = collection.doc().id;
  return newProjectId;
}

//プロジェクト名の取得
async function getProjectName(){
    let ID=getParam("project");
    let buff=await db.collection("project").doc(ID).get()
    .then((querySnapshot)=>{
        let temp=querySnapshot.data()["projectName"];
        return temp;
    })
    .catch((error)=>{
        console.log("データの取得失敗");
    })
    return buff;
}

//プロジェクトに登録しているメンバーを取得
async function getProjectMembers(){
    let ID;
    let buff;
    
    ID = getParam("project");
    buff = await db.collection("project").doc(ID).get()
    .then((querySnapshot) => {
         let temp = querySnapshot.data()["projectMemberName"];
        return temp;
    })
    .catch((error)=>{
        console.log("データの取得失敗");
    })
    return buff; //MemberのMがfirebaseで小文字になってる
}

//プロジェクトの開始日を取得
async function getProjectPeriodStart(){
    let ID;
    ID = getParam("project");
    var buff;
    buff = db.collection("project").doc(ID);
    var start = buff.get().then((querySnapshot) => {
         let start =new Date(querySnapshot.data()["projectPeriod"][0]/10000,(querySnapshot.data()["projectPeriod"][0]%10000)/100-1,(querySnapshot.data()["projectPeriod"][0]%100));
         return start;
    })
    .catch((error)=>{
        console.log("データの取得失敗");
    })
    return start;
}

//プロジェクトの終了日を取得
async function getProjectPeriodFinish(){
    let ID;
    ID = getParam("project");
    var buff;
    buff = db.collection("project").doc(ID);
    var finish=await buff.get().then((querySnapshot) => {
         let end =new Date(querySnapshot.data()["projectPeriod"][1]/10000,(querySnapshot.data()["projectPeriod"][1]%10000)/100-1,(querySnapshot.data()["projectPeriod"][1]%100));
         return end;
    })
    .catch((error)=>{
        console.log("データの取得失敗");
    })   
    return finish;
}

//プロジェクトメンバーがプロジェクトに登録しているスケジュール全員分を取得（myスケとの合体はしていない）
async function getProjectMemberSchedule(memberIndex){
    var ID=getParam("project");
    var data = [];
    var temp = await db.collection("project").doc(ID).collection("projectMemberPeriod").where("memberIndex","==",memberIndex).get()
    .then(async(querySnapshot) =>{
        var buff = await querySnapshot.docs.map(doc=>{
            data = doc.data()["projectSchedule"];
            return data;
        })
        return buff;
    }).catch((error) => {
        console.log("データの取得に失敗しました(${error})");
    })
    return temp[0];
}

//プロジェクトメンバー1人のプロジェクト期間分のマイスケジュールを取得
async function getUserSchedule(userId){
    if(userId==null){
        return null;
    }
    /*あるプロジェクトIDのプロジェクトの開始日、終了日を取得する*/
    var projectId = getParam("project");
    var period = [];
    period = await db.collection("project").doc(projectId).get()
    .then((querySnapshot)=>{
        return querySnapshot.data()["projectPeriod"];
    })
    /*あるユーザーIDをもつユーザーのプロジェクトの期間のマイスケジュールを取得する*/
    var projectPeriodMySchedule = [];
    projectPeriodMySchedule = await db.collection("account").doc(userId).collection("myScheduleId")
    .where("date", ">=", period[0]).where("date", "<=", period[1]).orderBy("date").get()
    .then(async (querySnapshot)=>{
        let kari = [];
        let flag=0;
        kari = await querySnapshot.docs.map((doc) => {
            let data = doc.data()["mySchedule"];
            let day = doc.data()["date"];
            let temp = [];
            let m=0;
            //今日以前の穴埋め　（myスケでは削除されているため）
            if(day>period[0] && flag==0){
                for(let i=0;i<day-period[0];i++){
                    for(let j=0;j<144;j++){
                        temp[i*144+j]=1;
                    }
                }
                m=temp.length;
            }
            //値渡しで日程をコピー
            for (var k = 0; k < 144; k++,m++) {
                temp[m] = data[k];
            }
            flag=1;
            return temp;
        });
        let returnSchedule = [];
        let buff=0;
        for(let i = 0;i < kari.length;i++){
            for(let k = 0;k < kari[i].length;k++){
                returnSchedule[(i+buff)*144 + k] = kari[i][k]%3;
            }
            if(i==0){
                buff=(kari[0].length/144)-1;
            }
        }
        return returnSchedule;
    })
    return projectPeriodMySchedule;
}

//ログインなしのユーザーをプロジェクトメンバーに登録
function setJoinMember(memberName,newSchedule){
    setprojectData("",memberName,newSchedule);
}

//ログインありのユーザーをプロジェクトメンバーに登録
async function setLoginMember(userId,projectSchedule,mySchedule){
    var memberName =await db.collection("account").doc(userId).get()
    .then((querySnapshot) =>{
        var buff =  querySnapshot.data()["name"];
        return buff;  
    }).catch((error) => {
        console.log("データの取得に失敗しました(${error})");
    })
    let schedule=await diffSchedule(userId,projectSchedule,mySchedule);
    setprojectData(userId,memberName,schedule);
}

//プロジェクトにメンバーとそのスケジュールを登録
async function setprojectData(userId,memberName,newSchedule){
    var projectId = getParam("project");
    var memIndex="";
    //名前の配列を取得
    db.collection("project").doc(projectId).update({
        memberId: firebase.firestore.FieldValue.arrayUnion(userId),
        projectMemberName:firebase.firestore.FieldValue.arrayUnion(memberName)
    })
    .then(function(){
        db.collection("account").doc(userId).update({
            joinProject: firebase.firestore.FieldValue.arrayUnion(projectId)
        })
    })
   .catch((error)=>{
       console.log("データの取得失敗");
   })

    let member=await getProjectMembers();
    memIndex=member.length-1;
    if (member[0] == "") {
        memIndex--;
    }
    let documentId=db.collection("project").doc(projectId).collection("projectMemberPeriod").doc().id;

    db.collection("project").doc(projectId).collection("projectMemberPeriod").doc(documentId).set({
        memberId:userId,
        projectSchedule:newSchedule,
        memberIndex:memIndex
    })
    .then(function(){ 
        if(memIndex==0){
            db.collection("project").doc(projectId).update({
                memberId: firebase.firestore.FieldValue.arrayRemove(""),
                projectMemberName:firebase.firestore.FieldValue.arrayRemove("")
            })
            .then(()=>{
                location.reload();
            })
           .catch((error)=>{
               console.log("データの取得失敗");
           })
        }
        else{
            location.reload();
        }
    })
    .catch(function(error) {
        console.error("Error writing document(newScedule): ", error);
    });
}

//プロスケとmyスケとの比較で
async function diffSchedule(userId,newSchedule,mySchedule){
    let diffProjectSchedule=[];
    for(let i=0;i<mySchedule.length;i++){
        let diff=newSchedule[i]-mySchedule[i];
        //変更がなければ0,変更があれば3:〇,4:△,5:×
        if(diff==0){
            diffProjectSchedule[i]=0;
        }
        else{
            if(newSchedule[i]==0){
                diffProjectSchedule[i]=3;
            }
            else if(newSchedule[i]==1){
                diffProjectSchedule[i]=4;
            }
            else if(newSchedule[i]==2){
                diffProjectSchedule[i]=5;
            }
        }
    }
    return diffProjectSchedule;
}

//プロジェクトメンバー全員分のスケジュールを取得（myスケとの合体もしてある）
async function pickUp(){
    let member=await getProjectMembers();
    let schedule=[];
    if(member[0]==""){
        return [null];
    }
    for (let i = 0; i < member.length; i++) {
        var memberSch = await getProjectMemberSchedule(i);
        schedule[i] = await adjustSchedule(memberSch, i);
    }
    return schedule;
}

//チェックボックスで選択されたメンバーに共通する参加可能日、未確定日をそれぞれ配列で返す
async function pick(schedule){
    let check=[];
    if(memberName[0]==""){
        return null;
    }
    for(let i=0;i<memberName.length;i++){
        let idName="checkBox_"+i;
        let element=document.getElementById(idName);
        check[i]=element.checked;
    }
    for(let i=0;i<memberName.length;i++){
        if(check[i]==true){
            break;
        }
        if(i==memberName.length-1){
            return [[],[]]
        }
    }
    let OKschedule=[];
    let flag;//0:×含む 1:△含む〇 2:全部〇
    for(let i=0;i<schedule[0].length;i++){
        flag=2;
        for(let j=0;j<schedule.length;j++){
            if(check[j]==false){
                continue;
            }
            if(schedule[j][i]%3==1){
                flag=1;
            }
            else if(schedule[j][i]%3==0){
                flag=0;
                break;
            }
        }
        OKschedule[i]=flag;
    }
    let resultPerfect="";//〇だけ
    let resultAll="";//△含む
    let today=await getProjectPeriodStart();
    let dayOfWeekStr=["日","月","火","水","木","金","土"];
    let time="";
    for(let i=0;i<OKschedule.length/144;i++){
        let month=today.getMonth()+1;
        let day=today.getDate();
        let dayOfWeek=today.getDay();
        let dayStr=month+"/"+day+"("+dayOfWeekStr[dayOfWeek]+")";
        flag=0;        
        today.setDate(today.getDate()+1);
        for(let j=0;j<144;j++){
            //時間の始まり
            if(flag==0){
                if(OKschedule[i*144+j]==0){
                    flag=0;
                    continue;
                }
                if(j/6>=10){
                    time=Math.floor(j/6)+":"+j%6+"0~";
                }
                else{
                    time="0"+Math.floor(j/6)+":"+j%6+"0~";
                }
                if(OKschedule[i*144+j]==1){
                    flag=1;
                    resultAll+=dayStr+time;
                    if(j==143){
                        resultAll+="24:00\n";
                    }
                }
                else if(OKschedule[i*144+j]==2){
                    flag=2;
                    resultPerfect+=dayStr+time;
                    resultAll+=dayStr+time;
                    if(j==143){
                        resultPerfect+="24:00\n";
                        resultAll+="24:00\n";
                    }
                }
            }
            //一つ前が△
            else if(flag==1){
                if(OKschedule[i*144+j]==1){//今回も△
                    flag=1;
                    if(j==143){
                        resultAll+="24:00\n";
                    }
                    continue;
                }

                if(j/6>=10){
                    time=Math.floor(j/6)+":"+j%6+"0";
                }
                else{
                    time="0"+Math.floor(j/6)+":"+j%6+"0";
                }
                
                if(OKschedule[i*144+j]==0){//△の連続が終了
                    flag=0;
                    resultAll+=time+"\n";
                }
                else if(OKschedule[i*144+j]==2){
                    flag=2;
                    resultPerfect+=dayStr+time+"~";
                    if(j==143){
                        resultPerfect+="24:00\n";
                        resultAll+="24:00\n";
                    }
                }
            }
            //一つ前が〇
            else if(flag==2){
                if(OKschedule[i*144+j]==2){//今回も〇
                    flag=2;
                    if(j==143){
                        resultPerfect+="24:00\n";
                        resultAll+="24:00\n";
                    }
                    continue;
                }

                if(j/6>=10){
                    time=Math.floor(j/6)+":"+j%6+"0";
                }
                else{
                    time="0"+Math.floor(j/6)+":"+j%6+"0";
                }
                
                if(OKschedule[i*144+j]==0){
                    flag=0;
                    resultPerfect+=time+"\n";
                    resultAll+=time+"\n";
                }
                else if(OKschedule[i*144+j]==1){
                    flag=1;
                    resultPerfect+=time+"\n";
                    if(j==143){
                        resultAll+="24:00\n";
                    }
                }
            }
        }
    }
    return [resultPerfect,resultAll];
}