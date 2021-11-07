function get (conf) {return `
${SHADER_COMMON}

[[group(0), binding(0)]] var<storage, read>   input     : Data;
[[group(0), binding(1)]] var<storage, write>  output    : Data;
[[group(0), binding(2)]] var<storage, write>  uniforms  : Uniforms;
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


    let p1 = input.cells[cell_id];
    let velocity1 = vec2<f32>(p1.x, p1.y) - vec2<f32>(p1.x_old, p1.y_old);
    var colision_move = vec2<f32>(0.0, 0.0);

    var atraction_move = vec2<f32>(0.0, 0.0);
    let atraction_move_factor = 0.1;
    var attractions = 0u;

    for (var i = 0 ; i < 24 ; i=i+1) {
      let p2id = neighboor_cell_id[i];
      if (input.cells[p2id].active == 1u && p2id != cell_id) {
        let p2 = input.cells[p2id];
        let d = distance_wrap_around(vec2<f32>(p1.x, p1.y), vec2<f32>(p2.x, p2.y));
        let delta_position = delta_position_wrap_around (vec2<f32>(p1.x, p1.y), vec2<f32>(p2.x, p2.y) );



        if (d < DIAMETER) {
          colision_move = colision_move + normalize(delta_position) * (DIAMETER - d) * 1.0;
        }
        if (d < DIAMETER * 1.1 && p1.kind == p2.kind) {
          atraction_move = atraction_move + normalize(delta_position) * (DIAMETER - d) * 0.05;
          attractions = attractions + 1u;
        }
        if (d < DIAMETER ) {
          collisions = collisions + 1u;
          // https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
          let velocity2 = vec2<f32>(p2.x, p2.y) - vec2<f32>(p2.x_old, p2.y_old);
          let delta_velocity = velocity1 - velocity2;
          let mass_1 = 1.0;
          let mass_2 = 1.0;
          let mass_factor = 2.0 * mass_2 / (mass_1 + mass_2);
          let dot_vp = dot(delta_velocity, delta_position);
          let distance_ = distance(vec2<f32>(0.0, 0.0), delta_position);
          let distance_squared = distance_ * distance_;
          let acceleration = delta_position * mass_factor * dot_vp / distance_squared;

          if (p1.kind == p2.kind) {
            dx_collision = dx_collision - acceleration.x*0.5;
            dy_collision = dy_collision - acceleration.y*0.5;
          } else {
            dx_collision = dx_collision - acceleration.x*1.0;
            dy_collision = dy_collision - acceleration.y*1.0;
          }
        }

      }
    }

    if (collisions > 1u) {
      colision_move = colision_move / f32(collisions);
    }
    if (attractions > 1u) {
      atraction_move = atraction_move / f32(attractions);
    }


    var x_old = input.cells[cell_id].x;
    var y_old = input.cells[cell_id].y;

    let air_resistance = f32(${conf.air_resistance});
    let air_resistance_x = (p1.x - p1.x_old) * air_resistance;
    let air_resistance_y = (p1.y - p1.y_old) * air_resistance;
    //
    var dx = p1.x - p1.x_old + dx_collision - air_resistance_x;
    var dy = p1.y - p1.y_old + dy_collision - air_resistance_y;


    //
      let max_speed = f32(${conf.max_speed});
      dx = clamp(dx, -max_speed, max_speed);
      dy = clamp(dy, -max_speed, max_speed);
    //
    let x = fract(x_old + dx + 1.0 + colision_move.x * 0.5 + atraction_move.x);
    let y = fract(y_old + dy + 1.0 + colision_move.y * 0.5 + atraction_move.y);
    //
    x_old = fract(x_old + dx + 1.0 + colision_move.x * 0.5 + atraction_move.x*atraction_move_factor) - dx;
    y_old = fract(y_old + dy + 1.0 + colision_move.y * 0.5 + atraction_move.y*atraction_move_factor) - dy;
    //
    let cell_id_new = u32(x * f32(${conf.image_width})) / ${Math.floor(conf.image_width/conf.grid_width)}u
      + u32(y * f32(${conf.image_height})) / ${Math.floor(conf.image_height/conf.grid_height)}u * ${conf.grid_width}u;
    // let old_particle_id = input.cells[cell_id_new].particle_id;



    // output.cells[cell_id] = input.cells[cell_id];
    // output.cells[cell_id].collisions = collisions;
    // output.cells[cell_id].active = 0u;
    output.cells[cell_id_new].active = 1u;
    output.cells[cell_id_new].kind = input.cells[cell_id].kind;
    output.cells[cell_id_new].x = x;
    output.cells[cell_id_new].y = y;
    output.cells[cell_id_new].x_old = x_old;
    output.cells[cell_id_new].y_old = y_old;
    output.cells[cell_id_new].collisions = collisions;
  }
}
`}
export {
  get
}
