function config(c) {
  return {
    id: 'c003',
    image_width: 1024,
    image_height: 1024,
    grid_width: 64,
    grid_height: 64,
    workgroup_size: 8,
    grid_attributs_count: 1,
    wait: 100,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: 20,
    particles: [
      {
        x: 0.999,
        y: 0.5,
        //dx: 0.01,
        kind: c.FIRE,
      },
      {
        x: 0.001,
        y: 0.6,
        kind: c.FIRE,
      },
    ],
    tests: {
      0: [
        {
          particle: 0,
          kv: {
            x: 0.999,
            y: 0.5,
          },
        }
      ],
      9: [
        {
          particle: 0,
          kv: {
            x: 0.089,
            y: 0.5,
          },
        }
      ],
      19: [
        {
          particle: 0,
          kv: {
            x: 0.189,
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
