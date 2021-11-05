function config(c) {
  return {
    id: 'c001',
    image_width: 1024,
    image_height: 1024,
    grid_width: 64,
    grid_height: 64,
    workgroup_size: 8,
    grid_attributs_count: 1,
    wait: 0,
    zoom: 1,
    size: 1,
    littleEndian: true,
    steps: 20,
    particles: [
      {
        x: 0.5,
        y: 0.5,
        kind: c.FIRE,
      },
      {
        x: 0.75,
        y: 0.5,
        kind: c.FIRE,
      },
    ],
    tests: {
      0: [
        {
          particle: 0,
          kv: {
            x: 0.5,
            y: 0.5,
            x_old: 0.5,
          },
        },{
          particle: 1,
          kv: {
            x: 0.75,
            y: 0.5,
          },
        }
      ],
      10: [
        {
          particle: 0,
          kv: {
            x: 0.5,
            y: 0.5,
          },
        }
      ],
      19: [
        {
          particle: 0,
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
