import * as wasm from "wasm-photosonic";
function main() {
  wasm.greet();
  if ("gpu" in navigator) {
    console.log("yeah, gpu uu")
    start()
  } else {
    console.log("no gpu for you ou")
  }
}
async function start() {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    return;
  }
  const device = await adapter.requestDevice();
  console.log(device)

}
function write() {
  // Get a GPU buffer in a mapped state and an arrayBuffer for writing.
  const gpuBuffer = device.createBuffer({
    mappedAtCreation: true,
    size: 4,
    usage: GPUBufferUsage.MAP_WRITE
  });
  const arrayBuffer = gpuBuffer.getMappedRange();

  // Write bytes to buffer.
  new Uint8Array(arrayBuffer).set([0, 1, 2, 3]);
}
main()
