function get (conf) {return `
struct Particle {
  active: u32;
  kind: u32;
  x: f32;
  y: f32;
  x_old: f32;
  y_old: f32;
  cell_id: u32;
  collisions: u32;
};
struct Cell {
  particle_id: u32;
};
[[block]] struct Data {
  step: u32;
  time: f32;
  center: vec2<f32>;
  zoom: f32;
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


fn right (cell_id: u32) -> u32 {
  let x = cell_id % ${conf.grid_width}u;
  let y = cell_id / ${conf.grid_width}u;
  return (x+1u) % ${conf.grid_width}u + y * ${conf.grid_width}u;
}
fn left (cell_id: u32) -> u32 {
  let x = cell_id % ${conf.grid_width}u;
  let y = cell_id / ${conf.grid_width}u;
  return (x + ${conf.grid_width}u - 1u) % ${conf.grid_width}u + y * ${conf.grid_width}u;
}
fn up (cell_id: u32) -> u32 {
  let x = cell_id % ${conf.grid_width}u;
  let y = cell_id / ${conf.grid_width}u;
  return x + ( (y + ${conf.grid_width}u - 1u)%${conf.grid_width}u ) * ${conf.grid_width}u;
}
fn down (cell_id: u32) -> u32 {
  let x = cell_id % ${conf.grid_width}u;
  let y = cell_id / ${conf.grid_width}u;
  return x + ( (y + 1u)%${conf.grid_height}u ) * ${conf.grid_width}u;
}

fn distance_wrap_around(a:vec2<f32>, b:vec2<f32>) -> f32{
  if (distance(a,b) > 0.5) {
    let a2 =   fract(vec2<f32>(   (a.x + 0.25), (a.y + 0.25)  ));
    let b2 =   fract(vec2<f32>(   (b.x + 0.25), (b.y + 0.25)  ));
    return distance(a2,b2);
  }
  return distance(a,b);
}

fn delta_position_wrap_around(a:vec2<f32>, b:vec2<f32>) -> vec2<f32> {
  if (distance(a,b) > 0.5) {
    return vec2<f32>(   fract(a.x + 0.25), fract(a.y + 0.25)  ) - vec2<f32>(   fract(b.x + 0.25), fract(b.y + 0.25)  );
  }
  return a - b;
}


[[group(0), binding(0)]] var<storage, read>   input  : Data;
[[group(0), binding(1)]] var<storage, write>  output : Data;
[[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {
  let cell_id  = gid.x + gid.y * ${conf.grid_width}u;
  //output = input;
  output.cells[cell_id].particle_id = 999999999u;
}
`}
export {
  get
}
