const FIRE  = 1;
const WATER = 2;
const grid_width = 64;

function config() {
  return {
    id: 'c005',
    image_width: 1024,
    image_height: 1024,
    grid_width: grid_width,
    grid_height: 64,
    workgroup_size: 8,
    grid_attributs_count: 1,
    FIRE: FIRE,
    WATER: WATER,
    wait: 1000,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: 20,
    particles: [
      {
        x: 0.5,
        y: 0.4,
        kind: WATER,
      },
      {
        x: 0.5+1.0/grid_width*2,
        y: 0.4,
        kind: WATER,
      },
      {
        x: 0.5,
        y: 0.5,
        kind: WATER,
      },
      {
        x: 0.5+1.0/grid_width,
        y: 0.5,
        kind: WATER,
      },
      {
        x: 0.5,
        y: 0.6,
        kind: WATER,
      },
      {
        x: 0.5+1.0/grid_width - 0.0000001,
        y: 0.6,
        kind: WATER,
      },
      {
        x: 0.5,
        y: 0.7,
        kind: WATER,
      },
      {
        x: 0.5+1.0/grid_width*2- 0.0000001,
        y: 0.7,
        kind: WATER,
      },
      {
        x: 0.4,
        y: 0.8,
        dx: 0.01,
        kind: WATER,
      },
      {
        x: 0.5,
        y: 0.8,
        kind: WATER,
      },

      {
        x: 0.48,
        y: 0.9,
        kind: WATER,
      },
      {
        x: 0.5,
        y: 0.9,
        kind: WATER,
      },

    ],
    tests: {
      0: [
        {
          particle: 0,
          kv: {
            x: 0.5,
            y: 0.4,
          },
        }
      ],
      6: [
        {
          particle: 8,
          kv: {
            x: 0.47,
          },
        },
        {
          particle: 9,
          kv: {
            x: 0.50,
          },
        }
      ],
      7: [
        {
          particle: 8,
          kv: {
            x: 0.4693748950958252,
          },
        },
        {
          particle: 9,
          kv: {
            x: 0.510624885559082,
          },
        }
      ],
      // 8: [
      //   {
      //     particle: 8,
      //     kv: {
      //       x: 0.47,
      //     },
      //   },
      //   {
      //     particle: 9,
      //     kv: {
      //       x: 0.52,
      //     },
      //   }
      // ],
      // 9: [
      //   {
      //     particle: 8,
      //     kv: {
      //       x_old: 0.47,
      //       x: 0.47,
      //     },
      //   },
      //   {
      //     particle: 9,
      //     kv: {
      //       x_old: 0.52,
      //       x: 0.53,
      //     },
      //   }
      // ],
      // 10: [
      //   {
      //     particle: 8,
      //     kv: {
      //       x_old: 0.47,
      //       x: 0.47,
      //     },
      //   },
      //   {
      //     particle: 9,
      //     kv: {
      //       x_old: 0.53,
      //       x: 0.54,
      //     },
      //   }
      // ],
      // 10: [
      //   {
      //     particle: 9,
      //     kv: {
      //       x: 0.49,
      //     },
      //   },
      //   {
      //     particle: 10,
      //     kv: {
      //       x: 0.5,
      //     },
      //   }
      // ],
      // 19: [
      //   {
      //     particle: 1,
      //     kv: {
      //       x: 0.189,
      //       y: 0.5,
      //     },
      //   }
      // ]
    }
  }
}
export {
  config
}
