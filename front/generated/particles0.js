const materials = {
  'default':  0,
  'WATER':    1,
  'FIRE':     2,
  'ELECTRIC': 3,
  'METAL':    4,
  'TURBO':    5,
  'COCKPIT':  6,
  'WOOD':     7,
  'LEAF':     8,
}
const links = [
  ['WATER',     'WATER',      1.0],
  ['FIRE',      'FIRE',       1.0],
  ['ELECTRIC',  'ELECTRIC',   1.0],
  ['METAL',     'METAL',      9.8],
  ['TURBO',     'TURBO',      2.0],
  ['COCKPIT',   'COCKPIT',    5.0],
  ['METAL',     'TURBO',      2.0],
  ['METAL',     'COCKPIT',    2.8],
  ['TURBO',     'COCKPIT',    3.8],
  ['WOOD',     'LEAF',    0.8],
  ['LEAF',     'LEAF',    0.0],
  ['WOOD',     'WOOD',    2.8],
]
const kinds_count = Object.keys(materials).length;



function list() {

}


function linkings(c) {
  return `var<private> linking: array<array<f32, ${kinds_count}>, ${kinds_count}> = array<array<f32, ${kinds_count}>, ${kinds_count}> (
${linkings2(c)}
  );`
}
function linkings2(c) {
  let strs = []
  for (let material_k in materials ) {
    strs.push(weights(material_k))
  }
  return strs.join('\n');
}
function weights(material_k) {
  let weights_ = []
  for (let material_k_2 in materials ) {
    weights_.push(weight(material_k, material_k_2))
  }
  return `    array<f32, ${kinds_count}> (${weights_.join(', ')}),  // ${material_k}`
}
function weight(material_k, material_k_2) {
  for (let link of links) {
    if (  (link[0] == material_k && link[1] == material_k_2)
      ||  (link[0] == material_k_2 && link[1] == material_k)
    ) {
      return link[2].toFixed(1)
    }
  }
  return "0.0"
}

export {
  list,
  linkings,
  materials
}
