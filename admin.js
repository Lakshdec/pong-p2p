// ---------------------------
// ADMIN EMAIL + PASSWORD AUTH
// ---------------------------

// CHANGE THESE to your allowed credentials
const allowedEmail = "lsharmadec@gmail.com";
const allowedPassword = "adminlaksh";

document.getElementById("loginBtn").addEventListener("click", () => {
  const enteredEmail = document.getElementById("adminEmail").value.trim();
  const enteredPassword = document.getElementById("adminPassword").value.trim();
  const message = document.getElementById("authMessage");

  if (enteredEmail === allowedEmail && enteredPassword === allowedPassword) {
    // Success — show admin controls
    document.getElementById("authSection").style.display = "none";
    document.getElementById("adminControls").style.display = "block";
    message.style.display = "none";
  } else {
    // Failure — deny access
    message.textContent = "Access denied. Incorrect email or password.";
    message.style.display = "block";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  document.getElementById("adminControls").style.display = "none";
  document.getElementById("authSection").style.display = "flex";
  document.getElementById("adminEmail").value = "";
  document.getElementById("adminPassword").value = "";
});


// ---------------------------
// ORIGINAL ADMIN PANEL LOGIC
// ---------------------------

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

  pc.onicecandidate = e => {
    if(e.candidate) logOut(JSON.stringify({ice:e.candidate}));
  };

  pc.ondatachannel = ev => {
    dc = ev.channel;
    dc.onopen = () => logOut('[DataChannel open]');
    dc.onmessage = ev => console.log('admin received', ev.data);
  };

  const obj = JSON.parse(txt);
  await pc.setRemoteDescription(obj.sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  logOut(JSON.stringify({sdp:pc.localDescription}), false);
}

function sendAdmin(cmd, args){
  if(!dc || dc.readyState !== 'open')
    return alert('Admin DataChannel not open');

  dc.send(JSON.stringify({type:'admin', cmd, args}));
}

document.getElementById('connectBtn').onclick = connectToHostOffer;
document.getElementById('sendPause').onclick = () => sendAdmin('pause');
document.getElementById('sendResume').onclick = () => sendAdmin('resume');
document.getElementById('setScoreBtn').onclick = () => sendAdmin('setScore', {a:3, b:2});