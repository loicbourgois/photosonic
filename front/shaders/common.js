function init (conf) {window.SHADER_COMMON = `// Common
struct Cell {
  active: u32;
  kind: u32;
  x: f32;
  y: f32;
  x_old: f32;
  y_old: f32;
  collisions: u32;
  bob: u32;
};
[[block]] struct Data {
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
[[block]] struct Uniforms {
    mouse: vec2<f32>;
    step: u32;
    time: f32;
    center: vec2<f32>;
    zoom: f32;
};


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
  let a2 =   fract(vec2<f32>(   (a.x + .25), (a.y + .25)  ));
  let b2 =   fract(vec2<f32>(   (b.x + .25), (b.y + .25)  ));
  let a3 =   fract(vec2<f32>(   (a.x + .5), (a.y + .5)  ));
  let b3 =   fract(vec2<f32>(   (b.x + .5), (b.y + .5)  ));
  return min( min ( distance(a,b), distance(a2,b2) ), distance(a3,b3));
}

fn delta_position_wrap_around(a:vec2<f32>, b:vec2<f32>) -> vec2<f32> {
  let a2 =   (vec2<f32>(   fract(a.x + .25), fract(a.y + .25)  ));
  let b2 =   (vec2<f32>(   fract(b.x + .25), fract(b.y + .25)  ));
  let a3 =   (vec2<f32>(   fract(a.x + .5), fract(a.y + .5)  ));
  let b3 =   (vec2<f32>(   fract(b.x + .5), fract(b.y + .5)  ));
  let d1 = distance(a,b);
  let d2 = distance(a2,b2);
  let d3 = distance(a3,b3);
  if (d1 < d2 ) {
    if (d1 < d3) {
      return a - b;
    } else {
     return a3 - b3;
    }
  }
  else{
    if (d2 < d3) {
      return a2 - b2;
    }
    // else {
    //   return a3 - b3;
    // }
  }
  return a3 - b3;
}

fn cell_id_fn(gid:vec3<u32>) -> u32 {
  return gid.x + gid.y * ${conf.grid_width}u;
}

`}
export {
  init
}
