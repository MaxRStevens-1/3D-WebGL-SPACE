
import { VertexAttributes } from './vertex-attributes'
import { ShaderProgram } from './shader-program'
import { VertexArray } from './vertex-array'
import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'
import { Terrain } from './terrain'
import { Trimesh, TrimeshVao } from './trimesh'
import { Camera, SlideCamera } from './camera'
import { reserveDepthTexture, initializeDepthFbo, initializeDepthProgram, createTexture2d} from './shadow'
import {readBoxen, generateCube} from './box_gen'
import { generateSkybox, loadCubemap, skybox_shader_program, ship_shader} from './skybox'
import { Trackball } from './trackball'
import { generateSphere } from './sphere.js'

let canvas
let attributes
let shaderProgram
let vao
let clipFromEye
let camera
let moveDelta = 5
let turnDelta = 1

// SKYBOX
let skyboxShaderProgram
let skyboxVao

// MIRROR SURFACE SHADER
let shipShader

// SPHERE
let sphere_index = 5

// SHADOW
let depthTextureUnit
let textureFromWorld
let fbo
let depthProgram;
const textDim = 128;

let lightPosition = new Vector3(800, 200, 800)
let lightTarget = new Vector3(400, 100, 0);
let lightCamera;
let lightFromWorld;
let clipFromLight;

// BLING-FONG
const albedo = [.6, .6, .6]
const specularColor = [.3, .8, .9];
const diffuseColor = [.1, .6, .9];
const shininess = 80.0;
const ambientFactor = 0.7;

// OBJECTS
const collectibles = [];
const collectiblePositions = []
let degrees = 1;

const objects = []
const objectPositions = []

// BOUNDINGBOXES
let bounding_boxes = []
let bounding_boxes_positions = []
let show_hitboxes = false

// KEYPRESSES
let keysPressed = {
  a: false,
  s: false,
  d: false,
  w: false,
  up: false,
  down: false,
};

