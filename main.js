'use strict';

let audioContext;
let t;
let currentNodeId;
let snapshot = null;
let isPlaying = false;
let isPaused = false;
let tJstebeat = 0; // different name to not break some stuff
let bytebeatNode = null;
let dontDelete = [];
let alreadyAppended = false;
let tCounter;
let exoticWarningHeader = document.createElement("h2");
let exoticWarningText = document.createElement("p");
let nonExoticButton = document.createElement("button");
exoticWarningHeader.innerText = "EXOTIC WARNING!";
exoticWarningText.innerText =
    "You're using an exotic mode. This probably won't work in other players (that don't have this mode). You can click the button below to copy a non-exotic version into your clipboard.";
nonExoticButton.type = "button"; // why do i have to specify that a button is a button?
nonExoticButton.innerText = "Copy non-exotic version into clipboard ✨ (result should be played as floatbeat, THIS WILL NOT WORK WITH STEREO STUFF)";
let nonExoticOriginalText = nonExoticButton.innerText;
nonExoticButton.onclick = async function () {
    let bytebeatMode = document.getElementById("mode").value;
    if (
        bytebeatMode === "4096exotic"
    ) {
        await navigator.clipboard.writeText(
            "((" +
            document.getElementById("bytebeat-code").value +
            ")&4095)/2048-1"
        );
    } else if (bytebeatMode === "detailedbeatexotic") {
        await navigator.clipboard.writeText(
            "val=(" +
            document.getElementById("bytebeat-code").value +
            "),((val&255)+Math.abs(val)%1)%256/128-1"
        );
    } else {
        console.warn(
            "you forgot to add a check in the nonExoticButton.onclick function"
        );
        return;
    }
    nonExoticButton.textContent = "Copied! ✨";
    setTimeout(function () {
        nonExoticButton.textContent = nonExoticOriginalText;
    }, 3000);
};

let mathItems = Object.getOwnPropertyNames(Math);
for (let item in mathItems) {
    // create math aliases
    item = mathItems[item];
    globalThis[item] = Math[item];
}

// noinspection JSUnusedGlobalSymbols
const int = Math.floor; // honorable mention

setTimeout(
    () =>
        localStorage.getItem("backgroundColor") === null
            ? localStorage.setItem("backgroundColor", "#1e1e1e")
            : ((document.body.style.backgroundColor =
                localStorage.getItem("backgroundColor")),
                (document.getElementById("background-color").value =
                    localStorage.getItem("backgroundColor"))),
    1
);

setTimeout(
    () =>
        localStorage.getItem("volume") === null
            ? localStorage.setItem("volume", "100")
            : (document.getElementById("volume").value =
                localStorage.getItem("volume")),
    1
);

setTimeout(() => {
    document.getElementById("volume").addEventListener("change", () => {
        localStorage.setItem("volume", document.getElementById("volume").value);
    });
}, 1);

setInterval(
    () => {
        const bytebeatMode = document.getElementById("mode").value;
        if (bytebeatMode.endsWith("exotic")) {
            if (!alreadyAppended) {
                alreadyAppended = true;
                document.body.appendChild(exoticWarningHeader);
                document.body.appendChild(exoticWarningText);
                document.body.appendChild(nonExoticButton);
                document
                    .getElementById("customization-settings-header")
                    .before(exoticWarningHeader);
                document
                    .getElementById("customization-settings-header")
                    .before(exoticWarningText);
                document
                    .getElementById("customization-settings-header")
                    .before(nonExoticButton);
            }
        } else {
            alreadyAppended = false;
            exoticWarningHeader.remove();
            exoticWarningText.remove();
            nonExoticButton.remove();
        }
    },
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
    // noinspection JSCheckFunctionSignatures (false positive!)
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
    (globalThis.hash_change = (hash = window.location.hash) => {
        if (hash) {
            let hashParts = hash.substring(1).split("@");
            hashParts[2] = hash.substring(1).split("]")[1];
            document.getElementById("bytebeat-code").value =
                new TextDecoder().decode(base64ToBytes(hashParts[0]));
            document.getElementById("sample-rate").value = parseInt(
                hashParts[1]
            );
            document.getElementById("mode").value = hashParts[2];
        }
    }),
    1
);

async function copyLink() {
    let copyLinkButton = document.getElementById("copylinkbutt");
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
    copyLinkButton.textContent = "Copied!";
    setTimeout(function () {
        copyLinkButton.textContent = "Copy link";
    }, 3000);
}

async function copyHash() {
    let copyHashButton = document.getElementById("copyhashbutt");
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
    copyHashButton.textContent = "Copied!";
    setTimeout(function () {
        copyHashButton.textContent = "Copy hash";
    }, 3000);
}

