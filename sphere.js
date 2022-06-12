
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
  
    const seedPositions = []
    for (let ilatitude = 0; ilatitude < nlatitudes; ilatitude++) {
      const radians = (ilatitude / (nlatitudes - 1)) * Math.PI - Math.PI / 2
      const x = radius * Math.cos(radians)
      const y = radius * Math.sin(radians)
      const vec4 = new Vector4()
      vec4.setall(x, y, 0, 1)
      seedPositions.push(vec4)
  
    }
  
    for (let ilongitude = 0; ilongitude < nlongitudes; ilongitude++) {
      const degrees = (ilongitude / nlongitudes) * 360
      const rotater = Matrix4.rotateY(degrees)
      for (let ilatitude = 0; ilatitude < nlatitudes; ilatitude++) {
        const p = rotater.multiplyVector(seedPositions[ilatitude])
        positions.push(new Vector3 (p.x, p.y + 3, p.z))
        const normal = p.normalize()
        normals.push(new Vector3 (normal.x, normal.y, normal.z))
  
        texPositions.push(ilongitude / nlongitudes, ilatitude / nlatitudes);
      }
    }
  
    for (let ilongitude = 0; ilongitude < nlongitudes; ilongitude++) {
      const iNextLongitude = (ilongitude + 1) % nlongitudes
      for (let ilatitude = 0; ilatitude < nlatitudes - 1; ilatitude++) {
        const iNextLatitude = (ilatitude + 1) % nlatitudes
        indices.push(
          ilongitude * nlatitudes + ilatitude,
          ilongitude * nlatitudes + iNextLatitude,
          iNextLongitude * nlatitudes + iNextLatitude
        )
        indices.push(
          ilongitude * nlatitudes + ilatitude,
          iNextLongitude * nlatitudes + iNextLatitude,
          iNextLongitude * nlatitudes + ilatitude
        )
      }
    }
    /*const attributes = new VertexAttributes()
    attributes.addAttribute('position', nlatitudes * nlongitudes, 3, positions)
    attributes.addAttribute('normal', nlatitudes * nlongitudes, 3, normals)
    attributes.addAttribute('texPosition', nlatitudes * nlongitudes, 2, texPositions)
    attributes.addIndices(indices)*/
    console.log (positions)
    return [positions, normals, indices, texPositions]
  }