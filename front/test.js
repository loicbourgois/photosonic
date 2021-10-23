const conf = {
  width: 4,
  height: 4,
  workgroup_size: 1,
}
async function start() {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    return;
  }
  let size = 16;
  let map = new Uint32Array(size);
  for (let i = 0 ; i <size ; i++)
  {
      map[i] = 2
  }

  const device = await adapter.requestDevice();
  const gpu_buffer_A = device.createBuffer({
    size: size*4,
    usage:   GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_B = device.createBuffer({
    size: size*4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const gpu_buffer_C = device.createBuffer({
    size: size*4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const gpu_buffer_D = device.createBuffer({
    size: size*4,
    usage:   GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
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
      }
    ]
  });


  const shader_module = device.createShaderModule({
    code: SHADER
  });

  const computePipeline = device.createComputePipeline({
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

  for (let i = 0 ; i <4 ; i++) {
    const command_encoder = device.createCommandEncoder();
    command_encoder.copyBufferToBuffer(gpu_buffer_A, 0, gpu_buffer_B, 0, size*4);
    const pass_encoder = command_encoder.beginComputePass();
    pass_encoder.setPipeline(computePipeline);
    pass_encoder.setBindGroup(0, bind_group);
    pass_encoder.dispatch(dispatch_x, dispatch_y);
    pass_encoder.endPass();
    command_encoder.copyBufferToBuffer(gpu_buffer_C, 0, gpu_buffer_D, 0 , size*4);
    const gpuCommands = command_encoder.finish();
    device.queue.submit([gpuCommands]);
    await gpu_buffer_D.mapAsync(GPUMapMode.READ);
    await gpu_buffer_A.mapAsync(GPUMapMode.WRITE);
    const map = new Uint32Array(gpu_buffer_D.getMappedRange())
    console.log(map)
    map[0] = 2
    new Uint32Array(gpu_buffer_A.getMappedRange()).set(map);
    gpu_buffer_A.unmap()
    gpu_buffer_D.unmap();
  }

}
const SHADER = `
  [[block]] struct Matrix {
    numbers: array<u32>;
  };
  [[group(0), binding(0)]] var<storage, write> in : Matrix;
  [[group(0), binding(1)]] var<storage, write> out : Matrix;
  [[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
  fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    let cell_id = global_id.x + global_id.y * ${conf.width}u;
    let cell_id_left = (global_id.x - 1u + ${conf.width}u)%${conf.width}u + global_id.y * ${conf.width}u;
    let cell_id_right = (global_id.x + 1u )%${conf.width}u + global_id.y * ${conf.width}u;
    let cell_id_down = (global_id.x) + ((global_id.y+1u)%${conf.height}u) * ${conf.width}u;
    let cell_id_up = (global_id.x) + ((global_id.y + ${conf.height}u - 1u)%${conf.height}u) * ${conf.width}u;
    let cell = in.numbers[cell_id];
    let right = in.numbers[cell_id_right];
    let left = in.numbers[cell_id_left];
    let down = in.numbers[cell_id_down];
    let up = in.numbers[cell_id_up];
    var cell_out = (cell+1u)%10u;
    out.numbers[cell_id] = cell_out;
  }
`
start()
