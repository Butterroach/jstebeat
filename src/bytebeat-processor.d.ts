declare class BytebeatProcessor extends AudioWorkletProcessor {
    id: any | null;
    sampleRate: number;
    bytebeatCode: string;
    bytebeatMode: string;
    t: number;
    lastDisplayT: number;
    lastDisplayValue: string;
    displayThrottleSamples: number;
    volume: number;
    lastLeft: number;
    lastRight: number;

    constructor(options?: AudioWorkletNodeOptions);

    compileBytebeat(): void;
    handle(value: number): number;
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters?: Record<string, Float32Array>
    ): boolean;

    // optional: parameterDescriptors is static
    static get parameterDescriptors(): AudioParamDescriptor[];
}

declare function registerProcessor(name: string, processorCtor: typeof BytebeatProcessor): void;