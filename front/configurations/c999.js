const FIRE  = 1;
const WATER = 2;

function config() {
  let c_ = {
    id: 'c999',
    image_width: 1024,
    image_height: 1024,
    grid_width: 512,
    grid_height: 512,
    workgroup_size: 8,
    grid_attributs_count: 1,
    particle_attributs_count: 7,
    consts_count: 2,
    FIRE: FIRE,
    WATER: WATER,
    wait: 0,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: "unlimited",
    air_resistance: 0.0001,
    particles: [],
    tests: {}
  }
  c_.max_speed = 0.25 / c_.grid_width;
  const a = 0.001;
  console.log(c_.grid_width * c_.grid_height / 4)
  for (var i = 0; i < 65000; i++) {
    c_.particles.push({
        x: Math.random(),
        y: Math.random(),
        dx: Math.random()*a-a/2,
        dy: Math.random()*a-a/2,
        kind: WATER,
    })
  }
  return c_
}
export {
  config
}
