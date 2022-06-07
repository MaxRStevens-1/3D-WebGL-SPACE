
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
  // Bling-Fong uniforms init
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

  // DRAW COLLECTIBLES * AS MIRRORS*
  /*
  shaderProgram.setUniform3f('albedo', .9, .5, .3)
  shaderProgram.setUniform3f('specularColor', .8, .9, .1)
  shaderProgram.setUniform3f('diffuseColor', .6, .6, .3)
  shaderProgram.setUniform1f('shininess', 90)
  shaderProgram.setUniform1f('ambientFactor', .4)
  for (let i = 0; i < collectibles.length; i++) {
    const collectible = collectibles[i]
    const pos = collectiblePositions[i]
    // SET AS ATTRIBUTE
    shaderProgram.setUniformMatrix4('worldFromModel', pos)
    collectible.vao.bind()
    collectible.vao.drawIndexed(gl.TRIANGLES)
    collectible.vao.unbind()
  }*/
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
  for (let i = 0; i < collectibles.length; i++) {

    shipShader.setUniformMatrix4('worldFromModel', collectiblePositions[i]);
    collectibles[i].vao.bind()
    collectibles[i].vao.drawIndexed (gl.TRIANGLES)
    collectibles[i].vao.unbind()
  }
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


  // PLAYER CAMERA
  const from = new Vector3(100, 100, 100)
  const to = new Vector3(0, 0, 0)
  const worldup = new Vector3(0, 1, 0)
  camera = new SlideCamera (from, to, worldup, .01, 300, 1)

  // SKYBOX INIT
  
  skyboxShaderProgram = skybox_shader_program()
  let skyboxAttributes = generateSkybox()
  skyboxVao = new VertexArray (skyboxShaderProgram, skyboxAttributes)
  // load in skybox cube
  await loadCubemap ("./bkg/lightblue", "png", gl.TEXTURE1)
  

  const vertexSource = `
uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromModel;
uniform mat4 textureFromWorld;

in vec3 normal;
in vec3 position;
in vec2 flat_texPosition;

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
  flat_mixTexPosition = flat_texPosition;
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

async function initCollectibles() {
  // credit to ezgi bakim
  const name = './spaceship.obj';

  let lines = await readObjFromFile(name);
  // ship to mirror shader
  shipShader = ship_shader();

  for (let i = 0; i < 5; i++) {
    // create trimesh vao object
    //const collectible = createObject(lines)
    // SHIP 2 MIRROR
    const collectible = createShipMirrorObject (lines, shipShader)
    collectibles.push(collectible)
    // create positions for collectible
    const center =  new Vector3 (collectible.centroid.x, collectible.centroid.y, collectible.centroid.z)
    let x = Math.random() * 1000
    let z = Math.random() * 1000
    let y = Math.random() * 200
    let position_point = new Vector3 (x, y, z)

    collectible.position_point = position_point
    let pos = Matrix4.translate(x, y, z)
    pos = pos.multiplyMatrix(Matrix4.scale(40, 40, 40))
    collectiblePositions.push(pos)
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
  for (let i = 0; i < collectibles.length; i++) {
    const collectible = collectibles[i]
    let pos = collectiblePositions[i]
    const centroid = collectible.centroid
    const center = new Vector3(centroid.x, 1, centroid.z)
    pos = pos.multiplyMatrix(Matrix4.rotateX (degrees * Math.random()))//Matrix4.rotateAroundAxis(center, degrees * Math.random()))
          .multiplyMatrix (Matrix4.rotateZ (degrees * Math.random()))
    collectiblePositions[i] = pos
  }
  // OFFSETS ON SCREEN
  let ship_offset_x = 17
  let ship_offset_z = 3.6
  let center = objects[0].centroid
  let ship = objects[0]
  // ships position
  let ship_position = camera.position
                      .add (camera.forward.scalarMultiply(ship_offset_x)
                      .add (camera.right.scalarMultiply (ship_offset_z)))
  
  ship.position_point = ship_position;
  objectPositions[0] = Matrix4.translate (ship_position.x, ship_position.y, 
                                          ship_position.z)
  if (checkCollision (ship)) {
    camera.end_point = camera.position
  }
  else
    camera.timeStepMove()
  render()
  requestAnimationFrame(rotateCollectibles)
}


function checkCollision (object) {
  let player_pos = object.position_point
  for (let i = 0; i < collectibles.length; i++) {
    let c_obj = collectibles[i]
    let c_pos = c_obj.position_point
    if (c_obj == null || c_pos == null) {
      console.log ("Bad obj in collision check")
      continue
    }
    
    let min = collectiblePositions[i].multiplyVector (c_obj.min)
    let max = collectiblePositions[i].multiplyVector (c_obj.max)
    if (player_pos.x >= min.x && player_pos.x <= max.x &&
        player_pos.y >= min.y && player_pos.y <= max.y &&
        player_pos.z >= min.z && player_pos.z <= max.z) {
      return true;
    }
  }
  return false;
}

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
  } if (event.key == 't') {
    doTrackball = true
  }
  render()
}
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
