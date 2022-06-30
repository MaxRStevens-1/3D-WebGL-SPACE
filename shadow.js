
import { ShaderProgram } from './shader-program'
import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'
import { Camera, TerrianCamera } from './camera'


export function createTexture2d(image, textureUnit = gl.TEXTURE0) {
  gl.activeTexture(textureUnit)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.generateMipmap(gl.TEXTURE_2D)
  return texture
}

export function getTextFromWorld (lightPosition, lightTarget) {
    const lightCamera = new Camera(lightPosition, lightTarget, new Vector3(0, 1, 0));
    const lightFromWorld = lightCamera.matrix;
    const clipFromLight = Matrix4.fovPerspective(45, 1, 0.1, 1000);
    const matrices = [
    Matrix4.translate(0.5, 0.5, 0.5),
    Matrix4.scale(0.5, 0.5, 0.5),
    clipFromLight,
    lightFromWorld,
    ];
    const textureFromWorld = matrices.reduce((accum, transform) => accum.multiplyMatrix(transform));
    return textureFromWorld
}

export function reserveDepthCubeTexture (width, height, depth_unit = gl.TEXTURE0,
   shadow_cube_map_unit = gl.TEXTURE1) {
  // depthT texture reservation
  gl.activeTexture(depth_unit);
  const depth_texture = gl.createTexture();
  gl.bindTexture (gl.TEXTURE_2D, depth_texture);
  gl.texImage2D (gl.TEXTURE_2D, 0,gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // CUBE shadow map
  gl.activeTexture (shadow_cube_map_unit);
  const shadow_cube_texture = gl.createTexture()
  gl.bindTexture (gl.TEXTURE_CUBE_MAP, shadow_cube_texture);
  gl.texParameteri (gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri (gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri (gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri (gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri (gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
//texImage2D(target, level, internalformat, width, height, border,
  // format, type, source)
  for (let i = 0; i < 6; i++) {
    //gl.texImage2D (gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA,
    //   width, height, 0, gl.RED, gl.FLOAT, null)
    //gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, width, 
    //  height, gl.UNSIGNED_BYTE, null);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.DEPTH_COMPONENT32F, 
      width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
  }

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D (gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_texture, 0)
  return [depth_texture, shadow_cube_texture, framebuffer]
}


export function reserveDepthTexture(width, height, unit = gl.TEXTURE0) {
  gl.activeTexture(unit);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}


  export function initializeDepthFbo(depthTexture) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return framebuffer;
  }

  export function bindShadowCubeFace (cube_face, fbo, shadow_cube_map) {
    gl.framebufferTexture2D (gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, cube_face, shadow_cube_map, 0)

  }

  export function initializeDepthProgram() {
    const vertexSource = `
  uniform mat4 clipFromWorld;
  uniform mat4 worldFromModel;
  in vec3 position;
  
  void main() {
    gl_Position = clipFromWorld * worldFromModel * vec4(position, 1.0);
  }
    `;
  
    const fragmentSource = `
  out vec4 fragmentColor;
  
  void main() {
    fragmentColor = vec4(1.0);
  }
      `;
  
    const depthProgram = new ShaderProgram(vertexSource, fragmentSource);
    return depthProgram
  }