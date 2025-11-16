import {EditorState, Compartment} from "@codemirror/state";
import {EditorView, basicSetup} from "codemirror";
import {javascript} from "@codemirror/lang-javascript";
import {catppuccinLatte, catppuccinFrappe, catppuccinMacchiato, catppuccinMocha} from "@catppuccin/codemirror";
import processorUrl from './bytebeat-processor.ts?url';
import {flavors} from '@catppuccin/palette';

const versionElement = document.getElementById("version") as HTMLSpanElement;
versionElement.textContent = __APP_VERSION__;

let audioContext: AudioContext | null;
const canvas = document.getElementById('visual') as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const volume = document.getElementById("volume") as HTMLInputElement;
const bytebeatMode = document.getElementById("mode") as HTMLSelectElement;
const sampleRate = document.getElementById("sample-rate") as HTMLInputElement;
const customizationSettingsHeader = document.getElementById("customization-settings-header")!;
const themeSelection = document.getElementById("theme") as HTMLSelectElement;
let inside = false;
let currentNodeId: number;
let snapshot: unknown = null;
let isPlaying = false;
let isPaused = false;
let tJstebeat = 0; // different name to not break some stuff
let err: null | Error = null;
try {
    await import('./forkers.ts'); // naaaasty...
} catch (e) {
    err = e as Error;
}
let bytebeatNode: AudioWorkletNode | null = null;
let dontDelete: string[] = [];
let alreadyAppended = false;
let tCounter: HTMLSpanElement = document.getElementById("t")!;
let exoticWarningHeader = document.createElement("h2");
let exoticWarningText = document.createElement("p");
let nonExoticButton = document.createElement("button");
exoticWarningHeader.innerText = "EXOTIC WARNING!";
exoticWarningText.innerText =
    "You're using an exotic mode. This probably won't work in other players (that don't have this mode). You can click the button below to copy a non-exotic version into your clipboard.";
nonExoticButton.type = "button"; // why do i have to specify that a button is a button?
nonExoticButton.innerText = "Copy non-exotic version into clipboard (result should be played as floatbeat, THIS WILL NOT WORK WITH STEREO STUFF)";
let nonExoticOriginalText = nonExoticButton.innerText;
nonExoticButton.onclick = async function () {
    if (
        bytebeatMode.value === "4096exotic"
    ) {
        await navigator.clipboard.writeText(
            "((" +
            view.state.doc.toString() +
            ")&4095)/2048-1"
        );
    } else if (bytebeatMode.value === "detailedbeatexotic") {
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
    nonExoticButton.textContent = "Copied!";
    setTimeout(function () {
        nonExoticButton.textContent = nonExoticOriginalText;
    }, 3000);
};

let clickTimes: number[] = [];

function devModeHandle() {
    if (localStorage.getItem("devMode") === "true") {
        document.documentElement.dataset.devMode = "true";
        versionElement.innerText = __APP_VERSION__ + " (dev mode)";
    } else {
        document.documentElement.dataset.devMode = "false";
        versionElement.innerText = __APP_VERSION__;
    }
}

devModeHandle();

versionElement.addEventListener("click", () => {
    const now = Date.now();
    clickTimes.push(now);

    if (clickTimes.length > 5) clickTimes.shift();

    if (clickTimes.length === 5 && (now - clickTimes[0]) < 1500) {
        localStorage.setItem("devMode", String(localStorage.getItem("devMode") !== "true"));
        clickTimes = [];
        devModeHandle();
    }
});

let theme = localStorage.getItem("theme");

let activeTheme = flavors.mocha;

if (
    theme === null
    || !Array.from(themeSelection.options).map(option => option.value).includes(theme)
) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        localStorage.setItem("theme", "mocha");
    } else {
        localStorage.setItem("theme", "latte");
    }
}

