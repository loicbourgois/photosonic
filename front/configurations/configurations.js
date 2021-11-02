async function load(config_id) {
  const conf_wrapper = await import(`./${config_id}.js`)
  const conf = conf_wrapper.config()
  conf.particle_max_count = particle_max_count(conf)
  conf.grid_size = grid_size(conf)
  conf.image_size = image_size(conf)
  conf.buffer_size = buffer_size(conf)
  return conf
}


async function load_all() {
  const configs = {}
  for (const k in config_list()) {
    configs[k] = await load(k)
  }
  return configs
}


function config_list() {
  return {
    // 'c001': {},
    // 'c002': {},
    // 'c003': {},
    // 'c004': {},
    // 'c005': {},
    // 'c006': {},
    // 'c007': {},
    // 'c008': {},
    //'c009': {},
    'c999': {},
  }
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