// Default render function
function render() {
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(0.6, 0.6, 0.9, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // DRAW SKYBOX
  skyboxShaderProgram.bind()
  gl.depthMask(false);
  const worldFromModel = Matrix4.translate(camera.position.x, camera.position.y, camera.position.z);
  skyboxShaderProgram.setUniformMatrix4('clipFromEye', clipFromEye);
  skyboxShaderProgram.setUniformMatrix4('eyeFromWorld', camera.eyeFromWorld);
  skyboxShaderProgram.setUniformMatrix4('worldFromModel', worldFromModel);
  skyboxShaderProgram.setUniform1i ('skybox', 1)
  skyboxVao.bind()
  skyboxVao.drawIndexed (gl.TRIANGLES)
  skyboxVao.unbind()
  skyboxShaderProgram.unbind()
  gl.depthMask(true);
  shaderProgram.bind()

  // Bling-Fong basic init
  shaderProgram.setUniform3f('albedo', albedo[0], albedo[1], albedo[2])
  shaderProgram.setUniform3f('specularColor', specularColor[0], specularColor[1], specularColor[2])
  shaderProgram.setUniform3f('diffuseColor', diffuseColor[0], diffuseColor[1], diffuseColor[2])
  shaderProgram.setUniform1f('shininess', shininess)
  shaderProgram.setUniform1f('ambientFactor', ambientFactor)

  shaderProgram.setUniformMatrix4('clipFromEye', clipFromEye)
  shaderProgram.setUniformMatrix4('eyeFromWorld', camera.eyeFromWorld)
  shaderProgram.setUniformMatrix4('worldFromModel', Matrix4.identity())

  shaderProgram.setUniformMatrix4("textureFromWorld", textureFromWorld);
  shaderProgram.setUniform1i("depthTexture", depthTextureUnit);

  // Draw terrain
  /*shaderProgram.setUniform1i('normTexture', 1);
  vao.bind()
  vao.drawIndexed(gl.TRIANGLES)
  vao.unbind()
  */
  // RESET TEXTURE
  shaderProgram.setUniform1i('normTexture', 0);

  // DRAWS OBJECTS
  /*
  shaderProgram.setUniform3f('albedo', albedo[0], albedo[1], albedo[2])
  shaderProgram.setUniform3f('specularColor', specularColor[0], specularColor[1], specularColor[2])
  shaderProgram.setUniform3f('diffuseColor', diffuseColor[0], diffuseColor[1], diffuseColor[2])
  shaderProgram.setUniform1f('shininess', shininess)
  shaderProgram.setUniform1f('ambientFactor', ambientFactor)
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i]
    const pos = objectPositions[i]
    // SET AS ATTRIBUTE
    shaderProgram.setUniformMatrix4('worldFromModel', pos)
    object.vao.bind()
    object.vao.drawIndexed(gl.TRIANGLES)
    object.vao.unbind()
  }*/

  
  shaderProgram.setUniform3f('albedo', .9, .5, .3)
  shaderProgram.setUniform3f('specularColor', .8, .9, .1)
  shaderProgram.setUniform3f('diffuseColor', .6, .6, .3)
  shaderProgram.setUniform1f('shininess', 80)
  shaderProgram.setUniform1f('ambientFactor', .4)
  for (let i = 0; i < collectibles.length; i++) {
    const collectible = collectibles[i]
    const pos = collectiblePositions[i]
    // SET AS ATTRIBUTE
    shaderProgram.setUniformMatrix4('worldFromModel', pos)
    // sphere index
    if (i == sphere_index)
      shaderProgram.setUniform1i('normTexture', 2);
    collectible.vao.bind()
    collectible.vao.drawIndexed(gl.TRIANGLES)
    collectible.vao.unbind()
  }
  // DRAW HITBOXES IF OPTION SELECTED
  if (show_hitboxes)
  {
    gl.depthMask(false);
    shaderProgram.setUniform3f('albedo', .7, .7, .5)
    shaderProgram.setUniform3f('specularColor', .2, .4, .3)
    shaderProgram.setUniform3f('diffuseColor', .6, .6, .3)
    shaderProgram.setUniform1f('shininess', 40)
    shaderProgram.setUniform1f('ambientFactor', .6)
    for (let i = 0; i < bounding_boxes.length; i++) {
      const bounding_box = bounding_boxes[i]
      const pos = bounding_boxes_positions[i]
      // SET AS ATTRIBUTE
      shaderProgram.setUniformMatrix4('worldFromModel', pos)
      bounding_box.vao.bind()
      bounding_box.vao.drawIndexed(gl.TRIANGLES)
      bounding_box.vao.unbind()
    }
    gl.depthMask(true);
  }


  shaderProgram.unbind()


  // SHIPS AS MIRRORS
  shipShader.bind()
  shipShader.setUniformMatrix4('worldFromModel', worldFromModel);
  shipShader.setUniformMatrix4('clipFromEye', clipFromEye);
  shipShader.setUniformMatrix4('eyeFromWorld', camera.eyeFromWorld);
  shipShader.setUniform1i ('skybox', 1)
  // PLAYER SHIP AS MIRROR
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i]
    const pos = objectPositions[i]
    // SET AS ATTRIBUTE
    shipShader.setUniformMatrix4('worldFromModel', pos)
    object.vao.bind()
    object.vao.drawIndexed(gl.TRIANGLES)
    object.vao.unbind()
  }

  // OTHER SHIPS AS MIRROR
  /*
  for (let i = 0; i < collectibles.length; i++) {

    shipShader.setUniformMatrix4('worldFromModel', collectiblePositions[i]);
    collectibles[i].vao.bind()
    collectibles[i].vao.drawIndexed (gl.TRIANGLES)
    collectibles[i].vao.unbind()
  } */
  shipShader.unbind()
}

// Shadow/Depths render function
function renderDepths(width, height, fbo) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  gl.viewport(0, 0, width, height);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  const clipFromWorld = clipFromLight.multiplyMatrix(lightFromWorld);
  depthProgram.bind();
  for (let i = 0; i < collectibles.length; i++) {
    const collectible = collectibles[i]
    const pos = collectiblePositions[i]
    depthProgram.setUniformMatrix4('clipFromWorld', clipFromWorld);
    depthProgram.setUniformMatrix4('worldFromModel', pos)
    collectible.vao.bind()
    collectible.vao.drawIndexed(gl.TRIANGLES)
    collectible.vao.unbind()
  }

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i]
    const pos = objectPositions[i]
    depthProgram.setUniformMatrix4('clipFromWorld', clipFromWorld);
    depthProgram.setUniformMatrix4('worldFromModel', pos)
    object.vao.bind()
    object.vao.drawIndexed(gl.TRIANGLES)
    object.vao.unbind()
  }

  depthProgram.unbind();

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/**
 * updates viewport to new window
 */
