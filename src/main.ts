import {EditorState} from "@codemirror/state";
import {EditorView, basicSetup} from "codemirror";
import {javascript} from "@codemirror/lang-javascript";
import {catppuccinMocha} from "@catppuccin/codemirror";

document.getElementById("version")!.textContent = __APP_VERSION__;

const state = EditorState.create({
    doc: "(t&1024||t&16384&&t&2048&&!(t&512))?(t&4096&&!(t&2048)?(t*t*t>>~t*t)+127:t*((t>>11&1)+1)*(1+(t>>16&1)*3))*2:0",
    extensions: [basicSetup, javascript(), catppuccinMocha, EditorView.updateListener.of((update) => {
        if (update.docChanged) {
            window.location.hash = calcHash();
        }
    })]
});

const view = new EditorView({
    state,
    parent: document.getElementById("editor")!
});

view.dom.style.height = "100%";

let audioContext: AudioContext | null;
const canvas = document.getElementById('visual') as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let inside = false;
let currentNodeId: number;
let snapshot: unknown = null;
let isPlaying = false;
let isPaused = false;
let tJstebeat = 0; // different name to not break some stuff
let bytebeatNode: AudioWorkletNode | null = null;
let dontDelete: string[] = [];
let alreadyAppended = false;
let tCounter: HTMLSpanElement;
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
    // @ts-ignore
    let bytebeatMode = document.getElementById("mode").value;
    if (
        bytebeatMode === "4096exotic"
    ) {
        await navigator.clipboard.writeText(
            "((" +
            view.state.doc.toString() +
            ")&4095)/2048-1"
        );
    } else if (bytebeatMode === "detailedbeatexotic") {
        await navigator.clipboard.writeText(
            "val=(" +
            view.state.doc.toString() +
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

// noinspection CommaExpressionJS
setTimeout(
    () =>
        localStorage.getItem("backgroundColor") === null
            ? localStorage.setItem("backgroundColor", "#1e1e1e")
            // @ts-ignore
            : ((document.body.style.backgroundColor =
                localStorage.getItem("backgroundColor")),
                // @ts-ignore
                (document.getElementById("background-color").value =
                    localStorage.getItem("backgroundColor"))),
    1
);

setTimeout(
    () =>
        localStorage.getItem("volume") === null
            ? localStorage.setItem("volume", "100")
            // @ts-ignore
            : (document.getElementById("volume").value =
                localStorage.getItem("volume")),
    1
);

setTimeout(() => {
    // @ts-ignore
    document.getElementById("volume").addEventListener("change", () => {
        // @ts-ignore
        localStorage.setItem("volume", document.getElementById("volume").value);
    });
}, 1);

setInterval(
    () => {
        // @ts-ignore
        const bytebeatMode = document.getElementById("mode").value;
        if (bytebeatMode.endsWith("exotic")) {
            if (!alreadyAppended) {
                alreadyAppended = true;
                document.body.appendChild(exoticWarningHeader);
                document.body.appendChild(exoticWarningText);
                document.body.appendChild(nonExoticButton);
                // @ts-ignore
                document
                    .getElementById("customization-settings-header")
                    .before(exoticWarningHeader);
                // @ts-ignore
                document
                    .getElementById("customization-settings-header")
                    .before(exoticWarningText);
                // @ts-ignore
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

// @ts-ignore
function updateBackground() {
    // @ts-ignore
    const color = document.getElementById("background-color").value;
    document.body.style.backgroundColor = color;
    localStorage.setItem("backgroundColor", color);
}

// @ts-ignore
function resetBackground() {
    const color = "#1e1e1e";
    // @ts-ignore
    document.getElementById("background-color").value = color;
    document.body.style.backgroundColor = color;
    localStorage.setItem("backgroundColor", color);
}

function base64ToBytes(base64: string) {
    const binString = atob(base64);
    // @ts-ignore
    // noinspection JSCheckFunctionSignatures (false positive!)
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function bytesToBase64(bytes: Iterable<number> | ArrayLike<number>) {
    const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join(
        ""
    );
    return btoa(binString);
}

// the 2 above functions are stolen from MDN docs thank you very much

setTimeout(
    // @ts-ignore
    (globalThis.hash_change = (hash = window.location.hash) => {
        if (hash) {
            let hashParts = hash.substring(1).split("@");
            hashParts[2] = hash.substring(1).split("]")[1];
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: new TextDecoder().decode(base64ToBytes(hashParts[0]))
                }
            });
            // @ts-ignore
            document.getElementById("sample-rate").value = parseInt(
                hashParts[1]
            );
            // @ts-ignore
            document.getElementById("mode").value = hashParts[2];
        }
    }),
    1
);

async function copyLink() {
    let copyLinkButton: HTMLElement = document.getElementById("copylinkbutt")!;
    await navigator.clipboard.writeText(
        "https://butterroach.github.io/jstebeat/#" +
        bytesToBase64(
            new TextEncoder().encode(
                view.state.doc.toString()
            )
        ) +
        "@" +
        // @ts-ignore
        document.getElementById("sample-rate").value +
        "]" +
        // @ts-ignore
        document.getElementById("mode").value
    );
    copyLinkButton.textContent = "Copied!";
    setTimeout(function () {
        copyLinkButton.textContent = "Copy link";
    }, 3000);
}

function calcHash() {
    return "#" +
        bytesToBase64(
            new TextEncoder().encode(
                view.state.doc.toString()
            )
        ) +
        "@" +
        // @ts-ignore
        document.getElementById("sample-rate").value +
        "]" +
        // @ts-ignore
        document.getElementById("mode").value
}

async function copyHash() {
    let copyHashButton: HTMLElement = document.getElementById("copyhashbutt")!;
    await navigator.clipboard.writeText(
        calcHash()
    );
    copyHashButton.textContent = "Copied!";
    setTimeout(function () {
        copyHashButton.textContent = "Copy hash";
    }, 3000);
}

async function initBytebeat() {
    tCounter = document.getElementById("t") as HTMLSpanElement;
    const audioContext = new AudioContext({sampleRate: 44100});
    await audioContext.audioWorklet.addModule('bytebeat-processor.js');

    const workletNode = new AudioWorkletNode(audioContext, 'bytebeat-processor', {
        numberOfOutputs: 1,
        outputChannelCount: [2],
        parameterData: {volume: 1}
    });

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bytebeatCode = view.state.doc.toString();
    // @ts-ignore
    const bytebeatMode = document.getElementById('mode').value;

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

    const volumeSlider = document.getElementById('volume') as HTMLInputElement;
    volumeSlider.addEventListener('input', () => {
        // @ts-ignore
        workletNode.parameters.get('volume').setValueAtTime(
            Number(volumeSlider.value) / 100,
            audioContext.currentTime
        );
    });

    workletNode.connect(audioContext.destination);
}

document.addEventListener('DOMContentLoaded', initBytebeat);

(function createMathAliases() {
    const mathItems = Object.getOwnPropertyNames(Math);
    // @ts-ignore
    for (let item of mathItems) globalThis[item] = Math[item];
    setTimeout(() => {
        for (let prop in globalThis) {
            if (Object.prototype.hasOwnProperty.call(globalThis, prop)) {
                dontDelete.push(prop);
            }
        }
    }, 2);
})();

function unwrapMinibake(bytebeatCode: string) {
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

function handleWorkletError(t: number, errorMessage: string) {
    const x = t % canvas.width;
    ctx.fillStyle = "red";
    ctx.fillRect(x, 0, 1, canvas.height);

    const errorContainer = document.getElementById("errorcontainer");
    const errorText = document.getElementById("error");
    tJstebeat = t;
    if (errorContainer) {
        // noinspection JSValidateTypes
        errorContainer.style = "display: block;";
        if (errorText) errorText.textContent = `t = ${tJstebeat}, ${errorMessage}`;
    }
}

function handleWorkletMessage(e: {
    data: { id: number, t: number, type: string, left: number, right: number, text: string | null, message: string; };
}) {
    if (e.data.id !== currentNodeId) {
        console.log(e.data.id);
        return;
    }
    const d = e.data;

    if (d.type === "visual") {
        tJstebeat = d.t;
        if (tJstebeat % 512 === 0) {
            tCounter.textContent = String(tJstebeat);
        }
        const x = d.t % canvas.width;
        ctx.fillStyle = "black";
        ctx.fillRect(x, 0, 1, canvas.height);

        const leftY = (((-d.left) + 1) * 127) & 255;
        const rightY = (((-d.right) + 1) * 127) & 255;

        if (leftY === rightY) {
            if (isNaN(d.left)) {
                ctx.fillStyle = "red";
                ctx.fillRect(x, 0, 1, canvas.height);
            } else {
                ctx.fillStyle = "white";
                ctx.fillRect(x, leftY, 1, 1);
            }
        } else {
            if (isNaN(d.left)) {
                ctx.fillStyle = "red";
                ctx.fillRect(x, 0, 1, canvas.height);
            } else {
                ctx.fillStyle = "#ff6f00";
                ctx.fillRect(x, leftY, 1, 1);
            }
            if (isNaN(d.right)) {
                ctx.fillStyle = "red";
                ctx.fillRect(x, 0, 1, canvas.height);
            } else {
                ctx.fillStyle = "#0090ff";
                ctx.fillRect(x, rightY, 1, 1);
            }
        }

    } else if (d.type === "display") {
        if (d.text !== undefined) {
            document.getElementById("displayText")!.textContent = "​ ​ ​ ​" + d.text + "​ ​ ​ ​";
        }
    } else if (d.type === "error") {
        handleWorkletError(d.t, d.message);
    } else if (d.type === "compileError") {
        const errorContainer = document.getElementById("errorcontainer") as HTMLDivElement;
        const errorText = document.getElementById("error") as HTMLSpanElement;
        // noinspection JSValidateTypes
        errorContainer.style = "display: block;";
        errorText.textContent = `Compile error: ${d.message}`;
    }
}

async function playBytebeat() {
    if (isPlaying || (tJstebeat !== 0 && !isPaused)) {
        await stopBytebeat();
        await playBytebeat();
        return;
    }

    document.getElementById("play")!.dataset.on = "true";
    document.getElementById("pause")!.dataset.on = "false";
    document.getElementById("stop")!.dataset.on = "false";

    if (!isPaused) {
        const errorContainer = document.getElementById("errorcontainer") as HTMLDivElement;
        errorContainer.style = "display: none;";
        document.getElementById("displayText")!.textContent = "";
    }

    console.log(!bytebeatNode, !audioContext);

    const sampleRate = parseInt((document.getElementById("sample-rate") as HTMLInputElement).value);
    let bytebeatCode = view.state.doc.toString();
    const mode = (document.getElementById("mode") as HTMLInputElement).value;

    bytebeatCode = unwrapMinibake(bytebeatCode);

    if (!audioContext) audioContext = new AudioContext({sampleRate: sampleRate});

    try {
        await audioContext.audioWorklet.addModule("bytebeat-processor.js");
    } catch (err) {
    }

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
        bytebeatNode.port.postMessage({type: "setState", state: snapshot});
        snapshot = null;
    }

    bytebeatNode.port.onmessage = handleWorkletMessage;

    bytebeatNode.port.postMessage({type: "setId", id: currentNodeId});
    console.log(tJstebeat);
    bytebeatNode.port.postMessage({type: "setT", t: tJstebeat});
    bytebeatNode.port.postMessage({type: "compile"})

    const volumeSlider = document.getElementById("volume") as HTMLInputElement;
    // @ts-ignore
    if (!volumeSlider.__jstebeat_bound) {
        volumeSlider.addEventListener("input", () => {
            if (bytebeatNode) bytebeatNode.port.postMessage({
                type: "volume",
                value: (Number(volumeSlider.value) / 100)
            });
        });
        // @ts-ignore
        volumeSlider.__jstebeat_bound = true;
    }
    bytebeatNode.port.postMessage({type: "volume", value: (Number(volumeSlider.value) / 100)});
    volumeSlider.addEventListener("input", () => {
        if (bytebeatNode) bytebeatNode.port.postMessage({type: "volume", value: (Number(volumeSlider.value) / 100)});
    });

    bytebeatNode.connect(audioContext.destination);
    await audioContext.resume();

    isPlaying = true;
    isPaused = false;
    if (!isPaused) {
        tJstebeat = 0;
    }
}

function saveBytebeatState(node: AudioWorkletNode) {
    return new Promise((resolve) => {
        const handler = (e: { data: { type: string; id: number; state: unknown; }; }) => {
            if (e.data.type === "state" && e.data.id === currentNodeId) {
                node.port.removeEventListener("message", handler);
                resolve(e.data.state);
            }
        };
        node.port.addEventListener("message", handler);
        node.port.postMessage({type: "getState"});
    });
}

/**
 * why does jetbrains want me to make this func omg
 */
async function destroyBytebeat() {
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

    currentNodeId = Date.now(); // IMPORTANT!!!!! AHHHHHH
}

async function pauseBytebeat() {
    if (!isPlaying) return;
    isPaused = true;
    isPlaying = false;

    document.getElementById("play")!.dataset.on = "false";
    document.getElementById("pause")!.dataset.on = "true";
    document.getElementById("stop")!.dataset.on = "false";

    snapshot = await saveBytebeatState(bytebeatNode!)

    await destroyBytebeat();

    tCounter.textContent = String(tJstebeat);
}

async function stopBytebeat() {
    if (!isPlaying && !isPaused) return;

    document.getElementById("play")!.dataset.on = "false";
    document.getElementById("pause")!.dataset.on = "false";
    document.getElementById("stop")!.dataset.on = "true";

    isPlaying = false;
    isPaused = false;

    await destroyBytebeat();

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // this definitely won't break anything
    for (let prop in globalThis) {
        if (Object.prototype.hasOwnProperty.call(globalThis, prop) &&
            !dontDelete.includes(prop) &&
            // @ts-ignore
            typeof Math[prop] === "undefined"
        ) {
            try {
                // @ts-ignore
                delete globalThis[prop];
            } catch (_) {
            }
        }
    }

    tJstebeat = 0;
    tCounter.textContent = "0";

    if (tJstebeat !== 0) {
        // erm wtf... t not 0...
        await stopBytebeat();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("play")!.addEventListener("click", playBytebeat)
document.getElementById("pause")!.addEventListener("click", pauseBytebeat)
document.getElementById("stop")!.addEventListener("click", stopBytebeat)
document.getElementById("copyhashbutt")!.addEventListener("click", copyHash)
document.getElementById("copylinkbutt")!.addEventListener("click", copyLink)
document.getElementById("background-color")!.addEventListener("change", updateBackground)
document.getElementById("reset-bg")!.addEventListener("click", resetBackground)

function onPointerMove(e: { clientX: number; clientY: number; }) {
    const r = canvas.getBoundingClientRect();
    const nowInside = e.clientX >= r.left && e.clientX <= r.right
        && e.clientY >= r.top && e.clientY <= r.bottom;
    if (nowInside !== inside) {
        inside = nowInside;
        canvas.classList.toggle('hover', inside);
    }
}

document.addEventListener('pointermove', onPointerMove, {passive: true});
window.addEventListener('blur', () => {
    inside = false;
    canvas.classList.remove('hover');
});
