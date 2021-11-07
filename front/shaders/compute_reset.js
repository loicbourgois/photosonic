function get (conf) {return `
${SHADER_COMMON}

[[group(0), binding(0)]] var<storage, read>   input     : Data;
[[group(0), binding(1)]] var<storage, write>  output    : Data;
[[group(0), binding(2)]] var<storage, write>  uniforms  : Uniforms;
[[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {
    let cell_id  = gid.x + gid.y * ${conf.grid_width}u;
    output.cells[cell_id].active = 0u;
}
`}
export {
  get
}