function onResizeWindow() {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
  clipFromEye = Matrix4.fovPerspective(45, canvas.width / canvas.height, 0.1, 5000)
  render()
  renderDepths(textDim, textDim, fbo)
}

/**
 * self explanitory
 * @param {*} url
 * @returns
 */
async function readImage(url) {
  const image = new Image()
  image.src = url
  await image.decode()
  return image
}

// returns string of obj file
async function readObjFromFile (file) {
  var obj =  await fetch(file).then(response => response.text()) 
  return obj
}

/**
 * Init everything needed to run program
 */
async function initialize() {
  canvas = document.getElementById('canvas')
  window.gl = canvas.getContext('webgl2')

  gl.enable(gl.DEPTH_TEST)
  attributes = new VertexAttributes()

  // SHADOW INIT
  depthTextureUnit = reserveDepthTexture (textDim, textDim, gl.TEXTURE0)
  fbo = initializeDepthFbo (depthTextureUnit)
  depthProgram = initializeDepthProgram()
  getTextFromWorld()


  // PLAYER CAMERA INIT
  const from = new Vector3(100, 100, 100)
  const to = new Vector3(0, 0, 0)
  const worldup = new Vector3(0, 1, 0)
  camera = new SlideCamera (from, to, worldup, .01, 300, 1)

  // SKYBOX INIT
  skyboxShaderProgram = skybox_shader_program()
  let skyboxAttributes = generateSkybox()
  skyboxVao = new VertexArray (skyboxShaderProgram, skyboxAttributes)
  
  // SKYBOX TEXTURE 
  await loadCubemap ("./bkg/lightblue", "png", gl.TEXTURE1)
  // MOON TEXTURE
  const moonImage = await readImage('./moon.png')
  createTexture2d (moonImage, gl.TEXTURE2)


  const vertexSource = `
uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromModel;
uniform mat4 textureFromWorld;

in vec3 normal;
in vec3 position;
in vec2 texPosition;

out vec3 mixNormal;
out vec3 mixPosition;
out vec4 mixTexPosition;
out vec2 flat_mixTexPosition;

void main() {
  gl_PointSize = 3.0;
  gl_Position = clipFromEye * eyeFromWorld * worldFromModel * vec4(position, 1.0);
  mixNormal = (eyeFromWorld * worldFromModel * vec4(normal.x, -normal.y, normal.z, 0)).xyz;
  mixPosition =  (eyeFromWorld * worldFromModel * vec4(position, 1.0)).xyz;
  mixTexPosition = textureFromWorld * worldFromModel * vec4(position, 1.0);
  flat_mixTexPosition = texPosition;
}
  `;

  const fragmentSource = `
const vec3 lightDirection = normalize(vec3(1.0, 1.0, 3.0));
uniform vec3 albedo;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;
uniform float ambientFactor;

uniform sampler2D normTexture;
uniform sampler2D depthTexture;

in vec3 mixNormal;
in vec3 mixPosition;
in vec4 mixTexPosition;
in vec2 flat_mixTexPosition;

out vec4 fragmentColor;

void main() {
  vec3 normal = normalize(mixNormal);

  // get normal texture
  vec4 realTexture = texture(normTexture, flat_mixTexPosition);
  //vec3 albedo = texture(normTexture, flat_mixTexPosition).rgb;
  // calculate fragment depth and shadow
  vec4 texPosition = mixTexPosition / mixTexPosition.w;
  float fragmentDepth = texPosition.z;
  float closestDepth = texture(depthTexture, texPosition.xy).r;
  float shadowFactor = closestDepth < fragmentDepth ? 0.5 : 1.0;

  // specular
  vec3 eyeDirection = normalize(-mixPosition);
  vec3 halfDirection = normalize(eyeDirection + lightDirection);
  float specularity = pow(max(0.0, dot(halfDirection, normal)), shininess);
  vec3 specular = specularity * specularColor;

  // ambient
  float litness = dot(normal, lightDirection);
  vec3 ambient = ambientFactor * albedo * diffuseColor;
  // diffuse
  vec3 diffuse = (1.0 - ambientFactor) * litness * albedo * diffuseColor * shadowFactor;
  vec3 rgb = ambient + diffuse + specular;

  fragmentColor = realTexture * vec4(rgb, 1.0);

}
  `;

  shaderProgram = new ShaderProgram(vertexSource, fragmentSource)
  vao = new VertexArray(shaderProgram, attributes)

  await initCollectibles()
  await initializeObjects()

  window.addEventListener('resize', onResizeWindow)
  onResizeWindow()

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('pointerdown', () => {
    document.body.requestPointerLock()
  })
  window.addEventListener('pointermove', (event) => {
    if (document.pointerLockElement) {
      camera.yaw(-event.movementX * turnDelta)
      camera.pitch(-event.movementY * turnDelta)
      render()
    }
  })

  onResizeWindow()
  rotateCollectibles()

}

