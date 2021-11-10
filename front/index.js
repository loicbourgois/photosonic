"use strict";


import * as wasm from "wasm-photosonic";




let keys = {}
window.addEventListener("keydown", function(e){
      keys[e.keyCode] = true;
}, false);
window.addEventListener('keyup', function(e){
      keys[e.keyCode] = false;
},false);



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
  compute_times.push({
    duration: t,
    timestamp: performance.now()
  })
  while (len(compute_times) > 100) {
    compute_times.shift()
  }
  let compute_time = 0;
  for (let x of compute_times) {
    compute_time += x.duration;
  }

  compute_time /= len(compute_times)
  document.querySelector("#compute_time").innerHTML = `${compute_time.toFixed(2)}ms`

  const a = len(compute_times) / ( (compute_times[len(compute_times)-1].timestamp - compute_times[0].timestamp) / 1000 ) ;
  let pre = ""
  if (a < 10) {
    pre = "&#8239;&#8239;"
  } else if (a < 100) {
    pre = "&#8239;"
  }
  document.querySelector("#cps_value").innerHTML = `${pre}${a.toFixed(1)} CPS`
}


const render_times = []
function render_timer(t) {
  render_times.push({
    duration: t,
    timestamp: performance.now()
  })
  while (len(render_times) > 100) {
    render_times.shift()
  }
  let render_time = 0;
  for (let x of render_times) {
    render_time += x.duration;
  }
  render_time /= len(render_times)
  document.querySelector("#render_time").innerHTML = `${render_time.toFixed(2)}ms`

  const a = len(render_times) / ( (render_times[len(render_times)-1].timestamp - render_times[0].timestamp) / 1000 ) ;
  let pre = ""
  if (a < 10) {
    pre = "&#8239;&#8239;"
  } else if (a < 100) {
    pre = "&#8239;"
  }
  document.querySelector("#fps_value").innerHTML = `${pre}${a.toFixed(1)} FPS`
}


