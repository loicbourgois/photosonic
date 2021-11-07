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
  let a2 =   fract(vec2<f32>(   (a.x + .25), (a.y + .25)  ));
  let b2 =   fract(vec2<f32>(   (b.x + .25), (b.y + .25)  ));
  let a3 =   fract(vec2<f32>(   (a.x + .5), (a.y + .5)  ));
  let b3 =   fract(vec2<f32>(   (b.x + .5), (b.y + .5)  ));
  return min( min ( distance(a,b), distance(a2,b2) ), distance(a3,b3));
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
  let DIAMETER: f32 = ${2.0 / conf.grid_width};

  let cell_id  = gid.x + gid.y * ${conf.grid_width}u;

  // let r1 = random_frac_3(fract(data.time), f32(gid.x), f32(gid.y));
  // let r2 = random_frac_3(r1, f32(gid.x), f32(gid.y));
  // let r3 = random_frac_3(r2, f32(gid.x), f32(gid.y));
  // let r4 = random_frac_3(r3, f32(gid.x), f32(gid.y));
  // let r5 = random_frac_3(r4, f32(gid.x), f32(gid.y));


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

  var collisions = 0u;

  var dx_collision = 0.0;
  var dy_collision = 0.0;

  let p1_id = input.cells[ cell_id ].particle_id;
  let p1 = input.particles[p1_id];
  let velocity1 = vec2<f32>(p1.x, p1.y) - vec2<f32>(p1.x_old, p1.y_old);
  var colision_move = vec2<f32>(0.0, 0.0);
  for (var i = 0 ; i < 24 ; i=i+1) {
    let p2_id = input.cells[ neighboor_cell_id[i] ].particle_id;
    if (p2_id != 999999999u && p2_id != p1_id) {
      let p2 = input.particles[p2_id];
      let d = distance_wrap_around(vec2<f32>(p1.x, p1.y), vec2<f32>(p2.x, p2.y));
      if (d < DIAMETER) {
        collisions = collisions + 1u;
        // https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
        let velocity2 = vec2<f32>(p2.x, p2.y) - vec2<f32>(p2.x_old, p2.y_old);
        let delta_velocity = velocity1 - velocity2;
        let mass_1 = 1.0;
        let mass_2 = 1.0;
        let delta_position = delta_position_wrap_around (vec2<f32>(p1.x, p1.y), vec2<f32>(p2.x, p2.y) );

        // colision_move

        let mass_factor = 2.0 * mass_2 / (mass_1 + mass_2);
        let dot_vp = dot(delta_velocity, delta_position);
        let distance_ = distance(vec2<f32>(0.0, 0.0), delta_position);
        let distance_squared = distance_ * distance_;
        let acceleration = delta_position * mass_factor * dot_vp / distance_squared;
        dx_collision = dx_collision - acceleration.x*1.0;
        dy_collision = dy_collision - acceleration.y*1.0;

        colision_move = colision_move + normalize(delta_position) * (DIAMETER - d);
      }
    }
  }


  let particle_id: u32 = input.cells[cell_id].particle_id;

  let old_cell_id = input.particles[particle_id].cell_id;

  var x_old = input.particles[particle_id].x;
  var y_old = input.particles[particle_id].y;

  let air_resistance = f32(${conf.air_resistance});
  let air_resistance_x = (input.particles[particle_id].x - input.particles[particle_id].x_old) * air_resistance;
  let air_resistance_y = (input.particles[particle_id].y - input.particles[particle_id].y_old) * air_resistance;

  var dx = input.particles[particle_id].x - input.particles[particle_id].x_old + dx_collision - air_resistance_x;
  var dy = input.particles[particle_id].y - input.particles[particle_id].y_old + dy_collision - air_resistance_y;

  let max_speed = f32(${conf.max_speed});
  dx = clamp(dx, -max_speed, max_speed);
  dy = clamp(dy, -max_speed, max_speed);

  let x = fract(x_old + dx + 1.0 + colision_move.x * 0.5);
  let y = fract(y_old + dy + 1.0 + colision_move.y * 0.5);

  x_old = fract(x_old + dx + 1.0 + colision_move.x * 0.5) - dx;
  y_old = fract(y_old + dy + 1.0 + colision_move.y * 0.5) - dy;

  let cell_id_new = u32(x * f32(${conf.image_width})) / ${Math.floor(conf.image_width/conf.grid_width)}u
    + u32(y * f32(${conf.image_height})) / ${Math.floor(conf.image_height/conf.grid_height)}u * ${conf.grid_width}u;
  let old_particle_id = input.cells[cell_id_new].particle_id;




  if (particle_id != 999999999u) {
    if (old_cell_id != cell_id_new && old_cell_id != 999999999u) {
      output.cells[old_cell_id].particle_id = 999999999u;
    }
    if (old_particle_id != particle_id && old_particle_id != 999999999u) {
      output.particles[old_particle_id].cell_id = 999999999u;
    }
    output.particles[particle_id].x = x;
    output.particles[particle_id].y = y;
    output.particles[particle_id].kind = input.particles[particle_id].kind;
    output.particles[particle_id].x_old = x_old;
    output.particles[particle_id].y_old = y_old;
    output.particles[particle_id].cell_id = cell_id_new;
    output.particles[particle_id].collisions = collisions;
    output.cells[cell_id_new].particle_id = particle_id;
  }

  output.center = input.center;
  output.step = input.step;
  output.time = input.time;
  output.zoom = input.zoom;
}
`}
export {
  get
}
