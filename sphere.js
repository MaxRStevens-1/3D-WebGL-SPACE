
import { VertexAttributes } from './vertex-attributes'
import { ShaderProgram } from './shader-program'
import { VertexArray } from './vertex-array'
import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'
import {TrimeshVaoGrouping} from './trimesh'


function generateSphere(widthSegments, heightSegments, radius) {
  /**
   * ChatGPT generate. Wow.... it works...
   */
  const positions = [];
  const normals = [];
  const indices = [];
  const uvs = [];


  for (let y = 0; y <= heightSegments; y++) {
    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const v = y / heightSegments;
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;

      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const xPosition = radius * cosTheta * sinPhi;
      const yPosition = radius * cosPhi;
      const zPosition = radius * sinTheta * sinPhi;

      positions.push(new Vector3(xPosition, yPosition, zPosition));
      normals.push(new Vector3(xPosition / radius, yPosition / radius, zPosition / radius));
      uvs.push(u, v);
    }
  }

  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + 1;
      const c = (y + 1) * (widthSegments + 1) + x;
      const d = c + 1;

      indices.push(new Vector3(a, b, d));
      indices.push(new Vector3(d, c, a));
    }
  }

  const attributes = new VertexAttributes()
  console.log (positions.length)
  console.log (normals.length)
  console.log (uvs.length)
  console.log (indices.length)



  
  attributes.addAttribute('position', positions.length, 3, positions)
  attributes.addAttribute('normal', normals.length, 3, normals)
  attributes.addAttribute('texPosition', uvs.length/2, 2, uvs)
  attributes.addIndices(indices)
  return [positions, normals, indices, uvs]

}

/*
chatgpt test
function generateSphere(lat, long, radius) {
  const points = []
  const normals = []
  const indexs = []
  const uv = []
  for (let i = 0; i <= lat; i++) {
    const theta = i * Math.PI / lat;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
  
    for (let j = 0; j <= long; j++) {
      const phi = j * 2 * Math.PI / long;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
  
      const x = cosPhi * sinTheta;
      const y = sinPhi * sinTheta;
      const z = cosTheta;
      const u = 1 - (j / long);
      const v = 1 - (i / lat);
  
      normals.push(new Vector3(x, y, z));
      points.push(new Vector3(radius * x, radius & y, radius * z))
      uv.push (u, v)

    }
  }

  for (let i = 0; i < lat; i++) {
    for (let j = 0; j < long; j++) {
      const first_index = (i * (long + 1)) + j;
      const second_index = first_index + long + 1;

      indexs.push(new Vector3(
        first_index,
        second_index,
        first_index + 1))
      
      indexs.push(new Vector3 (
        second_index,
        second_index + 1,
        first_index + 1
      ))
    }
  }
  return [points, normals, indexs, uv]

}*/

/**
 * Takes in the # of verticies for latitude and longitude, along with an radius
 * outputs an array contiaining the [positions, normals, indices, texPositions]
 * @param {*} nlatitudes 
 * @param {*} nlongitudes 
 * @param {*} radius 
 * @returns 
*
function generateSphere(nlatitudes, nlongitudes, radius) {


    nlatitudes = nlatitudes + 100
    nlongitudes = nlongitudes + 100

    const positions = []
    const normals = []
    const indices = []
    const texPositions = [];
  
    const seedPositions = []

    //texPositions.push ()
    for (let ilatitude = 0; ilatitude < nlatitudes + 1; ilatitude++) {
      const radians = (ilatitude / (nlatitudes - 1)) * Math.PI - Math.PI / 2
      const x = radius * Math.cos(radians)
      const y = radius * Math.sin(radians)
      const vec4 = new Vector4()
      vec4.setall(x, y, 0, 1)
      seedPositions.push(vec4)
      console.log ("vec4 is " + vec4.xyz)
    }

    // put an new position, normal, and UV at 1, 
    // but not triangles extend to it

    for (let ilongitude = 0; ilongitude < nlongitudes + 1; ilongitude++) {
      const degrees = (ilongitude / nlongitudes) * 360
      console.log (degrees)
      let rotater = Matrix4.rotateY(degrees)
      for (let ilatitude = 0; ilatitude < nlatitudes; ilatitude++) {
        const p = rotater.multiplyVector(seedPositions[ilatitude])
        positions.push(new Vector3 (p.x, p.y, p.z))
        const normal = p.normalize()
        normals.push(new Vector3 (normal.x, normal.y, normal.z))
        let u = 1 - ilongitude / nlongitudes
        let v = 1 - ilatitude / nlatitudes

        texPositions.push(u, v);
      }
    }
    console.log ("___________________________")


    
    const radians = Math.PI - Math.PI / 2
    let x = radius * Math.cos(radians)
    let y = radius * Math.sin(radians)
    const antiwraplarge = new Vector4()
    antiwraplarge.setall(0, 1, 0, 1)
    let new_points = []
    new_points.push (antiwraplarge)
    //let other_point = new Vector4()
    //other_point.setall(1,0,0,1)
    //new_points.push (other_point)
    //for (let i = 0; i < new_points.length; i++) {
      let current_point = new_points[0]
      // points is vec4
      for (let ilongitude = 0; ilongitude < nlongitudes / 2 + 1; ilongitude++) {
        //seedPositions
        const degrees = (ilongitude / nlongitudes) * 360
        console.log (degrees)
        let rotater = Matrix4.rotateX(degrees)
        let p = rotater.multiplyVector (current_point)
        let normal = p.normalize()
        positions.push (new Vector3(p.x, p.y, p.z))
        normals.push (new Vector3(normal.x, normal.y, normal.z)) 

        let u = 1 - (ilongitude / nlongitudes) * 2
        let v = 1
        texPositions.push(u, v)
        console.log ("u: " + u + " v: " + v)
        console.log ("point: " + p.xyz)
      }
    //}

    for (let ilongitude = 0; ilongitude < nlongitudes; ilongitude++) {
      const iNextLongitude = (ilongitude + 1) % nlongitudes
      for (let ilatitude = 0; ilatitude < nlatitudes - 1; ilatitude++) {
        const iNextLatitude = (ilatitude + 1) % nlatitudes
        indices.push( new Vector3(
          ilongitude * nlatitudes + ilatitude,
          ilongitude * nlatitudes + iNextLatitude,
          iNextLongitude * nlatitudes + iNextLatitude
        ))
        indices.push( new Vector3(
          ilongitude * nlatitudes + ilatitude,
          iNextLongitude * nlatitudes + iNextLatitude,
          iNextLongitude * nlatitudes + ilatitude
        ))
      }
    }
    const attributes = new VertexAttributes()
    attributes.addAttribute('position', positions.length, 3, positions)
    attributes.addAttribute('normal', normals.length, 3, normals)
    attributes.addAttribute('texPosition', texPositions.length/2, 2, texPositions)
    attributes.addIndices(indices)
    console.log (texPositions)
    return [positions, normals, indices, texPositions]
} */



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
  console.log(nlat)
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