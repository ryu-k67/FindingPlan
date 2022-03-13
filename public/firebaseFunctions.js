//author:takuma
//kumanomiM2

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

//書き込み	set
//更新	update
//読み取り	onおよびonce
//削除	removeか、nullを書き込む

//データベースに関する
//let db = firebase.firestore();

/*あるプロジェクトの期間のあるユーザーのマイスケジュールを返す*/
async function getUserSchedule(userId){
    /*あるプロジェクトIDのプロジェクトの開始日、終了日を取得する*/
    var projectId = getParam("project");
    var period = [];
    period = await db.collection("project").doc(projectId).get()
    .then((querySnapshot)=>{
        return querySnapshot.data()["projectPeriod"];
    })
    /*あるユーザーIDをもつユーザーのプロジェクトの期間のマイスケジュールを取得する*/
    var projectPeriodMySchedule = [];
    console.log(userId);
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
            console.log("でーた取得中");
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
        console.log(kari);
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
    console.log(projectPeriodMySchedule);
    return projectPeriodMySchedule;
}

/*function setJoinMenber(memberName,newSchedule){
    var projectId = getParam("project");

    db.collection("project").doc(projectId).set({
        projectMemberName:memberName
    })
    .then(function() {
        console.log("memberName successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document(memberName): ", error);
    });

    db.collection("project").doc(projectId).collection(projectMemberPeriod).set({
        projectSchedule:newSchedule
    })
    .then(function() {
        console.log("newSchedule successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document(newScedule): ", error);
    });

    return null;
}*/
/*わかりやすくするために仮引数memberIndexを改めmemIndexと名付けた*/
/*function setLoginMember(memIndex,schedule){
    var projectId = getParam("project");

    db.collection("project").doc(projectId).collection(projectMemberPeriod).set({
        memberIndex:memIndex,
        projectSchedule:schedule
    })
    .then(function() {
        console.log("Document successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document: ", error);
    });

    return null;
}
*/
////////////////////////////////////////////////
function setJoinMember(memberName,newSchedule){
    console.log("set");
    setprojectData("",memberName,newSchedule);

    /*
    //データベースから名前の配列を取得してから、配列の要素を追加して、それをsetしないとだめでは？
    var projectId = getParam("project");
    var data;
    //名前の配列を取得
    let StringMenbaerName = db.collection("project").doc(projectId).get()
    .then((querySnapshot) => {
        var buff = querySnapshot.docs.map(doc=>{
            data = doc.data()["projectMenberName"];
        })
        data = data + [memberName];     //新たにメンバーを追加
   })
   .catch((error)=>{
       console.log("データの取得失敗");
   })
    db.collection("project").doc(projectId).set({
        projectMemberName:data
    })
    .then(function() {
        console.log("memberName successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document(memberName): ", error);
    });
    //名前の設定ここまで
    db.collection("project").doc(projectId).collection(projectMemberPeriod).add({
        menberId: "0",
        projectSchedule:newSchedule,
        memberIndex:(data.length - 1)
    })
    .then(function() {
        console.log("newSchedule successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document(newScedule): ", error);
    });
    return null;
    */
}

/*わかりやすくするために仮引数memberIndexを改めmemIndexと名付けた*/
async function setLoginMember(userId,projectSchedule,mySchedule){
    //var projectId = getParam("project");
    //var userId = null;

    //uidの取得
    /*userId = await firebase.auth().onAuthStateChanged(function (user) {
        var id = null;
        if (user) {
            id = firebase.auth().currentUser.uid;
        }
        return id;
    });
*/
    var memberName =await db.collection("account").doc(userId).get()
    .then((querySnapshot) =>{
        console.log("start");
        var buff =  querySnapshot.data()["name"];
        console.log(buff);
        return buff;  
    }).catch((error) => {
        console.log("データの取得に失敗しました(${error})");
    })
    console.log(mySchedule);
    let schedule=await diffSchedule(userId,projectSchedule,mySchedule);
    setprojectData(userId,memberName,schedule);


    /*
    db.collection("project").doc(projectId).collection(projectMemberPeriod).set({
        memberIndex:memIndex,
        projectSchedule:schedule
    })
    .then(function() {
        console.log("Document successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document: ", error);
    });
    return null;
    */
}


