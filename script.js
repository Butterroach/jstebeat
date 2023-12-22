// psubscirbe you have 19+ webhint warnings please fix your player
// i know mine has like 6 warnings but i can only fix 2 one of those and 1 of the warnings i can fix isnt all that important
// btw i changed how it makes the math aliases it's shorter you can copypaste the new one at least?
// kthxbye!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

let isPlaying;
let AlreadyAppended = false;
let exoticwarningheader = document.createElement("h1");
let exoticwarningtext = document.createElement("p");
let nonexoticbutton = document.createElement("button");
exoticwarningheader.innerText = "EXOTIC WARNING!";
exoticwarningtext.innerText =
    "You're using an exotic mode. This probably won't work in other players (that don't have this mode). You can click the button below to copy a non-exotic version into your clipboard.";
nonexoticbutton.type = "button"; // why do i have to specify that a button is a button?
nonexoticbutton.innerText = nonexoticorigtext =
    "Copy non-exotic version into clipboard ✨ (result should be played as floatbeat, THIS WILL NOT WORK WITH STEREO STUFF)";
nonexoticbutton.onclick = async function () {
    if (
        (bytebeatmode = document.getElementById("mode").value) === "4096exotic"
    ) {
        await navigator.clipboard.writeText(
            "((" +
                document.getElementById("bytebeat-code").value +
                ")&4095)/2048-1"
        );
    } else if (bytebeatmode === "detailedbeatexotic") {
        await navigator.clipboard.writeText(
            "val=(" +
                document.getElementById("bytebeat-code").value +
                "),((val&255)+Math.abs(val)%1)%256/128-1"
        );
    } else {
        console.warn(
            "you forgot to add a check in the nonexoticbutton.onclick function"
        );
        return;
    }
    nonexoticbutton.textContent = "Copied! ✨";
    setTimeout(function () {
        nonexoticbutton.textContent = nonexoticorigtext;
    }, 3000);
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

setInterval(
    (toggleexoticwarning = () => {
        const bytebeatMode = document.getElementById("mode").value;
        if (bytebeatMode.endsWith("exotic")) {
            if (!AlreadyAppended) {
                AlreadyAppended = true;
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
            }
        } else {
            AlreadyAppended = false;
            exoticwarningheader.remove();
            exoticwarningtext.remove();
            nonexoticbutton.remove();
        }
    }),
    100
); // surprisingly this doesn't lag on chrome

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
    const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join(
        ""
    );
    return btoa(binString);
}
// the 2 above functions are stolen from MDN docs thank you very much

setTimeout(
    (hash_change = (hash = window.location.hash) => {
        if (hash) {
            hashparts = hash.substring(1).split("@");
            hashparts[2] = hash.substring(1).split("]")[1];
            document.getElementById("bytebeat-code").value =
                new TextDecoder().decode(base64ToBytes(hashparts[0]));
            document.getElementById("sample-rate").value = parseInt(
                hashparts[1]
            );
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
                new TextEncoder().encode(
                    document.getElementById("bytebeat-code").value
                )
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
                new TextEncoder().encode(
                    document.getElementById("bytebeat-code").value
                )
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

dontdelete = [];

for (let prop in this) {
    if (this.hasOwnProperty(prop)) {
        dontdelete.push(prop); // all variables defined at this point should NOT be deleted
    }
}

function handle(bytebeatMode, value, t) {
    // handles values and corrects them accordingly
    if (bytebeatMode === "bb") {
        return (value & 255) / 128 - 1;
    } else if (bytebeatMode === "sbb") {
        return ((value + 128) & 255) / 128 - 1;
    } else if (bytebeatMode === "fb") {
        return value;
    } else if (bytebeatMode === "4096exotic") {
        return (value & 4095) / 2048 - 1;
    } else if (bytebeatMode === "detailedbeatexotic") {
        return (((value & 255) + (Math.abs(value) % 1)) % 256) / 128 - 1;
    }
    if (t === 1) {
        console.warn("This bytebeat mode is invalid... " + bytebeatMode);
    }
    return (value & 255) / 128 - 1; // just in case
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
    bytebeat_func = Function("t", `return 0,\n${bytebeatCode || 0};`);
    bytebeat_func(0);
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
                    result = bytebeat_func(t);
                }
                leftsample = handle(bytebeatMode, result[0], t);
                rightsample = handle(bytebeatMode, result[1], t);
                leftOutputBuffer[i_jstebeat] = leftsample;
                rightOutputBuffer[i_jstebeat] = rightsample;
            } else {
                with (this) {
                    result = bytebeat_func(t);
                }
                outputBuffer[i_jstebeat] = handle(bytebeatMode, result, t);
            }
        }
    };

    scriptNode.connect(audioContext.destination);
}

function stopBytebeat() {
    audioContext.suspend();
    isPlaying = false;
    for (let prop in this) {
        if (
            this.hasOwnProperty(prop) &&
            !dontdelete.includes(prop) &&
            typeof Math[prop] === "undefined"
        ) {
            delete this[prop]; // this definitely will not break anything
        }
    }
}