async function main() {
  wasm.greet();
  window.math     = await import("./math.js")
  window.particle = await import("./particle.js")
  window.compute_shader_setup   = await import("./shaders/compute_setup.js")
  window.compute_shader_reset   = await import("./shaders/compute_reset.js")
  window.compute_shader   = await import("./shaders/compute.js")
  window.compute_shader_move   = await import("./shaders/compute_move.js")
  window.render_shader   = await import("./shaders/render.js")
  window.Configurations = await import("./configurations/configurations.js")
  window.shader_common = await import("./shaders/common.js")
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
  shader_common.init(conf)
  document.getElementById("button_zoom").addEventListener("click", function(){
    conf.zoom = conf.zoom*1.05;
  });
  document.getElementById("button_unzoom").addEventListener("click", function(){
    conf.zoom = Math.max(conf.zoom/1.05, 1.0) ;
  });

  const oy = -0.0025;

  document.getElementById("button_left").addEventListener("click", function(){
    conf.center.x = (conf.center.x+oy*conf.zoom + 1.0) % 1.0;
  });
  document.getElementById("button_right").addEventListener("click", function(){
    conf.center.x = (conf.center.x-oy*conf.zoom + 1.0) % 1.0;
  });
  document.getElementById("button_up").addEventListener("click", function(){
    conf.center.y = (conf.center.y+oy*conf.zoom + 1.0) % 1.0;
  });
  document.getElementById("button_down").addEventListener("click", function(){
    conf.center.y = (conf.center.y-oy*conf.zoom + 1.0) % 1.0;
  });





  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("No gpu adapter found")
    return;
  }
  const device = await adapter.requestDevice();
  // console.log(navigator.gpu)
  // console.log(adapter.name)
  // console.log(device.features)
  // console.log(device.limits)
  const gpu_buffer_A = device.createBuffer({
    size: conf.buffer_size,
    usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
  });





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
  const gpu_buffer_image_storage_previous = device.createBuffer({
    size: buffer_image_size_image(conf),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const gpu_buffer_image_read = device.createBuffer({
    size: buffer_image_size_image(conf),
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });


  let gpu_buffers = {
    uniforms_write: device.createBuffer({
      size: conf.uniforms_attributs_count*4,
      usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
    }),
    uniforms_in: device.createBuffer({
      size: conf.uniforms_attributs_count*4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    }),
    uniforms_out: device.createBuffer({
      size: conf.uniforms_attributs_count*4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    }),
    uniforms_read: device.createBuffer({
      size: conf.uniforms_attributs_count*4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    })
  }

  await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
  await gpu_buffers.uniforms_write.mapAsync(GPUMapMode.WRITE)
  const buffer = new DataView(gpu_buffer_A.getMappedRange())
  const view = new DataView(gpu_buffers.uniforms_write.getMappedRange())
  buffer.setUint32(0,   0, conf.littleEndian);
  buffer.setFloat32(4,  performance.now(), conf.littleEndian);
  buffer.setFloat32(8,  conf.center.x, conf.littleEndian);
  buffer.setFloat32(3 * 4, conf.center.y, conf.littleEndian);
  buffer.setFloat32(4 * 4, conf.zoom, conf.littleEndian);
  // for (let i = 0; i < conf.particle_max_count; i++ ) {
  //   particle.set_particle_cell_id(buffer, i, 999999999, conf);
  // }
  // for (let i = 0; i < conf.grid_width; i++ ) {
  //   for (let j = 0; j < conf.grid_width; j++ ) {
  //     particle.set_cell_particle_id(buffer, particle.buffer_position_cell_particle_id(i, j, conf), 999999999, conf);
  //   }
  // }
  for (let i = 0; i < len(conf.particles); i++) {
    const p = conf.particles[i]
    particle.set(buffer, i, p.x, p.y, p.dx, p.dy, p.kind, conf, p.mapping)
    if (p.kind == conf.COCKPIT) {
      view.setUint32((7+27)*4, particle.cell_id(p.x, p.y, conf), conf.littleEndian);
    }
  }
  gpu_buffer_A.unmap()
  gpu_buffers.uniforms_write.unmap()




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
  const bind_group_layout_render = device.createBindGroupLayout({
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
      },
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
      },
      {
        binding: 2,
        resource: {
          buffer: gpu_buffers.uniforms_in
        }
      },
      {
        binding: 3,
        resource: {
          buffer: gpu_buffers.uniforms_out
        }
      }
    ]
  });
  const bind_group_render = device.createBindGroup({
    layout: bind_group_layout_render,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: gpu_buffer_C
        }
      },
      {
        binding: 1,
        resource: {
          buffer: gpu_buffer_image_storage
        }
      },
      {
        binding: 2,
        resource: {
          buffer: gpu_buffer_image_storage_previous
        }
      },
      {
        binding: 3,
        resource: {
          buffer: gpu_buffers.uniforms_in
        }
      }
    ]
  });
  const shader_module = device.createShaderModule({
    code: await compute_shader.get(conf)
  });
  const shader_module_move = device.createShaderModule({
    code: compute_shader_move.get(conf)
  });

  const shader_module_render = device.createShaderModule({
    code: render_shader.get(conf)
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
  const compute_pipeline_render = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bind_group_layout_render]
    }),
    compute: {
      module: shader_module_render,
      entryPoint: "main"
    }
  });
  const dispatch_x = Math.ceil(conf.grid_width / conf.workgroup_size);
  const dispatch_y = Math.ceil(conf.grid_height / conf.workgroup_size);
  const dispatch_x_render = Math.ceil(conf.image_width / conf.workgroup_size);
  const dispatch_y_render = Math.ceil(conf.image_height / conf.workgroup_size);
  const canvas =  document.querySelector("#canvas")
  canvas.width =  conf.image_width;
  canvas.height = conf.image_height;
  const ctx = canvas.getContext("2d");

  canvas.addEventListener('mousemove', e => {
    conf.mouse = {
      x: e.offsetX / canvas.getBoundingClientRect().width,
      y: e.offsetY / canvas.getBoundingClientRect().height
    }
  });

  canvas.addEventListener("click", e => {
    window.canvas_click = {
      x: e.offsetX / canvas.getBoundingClientRect().width,
      y: e.offsetY / canvas.getBoundingClientRect().height
    }
  });

  // Reset shader setup
  const pipelines = {
    reset: device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bind_group_layout]
      }),
      compute: {
        module: device.createShaderModule({
          code: compute_shader_reset.get(conf)
        }),
        entryPoint: "main"
      }
    }),
    move: device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bind_group_layout]
      }),
      compute: {
        module: device.createShaderModule({
          code: compute_shader_move.get(conf)
        }),
        entryPoint: "main"
      }
    })
  }

  // Setup
  {
    const shader_module_setup = device.createShaderModule({
      code: compute_shader_setup.get(conf)
    });
    const compute_pipeline_setup = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bind_group_layout]
      }),
      compute: {
        module: shader_module_setup,
        entryPoint: "main"
      }
    });
    const command_encoder = device.createCommandEncoder();
    command_encoder.copyBufferToBuffer(gpu_buffer_A, 0, gpu_buffer_B, 0, conf.buffer_size);
    const pass_encoder = command_encoder.beginComputePass();
    pass_encoder.setPipeline(compute_pipeline_setup);
    pass_encoder.setBindGroup(0, bind_group);
    pass_encoder.dispatch(dispatch_x, dispatch_y);
    pass_encoder.endPass();
    const gpuCommands = command_encoder.finish();
    device.queue.submit([gpuCommands]);
  }
  step(
    conf,
    device,
    gpu_buffer_A,
    gpu_buffer_B,
    gpu_buffer_C,
    gpu_buffer_D,
    gpu_buffer_image_storage,
    gpu_buffer_image_storage_previous,
    gpu_buffer_image_read,
    gpu_buffers,
    compute_pipeline,
    compute_pipeline_render,
    pipelines,
    bind_group,
    bind_group_render,
    dispatch_x,
    dispatch_y,
    dispatch_x_render,
    dispatch_y_render,
    ctx,
    end_callback,
  )
}


