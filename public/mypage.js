//urlから一部分を取得
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
function transDateToInt(date){
    var dividDate=date.split("-",3);
    /*日時をyyyymmdd(y:年,m:月,d:日)の形に変換*/
    var intDate = parseInt(dividDate[0] * 10000) + parseInt(dividDate[1] * 100) + parseInt(dividDate[2]);
    return intDate;
}

//my日程を保存する関数
function setMySchedule( uid, weekSchedule,mySchedule){
    var today = new Date();     //今日の日付
    var scheduleDate;           //登録する日時をintの形で入れておく変数
    var scheduleId = [];        //ドキュメントのIDを入れておく配列
    var i = 0;
   
    //ドキュメントのIDをすべて取得
    db.collection("account").doc(uid).collection("myScheduleId").orderBy("date").get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            scheduleId[i] = doc.id;
            i++;
        });
        var index = 0;  //配列は全部つながっているので分ける時に使用するインデックス
        //ループして全部更新
        for(i = 0;i < 60;i++,index = index + 144){
            //-------------0:× 1:△ 2:〇------------------------------------------------------------
            //0:変えず×,1:変えず△,2:変えず〇,3:変えて×,4:変えて△,5:変えて〇
            let day=parseInt(today.getDay());

            for(let j=0;j<144;j++){
                let sum=mySchedule[i*144+j]+weekSchedule[day*144+j];
                if(sum==0){
                    mySchedule[i*144+j]=0;
                }
                else if(sum==1){
                    if(mySchedule[i*144+j]==0){
                        mySchedule[i*144+j]=3;
                    }
                    else if(mySchedule[i*144+j]==1){
                        mySchedule[i*144+j]=1;
                    }
                }
                else if(sum==2){
                    if(mySchedule[i*144+j]==0){
                        mySchedule[i*144+j]=3;
                    }
                    else if(mySchedule[i*144+j]==1){
                        mySchedule[i*144+j]=1;
                    }
                    else if(mySchedule[i*144+j]==2){
                        mySchedule[i*144+j]=5;
                    }
                }
                else if(sum==3){
                    if(mySchedule[i*144+j]==1){
                        mySchedule[i*144+j]=4;
                    }
                    else if(mySchedule[i*144+j]==2){
                        mySchedule[i*144+j]=5;
                    }
                }
                else if(sum==4){
                    mySchedule[i*144+j]=2;
                }
            }
            //-------------------------------------------------------------------------
            var stringDay = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
            scheduleDate = transDateToInt(stringDay);   //日付の指定     
            //データの保存
            db.collection("account").doc(uid).collection("myScheduleId").doc(scheduleId[i]).set({
                date: scheduleDate,
                mySchedule: mySchedule.slice(index,index + 144)
            })
            today.setDate(today.getDate() + 1);     //日付を1日進める
        }
    })
    .then(()=>{
        location.reload();
    })
    .catch((error) => {
        console.log("データ取得失敗(${error})");
    });
}

