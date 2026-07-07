import {EditorState, Compartment} from "@codemirror/state";
import {EditorView, basicSetup} from "codemirror";
import {javascript} from "@codemirror/lang-javascript";
import {catppuccinLatte, catppuccinFrappe, catppuccinMacchiato, catppuccinMocha} from "@catppuccin/codemirror";
import workletUrl from './worklets/bytebeat-processor.ts?worker&url';
import {flavors} from '@catppuccin/palette';
import feather from 'feather-icons';

feather.replace();

const versionElement = document.getElementById("version") as HTMLSpanElement;
versionElement.textContent = __APP_VERSION__;

const successTemplate = document.getElementById("success-template") as HTMLTemplateElement;

let audioContext: AudioContext | null;
const canvas = document.getElementById('visual') as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const volume = document.getElementById("volume") as HTMLInputElement;
const bytebeatMode = document.getElementById("mode") as HTMLSelectElement;
const sampleRate = document.getElementById("sample-rate") as HTMLInputElement;
const sampleRateSelect = document.getElementById("sample-rate-select") as HTMLSelectElement;
const sampleRates = document.getElementById("sample-rates") as HTMLInputElement;
const codeLength = document.getElementById("code-length") as HTMLSpanElement;
const codeBytes = document.getElementById("code-bytes") as HTMLSpanElement;
const customizationSettingsHeader = document.getElementById("customization-settings-header")!;
const themeSelection = document.getElementById("theme") as HTMLSelectElement;
const visualsCheck = document.getElementById("visuals") as HTMLInputElement;
let imageData = ctx.createImageData(canvas.width, canvas.height);
let inside = false;
let currentNodeId: number;
// let snapshot: unknown = null;
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
let volumeValue: HTMLSpanElement = document.getElementById("volume-value")!;
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

function setImagePixel(x: number, y: number, {r, g, b}: { r: number, g: number, b: number }) {
    const i = (y * canvas.width + x) * 4;
    imageData.data[i] = r;
    imageData.data[i + 1] = g;
    imageData.data[i + 2] = b;
    imageData.data[i + 3] = 255;
}

let [oldSampleRate, oldMode] = splitHash().slice(1);

sampleRateSelect.value = "";

if (localStorage.getItem("sampleRateLists") === null) {
    localStorage.setItem(
        "sampleRateLists",
        JSON.stringify(["8000", "11025", "16000", "22050", "32000", "44100", "48000"])
    );
}

function refreshSampleRateSelect() {
    sampleRateSelect.options.length = 0;
    for (let rate of JSON.parse(localStorage.getItem("sampleRateLists")!)) {
        sampleRateSelect.add(new Option(rate + "hz", rate));
    }
}

sampleRates.value = "";

sampleRates.addEventListener("change", () => {
    localStorage.setItem("sampleRateLists", JSON.stringify(JSON.parse(sampleRates.value)));
    refreshSampleRateSelect();
})

sampleRates.value = localStorage.getItem("sampleRateLists")!;

refreshSampleRateSelect();

sampleRate.value = oldSampleRate;

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

volume.addEventListener("input", () => volumeValue.textContent = volume.value + "%");

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

setTimeout(() => sampleRate.addEventListener("change", () => {
    window.location.hash = calcHash();
}), 200)

setInterval(bytebeatMode.onchange = () => {
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
}, 50)

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

// @ts-ignore
setTimeout(bytebeatMode.onchange, 300)

// @ts-ignore
setTimeout((globalThis.hashChange = (hash = window.location.hash) => {
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
}), 100);

setInterval(() => window.location.hash = calcHash(), 1000);

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
    copyLinkButton.innerHTML = successTemplate.innerHTML;
    setTimeout(function () {
        copyLinkButton.innerHTML = originalHTML;
    }, 3000);
}