async function initBytebeat() {
    tCounter = document.getElementById("t");
    const audioContext = new AudioContext({sampleRate: 44100});
    await audioContext.audioWorklet.addModule('bytebeat-processor.js');

    const workletNode = new AudioWorkletNode(audioContext, 'bytebeat-processor', {
        numberOfOutputs: 1,
        outputChannelCount: [2],
        parameterData: {volume: 1}
    });

    const canvas = document.getElementById('visual');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bytebeatCode = document.getElementById('bytebeat-code').value;
    const bytebeatMode = document.getElementById('mode').value;

    let func;
    try {
        func = Function('t', `return ${bytebeatCode};`);
    } catch (e) {
        console.error(e);
    }

    workletNode.port.postMessage({type: 'updateCode', code: bytebeatCode});
    workletNode.port.postMessage({type: 'updateMode', mode: bytebeatMode});

    workletNode.port.onmessage = (e) => {
        if (e.data.type === 'visual') {
            const x = e.data.t % canvas.width;
            const y = ((-e.data.value + 1) * 127) & 255;
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, 1, 1);
        }
    };

    const volumeSlider = document.getElementById('volume');
    volumeSlider.addEventListener('input', () => {
        workletNode.parameters.get('volume').setValueAtTime(
            volumeSlider.value / 100,
            audioContext.currentTime
        );
    });

    workletNode.connect(audioContext.destination);
}

document.addEventListener('DOMContentLoaded', initBytebeat);

(function createMathAliases() {
    const mathItems = Object.getOwnPropertyNames(Math);
    for (let item of mathItems) globalThis[item] = Math[item];
    setTimeout(() => {
        for (let prop in globalThis) {
            if (Object.prototype.hasOwnProperty.call(globalThis, prop)) {
                dontDelete.push(prop);
            }
        }
    }, 2);
})();

