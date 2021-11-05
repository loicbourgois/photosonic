const FIRE  = 1;
const WATER = 2;
const grid_width = 64;

function config() {
  return {
    id: 'c006',
    image_width: 1024,
    image_height: 1024,
    grid_width: grid_width,
    grid_height: 64,
    workgroup_size: 8,
    grid_attributs_count: 1,
    particle_attributs_count: particle_attributs_count,
    consts_count: consts_count,
    FIRE: FIRE,
    WATER: WATER,
    center: {
      x: 0.5,
      y: 0.5,
    },
    wait: 100,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: 20,
    particles: [
      {
        x: 0.4,
        y: 0.5,
        dx: 0.01,
        kind: WATER,
      },
      {
        x: 0.6,
        y: 0.5,
        dx: -0.01,
        kind: WATER,
      },
    ],
    tests: {
      0: [
        {
          particle: 0,
          kv: {
            x: 0.41,
            y: 0.5,
          },
        }
      ],
      7: [
        {
          particle: 0,
          kv: {
            x: 0.48,
          },
        }
      ],
      8: [
        {
          particle: 0,
          kv: {
            x: 0.49,
          },
        },
        {
          particle: 1,
          kv: {
            x: 0.51,
          },
        }
      ],
      9: [
        {
          particle: 0,
          kv: {
            x: 0.48,
          },
        },{
          particle: 1,
          kv: {
            x: 0.52,
          },
        }
      ],
      10: [
        {
          particle: 0,
          kv: {
            x: 0.47,
          },
        },{
          particle: 1,
          kv: {
            x: 0.53,
          },
        }
      ],
    }
  }
}
export {
  config
}