function calcHash() {
    let code = view.state.doc.toString();
    let codeEncoded = new TextEncoder().encode(code);
    codeLength.textContent = [...code].length.toString();
    codeBytes.textContent = codeEncoded.length.toString();
    return "#v6$" +
        bytesToBase64(codeEncoded) +
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
    copyHashButton.innerHTML = successTemplate.innerHTML;
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
    copyCodeButton.innerHTML = successTemplate.innerHTML;
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
    for (let y = 0; y < canvas.height; y++) {
        setImagePixel(x, y, activeTheme.colors.red.rgb);
    }

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

    tJstebeat = d.t;

    if (d.type === "visual" && visualsCheck.checked) {
        const x = d.t % canvas.width;
        for (let y = 0; y < canvas.height; y++) {
            setImagePixel(x, y, activeTheme.colors.crust.rgb);
        }

        const leftY = (((-d.left) + 1) * 127) & 255;
        const rightY = (((-d.right) + 1) * 127) & 255;

        if (leftY === rightY) {
            if (isNaN(d.left)) {
                for (let y = 0; y < canvas.height; y++) {
                    setImagePixel(x, y, activeTheme.colors.red.rgb);
                }
            } else {
                setImagePixel(x, leftY, activeTheme.colors.text.rgb);
            }
        } else {
            if (isNaN(d.left)) {
                for (let y = 0; y < canvas.height; y++) {
                    setImagePixel(x, y, activeTheme.colors.red.rgb);
                }
            } else {
                setImagePixel(x, leftY, activeTheme.colors.peach.rgb);
            }
            if (isNaN(d.right)) {
                for (let y = 0; y < canvas.height; y++) {
                    setImagePixel(x, y, activeTheme.colors.red.rgb);
                }
            } else {
                setImagePixel(x, rightY, activeTheme.colors.blue.rgb);
            }
        }

    } else if (d.type === "display") {
        if (d.text !== undefined) {
            document.getElementById("displayText")!.textContent = d.text;
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

    if (!audioContext) {
        audioContext = new AudioContext({sampleRate: parseInt(sampleRate.value)});

        try {
            await audioContext.audioWorklet.addModule(workletUrl);
        } catch (err) {
        }
    }

    if (!bytebeatNode) {
        bytebeatNode = new AudioWorkletNode(audioContext, "bytebeat-processor", {
            outputChannelCount: [2],
            processorOptions: {
                sampleRate: audioContext.sampleRate,
                bytebeatCode,
                bytebeatMode: bytebeatMode.value,
                bufferSize: 2048
            }
        });
    } else {
        bytebeatNode?.port.postMessage({type: "play"});
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

/**
 * why does jetbrains want me to make this func omg
 */
async function destroyBytebeat() {
    // you should kill yourself... NOW
    bytebeatNode?.port.postMessage({type: "kill"});

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

    currentNodeId = Date.now();
}

visualsCheck.addEventListener("change", () => {
    localStorage.setItem("visualsCheck", JSON.stringify(visualsCheck.checked));
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            setImagePixel(x, y, activeTheme.colors.crust.rgb);
        }
    }
    if (visualsCheck.checked) {
        canvas.style.opacity = "";
    } else {
        canvas.style.opacity = "0";
    }
});

async function pauseBytebeat() {
    bytebeatNode?.port.postMessage({type: "pause"}); // i'm crying i could've just done this the whole time

    if (!isPlaying) return;
    isPaused = true;
    isPlaying = false;

    document.getElementById("play")!.dataset.on = "false";
    document.getElementById("pause")!.dataset.on = "true";
    document.getElementById("stop")!.dataset.on = "false";
}

async function stopBytebeat() {
    if (!isPlaying && !isPaused) return;

    imageData = new ImageData(canvas.width, canvas.height); // not doing this causes lag sometimes

    document.getElementById("play")!.dataset.on = "false";
    document.getElementById("pause")!.dataset.on = "false";
    document.getElementById("stop")!.dataset.on = "true";

    isPlaying = false;
    isPaused = false;

    await destroyBytebeat();

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            setImagePixel(x, y, activeTheme.colors.crust.rgb);
        }
    }


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

for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
        setImagePixel(x, y, activeTheme.colors.crust.rgb);
    }
}

document.getElementById("play")!.addEventListener("click", playBytebeat);
document.getElementById("pause")!.addEventListener("click", pauseBytebeat);
document.getElementById("stop")!.addEventListener("click", stopBytebeat);
document.getElementById("copycodebutt")!.addEventListener("click", copyCode);
document.getElementById("copyhashbutt")!.addEventListener("click", copyHash);
document.getElementById("copylinkbutt")!.addEventListener("click", copyLink);
document.getElementById("sample-rate-select-open")!.addEventListener(
    "click", () => sampleRateSelect.showPicker()
);
sampleRateSelect.addEventListener("change", () => {
    sampleRate.value = sampleRateSelect.value
});

function sampleRateSelectSet() {
    if ([...sampleRateSelect.options].map(opt => opt.value).includes(sampleRate.value)) {
        sampleRateSelect.value = sampleRate.value;
    } else {
        sampleRateSelect.value = "";
    }
}

sampleRate.addEventListener("change", sampleRateSelectSet);

sampleRateSelectSet();

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

for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
        setImagePixel(x, y, activeTheme.colors.crust.rgb);
    }
}

function frame() {
    tCounter.textContent = String(tJstebeat);
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(frame);
}

frame()

if (localStorage.getItem("visualsCheck") === null) {
    localStorage.setItem("visualsCheck", JSON.stringify(visualsCheck.checked));
}

sampleRate.value = oldSampleRate;
bytebeatMode.value = oldMode;

console.log(oldSampleRate);
console.log(sampleRate.value);

visualsCheck.checked = JSON.parse(localStorage.getItem("visualsCheck")!);
visualsCheck.dispatchEvent(new Event('change'));
