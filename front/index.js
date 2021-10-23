import * as wasm from "wasm-photosonic";

// DIRECTION
const UP      = 0;
const RIGHT   = 1;
const DOWN    = 2;
const LEFT    = 3;
const STAY    = 4;

// CELL KIND
const FREE      = 0;
const ANT       = 1;
const ANTHILL   = 2;
const FIRE      = 3;
const PLANT     = 4;
const SUN     = 5;

// ACTION
const DO_NOTHING = 0;
const PRODUCE = 1;

const ANTHILL_ENERGY_MAX = 20000;
const ANTHILL_PULSE = 10;

const PHEROMON_MAX = 2000;

const LIGHT_MAX = 100000;

const conf = {
  image_width: 512,
  image_height: 512,
  grid_width: 32,
  grid_height: 32,
  workgroup_size: 8,
  grid_attributs_count: 1,
  particle_attributs_count: 5,
  consts_count: 2,
  FIRE: 3,
  WATER: 4,
}
conf.particle_max_count = particle_max_count()
conf.grid_size = grid_size()
conf.image_size = image_size()


const WAIT = 0;
const RANDO = 10;
const ZOOM = 1;
const size = 1;
const data_size = 2;

function main() {
  wasm.greet();
  if ("gpu" in navigator) {
    start()
  } else {
    let m = "Photosonic requires WebGPU.\nInstructions on how to enable at https://web.dev/gpu/#use"
    alert(m)
    console.error(m)
  }
}


function new_data () {
  let d = new ArrayBuffer(buffer_size());
  return d;
}

let fpss = []
let time = performance.now();


function buffer_position_particle_active(id) {
  return (conf.consts_count + id * conf.particle_attributs_count + 0) * 4
}
function buffer_position_particle_kind(id) {
  return (conf.consts_count + id * conf.particle_attributs_count + 1) * 4
}
function buffer_position_particle_x(id) {
  return (conf.consts_count + id * conf.particle_attributs_count + 2) * 4
}
function buffer_position_particle_y(id) {
  return (conf.consts_count + id * conf.particle_attributs_count + 3) * 4
}
function buffer_position_particle_cell_id(id) {
  return (conf.consts_count + id * conf.particle_attributs_count + 4) * 4
}

function buffer_position_cell_particle_id(x, y) {
  return (
    conf.consts_count
    + particle_max_count() * conf.particle_attributs_count
    + (x + y*conf.grid_width) * conf.grid_attributs_count
    + 0
  ) * 4
}

function set_particle_kind(data, particle_id, kind) {
  data.setUint32(buffer_position_particle_kind(particle_id), kind, true)
}
function get_particle_kind(data, particle_id, kind) {
  return data.getUint32(buffer_position_particle_kind(particle_id), true)
}
function set_particle_x(data, particle_id, value) {
  data.setFloat32(buffer_position_particle_x(particle_id), value, true)
}
function get_particle_x(data, particle_id, value) {
  return data.getFloat32(buffer_position_particle_x(particle_id), true)
}


function set_particle_y(data, particle_id, value) {
  data.setFloat32(buffer_position_particle_y(particle_id), value, true)
}
function set_particle_cell_id(data, particle_id, value) {
  data.setUint32(buffer_position_particle_cell_id(particle_id), value, true)
}
function get_particle_cell_id(data, particle_id) {
  return data.getUint32(buffer_position_particle_cell_id(particle_id), true)
}

function set_cell_particle_id(data, cell_id, particle_id) {
  data.setUint32(cell_id, particle_id, true)
}
function get_cell_particle_id(data, cell_id, particle_id) {
  return data.getUint32(cell_id, true)
}


function set_particle(buffer, particle_id, x, y, kind) {
  let cell_id = buffer_position_cell_particle_id(
    Math.floor(x*(conf.grid_width-1)),
    Math.floor(y*(conf.grid_height-1))
  )
  let old_cell_id = get_particle_cell_id(buffer, particle_id)
  if (old_cell_id != 0 && old_cell_id != cell_id) {
    set_cell_particle_id(buffer, old_cell_id, 0)
  }
  let old_particle_id = get_cell_particle_id(buffer, cell_id)
  if (old_particle_id != 0 && old_particle_id != particle_id) {
    set_particle_cell_id(buffer, old_particle_id, 0)
  }
  //
  set_particle_kind(buffer, particle_id, kind)
  set_particle_x(buffer, particle_id, x)
  set_particle_y(buffer, particle_id, y)
  set_particle_cell_id(buffer, particle_id, cell_id)
  set_cell_particle_id(buffer, cell_id, particle_id)
}