async function setprojectData(userId,memberName,newSchedule){
    var projectId = getParam("project");
    var memIndex="";
    console.log("kokomade");
    //データベースから名前の配列を取得してから、配列の要素を追加して、それをsetしないとだめでは？
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
    console.log(member);
    if (member[0] == "") {
        memIndex--;
    }
    console.log(memIndex);
    let documentId=db.collection("project").doc(projectId).collection("projectMemberPeriod").doc().id;

    db.collection("project").doc(projectId).collection("projectMemberPeriod").add({
        memberId: userId,
        projectSchedule:newSchedule,
        memberIndex:memIndex
    })
    .then(function() {
        console.log("newSchedule successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document(newScedule): ", error);
    });

    if(memIndex==0){
        db.collection("project").doc(projectId).update({
            memberId: firebase.firestore.FieldValue.arrayRemove(""),
            projectMemberName:firebase.firestore.FieldValue.arrayRemove("")
        })
       .catch((error)=>{
           console.log("データの取得失敗");
       })
        db.collection("project").doc(projectId).collection("projectMemberPeriod").doc(documentId).delete();
        console.log("delete");
    }
}

async function pickUp(){
    
    let member=getProjectMembers();
    let schedule=[];
    for (let i = 0; i < member.length; i++) {
        var memberSch = await getProjectMemberSchedule(i);
        schedule[i] = await adjustSchedule(memberSch, i);
    }
    let OKschedule=[];
    let flag;//0:×含む 1:△含む〇 2:全部〇
    for(let i=0;i<schedule[0].length;i++){
        flag=2;
        for(let j=0;j<schedule.length;j++){
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
    let start=await getProjectPeriodStart();
    let dayOfWeekStr=["日","月","火","水","木","金","土"];
    let flag;
    let time="";
    for(let i=0;i<OKschedule.length/144;i++){
        let month=start.getMonth();
        let day=start.getDate();
        let dayOfWeek=start.getDay();
        let dayStr=month+"/"+day+"("+dayOfWeekStr[dayOfWeek]+")";
        flag=0;
        for(let j=0;j<144;j++){
            //時間の始まり
            if(flag==0){
                if(OKschedule[i*144+j]==0){
                    flag=0;
                    continue;
                }

                if(j/6>=10){
                    time=j/6+":"+j%6+"0~";
                }
                else{
                    time="0"+j/6+":"+j%6+"0~";
                }
                
                if(OKschedule[i*144+j]==1){
                    flag=1;
                    resultAll+=dayStr+time;
                }
                else if(OKschedule[i*144+j]==2){
                    flag=2;
                    resultPerfect+=dayStr+time;
                }
            }
            //△の連続が終了したら
            else if(flag==1){
                if(OKschedule[i*144+j]==1){
                    flag=1;
                    continue;
                }

                if((j+1)/6>=10){
                    time=(j+1)/6+":"+(j+1)%6+"0";
                }
                else{
                    time="0"+(j+1)/6+":"+(j+1)%6+"0";
                }
                
                if(OKschedule[i*144+j]==0){
                    flag=0;
                    resultAll+=time+"\n";
                }
                else if(OKschedule[i*144+j]==2){
                    flag=2;
                    //resultAll+=time+"\n";
                    resultPerfect+=dayStr+time+"~";
                }
            }
            //〇の連続が終了したら
            else if(flag==2){
                if(OKschedule[i*144+j]==2){
                    flag=2;
                    continue;
                }

                if((j+1)/6>=10){
                    time=(j+1)/6+":"+(j+1)%6+"0";
                }
                else{
                    time="0"+(j+1)/6+":"+(j+1)%6+"0";
                }
                
                if(OKschedule[i*144+j]==0){
                    flag=0;
                    resultPerfect+=time+"\n";
                    resultAll+=time+"\n";
                }
                else if(OKschedule[i*144+j]==1){
                    flag=1;
                    resultPerfect+=time+"\n";
                    //resultAll+=dayStr+time+"~";
                }
            }
        }
    }
    return [resultPerfect,resultAll];
}