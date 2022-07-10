``
import { VertexAttributes } from './vertex-attributes'
import { ShaderProgram } from './shader-program'
import { VertexArray } from './vertex-array'
import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'
import { Terrain } from './terrain'
import { Trimesh, TrimeshVao, TrimeshVaoGrouping, getGroupLength } from './trimesh'
import { Camera, SlideCamera } from './camera'
import { reserveDepthCubeTexture, initializeDepthProgram, createTexture2d, initializeDepthFbo, reserveDepthTexture} from './shadow'
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
let then = 0

let nums = ['1', '2', '3', '4', '5', '6', '7', '8']

// SKYBOX
let skyboxShaderProgram
let skyboxVao

// MIRROR SURFACE SHADER
let shipShader

// PLANETS / SUN
let solarsystem_scale = .01
let solarsystem_speed_scale = 1
let earth_index
let moon_index
let mecury_index
let venus_index
let mars_index
let juipter_index
let saturn_index 
let uranus_index 
let neptune_index 
// is theta used to calc earth position in rotation around sun
// SHADOW
let texturesFromWorld = []
let fbo
let depthProgram;
const textDim = 128;
let max_shadow_distance = 200000
let cube_shadow_map
let depth_buffer;

let lightPosition = new Vector3(0, 0, 0)
let lightTargets = []
let lightWorldUps = []
let lightTarget
let lightCamera;
let lightFromWorld;
let lightsFromWorld = []
let clipFromLight;


// LIGHT
let sun_index = 0  
let celestial_bodies_index

// BLING-FONG
const albedo = [.6, .6, .6]
const specularColor = [.3, .8, .9];
const diffuseColor = [.1, .6, .9];
const shininess = 80.0;
const ambientFactor = 0.7;

// OBJECTS
const interactables = [];

const objects = []
const objectPositions = []

// BOUNDINGBOXES
let show_hitboxes = false

// BOUND CAMERA
let bound_camera_mode = false
let bound_x = 0
let bound_y = 0
let bound_z = 0
let bound_radius = 1
let bound_vao_index
let bound_obj_index
let x_heading = 1
let y_heading = 1
let z_negative = 1

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
function render(k) {
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
  shaderProgram.setUniform3f('specularColor', specularColor[0], specularColor[1], specularColor[2])
  shaderProgram.setUniform3f('diffuseColor', diffuseColor[0], diffuseColor[1], diffuseColor[2])
  shaderProgram.setUniform1f('shininess', shininess)
  shaderProgram.setUniform1f('ambientFactor', ambientFactor)
  shaderProgram.setUniformMatrix4('clipFromEye', clipFromEye)
  shaderProgram.setUniformMatrix4('eyeFromWorld', camera.eyeFromWorld)
  shaderProgram.setUniformMatrix4('worldFromModel', Matrix4.identity())
  shaderProgram.setUniformMatrix4("textureFromWorld", texturesFromWorld[0]);
  shaderProgram.setUniform3fv ('lightWorldPosition', lightPosition)
  // RESET TEXTURE
  shaderProgram.setUniform1i('normTexture', 6);
  // DRAW HITBOXES IF OPTION SELECTED
  if (show_hitboxes)
  {
    gl.depthMask(false);
    shaderProgram.setUniform3f('specularColor', .2, .4, .3)
    shaderProgram.setUniform3f('diffuseColor', .6, .6, .3)
    shaderProgram.setUniform1f('shininess', 40)
    shaderProgram.setUniform1f('ambientFactor', .6)
    for (let i = 0; i < interactables.length; i++) {
      const interactable = interactables[i]
      for (let j = 0; j < interactable.num_objects; j++) {
        const bounding_box = interactable.bounding_box
        const pos = interactable.buildMatrix(j)//getMatrix (j)
        // SET AS ATTRIBUTE
        shaderProgram.setUniformMatrix4('worldFromModel', pos)
        bounding_box.vao.bind()
        bounding_box.vao.drawIndexed(gl.TRIANGLES)
        bounding_box.vao.unbind()
      }
    }
    gl.depthMask(true);
  }

  shaderProgram.setUniform3f('specularColor', .99, .99, .1)
  shaderProgram.setUniform3f('diffuseColor', .99, .99, .1)
  shaderProgram.setUniform1f('shininess', 30)
  shaderProgram.setUniform1f('ambientFactor', .99)
  shaderProgram.setUniform1i('normTexture', 3);
  
  let sun = interactables[celestial_bodies_index]
  let sun_position = sun.buildMatrix(sun_index)//getMatrix (celestial_bodies_index)
  shaderProgram.setUniformMatrix4 ('worldFromModel', sun_position)
  sun.vao.bind()
  sun.vao.drawIndexed (gl.TRIANGLES)
  sun.vao.unbind()
  

  shaderProgram.setUniform3f('specularColor', .8, .9, .1)
  shaderProgram.setUniform3f('diffuseColor', .9, .9, .9)
  shaderProgram.setUniform1f('shininess', 100000000)
  shaderProgram.setUniform1f('ambientFactor', .3)
  shaderProgram.setUniform1i("depthTexture", 0);
  //for (let k = 0; k < 6; k++) 
  //{
    shaderProgram.setUniformMatrix4("textureFromWorld", texturesFromWorld[0]);
    for (let i = 0; i < interactables.length; i++) {
      const interactable = interactables[i]
      interactable.vao.bind()
      for (let j = 0; j < interactable.num_objects; j++) {
        if (i == celestial_bodies_index && j == sun_index)
          continue
        if (i == 1)
          continue
        const pos = interactable.buildMatrix(j)
        // SET AS ATTRIBUTE
        shaderProgram.setUniformMatrix4('worldFromModel', pos)
        // sphere index
        if (i == celestial_bodies_index && j == earth_index)
          shaderProgram.setUniform1i('normTexture', 2);
        if (i == celestial_bodies_index && j == moon_index) {
          shaderProgram.setUniform1i('normTexture', 4);
        }
        if (i == celestial_bodies_index && j == mecury_index)
          shaderProgram.setUniform1i ('normTexture', 5)

        if (i == celestial_bodies_index && j == venus_index)
          shaderProgram.setUniform1i ('normTexture', 6)

        if (i == celestial_bodies_index && j == mars_index)
          shaderProgram.setUniform1i ('normTexture', 7) 
        if (i == celestial_bodies_index && j == juipter_index)
          shaderProgram.setUniform1i ('normTexture', 8)
        if (i == celestial_bodies_index && j == saturn_index)
          shaderProgram.setUniform1i ('normTexture', 9)
        if (i == celestial_bodies_index && j == uranus_index)
          shaderProgram.setUniform1i ('normTexture', 10)
        if (i == celestial_bodies_index && j == neptune_index)
          shaderProgram.setUniform1i ('normTexture', 11)
        interactable.vao.drawIndexed(gl.TRIANGLES)

      }
    interactable.vao.unbind() 
    }
  //}
  shaderProgram.unbind()
  if (!bound_camera_mode) {
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

  shipShader.unbind()
  }
}

