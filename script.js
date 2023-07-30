function playBytebeat() {
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
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = 2 ** 14;
  const scriptNode = audioContext.createScriptProcessor(bufferSize, 0, 1);
  let theReali = 0;
  scriptNode.onaudioprocess = function (audioProcessingEvent) {
    const outputBuffer = audioProcessingEvent.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      theReali++;
      t = (theReali / audioContext.sampleRate) * sampleRate;
      const x = eval(bytebeatCode) & 255;
      const sample = x / 128 - 1;
      outputBuffer[i] = sample;
    }
  };

  scriptNode.connect(audioContext.destination);
}

function stopBytebeat() {
  audioContext.suspend();
}
