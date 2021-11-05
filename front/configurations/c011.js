const FIRE  = 1;
const WATER = 2;
const grid_width = 64;

function config() {

  const diff = (1.0 / grid_width - 0.02/2 );

  return {
    id: 'c011',
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
    wait: 100,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: 2000,
    particles: [
      {
        x: 0.5,
        y: 0.5,
        kind: WATER,
      },
      {
        x: 0.52,
        y: 0.5,
        kind: WATER,
      },
    ],
    tests: {
      1: [
        {
          particle: 1,
          kv: {
            x: 0.5 - diff,
            y: 0.5,
          },
        },{
          particle: 2,
          kv: {
            x: 0.52 + diff,
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
