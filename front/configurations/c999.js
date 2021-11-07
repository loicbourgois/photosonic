function config(c) {
  let c_ = {
    id: 'c999',
    image_width: 1024,
    image_height: 1024,
    grid_width: 1024,
    grid_height: 1024,
    workgroup_size: 8,
    grid_attributs_count: 1,
    particle_attributs_count: 8,
    consts_count: 2,
    wait: 0,
    zoom: 10.0,
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
  c_.max_speed = 1.5 / c_.grid_width;

  const a = c_.max_speed * 0.1;
  let particle_count = c_.grid_width * c_.grid_height / 4;
  console.log(particle_count, "particles")
  for (var i = 0; i < particle_count/10; i++) {
    for (let kind of [c.ELECTRIC, c.WATER, c.FIRE]) {
      c_.particles.push({
          x: Math.random(),
          y: Math.random(),
          dx: Math.random()*a-a/2,
          dy: Math.random()*a-a/2,
          kind: kind
      })
    }
  }
  return c_
}
export {
  config
}
