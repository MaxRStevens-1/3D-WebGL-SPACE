
import { VertexAttributes } from './vertex-attributes'
import { ShaderProgram } from './shader-program'
import { generateCube } from './box_gen'; 
/**
 * returns minimal gemortry cube with inward pointing faces
 * @returns the attributes of a skybox cube
 */
export function generateSkybox() {
  const positions = [
      -1, -1,  1,
       1, -1,  1,
      -1,  1,  1,
       1,  1,  1,
      -1, -1, -1,
       1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
    ];
  
    const indices = [
      1, 0, 2,
      1, 2, 3,
      4, 5, 7,
      4, 7, 6,
      5, 1, 3,
      5, 3, 7,
      0, 4, 6,
      0, 6, 2,
      6, 7, 3,  
      6, 3, 2,
      0, 1, 5,
      0, 5, 4,
    ];
    //     [positions, normals, faces];
    const attributes = new VertexAttributes();

    attributes.addAttribute('position', positions.length / 3, 3, positions)
    //attributes.addAttribute ('normal', normals.length / 3, 3, normals)
    attributes.addIndices(indices);


  
    return attributes;
  }


  /**
   * Loads in cube for a skybox in from the filepath of directory,
   * of image type extense, with the names in the faces array
   * returns the gl generated texture
   * @param {*} directoryUrl 
   * @param {*} extension 
   * @param {*} textureUnit 
   * @returns 
   */
  export async function loadCubemap(directoryUrl, extension, textureUnit = gl.TEXTURE0) {
    // the names of the images

    //const faces = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];
    //const faces = ['bkg1_right', 'bkg1_left', 'bkg1_top', 
    //              'bkg1_bot', 'bkg1_front', 'bkg1_back'];
    const faces = ['right', 'left', 'top', 'bot', 'front', 'back']
  
    const images = await Promise.all(faces.map(face => {
      const url = `${directoryUrl}/${face}.${extension}`;
      return readImage(url);
    }));
  
    gl.activeTexture(textureUnit);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[0]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[1]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[2]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[3]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[4]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[5]);
  
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  
    return texture;
  }

  /**
   * 
   * @returns the skyboxes shader program
   */
  export function skybox_shader_program ()
  {
    const vertexSource = `
    uniform mat4 clipFromEye;
    uniform mat4 eyeFromWorld;
    uniform mat4 worldFromModel;
    in vec3 position;
    out vec3 mixTexPosition;
    
    void main() {
      gl_Position = clipFromEye * eyeFromWorld * vec4(position, 1.0);
      gl_Position = clipFromEye * eyeFromWorld * worldFromModel * vec4(position, 1.0);
      mixTexPosition = position;
    }
    `;
    const fragmentSource = `
    uniform samplerCube skybox;
    in vec3 mixTexPosition;
    out vec4 fragmentColor;
    
    void main() {
      fragmentColor = texture(skybox, mixTexPosition);  
    }
    `;
;
    let shaderProgram = new ShaderProgram(vertexSource, fragmentSource)
    return shaderProgram
  }

  export function ship_shader () {
    const vertexSource = `
    uniform mat4 clipFromEye;
    uniform mat4 worldFromModel;
    uniform mat4 eyeFromWorld;
    in vec3 position;
    in vec3 normal;
    out vec3 mixWorldPosition;
    out vec3 mixWorldNormal;
    void main() {
      gl_Position = clipFromEye * eyeFromWorld * worldFromModel * vec4(position, 1.0);
      mixWorldPosition = (eyeFromWorld * worldFromModel * vec4(position, 1.0)).xyz;
      mixWorldNormal  = (eyeFromWorld * worldFromModel * vec4(normal.x, -normal.y, normal.z, 0)).xyz;
    }
    `;
    const fragmentSource = `
    uniform samplerCube skybox;
    uniform vec3 worldEyePosition;
    in vec3 mixWorldPosition;
    in vec3 mixWorldNormal;
    out vec4 fragmentColor;
    
      void main() {
        vec3 eyeToPosition = normalize(mixWorldPosition - worldEyePosition);
        vec3 normal = normalize(mixWorldNormal);
        // ** MIRROR VERSION **
        vec3 reflection = reflect(eyeToPosition, normal);
        fragmentColor = texture(skybox, reflection);

        // ** REFRACTION VERSION **
        //float ratio = 1.0 / 1.53;
        //vec3 refraction = refract (eyeToPosition, normal, ratio);
        //fragmentColor = texture(skybox, refraction);
      }
    `;
    let shaderProgram = new ShaderProgram(vertexSource, fragmentSource)
    return shaderProgram
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