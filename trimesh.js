import { Vector3 } from './vector'
import {Matrix4} from './matrix'

// REQURES VEC3s INTERANLLY TO FUNCTION
export class Trimesh {
  /**
   * Takes in Vector3s for position, normals, and indicies
   * @param {*} positions 
   * @param {*} normals 
   * @param {*} indices 
   * @param {*} textures 
   */
  constructor(positions, normals, indices, textures) {
    this.positions = positions
    this.normals = normals
    this.indices = indices
    this.textures = textures
    this.position_point = null;
    this.edge_distance = null
    // set default values of min n max
    // very large constant
    this.min = new Vector3 (1000000,1000000, 100000)
    this.max = new Vector3 (-1000000, -10000000, -1000000)
    this.createBoundingBox()
    //this.depth = 0
    this.centroid = new Vector3 ((this.min.x + this.max.x) / 2,
      (this.min.y + this.max.y) / 2, (this.min.z + this.max.z) / 2)
    if (normals.length == 0 || normals == null)
      this.generateNormals()
  }


  /**
   * sets min / max to model space min/max
   */
  createBoundingBox() {
    let min = new Vector3(this.positions[0].x, this.positions[0].y,this.positions[0].z)
    let max = new Vector3(this.positions[0].x, this.positions[0].y,this.positions[0].z) 

    for (let pos of this.positions)
    {
      // update x
      if (pos.x < min.x) {
        min.x = pos.x
      }
      else if (pos.x > max.x) {
        max.x = pos.x 
      }
      // update y
      if (pos.y < min.y) {
        min.y = pos.y 
      }
      else if (pos.y > max.y) {
        max.y = pos.y 
      }
      // update z
      if (pos.z < min.z) {
        min.z = pos.z
      }
      else if (pos.z > max.z) {
        max.z = pos.z
      }
    }

    this.min = min
    this.max = max
  }
  /**
   * returns a world space min/max
   * @param {*} input_mat4 
   * @return returns an array of [adjusted min, adjusted max]
   */
  checkAdjustedBoundingBox (input_mat4) {
    let adj_min = input_mat4.multiplyVector (this.positions[0]).xyz
    let adj_max = input_mat4.multiplyVector (this.positions[0]).xyz
    for (let i = 1; i < this.positions.length; i++)
    {
      let pos = input_mat4.multiplyVector (this.positions[i])
      // update x
      if (pos.x < adj_min.x) {
        adj_min.x = pos.x
      }
      else if (pos.x > adj_max.x) {
        adj_max.x = pos.x 
      }
      // update y
      if (pos.y < adj_min.y) {
        adj_min.y = pos.y 
      }
      else if (pos.y > adj_max.y) {
        adj_max.y = pos.y 
      }
      // update z
      if (pos.z < adj_min.z) {
        adj_min.z = pos.z
      }
      else if (pos.z > adj_max.z) {
        adj_max.z = pos.z
      }
    }
    
    return [adj_min, adj_max]
  }



  generateCentroid () {
    this.centroid = new Vector3 ((this.min.x + this.max.x) / 2,
    (this.min.y + this.max.y) / 2, (this.min.z + this.max.z) / 2)
  }

  generateNormals() {
    this.normals = this.positions.map((x) => {
      return new Vector3(0, 0, 0)
    })
    this.indices.forEach((index, idx) => {
      const positionA = this.positions[index.x]
      const positionB = this.positions[index.y]
      const positionC = this.positions[index.z]
      const vec_AB = positionB.sub(positionA)
      const vec_AC = positionC.sub(positionA)

      let normal = vec_AB.cross(vec_AC).normalize()
      if (normal == null)
        normal = new Vector3 (0,0,0)
      this.normals[index.x] = this.normals[index.x].add(normal)
      this.normals[index.y] = this.normals[index.y].add(normal)
      this.normals[index.z] = this.normals[index.z].add(normal)
    })

    this.normals = this.normals.flatMap((normal) => {
      let new_n = normal.normalize()
      if (new_n == null)
        new_n = new Vector3 (0,0,0)
      return [new Vector3 (new_n.x, new_n.y, new_n.z)]
    })
    return this.normals
  }

