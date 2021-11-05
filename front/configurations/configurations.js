function config_list() {
  return {
    //'c000': {},
    // 'c001': {},
    // 'c002': {},
    //'c003': {},
    //'c004': {},
    //'c005': {},
    //'c006': {},
    // 'c007': {},
    // 'c008': {},
    // 'c009': {},
    // 'c010': {},
    // 'c011': {},
    // 'c012': {},
    //'c998': {},
    'c999': {},
  }
}


async function load(config_id) {
  const conf_wrapper = await import(`./${config_id}.js`)
  const base_conf = {
    WATER:    3,
    FIRE:     4,
    ELECTRIC: 5,
    particle_attributs_count: window.particle_attributs_count,
    consts_count: window.consts_count
  }
  const conf = conf_wrapper.config(base_conf);
  Object.assign(conf,base_conf);
  conf.particle_max_count = particle_max_count(conf)
  conf.grid_size = grid_size(conf)
  conf.image_size = image_size(conf)
  conf.buffer_size = buffer_size(conf)
  if (! conf.air_resistance) {
    conf.air_resistance = 0.0;
  }
  if (! conf.max_speed) {
    conf.max_speed = 1000.0;
  }
  if (! conf.center) {
    conf.center = {
      x: 0.5,
      y: 0.5
    };
  }
  return conf
}


async function load_all() {
  const configs = {}
  for (const k in config_list()) {
    configs[k] = await load(k)
  }
  return configs
}




function particle_max_count(conf) {
  return grid_size(conf) / 4
}
function image_size(conf) {
  return conf.image_width * conf.image_height
}
function grid_size(conf) {
  return conf.grid_width * conf.grid_height
}
function buffer_size(conf) {
  return (
    conf.consts_count
    + conf.particle_max_count * conf.particle_attributs_count
    + conf.grid_size * conf.grid_attributs_count * 1
  ) * 4
}


export {
  load,
  load_all
}