async function step(
  conf,
  device,
  gpu_buffer_A,
  gpu_buffer_B,
  gpu_buffer_C,
  gpu_buffer_D,
  gpu_buffer_image_storage,
  gpu_buffer_image_storage_previous,
  gpu_buffer_image_read,
  gpu_buffers,
  compute_pipeline,
  compute_pipeline_render,
  pipelines,
  bind_group,
  bind_group_render,
  dispatch_x,
  dispatch_y,
  dispatch_x_render,
  dispatch_y_render,
  ctx,
  end_callback,
  step_ = 0,
) {
  await compute(
    conf,
    device,
    gpu_buffer_A,
    gpu_buffer_B,
    gpu_buffer_C,
    gpu_buffer_D,
    gpu_buffer_image_storage,
    gpu_buffer_image_storage_previous,
    gpu_buffer_image_read,
    gpu_buffers,
    compute_pipeline,
    compute_pipeline_render,
    pipelines,
    bind_group,
    bind_group_render,
    dispatch_x,
    dispatch_y,
    dispatch_x_render,
    dispatch_y_render,
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
        if (Math.abs(p[k] - test.kv[k]) > 0.000002 ) {
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
        gpu_buffer_image_storage_previous,
        gpu_buffer_image_read,
        gpu_buffers,
        compute_pipeline,
        compute_pipeline_render,
        pipelines,
        bind_group,
        bind_group_render,
        dispatch_x,
        dispatch_y,
        dispatch_x_render,
        dispatch_y_render,
        ctx,
        end_callback,
        step_,
      )
    }, conf.wait);
  } else {
    end_callback()
  }
}

let user_input = true;

const STEP_COMPUTE = 4;


