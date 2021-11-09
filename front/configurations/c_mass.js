function config(c) {
  let c_ = {
    id: 'c_mass',
    image_width: 1024,
    image_height: 1024,
    grid_width: 1024,
    grid_height: 1024,
    workgroup_size: 8,
    grid_attributs_count: 1,
    particle_attributs_count: 8,
    consts_count: 2,
    wait: 0,
    zoom: 20.0,
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
  let a = 0.02
  for (var i = 0; i < 1000; i++) {
    for (let kind of [c.METAL]) {
      c_.particles.push({
          x: Math.random()*a-a/2,
          y: Math.random()*a-a/2,
          kind: kind
      })
    }
  }
  return c_
}
export {
  config
}