/**
 * Initalize player object
 */
async function initializeObjects() {

  // GENERATE PLAYER OBJECT
  shipShader = ship_shader();
  let ship = readBoxen ("0 0 0   4 4 4   1 0 1", shipShader)[0]
  objects.push (ship)

    // SHIPS OFFSET CALCULATION
  let ship_offset = new Vector3(10,10,7)
  ship_offset.add (ship.centroid)
  let ship_position = camera.position
                      .add (camera.forward.scalarMultiply(ship_offset.x)
                      .add (camera.right.scalarMultiply (ship_offset.z)))
  ship.position_point = ship_position;
  objectPositions.push( Matrix4.translate (ship_position.x, 
                                          ship_position.y, 
                                          ship_position.z))
}

/**
 * Initalize non- player objects
 */
async function initCollectibles() {
  // credit to ezgi bakim
  const name = './spaceship.obj';

  let lines = await readObjFromFile(name);
  shipShader = ship_shader();
  // CREATING INTERACTABLE OBJS
  for (let i = 0; i < 5; i++) {
    //const collectible = createObject(lines)
    // SHIP 2 MIRROR
    const collectible = createShipMirrorObject (lines, shaderProgram)
    // create positions for collectible
    const center =  new Vector3 (collectible.centroid.x, collectible.centroid.y, collectible.centroid.z)
    let x = Math.random() * 1500
    let z = Math.random() * 1500
    let y = Math.random() * 1500
    let position_point = new Vector3 (x, y, z)

    collectible.position_point = position_point
    let pos = Matrix4.translate(x, y, z)
    pos = pos.multiplyMatrix(Matrix4.scale(40, 40, 40))
    // FIND POSITION THAT DOES NOT LIE WITHIN OTHER OBJ
    while (checkObjectToObjectCollision (collectible, pos) && i != 0) {
      x = Math.random() * 1500
      z = Math.random() * 1500
      y = Math.random() * 1500
      position_point = new Vector3 (x, y, z)
  
      collectible.position_point = position_point
      pos = Matrix4.translate(x, y, z)
      pos = pos.multiplyMatrix(Matrix4.scale(40, 40, 40))
    }
    collectiblePositions.push(pos)
    collectibles.push(collectible)

  }
  // GENERATE SPHERE
  let sphere_attributes_arr = generateSphere (20, 20, 20)
  let sPos = sphere_attributes_arr[0]
  let sNor = sphere_attributes_arr[1]
  let sInd = sphere_attributes_arr[2]
  let sTex = sphere_attributes_arr[3]
  let sphere_trivao = new TrimeshVao (sPos, sNor, sInd, null, sTex)
  sPos = sphere_trivao.flat_positions ()
  sNor = sphere_trivao.flat_normals ()
  // SPHERE ATTRIBUTES
  const sphere_attributes = new VertexAttributes()
  sphere_attributes.addAttribute ('position', sPos.length / 3, 3, sPos)
  sphere_attributes.addAttribute ('normal', sPos.length / 3, 3, sNor)
  sphere_attributes.addAttribute ('texPosition', sPos.length / 3, 2, sTex)
  sphere_attributes.addIndices (sInd)
  let sphere_vao = new VertexArray (shaderProgram, sphere_attributes)
  sphere_trivao.vao = sphere_vao
  // SPHERE POSITION
  let x = Math.random() * 2000
  let z = Math.random() * 2000
  let y = Math.random() * 200
  let position_point = new Vector3 (x, y, z)
  sphere_trivao.position_point = position_point.add (sphere_trivao.centroid)
  let sphere_pos = Matrix4.translate (x, y, z)
  sphere_pos = sphere_pos.multiplyMatrix (Matrix4.scale (10,10,10))
  while (checkObjectToObjectCollision (sphere_trivao, sphere_pos)) {
    x = Math.random() * 2000
    z = Math.random() * 2000
    y = Math.random() * 1000
    position_point = new Vector3 (x, y, z)

    sphere_trivao.position_point = position_point
    sphere_pos = Matrix4.translate(x, y, z)
    sphere_pos = sphere_pos.multiplyMatrix (Matrix4.scale (10,10,10))
  }
  collectibles.push (sphere_trivao)
  collectiblePositions.push (sphere_pos)
  // GENERATE HITBOXES
  generateVisualHitBoxes()

}

