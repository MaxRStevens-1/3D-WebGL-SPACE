``
import { VertexAttributes } from './vertex-attributes'
import { ShaderProgram } from './shader-program'
import { VertexArray } from './vertex-array'
import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'
import { PlayerObject } from './player'
import { Trimesh, TrimeshVao, TrimeshVaoGrouping } from './trimesh'
import { Camera, SlideCamera, BoundCamera } from './camera'
import { initializeDepthProgram, createTexture2d, initializeDepthFbo, reserveDepthTexture} from './shadow'
import { generateCube} from './box_gen'
import { generateSkybox, loadCubemap, skybox_shader_program, ship_shader} from './skybox'
import { checkSphereDistance, generateSphereObject } from './sphere.js'
import { SpaceObject, parseSolarMap, setSatelliteHashTable } from './SpaceObject.js'
import { readObjFromFile, readImage } from './fileHelper'
import { gravityUpdate } from './gravity'


let canvas
let attributes
let shaderProgram
let vao
let clipFromEye
let camera
let camera_slide_theta = .01
let turnDelta = 1
let then = 0
let EARTH_RADIUS = 3958.8

// SKYBOX
let skyboxShaderProgram
let skyboxVao

// PLANETS / SUN
let solarsystem_scale = 1
let relative_planet_size = 1
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

// MIRROR SURFACE SHADER
let shipShader
let ship_scale = .01 * solarsystem_scale * relative_planet_size
let player
let moveDelta = 1 * solarsystem_speed_scale * solarsystem_scale

// SHADOW
let texturesFromWorld = []
let fbo
let depthProgram;
const textDim = 512;
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

// OBJECTS
const interactables = [];
const objects = []
const player_index = 0
// BOUNDINGBOXES
let show_hitboxes = false

// BOUND CAMERA
let bound_camera_mode = false
let bound_camera
let bound_object_iterator
let bound_parent_index


// KEYPRESSES
let keysPressed = {
  a: false,
  s: false,
  d: false,
  w: false,
  up: false,
  down: false,
};

