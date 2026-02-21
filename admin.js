// admin.js
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
let pc, dc;

function logOut(text, append=true){
  const out = document.getElementById('signalOut');
  out.value = append ? out.value + text + '\n' : text + '\n';
}

async function connectToHostOffer(){
  const txt = document.getElementById('signalIn').value.trim();
  if(!txt) return alert('Paste host offer into the input box first');
  pc = new RTCPeerConnection(config);
  pc.onicecandidate = e => { if(e.candidate) logOut(JSON.stringify({ice:e.candidate})); };
  pc.ondatachannel = ev => {
    dc = ev.channel;
    dc.onopen = ()=> logOut('[DataChannel open]');
    dc.onmessage = ev => console.log('admin received', ev.data);
  };
  const obj = JSON.parse(txt);
  await pc.setRemoteDescription(obj.sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  logOut(JSON.stringify({sdp:pc.localDescription}), false);
}

function sendAdmin(cmd, args){
  if(!dc || dc.readyState !== 'open') return alert('Admin DataChannel not open');
  dc.send(JSON.stringify({type:'admin', cmd, args}));
}

document.getElementById('connectBtn').onclick = connectToHostOffer;
document.getElementById('sendPause').onclick = () => sendAdmin('pause');
document.getElementById('sendResume').onclick = () => sendAdmin('resume');
document.getElementById('setScoreBtn').onclick = () => sendAdmin('setScore', {a:3, b:2});