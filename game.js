// game.js
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let pc, dc, isHost = false;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

let localInput = { up:false, down:false };
let remoteState = null;
let hostGame = {
  ball:{x:400,y:200,vx:200,vy:120},
  paddles:[{y:170},{y:170}],
  scores:[0,0],
  paused:false
};

function logOut(text, append=true){
  const out = document.getElementById('signalOut');
  out.value = append ? out.value + text + '\n' : text + '\n';
}

function setupDataChannel(ch){
  ch.onopen = () => logOut('[DataChannel open]');
  ch.onmessage = ev => {
    try {
      const msg = JSON.parse(ev.data);
      if(msg.type === 'input' && isHost) applyRemoteInput(msg);
      else if(msg.type === 'state' && !isHost) remoteState = msg;
      else if(msg.type === 'admin' && isHost) handleAdmin(msg);
    } catch(e){}
  };
}

function applyRemoteInput(msg){
  if(msg.up) hostGame.paddles[1].y -= 6;
  if(msg.down) hostGame.paddles[1].y += 6;
  clampPaddles();
}

function clampPaddles(){
  hostGame.paddles.forEach(p => {
    if(p.y < 0) p.y = 0;
    if(p.y > canvas.height - 60) p.y = canvas.height - 60;
  });
}

async function createRoom(){
  isHost = true;
  pc = new RTCPeerConnection(config);
  dc = pc.createDataChannel('game');
  setupDataChannel(dc);
  pc.onicecandidate = e => { if(e.candidate) logOut(JSON.stringify({ice:e.candidate})); };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  logOut(JSON.stringify({sdp:pc.localDescription}), false);
  runHostLoop();
}

async function joinWithOfferText(text){
  pc = new RTCPeerConnection(config);
  pc.ondatachannel = ev => { dc = ev.channel; setupDataChannel(dc); };
  pc.onicecandidate = e => { if(e.candidate) logOut(JSON.stringify({ice:e.candidate})); };
  const obj = JSON.parse(text);
  await pc.setRemoteDescription(obj.sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  logOut(JSON.stringify({sdp:pc.localDescription}), false);
}

function addIceFromText(text){
  const lines = text.trim().split('\n');
  lines.forEach(l => {
    try {
      const o = JSON.parse(l);
      if(o.ice && pc) pc.addIceCandidate(o.ice).catch(()=>{});
    } catch(e){}
  });
}

function sendInput(){
  if(!dc || dc.readyState !== 'open') return;
  dc.send(JSON.stringify({type:'input', up:localInput.up, down:localInput.down, t:Date.now()}));
}

function runHostLoop(){
  let last = performance.now();
  function step(now){
    const dt = (now - last)/1000; last = now;
    if(!hostGame.paused){
      // Apply host's own input to paddle 0
      if(localInput.up) hostGame.paddles[0].y -= 6;
      if(localInput.down) hostGame.paddles[0].y += 6;
      
      hostGame.ball.x += hostGame.ball.vx * dt;
      hostGame.ball.y += hostGame.ball.vy * dt;
      if(hostGame.ball.y < 6 || hostGame.ball.y > canvas.height - 6) hostGame.ball.vy *= -1;
      if(hostGame.ball.x < 40 && hostGame.ball.x > 20){
        if(hostGame.ball.y > hostGame.paddles[0].y && hostGame.ball.y < hostGame.paddles[0].y + 60) hostGame.ball.vx *= -1;
      }
      if(hostGame.ball.x > canvas.width - 40 && hostGame.ball.x < canvas.width - 20){
        if(hostGame.ball.y > hostGame.paddles[1].y && hostGame.ball.y < hostGame.paddles[1].y + 60) hostGame.ball.vx *= -1;
      }
      if(hostGame.ball.x < 0){ hostGame.scores[1]++; resetBall(); }
      if(hostGame.ball.x > canvas.width){ hostGame.scores[0]++; resetBall(); }
    }
    if(dc && dc.readyState === 'open') dc.send(JSON.stringify({type:'state', ball:hostGame.ball, paddles:hostGame.paddles, scores:hostGame.scores, t:Date.now()}));
    drawState(isHost ? hostGame : (remoteState || hostGame));
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function resetBall(){
  hostGame.ball.x = 400; hostGame.ball.y = 200;
  hostGame.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 200;
  hostGame.ball.vy = (Math.random() > 0.5 ? 1 : -1) * 120;
}

function drawState(s){
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(s.ball.x-6, s.ball.y-6, 12, 12);
  ctx.fillRect(20, s.paddles[0].y, 10, 60);
  ctx.fillRect(canvas.width-30, s.paddles[1].y, 10, 60);
  ctx.font = '20px monospace'; ctx.fillText(`${s.scores[0]} — ${s.scores[1]}`, canvas.width/2 - 20, 30);
}

function handleAdmin(msg){
  if(msg.cmd === 'pause') hostGame.paused = true;
  if(msg.cmd === 'resume') hostGame.paused = false;
  if(msg.cmd === 'setScore' && msg.args) hostGame.scores = [msg.args.a||0, msg.args.b||0];
}

// wire UI buttons (assumes same IDs as HTML)
document.getElementById('createBtn').onclick = createRoom;
document.getElementById('joinBtn').onclick = () => {
  const txt = document.getElementById('signalIn').value.trim();
  if(!txt) return alert('Paste host offer into the input box first');
  joinWithOfferText(txt);
};
document.getElementById('addIceBtn').onclick = () => addIceFromText(document.getElementById('signalIn').value);
document.getElementById('copyBtn').onclick = () => {
  const out = document.getElementById('signalOut'); out.select(); document.execCommand('copy');
};

window.addEventListener('keydown', e => {
  if(e.key === 'ArrowUp') localInput.up = true;
  if(e.key === 'ArrowDown') localInput.down = true;
  sendInput();
});
window.addEventListener('keyup', e => {
  if(e.key === 'ArrowUp') localInput.up = false;
  if(e.key === 'ArrowDown') localInput.down = false;
  sendInput();
});

setInterval(()=> { if(!isHost && remoteState) drawState(remoteState); }, 1000/30);