// SOI indicator
let draw_soi_spheres = false
// FPS speed scaling
let fps_scaling = 1
let ideal_fps = 60
// Global Offset Variables
let global_translation_offset = new Vector3 (0,0,0)

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
  shaderProgram.setUniform3f('specularColor', 0, 0, 0)
  shaderProgram.setUniform3f('diffuseColor', 0, 0, 0)
  shaderProgram.setUniform1f('shininess', 80)
  shaderProgram.setUniform1f('ambientFactor', .4)
  shaderProgram.setUniformMatrix4('clipFromEye', clipFromEye)
  shaderProgram.setUniformMatrix4('eyeFromWorld', camera.eyeFromWorld)
  shaderProgram.setUniformMatrix4('worldFromModel', Matrix4.identity())
  shaderProgram.setUniformMatrix4("textureFromWorld", texturesFromWorld[0]);
  shaderProgram.setUniform3fv ('lightWorldPosition', lightPosition)
  // RESET TEXTURE
  shaderProgram.setUniform1i('normTexture', 0);
  //shaderProgram.setUniform1i ('do_simple_draw', 1)
  //shaderProgram.setUniform1i ('do_simple_draw', 0)
  gl.depthMask(false);
  if (show_hitboxes)
  {
    shaderProgram.setUniform3f('diffuseColor', 1, 0, 0)
    for (let i = 0; i < interactables.length; i++) {
      const interactable = interactables[i]
      for (let j = 0; j < interactable.num_objects; j++) {
        const bounding_box = interactable.bounding_box
        bounding_box.vao.bind()
        const pos = interactable.buildMatrixOtherTranslation(j, global_translation_offset)
        shaderProgram.setUniformMatrix4('worldFromModel', pos)
        bounding_box.vao.drawIndexed(gl.TRIANGLES)
        bounding_box.vao.unbind()

      }
    }
  }
  gl.depthMask(true);

  let sphere_vao = interactables[celestial_bodies_index]
  if (draw_soi_spheres) {
    sphere_vao.vao.bind()
    shaderProgram.setUniform3f('diffuseColor', .627, .125, .947)
    let sun_object = interactables[celestial_bodies_index].getObject(sun_index)
    let iterator = sun_object[Symbol.iterator]()
    let result = iterator.next()
    let ship_pos = player.trivao.buildMatrix(player.index)
    let ship_center = ship_pos.multiplyVector(player.centroid).xyz

    while (!result.done) {
      let current_obj = result.value
      let index = current_obj.index
      if (current_obj.soi <= 0 )
        continue
      let distance = checkSphereDistance (index, ship_center, sphere_vao, global_translation_offset)
      //if (distance > 4000 * solarsystem_scale)
      //  shaderProgram.setUniform1i ('do_simple_draw', 1)
      //else
      //  shaderProgram.setUniform1i ('do_simple_draw', 0)
      let cur_scale = sphere_vao.scales[index]
      let cur_rot = sphere_vao.rotations[index]
      let cur_tran = sphere_vao.translations[index]
      sphere_vao.scales[index] = new Vector3(0,0,0).addConstant(current_obj.soi)
      sphere_vao.rotations[index] = new Vector3 (0,0,0)
      let mat = sphere_vao.buildMatrix(index)
      sphere_vao.translations[index] = cur_tran.add(cur_tran
        .sub (mat.multiplyVector(sphere_vao.centroid).xyz))
      mat = sphere_vao.buildMatrixOtherTranslation(index, global_translation_offset)
      shaderProgram.setUniformMatrix4 ('worldFromModel', mat)
      sphere_vao.vao.drawIndexed(gl.TRIANGLES)
      sphere_vao.scales[index] = cur_scale
      sphere_vao.rotations[index] = cur_rot
      sphere_vao.translations[index] = cur_tran
      result = iterator.next()
    }
    sphere_vao.vao.unbind()
  }


  //shaderProgram.setUniform1i ('do_simple_draw', 0)
  shaderProgram.setUniform3f('specularColor', .99, .99, .1)
  shaderProgram.setUniform3f('diffuseColor', .99, .99, .1)
  shaderProgram.setUniform1f('shininess', 100000000000000)
  shaderProgram.setUniform1f('ambientFactor', .99)
  shaderProgram.setUniform1i('normTexture', interactables[celestial_bodies_index].getTextureIndex(sun_index));
  let sun_position = sphere_vao.buildMatrixOtherTranslation(sun_index, global_translation_offset)
  shaderProgram.setUniformMatrix4 ('worldFromModel', sun_position)
  sphere_vao.vao.bind()
  sphere_vao.vao.drawIndexed (gl.TRIANGLES)
  sphere_vao.vao.unbind()

  shaderProgram.setUniform3f('specularColor', .8, .9, .1)
  shaderProgram.setUniform3f('diffuseColor', .9, .9, .9)
  shaderProgram.setUniform1f('shininess', 1000000000000)
  shaderProgram.setUniform1f('ambientFactor', .3)
  shaderProgram.setUniform1i("depthTexture", 0);
    shaderProgram.setUniformMatrix4("textureFromWorld", texturesFromWorld[0]);
    for (let i = 0; i < interactables.length; i++) {
      const interactable = interactables[i]
      interactable.vao.bind()
      for (let j = 0; j < interactable.num_objects; j++) {
        if (i == celestial_bodies_index && j == sun_index)
          continue
        if (i == 1)
          continue
        const pos = interactable.buildMatrixOtherTranslation(j, global_translation_offset)
        const texture_index = interactable.getTextureIndex (j)
        // SET AS ATTRIBUTE
        shaderProgram.setUniformMatrix4('worldFromModel', pos)
        // sphere index
        /*if (i == celestial_bodies_index && j == earth_index)
          shaderProgram.setUniform1i('normTexture', 2);
        if (i == celestial_bodies_index && j == moon_index)
          shaderProgram.setUniform1i('normTexture', 4);
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
          shaderProgram.setUniform1i ('normTexture', 11)*/
        if (i == celestial_bodies_index) 
        {
          shaderProgram.setUniform1i ('normTexture', texture_index)
        }
        interactable.vao.drawIndexed(gl.TRIANGLES)

      }
    interactable.vao.unbind() 
    }
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
      object.vao.bind()
      for (let j = 0; j < object.num_objects; j++) {
        const pos = object.buildMatrix(j);
        // SET AS ATTRIBUTE
        shipShader.setUniformMatrix4('worldFromModel', pos)
        object.vao.drawIndexed(gl.TRIANGLES)
      }
      object.vao.unbind()
    }

  shipShader.unbind()
  }
}