function updateTheme() {
    localStorage.setItem("theme", themeSelection.value!);
    document.documentElement.dataset.theme = themeSelection.value!;
    view.dispatch({
        effects: themeComp.reconfigure(
            {
                latte: catppuccinLatte,
                frappe: catppuccinFrappe,
                macchiato: catppuccinMacchiato,
                mocha: catppuccinMocha,
                legacy: catppuccinMocha
            }[themeSelection.value]!
        ),
    });
    activeTheme = {
        latte: flavors.frappe, // :P latte is really terrible as a visualizer theme so this is just a compromise
        frappe: flavors.frappe,
        macchiato: flavors.macchiato,
        mocha: flavors.mocha,
        legacy: flavors.mocha  // :P
    }[themeSelection.value]!;
}

themeSelection.value = localStorage.getItem("theme")!;

themeSelection.addEventListener("change", updateTheme);

if (localStorage.getItem("volume") === null) {
    localStorage.setItem("volume", "100")
} else {
    volume.value = localStorage.getItem("volume")!;
}

volume.addEventListener("change", () => {
    localStorage.setItem("volume", volume.value);
});

sampleRate.addEventListener("change", () => {
    window.location.hash = calcHash();
})

bytebeatMode.onchange = () => {
    window.location.hash = calcHash();
    if (bytebeatMode.value.endsWith("exotic")) {
        if (!alreadyAppended) {
            alreadyAppended = true;
            document.body.appendChild(exoticWarningHeader);
            document.body.appendChild(exoticWarningText);
            document.body.appendChild(nonExoticButton);
            customizationSettingsHeader.before(exoticWarningHeader);
            customizationSettingsHeader.before(exoticWarningText);
            customizationSettingsHeader.before(nonExoticButton);
        }
    } else {
        alreadyAppended = false;
        exoticWarningHeader.remove();
        exoticWarningText.remove();
        nonExoticButton.remove();
    }
}

function updateBackgroundHelper() {
    if (err) {
        throw new Error(err!.message);
    }
}

updateBackgroundHelper();

const themeComp = new Compartment();