async function start() {

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    return;
  }
  const device = await adapter.requestDevice();
  // SETUP
  const gpu_buffer_A = device.createBuffer({
    size: buffer_size(),
    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
  });

  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  const data = new DataView(gpu_buffer_A.getMappedRange())

  //set_particle(data, 7, 0.1, 0.0, conf.FIRE)
  set_particle(data, 1, 0.0, 0.0, conf.FIRE)
  //set_particle(data, 7, 0.25, 0.0, conf.WATER)


  gpu_buffer_A.unmap()


  const gpu_buffer_B = device.createBuffer({
    size: buffer_size(),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const gpu_buffer_C = device.createBuffer({
    size: buffer_size(),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_D = device.createBuffer({
    size: buffer_size(),
    usage:   GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });
  const gpu_buffer_image_storage = device.createBuffer({
    size: buffer_image_size_image(),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_image_read = device.createBuffer({
    size: buffer_image_size_image(),
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });
  const bind_group_layout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage"
        }
      },{
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage"
        }
      },{
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage"
        }
      }
    ]
  });
  const bind_group = device.createBindGroup({
    layout: bind_group_layout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: gpu_buffer_B
        }
      },{
        binding: 1,
        resource: {
          buffer: gpu_buffer_C
        }
      },{
        binding: 2,
        resource: {
          buffer: gpu_buffer_image_storage
        }
      }
    ]
  });
  const shader = await import("./shader.js")
  const shader_module = device.createShaderModule({
    code: shader.shader(conf)
  });
  const compute_pipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bind_group_layout]
    }),
    compute: {
      module: shader_module,
      entryPoint: "main"
    }
  });
  const dispatch_x = Math.ceil(conf.image_width / conf.workgroup_size);
  const dispatch_y = Math.ceil(conf.image_height / conf.workgroup_size);
  // Init
  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  const array_buffer_A = gpu_buffer_A.getMappedRange();
  new DataView(array_buffer_A).setUint32(0, 132)
  gpu_buffer_A.unmap();
  const canvas =  document.querySelector("#canvas")
  canvas.width = conf.image_width*size*ZOOM;
  canvas.height = conf.image_height*size*ZOOM;
  const ctx = canvas.getContext("2d");
  step(
    device,
    gpu_buffer_A,
    gpu_buffer_B,
    gpu_buffer_C,
    gpu_buffer_D,
    gpu_buffer_image_storage,
    gpu_buffer_image_read,
    compute_pipeline,
    bind_group,
    dispatch_x,
    dispatch_y,
    ctx,
    0
  )
}

async function step(
  device,
  gpu_buffer_A,
  gpu_buffer_B,
  gpu_buffer_C,
  gpu_buffer_D,
  gpu_buffer_image_storage,
  gpu_buffer_image_read,
  compute_pipeline,
  bind_group,
  dispatch_x,
  dispatch_y,
  ctx,
  step_
) {
  fpss.push(performance.now()-time)
  while (len(fpss) > 1000) {
    fpss.shift()
  }
  let fps = 0;
  for (let f of fpss) {
    fps += f;
  }
  fps /= len(fpss)
  document.querySelector("#fps_value").innerHTML = `${Math.floor(1000/(fps))}`
  time = performance.now();
  step_ += 1
  for (let i = 0 ; i < 1 ; i++) {
    await compute(
      device,
      gpu_buffer_A,
      gpu_buffer_B,
      gpu_buffer_C,
      gpu_buffer_D,
      gpu_buffer_image_storage,
      gpu_buffer_image_read,
      compute_pipeline,
      bind_group,
      dispatch_x,
      dispatch_y,
      ctx,
      step_
    )
  }
  setTimeout(function(){
    step(
      device,
      gpu_buffer_A,
      gpu_buffer_B,
      gpu_buffer_C,
      gpu_buffer_D,
      gpu_buffer_image_storage,
      gpu_buffer_image_read,
      compute_pipeline,
      bind_group,
      dispatch_x,
      dispatch_y,
      ctx,
      step_
    )
  }, WAIT);
}


