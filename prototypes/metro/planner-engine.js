/* Illustrative network only. Never use these schedules or coordinates for real travel. */
(function(root){
'use strict';
const nodes={
 ap:{name:'Apeksha Hospital · Kadawatha-bound stop',short:'Apeksha Hospital',lat:6.8423,lon:79.9175,area:'Maharagama',access:'Unverified'},
 kwf:{name:'Kaduwela · feeder arrival stop',short:'Kaduwela · feeder stop',lat:6.9358,lon:79.9844,area:'Kaduwela',access:'Unverified'},
 kwm:{name:'Kaduwela · CM05 towards Ekala',short:'Kaduwela · CM05 stop',lat:6.9387,lon:79.9828,area:'Kaduwela',access:'Unverified'},
 kdf:{name:'Kadawatha interchange · feeder arrival',short:'Kadawatha · feeder stop',lat:7.0020,lon:79.9588,area:'Kadawatha',access:'Unverified'},
 kdm:{name:'Kadawatha interchange · CM05 towards Ekala',short:'Kadawatha · CM05 stop',lat:7.0024,lon:79.9588,area:'Kadawatha',access:'Unverified'},
 bt:{name:'Battaramulla Junction · towards Ekala',short:'Battaramulla Junction',lat:6.9030,lon:79.9185,area:'Battaramulla',access:'Unverified'},
 ek:{name:'Ekala Junction',short:'Ekala Junction',lat:7.1050,lon:79.9250,area:'Ekala',access:'Unverified'}
};
const places={
 maharagama:{name:'Maharagama town',access:{ap:1200}},
 apeksha:{name:'Near Apeksha Hospital',access:{ap:320}},
 battaramulla:{name:'Battaramulla',access:{bt:280}},
 kadawatha:{name:'Kadawatha',access:{kdm:180,kdf:200}},
 kaduwela:{name:'Kaduwela',access:{kwm:220,kwf:350}},
 ekala:{name:'Ekala',access:{ek:150}}
};
const services=[
 {id:'feeder',label:'Sample feeder',headsign:'Kadawatha',stopIds:['ap','kwf','kdf'],offsets:[0,26,38],first:396,last:1116,headway:20,accessible:null},
 {id:'CM05',label:'CM05',headsign:'Ekala',stopIds:['bt','kwm','kdm','ek'],offsets:[0,24,35,54],first:390,last:1110,headway:20,accessible:true}
];
const transfers=[{a:'kwf',b:'kwm',distance:600,kind:'street',description:'Different stops · a street transfer is required'},{a:'kdf',b:'kdm',distance:90,kind:'interchange',description:'Within the same sample interchange · no street transfer'}];
function nextDeparture(service,index,ready){let start=service.first+service.offsets[index],n=Math.max(0,Math.ceil((ready-start)/service.headway));let value=start+n*service.headway;return value<=service.last+service.offsets[index]?value:null}
function legTime(distance,mode,speed,pickup){if(mode==='walk')return {duration:Math.ceil(distance/speed),travel:Math.ceil(distance/speed),pickup:0};let drive=Math.max(2,Math.ceil(distance/250));return {duration:drive+pickup,travel:drive,pickup}}
function modeList(distance,opt){return opt.allowRoad&&distance>=400?['walk','road']:['walk']}
function optionsPath(from,dest){let paths=[];let access=places[from]?.access;if(!access||!places[dest])return paths;let destNodes=Object.keys(places[dest].access);
 for(let [start,distance] of Object.entries(access))for(let s1 of services){let i=s1.stopIds.indexOf(start);if(i<0)continue;for(let j=i+1;j<s1.stopIds.length;j++){
 let end=s1.stopIds[j];let one={service:s1,from:start,to:end,fromIndex:i,toIndex:j,duration:s1.offsets[j]-s1.offsets[i]};
 if(destNodes.includes(end))paths.push({distance,buses:[one],transfer:null,exitDistance:places[dest].access[end]});
 for(let x of transfers){let change=x.a===end?x.b:x.b===end?x.a:null;if(!change)continue;for(let s2 of services){if(s2.id===s1.id)continue;let ii=s2.stopIds.indexOf(change);if(ii<0)continue;for(let jj=ii+1;jj<s2.stopIds.length;jj++)if(destNodes.includes(s2.stopIds[jj]))paths.push({distance,buses:[one,{service:s2,from:change,to:s2.stopIds[jj],fromIndex:ii,toIndex:jj,duration:s2.offsets[jj]-s2.offsets[ii]}],transfer:{...x,from:end,to:change},exitDistance:places[dest].access[s2.stopIds[jj]]});}}
 }}return paths}
function solve(params){let opt={from:'maharagama',to:'ekala',time:384,speed:80,pickup:3,buffer:3,maxWalk:2000,allowRoad:true,stepFree:false,...params};let raw=optionsPath(opt.from,opt.to),out=[];
 for(let path of raw){if(opt.stepFree&&path.buses.some(b=>b.service.accessible!==true))continue;for(let firstMode of modeList(path.distance,opt))for(let transferMode of path.transfer?modeList(path.transfer.distance,opt):['walk']){
 let t=opt.time,legs=[],walking=0,warnings=[],minMargin=Infinity,firstCatch=null;
 function accessLeg(from,to,distance,mode,kind){let timing=legTime(distance,mode,opt.speed,opt.pickup);let l={type:mode==='road'?'road':'walk',from,to,distance,start:t,end:t+timing.duration,...timing,kind};legs.push(l);if(mode==='walk')walking+=distance;t=l.end;return l}
 let access=accessLeg(places[opt.from].name,nodes[path.buses[0].from].name,path.distance,firstMode,'access');
 let rejected=false;
 for(let k=0;k<path.buses.length;k++){let b=path.buses[k];if(k>0){accessLeg(nodes[path.transfer.from].name,nodes[path.transfer.to].name,path.transfer.distance,transferMode,'transfer')}
 let ready=t+opt.buffer,dep=nextDeparture(b.service,b.fromIndex,ready);if(dep===null){rejected=true;break}
 let soonest=nextDeparture(b.service,b.fromIndex,k===0?opt.time:legs.filter(l=>l.type==='bus').at(-1).end);let margin=dep-ready;minMargin=Math.min(minMargin,margin);
 if(k===0)firstCatch={nextBus:soonest,boardingBus:dep,accessArrival:t,ready,margin,missedEarlier:soonest!==null&&dep>soonest,accessMode:firstMode,accessDuration:access.duration};
 if(soonest!==null&&dep>soonest&&k>0)warnings.push('Earlier connection is too tight; this option uses the following bus.');
 if(margin<3)warnings.push('Tight timing: only '+margin+' min remain after the boarding allowance.');
 legs.push({type:'bus',service:b.service.id,label:b.service.label,headsign:b.service.headsign,accessible:b.service.accessible,from:nodes[b.from].name,to:nodes[b.to].name,fromId:b.from,toId:b.to,start:dep,end:dep+b.duration,duration:b.duration,wait:dep-t,buffer:opt.buffer,margin});t=dep+b.duration;
 }
 if(rejected)continue;accessLeg(nodes[path.buses.at(-1).to].name,places[opt.to].name,path.exitDistance,'walk','exit');
 if(legs.some(l=>l.type==='walk'&&l.distance>opt.maxWalk))continue;
 let roadCount=legs.filter(l=>l.type==='road').length;
 out.push({id:[path.buses.map(b=>b.service.id).join('-'),path.transfer?.from||'direct',firstMode,transferMode].join('_'),from:opt.from,to:opt.to,start:opt.time,end:t,duration:t-opt.time,legs,walking,roadCount,changes:path.buses.length-1,minMargin,firstCatch,warnings:[...new Set(warnings)],transfer:path.transfer,options:opt});
 }}
 out.sort((a,b)=>a.end-b.end||a.roadCount-b.roadCount||a.walking-b.walking);
 return {journeys:out,reason:!raw.length?'unsupported':opt.stepFree&&!out.length?'accessibility':!out.length?'unavailable':null,options:opt}
}
function haversine(a,b){let rad=x=>x*Math.PI/180;let dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon);let h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;return Math.round(6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)))}
function nearest(lat,lon){return Object.entries(nodes).map(([id,n])=>({id,...n,distance:haversine({lat,lon},n)})).sort((a,b)=>a.distance-b.distance)}
const api={nodes,places,services,transfers,nextDeparture,legTime,solve,nearest};root.MetroPlanner=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
