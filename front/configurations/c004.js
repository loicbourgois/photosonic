const FIRE  = 1;
const WATER = 2;

function config() {
  return {
    id: 'c003',
    image_width: 1024,
    image_height: 1024,
    grid_width: 64,
    grid_height: 64,
    workgroup_size: 8,
    grid_attributs_count: 1,
    particle_attributs_count: particle_attributs_count,
    consts_count: 2,
    FIRE: FIRE,
    WATER: WATER,
    wait: 0,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: 2,
    particles: [
      {
        x: 0.5,
        y: 0.5,
        dx: 0.001,
        kind: WATER,
      },
      {
        x: 0.6,
        y: 0.5,
        kind: WATER,
      },
    ],
    tests: {
      0: [
        {
          particle: 0,
          kv: {
            x: 0.501,
            y: 0.5,
          },
        }
      ],
    }
  }
}
export {
  config
}