function unwrapMinibake(bytebeatCode) {
    let reg =
        /^eval\(unescape\(escape(?:`|\('|\("|\(`)(.*?)(?:`|'\)|"\)|`\)).replace\(\/u\(\.\.\)\/g,["'`]\$1%["'`]\)\)\)$/;
    if (reg.test(bytebeatCode.replaceAll(" ", ""))) {
        bytebeatCode = bytebeatCode.replace(reg, "$1");
        const utf16Buffer = new Uint16Array([...bytebeatCode].map((char) => char.charCodeAt(0)));
        const utf16BEBuffer = new Uint8Array(utf16Buffer.length * 2);
        for (let i = 0; i < utf16Buffer.length; i++) {
            utf16BEBuffer[i * 2] = utf16Buffer[i] >> 8;
            utf16BEBuffer[i * 2 + 1] = utf16Buffer[i] & 0xff;
        }
        const decoder = new TextDecoder("utf-8", {fatal: false});
        bytebeatCode = decoder.decode(utf16BEBuffer);
    }
    return bytebeatCode;
}

function handleWorkletError(t, errorMessage) {
    const canvas = document.getElementById("visual");
    const ctx = canvas.getContext("2d");
    const x = t % canvas.width;
    ctx.fillStyle = "red";
    ctx.fillRect(x, 0, 1, canvas.height);

    const errorContainer = document.getElementById("errorcontainer");
    const errorText = document.getElementById("error");
    tJstebeat = t;
    if (errorContainer) {
        // noinspection JSValidateTypes
        errorContainer.style = "display: block;";
        if (errorText && tJstebeat % 4096 === 0 ) errorText.textContent = `t = ${tJstebeat}, ${errorMessage}`;
    }
}

function handleWorkletMessage(e) {
    if (e.data.id !== currentNodeId) {
        console.log(e.data.id);
        return;
    }
    const data = e.data;
    const canvas = document.getElementById("visual");
    const ctx = canvas.getContext("2d");

    if (data.type === "visual") {
        tJstebeat = data.t;
        if (tJstebeat % 512 === 0) {
            tCounter.textContent = tJstebeat;
        }
        const x = data.t % canvas.width;
        ctx.fillStyle = "black";
        ctx.fillRect(x, 0, 1, canvas.height);

        const leftY = (((-data.left) + 1) * 127) & 255;
        const rightY = (((-data.right) + 1) * 127) & 255;

        if (leftY === rightY) {
            ctx.fillStyle = "white";
            ctx.fillRect(x, leftY, 1, 1);
        } else {
            ctx.fillStyle = "#ff6f00";
            ctx.fillRect(x, leftY, 1, 1);
            ctx.fillStyle = "#0090ff";
            ctx.fillRect(x, rightY, 1, 1);
        }

    } else if (data.type === "display") {
        if (data.text !== undefined) {
            document.getElementById("displayText").textContent = "​ ​ ​ ​" + data.text + "​ ​ ​ ​";
        }
    } else if (data.type === "error") {
        handleWorkletError(data.t, data.message);
    } else if (data.type === "compileError") {
        const errorContainer = document.getElementById("errorcontainer");
        const errorText = document.getElementById("error");
        // noinspection JSValidateTypes
        errorContainer.style = "display: block;";
        errorText.textContent = `Compile error: ${data.message}`;
    }
}

async function playBytebeat() {
    if (isPlaying) {
        await stopBytebeat();
        await playBytebeat();
        return;
    }

    console.log(!bytebeatNode, !audioContext);

    currentNodeId = Date.now();

    const sampleRate = parseInt(document.getElementById("sample-rate").value);
    let bytebeatCode = document.getElementById("bytebeat-code").value;
    const mode = document.getElementById("mode").value;

    bytebeatCode = unwrapMinibake(bytebeatCode);

    if (!audioContext) audioContext = new AudioContext({sampleRate: sampleRate});

    try {
        await audioContext.audioWorklet.addModule("bytebeat-processor.js");
    } catch (err) {}

    bytebeatNode = new AudioWorkletNode(audioContext, "bytebeat-processor", {
        outputChannelCount: [2],
        processorOptions: {
            sampleRate,
            bytebeatCode,
            bytebeatMode: mode,
            bufferSize: 2048
        }
    });

    if (snapshot) {
        bytebeatNode.port.postMessage({ type: "setState", state: snapshot });
        snapshot = null;
    }

    bytebeatNode.port.onmessage = handleWorkletMessage;

    bytebeatNode.port.postMessage({type: "setId", id: currentNodeId});
    console.log(tJstebeat);
    bytebeatNode.port.postMessage({type: "setT", t: tJstebeat});
    bytebeatNode.port.postMessage({type: "compile"})

    const volumeSlider = document.getElementById("volume");
    if (!volumeSlider.__jstebeat_bound) {
        volumeSlider.addEventListener("input", () => {
            if (bytebeatNode) bytebeatNode.port.postMessage({type: "volume", value: (volumeSlider.value / 100)});
        });
        volumeSlider.__jstebeat_bound = true;
    }
    bytebeatNode.port.postMessage({type: "volume", value: (volumeSlider.value / 100)});
    volumeSlider.addEventListener("input", () => {
        if (bytebeatNode) bytebeatNode.port.postMessage({type: "volume", value: (volumeSlider.value / 100)});
    });

    bytebeatNode.connect(audioContext.destination);
    await audioContext.resume();

    isPlaying = true;
    isPaused = false;
    if (!isPaused) {
        tJstebeat = 0;
    }
}

function saveBytebeatState(node) {
    return new Promise((resolve) => {
        const handler = (e) => {
            if (e.data.type === "state" && e.data.id === currentNodeId) {
                node.port.removeEventListener("message", handler);
                resolve(e.data.state);
            }
        };
        node.port.addEventListener("message", handler);
        node.port.postMessage({ type: "getState" });
    });
}

async function pauseBytebeat() {
    if (!isPlaying) return;
    isPaused = true;
    isPlaying = false;

    snapshot = await saveBytebeatState(bytebeatNode)

    if (bytebeatNode) {
        try {
            bytebeatNode.disconnect();
        } catch (e) {
            console.warn("ermmmm", e);
        }
        bytebeatNode = null;
    }

    if (audioContext) {
        await audioContext.close();
        audioContext = null;
    }

    tCounter.textContent = tJstebeat;
}

async function stopBytebeat() {
    if (!isPlaying && !isPaused) return;

    isPlaying = false;
    isPaused = false;

    if (bytebeatNode) {
        try {
            bytebeatNode.disconnect();
        } catch (e) {
            console.warn("ermmmm", e);
        }
        bytebeatNode = null;
    }

    if (audioContext) {
        await audioContext.close();
        audioContext = null;
    }

    const canvas = document.getElementById("visual");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // this definitely won't break anything
    for (let prop in globalThis) {
        if (Object.prototype.hasOwnProperty.call(globalThis, prop) &&
            !dontDelete.includes(prop) &&
            typeof Math[prop] === "undefined"
        ) {
            try {
                delete globalThis[prop];
            } catch (_) {
            }
        }
    }

    tJstebeat = 0;
    tCounter.textContent = 0;

    if (tJstebeat !== 0) {
        await stopBytebeat();  // erm wtf
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let canvas = document.getElementById("visual");
    let ctx = canvas.getContext("2d");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});