  flat_positions() {
    return this.positions.flatMap((pos) => [pos.x, pos.y, pos.z])
  }

  flat_normals() {
    return this.normals.flatMap((normal) => [normal.x, normal.y, normal.z])
  }

  flat_indices() {
    return this.indices.flatMap((index) => [index.x, index.y, index.z])
  }
  flat_textures() {
    return this.textures.flatMap((texture) => [texture.x, texture.y])
    //WOW!
    //return this.textures.flatMap((texture) => [texture.x, texture.y, texture.z])
    // thats real stupid

  }

  setTextures (textures) {
    this.textures = textures
  }

  static readObjToJson (objString, scale=1) {
    var tmpPositions = []
    var tmpNormals = []
    var tmpIndices = []
    let hasText = false
    // splits on new line
    var strArr = objString.split ('\n')
    for (let i = 0; i < strArr.length; i++) {
      var current = strArr[i]
      // when slicing at start it removes the line charecter (v, vn, ect) and the following space
      if (current.startsWith("#")) {}
        // do nothing
      else if (current.startsWith ("v ")) {
        // append position positions
        var posArr = current.slice(2).split (' ')
        let a = Number(posArr[0])*scale, b=Number(posArr[1])*scale, c=Number(posArr[2])*scale;
        tmpPositions.push (new Vector3 (a,b,c))
      } else if (current.startsWith ("vn ")) {
        var normArr = current.slice(3).split (' ')
        let a = Number(normArr[0]), b = Number(normArr[1]), c=Number(normArr[2]);
        tmpNormals.push (new Vector3 (a,b,c))
      } else if (current.startsWith ("f ")) {
        // append triangle to indicies
        let i_tokens = current.slice(2).replace ("\r", "").split (' ')

        for (let x = 1; x < i_tokens.length - 1; x++) {
          let tmp_ind_buff = []
          tmp_ind_buff.push (i_tokens[0])
          tmp_ind_buff.push (i_tokens[x])
          tmp_ind_buff.push (i_tokens[x+1])
          tmpIndices.push (tmp_ind_buff)
        }
      }
    }
    var positions = []
    var normals = []
    var indices = []
    var slashTokenToIndex = {}
  
    for (let i = 0; i < tmpIndices.length; i++) {
      let indArr = []
      for (let x = 0; x < tmpIndices[i].length; x++) {
        var currIndex = tmpIndices[i][x]
        if (slashTokenToIndex[currIndex] == null) {
          slashTokenToIndex[currIndex] = positions.length
          let splitCurr;
          if (currIndex.includes ("//")) {
            splitCurr = currIndex.replace ("//", " ")
          } else {
            splitCurr = currIndex;
          }
  
          splitCurr = splitCurr.split (' ')
          for (let z = 0; z < splitCurr.length; z++) {
            splitCurr[z] = Number(splitCurr[z]) - 1
          } 
  
          // pushes triangle to num
          positions.push (tmpPositions[splitCurr[0]])
          if (tmpNormals.length > 0)
            normals.push (tmpNormals[splitCurr[1]])
        }
        indArr.push (slashTokenToIndex[currIndex])
      }
      // pushes as vec 3 for generateNormals func
      indices.push (new Vector3 (indArr[0], indArr[1], indArr[2]))
    }

    const objTrimesh = new Trimesh (positions, normals, indices)
    if (normals.length == 0 || normals == [])
    {
      objTrimesh.generateNormals()
    }
    return objTrimesh;
  }
}

export class TrimeshVao extends Trimesh {
  constructor(positions, normals, indices, vao, textures) {
    super (positions, normals, indices, textures)
    this.vao = vao
    this.num_objects = 1
  }
}

export class TrimeshVaoGrouping extends TrimeshVao {

