
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

function cell_id(x, y, conf) {
  x = (x + 1.0) % 1.0
  y = (y + 1.0) % 1.0
  const x_id = Math.floor(x*conf.grid_width);
  const y_id = Math.floor( (y*conf.grid_height)%conf.grid_height );
  return Math.floor ((x_id + y_id*conf.grid_width)  )
}

function set(buffer, particle_id, x, y, dx, dy, kind, conf, mapping) {
  x = (x + 1.0) % 1.0
  y = (y + 1.0) % 1.0
  const cell_id_ = cell_id(x, y, conf) * conf.grid_attributs_count * 4;

  // console.log(x_id, y_id, conf.grid_height)
  //
  // console.log(cell_id)

  if (!dx) {
    dx = 0.0;
  }
  if (!dy) {
    dy = 0.0;
  }
  mapping = {
      'a':1,
      'z':26,
      undefined: 0,
  }[mapping]
  if (!mapping) {
    mapping = 0;
  }

  buffer.setUint32(cell_id_  + 0 * 4, 1, conf.littleEndian)
  buffer.setUint32(cell_id_  + 1 * 4, kind, conf.littleEndian)
  buffer.setFloat32(cell_id_ + 2 * 4, x, conf.littleEndian)
  buffer.setFloat32(cell_id_ + 3 * 4, y, conf.littleEndian)
  buffer.setFloat32(cell_id_ + 4 * 4, x-dx, conf.littleEndian)
  buffer.setFloat32(cell_id_ + 5 * 4, y-dy, conf.littleEndian)
  buffer.setFloat32(cell_id_ + 6 * 4, 2, conf.littleEndian)
  buffer.setUint32(cell_id_ + 7 * 4, mapping, conf.littleEndian)
}


export {
  set,
  get,
  set_particle_cell_id,
  set_cell_particle_id,
  buffer_position_cell_particle_id,
  cell_id
}
