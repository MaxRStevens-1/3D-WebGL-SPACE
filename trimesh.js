import { Vector3 } from './vector'

export class Trimesh {
  constructor(positions, normals, indices, textures) {
    this.positions = positions
    this.normals = normals
    this.indices = indices
    this.textures = textures
    this.position_point = null;
    // set default values of min n max
    // very large constant
    this.min = new Vector3 (1000000,1000000,100000)
    this.max = new Vector3 (-1000000, -10000000, -1000000)
    this.createBoundingBox()
    //this.depth = 0
    this.centroid = new Vector3 ((this.min.x + this.max.x) / 2,
      (this.min.y + this.max.y) / 2, (this.min.z + this.max.z) / 2)
    if (normals.length == 0)
      this.generateNormals()
  }


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
  }
}