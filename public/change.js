function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


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
    //console.log(userId);
    let project=await db.collection("account").doc(userId).get()
    .then((querySnapshot)=>{
        //console.log(querySnapshot);
        let temp= querySnapshot.data()["joinProject"];
        return temp;
    })
    //console.log(project.length);
    for(let i=0;i<project.length;i++){
        if(project[i]==""){
            //console.log(i);
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
        
        //console.log("start:"+start,"finish:"+finish);
        let diffMySchedule=[];
        for(let j=0;j<=finish;j++){
            for(let k=0;k<144;k++){
                diffMySchedule[j*144+k]=changeMy[(start+j)*144+k];
            }
        }
        console.log(beforeSchedule);
        console.log(afterSchedule);
        console.log(changeMy);
        console.log(diffMySchedule);

        //console.log(i);
        db.collection("project").doc(project[i]).collection("projectMemberPeriod").where("memberId","==",userId).get()
        .then(async(querySnapshot)=>{
            //console.log(userId);
            let projectSchedule=await querySnapshot.docs.map((doc)=>{
                return doc.data()["projectSchedule"];
            })
            let userProjectId= await querySnapshot.docs.map((doc)=>{
                return doc.id;
            })
            //console.log(userProjectId);
            console.log(projectSchedule);
            let diffProjectSchedule=[];
            /*for(let j=0;j<=finish;j++){
                for(let k=0;k<144;k++){
                    let diff=beforeSchedule[(start+j)*144+k]+projectSchedule[0][j*144+k];
                    if(diff%3==0){
                        diffProjectSchedule[j*144+k]=0;
                    }
                    else if(diff%3==1){
                        diffProjectSchedule[j*144+k]=1;
                    }
                    else if(diff%3==2){
                        diffProjectSchedule[j*144+k]=2;
                    }
                }
            }*/
            console.log(diffProjectSchedule);

            let schedule=[];
            /*for(let j=0;j<=finish;j++){
                for(let k=0;k<144;k++){
                    let sum=diffProjectSchedule[j*144+k]+diffMySchedule[j*144+k];
                    if(diffProjectSchedule[j*144+k]==1){
                        schedule[j*144+k]=projectSchedule[0][j*144+k];
                    }
                    else if(sum%3==0){
                        schedule[j*144+k]=0;
                    }
                    else if(sum%3==1){
                        schedule[j*144+k]=1;
                    }
                    else if(sum%3==2){
                        schedule[j*144+k]=2;
                    }
                }
            }*/
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
            console.log(schedule);
            db.collection("project").doc(project[i]).collection("projectMemberPeriod").doc(userProjectId[0]).update({
                projectSchedule:schedule
            })
        })
        .then(()=>{
            alert("変更できました");
        })
    }
}

async function diffSchedule(userId,newSchedule,mySchedule){
    /*var projectId=getParam("project");
    let today=new Date();
    let stringToday = parseInt(today.getFullYear()*10000) + parseInt((today.getMonth() +1)*100) + parseInt(today.getDate());
    let period=await db.collection("project").doc(projectId).get()
    .then((querySnapshot)=>{
        return querySnapshot.data()["projectPeriod"];
    })
    let start=period[0]-stringToday;
    let finish=period[1]-period[0];*/
    console.log(mySchedule);
    let diffProjectSchedule=[];
    for(let i=0;i<mySchedule.length;i++){
        let diff=newSchedule[i]-mySchedule[i];
        if(diff==0){
            diffProjectSchedule[i]=0;
        }
        else{
            if(newSchedule[i]==0){
                diffProjectSchedule[i]=1;
            }
            else if(newSchedule[i]==1){
                diffProjectSchedule[i]=2;
            }
            else if(newSchedule[i]==2){
                diffProjectSchedule[i]=3;
            }
        }
    }
    console.log(diffProjectSchedule);
    return diffProjectSchedule;
}

async function adjustSchedule(projectSchedule,memberIndex){
    console.log("o^i");
    var projectId=getParam("project");
    let userId=await db.collection("project").doc(projectId).collection("projectMemberPeriod")
    .where("memberIndex","==",memberIndex).get()
    .then(async(querySnapshot)=>{
        let id=await querySnapshot.docs.map((doc)=>{
            return doc.data()["memberId"];
        })
        return id;
    })
    console.log(userId);
    console.log(memberIndex);
    console.log(userId[0]);
    if(userId[0]==undefined || userId[0]==""){
        return projectSchedule;
    }
    let mySchedule=await getUserSchedule(userId[0]);
    console.log(mySchedule);

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
    console.log(adjustSchedule);
    return adjustSchedule;
}