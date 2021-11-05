const FIRE  = 1;
const WATER = 2;
const grid_width = 64;

function config() {
  return {
    id: 'c009',
    image_width: 1024,
    image_height: 1024,
    grid_width: grid_width,
    grid_height: 64,
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
    steps: 20,
    particles: [
      {
        x: 0.9,
        y: 0.4,
        dx: 0.01,
        kind: WATER,
      },
      {
        x: 0.1,
        y: 0.5,
        dx: -0.01,
        kind: WATER,
      },
    ],
    tests: {
      0: [
        {
          particle: 1,
          kv: {
            x: 0.91,
            y: 0.4,
          },
        }
      ],
      9: [
        {
          particle: 1,
          kv: {
            x: 1.0,
            y: 0.4,
          },
        },{
          particle: 2,
          kv: {
            x: 0.0,
            y: 0.5,
          },
        }
      ],
      10: [
        {
          particle: 1,
          kv: {
            x: 0.01,
            y: 0.4,
          },
        },{
          particle: 2,
          kv: {
            x: 0.99,
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
