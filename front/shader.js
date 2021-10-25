function shader (conf) {return `
struct Particle {
  active: u32;
  kind: u32;
  x: f32;
  y: f32;
  cell_id: u32;
};
struct Cell {
  particle_id: u32;
};
[[block]] struct Data {
  step: u32;
  time: f32;
  particles: array<Particle, ${conf.particle_max_count}>;
  cells: array<Cell, ${conf.grid_size}>;
};
struct Pixel {
  r: u32;
  g: u32;
  b: u32;
  a: u32;
};
[[block]] struct Image {
  pix: array<Pixel, ${conf.image_size}>;
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


// fn point(id: u32) -> vec2<u32> {
//   return vec2<u32>(id % ${conf.width}u, id / ${conf.width}u);
// }


// fn right (cell_id: u32) -> u32 {
//   let x = cell_id % ${conf.width}u;
//   let y = cell_id / ${conf.width}u;
//   return (x+1u) % ${conf.width}u + y * ${conf.width}u;
// }
// fn left (cell_id: u32) -> u32 {
//   let x = cell_id % ${conf.width}u;
//   let y = cell_id / ${conf.width}u;
//   return (x + ${conf.width}u - 1u) % ${conf.width}u + y * ${conf.width}u;
// }
// fn up (cell_id: u32) -> u32 {
//   let x = cell_id % ${conf.width}u;
//   let y = cell_id / ${conf.width}u;
//   return x + ( (y + ${conf.width}u - 1u)%${conf.width}u ) * ${conf.width}u;
// }
// fn down (cell_id: u32) -> u32 {
//   let x = cell_id % ${conf.width}u;
//   let y = cell_id / ${conf.width}u;
//   return x + ( (y + 1u)%${conf.height}u ) * ${conf.width}u;
// }
// fn kind (id: u32) -> u32 {
//   return id;
// }


[[group(0), binding(0)]] var<storage, read>   input  : Data;
[[group(0), binding(1)]] var<storage, write>  output : Data;
[[group(0), binding(2)]] var<storage, write>  img : Image;
[[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {
  let cell_id = gid.x / ${Math.floor(conf.image_width/conf.grid_width)}u + gid.y / ${Math.floor(conf.image_height/conf.grid_height)}u * ${conf.grid_width}u;
  let pix_id  = gid.x + gid.y * ${conf.image_width}u;

  // let r1 = random_frac_3(fract(data.time), f32(gid.x), f32(gid.y));
  // let r2 = random_frac_3(r1, f32(gid.x), f32(gid.y));
  // let r3 = random_frac_3(r2, f32(gid.x), f32(gid.y));
  // let r4 = random_frac_3(r3, f32(gid.x), f32(gid.y));
  // let r5 = random_frac_3(r4, f32(gid.x), f32(gid.y));


  // Coloring


  if (input.particles[input.cells[cell_id].particle_id].kind == ${conf.FIRE}u ) {
    img.pix[pix_id].r = 255u;
    img.pix[pix_id].g = u32(input.particles[cell_id].y * 255.0);
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = 255u;
  }
  if (input.particles[input.cells[cell_id].particle_id].kind == ${conf.WATER}u ) {
    img.pix[pix_id].r = 10u;
    img.pix[pix_id].g = 100u;
    img.pix[pix_id].b = 255u;
    img.pix[pix_id].a = 255u;
  }
  if (gid.x < 10u && gid.y < 10u ) {
    img.pix[pix_id].r = 255u;
    img.pix[pix_id].g = 255u - u32((input.time/1000.0*255.0)%255.0);
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = 255u;
  }


  // Compute

  //  img.pix[pix_id].g = input.particles[input.cells[cell_id].particle_id].kind;
  // img.pix[pix_id].g = u32(input.particles[1].y*100.0);
  // img.pix[pix_id].a = 255u;


  // output.particles[1].kind = 255u;
  // output.particles[cell_id].kind = ${conf.FIRE}u;
  // output.particles[1].kind = input.particles[1].kind;
  // output.particles[0].kind = ${conf.WATER}u;
  // output.particles[0] = input.particles[cell_id];
  //output.particles[cell_id] = input.particles[cell_id];
  // if (input.cells[cell_id].particle_id != 0u) {
  //   output.particles[input.cells[cell_id].particle_id].kind = 255u;
  // }


  output.cells[cell_id] = input.cells[cell_id];
  output.particles[cell_id] = input.particles[cell_id];
  output.particles[cell_id].x = (input.particles[cell_id].x + 0.1) % 1.0;
  output.particles[cell_id].y = (input.particles[cell_id].y + 0.1) % 1.0;
}
`}
export {
  shader
}