/**
 * Generates visual representations of hitboxes around interactable objects
 */
function generateVisualHitBoxes () {
  for (let i = 0; i < collectibles.length; i++) {
    let c_obj = collectibles[i]

    let c_pos = c_obj.position_point
    if (c_obj == null || c_pos == null) {
      console.log ("Bad obj in collision check")
      continue
    }
    // ** Poorly designed code, rewrite **
    let min = c_obj.min
    let max = c_obj.max

    let height = Math.abs (max.y) - min.y 
    let width = Math.abs (max.x) - min.x 
    let depth = Math.abs (max.z) - min.z
    //  GENERATE HIT CUBE
    let cube_attrs = generateCube (height, width, depth, min.x, min.y, min.z)
    let cube_pos = cube_attrs[0]
    let cube_norm = cube_attrs[1]
    let cube_faces = cube_attrs[2]
    // GENERATE CUBE TRIMESH VAO 
    let cube_trivao = new TrimeshVao (cube_pos, cube_norm, cube_faces, null)
    cube_pos   = cube_trivao.flat_positions ()
    cube_norm  = cube_trivao.flat_normals   ()
    cube_faces = cube_trivao.flat_indices   ()
    let cube_attributes = new VertexAttributes ()
    cube_attributes.addAttribute ('position', cube_pos.length / 3, 3, cube_pos)
    cube_attributes.addAttribute ('normal', cube_pos.length / 3, 3, cube_norm)
    cube_attributes.addIndices (cube_faces)
    let cube_vao = new VertexArray (shaderProgram, cube_attributes)
    cube_trivao.vao = cube_vao
    cube_trivao.position_point = c_pos
    // ADD TO BOUNDING BOX ARRAYS
    bounding_boxes.push (cube_trivao)
    bounding_boxes_positions.push (collectiblePositions[i])
  }
}


/**
 * Creates and return an trimeshVao from inputed shader
 * @param {*} lines 
 * @param {*} ship_shader 
 * @returns 
 */
function createShipMirrorObject (lines, ship_shader) {
  let obj_trimesh = Trimesh.readObjToJson(lines)
  let obj_attributes = new VertexAttributes()
  let positions = obj_trimesh.flat_positions()
  let normals = obj_trimesh.flat_normals()
  let indices = obj_trimesh.flat_indices()
  obj_attributes.addAttribute('position', positions.length / 3, 3, positions)
  obj_attributes.addAttribute('normal',   normals.length   / 3, 3, normals)
  obj_attributes.addIndices  (indices)
  let obj_vao = new VertexArray(ship_shader, obj_attributes)
  let trivao = new TrimeshVao  (obj_trimesh.positions,
                               obj_trimesh.normals,
                               obj_trimesh.indices,
                               obj_vao)
  return trivao
}

/**
 * Creates and returns an trimeshVao from loaded in obj file
 * @param {*} lines 
 * @returns 
 */