async function compute(
  conf,
  device,
  gpu_buffer_A,
  gpu_buffer_B,
  gpu_buffer_C,
  gpu_buffer_D,
  gpu_buffer_image_storage,
  gpu_buffer_image_storage_previous,
  gpu_buffer_image_read,
  gpu_buffers,
  compute_pipeline,
  compute_pipeline_render,
  pipelines,
  bind_group,
  bind_group_render,
  dispatch_x,
  dispatch_y,
  dispatch_x_render,
  dispatch_y_render,
  ctx,
  step_
) {
  const start = performance.now();
  if(window.canvas_click) {
    const command_encoder = device.createCommandEncoder();
    command_encoder.copyBufferToBuffer(gpu_buffer_C, 0, gpu_buffer_D, 0 , conf.buffer_size);
    device.queue.submit([command_encoder.finish()]);
    let gpu_buffer_A_map =  gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
    let gpu_buffer_D_map =  gpu_buffer_D.mapAsync(GPUMapMode.READ);
    await gpu_buffer_A_map;
    await gpu_buffer_D_map;

    let view = new DataView(gpu_buffer_D.getMappedRange())
    let p = {
      x: (window.canvas_click.x/conf.zoom - 0.5 / conf.zoom + conf.center.x + 1.0 )%1.0,
      y: (window.canvas_click.y/conf.zoom - 0.5 / conf.zoom + conf.center.y + 1.0 )%1.0,
    }
    particle.set(view, null, p.x, p.y, 0.0, 0.0, conf.METAL, conf, null)

    new Uint8Array(gpu_buffer_A.getMappedRange()).set( new Uint8Array( view.buffer ) );
    gpu_buffer_A.unmap();
    gpu_buffer_D.unmap();
  }


{
  const command_encoder = device.createCommandEncoder();
  if(window.canvas_click || user_input) {
    command_encoder.copyBufferToBuffer(gpu_buffer_A, 0, gpu_buffer_B, 0, conf.buffer_size);
    window.canvas_click = null
    user_input = false
  } else {
    command_encoder.copyBufferToBuffer(gpu_buffer_C, 0, gpu_buffer_B, 0, conf.buffer_size);
  }
  const gpuCommands = command_encoder.finish();
  device.queue.submit([gpuCommands]);
}


// reset
{
  const command_encoder = device.createCommandEncoder();
  if (step_ % STEP_COMPUTE == 1 || step_ == 0 || STEP_COMPUTE == 1) {
    command_encoder.copyBufferToBuffer(gpu_buffers.uniforms_write, 0, gpu_buffers.uniforms_in, 0, conf.uniforms_attributs_count*4 );
  } else {
    command_encoder.copyBufferToBuffer(gpu_buffers.uniforms_out, 0, gpu_buffers.uniforms_in, 0, conf.uniforms_attributs_count*4 );
  }
  const pass_encoder_reset = command_encoder.beginComputePass();
  pass_encoder_reset.setPipeline(pipelines.reset);
  pass_encoder_reset.setBindGroup(0, bind_group);
  pass_encoder_reset.dispatch(dispatch_x, dispatch_y);
  pass_encoder_reset.endPass();
  const gpuCommands_reset = command_encoder.finish();
  device.queue.submit([gpuCommands_reset]);
}


// compute move
{
  const command_encoder = device.createCommandEncoder();
  command_encoder.copyBufferToBuffer(gpu_buffers.uniforms_out, 0, gpu_buffers.uniforms_in, 0, conf.uniforms_attributs_count*4 );
  const pass_encoder = command_encoder.beginComputePass();
  pass_encoder.setPipeline(pipelines.move);
  pass_encoder.setBindGroup(0, bind_group);
  pass_encoder.dispatch(dispatch_x, dispatch_y);
  pass_encoder.endPass();
  command_encoder.copyBufferToBuffer(gpu_buffer_C, 0, gpu_buffer_B, 0, conf.buffer_size);
  command_encoder.copyBufferToBuffer(gpu_buffers.uniforms_out, 0, gpu_buffers.uniforms_in, 0, conf.uniforms_attributs_count*4 );
  const gpuCommands = command_encoder.finish();
  device.queue.submit([gpuCommands]);
}


// reset
{
  const command_encoder = device.createCommandEncoder();
  command_encoder.copyBufferToBuffer(gpu_buffers.uniforms_out, 0, gpu_buffers.uniforms_in, 0, conf.uniforms_attributs_count*4 );
  const pass_encoder_reset = command_encoder.beginComputePass();
  pass_encoder_reset.setPipeline(pipelines.reset);
  pass_encoder_reset.setBindGroup(0, bind_group);
  pass_encoder_reset.dispatch(dispatch_x, dispatch_y);
  pass_encoder_reset.endPass();
  const gpuCommands_reset = command_encoder.finish();
  device.queue.submit([gpuCommands_reset]);
}


// compute
{
  const command_encoder_3 = device.createCommandEncoder();
  command_encoder_3.copyBufferToBuffer(gpu_buffers.uniforms_out, 0, gpu_buffers.uniforms_in, 0, conf.uniforms_attributs_count*4 );
  const pass_encoder = command_encoder_3.beginComputePass();
  pass_encoder.setPipeline(compute_pipeline);
  pass_encoder.setBindGroup(0, bind_group);
  pass_encoder.dispatch(dispatch_x, dispatch_y);
  pass_encoder.endPass();
  // command_encoder_3.copyBufferToBuffer(gpu_buffer_C, 0, gpu_buffer_D, 0 , conf.buffer_size);

  const gpuCommands = command_encoder_3.finish();
  device.queue.submit([gpuCommands]);
}


// render
{
  const command_encoder_2 = device.createCommandEncoder();
  command_encoder_2.copyBufferToBuffer(gpu_buffers.uniforms_out, 0, gpu_buffers.uniforms_read, 0, conf.uniforms_attributs_count*4 );
  command_encoder_2.copyBufferToBuffer(gpu_buffers.uniforms_out, 0, gpu_buffers.uniforms_in, 0, conf.uniforms_attributs_count*4 );


  command_encoder_2.copyBufferToBuffer(gpu_buffer_image_storage, 0, gpu_buffer_image_storage_previous, 0 , buffer_image_size_image(conf));
  const pass_encoder_2 = command_encoder_2.beginComputePass();
  pass_encoder_2.setPipeline(compute_pipeline_render);
  pass_encoder_2.setBindGroup(0, bind_group_render);
  pass_encoder_2.dispatch(dispatch_x_render, dispatch_y_render);
  pass_encoder_2.endPass();
  command_encoder_2.copyBufferToBuffer(gpu_buffer_image_storage, 0, gpu_buffer_image_read, 0 , buffer_image_size_image(conf));
  const gpuCommands_2 = command_encoder_2.finish();
  device.queue.submit([gpuCommands_2]);
}


  compute_timer(performance.now() - start)

  if (step_ % STEP_COMPUTE == 0) {
    const start_render = performance.now();
    let gpu_buffer_image_read_map = gpu_buffer_image_read.mapAsync(GPUMapMode.READ);
    let gpu_buffers_uniforms_write_map =  gpu_buffers.uniforms_write.mapAsync(GPUMapMode.WRITE);
    let gpu_buffers_uniforms_read_map =  gpu_buffers.uniforms_read.mapAsync(GPUMapMode.READ);
    await gpu_buffer_image_read_map;
    await gpu_buffers_uniforms_write_map;
    await gpu_buffers_uniforms_read_map;
    ctx.putImageData(
      new ImageData(
        Uint8ClampedArray.from(new Uint32Array(gpu_buffer_image_read.getMappedRange())),
        conf.image_width
      ),
      0, 0
    );
    let view = new DataView(gpu_buffers.uniforms_write.getMappedRange())
    let view_2 = new DataView(gpu_buffers.uniforms_read.getMappedRange())
    new Uint8Array(view.buffer).set( new Uint8Array( view_2.buffer ) );

    // let buffer = new DataView(gpu_buffers.uniforms_write.getMappedRange())

    // let focus_id = view_2.getUint32((7+27)*4, conf.littleEndian)
    // let focus_cell_id = focus_id * conf.grid_attributs_count * 4;
    // focus_cell_id = 0;
    // console.log(particle.get(view_2, focus_cell_id, conf))


    view.setFloat32(0 *4, conf.mouse.x, conf.littleEndian);
    view.setFloat32(1 *4, conf.mouse.y, conf.littleEndian);
    view.setUint32(2  *4,   step_, conf.littleEndian);
    view.setFloat32(3 *4,  performance.now(), conf.littleEndian);
    // view.setFloat32(4 *4,  conf.center.x, conf.littleEndian);
    // view.setFloat32(5 *4, conf.center.y, conf.littleEndian);
    view.setFloat32(6 *4, conf.zoom, conf.littleEndian);

    //console.log(keys)
    if (keys[64+1]) {
      view.setFloat32( (7+1)*4 , 1.0, conf.littleEndian);
    } else {
      view.setFloat32( (7+1)*4 , 0.0, conf.littleEndian);
    }
    if (keys[64+9]) {
      view.setFloat32( (7+9)*4 , 1.0, conf.littleEndian);
    } else {
      view.setFloat32( (7+9)*4 , 0.0, conf.littleEndian);
    }
    if (keys[64+15]) {
      view.setFloat32( (7+15)*4 , 1.0, conf.littleEndian);
    } else {
      view.setFloat32( (7+15)*4 , 0.0, conf.littleEndian);
    }
    if (keys[90]) {
      view.setFloat32( (7+26)*4 , 1.0, conf.littleEndian);
    } else {
      view.setFloat32( (7+26)*4 , 0.0, conf.littleEndian);
    }

    // if (step_ == 0) {
    //   view.setUint32((7+27)*4, 1, conf.littleEndian);
    // }

    //console.log(view_2.getUint32((7+27)*4, conf.littleEndian))


    gpu_buffer_image_read.unmap();
    gpu_buffers.uniforms_write.unmap();
    gpu_buffers.uniforms_read.unmap();
    render_timer(performance.now() - start_render);
  }
  user_input = false;
}




main()
