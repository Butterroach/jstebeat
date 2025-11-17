class BytebeatProcessor extends AudioWorkletProcessor {
    private id: number | null = null;
    private sampleRate: number;
    private bytebeatCode: string;
    private bytebeatMode: string;
    private t: number = 0;
    private lastDisplayT: number = 0;
    private lastDisplayValue: string = "";
    private displayThrottleSamples: number;
    private volume: number = 1.0;
    private lastLeft: number = 0;
    private lastRight: number = 0;
    private initialKeys: Set<string> | null = null;
    private bytebeatFunc: Function | null = null;
    private suicide: boolean = false;
    private paused: boolean = false;

    constructor(options: { processorOptions: { sampleRate: number; bytebeatCode: string; bytebeatMode: string; }; }) {
        super();

        (function createMathAliasesInWorklet() {
            const mathItems = Object.getOwnPropertyNames(Math);
            for (let item of mathItems) { // @ts-ignore
                globalThis[item] = Math[item];
            }
            // @ts-ignore
            globalThis.int = Math.floor;
        })();

        this.sampleRate = (options.processorOptions && options.processorOptions.sampleRate) || 44100;
        this.bytebeatCode = (options.processorOptions && options.processorOptions.bytebeatCode) || "0";
        this.bytebeatMode = (options.processorOptions && options.processorOptions.bytebeatMode) || "bb";
        this.displayThrottleSamples = Math.max(1, Math.floor(this.sampleRate / 60)); // ~16ms

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
                // @ts-ignore
                globalThis.jsteDisplayText = '';
            } else if (d.type === "setId") {
                this.id = d.id;
            } else if (d.type === "setT") {
                this.t = d.t;
            // } else if (e.data.type === "getState") {
            //     const capturedState = {};
            //
            //     for (const key of Object.keys(globalThis)) {
            //         if (!this.initialKeys!.has(key)) {
            //             // @ts-ignore
            //             let value = globalThis[key];
            //             if (typeof value === 'function') {
            //                 // @ts-ignore
            //                 capturedState[key] = {
            //                     __type: 'function',
            //                     code: value.toString()
            //                 };
            //             } else {
            //                 // @ts-ignore
            //                 capturedState[key] = value;
            //             }
            //         }
            //     }
            //
            //     console.log(capturedState);
            //
            //     this.port.postMessage({
            //         type: "state",
            //         state: JSON.parse(JSON.stringify(capturedState)),
            //         id: this.id
            //     });
            // } else if (d.type === "setState") {
            //     this.initialKeys = new Set(Object.keys(globalThis));
            //     const savedState = e.data.state;
            //     for (const key in savedState) {
            //         if (!Object.hasOwn(savedState, key)) continue;
            //         let value = savedState[key];
            //         let restoredValue;
            //         if (typeof value === 'object' && value !== null && value.__type === 'function') {
            //             try {
            //                 restoredValue = new Function('return ' + value.code)();
            //             } catch (error) {
            //                 console.error(`AHHHHH failed to restore function "${key}":`, error);
            //                 continue;
            //             }
            //         } else {
            //             restoredValue = value;
            //         }
            //         // @ts-ignore
            //         globalThis[key] = restoredValue;
            //     }
            } else if (d.type === "compile") {
                this.compileBytebeat();
            } else if (d.type === "kill") {
                this.suicide = true;
                console.log("yay")
            } else if (d.type === "pause") {
                this.paused = true;
            } else if (d.type === "play") {
                this.paused = false;
            }
        };
    }

    compileBytebeat() {
        if (!this.initialKeys) {
            this.initialKeys = new Set(Object.keys(globalThis));
        }
        this.bytebeatFunc = () => NaN;
        try {
            if (this.bytebeatMode === "func") {
                this.bytebeatFunc = Function(this.bytebeatCode)();
            } else {
                this.bytebeatFunc = Function("t", `return 0,${this.bytebeatCode || 0};`);
            }
        } catch (e) {
            if (e instanceof Error) {
                this.port.postMessage({type: "compileError", message: `${e.name}: ${e.message}`, id: this.id});
            } else {
                console.error("erm wtf", e);
            }
        }

        try {
            if (this.t === 0) {
                this.bytebeatFunc!(0);
            }
        } catch (e) {
            if (e instanceof Error) {
                this.port.postMessage({type: "error", t: this.t, message: `${e.name}: ${e.message}`, id: this.id});
            } else {
                this.port.postMessage({type: "error", t: this.t, message: `thrown: ${e}`, id: this.id});
            }
        }
    }

    handle(value: number) {
        if (isNaN(value)) {
            return value;
        }
        if (this.bytebeatMode === "bb") return (value & 255) / 128 - 1;
        if (this.bytebeatMode === "sbb") return ((value + 128) & 255) / 128 - 1;
        if (this.bytebeatMode === "fb" || this.bytebeatMode === "func") return Math.min(Math.max(value, -1.0), 1.0);
        if (this.bytebeatMode === "4096exotic") return (value & 4095) / 2048 - 1;
        if (this.bytebeatMode === "detailedbeatexotic") return (((value & 255) + (Math.abs(value) % 1)) % 256) / 128 - 1;
        return (value & 255) / 128 - 1;
    }

    // noinspection JSUnusedGlobalSymbols
    process(_: Float32Array[][], outputs: Float32Array[][]): boolean {
        if (this.suicide) {
            // im feeling depresed :pensive:
            return false;
        }

        const output = outputs[0];
        if (!output || output.length < 2) return true;
        const left = output[0];
        const right = output[1];

        this.bytebeatFunc = this.bytebeatFunc!;

        if (this.paused) {
            left.fill(this.lastLeft)
            right.fill(this.lastRight)
            return true;
        }

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
                if (e instanceof Error) {
                    this.port.postMessage({type: "error", t: tVal, message: `${e.name}: ${e.message}`, id: this.id});
                } else {
                    this.port.postMessage({type: "error", t: tVal, message: `thrown: ${e}`, id: this.id});
                }
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

            if (isNaN(left[i])) {
                left[i] = this.lastLeft;
            } else {
                left[i] *= this.volume;
                this.lastLeft = left[i];
            }
            if (isNaN(right[i])) {
                right[i] = this.lastRight;
            } else {
                right[i] *= this.volume;
                this.lastRight = right[i];
            }

            // @ts-ignore
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