/**
 * Rendering depth of current scene onto an frame buffer object.
 * @param {int} width 
 * @param {int} height 
 * @param {FrameBufferObject} fbo 
 */
function renderDepths(width, height, fbo) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  gl.viewport(0, 0, width, height);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  const clipFromWorld = clipFromLight.multiplyMatrix(lightsFromWorld[0]);
  depthProgram.bind();
  depthProgram.setUniformMatrix4('clipFromWorld', clipFromWorld);
  for (let i = 0; i < interactables; i++) {
    const interactable = interactables[i]
    interactable.vao.bind()
    for (let j = 0; j < interactable.num_objects; j++) {
      //if (i == celestial_bodies_index && j == sun_index)
        //continue
      const pos = interactable.buildMatrixOtherTranslation(j, global_translation_offset)
      depthProgram.setUniformMatrix4('worldFromModel', pos)
      interactable.vao.drawIndexed(gl.TRIANGLES)
    }
    interactable.vao.unbind()
  }

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i]
    object.vao.bind()
    for (let j = 0; j < object.num_objects; j++) {
      const pos = object.buildMatrix(j)
      depthProgram.setUniformMatrix4('worldFromModel', pos)
      object.vao.drawIndexed(gl.TRIANGLES)
    }
    object.vao.unbind()
  }

  depthProgram.unbind();

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/**
 * Renders scene into an cube map depth buffer.
 * @param {int} width 
 * @param {int} height 
 * @param {FrameBufferObject} fbo 
 */
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
        const pos = interactable.buildMatrix(j)
        depthProgram.setUniformMatrix4('worldFromModel', pos)
        interactable.vao.bind()
        interactable.vao.drawIndexed(gl.TRIANGLES)
        interactable.vao.unbind()
      }
    }

    for (let i = 0; i < objects.length; i++) {
      object.vao.bind()
      for (let j = 0; j < objects.num_objects; j++) {
        const object = objects[i]
        const pos = object.buildMatrix(j)
        depthProgram.setUniformMatrix4('worldFromModel', pos)
        object.vao.drawIndexed(gl.TRIANGLES)
      }
      object.vao.unbind()
    }
    depthProgram.unbind();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    render (k)
    
  }

}

/**
 * updates viewport to new window.
 */