//my日程を取得する関数
async function getMySchedule(uid) {
    var today = new Date();     //今日の日付を取得
    var finalDay = new Date();
    var stringDay;
    finalDay.setDate(finalDay.getDate() + 59);    //登録可能な一番遠い日付を入れておく
    stringDay = today.getFullYear() + "-" + (today.getMonth() + 1)+ "-" + today.getDate();

    var intToday = transDateToInt(stringDay);      //今日の日付をintの形に変換
    var pastDataId = [];     //過去の日付のドキュメントIDを入れる配列
    var i = 0;               //ループ用

    var week=await getWeekSchedule(uid);//週間テンプレートの取得
    var weekSchedule=[];
    for(i=0;i<7;i++){
        weekSchedule[i]=[];
        for(let j=0;j<144;j++){
            weekSchedule[i][j]=week[i*144+j];
        }
    }

    var mySchedule = [];      //今日から順にデータを入れておく
    var data;
    i = 0;  //iの初期化
    var idBuff = [];
    //過去の日付のデータ検索.ドキュメントIDを保存
    db.collection("account").doc(uid).collection("myScheduleId").where("date", "<", intToday).get()
    .then(async (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            pastDataId[i] = doc.id;
            i++;
        });
        let len=pastDataId.length;
        //過去のデータを更新
        for (i = 0; i < len; i++) {
            stringDay = finalDay.getFullYear() + "-" + (finalDay.getMonth() + 1) + "-" + finalDay.getDate();
            var intDate = transDateToInt(stringDay);
            //過去のデータのドキュメントを入力されていない日付のデータとして更新
            if(i<len-1){
                db.collection("account").doc(uid).collection("myScheduleId").doc(pastDataId[i]).set({
                    date: intDate,
                    mySchedule: weekSchedule[finalDay.getDay()]
                })
                finalDay.setDate(finalDay.getDate() - 1);
            }
            else{
                db.collection("account").doc(uid).collection("myScheduleId").doc(pastDataId[i]).set({
                    date: intDate,
                    mySchedule: weekSchedule[finalDay.getDay()]
                })
            }
        }
    }).catch((error) => {
        console.log("データ取得失敗(${error})");
    });

    //日付で昇順にして日程を取得
    mySchedule = await db.collection("account").doc(uid).collection("myScheduleId").orderBy("date").get()
    .then(async (querySnapshot) => {
        let kari = [];
        kari = await querySnapshot.docs.map((doc) => {
            data = doc.data()["mySchedule"];
            let temp = [];
            //値渡しで日程をコピー
            for (var k = 0; k < 144; k++) {
                temp[k] = data[k];
            }
            return temp;
        });
            
        let returnSchedule = [];
        for(let i = 0;i < kari.length;i++){
            for(let k = 0;k < kari[i].length;k++){
                if((kari[i][k])%3==0){
                    returnSchedule[i*144 + k] = 0;
                }
                else if((kari[i][k])%3==1){
                    returnSchedule[i*144 + k] = 1;
                }
                else if((kari[i][k])%3==2){
                    returnSchedule[i*144 + k] = 2;
                }
            }
        }
        return returnSchedule;
    }).catch((error) => {
        console.log("データ取得失敗(${error})");
    });
    return mySchedule;
}

//プロジェクトからログインしているユーザのスケジュールが登録されているデータベースのIDを取得する
async function getLoginMemberIndex(uid){
    let flag=true;
    let projectId=getParam("project");
    let memberIndex=await db.collection("project").doc(projectId).collection("projectMemberPeriod").where("memberId","==",uid).get()
    .then(async (querySnapshot)=>{
        let index=await querySnapshot.docs.map((doc)=>{
            flag=false;
            return doc.data()["memberIndex"];
        })
        return index;
    })
    if(flag){
        memberIndex[0]=null;
    }
    return memberIndex[0];
}

//myスケが変更されたとき、そのユーザが過去に登録したプロスケに変更を反映する
async function changeProjectSchedule(beforeSchedule,afterSchedule,userId){
    let changeMy=[];
    for(let i=0;i<8640;i++){
        let diff=beforeSchedule[i]+afterSchedule[i];
        if(diff%3==0){
            changeMy[i]=0;
        }
        else if(diff%3==1){
            changeMy[i]=1;
        }
        else if(diff%3==2){
            changeMy[i]=2;
        }
    }
    let project=await db.collection("account").doc(userId).get()
    .then((querySnapshot)=>{
        let temp= querySnapshot.data()["joinProject"];
        return temp;
    })
    for(let i=0;i<project.length;i++){
        if(project[i]==""){
            continue;
        }
        let today=new Date();
        let stringToday = parseInt(today.getFullYear()*10000) + parseInt((today.getMonth() +1)*100) + parseInt(today.getDate());
        let period=await db.collection("project").doc(project[i]).get()
        .then((querySnapshot)=>{
            return querySnapshot.data()["projectPeriod"];
        })
        //2022 01 31   2021 12 01   0000 89 99
        //日数がその月の日数以上
        let start=period[0]-stringToday;
        let finish=period[1]-period[0];
        
        let diffMySchedule=[];
        for(let j=0;j<=finish;j++){
            for(let k=0;k<144;k++){
                diffMySchedule[j*144+k]=changeMy[(start+j)*144+k];
            }
        }

        db.collection("project").doc(project[i]).collection("projectMemberPeriod").where("memberId","==",userId).get()
        .then(async(querySnapshot)=>{
            let projectSchedule=await querySnapshot.docs.map((doc)=>{
                return doc.data()["projectSchedule"];
            })
            let userProjectId= await querySnapshot.docs.map((doc)=>{
                return doc.id;
            })
            let schedule=[];
            for(let j=0;j<=finish;j++){
                for(let k=0;k<144;k++){
                    if(projectSchedule[0][j*144+k]==0){
                        schedule[j*144+k]=afterSchedule[(start+j)*144+k];
                    }
                    else{
                        schedule[j*144+k]=projectSchedule[0][j*144+k];
                    }
                }
            }
            db.collection("project").doc(project[i]).collection("projectMemberPeriod").doc(userProjectId[0]).update({
                projectSchedule:schedule
            })
        })
        .then(()=>{
            alert("変更できました");
        })
    }
}