const state = EditorState.create({
    doc: splitHash()[0],
    extensions: [
        basicSetup,
        javascript(),
        themeComp.of(catppuccinLatte),
        EditorView.updateListener.of((update) => {
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

updateTheme();
bytebeatMode.onchange(new Event("change"));

function splitHash(hash: string = window.location.hash): string[] {
    if (hash) {
        let hashParts;
        if (hash.startsWith("#v6$")) {
            hashParts = hash.substring(4).split(".");
            hashParts = [hashParts[0], ...hashParts[1].split("~")];
        } else {
            console.log(hash)
            hashParts = hash.substring(1).split("@");
            hashParts = [hashParts[0], ...hashParts[1].split("]")];
        }
        console.log(hashParts);
        hashParts[0] = new TextDecoder().decode(base64ToBytes(hashParts[0]));
        return hashParts;
    }
    return [
        "(t&1024||t&16384&&t&2048&&!(t&512))?(t&4096&&!(t&2048)?(t*t*t>>~t*t)+127:t*((t>>11&1)+1)*(1+(t>>16&1)*3))*2:0",
        "8000",
        "bb"
    ];
}

// @ts-ignore
(globalThis.hash_change = (hash = window.location.hash) => {
    if (hash) {
        let hashParts = splitHash(hash);
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: hashParts[0],
            }
        });
        sampleRate.value = hashParts[1];
        bytebeatMode.value = hashParts[2];
    }
})();

setInterval(() => window.location.hash = calcHash(), 100);

function base64ToBytes(base64: string) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

function bytesToBase64(bytes: Iterable<number> | ArrayLike<number>) {
    const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join(
        ""
    );
    return btoa(binString);
}

// the 2 above functions are stolen from MDN docs thank you very much

async function copyLink() {
    let copyLinkButton: HTMLElement = document.getElementById("copylinkbutt")!;
    await navigator.clipboard.writeText(
        window.location.origin + window.location.pathname + calcHash()
    );
    let originalHTML = copyLinkButton.innerHTML;
    copyLinkButton.innerHTML = "Copied!";
    setTimeout(function () {
        copyLinkButton.innerHTML = originalHTML;
    }, 3000);
}

function calcHash() {
    return "#v6$" +
        bytesToBase64(
            new TextEncoder().encode(
                view.state.doc.toString()
            )
        ) +
        "." +
        sampleRate.value +
        "~" +
        bytebeatMode.value
}

async function copyHash() {
    let copyHashButton: HTMLElement = document.getElementById("copyhashbutt")!;
    await navigator.clipboard.writeText(
        calcHash()
    );
    let originalHTML = copyHashButton.innerHTML;
    copyHashButton.innerHTML = "Copied!";
    setTimeout(function () {
        copyHashButton.innerHTML = originalHTML;
    }, 3000);
}

async function copyCode() {
    let copyCodeButton: HTMLElement = document.getElementById("copycodebutt")!;
    await navigator.clipboard.writeText(
        view.state.doc.toString()
    );
    let originalHTML = copyCodeButton.innerHTML;
    copyCodeButton.innerHTML = "Copied!";
    setTimeout(function () {
        copyCodeButton.innerHTML = originalHTML;
    }, 3000);
}

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
    ctx.fillStyle = activeTheme.colors.red.hex;
    ctx.fillRect(x, 0, 1, canvas.height);

    const errorContainer = document.getElementById("error-container");
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
        ctx.fillStyle = activeTheme.colors.crust.hex;
        ctx.fillRect(x, 0, 1, canvas.height);

        const leftY = (((-d.left) + 1) * 127) & 255;
        const rightY = (((-d.right) + 1) * 127) & 255;

        if (leftY === rightY) {
            if (isNaN(d.left)) {
                ctx.fillStyle = activeTheme.colors.red.hex;
                ctx.fillRect(x, 0, 1, canvas.height);
            } else {
                ctx.fillStyle = activeTheme.colors.text.hex;
                ctx.fillRect(x, leftY, 1, 1);
            }
        } else {
            if (isNaN(d.left)) {
                ctx.fillStyle = activeTheme.colors.red.hex;
                ctx.fillRect(x, 0, 1, canvas.height);
            } else {
                ctx.fillStyle = activeTheme.colors.peach.hex;
                ctx.fillRect(x, leftY, 1, 1);
            }
            if (isNaN(d.right)) {
                ctx.fillStyle = activeTheme.colors.red.hex;
                ctx.fillRect(x, 0, 1, canvas.height);
            } else {
                ctx.fillStyle = activeTheme.colors.blue.hex;
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
        const errorContainer = document.getElementById("error-container") as HTMLDivElement;
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
        const errorContainer = document.getElementById("error-container") as HTMLDivElement;
        errorContainer.style = "display: none;";
        document.getElementById("displayText")!.textContent = "";
    }

    console.log(!bytebeatNode, !audioContext);

    let bytebeatCode = view.state.doc.toString();

    bytebeatCode = unwrapMinibake(bytebeatCode);

    if (!audioContext) audioContext = new AudioContext({sampleRate: parseInt(sampleRate.value)});

    try {
        await audioContext.audioWorklet.addModule(processorUrl);
    } catch (err) {
    }

    bytebeatNode = new AudioWorkletNode(audioContext, "bytebeat-processor", {
        outputChannelCount: [2],
        processorOptions: {
            sampleRate: audioContext.sampleRate,
            bytebeatCode,
            bytebeatMode: bytebeatMode.value,
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

    ctx.fillStyle = activeTheme.colors.crust.hex;
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

ctx.fillStyle = activeTheme.colors.crust.hex;
ctx.fillRect(0, 0, canvas.width, canvas.height);

document.getElementById("play")!.addEventListener("click", playBytebeat)
document.getElementById("pause")!.addEventListener("click", pauseBytebeat)
document.getElementById("stop")!.addEventListener("click", stopBytebeat)
document.getElementById("copycodebutt")!.addEventListener("click", copyCode)
document.getElementById("copyhashbutt")!.addEventListener("click", copyHash)
document.getElementById("copylinkbutt")!.addEventListener("click", copyLink)

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

ctx.fillStyle = activeTheme.colors.crust.hex;
ctx.fillRect(0, 0, canvas.width, canvas.height);
