function shader (conf) {return `
struct Particle {
  active: u32;
  kind: u32;
  x: f32;
  y: f32;
  x_old: f32;
  y_old: f32;
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


fn set_particle(
  particle_id: u32,
  x: f32,
  y: f32,
  kind: u32,
  input: Data,
  output: Data
) {
  let old_cell_id = input.particles[particle_id].cell_id;
  let cell_id = u32(x*f32(${conf.grid_width}) + y * f32(${conf.grid_height * conf.grid_width}));
  let old_particle_id = input.cells[cell_id].particle_id;
  if (old_cell_id != 0u && old_cell_id != cell_id) {
    // output.cells[old_cell_id].particle_id = 0u;
  }
  if (old_particle_id != 0u && old_particle_id != particle_id) {
    // output.particles[old_particle_id].cell_id = 0u;
  }

  // output.particles[particle_id].kind = kind;
  // output.particles[particle_id].x = x;
  // output.particles[particle_id].y = y;
  // output.particles[particle_id].cell_id = cell_id;
  // output.cells[cell_id].particle_id = particle_id;

}


fn fn_cell_id(gidx: u32, gidy: u32) -> u32 {
  return gidx / ${Math.floor(conf.image_width/conf.grid_width)}u
    + gidy / ${Math.floor(conf.image_height/conf.grid_height)}u * ${conf.grid_width}u;
}



fn color_delta(particle_center: vec2<f32>, pixel: vec2<f32>) -> f32 {
  var d = 1.0 - distance( pixel, particle_center )*${conf.grid_width}.0;
  //return sin(d*2.0);
  return d*500.0;
}


[[group(0), binding(0)]] var<storage, read>   input  : Data;
[[group(0), binding(1)]] var<storage, write>  output : Data;
[[group(0), binding(2)]] var<storage, write>  img : Image;
[[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {
  let DIAMETER: f32 = ${2.0 / conf.grid_width};

  let cell_id = fn_cell_id(gid.x, gid.y);
  let pix_id  = gid.x + gid.y * ${conf.image_width}u;

  // let r1 = random_frac_3(fract(data.time), f32(gid.x), f32(gid.y));
  // let r2 = random_frac_3(r1, f32(gid.x), f32(gid.y));
  // let r3 = random_frac_3(r2, f32(gid.x), f32(gid.y));
  // let r4 = random_frac_3(r3, f32(gid.x), f32(gid.y));
  // let r5 = random_frac_3(r4, f32(gid.x), f32(gid.y));


  // Coloring


  img.pix[pix_id].r = 0u;
  img.pix[pix_id].g = 0u;
  img.pix[pix_id].b = 0u;
  img.pix[pix_id].a = 0u;


  var coloring_cell_ids: array<u32, 9>;
  coloring_cell_ids[0] = up(left(cell_id));
  coloring_cell_ids[1] = up(cell_id);
  coloring_cell_ids[2] = right(up(cell_id));
  coloring_cell_ids[3] = left(cell_id);
  coloring_cell_ids[4] = cell_id;
  coloring_cell_ids[5] = right(cell_id);
  coloring_cell_ids[6] = left(down(cell_id));
  coloring_cell_ids[7] = down(cell_id);
  coloring_cell_ids[8] = right(down(cell_id));

  let pixel = vec2<f32>(f32(gid.x)/f32(${conf.image_width}), f32(gid.y)/f32(${conf.image_height}));

  var d_max = 0.0;
  var color_kind = 0u;
  var color_particle_id = 0u;
  for (var i = 0 ; i < 9 ; i=i+1) {
    let particle = input.particles[input.cells[ coloring_cell_ids[i] ].particle_id];
    let d = color_delta(vec2<f32>(particle.x, particle.y), pixel);
    if (d > d_max) {
      d_max = d;
      color_kind = particle.kind;
      color_particle_id = input.cells[ coloring_cell_ids[i] ].particle_id;
    }
  }


  if (color_kind == ${conf.FIRE}u ) {
    img.pix[pix_id].r = 255u;
    img.pix[pix_id].g = u32(input.particles[color_particle_id].x * 255.0);
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = u32(255.0 * d_max );
  } elseif (color_kind == ${conf.WATER}u ) {
    img.pix[pix_id].r = 10u;
    img.pix[pix_id].g = 100u;
    img.pix[pix_id].b = 255u;
    img.pix[pix_id].a = u32(255.0 * d_max );
  }



  if (gid.x < 10u && gid.y < 10u ) {
    img.pix[pix_id].r = (input.step * 4u ) % 255u;
    img.pix[pix_id].g = 0u;
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = 255u;
  } elseif (10u < gid.x && gid.x < 20u && gid.y < 10u) {
    img.pix[pix_id].r = 0u;
    img.pix[pix_id].g = 255u - u32((input.time/1000.0*255.0)%255.0);
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = 255u;
  }


  // Compute


  // Colision

  var neighboor_cell_id: array<u32, 24>;
  neighboor_cell_id[0] = up(up(left(left(cell_id))));
  neighboor_cell_id[1] = up(up(left(cell_id)));
  neighboor_cell_id[2] = up(up(cell_id));
  neighboor_cell_id[3] = up(up(right(cell_id)));
  neighboor_cell_id[4] = up(up(right(right(cell_id))));

  neighboor_cell_id[5] = up(left(left(cell_id)));
  neighboor_cell_id[6] = up(left(cell_id));
  neighboor_cell_id[7] = up(cell_id);
  neighboor_cell_id[8] = up(right(cell_id));
  neighboor_cell_id[9] = up(right(right(cell_id)));

  neighboor_cell_id[10] = left(left(cell_id));
  neighboor_cell_id[11] = left(cell_id);
  neighboor_cell_id[12] = right(cell_id);
  neighboor_cell_id[13] = right(right(cell_id));

  neighboor_cell_id[14] = down(left(left(cell_id)));
  neighboor_cell_id[15] = down(left(cell_id));
  neighboor_cell_id[16] = down(cell_id);
  neighboor_cell_id[17] = down(right(cell_id));
  neighboor_cell_id[18] = down(right(right(cell_id)));

  neighboor_cell_id[19] = down(down(left(left(cell_id))));
  neighboor_cell_id[20] = down(down(left(cell_id)));
  neighboor_cell_id[21] = down(down(cell_id));
  neighboor_cell_id[22] = down(down(right(cell_id)));
  neighboor_cell_id[23] = down(down(right(right(cell_id))));




  var collisions = 0;

  var dx_collision = 0.0;
  var dy_collision = 0.0;

  let p1_id = input.cells[ cell_id ].particle_id;
  let p1 = input.particles[p1_id];
  let velocity1 = vec2<f32>(p1.x, p1.y) - vec2<f32>(p1.x_old, p1.y_old);
  for (var i = 0 ; i < 24 ; i=i+1) {
    let p2_id = input.cells[ neighboor_cell_id[i] ].particle_id;
    if (p2_id != 0u) {
      let p2 = input.particles[p2_id];
      let d = distance(vec2<f32>(p1.x, p1.y), vec2<f32>(p2.x, p2.y));
      if (d < DIAMETER) {
        collisions = collisions + 1;
        // https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
        let velocity2 = vec2<f32>(p2.x, p2.y) - vec2<f32>(p2.x_old, p2.y_old);
        let delta_velocity = velocity1 - velocity2;
        let mass_1 = 1.0;
        let mass_2 = 1.0;
        let delta_position = vec2<f32>(p1.x, p1.y) - vec2<f32>(p2.x, p2.y);
        let mass_factor = 2.0 * mass_2 / (mass_1 + mass_2);
        let dot_vp = dot(delta_velocity, delta_position);
        let distance_ = distance(vec2<f32>(0.0, 0.0), delta_position);
        let distance_squared = distance_ * distance_;
        let acceleration = delta_position * mass_factor * dot_vp / distance_squared;
        dx_collision = dx_collision - acceleration.x;
        dy_collision = dy_collision - acceleration.y;

      }
    }
  }

  let particle_id = input.cells[cell_id].particle_id;

  if (particle_id == 0u) {
    // img.pix[pix_id].r = 0u;
    // img.pix[pix_id].g = 255u;
    // img.pix[pix_id].b = 0u;
    // img.pix[pix_id].a = 255u;
  } elseif (collisions == 0 && particle_id != 0u) {
    // img.pix[pix_id].r = 0u;
    // img.pix[pix_id].g = 255u;
    // img.pix[pix_id].b = 0u;
    // img.pix[pix_id].a = 255u;
  } elseif (collisions == 1) {
    img.pix[pix_id].r = 255u;
    img.pix[pix_id].g = 255u;
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = 255u;
  } elseif (collisions == 2) {
    img.pix[pix_id].r = 255u;
    img.pix[pix_id].g = 155u;
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = 255u;
  } else {
    img.pix[pix_id].r = 255u;
    img.pix[pix_id].g = 0u;
    img.pix[pix_id].b = 0u;
    img.pix[pix_id].a = 255u;
  }


  let old_cell_id = input.particles[particle_id].cell_id;

  var x_old = input.particles[particle_id].x;
  var y_old = input.particles[particle_id].y;

  let air_resistance_x = (input.particles[particle_id].x - input.particles[particle_id].x_old) * ${conf.air_resistance};
  let air_resistance_y = (input.particles[particle_id].y - input.particles[particle_id].y_old) * ${conf.air_resistance};

  var dx = input.particles[particle_id].x - input.particles[particle_id].x_old + dx_collision - air_resistance_x;
  var dy = input.particles[particle_id].y - input.particles[particle_id].y_old + dy_collision - air_resistance_y;


  dx = clamp(dx, -${conf.max_speed}, ${conf.max_speed});
  dy = clamp(dy, -${conf.max_speed}, ${conf.max_speed});


  let x = (x_old + dx) % 1.0;
  let y = (y_old + dy) % 1.0;

  x_old = (x_old + dx) % 1.0 - dx;
  y_old = (y_old + dy) % 1.0 - dy;

  let cell_id_new = u32(x * f32(${conf.image_width})) / ${Math.floor(conf.image_width/conf.grid_width)}u
    + u32(y * f32(${conf.image_height})) / ${Math.floor(conf.image_height/conf.grid_height)}u * ${conf.grid_width}u;
  let old_particle_id = input.cells[cell_id_new].particle_id;
  if (old_cell_id != 0u && old_cell_id != cell_id_new) {
    output.cells[old_cell_id].particle_id = 0u;
  }
  if (old_particle_id != 0u && old_particle_id != particle_id) {
    output.particles[old_particle_id].cell_id = 0u;
  }
  output.particles[particle_id].kind = input.particles[particle_id].kind;
  output.particles[particle_id].x = x;
  output.particles[particle_id].y = y;
  output.particles[particle_id].x_old = x_old;
  output.particles[particle_id].y_old = y_old;
  output.particles[particle_id].cell_id = cell_id_new;
  output.cells[cell_id_new].particle_id = particle_id;
}
`}
export {
  shader
}
