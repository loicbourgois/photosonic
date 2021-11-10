async function get (conf) {
console.log((await import("../generated/particles0.js")).linkings())
  return `
${SHADER_COMMON}

${  (await import("../generated/particles0.js")).linkings()  }

let delta_time = ${1.0 / 60.0};

[[group(0), binding(0)]] var<storage, read>   input         : Data;
[[group(0), binding(1)]] var<storage, write>  output        : Data;
[[group(0), binding(2)]] var<storage, read>  uniforms       : Uniforms;
[[group(0), binding(3)]] var<storage, write>  uniforms_out  : Uniforms;
[[stage(compute), workgroup_size(${conf.workgroup_size}, ${conf.workgroup_size})]]
fn main([[builtin(global_invocation_id)]] gid : vec3<u32>) {
  let cell_id = cell_id_fn(gid);
  if (input.cells[cell_id].active == 1u) {
    let DIAMETER: f32 = ${2.0 / conf.grid_width};
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


    var forces  = vec2<f32>(0.0, 0.0);
    var moves   = vec2<f32>(0.0, 0.0);


    let p1 = input.cells[cell_id];
    let velocity1 = vec2<f32>(p1.x, p1.y) - vec2<f32>(p1.x_old, p1.y_old);
    var colision_move = vec2<f32>(0.0, 0.0);

    var atraction_move = vec2<f32>(0.0, 0.0);
    let atraction_move_factor = 1.0;
    var attractions = 0u;

    var linked_neighbours_delta = vec2<f32>(0.0, 0.0);
    let mass_1 = 1.0;

    for (var i = 0 ; i < 24 ; i=i+1) {
      let p2id = neighboor_cell_id[i];
      if (input.cells[p2id].active == 1u && p2id != cell_id) {
        let p2 = input.cells[p2id];
        let d = distance_wrap_around(vec2<f32>(p1.x, p1.y), vec2<f32>(p2.x, p2.y)) ;
        let delta_position = delta_position_wrap_around (vec2<f32>(p1.x, p1.y), vec2<f32>(p2.x, p2.y) );
        if (d < DIAMETER * 1.2 && linking[p1.kind][p2.kind] > 0.0001 ) {
          linked_neighbours_delta = linked_neighbours_delta + delta_position;
        }

        if (d < DIAMETER * 1.2 ) {
          attractions = attractions + 1u;
          //moves = moves + normalize(delta_position) * (DIAMETER - d) * linking[p1.kind][p2.kind];
          forces = forces +  normalize(delta_position) *  (DIAMETER - d) * linking[p1.kind][p2.kind] * 100.0;
        }
        if (d < DIAMETER ) {
          // https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
          let velocity2 = vec2<f32>(p2.x-p2.x_old, p2.y-p2.y_old);
          let delta_velocity = velocity1 - velocity2;
          let mass_2 = 1.0;
          let mass_factor = 2.0 * mass_2 / (mass_1 + mass_2);
          let dot_vp = dot(delta_velocity, delta_position);
          let distance_ = distance(vec2<f32>(0.0, 0.0), delta_position);
          let distance_squared = distance_ * distance_;
          let acceleration = delta_position * mass_factor * dot_vp / distance_squared;
          if (linking[p1.kind][p2.kind] > 0.00001 ) {
            dx_collision = dx_collision - acceleration.x * 0.5;
            dy_collision = dy_collision - acceleration.y * 0.5;
          }
          else {
            dx_collision = dx_collision - acceleration.x*1.0;
            dy_collision = dy_collision - acceleration.y*1.0;
          }
        }
      }
    }


    var dx_turbo = 0.0;
    var dy_turbo = 0.0;
    var turbo = 20.0 * DIAMETER;


    if (attractions > 0u && p1.kind == ${conf.TURBO}u) {
       forces = forces - normalize(linked_neighbours_delta) *  turbo * uniforms.mappings[p1.mapping];
    }


    let acceleration = forces / mass_1;
    var speed = vec2<f32>(p1.x, p1.y) - vec2<f32>(p1.x_old, p1.y_old)
      + acceleration * delta_time * delta_time
      + vec2<f32>(dx_collision, dy_collision);

    let max_speed = f32(${conf.max_speed});
    speed.x = clamp(speed.x, -max_speed, max_speed);
    speed.y = clamp(speed.y, -max_speed, max_speed);

    let x_old_ = input.cells[cell_id].x + moves.x;
    let y_old_ = input.cells[cell_id].y + moves.y;
    let x = fract(x_old_ + speed.x);
    let y = fract(y_old_ + speed.y);
    let x_old = x - speed.x;
    let y_old = y - speed.y;

    let cell_id_new = u32(x * ${conf.grid_width}.0) + u32(y * ${conf.grid_width}.0 )  * ${conf.grid_width}u;

    output.cells[cell_id_new] = input.cells[cell_id];
    output.cells[cell_id_new].active = 1u;
    output.cells[cell_id_new].x = x;
    output.cells[cell_id_new].y = y;
    output.cells[cell_id_new].x_old = x_old;
    output.cells[cell_id_new].y_old = y_old;
    output.cells[cell_id_new].collisions = collisions;

    if (uniforms.focus == cell_id) {
      uniforms_out.focus = cell_id_new;
      let dp = delta_position_wrap_around(vec2<f32>(x,y), uniforms_out.center);
      uniforms_out.center = uniforms_out.center + dp*0.05;
    }

  }
}
`}
export {
  get
}
