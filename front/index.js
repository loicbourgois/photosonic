"use strict";


import * as wasm from "wasm-photosonic";


async function main() {
  wasm.greet();
  window.math     = await import("./math.js")
  window.particle = await import("./particle.js")
  window.shader   = await import("./shader.js")
  window.Configurations = await import("./configurations/configurations.js")
  const configurations = await Configurations.load_all()
  if ("gpu" in navigator) {
     test(configurations)
  } else {
    const m = "Photosonic requires WebGPU.\nInstructions on how to enable at https://web.dev/gpu/#use"
    alert(m)
    console.error(m)
  }
}


function test(configurations) {
  const k = Object.keys(configurations)[0];
  const config = configurations[k];
  delete configurations[k];
  console.log(`[start] ${k}`)
  start(config, function() {
    console.log(`[ end ] ${k}`)
    const keys = Object.keys(configurations);
    if (len(keys) > 0) {
      test(configurations)
    }
  })
}


async function start(conf, end_callback) {
  // console.log("configuration:", JSON.stringify(conf,0,2))
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("No gpu adapter found")
    return;
  }
  const device = await adapter.requestDevice();
  const gpu_buffer_A = device.createBuffer({
    size: conf.buffer_size,
    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
  });
  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  const data = new DataView(gpu_buffer_A.getMappedRange())
  for (let i = 0; i < len(conf.particles); i++) {
    const p = conf.particles[i]
    particle.set(data, i+1, p.x, p.y, p.dx, p.dy, p.kind, conf)
  }
  gpu_buffer_A.unmap()
  const gpu_buffer_B = device.createBuffer({
    size: conf.buffer_size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_C = device.createBuffer({
    size: conf.buffer_size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_D = device.createBuffer({
    size: conf.buffer_size,
    usage:   GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });
  const gpu_buffer_image_storage = device.createBuffer({
    size: buffer_image_size_image(conf),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_image_read = device.createBuffer({
    size: buffer_image_size_image(conf),
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
  const canvas =  document.querySelector("#canvas")
  canvas.width =  conf.image_width * conf.size * conf.zoom;
  canvas.height = conf.image_height * conf.size * conf.zoom;
  const ctx = canvas.getContext("2d");
  step(
    conf,
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
    end_callback,
  )
}


let fpss = []
let fpss_time = performance.now();


async function step(
  conf,
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
  end_callback,
  step_ = 0,
) {
  fpss.push(performance.now()-fpss_time)
  while (len(fpss) > 1000) {
    fpss.shift()
  }
  let fps = 0;
  for (let f of fpss) {
    fps += f;
  }
  fps /= len(fpss)
  document.querySelector("#fps_value").innerHTML = `${Math.floor(1000/(fps))}`
  fpss_time = performance.now();
  await compute(
    conf,
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


  const step_tests = conf.tests[step_];
  if (step_tests) {
    await gpu_buffer_D.mapAsync(GPUMapMode.READ);
    const buffer = new DataView(gpu_buffer_D.getMappedRange())
    let test_failed = [];
    for (let i = 0; i < step_tests.length; i++) {
      const test = step_tests[i]
      const p = particle.get(buffer, test.particle, conf)
      for (let k in test.kv) {
        if (Math.abs(p[k] - test.kv[k]) > 0.000001 ) {
          test_failed.push({
            step: step_,
            particle: test.particle,
            key: k,
            value: p[k],
            expected_value: test.kv[k]
          })
        }
      }
    }
    if (len(test_failed) > 0) {
      for (let i = 0; i < test_failed.length; i++) {
        console.error(JSON.stringify(test_failed[i], 0, 2))
      }
      throw `test failed`
    }


    gpu_buffer_D.unmap()
  }

  if (conf.steps == "unlimited" || step_ < conf.steps-1) {
    step_ += 1
    setTimeout(function(){
      step(
        conf,
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
        end_callback,
        step_,
      )
    }, conf.wait);
  } else {
    end_callback()
  }
}


async function compute(
  conf,
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
  command_encoder.copyBufferToBuffer(gpu_buffer_A, 0, gpu_buffer_B, 0, conf.buffer_size);
  const pass_encoder = command_encoder.beginComputePass();
  pass_encoder.setPipeline(compute_pipeline);
  pass_encoder.setBindGroup(0, bind_group);
  pass_encoder.dispatch(dispatch_x, dispatch_y);
  pass_encoder.endPass();
  command_encoder.copyBufferToBuffer(gpu_buffer_C, 0, gpu_buffer_D, 0 , conf.buffer_size);
  command_encoder.copyBufferToBuffer(gpu_buffer_image_storage, 0, gpu_buffer_image_read, 0 , buffer_image_size_image(conf));
  const gpuCommands = command_encoder.finish();
  device.queue.submit([gpuCommands]);
  await gpu_buffer_image_read.mapAsync(GPUMapMode.READ);
  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  await gpu_buffer_D.mapAsync(GPUMapMode.READ);
  const start_render = performance.now();
  ctx.putImageData(
    new ImageData(
      Uint8ClampedArray.from(new Uint32Array(gpu_buffer_image_read.getMappedRange())),
      conf.image_width
    ),
    0, 0
  );
  render_timer(performance.now() - start_render);
  let data = new DataView(gpu_buffer_D.getMappedRange())
  data.setUint32(0, step_, conf.littleEndian);
  data.setFloat32(4, performance.now(), conf.littleEndian);
  new Uint8Array(gpu_buffer_A.getMappedRange()).set(new Uint8Array(data.buffer));
  gpu_buffer_A.unmap();
  gpu_buffer_D.unmap();
  gpu_buffer_image_read.unmap()
  compute_timer(performance.now() - start)
}


function len(x) {
  return x.length
}
function range(start, end) {
    return (new Array(end - start)).fill(undefined).map((_, i) => i + start);
}


function buffer_image_size_image(conf) {
  return conf.image_size * 4 * 4
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
  document.querySelector("#compute_time").innerHTML = `${compute_time.toFixed(2)}ms`
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


main()
