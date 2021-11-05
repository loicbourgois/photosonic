const FIRE  = 1;
const WATER = 2;
const grid_width = 64;

function config() {
  return {
    id: 'c007',
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
    wait: 0,
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
      {
        x: 0.51,
        y: 0.5,
        kind: WATER,
      },
    ],
    tests: {
      0: [
        {
          particle: 1,
          kv: {
            x: 0.41,
            y: 0.5,
          },
        }
      ],
      6: [
        {
          particle: 1,
          kv: {
            x: 0.47,
          },
        },{
          particle: 2,
          kv: {
            x: 0.54,
          },
        }
      ],
      7: [
        {
          particle: 1,
          kv: {
            x: 0.46,
          },
        },{
          particle: 2,
          kv: {
            x: 0.54,
          },
        }
      ],
      8: [
        {
          particle: 1,
          kv: {
            x: 0.45,
          },
        },
        {
          particle: 2,
          kv: {
            x: 0.55,
          },
        }
      ],
      9: [
        {
          particle: 1,
          kv: {
            x: 0.44,
          },
        },{
          particle: 2,
          kv: {
            x: 0.56,
          },
        }
      ],
      10: [
        {
          particle: 1,
          kv: {
            x: 0.43,
          },
        },{
          particle: 2,
          kv: {
            x: 0.57,
          },
        }
      ],
    }
  }
}
export {
  config
}