function onResizeWindow() {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
  clipFromEye = Matrix4.fovPerspective(45, canvas.width / canvas.height, 0.01 * solarsystem_scale, 
    10000000 * solarsystem_scale)
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
  depth_buffer = reserveDepthTexture (textDim, textDim, gl.TEXTURE0)
  fbo = (initializeDepthFbo(depth_buffer))
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
  // BODY TEXTURES

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

#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

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

  if (false) {
    fragmentColor = vec4(diffuseColor, 1.0); 
    return;
  }

  vec3 normal = normalize(mixNormal);
  vec4 lightEyePosition = eyeworld * vec4(lightWorldPosition,1);
  vec3 lightDirection = normalize (lightEyePosition.xyz - mixPosition);
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
      vec2 offset = vec2(x, y) / 512.0;
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
  vec3 rgb = ambient + diffuse + specular;
  fragmentColor = realTexture * vec4(rgb, 1.0); 
}
  `;

  shaderProgram = new ShaderProgram(vertexSource, fragmentSource)
  vao = new VertexArray(shaderProgram, attributes)

  await initializeObjects()

  await initInteractables()



  window.addEventListener('resize', onResizeWindow)
  onResizeWindow()

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('pointerdown', () => {
    document.body.requestPointerLock()
  })
  window.addEventListener('pointermove', (event) => {
    if (document.pointerLockElement && !bound_camera_mode) {
      //camera.yaw(-event.movementX * turnDelta)
      //camera.pitch(-event.movementY * turnDelta)
      let rotation = new Vector3 (0,0,0)
      if (Math.abs(player.current_rotation.x - event.movementY * turnDelta *.5) < 71.5)
        rotation.set (0, -event.movementY * turnDelta * .5)
      else if (player.current_rotation.x > 0)
        player.maxValueRotationXReached(71.5)
      else
        player.maxValueRotationXReached (-71.5)
      rotation.set (1, event.movementX * turnDelta *.5)
      player.addRotation (rotation)
    }
    else if (document.pointerLockElement && bound_camera_mode)
    {
      bound_camera.mouseBoundSphereUpdate (event.movementX, event.movementY)
    }
  })

  onResizeWindow()
  updateEverything()
}

/**
 * Initalize player object
 */
async function initializeObjects() {
  // ***** NOTE ******
  // Ship from https://sketchfab.com/3d-models/mother-spaceship-9e0e86c41ed24676a7c8b25fdfa002c0

  // GENERATE PLAYER OBJECT
  shipShader = ship_shader();
  let lines = await readObjFromFile ('./mother-spaceship/source/ms_other_2.obj')
  let ship = createObject (lines, shipShader)
  objects.push (ship)
    // SHIPS OFFSET CALCULATION
  let ship_offset = new Vector3 (10, 10, 0)
  ship_offset.add (ship.centroid)
  let ship_position = new Vector3 (1000, 1000, 1000).scalarMultiply (solarsystem_scale)
  ship.setTranslation (player_index, ship_position)
  let scale = new Vector3(ship_scale, ship_scale, ship_scale)
  ship.setScale (player_index, scale)
  player = new PlayerObject (ship, player_index, ship_position, 0.1, 0.2, 
    new Vector3 (0, 10, -30).scalarMultiply(4))
}

/**
 * Initalize non- player objects
 */
async function initInteractables() {
  // credit to ezgi bakim
  const name = './spaceship.obj';
  // lOAD IN OBJECTS
  let solar_map = await readObjFromFile ('./maps/solarsystem.txt')
  let space_objs = parseSolarMap (solar_map)
  // CREATE SUN
  let offset = lightPosition
  celestial_bodies_index = 0
  let scale_factor = 1
  let spheres = generateSphereObject (20, 20, scale_factor, 3, space_objs.length, shaderProgram)
  interactables.push (spheres)
  let sun = space_objs[sun_index]
  interactables[celestial_bodies_index].addToObjects (sun)
  lightPosition = interactables[celestial_bodies_index].buildMatrixOtherTranslation(sun_index, global_translation_offset)
    .multiplyVector (interactables[0].centroid).xyz
  for (let i = space_objs.length - 1; i >= 0; i--) {
    setTriVaoGroupObj (celestial_bodies_index, i, space_objs[i], scale_factor)
  }
  await loadTexturesFromSolarMap (space_objs, interactables[celestial_bodies_index])
  setSatelliteHashTable (sun)
  // GENERATE HITBOXES
  generateVisualHitBoxes()
}

/**
 * Dynamically loads in object textures, 
 * and sets their gl texture index in their trivao grouping
 * @param {Array of SpaceObjects}  
 * @param {TrimeshVaoGrouping}
 */
async function loadTexturesFromSolarMap (space_objs, space_trivao)
{
  let STARTING_TEXTURE = gl.TEXTURE2
  let texture_offset = 2
  let folder = './textures/'
  let texture_hashmap = new Map()
  for (let i = 0; i < space_objs.length; i++) {
    if (texture_hashmap.has(space_objs[i].texture_name)) {
      space_trivao.setTextureIndex (space_objs[i].index,
         texture_hashmap.get(space_objs[i].texture_name))
      continue
    }

    let current_image = await readImage (folder + space_objs[i].texture_name)
    createTexture2d (current_image, STARTING_TEXTURE + i)
    space_trivao.setTextureIndex (space_objs[i].index, i + texture_offset)
    console.log ("space obj = " +space_objs[i].name)
    console.log ("texture = " + i + texture_offset)
    console.log ("texture name = " + space_objs[i].texture_name)
    texture_hashmap.set (space_objs[i].texture_name, i + texture_offset)
  }
}

   /**
 * Help contructs params for world matrix for object in geomotry group.
 * @param {int} group_index 
 * @param {int} obj_index 
 * @param {SpaceObject} space_obj
 * @param {float} scale_factor 
 */
function setTriVaoGroupObj (group_index, obj_index, space_obj, scale_factor)
  {
    let group = interactables[group_index]
    
    if (space_obj.parent != null)
      space_obj.soi = (space_obj.orbit_radius)  
        * Math.pow(space_obj.mass/space_obj.parent.mass, 2/5) * solarsystem_scale

    console.log (space_obj.name +" has an soi of " +
      (space_obj.soi ) + " an mass of " + space_obj.mass +
    " and an radius of " + (space_obj.radius * EARTH_RADIUS))
    console.log ("and has orbit rad of " + (space_obj.orbit_radius*EARTH_RADIUS))
    console.log ("thats " + (space_obj.soi * EARTH_RADIUS * 1.60934 * (1/solarsystem_scale)) + " km")
    

    space_obj.radius *= solarsystem_scale 
    space_obj.orbit_radius *= solarsystem_scale + space_obj.radius
    console.log ("radius " +space_obj.radius)
    if (space_obj.parent != null)
      space_obj.orbit_radius += space_obj.parent.radius * solarsystem_scale
    let rotation = space_obj.tilt
    let scale = space_obj.radius / scale_factor
    group.setScale (obj_index, new Vector3 (scale, scale, scale).scalarMultiply(relative_planet_size))
    group.setRotationX (obj_index, rotation.x)
    group.setRotationY (obj_index, rotation.y)
    group.setRotationZ (obj_index, rotation.z)
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
 * Creates and returns an trimeshVao from loaded in obj file
 * @param {String} lines 
 * @param {VertexArrayObject} shader
 * @returns {TriVao} object
 */
function createObject(lines, shader) {
  let obj_trimesh = Trimesh.readObjToJson(lines)
  let obj_attributes = new VertexAttributes()
  let positions = obj_trimesh.flat_positions()
  let normals = obj_trimesh.flat_normals()
  let indices = obj_trimesh.flat_indices()
  obj_attributes.addAttribute('position', positions.length / 3, 3, positions)
  obj_attributes.addAttribute('normal',   normals.length   / 3, 3, normals)
  obj_attributes.addIndices  (indices)
  let obj_vao = new VertexArray(shader, obj_attributes)
  let trivao_group = new TrimeshVaoGrouping  (obj_trimesh.positions,
                               obj_trimesh.normals, obj_trimesh.indices,
                               obj_vao, null, null, 1)
  return trivao_group
}

/**
 * Main game logic update controller
 * @param {float} now is current time 
 */
function updateEverything(now) {
  // CHECK GRAVITY
  let spheres = interactables[celestial_bodies_index]
  if (!bound_camera_mode) {
    let sun = spheres.getObject(sun_index)
    let ship_pos = player.trivao.buildMatrix(player.index)
    let ship_center = ship_pos.multiplyVector(player.centroid).xyz
    gravityUpdate (sun, spheres, player.trivao, ship_pos, ship_center, spheres, solarsystem_scale, player, global_translation_offset)
  }

  rotateAllBodies (spheres.getObject(sun_index), spheres)
  if (bound_camera_mode) {
    camera = bound_camera.updateBoundSpherePosition (global_translation_offset) 
  }
  lightTarget = camera.position

  
  if (!bound_camera_mode) {
    player.calculatePositionMovement()
    let ship_world = player.trivao.buildMatrix(player.index)
    let cam_pos = ship_world.multiplyVector(player.centroid.add (player.camera_offset)).xyz
    
    let cam_to = ship_world.multiplyVector(player.centroid).xyz
    camera = new SlideCamera (cam_pos, cam_to, new Vector3(0,1,0), camera_slide_theta)
    player.calculateOrientationMovement()
    global_translation_offset = player.position
  }
  // CHECK IF PLAYER CAN MOVE
  if (checkCollision (player.trivao)) {
    player.resetVelocity()
    console.log ("COLLISION DETECTED")
  }

  // LOG FPS
  now *= 0.001;                          // convert to seconds
  const deltaTime = now - then;          // compute time since last frame
  then = now;                            // remember time for next frame
  const fps = 1 / deltaTime;             // compute frames per second
  if (fps < 58)
    console.log (fps)
  fps_scaling = ideal_fps / fps
  if (isNaN(fps_scaling))
    fps_scaling = 1
  // RENDER AND REQUEST 2 DRAW
  lightPosition = interactables[celestial_bodies_index].buildMatrixOtherTranslation(sun_index, global_translation_offset)
  .multiplyVector (interactables[0].centroid).xyz

  getTextFromWorld()
  renderDepths(textDim, textDim, fbo)
  render()
  requestAnimationFrame(updateEverything)
}

/**
 * rotates all objects which are satellites of space_obj
 * @param {SpaceObject} space_obj
 * @param {TrimeshVaoGrouping} vao_group
 */
 function rotateAllBodies (space_obj, vao_group) {
  if (space_obj.num_satellites != 0 && space_obj.satellites != null) {
    for (let i = 0; i < space_obj.num_satellites; i++) {
      rotateAllBodies (space_obj.getSatellite(i), vao_group)
    }
  }
  let rotation_center
  let index = space_obj.index
  if (space_obj.parent == null) {
    rotation_center = lightPosition
    vao_group.addToRotationY (index, space_obj.rotation_speed * solarsystem_speed_scale * fps_scaling)
    return
  }
  else {
    rotation_center = vao_group.buildMatrix(space_obj.parent.index)
      .multiplyVector (vao_group.centroid)
  }
  let scaled_radius = space_obj.orbit_radius

  let theta = space_obj.orbit_theta
  let new_x = Math.cos (theta) * scaled_radius
  let new_z = Math.sin (theta) * scaled_radius
  let new_pos = new Vector3 (new_x, 0, new_z)
  new_pos = new_pos.add (rotation_center)
  vao_group.setTranslation (space_obj.index, new_pos)
  space_obj.orbit_theta += space_obj.orbit_speed 
    * solarsystem_speed_scale * (Math.PI/180) * fps_scaling
  vao_group.addToRotationY (index, space_obj.rotation_speed * solarsystem_speed_scale * fps_scaling)
  // place camera in new path of obj
}

/**
 * Checks if an inputed object is within an unaligned bounding box
 *  of any iterable object
 * @param {TrimeshVaoGrouping} object 
 * @param {int} index
 * @returns 
 */
function checkCollision (object, index) {
  for (let i = celestial_bodies_index + 1; i < interactables.length; i++) {
    const interactable = interactables[i]
    for (let j = 0; j < interactable.num_objects; j++) {
      let c_obj = interactable
      let c_hitbox = interactable.getBoundingBox()
      let pos = interactable.buildMatrix(j)
      if (c_obj == null || c_hitbox == null) {
        console.log ("Bad obj in collision check")
        continue
      }
      // GET WORLD POSITION OF CENTER OF BB
      let center = pos.multiplyVector (c_hitbox.centroid)
      // THE MIN TEST POINT OF OTHER BB
      let object_position = object.buildMatrix(index)
      let p_pos_min = object_position.multiplyVector (object.min).xyz
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
      
      let p_pos_max = object_position.multiplyVector (object.max).xyz
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
 * assumes bounding boxes are axis aligned
 * checks if one bb lies within any other bb
 * @param {*} input_obj
 * @param {*} pos_mat
 * @returns T if is within an BB, F if not
 */
function checkObjectToObjectCollision (input_obj, pos_mat) {
  for (let i = 0; i < interactables.length - 1; i++) {
    const interactable = interactables[i]
    for (let j = 0; j < interactable.num_objects; j++) {
      let c_obj = interactable
      let c_pos = interactable.buildMatrix(j)
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
 * inits bound camera for index object
 * @param {int} vao_index 
 * @param {int} obj_index 
 */
function setPlanetBoundCamera (vao_index, obj_index) {
  bound_camera = new BoundCamera(camera, camera_slide_theta)
  let current_trivao = interactables[vao_index]
  let obj = current_trivao.getObject(sun_index)
  player.resetVelocity()
  let radius = obj.radius
  if (obj.getChild (obj_index) != null)
    radius = obj.getChild (obj_index).radius
  bound_camera.setBoundPosition (current_trivao, obj_index, radius, solarsystem_scale, global_translation_offset)
  let mat = current_trivao.buildMatrix (obj_index)
  global_translation_offset = mat.multiplyVector (current_trivao.centroid).xyz
  global_translation_offset.set (1, 0)
  bound_camera_mode = true
}


/**
 * places camera in position looking at specified object
 * @param {int} vaogroup_index 
 * @param {int} obj_index 
 * @param {Vector3} offset 
 */
 function teleportToObject (vaogroup_index, obj_index, 
  offset = new Vector3 (-10, 50, 20))
{
  let group = interactables[vaogroup_index]
  let target = group.buildMatrix(obj_index).multiplyVector (group.centroid).xyz
  let position = offset.add (target)
  camera = new SlideCamera (position, target, new Vector3 (0,1,0),  camera_slide_theta)   
}


/**
 * Handles player inputs when a key is pressed down
 * 
 * @param {*} event 
 */
function onKeyDown(event) {
  if (event.key === 'ArrowUp' || event.key == 'w' || keysPressed.w) {
    player.addVelocityForward (-moveDelta * fps_scaling)
    keysPressed.w = true
  } if (event.key === 'ArrowDown' || event.key == 's' || keysPressed.s) {
    player.addVelocityForward (moveDelta * fps_scaling)
    keysPressed.s = true
  } if (event.key === 'ArrowLeft' || event.key == 'a' || keysPressed.a) {
    player.addVelocityRight (moveDelta * fps_scaling)
    keysPressed.a = true
  } if (event.key === 'ArrowRight' || event.key == 'd' || keysPressed.d) {
    player.addVelocityRight (-moveDelta * fps_scaling)
    keysPressed.d = true

  } 
  // for roll, not used due to gimbal lock
  if (event.key == 'q') {
  } if (event.key == 'e') {
  } if (event.key == '=' || keysPressed.up) {
    if (!bound_camera_mode) {
      player.adjustCameraOffsetDown()
      keysPressed.up = true
    }
    else {
      bound_camera.moveCameraCloser (solarsystem_scale)
    }
  } if (event.key ==  '-' || keysPressed.down) {
    if (!bound_camera_mode) {
      player.adjustCameraOffsetUp()
      keysPressed.down = true
    }
    else {
      bound_camera.moveCameraAway (solarsystem_scale)
    }
  } if (event.key == 'h') {
    show_hitboxes = !show_hitboxes
  } if (event.key == ' ') {
    player.resetVelocity()
  } if (event.key == 'l') {
    console.log ("___________________________")

    console.log ("playerpos = " + player.position)
    console.log ("player translation =" +player.trivao.translations[player_index])
    console.log ("camera position = " + camera.position)
    console.log ("global offset val = " + global_translation_offset)
    if (bound_camera_mode) {
      let trivao = interactables[celestial_bodies_index]
      let s_ind = bound_camera.bound_obj_index
      console.log (s_ind)
      console.log (juipter_index)
      let normal_center = trivao.buildMatrix (s_ind).multiplyVector (trivao.centroid).xyz
      let adjusted_center = trivao.buildMatrixOtherTranslation (s_ind, global_translation_offset)
        .multiplyVector (trivao.centroid).xyz
      let camera_center = trivao.buildMatrixOtherTranslation (s_ind, camera.position)
        .multiplyVector (trivao.centroid).xyz
      console.log ("realspace center is " + normal_center)
      console.log ("adjusted is " + adjusted_center)
      console.log ("camera adjusted is " + camera_center)
    }
    console.log ("___________________________")
  }
  if (event.key == 'g') {
    draw_soi_spheres = !draw_soi_spheres
  } if (event.key == 'Enter') {
    bound_camera_mode = false
    player.position = global_translation_offset//bound_camera.camera.position
    player.resetVelocity()
  } if (event.key == 'c') {
    console.crash()
  }
  // teleports to planets with # key, corresponding to planet position 2 sun
  if (event.key >= '0' && event.key <= '8') 
    boundCameraHelper (event.key)  

    
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
 * Sets camera to be bound to a planet when 0-8 is pressed.
 * Iterates through all satelites of an SpaceObject
 * when same key is continously pressed.
 * @param {char} key_input 
 */
function boundCameraHelper (key_input) {
  let space_obj_index
  if (key_input == '0') 
    space_obj_index = sun_index
  else if (key_input == '1') 
    space_obj_index = mecury_index
  else if (key_input == '2') 
    space_obj_index = venus_index
  else if (key_input == '3') 
    space_obj_index = earth_index
  else if (key_input == '4') 
    space_obj_index = mars_index
  else if (key_input == '5') 
    space_obj_index = juipter_index
  else if (key_input == '6') 
    space_obj_index = saturn_index
  else if (key_input == '7') 
    space_obj_index = uranus_index
  else if (key_input == '8') 
    space_obj_index = neptune_index

  if (bound_object_iterator == null || space_obj_index != bound_parent_index) {
    bound_parent_index = space_obj_index
    bound_object_iterator = interactables[celestial_bodies_index]
      .getObject(sun_index).getChild(space_obj_index)[Symbol.iterator]()
    
    setPlanetBoundCamera (celestial_bodies_index, space_obj_index)

  } else {
    let next_child = bound_object_iterator.next()
    if (!next_child.done)
      setPlanetBoundCamera (celestial_bodies_index, next_child.value.index)
    else {
      bound_camera_mode = false
      bound_object_iterator = null
      bound_parent_index = null
    }
  }  
}

/**
 * Shadows init.
 */
function getTextFromWorld () {
  clipFromLight = Matrix4.fovPerspective(90, 1, 0, max_shadow_distance);
  for (let i = 0; i < 6; i++) {
    if (i > 0)
      continue
    lightCamera = new Camera(lightPosition, lightTarget, new Vector3 (0,1,0))
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
