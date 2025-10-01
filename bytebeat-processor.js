/** @typedef {import('standard-browser-lib')} */
/* global AudioWorkletProcessor, registerProcessor */

class BytebeatProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [];
    }

    constructor(options) {
        super();

        this.id = null;

        (function createMathAliasesInWorklet() {
            const mathItems = Object.getOwnPropertyNames(Math);
            for (let item of mathItems) globalThis[item] = Math[item];
        })();

        this.sampleRate = (options.processorOptions && options.processorOptions.sampleRate) || sampleRate || 44100;
        this.bytebeatCode = (options.processorOptions && options.processorOptions.bytebeatCode) || "0";
        this.bytebeatMode = (options.processorOptions && options.processorOptions.bytebeatMode) || "bb";

        this.t = 0;
        this.lastDisplayT = 0;
        this.lastDisplayValue = "";
        this.displayThrottleSamples = Math.max(1, Math.floor(this.sampleRate / 60)); // ~16ms
        this.volume = 1.0;
        this.lastLeft = 0;
        this.lastRight = 0;

        this.port.onmessage = (e) => {
            const d = e.data;
            if (d.type === "volume") {
                this.volume = d.value;
            } else if (d.type === "updateCode") {
                this.bytebeatCode = d.bytebeatCode;
                this.compileBytebeat();
            } else if (d.type === "updateMode") {
                this.bytebeatMode = d.bytebeatMode;
                this.compileBytebeat();
            } else if (d.type === "updateSampleRate") {
                this.sampleRate = d.sampleRate;
                this.displayThrottleSamples = Math.max(1, Math.floor(this.sampleRate / 60));
            } else if (d.type === "stop") {
                this.t = 0;
                this.lastLeft = 0;
                this.lastRight = 0;
                this.lastDisplayT = 0;
                this.lastDisplayValue = '';
                globalThis.jsteDisplayText = '';
            } else if (d.type === "setId") {
                this.id = d.id;
            } else if (d.type === "setT") {
                this.t = d.t;
            } else if (e.data.type === "getState") {
                const capturedState = {};

                for (const key of Object.keys(globalThis)) {
                    if (!this.initialKeys.has(key)) {
                        let value = globalThis[key];
                        if (typeof value === 'function') {
                            capturedState[key] = {
                                __type: 'function',
                                code: value.toString()
                            };
                        }
                        else {
                            capturedState[key] = value;
                        }
                    }
                }

                console.log(capturedState);

                this.port.postMessage({
                    type: "state",
                    state: capturedState,
                    id: this.id
                });
            } else if (d.type === "setState") {
                this.initialKeys = new Set(Object.keys(globalThis));
                const savedState = e.data.state;
                for (const key in savedState) {
                    if (!Object.hasOwn(savedState, key)) continue;
                    let value = savedState[key];
                    let restoredValue;
                    if (typeof value === 'object' && value !== null && value.__type === 'function') {
                        try {
                            restoredValue = new Function('return ' + value.code)();
                        } catch (error) {
                            console.error(`AHHHHH failed to restore function "${key}":`, error);
                            continue;
                        }
                    }
                    else {
                        restoredValue = value;
                    }
                    globalThis[key] = restoredValue;
                }
            } else if (d.type === "compile") {
                this.compileBytebeat();
            }
        };
    }

    compileBytebeat() {
        if (!this.initialKeys) {
            this.initialKeys = new Set(Object.keys(globalThis));
        }
        try {
            if (this.bytebeatMode === "func") {
                this.bytebeatFunc = Function(this.bytebeatCode)();
            } else {
                this.bytebeatFunc = Function("t", `return 0,${this.bytebeatCode || 0};`);
                if (this.t === 0) {
                    this.bytebeatFunc(0);
                }
            }
        } catch (e) {
            this.port.postMessage({type: "compileError", message: `${e.name}: ${e.message}`, id: this.id});
            this.bytebeatFunc = () => 0;
        }
    }

    handle(value) {
        if (this.bytebeatMode === "bb") return (value & 255) / 128 - 1;
        if (this.bytebeatMode === "sbb") return ((value + 128) & 255) / 128 - 1;
        if (this.bytebeatMode === "fb" || this.bytebeatMode === "func") return Math.min(Math.max(value, -1.0), 1.0);
        if (this.bytebeatMode === "4096exotic") return (value & 4095) / 2048 - 1;
        if (this.bytebeatMode === "detailedbeatexotic") return (((value & 255) + (Math.abs(value) % 1)) % 256) / 128 - 1;
        return (value & 255) / 128 - 1;
    }

    process(inputs, outputs) {
        const output = outputs[0];
        if (!output || output.length < 2) return true;
        const left = output[0];
        const right = output[1];

        for (let i = 0; i < left.length; i++) {
            let tVal = this.t++;

            let result;
            try {
                if (this.bytebeatMode === "func") {
                    result = this.bytebeatFunc(tVal / this.sampleRate, this.sampleRate);
                } else {
                    result = this.bytebeatFunc(tVal);
                }
            } catch (e) {
                this.port.postMessage({type: "error", t: tVal, message: `${e.name}: ${e.message}`, id: this.id});
                left[i] = this.lastLeft;
                right[i] = this.lastRight;
                continue;
            }

            if (Array.isArray(result)) {
                left[i] = this.handle(result[0]);
                right[i] = this.handle(result[1]);
            } else {
                const h = this.handle(result);
                left[i] = h;
                right[i] = h;
            }

            this.port.postMessage({
                type: "visual",
                left: left[i],
                right: right[i],
                t: this.t - 1,
                id: this.id,
            });

            left[i] *= this.volume;
            right[i] *= this.volume;

            this.lastLeft = left[i];
            this.lastRight = right[i];

            const currentDisplay = (typeof globalThis.jsteDisplayText !== "undefined") ? String(globalThis.jsteDisplayText) : "";
            if (currentDisplay !== this.lastDisplayValue && (tVal - this.lastDisplayT) >= this.displayThrottleSamples) {
                this.lastDisplayT = tVal;
                this.lastDisplayValue = currentDisplay;
                this.port.postMessage({type: "display", text: currentDisplay, id: this.id});
            }
        }

        return true;
    }
}

registerProcessor("bytebeat-processor", BytebeatProcessor);
