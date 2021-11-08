function config(c) {
  let c_ = {
    id: 'c_editor',
    image_width: 1024,
    image_height: 1024,
    grid_width: 1024/16/2,
    grid_height: 1024/16/2,
    workgroup_size: 8,
    grid_attributs_count: 1,
    particle_attributs_count: 8,
    consts_count: 2,
    wait: 0,
    zoom: 1.0,
    size: 1,
    littleEndian: true,
    steps: "unlimited",
    air_resistance: 0.0,
    particles: [],
    tests: {},
    center: {
      x:0.0,
      y:0.0,
    }
  }
  c_.max_speed = 1.0 / c_.grid_width;
  return c_
}
export {
  config
}
