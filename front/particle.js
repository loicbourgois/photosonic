
function buffer_position_particle_active(id, conf) {
  return (conf.consts_count + id * conf.particle_attributs_count + 0) * 4
}
function buffer_position_particle_kind(id, conf) {
  return (conf.consts_count + id * conf.particle_attributs_count + 1) * 4
}
function buffer_position_particle_x(id, conf) {
  return (conf.consts_count + id * conf.particle_attributs_count + 2) * 4
}
function buffer_position_particle_y(id, conf) {
  return (conf.consts_count + id * conf.particle_attributs_count + 3) * 4
}
function buffer_position_particle_cell_id(id, conf) {
  return (conf.consts_count + id * conf.particle_attributs_count + 6) * 4
}
function buffer_position_cell_particle_id(x, y, conf) {
  return (
    conf.consts_count
    + conf.particle_max_count * conf.particle_attributs_count
    + (x + y*conf.grid_width) * conf.grid_attributs_count
    + 0
  ) * 4
}


function set_particle_kind(data, particle_id, kind, conf) {
  data.setUint32(buffer_position_particle_kind(particle_id, conf), kind, conf.littleEndian)
}
function get_particle_kind(data, particle_id, conf) {
  return data.getUint32(buffer_position_particle_kind(particle_id, conf), conf.littleEndian)
}
function set_particle_x(data, particle_id, value, conf) {
  data.setFloat32(buffer_position_particle_x(particle_id, conf), value, conf.littleEndian)
}
function get_particle_x(data, particle_id, conf) {
  return data.getFloat32(buffer_position_particle_x(particle_id, conf), conf.littleEndian)
}


function set_particle_y(buffer, particle_id, value, conf) {
  buffer.setFloat32(buffer_position_particle_y(particle_id, conf), value, conf.littleEndian)
}
function get_particle_y(buffer, particle_id, conf) {
  return buffer.getFloat32(buffer_position_particle_y(particle_id, conf), conf.littleEndian)
}
function set_particle_cell_id(buffer, particle_id, value, conf) {
  buffer.setUint32(buffer_position_particle_cell_id(particle_id, conf), value, conf.littleEndian)
}
function get_particle_cell_id(buffer, particle_id, conf) {
  return buffer.getUint32(buffer_position_particle_cell_id(particle_id, conf), conf.littleEndian)
}



function buffer_position_particle_x_old(id, conf) {
  return (conf.consts_count + id * conf.particle_attributs_count + 4) * 4
}
function set_particle_x_old(data, particle_id, value, conf) {
  data.setFloat32(buffer_position_particle_x_old(particle_id, conf), value, conf.littleEndian)
}
function get_particle_x_old(data, particle_id, conf) {
  return data.getFloat32(buffer_position_particle_x_old(particle_id, conf), conf.littleEndian)
}



function buffer_position_particle_y_old(id, conf) {
  return (conf.consts_count + id * conf.particle_attributs_count + 5) * 4
}
function set_particle_y_old(data, particle_id, value, conf) {
  data.setFloat32(buffer_position_particle_y_old(particle_id, conf), value, conf.littleEndian)
}
function get_particle_y_old(data, particle_id, conf) {
  return data.getFloat32(buffer_position_particle_y_old(particle_id, conf), conf.littleEndian)
}



function set_cell_particle_id(data, cell_id, particle_id, conf) {
  data.setUint32(cell_id, particle_id, conf.littleEndian)
}
function get_cell_particle_id(data, cell_id, conf) {
  return data.getUint32(cell_id, conf.littleEndian)
}
function get(buffer, particle_id, conf) {
  return {
    x: get_particle_x(buffer, particle_id, conf),
    y: get_particle_y(buffer, particle_id, conf),
    x_old: get_particle_x_old(buffer, particle_id, conf),
    y_old: get_particle_y_old(buffer, particle_id, conf),
  }
}
function set(buffer, particle_id, x, y, dx, dy, kind, conf) {
  const x_id = Math.floor(x*conf.grid_width);
  const y_id = Math.floor(y*conf.grid_height);
  const cell_id = Math.floor( (x_id + y_id*conf.grid_width) * conf.grid_attributs_count * 4 );

  if (!dx) {
    dx = 0.0;
  }
  if (!dy) {
    dy = 0.0;
  }

  buffer.setUint32(cell_id  + 0 * 4, 1, conf.littleEndian)
  buffer.setUint32(cell_id  + 1 * 4, kind, conf.littleEndian)
  buffer.setFloat32(cell_id + 2 * 4, x, conf.littleEndian)
  buffer.setFloat32(cell_id + 3 * 4, y, conf.littleEndian)
  buffer.setFloat32(cell_id + 4 * 4, x-dx, conf.littleEndian)
  buffer.setFloat32(cell_id + 5 * 4, y-dy, conf.littleEndian)


  // let old_cell_id = get_particle_cell_id(buffer, particle_id, conf)
  // let cell_id = buffer_position_cell_particle_id(
  //   Math.floor(x*(conf.grid_width-1)),
  //   Math.floor(y*(conf.grid_height-1)),
  //   conf
  // )
  // let old_particle_id = get_cell_particle_id(buffer, cell_id, conf)
  // if (old_cell_id != 999999999 && old_cell_id != cell_id) {
  //   set_cell_particle_id(buffer, old_cell_id, 999999999, conf)
  // }
  // if (old_particle_id != 999999999 && old_particle_id != particle_id) {
  //   set_particle_cell_id(buffer, old_particle_id, 999999999, conf)
  // }
  // set_particle_kind(buffer, particle_id, kind, conf)
  // set_particle_x(buffer, particle_id, x, conf)
  // set_particle_y(buffer, particle_id, y, conf)
  // set_particle_x_old(buffer, particle_id, x-dx, conf)
  // set_particle_y_old(buffer, particle_id, y-dy, conf)
  // set_particle_cell_id(buffer, particle_id, cell_id, conf)
  // set_cell_particle_id(buffer, cell_id, particle_id, conf)
}


export {
  set,
  get,
  set_particle_cell_id,
  set_cell_particle_id,
  buffer_position_cell_particle_id
}