function createObject(lines) {
  let obj_trimesh = Trimesh.readObjToJson(lines)
  let obj_attributes = new VertexAttributes()
  let positions = obj_trimesh.flat_positions()
  let normals = obj_trimesh.flat_normals()
  let indices = obj_trimesh.flat_indices()
  obj_attributes.addAttribute('position', positions.length / 3, 3, positions)
  obj_attributes.addAttribute('normal',   normals.length   / 3, 3, normals)
  obj_attributes.addIndices  (indices)
  let obj_vao = new VertexArray(shaderProgram, obj_attributes)
  let trivao = new TrimeshVao  (obj_trimesh.positions,
                               obj_trimesh.normals,
                               obj_trimesh.indices,
                               obj_vao)
  return trivao
}

// REWRITE AND RENAME
function rotateCollectibles() {
  // CHECK GRAVITY
  let ship = objects[0]
  let ship_distance = checkSphereDistance (ship);
  if (ship_distance <= 2000 && ship_distance >= 100)  {
    // MOVE PLAYER WITH FORCE OF GRAVITY

    // calculate force of gravity
    let force = forceOfGravity (ship_distance, 100000)
    // calculate unit vector between pointing from ship to sphere
    // B - A / | B - A |
    let sphere = collectibles[sphere_index]
    let gravity_direction = sphere.position_point.add(ship.position_point.inverse())
                            .normalize().scalarMultiply(force)
    camera.end_point = camera.end_point.add (gravity_direction)
  }
  // OFFSETS ON SCREEN
  let ship_offset_x = 17
  let ship_offset_z = 3.6
  // ships position
  let ship_position = camera.position
                      .add (camera.forward.scalarMultiply(ship_offset_x)
                      .add (camera.right.scalarMultiply (ship_offset_z)))
  
  ship.position_point = ship_position;
  objectPositions[0] = Matrix4.translate (ship_position.x, ship_position.y, 
                                          ship_position.z)
                                          

  // CHECK IF PLAYER CAN MOVE
  if (checkCollision (ship)) {
    camera.end_point = camera.position
    console.log ("COLLISION DETECTED")
  }
  else {
    // MOVE PLAYER
    camera.timeStepMove()

    // ROTATE OBJECTS
    for (let i = 0; i < collectibles.length; i++) {
      const collectible = collectibles[i]
      let pos = collectiblePositions[i]
      const centroid = collectible.centroid
      const center = new Vector3(centroid.x, 1, centroid.z)
      pos = pos.multiplyMatrix (Matrix4.rotateAroundAxis(center, .5))
      collectiblePositions[i] = pos
      if (show_hitboxes)
        bounding_boxes_positions[i] = pos
    }
  }
  render()
  requestAnimationFrame(rotateCollectibles)
}


/**
 * checks for distance between points in 3d space
 * @param {} object 
 * @returns 
 */
function checkSphereDistance (object) {
  let sphere = collectibles[sphere_index]
  let s_point = sphere.position_point
  let o_point = object.position_point
  let distance = Math.sqrt (Math.pow(s_point.x - o_point.x, 2) 
                            + Math.pow(s_point.y - o_point.y, 2) 
                            + Math.pow(s_point.z - o_point.z, 2)) 
  return distance
}

/**
 * Guesstimate of gravitational force
 * @param {} distance 
 * @param {*} mass_impact 
 * @returns 
 */
function forceOfGravity (distance, mass_impact) {
  let force = 1/Math.pow(distance,2) * mass_impact
  return force
} 

/**
 * Checks if an inputed object is within bounding box of any iterable object
 * @param {*} object 
 * @returns 
 */
function checkCollision (object) {
  let p_max = objectPositions[0].multiplyVector (object.max)
  let p_min = objectPositions[0].multiplyVector (object.min)
  for (let i = 0; i < collectibles.length - 1; i++) {
    let c_obj = collectibles[i]
    let c_hitbox = bounding_boxes[i]
    if (c_obj == null || c_hitbox == null) {
      console.log ("Bad obj in collision check")
      continue
    }
    let minmax_arr = c_obj.checkAdjustedBoundingBox (collectiblePositions[i])
    let c_min = minmax_arr[0]
    let c_max = minmax_arr[1]
    if  ((p_min.x <= c_max.x && p_max.x >= c_min.x)
      && (p_min.y <= c_max.y && p_max.y >= c_min.y) 
      && (p_min.z <= c_max.z && p_max.z >= c_min.z)) 
    {
        console.log ("object min ="+c_min)
        console.log ("object max ="+c_max)
        console.log ("player min = "+p_min)     
        console.log ("player max = "+p_max)     
        minmax_arr = c_hitbox.checkAdjustedBoundingBox (bounding_boxes_positions[i])
        c_min = minmax_arr[0]
        c_max = minmax_arr[1]
        console.log ("hb min = "+c_min) 
        console.log ("hb max = "+c_max)
        console.log ("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXxxx")

        return true;
    }
  }
  return false;
}

