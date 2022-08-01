
import { VertexAttributes } from './vertex-attributes'
import { ShaderProgram } from './shader-program'
import { VertexArray } from './vertex-array'
import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'
import {TrimeshVaoGrouping} from './trimesh'

/**
 * Takes in the # of verticies for latitude and longitude, along with an radius
 * outputs an array contiaining the [positions, normals, indices, texPositions]
 * @param {*} nlatitudes 
 * @param {*} nlongitudes 
 * @param {*} radius 
 * @returns 
 */

function generateSphere(nlatitudes, nlongitudes, radius) {
    const positions = []
    const normals = []
    const indices = []
    const texPositions = [];

    for (let j = 0; j <= nlongitudes; j++) {
      let adjusted_j = j * Math.PI / nlongitudes;
      let sin_j = Math.sin(adjusted_j) * radius;
      let cos_j = Math.cos(adjusted_j) * radius;
      for (let i = 0; i <= nlatitudes; i++) {
        let adjusted_i = i * 2 * Math.PI / nlongitudes;
        let sin_i = Math.sin(adjusted_i);
        let cos_i = Math.cos(adjusted_i);
        let p = new Vector3 (sin_i * sin_j, cos_j, cos_i * sin_j + 1)
        positions.push (p)
        texPositions.push(i/nlongitudes); 
        texPositions.push(j/nlongitudes); 
      }
    }

    for (let j = 0; j < nlongitudes; j++) {
      for (let i = 0; i < nlongitudes; i++) {
        let p1 = j * (nlongitudes + 1) + i
        let p2 = p1 + (nlongitudes + 1)
  
        indices.push(new Vector3(p1, p2, p1 + 1))
        indices.push(new Vector3(p1 + 1, p2, p2 + 1))
      }
    }
    return [positions, [], indices, texPositions]
  }

/**
 * checks for distance between points in 3d space
 * @param {Trimesh} object 
 * @param {Matrix4} o_pos
 * @param {int} index
 * @param {Vector3} obj_center
 * @returns 
 */
export function checkSphereDistance (index, obj_center, sphere, translation_offset) {
  let s_pos = sphere.buildMatrixOtherTranslation(index, translation_offset)

  let s_point = s_pos.multiplyVector (sphere.centroid)
  let o_point = obj_center //o_pos.multiplyVector (object.centroid)
  let distance = Math.sqrt (Math.pow(s_point.x - o_point.x, 2) 
                            + Math.pow(s_point.y - o_point.y, 2) 
                            + Math.pow(s_point.z - o_point.z, 2)) 
  return distance
}

/**
 * Generates an physical physical sphere object
 * @param {float} nlat 
 * @param {float} nlong 
 * @param {float} radius 
 * @param {vec3} offest
 * @param {int} texture_index
 * @param {int} num_spheres
 */
 export function generateSphereObject (nlat, nlong, radius, texture_index, num_spheres, shader_program) {
  let sphere_attributes_arr = generateSphere (nlat, nlong, radius)
  let sPos = sphere_attributes_arr[0]
  let sNor = sphere_attributes_arr[1]
  let sInd = sphere_attributes_arr[2]
  let sTex = sphere_attributes_arr[3]
  let sphere_trivao = new TrimeshVaoGrouping (sPos, sNor, sInd, null, sTex, texture_index, num_spheres)
  sPos = sphere_trivao.flat_positions ()
  sNor = sphere_trivao.flat_normals ()
  sInd = sphere_trivao.flat_indices ()
  // SPHERE ATTRIBUTES
  const sphere_attributes = new VertexAttributes()
  sphere_attributes.addAttribute ('position', sPos.length / 3, 3, sPos)
  sphere_attributes.addAttribute ('normal', sPos.length / 3, 3, sNor)
  sphere_attributes.addAttribute ('texPosition', sPos.length / 3, 2, sTex)
  sphere_attributes.addIndices (sInd)
  let sphere_vao = new VertexArray (shader_program, sphere_attributes)
  sphere_trivao.vao = sphere_vao
  return sphere_trivao
}