async function compute(
  device,
  gpu_buffer_A,
  gpu_buffer_B,
  gpu_buffer_C,
  gpu_buffer_D,
  gpu_buffer_image_storage,
  gpu_buffer_image_read,
  compute_pipeline,
  bind_group,
  dispatch_x,
  dispatch_y,
  ctx,
  step_
) {
  const start = performance.now();
  const command_encoder = device.createCommandEncoder();

  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  const data = new DataView(gpu_buffer_A.getMappedRange())
  data.setUint32(0, step_, true)
  data.setFloat32(4, performance.now(), true)


  //console.log(get_particle_kind(data, 1))
  console.log(get_particle_x(data, 1))
  // set_particle_kind(data, 1, 4)

  gpu_buffer_A.unmap();

  command_encoder.copyBufferToBuffer(gpu_buffer_A, 0, gpu_buffer_B, 0, buffer_size());
  const pass_encoder = command_encoder.beginComputePass();
  pass_encoder.setPipeline(compute_pipeline);
  pass_encoder.setBindGroup(0, bind_group);
  pass_encoder.dispatch(dispatch_x, dispatch_y);
  pass_encoder.endPass();
  command_encoder.copyBufferToBuffer(gpu_buffer_C, 0, gpu_buffer_D, 0 , buffer_size());
  command_encoder.copyBufferToBuffer(gpu_buffer_image_storage, 0, gpu_buffer_image_read, 0 , buffer_image_size_image());
  const gpuCommands = command_encoder.finish();
  device.queue.submit([gpuCommands]);
  await gpu_buffer_D.mapAsync(GPUMapMode.READ);
  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  await gpu_buffer_image_read.mapAsync(GPUMapMode.READ);
    const start_render = performance.now();
    ctx.putImageData(
      new ImageData(
        Uint8ClampedArray.from(new Uint32Array(gpu_buffer_image_read.getMappedRange())),
        conf.image_width
      ),
      0, 0
    );
    render_timer(performance.now() - start_render);
  new Uint8Array(gpu_buffer_A.getMappedRange()).set(new Uint8Array(gpu_buffer_D.getMappedRange()));
  // new Uint8Array(gpu_buffer_D.getMappedRange()).set(new Uint8Array(gpu_buffer_A.getMappedRange()));
  gpu_buffer_A.unmap()
  gpu_buffer_D.unmap();
  gpu_buffer_image_read.unmap()
  compute_timer(performance.now() - start)
}

function copy(src)  {
    var dst = new ArrayBuffer(src.byteLength);
    new Uint8Array(dst).set(new Uint8Array(src));
    return dst;
}

function len(x) {
  return x.length
}


function range(start, end) {
    return (new Array(end - start)).fill(undefined).map((_, i) => i + start);
}


function image_size() {
  return conf.image_width * conf.image_height
}
function grid_size() {
  return conf.grid_width * conf.grid_height
}
function particle_max_count() {
  return grid_size() / 4
}
function buffer_size() {
  return (
    conf.consts_count
    + particle_max_count() * conf.particle_attributs_count
    + grid_size() * conf.grid_attributs_count * 1
  ) * 4
}
function buffer_image_size_image() {
  return image_size() * 4 * 4
}


function random_int(min, max) {
  return Math.floor(min + Math.random() * (max+1-min));
}

const compute_times = []
function compute_timer(t) {
  compute_times.push(t)
  while (len(compute_times) > 100) {
    compute_times.shift()
  }
  let compute_time = 0;
  for (let x of compute_times) {
    compute_time += x;
  }
  compute_time /= len(compute_times)
  document.querySelector("#compute_time").innerHTML = `${compute_time.toFixed(2)} ms`
}

const render_times = []
function render_timer(t) {
  render_times.push(t)
  while (len(render_times) > 100) {
    render_times.shift()
  }
  let render_time = 0;
  for (let x of render_times) {
    render_time += x;
  }
  render_time /= len(render_times)
  document.querySelector("#render_time").innerHTML = `${render_time.toFixed(2)}ms`
}


function id(x, y) {
  return Math.floor(x)*conf.attributs_count + conf.height*Math.floor(y)*conf.attributs_count
}

main()