// Shadow/Depths render function
function renderDepths(width, height, fbo) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  gl.viewport(0, 0, width, height);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  const clipFromWorld = clipFromLight.multiplyMatrix(lightsFromWorld[0]);
  depthProgram.bind();
  depthProgram.setUniformMatrix4('clipFromWorld', clipFromWorld);
  for (let i = 0; i < interactables; i++) {
    const interactable = interactables[i]
    for (let j = 0; j < interactable.num_objects; j++) {
      //if (i == celestial_bodies_index && j == sun_index)
        //continue
      const pos = interactable.buildMatrix(j)//.getMatrix (j)
      depthProgram.setUniformMatrix4('worldFromModel', pos)
      interactable.vao.bind()
      interactable.vao.drawIndexed(gl.TRIANGLES)
      interactable.vao.unbind()
    }
  }

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i]
    const pos = objectPositions[i]
    depthProgram.setUniformMatrix4('worldFromModel', pos)
    object.vao.bind()
    object.vao.drawIndexed(gl.TRIANGLES)
    object.vao.unbind()
  }

  depthProgram.unbind();

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function shadowMapPass (width, height, fbo) {

  for (let k = 0; k < 6; k++) {
    gl.bindFramebuffer (gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
       gl.TEXTURE_2D, depth_buffer, 0);
    gl.viewport (0,0, width, height)
    gl.clear (gl.DEPTH_BUFFER_BIT)
    const clipFromWorld = clipFromLight.multiplyMatrix(lightsFromWorld[5]);
    depthProgram.bind();
    depthProgram.setUniformMatrix4('clipFromWorld', clipFromWorld);
    for (let i = 0; i < interactables; i++) {
      const interactable = interactables[i]
      for (let j = 0; j < interactable.num_objects; j++) {
        if (i == celestial_bodies_index && j == sun_index)
          continue
        const pos = interactable.buildMatrix(j)//.getMatrix (j)
        depthProgram.setUniformMatrix4('worldFromModel', pos)
        interactable.vao.bind()
        interactable.vao.drawIndexed(gl.TRIANGLES)
        interactable.vao.unbind()
      }
    }

    for (let i = 0; i < objects.length; i++) {
      const object = objects[i]
      const pos = objectPositions[i]
      depthProgram.setUniformMatrix4('worldFromModel', pos)
      object.vao.bind()
      object.vao.drawIndexed(gl.TRIANGLES)
      object.vao.unbind()
    }
    depthProgram.unbind();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    render (k)
    
  }

}

/**
 * updates viewport to new window
 */