//プロスケとmyスケを合体させる関数
async function adjustSchedule(projectSchedule,memberIndex){
    var projectId=getParam("project");
    let userId=await db.collection("project").doc(projectId).collection("projectMemberPeriod")
    .where("memberIndex","==",memberIndex).get()
    .then(async(querySnapshot)=>{
        let id=await querySnapshot.docs.map((doc)=>{
            return doc.data()["memberId"];
        })
        return id;
    })
    if(userId[0]==undefined || userId[0]==""){
        return projectSchedule;
    }
    let mySchedule=await getUserSchedule(userId[0]);

    let adjustSchedule=[];
    for(let i=0;i<mySchedule.length;i++){
        let sum=mySchedule[i]+projectSchedule[i];
        if(projectSchedule[i]==3){
            adjustSchedule[i]=0;
        }
        else if(projectSchedule[i]==4){
            adjustSchedule[i]=1;
        }
        else if(projectSchedule[i]==5){
            adjustSchedule[i]=2;
        }
        else{
            adjustSchedule[i]=mySchedule[i];
        }
    }
    return adjustSchedule;
}

//週間テンプレートを取得する関数
async function getWeekSchedule(uid){
    var temp = await db.collection("account").doc(uid).get()
    .then((querySnapshot) => {
        var buff = querySnapshot.data()["week"];
        return buff;
    }).catch((error) => {
        console.log("データの取得失敗(${error})");
    })
    if(temp.length==0){
        temp=[null];
    }
    return temp;
}

//週間テンプレートを登録する関数
function setWeekSchedule(userId,weekSchedule){
    db.collection("account").doc(userId).update({
        week:weekSchedule
    })
    .then(()=>{
        changeMySchedule(userId, weekSchedule);
    })
}

//週間テンプレートが変更されたときmyスケを変更する関数
async function changeMySchedule(userId,weekAfterSchedule){
    let mySchedule=await db.collection("account").doc(userId).collection("myScheduleId").orderBy("date").get()
    .then(async(querySnapshot)=>{
        let temp=await querySnapshot.docs.map((doc)=>{
            return doc.data()["mySchedule"];
        })
        return temp;
    })
    let scheduleId=[];
    let i=0;
    db.collection("account").doc(userId).collection("myScheduleId").orderBy("date").get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            scheduleId[i] = doc.id;
            i++;
        });

        let today=new Date();
        for(let j=0;j<60;j++){
            let day=today.getDay();
            for(let k=0;k<144;k++){
                if(mySchedule[j][k]<=2){
                    mySchedule[j][k]=weekAfterSchedule[day*144+k];
                }
            }
            if(j<59){
                db.collection("account").doc(userId).collection("myScheduleId").doc(scheduleId[j]).update({
                    mySchedule:mySchedule[j]
                })
            }
            else{
                db.collection("account").doc(userId).collection("myScheduleId").doc(scheduleId[j]).update({
                    mySchedule:mySchedule[j]
                })
                .then(()=>{
                    location.reload();
                })
            }
            today.setDate(today.getDate() + 1);     //日付を1日進める
        }
    })
}
