let isPlaying;

setTimeout(
  (hash_change = (a) => {
    hash = a || window.location.hash;
    if (hash) {
      hashparts = a.substring(1).split("@");
      hashparts[2] = a.substring(1).split("]")[1];
      document.getElementById("bytebeat-code").value = atob(hashparts[0]);
      document.getElementById("sample-rate").value = parseInt(hashparts[1]);
      document.getElementById("mode").value = hashparts[2];
    }
  })
);

async function copyLink() {
  copylinkbutton = document.getElementById("copylinkbutt");
  await navigator.clipboard.writeText(
    "https://butterroach.github.io/jstebeat/#" +
      btoa(document.getElementById("bytebeat-code").value) +
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
  const bytebeatCode = document.getElementById("bytebeat-code").value;
  const sampleRate = document.getElementById("sample-rate").value;
  const bytebeatMode = document.getElementById("mode").value;
  errorP = document.getElementById("error");
  audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: parseInt(sampleRate),
  });
  const bufferSize = 4096;
  const scriptNode = audioContext.createScriptProcessor(bufferSize, 0, 1);
  let t_jstebeat = 0; // different name to not break some stuff
  let errori = 0;
  scriptNode.onaudioprocess = function (audioProcessingEvent) {
    const outputBuffer = audioProcessingEvent.outputBuffer.getChannelData(0);
    for (let i_jstebeat = 0; i_jstebeat < bufferSize; i_jstebeat++) {
      t = t_jstebeat++;
      try {
        const kjsjstebeat = eval(bytebeatCode);
        if (bytebeatMode === "bb") {
          sample = (kjsjstebeat & 255) / 128 - 1;
        } else if (bytebeatMode === "sbb") {
          sample = numToInt8(kjsjstebeat) / 128;
        } else if (bytebeatMode === "fb") {
          sample = kjsjstebeat;
        } else {
          sample = (kjsjstebeat & 255) / 128 - 1; // just in case
        }
        outputBuffer[i_jstebeat] = sample;
        errori > 0 ? (errori = 0) : 0;
      } catch (error) {
        errorP.innerText = error;
        errori++;
        if (errori > 4096) {
          stopBytebeat(); // prevent lag (value might be overkill)
          return;
        }
        continue;
      }
    }
  };

  scriptNode.connect(audioContext.destination);
}

function stopBytebeat() {
  audioContext.suspend();
  errorP.InnerText = "No error";
  isPlaying = false;
}