function onResizeWindow() {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
  clipFromEye = Matrix4.fovPerspective(45, canvas.width / canvas.height, 0.1, 
    1000000 * solarsystem_scale)
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
  //let val_buffer = reserveDepthCubeTexture (textDim, textDim, gl.TEXTURE0, gl.TEXTURE5) 
  //cube_shadow_map = val_buffer[0]//reserveDepthTexture (textDim, textDim, gl.TEXTURE0)
  depth_buffer = reserveDepthTexture (textDim, textDim, gl.TEXTURE0)//val_buffer[1]
  fbo = (initializeDepthFbo(depth_buffer))//val_buffer[0]
  depthProgram = initializeDepthProgram()


  // PLAYER CAMERA INIT
  const from = new Vector3(100, 100, 100)
  const to = new Vector3(0, 0, 0)
  const worldup = new Vector3(0, 1, 0)
  camera = new SlideCamera (from, to, worldup, .01)

  // SKYBOX INIT
  skyboxShaderProgram = skybox_shader_program()
  let skyboxAttributes = generateSkybox()
  skyboxVao = new VertexArray (skyboxShaderProgram, skyboxAttributes)
  let folder = './textures/'
  // SKYBOX TEXTURE 
  await loadCubemap ("./bkg/lightblue", "png", gl.TEXTURE1)
  // earth TEXTURE
  const earthImage = await readImage(folder+'earthmap1k.jpg')
  createTexture2d (earthImage, gl.TEXTURE2)
  // SUN teXTURE
  const sunImage = await readImage (folder+'sunmap.jpg')
  createTexture2d (sunImage, gl.TEXTURE3)

  const moonImage = await readImage (folder+'moon.png')
  createTexture2d (moonImage, gl.TEXTURE4)

  const mercImage = await readImage (folder+'mercurymap.jpg')
  createTexture2d (mercImage, gl.TEXTURE5)
  
  const venusImage = await readImage (folder+'venusmap.jpg')
  createTexture2d (venusImage, gl.TEXTURE6)

  const marsImage = await readImage (folder+'mars_1k_color.jpg')
  createTexture2d (marsImage, gl.TEXTURE7)

  const jupImage = await readImage (folder+'jupitermap.jpg')
  createTexture2d (jupImage, gl.TEXTURE8)
  const satImage = await readImage (folder+'saturnmap.jpg')
  createTexture2d (satImage, gl.TEXTURE9)
  const uraImage = await readImage (folder+'uranusmap.jpg')
  createTexture2d (uraImage, gl.TEXTURE10)
  const nepImage = await readImage (folder+'neptunemap.jpg')
  createTexture2d (nepImage, gl.TEXTURE11)

  const vertexSource = `
uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromModel;
uniform mat4 textureFromWorld;

in vec3 normal;
in vec3 position;
in vec2 texPosition;

out vec2 flat_mixTexPosition;
out vec3 mixNormal;
out vec3 mixPosition;
out vec4 mixTexPosition;
out vec4 worldPosition;

out mat4 clipeye;
out mat4 eyeworld;

void main() {
  worldPosition = worldFromModel * vec4(position, 1.0);
  gl_Position = clipFromEye * eyeFromWorld * worldPosition;
  mixNormal = (eyeFromWorld * worldFromModel * vec4(normal, 0)).xyz;
  mixPosition =  (eyeFromWorld * worldPosition).xyz;
  mixTexPosition = textureFromWorld * worldPosition;
  flat_mixTexPosition = texPosition;
  clipeye = clipFromEye;
  eyeworld = eyeFromWorld;
}
  `;

  const fragmentSource = `
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform vec3 lightWorldPosition;

uniform float shininess;
uniform float ambientFactor;


uniform sampler2D normTexture;
uniform sampler2D depthTexture;

in vec2 flat_mixTexPosition;
in vec3 mixNormal;
in vec4 worldPosition;
in vec3 mixPosition;
in vec4 mixTexPosition;

in mat4 clipeye;
in mat4 eyeworld;

out vec4 fragmentColor;

void main() {
  vec3 normal = normalize(mixNormal);
  vec4 test = eyeworld * vec4(lightWorldPosition,1);
  vec3 lightDirection = normalize (test.xyz - mixPosition);
  float litness = dot(normal, lightDirection);

  // get normal texture
  vec4 realTexture = texture(normTexture, flat_mixTexPosition);
  vec3 albedo = texture(normTexture, flat_mixTexPosition).rgb; //vec3 (0.6 ,0.7, 0.1);
  // calculate fragment depth and shadow
  vec4 texPosition = mixTexPosition / mixTexPosition.w;
  float fragmentDepth = texPosition.z - 0.0005;
  float closestDepth = texture(depthTexture, texPosition.xy).r;
  
  float percentage = 0.0;
  for (int y = -1; y <= 1; y += 1) {
    for (int x = -1; x <= 1; x += 1) {
      vec2 offset = vec2(x, y) / 256.0;
      vec2 neighborPosition = texPosition.xy + offset;
      float closestDepth = texture(depthTexture, neighborPosition).r;
      percentage += closestDepth < fragmentDepth ? 0.0 : 1.0;
    }
  }
  float shadowFactor = percentage / 9.0;

  // specular
  vec3 eyeDirection = normalize(-mixPosition);
  vec3 halfDirection = normalize(eyeDirection + lightDirection);
  float specularity = pow(max(0.0, dot(halfDirection, normal)), shininess);
  vec3 specular = specularity * specularColor;
  // ambient
  vec3 ambient = ambientFactor * albedo * diffuseColor;
  // diffuse
  vec3 diffuse = (1.0 - ambientFactor) * litness * albedo * diffuseColor * shadowFactor;
    //albedo * shadowFactor * litness;//
  //vec3 rgb = diffuse;
  
  vec3 rgb = ambient + diffuse + specular;
  fragmentColor = realTexture * vec4(rgb, 1.0); //vec4 (diffuse, 1.0);
}
  `;

  shaderProgram = new ShaderProgram(vertexSource, fragmentSource)
  vao = new VertexArray(shaderProgram, attributes)

  await initInteractables()
  await initializeObjects()

  //getTextFromWorld()


  window.addEventListener('resize', onResizeWindow)
  onResizeWindow()

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('pointerdown', () => {
    document.body.requestPointerLock()
  })
  window.addEventListener('pointermove', (event) => {
    if (document.pointerLockElement && !bound_camera_mode) {
      camera.yaw(-event.movementX * turnDelta)
      camera.pitch(-event.movementY * turnDelta)
    }
    else if (document.pointerLockElement && bound_camera_mode)
    {
      let scale = bound_radius * .001
      let new_x = bound_x + event.movementX * scale * x_heading
      let new_y = bound_y + event.movementY * scale * y_heading
      if (new_x*new_x + bound_y * bound_y >= bound_radius * bound_radius) {
        x_heading = x_heading * -1
      }
      if (new_y * new_y + bound_x * bound_x >= bound_radius*bound_radius) {
        y_heading = y_heading * -1
      }
      if (new_x * new_x + new_y*new_y > bound_radius * bound_radius) 
        z_negative = z_negative * -1
      bound_x += event.movementX * scale * x_heading
      bound_y +=  event.movementY * scale * y_heading
    }
  })

  onResizeWindow()
  rotateInteractables()
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
async function initInteractables() {
  // credit to ezgi bakim
  const name = './spaceship.obj';
  // CREATE SUN
  let offset = lightPosition
  celestial_bodies_index = 0
  let spheres = generateSphereObject (32, 32, 20, offset, 3, 10)
  spheres.setTranslation (sun_index, offset)
  spheres.setScale (sun_index, new Vector3 (109.29,109.29,109.29).scalarMultiply (solarsystem_scale))
  interactables.push (spheres)
  
  lightPosition = interactables[celestial_bodies_index].buildMatrix(sun_index)
    .multiplyVector (interactables[0].centroid).xyz

  /* 
  let lines = await readObjFromFile(name);
  shipShader = ship_shader();
  // CREATING INTERACTABLE OBJS
  let num_ships = 100
  const interactable = createShipMirrorObject (lines, shaderProgram, num_ships)
  for (let i = 0; i < num_ships; i++) {
    // SHIP 2 MIRROR
    // create positions for interactable
    let x = Math.random() * 4000 - 1500
    let z = Math.random() * 4000 - 1500
    let y = Math.random() * 4000 - 1500
    interactable.setTranslation (i, new Vector3 (x, y, z))
    interactable.setScale (i, new Vector3 (20,20,20))
    // FIND POSITION THAT DOES NOT LIE WITHIN OTHER OBJ
    while (checkObjectToObjectCollision (interactable, interactable.buildMatrix (i)) 
        && i != 0) {
      x = Math.random() * 4000 - 1500
      z = Math.random() * 4000 - 1500
      y = Math.random() * 4000 - 1500
      interactable.setTranslation (i, new Vector3 (x, y, z))
      console.log ("retrying to place obj due to collision")
    }
  }
  interactables.push(interactable)
  */
  // SET EARTH IN PLANET TRI VAO GROUP
  let planets = interactables[celestial_bodies_index]
  earth_index = sun_index + 1
  let rotation = new Vector3 (0, 0, 23.5)
  setTriVaoGroupObj (celestial_bodies_index, earth_index, 
    1, offset, rotation, 23872, .00273, 1)
  // GENERATE MOON
  moon_index = earth_index + 1
  rotation = new Vector3 (0, 0, 1.5)
  setTriVaoGroupObj (celestial_bodies_index, moon_index, 
    .2727, offset, rotation, 356, .0366, .0339)
  // GENERATE MECURY
  mecury_index = moon_index + 1
  rotation = new Vector3 (0, 0, 2)
  setTriVaoGroupObj (celestial_bodies_index, mecury_index, 
    .383, offset, rotation, 9093, .0114, .0057)
  // GENERATE VENUS
  venus_index = mecury_index + 1
  rotation = new Vector3 (0, 0, 3)
  setTriVaoGroupObj (celestial_bodies_index, venus_index, 
    .95, offset, rotation, 17003, .0045, .0086)
  // GENERATE MARS
  mars_index = venus_index + 1
  rotation = new Vector3 (0, 0, 25.19)
  setTriVaoGroupObj (celestial_bodies_index, mars_index, .532, offset,
     rotation, 32657, .0015, .972)
  // GENERATE JUIPTER
  juipter_index = mars_index + 1
  rotation = new Vector3 (0, 0, 3.13)
  setTriVaoGroupObj (celestial_bodies_index, juipter_index,  11.21, offset,
     rotation, 116549, .00023, 2.424)
  // GENERATE SATURN
  saturn_index = juipter_index + 1
  rotation = new Vector3 (0, 0, 26.73)
  setTriVaoGroupObj (celestial_bodies_index, saturn_index, 
    9.45, offset, rotation, 231608, 0.000093, 2.243)
  // GENERATE  URANUS
  uranus_index = saturn_index + 1
  rotation = new Vector3 (0, 0, 82.23)
  setTriVaoGroupObj (celestial_bodies_index, uranus_index, 
    3.98, offset, rotation, 462338, .000033, 1.4)
  // GENERATE NEPTUNE
  neptune_index = uranus_index + 1
  rotation = new Vector3 (0, 0, 28.32)
  setTriVaoGroupObj (celestial_bodies_index, neptune_index, 
    3.86, offset, rotation, 702222, .000017, 1.491)
  // GENERATE HITBOXES
  generateVisualHitBoxes()

}

/**
 * constructs 1 obj in trivao grouping.
 * @param {int} group_index 
 * @param {int} obj_index 
 * @param {float} scale
 * @param {vec3} translation 
 * @param {vec3} rotation 
 * @param {float} radius 
 * @param {float} orbit_speed 
 * @param {float} rotation_speed 
 */
function setTriVaoGroupObj (group_index, obj_index, scale, translation, rotation,
   radius, orbit_speed, rotation_speed) {
    let group = interactables[group_index]
    group.setScale (obj_index, new Vector3 (scale, scale, scale).scalarMultiply (solarsystem_scale))
    group.setTranslation (obj_index, translation)
    group.setRotationX (obj_index, rotation.x)
    group.setRotationY (obj_index, rotation.y)
    group.setRotationZ (obj_index, rotation.z)
    group.setRadius (obj_index, radius)
    group.setOrbitSpeed (obj_index, orbit_speed)
    group.setRotationSpeed (obj_index, rotation_speed)
    //group.setOrbitTheta (obj_index, 2 * Math.PI * Math.random())
   }

/**
 * Generates an physical physical sphere obejct
 * @param {float} nlat 
 * @param {float} nlong 
 * @param {float} radius 
 * @param {vec3} offest
 * @param {bool} doTexture
 * @param {int} num_spheres
 */
function generateSphereObject (nlat, nlong, radius, offset, texture_index, num_spheres) {
  let sphere_attributes_arr = generateSphere (nlat, nlong, radius)
  let sPos = sphere_attributes_arr[0]
  let sNor = sphere_attributes_arr[1]
  let sInd = sphere_attributes_arr[2]
  let sTex = sphere_attributes_arr[3]
  //let sphere_trivao = new TrimeshVao (sPos, sNor, sInd, null, sTex)
  let sphere_trivao = new TrimeshVaoGrouping (sPos, sNor, sInd, null, sTex, texture_index, num_spheres)
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
  return sphere_trivao
}

/**
 * Generates visual representations of hitboxes around interactable objects
 */
function generateVisualHitBoxes () {
  for (let i = 0; i < interactables.length; i++) {
    let c_obj = interactables[i]
    if (c_obj == null) {
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
    // ADD TO BOUNDING BOX ARRAYS
    c_obj.setBoundingBox(cube_trivao)
  }
}


/**
 * Creates and return an trimeshVao from inputed shader
 * @param {*} lines 
 * @param {*} ship_shader 
 * @returns 
 */
function createShipMirrorObject (lines, ship_shader, num_objs) {
  let obj_trimesh = Trimesh.readObjToJson(lines)
  let obj_attributes = new VertexAttributes()
  let positions = obj_trimesh.flat_positions()
  let normals = obj_trimesh.flat_normals()
  let indices = obj_trimesh.flat_indices()
  obj_attributes.addAttribute('position', positions.length / 3, 3, positions)
  obj_attributes.addAttribute('normal',   normals.length   / 3, 3, normals)
  obj_attributes.addIndices   (indices)
  let obj_vao = new VertexArray(ship_shader, obj_attributes)
  let tri_vao_group = new TrimeshVaoGrouping  (obj_trimesh.positions,
      obj_trimesh.normals, obj_trimesh.indices, 
      obj_vao, null, null, num_objs)
  return tri_vao_group
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
function rotateInteractables(now) {
  // CHECK GRAVITY
  let ship = objects[0]
  let ship_distance = checkSphereDistance (ship, objectPositions[0]);
  if (ship_distance <= 2000 && ship_distance >= 20)  {
    // MOVE PLAYER WITH FORCE OF GRAVITY
    // calculate force of gravity
    let force = forceOfGravity (ship_distance, 100000)
    // calculate unit vector between pointing from ship to sphere
    // B - A / | B - A |
    let sphere = interactables[celestial_bodies_index]
    let sphere_center = sphere.buildMatrix (earth_index).multiplyVector (sphere.centroid).xyz
    let ship_center = objectPositions[0].multiplyVector (ship.centroid).xyz
    let gravity_direction = sphere_center.add(ship_center.inverse())
                            .normalize().scalarMultiply(force)
    camera.end_point = camera.end_point.add (gravity_direction)
  }

  // MOVE EARTH AROUND SUN
  let sun_center = lightPosition
  let earth = interactables[celestial_bodies_index]
  rotateAroundBody (interactables[celestial_bodies_index], earth_index, sun_center)
  
  // HAVE LIGHT FACE EARTH
  let earth_position = earth.buildMatrix (earth_index)
  let earth_center = earth_position.multiplyVector (earth.centroid)
  
  lightTarget = earth_center.xyz
  // MOVE MOON AROUND EARTH
  // *** NOTE: Make sure to tilt moon axis o rotation 6.whatever degrees ***
  rotateAroundBody (interactables[celestial_bodies_index], moon_index, earth_center)
  // MOVE MECURY AROUND SUN
  rotateAroundBody (interactables[celestial_bodies_index], mecury_index, sun_center)
  // MOVE VENUS AROUND SUN
  rotateAroundBody (interactables[celestial_bodies_index], venus_index, sun_center)
  // MOVE MARS AROUND SUN
  rotateAroundBody (interactables[celestial_bodies_index], mars_index, sun_center)
  // MOVE JUIPTER AROUND EARTH
  rotateAroundBody (interactables[celestial_bodies_index], juipter_index, sun_center)
  // MOVE SATURN AROUND EARTH
  rotateAroundBody (interactables[celestial_bodies_index], saturn_index, sun_center)
  // MOVE URANUS AROUND EARTH
  rotateAroundBody (interactables[celestial_bodies_index], uranus_index, sun_center)
  // MOVE NEPTUNE AROUND EARTH
  rotateAroundBody (interactables[celestial_bodies_index], neptune_index, sun_center)

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
    for (let i = 0; i < interactables.length; i++) {
      const interactable = interactables[i]
      for (let j = 0; j < interactable.num_objects; j++) {
        if (i == celestial_bodies_index && j == sun_index)
          continue
        else if (i == celestial_bodies_index) {
          interactable.addToRotationY (j,
            interactable.getRotationSpeed(j) * solarsystem_speed_scale)
        }
        else
          interactable.addToRotationY (j, .1)
      }
    }
  }

  // LOG FPS
  now *= 0.001;                          // convert to seconds
  const deltaTime = now - then;          // compute time since last frame
  then = now;                            // remember time for next frame
  const fps = 1 / deltaTime;             // compute frames per second
  if (fps < 29)
    console.log (fps)
  // RENDER AND REQUEST 2 DRAW
  getTextFromWorld ()
  renderDepths(textDim, textDim, fbo)
  render()
  requestAnimationFrame(rotateInteractables)
}


/**
 * checks for distance between points in 3d space
 * @param {Trimesh} object 
 * @param {Matrix4} o_pos
 * @returns 
 */
function checkSphereDistance (object, o_pos) {
  let sphere = interactables[celestial_bodies_index]
  let s_pos = sphere.buildMatrix(earth_index)//.getMatrix (earth_index)

  let s_point = s_pos.multiplyVector (sphere.centroid)
  let o_point = o_pos.multiplyVector (object.centroid)
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
  return 0
  let force = 1/Math.pow(distance,2) * mass_impact
  return force
} 

/**
 * rotates object around center body
 * @param {TrimeshVaoGrouping} vao_group 
 * @param {int} index 
 * @param {float} radius 
 * @param {float} theta 
 * @param {vec3} rotation_center 
 */
function rotateAroundBody (vao_group, index, rotation_center) {
  let scaled_radius = vao_group.getRadius(index) * solarsystem_scale
  let theta = vao_group.getOrbitTheta(index)
  let new_x = Math.cos (theta) * scaled_radius
  let new_z = Math.sin (theta) * scaled_radius
  let new_pos = new Vector3 (new_x, 0, new_z)
  new_pos = new_pos.add (rotation_center)
  vao_group.setTranslation (index, new_pos)
  vao_group.addToOrbitTheta (index,
    vao_group.getOrbitSpeed(index) * solarsystem_speed_scale * (Math.PI / 180))

    if (bound_camera_mode && bound_obj_index == index) {  
      //bound_y = -1
        if (bound_x * bound_x + bound_y * bound_y >= bound_radius * bound_radius) {
          console.log ("SHITS FUCKED")
          //bound_x += .01 * x_heading
        }
        bound_z = Math.sqrt (bound_radius*bound_radius - bound_x*bound_x - bound_y*bound_y) * z_negative
        let move_sphere =  new Vector3 (-bound_x, -bound_y, -bound_z)
        console.log ("sphere= "+move_sphere)
        console.log ("eq= rad(" + (bound_radius*bound_radius) + " - " + (bound_x * bound_x) + " - " + bound_y*bound_y+")")
        console.log ("x= "+bound_x*-1)
        console.log ("y= "+bound_y*-1)
        console.log ("z= "+bound_z*-1)
        console.log ("_____________________________________")

        let center = vao_group.buildMatrix (index).multiplyVector (vao_group.centroid).xyz
        let p_position = move_sphere.add (center)

        camera = new SlideCamera (p_position, center, new Vector3 (0,1,0), .01)
    }

}


/**
 * Checks if an inputed object is within an unaligned bounding box
 *  of any iterable object
 * @param {*} object 
 * @returns 
 */
function checkCollision (object) {
  for (let i = celestial_bodies_index + 1; i < interactables.length; i++) {
    const interactable = interactables[i]
    for (let j = 0; j < interactable.num_objects; j++) {
      let c_obj = interactable
      let c_hitbox = interactable.getBoundingBox()
      let pos = interactable.buildMatrix(j)//.getMatrix(j)
      if (c_obj == null || c_hitbox == null) {
        console.log ("Bad obj in collision check")
        continue
      }
      // GET WORLD POSITION OF CENTER OF BB
      let center = pos.multiplyVector (c_hitbox.centroid)
      // THE MIN TEST POINT OF OTHER BB
      let p_pos_min = objectPositions[0].multiplyVector (object.min).xyz
      // GET VECTOR FROM POSITION 2 CENTER
      let proj_vec_min = p_pos_min.sub (center)

      // SHIFT POINTS TO WORLD SPACE
      let pos_0 = pos.multiplyVector (c_hitbox.positions[0]).xyz
      let pos_1 = pos.multiplyVector (c_hitbox.positions[1]).xyz
      let pos_2 = pos.multiplyVector (c_hitbox.positions[2]).xyz
      let pos_4 = pos.multiplyVector (c_hitbox.positions[4]).xyz

      // GET LENGTH OF X, Y, AND Z PERIMTERES
      let ad = pos_1.sub (pos_0)
      let cd = pos_2.sub (pos_0)
      let hd = pos_4.sub (pos_0)
      let x_length = Math.sqrt (ad.x*ad.x + ad.y*ad.y + ad.z*ad.z)
      let y_length = Math.sqrt (cd.x*cd.x + cd.y*cd.y + cd.z*cd.z)
      let z_length = Math.sqrt (hd.x*hd.x + hd.y*hd.y + hd.z*hd.z)

      // GET local unit vectors
      let x_local = pos_1.sub (pos_0).scalarMultiply (1/x_length)
      let y_local = pos_2.sub (pos_0).scalarMultiply (1/y_length)
      let z_local = pos_4.sub (pos_0).scalarMultiply (1/z_length)
      // CREATE what the adjusted xyz pos is
      let point_x = Math.abs (x_local.dot (proj_vec_min) * 2)
      let point_y = Math.abs (y_local.dot (proj_vec_min) * 2)
      let point_z = Math.abs (z_local.dot (proj_vec_min) * 2)
      // COMPARE with world length
      if (point_x <= x_length && point_y <= y_length && point_z <= z_length)
        return true
      
      // NOW try objects max point
      
      let p_pos_max = objectPositions[0].multiplyVector (object.max).xyz
      let proj_vec_max = p_pos_max.sub (center)
      point_x = Math.abs (x_local.dot (proj_vec_max) * 2)
      point_y = Math.abs (y_local.dot (proj_vec_max) * 2)
      point_z = Math.abs (z_local.dot (proj_vec_max) * 2)
      if (point_x <= x_length && point_y <= y_length && point_z <= z_length)
        return true
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
  for (let i = 0; i < interactables.length - 1; i++) {
    const interactable = interactables[i]
    for (let j = 0; j < interactable.num_objects; j++) {
      let c_obj = interactable
      let c_pos = interactable.buildMatrix(j)//.getMatrix (j)
      if (c_obj == null) {
        console.log ("Bad obj in collision check")
        continue
      }
      let c_min = c_pos.multiplyVector (c_obj.min)
      let c_max = c_pos.multiplyVector (c_obj.max)
      let p_max = pos_mat.multiplyVector (input_obj.max)
      let p_min = pos_mat.multiplyVector (input_obj.min)

      if  ((p_min.x <= c_max.x && p_max.x >= c_min.x)
        && (p_min.y <= c_max.y && p_max.y >= c_min.y) 
        && (p_min.z <= c_max.z && p_max.z >= c_min.z)) {
        return true;
      }
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
    camera.advance (40)
    camera.end_point = camera.position
  } if (event.key == 'l')
    console.log ("playerpos=" +camera.position)
  // teleports to planets with # key, corresponding to planet position 2 sun
  if (event.key == '3') {
    teleportToObject (celestial_bodies_index, earth_index)
    if (bound_camera_mode && bound_obj_index == moon_index)
    {
      bound_camera_mode = false
      return
    }
    if (bound_camera_mode && bound_obj_index == earth_index) {
      bound_obj_index = moon_index
      bound_radius = 1 + .2727
      bound_x = 0
      bound_y = 0
      return
    }

    bound_camera_mode = true
    bound_radius = 1.5 + 1 
    bound_vao_index = celestial_bodies_index
    bound_obj_index = earth_index
  } if (event.key == '1') {
    teleportToObject (celestial_bodies_index, mecury_index)

    if (bound_camera_mode && bound_obj_index == mecury_index) {
      bound_camera_mode = false
      return
    }
    bound_camera_mode = true
    bound_radius = 1.5 + .383 
    bound_vao_index = celestial_bodies_index
    bound_obj_index = mecury_index
  }
  if (event.key == '2') {
    teleportToObject (celestial_bodies_index, venus_index)
    if (bound_camera_mode && bound_obj_index == venus_index) {
      bound_camera_mode = false
      return
    }
    bound_camera_mode = true
    bound_radius = 1.5 + .95 
    bound_vao_index = celestial_bodies_index
    bound_obj_index = venus_index
  }
  if (event.key == '4') {
    teleportToObject (celestial_bodies_index, mars_index)
    if (bound_camera_mode && bound_obj_index == mars_index) {
      bound_camera_mode = false
      return
    }
    bound_camera_mode = true
    bound_radius = 1.5 + .532
    bound_vao_index = celestial_bodies_index
    bound_obj_index = mars_index
  }
  if (event.key == '5') {
    teleportToObject (celestial_bodies_index, juipter_index)
    if (bound_camera_mode && bound_obj_index == juipter_index) {
      bound_camera_mode = false
      return
    }
    bound_camera_mode = true
    bound_radius = 1.5 + 11.21
    bound_vao_index = celestial_bodies_index
    bound_obj_index = juipter_index
  }
  if (event.key == '6') {
    teleportToObject (celestial_bodies_index, saturn_index)
    if (bound_camera_mode && bound_obj_index == saturn_index) {
      bound_camera_mode = false
      return
    }
    bound_camera_mode = true
    bound_radius = 1.5 + 9.45
    bound_vao_index = celestial_bodies_index
    bound_obj_index = saturn_index
  }
  if (event.key == '7') {
    teleportToObject (celestial_bodies_index, uranus_index)
    if (bound_camera_mode && bound_obj_index == uranus_index) {
      bound_camera_mode = false
      return
    }
    bound_camera_mode = true
    bound_radius = 1.5 + 3.98
    bound_vao_index = celestial_bodies_index
    bound_obj_index = uranus_index
  }
  if (event.key == '8') {
    teleportToObject (celestial_bodies_index, neptune_index)
    if (bound_camera_mode && bound_obj_index == neptune_index) {
      bound_camera_mode = false
      return
    }
    bound_camera_mode = true
    bound_radius = 1.5 + 3.86
    bound_vao_index = celestial_bodies_index
    bound_obj_index = neptune_index
  }

  if (nums.includes (event.key)) {
    bound_x = 0
    bound_y = 0
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

function teleportToObject (vaogroup_index, obj_index, 
  offset = new Vector3 (-10, 50, 20)) {
    let group = interactables[vaogroup_index]
    let target = group.buildMatrix(obj_index).multiplyVector (group.centroid).xyz
    let position = offset.add (target)
    camera = new SlideCamera (position, target, new Vector3 (0,1,0), .1)   
}

/**
 * Generates light targets for shadows
 */
function generateLightCameras () {
  // x+
  let lp = lightPosition
  lightTargets.push (new Vector3 (lp.x + max_shadow_distance, lp.y, lp.z))
  lightWorldUps.push (new Vector3 (0, 1, 0))
  // x-
  lightTargets.push (new Vector3 ( lp.x - max_shadow_distance, lp.y, lp.z))
  lightWorldUps.push (new Vector3 (0, -1, 0))

  // y+
  lightTargets.push (new Vector3 ( lp.x, lp.y + max_shadow_distance, lp.z))
  lightWorldUps.push (new Vector3 (0, 0, -1))
  // y-
  lightTargets.push (new Vector3 ( lp.x, lp.y - max_shadow_distance, lp.z))
  lightWorldUps.push (new Vector3 (0, 0, 1))

  // z+
  lightTargets.push (new Vector3 ( lp.x, lp.y, lp.z + max_shadow_distance))
  lightWorldUps.push (new Vector3 (0, 1, 0))
  // z-
  lightTargets.push (new Vector3 ( lp.x, lp.y, lp.z - max_shadow_distance))
  lightWorldUps.push (new Vector3 (0, 1, 0))
}


/**
 * Shadows init
 */
function getTextFromWorld () {
  //generateLightCameras()
  clipFromLight = Matrix4.fovPerspective(90, 1, .1, max_shadow_distance);
  for (let i = 0; i < 6; i++) {
    if (i > 0)
      continue
    lightCamera = new Camera(lightPosition, lightTarget, new Vector3 (0,1,0))//lightTargets[i], lightWorldUps[i]);
    if (lightsFromWorld.length == 0)
      lightsFromWorld.push( lightCamera.eyeFromWorld);
    else
      lightsFromWorld[0] = lightCamera.eyeFromWorld
    const matrices = [
      Matrix4.translate(0.5, 0.5, 0.5),
      Matrix4.scale(0.5, 0.5, 0.5),
      clipFromLight,
      lightsFromWorld[0],
    ];
    if (texturesFromWorld.length == 0)
      texturesFromWorld.push( matrices.reduce((accum, transform) => accum.multiplyMatrix(transform)));
    else
      texturesFromWorld[0] = matrices.reduce((accum, transform) => accum.multiplyMatrix(transform));

  }
}


window.addEventListener('load', initialize)
