const FIRE  = 1;
const WATER = 2;

function config() {
  return {
    id: 'c001',
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
        kind: FIRE,
      },
      {
        x: 0.75,
        y: 0.5,
        kind: FIRE,
      },
    ],
    tests: {
      0: [
        {
          particle: 1,
          kv: {
            x: 0.5,
            y: 0.5,
            x_old: 0.5,
          },
        },{
          particle: 2,
          kv: {
            x: 0.75,
            y: 0.5,
          },
        }
      ],
      10: [
        {
          particle: 1,
          kv: {
            x: 0.5,
            y: 0.5,
          },
        }
      ],
      19: [
        {
          particle: 1,
          kv: {
            x: 0.5,
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
