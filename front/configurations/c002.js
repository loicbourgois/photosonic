const FIRE  = 1;
const WATER = 2;

function config() {
  return {
    id: 'c002',
    image_width: 1024,
    image_height: 1024,
    grid_width: 64,
    grid_height: 64,
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
    steps: 20,
    particles: [
      {
        x: 0.5,
        y: 0.5,
        dx: 0.001,
        kind: FIRE,
      },
    ],
    tests: {
      0: [
        {
          particle: 1,
          kv: {
            x: 0.501,
            y: 0.5,
          },
        }
      ],
      9: [
        {
          particle: 1,
          kv: {
            x: 0.51,
            y: 0.5,
          },
        }
      ],
      19: [
        {
          particle: 1,
          kv: {
            x: 0.52,
            y: 0.5,
          },
        }
      ]
    }
  }
}
export {
  config
}