  /**
   * 
   * @param {*} positions vec3 positions
   * @param {*} normals vec3 norms
   * @param {*} indices vec3 indicies
   * @param {*} vao vao of obj grouping
   * @param {*} textures texels of obj
   * @param {*} texture_index texture index of obj
   * @param {*} num_objects # of objects in grouping
   * @param {*} toWorldFromModels worldFromModel mat4s
   */
  constructor (positions, normals, indices, vao, textures, texture_index, num_objects) 
  {
    super (positions, normals, indices, vao, textures, num_objects)
    this.texture_index = texture_index
    this.num_objects = num_objects
    this.toWorldFromModels = []
    this.bounding_box = null
    // all Vec3s o
    this.translations = []
    this.rotations = []
    this.scales = []
    for (let i = 0; i < num_objects; i++)
    {
      this.translations.push (new Vector3 (0,0,0))
      this.rotations.push (new Vector3 (0,0,0))
      this.scales.push (new Vector3 (0,0,0))

    }
  }

  //sets mat4 at index
  setMatrix (worldFromModel, index) {
    this.toWorldFromModels[index] = worldFromModel
  }
  // gets mat4 at index
  getMatrix (index) {
    return this.toWorldFromModels[index]
  }

  setTranslation (index, new_translation) {
    this.translations[index] = new_translation
  }

  /**
   * Vector three with xyz contaning degree of rotation along that 
   * axis
   * @param {*} index 
   * @param {Vec3} rotation 
   */
  setRotation (index, rotation) {
    this.rotations[index] = rotation
  }

  /**
   * sets rotation along x ais
   * @param {*} index 
   * @param {*} degree 
   */
  setRotationX (index, degree) {
    this.rotations[index].set (0, degree)
  }

  /**
   * adds degree to rotation x
   * @param {*} index 
   * @param {*} degree 
   */
  addToRotationX (index, degree) {
    this.rotations[index].set (0, degree +
      this.rotations[index].x)
  }

  /**
   * sets rotation along x ais
   * @param {*} index 
   * @param {*} degree 
   */
   setRotationY (index, degree) {
    this.rotations[index].set (1, degree)
  }

  /**
   * adds degree to rotation x
   * @param {*} index 
   * @param {*} degree 
   */
  addToRotationY (index, degree) {
    this.rotations[index].set (1, degree + this.rotations[index].y)
  }

  /**
 * sets rotation along x ais
 * @param {*} index 
 * @param {*} degree 
 */
  setRotationZ (index, degree) {
    this.rotations[index].set (2, degree)
  }

  /**
   * adds degree to rotation x
   * @param {*} index 
   * @param {*} degree 
   */
  addToRotationZ (index, degree) {
    this.rotations[index].set (2, degree +
      this.rotations[index].z)
  }

  setScale (index, scale) {
    this.scales[index] = scale
  }

  // builds position matrix from transformations, rotations, and scales
  buildMatrix (index) {
    let translation = this.translations[index]
    let rotation = this.rotations[index]
    let scale = this.scales[index]

    let scaleM = Matrix4.scalev(scale)
    let rotationM = Matrix4.identity()
    if (rotation.x != 0)
      rotationM = rotationM.multiplyMatrix (Matrix4.rotateX(rotation.x))
    if (rotation.y != 0)
      rotationM = rotationM.multiplyMatrix (Matrix4.rotateY(rotation.y))
    if (rotation.z != 0)
      rotationM = rotationM.multiplyMatrix (Matrix4.rotateZ(rotation.z))

    let translationM = Matrix4.translate (translation.x, 
      translation.y, translation.z)
    
    return translationM.multiplyMatrix(scaleM).multiplyMatrix (rotationM)
  }

  setBoundingBox (bounding_box) {
    this.bounding_box = bounding_box
  }
  getBoundingBox () {return this.bounding_box}
}

  /**
   * 
   * @param {} trimesh_vao_group_arr trimesh vao group array
   * @returns gets total # of objs in group array
   */
   export function getGroupLength (trimesh_vao_group_arr) 
   {
     let size = 0
     for (let i = 0; i < trimesh_vao_group_arr.length; i++) {
       size += trimesh_vao_group_arr[i].size 
     }
     return size
   }