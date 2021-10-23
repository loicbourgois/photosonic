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

// ACTION
const DO_NOTHING = 0;
const PRODUCE = 1;

const ANTHILL_ENERGY_MAX = 20000;
const ANTHILL_PULSE = 10;

const PHEROMON_MAX = 2000;

const conf = {
  width: 1024/4,
  height: 1024/4,
  workgroup_size: 8,
  attributs_count: 7,
}

const ID_BASE       = conf.width * conf.height
const ID_KIND       = ID_BASE * 1
const ID_DIRECTION  = ID_BASE * 2
const ID_ENERGY     = ID_BASE * 3
const ID_GENE_1     = ID_BASE * 4
const ID_ACTION     = ID_BASE * 5
const ID_PHEROMON   = ID_BASE * 6


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

let fpss = []
let time = performance.now();

async function start() {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    return;
  }
  const device = await adapter.requestDevice();
  let map = new_map();
  // SETUP
  const gpu_buffer_A = device.createBuffer({
    size: buffer_map_size(),
    usage:   GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_B = device.createBuffer({
    size: buffer_map_size(),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const gpu_buffer_C = device.createBuffer({
    size: buffer_map_size(),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_D = device.createBuffer({
    size: buffer_map_size(),
    usage:   GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });

  const gpu_buffer_image_storage = device.createBuffer({
    size: buffer_map_size_image(),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_image_read = device.createBuffer({
    size: buffer_map_size_image(),
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });


  const gpu_buffer_data_storage = device.createBuffer({
    size: 4*data_size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const gpu_buffer_data_write = device.createBuffer({
    size: 4*data_size,
    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
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
      },{
        binding: 3,
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
      },{
        binding: 3,
        resource: {
          buffer: gpu_buffer_data_storage
        }
      }
    ]
  });
  const shader_module = device.createShaderModule({
    code: SHADER
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
  const dispatch_x = Math.ceil(conf.width / conf.workgroup_size);
  const dispatch_y = Math.ceil(conf.height / conf.workgroup_size);
  // Init
  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  const array_buffer_A = gpu_buffer_A.getMappedRange();
  new Uint32Array(array_buffer_A).set(map);
  gpu_buffer_A.unmap();
  const canvas =  document.querySelector("#canvas")
  canvas.width = conf.width*size*ZOOM;
  canvas.height = conf.height*size*ZOOM;
  const ctx = canvas.getContext("2d");
  step(
    map,
    device,
    gpu_buffer_A,
    gpu_buffer_B,
    gpu_buffer_C,
    gpu_buffer_D,
    gpu_buffer_image_storage,
    gpu_buffer_image_read,
    gpu_buffer_data_storage,
    gpu_buffer_data_write,
    compute_pipeline,
    bind_group,
    dispatch_x,
    dispatch_y,
    ctx,
    0
  )
}

async function step(
  map,
  device,
  gpu_buffer_A,
  gpu_buffer_B,
  gpu_buffer_C,
  gpu_buffer_D,
  gpu_buffer_image_storage,
  gpu_buffer_image_read,
  gpu_buffer_data_storage,
  gpu_buffer_data_write,
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
    map = await compute(
      map,
      device,
      gpu_buffer_A,
      gpu_buffer_B,
      gpu_buffer_C,
      gpu_buffer_D,
      gpu_buffer_image_storage,
      gpu_buffer_image_read,
      gpu_buffer_data_storage,
      gpu_buffer_data_write,
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
      map,
      device,
      gpu_buffer_A,
      gpu_buffer_B,
      gpu_buffer_C,
      gpu_buffer_D,
      gpu_buffer_image_storage,
      gpu_buffer_image_read,
      gpu_buffer_data_storage,
      gpu_buffer_data_write,
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
  map,
  device,
  gpu_buffer_A,
  gpu_buffer_B,
  gpu_buffer_C,
  gpu_buffer_D,
  gpu_buffer_image_storage,
  gpu_buffer_image_read,
  gpu_buffer_data_storage,
  gpu_buffer_data_write,
  compute_pipeline,
  bind_group,
  dispatch_x,
  dispatch_y,
  ctx,
  step_
) {
  const start = performance.now();
  const command_encoder = device.createCommandEncoder();

  await gpu_buffer_data_write.mapAsync(GPUMapMode.WRITE);
  const data_ = new Float32Array(data_size)
  data_[0] = performance.now();
  data_[1] = step_;
  new Float32Array(gpu_buffer_data_write.getMappedRange()).set(data_);
  gpu_buffer_data_write.unmap();
  command_encoder.copyBufferToBuffer(gpu_buffer_data_write, 0, gpu_buffer_data_storage, 0, 4*data_size);
  command_encoder.copyBufferToBuffer(gpu_buffer_A, 0, gpu_buffer_B, 0, buffer_map_size());
  const pass_encoder = command_encoder.beginComputePass();
  pass_encoder.setPipeline(compute_pipeline);
  pass_encoder.setBindGroup(0, bind_group);
  pass_encoder.dispatch(dispatch_x, dispatch_y);
  pass_encoder.endPass();
  command_encoder.copyBufferToBuffer(gpu_buffer_C, 0, gpu_buffer_D, 0 , buffer_map_size());
  command_encoder.copyBufferToBuffer(gpu_buffer_image_storage, 0, gpu_buffer_image_read, 0 , buffer_map_size_image());
  const gpuCommands = command_encoder.finish();
  device.queue.submit([gpuCommands]);
  await gpu_buffer_D.mapAsync(GPUMapMode.READ);
  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  await gpu_buffer_image_read.mapAsync(GPUMapMode.READ);
  const start_render = performance.now();
  ctx.putImageData(
    new ImageData(
      Uint8ClampedArray.from(new Uint32Array(gpu_buffer_image_read.getMappedRange())),
      conf.width
    ),
    0, 0
  );
  render_timer(performance.now() - start_render);
  map = new Uint32Array(gpu_buffer_D.getMappedRange())
  const map_ = Uint32Array.from(map)
  new Uint32Array(gpu_buffer_A.getMappedRange()).set(map);
  gpu_buffer_A.unmap()
  gpu_buffer_D.unmap();
  gpu_buffer_image_read.unmap()
  compute_timer(performance.now() - start)
  return map_
}


function len(x) {
  return x.length
}


function range(start, end) {
    return (new Array(end - start)).fill(undefined).map((_, i) => i + start);
}


function map_size() {
  return conf.width * conf.height * conf.attributs_count
}
function buffer_map_size() {
  return map_size() * 4 * conf.attributs_count
}
function buffer_map_size_image() {
  return map_size() * 4 * 4
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
const SHADER = `
  [[block]] struct In {
    i: array<u32>;
  };
  [[block]] struct Out {
    o: array<u32>;
  };
  [[block]] struct Image {
    c: array<u32>;
  };
  [[block]] struct Data {
    time: f32;
    step: f32;
  };


  fn random_frac (x:f32, y:f32) -> f32 {
    return fract(sin(dot(vec2<f32>(x*1000.0,y),
                         vec2<f32>(12.9898, 78.233)))*
        43758.5453123);
  }
  fn random_frac_3 (x:f32, y:f32, z:f32) -> f32 {
    let r = random_frac(x,y);
    return random_frac(r, z);
  }
  fn random_u32(z:f32, x:f32, y:f32, min:u32, max:u32) -> u32 {
    return  u32(random_frac_3(x, y, z) * f32(max-min)) + min;
  }


  fn point(id: u32) -> vec2<u32> {
    return vec2<u32>(id % ${conf.width}u, id / ${conf.width}u);
  }


  fn right (cell_id: u32) -> u32 {
    let x = cell_id % ${conf.width}u;
    let y = cell_id / ${conf.width}u;
    return (x+1u) % ${conf.width}u + y * ${conf.width}u;
  }
  fn left (cell_id: u32) -> u32 {
    let x = cell_id % ${conf.width}u;
    let y = cell_id / ${conf.width}u;
    return (x + ${conf.width}u - 1u) % ${conf.width}u + y * ${conf.width}u;
  }
  fn up (cell_id: u32) -> u32 {
    let x = cell_id % ${conf.width}u;
    let y = cell_id / ${conf.width}u;
    return x + ( (y + ${conf.width}u - 1u)%${conf.width}u ) * ${conf.width}u;
  }
  fn down (cell_id: u32) -> u32 {
    let x = cell_id % ${conf.width}u;
    let y = cell_id / ${conf.width}u;
    return x + ( (y + 1u)%${conf.height}u ) * ${conf.width}u;
  }
  fn kind (id: u32) -> u32 {
    return id;
  }
  fn life (id: u32) -> u32 {
    return id + ${ID_ENERGY}u;
  }
  fn pheromon(id: u32) -> u32 {
    return id + ${ID_PHEROMON}u;
  }
  fn gene_1(id: u32) -> u32 {
    return id + ${ID_GENE_1}u;
  }
  fn action(id: u32) -> u32 {
    return id + ${ID_ACTION}u;
  }
  fn direction(id: u32) -> u32 {
    return id + ${ID_DIRECTION}u;
  }


  [[group(0), binding(0)]] var<storage, read>   i : In;
  [[group(0), binding(1)]] var<storage, write>  o : Out;
  [[group(0), binding(2)]] var<storage, write>  c : Image; // canvas
  [[group(0), binding(3)]] var<storage, read>   data : Data;
  [[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
  fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {
    let id = gid.x + gid.y * ${conf.width}u;

    let r1 = random_frac_3(fract(data.time), f32(gid.x), f32(gid.y));
    let r2 = random_frac_3(r1, f32(gid.x), f32(gid.y));
    let r3 = random_frac_3(r2, f32(gid.x), f32(gid.y));
    let r4 = random_frac_3(r3, f32(gid.x), f32(gid.y));
    let r5 = random_frac_3(r4, f32(gid.x), f32(gid.y));

    let r = id * 4u;
    let g = r + 1u;
    let b = r + 2u;
    let a = r + 3u;


    o.o[kind(id)] = i.i[kind(id)];


    // Ant move


    if (i.i[kind(id)] == ${ANT}u && i.i[direction(id)] != ${STAY}u) {
      o.o[kind(id)] = ${FREE}u;
    }
    if (i.i[kind(right(id))] == ${ANT}u && i.i[direction(right(id))] == ${LEFT}u) {
      o.o[kind(id)] = ${ANT}u;
      o.o[direction(id)] = ${LEFT}u;
    }
    if (i.i[kind(left(id))] == ${ANT}u && i.i[direction(left(id))] == ${RIGHT}u) {
      o.o[kind(id)] = ${ANT}u;
      o.o[direction(id)] = ${RIGHT}u;
    }
    if (i.i[kind(up(id))] == ${ANT}u && i.i[direction(up(id))] == ${DOWN}u) {
      o.o[kind(id)] = ${ANT}u;
      o.o[direction(id)] = ${DOWN}u;
    }
    if (i.i[kind(down(id))] == ${ANT}u && i.i[direction(down(id))] == ${UP}u) {
      o.o[kind(id)] = ${ANT}u;
      o.o[direction(id)] = ${UP}u;
    }


    // Production


    if (i.i[kind(left(id))] == ${ANTHILL}u && i.i[action(left(id))] == ${PRODUCE}u) {
      o.o[kind(id)] = ${ANT}u;
      o.o[direction(id)] = ${RIGHT}u;
    }
    if (i.i[kind(up(id))] == ${ANTHILL}u && i.i[action(up(id))] == ${PRODUCE}u) {
      o.o[kind(id)] = ${ANT}u;
      o.o[direction(id)] = ${DOWN}u;
    }
    if (i.i[kind(right(id))] == ${ANTHILL}u && i.i[action(right(id))] == ${PRODUCE}u) {
      o.o[kind(id)] = ${ANT}u;
      o.o[direction(id)] = ${LEFT}u;
    }
    if (i.i[kind(down(id))] == ${ANTHILL}u && i.i[action(down(id))] == ${PRODUCE}u) {
      o.o[kind(id)] = ${ANT}u;
      o.o[direction(id)] = ${UP}u;
    }


    if (o.o[kind(id)] == ${ANTHILL}u) {
      if (u32(data.step) % 10u == 0u && i.i[life(id)] > 0u) {
        o.o[life(id)] = u32(max(0, i32(i.i[life(id)]) - 10));
        o.o[action(id)] = ${PRODUCE}u;
      } else {
        o.o[life(id)] = i.i[life(id)];
        o.o[action(id)] = ${DO_NOTHING}u;
      }
    }


    // Change direction


    if (o.o[kind(id)] == ${ANT}u) {
      var phero: array<u32, 4>;
      phero[${RIGHT}u]  = i.i[pheromon(right(id))];
      phero[${LEFT}u]   = i.i[pheromon(left(id))];
      phero[${UP}u]     = i.i[pheromon(up(id))];
      phero[${DOWN}u]   = i.i[pheromon(down(id))];
      if (phero[o.o[direction(id)]] > phero[${UP}u]) {
          o.o[direction(id)] = ${UP}u;
      }
      if (phero[o.o[direction(id)]] > phero[${RIGHT}u]) {
          o.o[direction(id)] = ${RIGHT}u;
      }
      if (phero[o.o[direction(id)]] > phero[${DOWN}u]) {
          o.o[direction(id)] = ${DOWN}u;
      }
      if (phero[o.o[direction(id)]] > phero[${LEFT}u]) {
          o.o[direction(id)] = ${LEFT}u;
      }
      if (r1 > 0.9) {
        o.o[direction(id)] = u32(r2 * 4.0);
      }
      if (o.o[direction(id)] == ${STAY}u) {
        o.o[direction(id)] = u32(r3 * 4.0);
      }
      var kinds: array<u32, 4>;
      kinds[${RIGHT}u]  = i.i[kind(right(id))];
      kinds[${LEFT}u]   = i.i[kind(left(id))];
      kinds[${UP}u]     = i.i[kind(up(id))];
      kinds[${DOWN}u]   = i.i[kind(down(id))];
      let target_kind = kinds[o.o[direction(id)]];
      if (target_kind != ${FREE}u) {
        o.o[direction(id)] = ${STAY}u;
      }
    }


    // Pheromon


    if (o.o[kind(id)] == ${ANT}u) {
      o.o[pheromon(id)] = ${PHEROMON_MAX}u;
    } else {
      o.o[pheromon(id)] = u32(max(0, i32(i.i[pheromon(id)]) - 1));
      let avg_phero = (i.i[pheromon(left(id))]
        + i.i[pheromon(up(id))]
        + i.i[pheromon(right(id))]
        + i.i[pheromon(down(id))]) / 4u;
      o.o[pheromon(id)] = (o.o[pheromon(id)]*90u + avg_phero*1u) / 92u;
    }


    // Coloring


    if (o.o[kind(id)] == ${ANTHILL}u) {
      c.c[r] = 255u;
      c.c[g] = o.o[life(id)];
      c.c[b] = 0u;
      c.c[a] = 255u;
    } elseif (o.o[kind(id)] == ${ANT}u) {
      c.c[r] = 100u;
      c.c[g] = 0u;
      c.c[b] = 255u;
      c.c[a] = 255u;
    } else {
      c.c[r] = 0u*(2550u * o.o[pheromon(id)] / ${PHEROMON_MAX}u) % 255u;
      c.c[g] = 0u*(2550u * o.o[pheromon(id)] / ${PHEROMON_MAX}u) % 255u;
      c.c[b] = 255u * o.o[pheromon(id)] / ${PHEROMON_MAX}u;
      c.c[g] = c.c[b];
      c.c[a] = 255u;
    }
  }
`
function new_map() {
  let map_ = new Uint32Array(map_size());
  for (let i of range(0, map_size())) {
      // if (i%2 == 0) {
      //   map_[i] = ANT
      // }
  }
  let center =  conf.height*conf.width/2 + conf.width/2;
  map_[Math.floor(center)] = PLANT


  // base =  conf.height*conf.width/2 + conf.width/3*2;
  //
  // // map_[Math.floor(base)] = ANTHILL
  // // map_[Math.floor(base) + ID_ENERGY] = ANTHILL_ENERGY_MAX
  //
  // base = conf.height*conf.width/2 + conf.width/2;
  // map_[Math.floor(base)] = PLANT
  // map_[Math.floor(base) + ID_GENE_1] = 0


  // map_[Math.floor(base + 10*conf.width + 9)] = ANTHILL
  // map_[Math.floor(base+ 10*conf.width +9 ) + ID_DIRECTION] = LEFT
  //
  // // map_[Math.floor(base + 9*conf.width + 10)] = ANTHILL
  // // map_[Math.floor(base+ 9*conf.width +10 ) + ID_DIRECTION] = LEFT
  //
  //
  // map_[Math.floor(base + 10*conf.width)] = FIRE

  // map_[Math.floor(conf.height*conf.width/3 + conf.width/4)] = ANTHILL
  return map_
}

main()
