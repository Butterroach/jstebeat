// psubscirbe you have 19 webhint warnings please fix your player
// i know mine has like 6 warnings but i can only fix 2 one of those and 1 of the warnings i can fix isnt all that important
// btw your player hangs sometimes on me on firefox please test it for firefox too there are firefox users too yknow??!??!@!?@?!@?!

let isPlaying;
let exoticwarningheader = document.createElement("h1");
let exoticwarningtext = document.createElement("p");
let nonexoticbutton = document.createElement("button");
exoticwarningheader.innerText = "EXOTIC WARNING!";
exoticwarningtext.innerText =
  "You're using an exotic mode. This probably won't work in other players (that don't have this mode). You can click the button below to copy a non-exotic version into your clipboard.";
nonexoticbutton.type = "button"; // why do i have to specify that a button is a button?
nonexoticbutton.innerText = nonexoticorigtext =
  "Copy non-exotic version into clipboard ✨ (result should be played as floatbeat)";
nonexoticbutton.onclick = async function () {
  if ((bytebeatmode = document.getElementById("mode").value) === "4096exotic") {
    await navigator.clipboard.writeText(
      "((" + document.getElementById("bytebeat-code").value + ")&4095)/2048-1"
    );
    nonexoticbutton.textContent = "Copied! ✨";
    setTimeout(function () {
      nonexoticbutton.textContent = nonexoticorigtext;
    }, 3000);
  } else {
    console.warn(
      "you forgot to add a check in the nonexoticbutton.onclick function"
    );
  }
};

math_items = Object.getOwnPropertyNames(Math);
for (let item in math_items) {
  // create math aliases
  item = math_items[item];
  this[item] = Math[item];
}
int = Math.floor; // honorable mention

setTimeout(
  () =>
    localStorage.getItem("backgroundColor") === null
      ? localStorage.setItem("backgroundColor", "#1e1e1e")
      : ((document.body.style.backgroundColor =
          localStorage.getItem("backgroundColor")),
        (document.getElementById("background-color").value =
          localStorage.getItem("backgroundColor"))),
  1
); // I CLEARLY DON'T KNOW WHAT I'M DOING

setTimeout(
  (toggleexoticwarning = () => {
    const bytebeatMode = document.getElementById("mode").value;
    if (bytebeatMode.endsWith("exotic")) {
      document.body.appendChild(exoticwarningheader);
      document.body.appendChild(exoticwarningtext);
      document.body.appendChild(nonexoticbutton);
      document
        .getElementById("customization-settings-header")
        .before(exoticwarningheader);
      document
        .getElementById("customization-settings-header")
        .before(exoticwarningtext);
      document
        .getElementById("customization-settings-header")
        .before(nonexoticbutton);
    } else {
      exoticwarningheader.remove();
      exoticwarningtext.remove();
      nonexoticbutton.remove();
    }
  }),
  1
);
function updateBackground() {
  const color = document.getElementById("background-color").value;
  document.body.style.backgroundColor = color;
  localStorage.setItem("backgroundColor", color);
}

function resetBackground() {
  const color = "#1e1e1e";
  document.getElementById("background-color").value = color;
  document.body.style.backgroundColor = color;
  localStorage.setItem("backgroundColor", color);
}

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
  let bytebeatCode = document.getElementById("bytebeat-code").value; // not a constant since it will be modified if its a minibake
  const sampleRate = document.getElementById("sample-rate").value;
  const bytebeatMode = document.getElementById("mode").value;
  audioContext = new window.AudioContext({
    sampleRate: parseInt(sampleRate),
  });
  const bufferSize = 4096;
  t = 1024;
  // make minibakes not so laggy
  if (
    /^eval\(unescape\(escape(?:`|\('|\("|\(`)(.*?)(?:`|'\)|"\)|`\)).replace\(\/u\(\.\.\)\/g,["'`]\$1%["'`]\)\)\)$/.test(
      bytebeatCode.replaceAll(" ", "")
    )
  ) {
    bytebeatCode = eval(bytebeatCode.replace("eval", ""));
  }
  bytebeat_func = Function("t", `return ${bytebeatCode};`);
  bytebeat_func(0); // turns out this fixes the old issue of how you cant do t?0:x=0
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
          kjsjstebeat_result = bytebeat_func(t);
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
        } else if (bytebeatMode === "4096exotic") {
          leftsample = (kjsjstebeat_result[0] & 4095) / 2048 - 1;
          rightsample = (kjsjstebeat_result[1] & 4095) / 2048 - 1;
        } else {
          // just in case
          t == 1
            ? console.warn("This bytebeat mode is invalid... " + bytebeatMode)
            : 0;
          leftsample = (kjsjstebeat_result & 255) / 128 - 1;
          rightsample = (kjsjstebeat_result & 255) / 128 - 1;
        }
        leftOutputBuffer[i_jstebeat] = leftsample;
        rightOutputBuffer[i_jstebeat] = rightsample;
      } else {
        with (this) {
          kjsjstebeat_result = bytebeat_func(t);
        }
        if (bytebeatMode === "bb") {
          sample = (kjsjstebeat_result & 255) / 128 - 1;
        } else if (bytebeatMode === "sbb") {
          sample = numToInt8(kjsjstebeat_result) / 128;
        } else if (bytebeatMode === "fb") {
          sample = kjsjstebeat_result;
        } else if (bytebeatMode === "4096exotic") {
          sample = (kjsjstebeat_result & 4095) / 2048 - 1;
        } else {
          t == 1
            ? console.warn("This bytebeat mode is invalid... " + bytebeatMode)
            : 0;
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
