import * as wasm from "wasm-photosonic";



const UP      = 0;
const RIGHT   = 1;
const DOWN    = 2;
const LEFT    = 3;
const STAY    = 4;

const ALIVE   = 14;
const FREE    = 19;
const SOURCE  = 27;
const FIRE    = 28;

const conf = {
  width: 1024/4,
  height: 1024/4,
  workgroup_size: 8,
  attributs_count: 4,
}


const ID_DIRECTION = conf.width * conf.height * 2

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


function new_map() {
  let map_ = new Uint32Array(map_size());
  for (let i of range(0, map_size())) {
      map_[i] = FREE
  }

  let base =  conf.height*conf.width/2 + conf.width/4;

  map_[Math.floor(base)] = SOURCE
  map_[Math.floor(base) + ID_DIRECTION] = DOWN

   base =  conf.height*conf.width/2 + conf.width/4*3;

  map_[Math.floor(base)] = SOURCE
  map_[Math.floor(base) + ID_DIRECTION] = DOWN

  // map_[Math.floor(base + 10*conf.width + 9)] = SOURCE
  // map_[Math.floor(base+ 10*conf.width +9 ) + ID_DIRECTION] = LEFT
  //
  // // map_[Math.floor(base + 9*conf.width + 10)] = SOURCE
  // // map_[Math.floor(base+ 9*conf.width +10 ) + ID_DIRECTION] = LEFT
  //
  //
  // map_[Math.floor(base + 10*conf.width)] = FIRE

  // map_[Math.floor(conf.height*conf.width/3 + conf.width/4)] = SOURCE
  return map_
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
  fn random_frac (x:f32, y:f32) -> f32 {
    return fract(sin(dot(vec2<f32>(x,y),
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


  [[block]] struct Matrix {
    n: array<u32>;
  };
  [[block]] struct Data {
    time: f32;
    step: f32;
  };


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

  fn kind (x: u32) -> u32 {
    return x;
  }

  fn life (x: u32) -> u32 {
    return x + ${conf.width}u * ${conf.height}u;
  }

  fn pheromon(x: u32) -> u32 {
    return x + ${conf.width}u * ${conf.height}u * 3u;
  }

  [[group(0), binding(0)]] var<storage, read>   i : Matrix;
  [[group(0), binding(1)]] var<storage, write>  out : Matrix;
  [[group(0), binding(2)]] var<storage, write>  canvas : Matrix;
  [[group(0), binding(3)]] var<storage, read>   data : Data;
  [[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
  fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {
    let x = gid.x + gid.y * ${conf.width}u;

    let id_life       = ${conf.width}u*${conf.height}u;
    let id_direction  = ${ID_DIRECTION}u;

    let cell_id_kind      = x;
    let cell_id_life      = life(x);
    let cell_id_direction = x + id_direction;
    let cell_id_pheromon = x  + id_life * 3u;

    let cell_id_left = (gid.x - 1u + ${conf.width}u)%${conf.width}u + gid.y * ${conf.width}u;
    let cell_id_right = (gid.x + 1u )%${conf.width}u + gid.y * ${conf.width}u;
    let cell_id_down = (gid.x) + ((gid.y+1u)%${conf.height}u) * ${conf.width}u;
    let cell_id_up = (gid.x) + ((gid.y + ${conf.height}u - 1u)%${conf.height}u) * ${conf.width}u;
    //


    let in_kind = i.n[x];
    let in_life = i.n[cell_id_life];
    let in_direction = i.n[cell_id_direction];

    let right_kind        = i.n[kind(right(x))];
    let right_life        = i.n[cell_id_right + id_life];
    let right_direction   = i.n[cell_id_right + id_direction];
    let left_kind       = i.n[cell_id_left];
    let left_life       = i.n[cell_id_left + id_life];
    let left_direction  = i.n[cell_id_left + id_direction];
    let up_kind       = i.n[cell_id_up];
    let up_life       = i.n[cell_id_up + id_life];
    let up_direction  = i.n[cell_id_up + id_direction];
    let down_kind       = i.n[cell_id_down];
    let down_life       = i.n[cell_id_down + id_life];
    let down_direction  = i.n[cell_id_down + id_direction];


    let left_up_kind = i.n[kind(up(left(x)))];


    let pix_id = x*4u;
    let rythm = 2u;
    let rythm_ = rythm - 1u;

    var out_kind = in_kind;
    var out_life = (in_life - 1u + rythm)%rythm;
    var out_direction = in_direction;







    var out_pheromon = u32( max(0, i32(i.n[pheromon(x)]) - 10) );





    var directions: array<u32,4>;
    directions[0] = ${UP}u;
    directions[1] = ${RIGHT}u;
    directions[2] = ${DOWN}u;
    directions[3] = ${LEFT}u;





    // Leave
    if (in_kind == ${ALIVE}u && in_direction != ${STAY}u) {
      out_kind = ${FREE}u;
      out_pheromon = 255u;
    }


    // Go right
    if (left_kind == ${ALIVE}u && left_direction == ${RIGHT}u) {
      out_kind = ${ALIVE}u;
      out_direction = left_direction;
    }
    // Go up
    if (down_kind == ${ALIVE}u && down_direction == ${UP}u) {
      out_kind = ${ALIVE}u;
      out_direction = down_direction;
    }
    // Go left
    if (right_kind == ${ALIVE}u && right_direction == ${LEFT}u) {
      out_kind = ${ALIVE}u;
      out_direction = right_direction;
    }
    // Go down
    if (up_kind == ${ALIVE}u && up_direction == ${DOWN}u) {
      out_kind = ${ALIVE}u;
      out_direction = up_direction;
    }

    // Source
    if (left_kind == ${SOURCE}u && left_life == rythm_ && left_direction == ${RIGHT}u) {
      out_kind = ${ALIVE}u;
      out_direction = left_direction;
    }
    if (up_kind == ${SOURCE}u && up_life == rythm_ && up_direction == ${DOWN}u) {
      out_kind = ${ALIVE}u;
      out_direction = ${DOWN}u;
    }
    if (right_kind == ${SOURCE}u && right_life == rythm_ && right_direction == ${LEFT}u) {
      out_kind = ${ALIVE}u;
      out_direction = right_direction;
    }


    let r1 = random_frac_3(fract(data.time), f32(gid.x), f32(gid.y));
    let r2 = random_frac_3(r1, f32(gid.x), f32(gid.y));
    let r3 = random_frac_3(r2, f32(gid.x), f32(gid.y));


    if (out_kind == ${ALIVE}u) {
      //
      // Player logic
      //



      // if (r2 > 0.8) {
      //   var pheromons: array<u32, 4>;
      //   pheromons[0] = i.n[pheromon(up(x))];
      //   pheromons[1] = i.n[pheromon(right(x))];
      //   pheromons[2] = i.n[pheromon(down(x))];
      //   pheromons[3] = i.n[pheromon(left(x))];
      //   pheromons[out_direction] = 0u;
      //   if (pheromons[0] > pheromons[1]) {
      //     out_direction = 0u;
      //   } else {
      //     out_direction = 1u;
      //   }
      //   if (pheromons[out_direction] > pheromons[2]) {
      //     out_direction = out_direction;
      //   } else {
      //     out_direction = 2u;
      //   }
      //   if (pheromons[out_direction] > pheromons[3]) {
      //     out_direction = out_direction;
      //   } else {
      //     out_direction = 3u;
      //   }
      // }





      if (out_direction == ${STAY}u || r3 > 0.9) {
        let out_direction_id = random_u32(r1, f32(gid.x), f32(gid.y), 0u, 4u);
        out_direction = directions[out_direction_id];
      }


      if (i.n[pheromon(up(x))] > 2u && out_direction == ${UP}u) {
        out_direction = ${STAY}u;
      }
      if (i.n[pheromon(down(x))] > 2u && out_direction == ${DOWN}u) {
        out_direction = ${STAY}u;
      }
      if (i.n[pheromon(left(x))] > 2u && out_direction == ${LEFT}u) {
        out_direction = ${STAY}u;
      }
      if (i.n[pheromon(right(x))] > 2u && out_direction == ${RIGHT}u) {
        out_direction = ${STAY}u;
      }


      if (right_kind != ${FREE}u && out_direction == ${RIGHT}u) {
        out_direction = ${STAY}u;
      }
      if (up_kind != ${FREE}u && out_direction == ${UP}u) {
        out_direction = ${STAY}u;
      }
      if (out_direction == ${LEFT}u && i.n[kind(left(x))] != ${FREE}u) {
        out_direction = ${STAY}u;
      }
      if (out_direction == ${DOWN}u && down_kind != ${FREE}u) {
        out_direction = ${STAY}u;
      }
    }


    if (in_kind == ${FIRE}u) {
      out_kind = ${FIRE}u;
    }

    canvas.n[pix_id] = 0u;
    canvas.n[pix_id+1u] = 0u;
    canvas.n[pix_id+2u] = 0u;

    if (out_kind == ${SOURCE}u) {
      canvas.n[pix_id] = 0u;
      canvas.n[pix_id+1u] = out_life * 255u / rythm;
      canvas.n[pix_id+2u] = out_life * 255u / rythm;
    }
    if (out_kind == ${ALIVE}u) {
      canvas.n[pix_id] = 0u;
      canvas.n[pix_id+1u] = 255u;
      canvas.n[pix_id+2u] = 0u;
    }
    if (out_kind == ${FIRE}u) {
      canvas.n[pix_id] = 255u;
      canvas.n[pix_id+1u] = 0u;
      canvas.n[pix_id+2u] = 0u;
    }


    canvas.n[pix_id+2u] = out_pheromon;
    canvas.n[pix_id+3u] = 255u;


    out.n[x]            = out_kind;
    out.n[cell_id_life]       = out_life;
    out.n[cell_id_direction]  = out_direction;
    out.n[cell_id_pheromon]   = out_pheromon;
  }
`
main()
