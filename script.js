// psubscirbe you have 19 webhint warnings please fix your player
// i know mine has like 6 warnings but i can only fix 2 one of those and 1 of the warnings i can fix isnt all that important
// btw your player hangs sometimes on me on firefox please test it for firefox too there are firefox users too yknow??!??!@!?@?!@?!

let isPlaying;

function base64ToBytes(base64) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function bytesToBase64(bytes) {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join("");
  return btoa(binString);
}
// above functions stolen from MDN docs thank you so much

setTimeout(
  (hash_change = (hash = window.location.hash) => {
    if (hash) {
      hashparts = hash.substring(1).split("@");
      hashparts[2] = hash.substring(1).split("]")[1];
      document.getElementById("bytebeat-code").value = new TextDecoder().decode(
        base64ToBytes(hashparts[0])
      );
      document.getElementById("sample-rate").value = parseInt(hashparts[1]);
      document.getElementById("mode").value = hashparts[2];
    }
  }),
  1
);

async function copyLink() {
  copylinkbutton = document.getElementById("copylinkbutt");
  await navigator.clipboard.writeText(
    "https://butterroach.github.io/jstebeat/#" +
      bytesToBase64(
        new TextEncoder().encode(document.getElementById("bytebeat-code").value)
      ) +
      "@" +
      document.getElementById("sample-rate").value +
      "]" +
      document.getElementById("mode").value
  );
  copylinkbutton.textContent = "Copied!";
  setTimeout(function () {
    copylinkbutton.textContent = "Copy link";
  }, 3000);
}

async function copyHash() {
  copyhashbutton = document.getElementById("copyhashbutt");
  await navigator.clipboard.writeText(
    "#" +
      bytesToBase64(
        new TextEncoder().encode(document.getElementById("bytebeat-code").value)
      ) +
      "@" +
      document.getElementById("sample-rate").value +
      "]" +
      document.getElementById("mode").value
  );
  copyhashbutton.textContent = "Copied!";
  setTimeout(function () {
    copyhashbutton.textContent = "Copy hash";
  }, 3000);
}

function numToInt8(num) {
  // this is easier with a function
  const arr = new Int8Array(1);
  arr[0] = num;
  return arr[0];
}

function playBytebeat() {
  if (isPlaying) {
    return;
  } else isPlaying = true;
  E = Math.E;
  PI = Math.PI;
  TAU = PI * 2;
  abs = Math.abs;
  acos = Math.acos;
  cbrt = Math.cbrt;
  ceil = Math.ceil;
  cos = Math.cos;
  exp = Math.exp;
  floor = Math.floor;
  log = Math.log;
  max = Math.max;
  min = Math.min;
  random = Math.random;
  round = Math.round;
  sin = Math.sin;
  sqrt = Math.sqrt;
  tan = Math.tan;
  pow = Math.pow;
  asin = Math.asin;
  atan = Math.atan;
  int = Math.floor;
  let bytebeatCode = document.getElementById("bytebeat-code").value; // not a constant since it will be modified if its a minibake
  const sampleRate = document.getElementById("sample-rate").value;
  const bytebeatMode = document.getElementById("mode").value;
  audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: parseInt(sampleRate),
  });
  const bufferSize = 4096;
  t = 1024;
  // make minibakes not so laggy
  if (
    /^eval\(unescape\(escape(?:`|\('|\("|\(`)(.*?)(?:`|'\)|"\)|`\)).replace\(\/u\(\.\.\)\/g,["'`]\$1%["'`]\)\)\)$/.test(
      bytebeatCode
    )
  ) {
    bytebeatCode = eval(bytebeatCode.replace("eval", ""));
  }
  const scriptNode = audioContext.createScriptProcessor(
    bufferSize,
    0,
    (isStereo = Array.isArray(eval(bytebeatCode))) ? 2 : 1
  );
  let t_jstebeat = 0; // different name to not break some stuff
  scriptNode.onaudioprocess = function (audioProcessingEvent) {
    let outputBuffer = audioProcessingEvent.outputBuffer;
    if (isStereo) {
      leftOutputBuffer = outputBuffer.getChannelData(0);
      rightOutputBuffer = outputBuffer.getChannelData(1);
    } else {
      outputBuffer = outputBuffer.getChannelData(0);
    }
    for (let i_jstebeat = 0; i_jstebeat < bufferSize; i_jstebeat++) {
      t = t_jstebeat++;
      if (isStereo) {
        with (this) {
          kjsjstebeat_result = eval(bytebeatCode);
        }
        if (bytebeatMode === "bb") {
          leftsample = (kjsjstebeat_result[0] & 255) / 128 - 1;
          rightsample = (kjsjstebeat_result[1] & 255) / 128 - 1;
        } else if (bytebeatMode === "sbb") {
          leftsample = numToInt8(kjsjstebeat_result[0]) / 128;
          rightsample = numToInt8(kjsjstebeat_result[1]) / 128;
        } else if (bytebeatMode === "fb") {
          leftsample = kjsjstebeat_result[0];
          rightsample = kjsjstebeat_result[1];
        } else {
          // just in case
          leftsample = (kjsjstebeat_result & 255) / 128 - 1;
          rightsample = (kjsjstebeat_result & 255) / 128 - 1;
        }
        leftOutputBuffer[i_jstebeat] = leftsample;
        rightOutputBuffer[i_jstebeat] = rightsample;
      } else {
        with (this) {
          kjsjstebeat_result = eval(bytebeatCode);
        }
        if (bytebeatMode === "bb") {
          sample = (kjsjstebeat_result & 255) / 128 - 1;
        } else if (bytebeatMode === "sbb") {
          sample = numToInt8(kjsjstebeat_result) / 128;
        } else if (bytebeatMode === "fb") {
          sample = kjsjstebeat_result;
        } else {
          sample = (kjsjstebeat_result & 255) / 128 - 1; // just in case
        }
        outputBuffer[i_jstebeat] = sample;
      }
    }
  };

  scriptNode.connect(audioContext.destination);
}

function stopBytebeat() {
  audioContext.suspend();
  isPlaying = false;
}
