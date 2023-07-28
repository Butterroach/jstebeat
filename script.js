let audioContext;
let audioBuffer;
let bytebeatNode;
let isPlaying = false;

function playBytebeat() {
  // get the bytebeat code from the HTML text form
  const bytebeatCode = document.getElementById("bytebeat-code").value;

  // create an audio context
  audioContext = new AudioContext();

  // get the sample rate from the HTML input
  const sampleRate = document.getElementById("sample-rate").value;
  audioContext.sampleRate = sampleRate;

  console.log("this shi playin"); // * debug, remove before production
  console.log(sampleRate); // * debug, remove before production

  // create a function from the bytebeat code and compile it for faster execution
  const bytebeat = new Function("t", "return (" + bytebeatCode + ")").bind(
    null
  );

  // create a script processor node to generate audio data
  bytebeatNode = audioContext.createScriptProcessor(0, 1, 1);

  bytebeatNode.onaudioprocess = function (event) {
    const outputBuffer = event.outputBuffer;
    const outputChannel = outputBuffer.getChannelData(0);
    for (let i = 0; i < outputBuffer.length; i++) {
      // calculate the time for each sample based on the current position in the buffer
      const t = (i + audioContext.currentTime * sampleRate) / sampleRate;
      // call the bytebeat code to generate the next sample value
      const sampleValue = bytebeat(t);
      // convert the sample value to an 8-bit unsigned integer
      const byteValue = sampleValue & 255;
      // normalize the sample value to the range -1 to 1 and write it to the output buffer
      outputChannel[i] = byteValue / 128 - 1;
    }
  };

  // connect the bytebeat node to the audio context's destination
  bytebeatNode.connect(audioContext.destination);

  // start playing the audio
  isPlaying = true;
  audioContext.resume();
}

function stopBytebeat() {
  // disconnect the bytebeat node from the audio context's destination
  bytebeatNode.disconnect();
  isPlaying = false;
}
