const FIRE  = 1;
const WATER = 2;

function config() {
  let c_ = {
    id: 'c999',
    image_width: 1024,
    image_height: 1024,
    grid_width: 512/4/8,
    grid_height: 512/4/8,
    workgroup_size: 8,
    grid_attributs_count: 1,
    particle_attributs_count: particle_attributs_count,
    consts_count: 2,
    FIRE: FIRE,
    WATER: WATER,
    wait: 10,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: "unlimited",
    particles: [{
      x: 0.5,
      y: 0.0,
      dx: 0.01,
      kind: WATER,
    }],
    tests: {
      // 0: [
      //   {
      //     particle: 0,
      //     kv: {
      //       x: 0.51,
      //       y: 0.0,
      //     },
      //   },
      // ],
      // 1: [
      //   {
      //     particle: 0,
      //     kv: {
      //       x: 0.52,
      //       y: 0.0,
      //     },
      //   },
      // ],
      // 3: [
      //   {
      //     particle: 1,
      //     kv: {
      //       x: 0.06,
      //       y: 0.0,
      //     },
      //   },
      // ],
      // 4: [
      //   {
      //     particle: 1,
      //     kv: {
      //       x: 0.05,
      //       y: 0.0,
      //     },
      //   },
      // ],
    }
  }
  c_.max_speed = 0.5 / c_.grid_width;

  return c_
}
export {
  config
}