/**
 * sees if one object is within bounding box of any other object
 * @param {*} input_obj
 * @param {*} pos_mat
 * @returns T if is within BB, F if not
 */
function checkObjectToObjectCollision (input_obj, pos_mat) {
  for (let i = 0; i < collectibles.length; i++) {
    let c_obj = collectibles[i]
    let c_pos = c_obj.position_point
    if (c_obj == null || c_pos == null) {
      console.log ("Bad obj in collision check")
      continue
    }
    let c_min = collectiblePositions[i].multiplyVector (c_obj.min)
    let c_max = collectiblePositions[i].multiplyVector (c_obj.max)
    let p_max = pos_mat.multiplyVector (input_obj.max)
    let p_min = pos_mat.multiplyVector (input_obj.min)

    if  ((p_min.x <= c_max.x && p_max.x >= c_min.x)
      && (p_min.y <= c_max.y && p_max.y >= c_min.y) 
      && (p_min.z <= c_max.z && p_max.z >= c_min.z)) {
      return true;
    }
  }
  return false;
}


/**
 * Handles player inputs when a key is pressed down
 * 
 * @param {*} event 
 */
function onKeyDown(event) {
  if (event.key === 'ArrowUp' || event.key == 'w' || keysPressed.w) {
    camera.adjustVelocityAdvance(moveDelta)
    keysPressed.w = true
  } if (event.key === 'ArrowDown' || event.key == 's' || keysPressed.s) {
    camera.adjustVelocityAdvance(-moveDelta)
    keysPressed.s = true
  } if (event.key === 'ArrowLeft' || event.key == 'a' || keysPressed.a) {
    camera.adjustVelocityStrafe(-moveDelta)
    keysPressed.a = true
  } if (event.key === 'ArrowRight' || event.key == 'd' || keysPressed.d) {
    camera.adjustVelocityStrafe(moveDelta)
    keysPressed.d = true
  } if (event.key == 'q') {
    camera.yaw(turnDelta)
  } if (event.key == 'e') {
    camera.yaw(-turnDelta)
  } if (event.key == '=' || keysPressed.up) {
    camera.adjustVelocityElevate (moveDelta)
    keysPressed.up = true
  } if (event.key ==  '-' || keysPressed.down) {
    camera.adjustVelocityElevate (-moveDelta)
    keysPressed.down = true
  } if (event.key == 'h') {
    show_hitboxes = !show_hitboxes
  } if (event.key == ' ') {
    camera.advance (10)
    camera.end_point = camera.position
  }
}
/**
 * Removes keypressed if key is pushed up
 * @param {} event 
 */
function onKeyUp (event) {
  if (event.key === 'ArrowUp' || event.key == 'w') {
    keysPressed.w = false
  } if (event.key === 'ArrowDown' || event.key == 's') {
    keysPressed.s = false
  } if (event.key === 'ArrowLeft' || event.key == 'a') {
    keysPressed.a = false
  } if (event.key === 'ArrowRight' || event.key == 'd') {
    keysPressed.d = false
  } if (event.key == '=') {
    keysPressed.up = false
  } if (event.key ==  '-') {
    keysPressed.down = false
  }
}

/**
 * Shadows init
 */
function getTextFromWorld () {
  lightCamera = new Camera(lightPosition, lightTarget, new Vector3(0, 1, 0));
  lightFromWorld = lightCamera.eyeFromWorld;
  clipFromLight = Matrix4.fovPerspective(45, 1, 0.1, 1000);
  const matrices = [
    Matrix4.translate(0.5, 0.5, 0.5),
    Matrix4.scale(0.5, 0.5, 0.5),
    clipFromLight,
    lightFromWorld,
  ];
  textureFromWorld = matrices.reduce((accum, transform) => accum.multiplyMatrix(transform));
}

window.addEventListener('load', initialize)
