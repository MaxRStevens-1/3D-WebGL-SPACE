
import { VertexAttributes } from './vertex-attributes'
import { ShaderProgram } from './shader-program'
import { VertexArray } from './vertex-array'
import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'

/**
 * Takes in the # of verticies for latitude and longitude, along with an radius
 * outputs an array contiaining the [positions, normals, indices, texPositions]
 * @param {*} nlatitudes 
 * @param {*} nlongitudes 
 * @param {*} radius 
 * @returns 
 */

export function generateSphere(nlatitudes, nlongitudes, radius) {
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
        const normal = p.normalize()
        normals.push(new Vector3 (normal.x, normal.y, normal.z))
        texPositions.push(i/nlongitudes); 
        texPositions.push(j/nlongitudes); 
      }
    }

    for (let j = 0; j < nlongitudes; j++) {
      for (let i = 0; i < nlongitudes; i++) {
        let p1 = j * (nlongitudes + 1) + i
        let p2 = p1 + (nlongitudes + 1)
  
        indices.push(p1, p2, p1 + 1)
        indices.push(p1 + 1, p2, p2 + 1)
      }
    }
    return [positions, normals, indices, texPositions]
  }