import { Vector4 } from './vector'

export class Matrix4 {
  constructor() {
    this.matrix = new Float32Array(16)
    /**
     * [ matrix[0] matrix[4] matrix[8]  matrix[12] ]
     * [ matrix[1] matrix[5] matrix[9]  matrix[13] ]
     * [ matrix[2] matrix[6] matrix[10] matrix[14] ]
     * [ matrix[3] matrix[7] matrix[11] matrix[15] ]
     */
  }

  get(row, col) {
    // col major order
    /**


         * row  0, col: 0, ind = matrix[0]
         * row: 1, col: 0, ind = matrix[1]
         * row: 3, col: 2, ind = matrix[11]
         * row: 2, col: 3, ind = matrix[14]
         * row: 3, col: 3, ind = matrix[15]
         * 
         * col * 4 + row
         */
    return this.matrix[col * 4 + row]
  }

  set(row, col, value) {
    this.matrix[col * 4 + row] = value
  }

  toBuffer() {
    return this.matrix
  }

  static identity() {
    const m = new Matrix4()
    m.set(0, 0, 1)
    m.set(1, 1, 1)
    m.set(2, 2, 1)
    m.set(3, 3, 1)
    return m
  }

  static scale(x, y, z) {
    // returns scaled by x,y,z matrix
    const scaledMatrix = Matrix4.identity()
    scaledMatrix.set(0, 0, x)
    scaledMatrix.set(1, 1, y)
    scaledMatrix.set(2, 2, z)
    return scaledMatrix
  }

  static translate(x, y, z) {
    // returns translated by x,y,z matrix
    const translatedMatrix = Matrix4.identity()
    translatedMatrix.set(0, 3, x)
    translatedMatrix.set(1, 3, y)
    translatedMatrix.set(2, 3, z)
    return translatedMatrix
  }

  static rotateX(degrees) {
    const radians = degrees * (Math.PI / 180)
    const cosa = Math.cos(radians)
    const sina = Math.sin(radians)

    const rotationMatrix = Matrix4.identity()
    rotationMatrix.set(1, 1, cosa)
    rotationMatrix.set(2, 1, sina)
    rotationMatrix.set(1, 2, -sina)
    rotationMatrix.set(2, 2, cosa)

    return rotationMatrix
  }

  static rotateY(degrees) {
    const radians = degrees * (Math.PI / 180)
    const cosa = Math.cos(radians)
    const sina = Math.sin(radians)

    const rotationMatrix = Matrix4.identity()
    rotationMatrix.set(0, 0, cosa)
    rotationMatrix.set(2, 0, sina)
    rotationMatrix.set(0, 2, -sina)
    rotationMatrix.set(2, 2, cosa)
    return rotationMatrix
  }

  static rotateZ(degrees) {
    const radians = degrees * (Math.PI / 180)
    const cosa = Math.cos(radians)
    const sina = Math.sin(radians)

    const rotationMatrix = Matrix4.identity()
    rotationMatrix.set(0, 0, cosa)
    rotationMatrix.set(1, 0, sina)
    rotationMatrix.set(0, 1, -sina)
    rotationMatrix.set(1, 1, cosa)
    return rotationMatrix
  }

  // accepts vector4
  multiplyVector(vector) {
    /*It accepts a Vector4 as a parameter.
     * It returns the product of the matrix and vector as a new Vector4.
     */
    const result = new Vector4()

    const x =
      this.get(0, 0) * vector.get(0) +
      this.get(0, 1) * vector.get(1) +
      this.get(0, 2) * vector.get(2) +
      this.get(0, 3) * vector.get(3)

    const y =
      this.get(1, 0) * vector.get(0) +
      this.get(1, 1) * vector.get(1) +
      this.get(1, 2) * vector.get(2) +
      this.get(1, 3) * vector.get(3)

    const z =
      this.get(2, 0) * vector.get(0) +
      this.get(2, 1) * vector.get(1) +
      this.get(2, 2) * vector.get(2) +
      this.get(2, 3) * vector.get(3)

    const homo =
      this.get(3, 0) * vector.get(0) +
      this.get(3, 1) * vector.get(1) +
      this.get(3, 2) * vector.get(2) +
      this.get(3, 3) * vector.get(3)

    result.set(0, x)
    result.set(1, y)
    result.set(2, z)
    result.set(3, homo)
    return result
  }

  // accepts matrix4
  multiplyMatrix(m) {
    // It returns the product of this matrix and the parameter matrix as a new Matrix4.
    const result = new Matrix4()
    // for each row in this matrix
    for (let i = 0; i < 4; i++) {
      // for each col in passed matrix
      for (let j = 0; j < 4; j++) {
        // get the dot product on the row and col
        const row = new Vector4()
        row.setall(
          this.get(i, 0),
          this.get(i, 1),
          this.get(i, 2),
          this.get(i, 3)
        )
        const col = new Vector4()
        col.setall(m.get(0, j), m.get(1, j), m.get(2, j), m.get(3, j))
        const prod = row.dot(col)
        result.set(i, j, prod)
      }
    }

    return result
  }

  static fovPerspective(verticalfov, frustumAspectRatio, nearClipping, farClipping) {
    const top = Math.tan(verticalfov / 2) * nearClipping
    const right = frustumAspectRatio * top
    const fovMatrix = new Matrix4()
    fovMatrix.set(0, 0, nearClipping / right)
    fovMatrix.set(1, 1, nearClipping / top)
    fovMatrix.set(2, 2, (nearClipping+farClipping) / (nearClipping-farClipping))
    fovMatrix.set(2, 3, (2*nearClipping*farClipping) / (nearClipping-farClipping))
    fovMatrix.set(3, 2, -1)

    return fovMatrix
  }

  static rotateAroundAxis(v, degrees) {
    const result = new Matrix4();
    const a = degrees * Math.PI / 180;
    const s = Math.sin(a);
    const c = Math.cos(a);
    const d = 1 - c;

    // first row
    result.set(0, 0, d * (v.get(0) * v.get(0)) + c)
    result.set(0, 1, d*v.get(0)*v.get(1) - s*v.get(2))
    result.set(0, 2, d*v.get(0)*v.get(2) + s*v.get(1))
    result.set(0, 3, 0)

    // second row
    result.set(1, 0, d*v.get(1)*v.get(0) + s*v.get(2))
    result.set(1, 1, d*v.get(1)*v.get(1) + c)
    result.set(1, 2, d*v.get(1)*v.get(2) - s*v.get(0))
    result.set(1, 3, 0)

    // third
    result.set(2, 0, d*v.get(2)*v.get(0) - s*v.get(1))
    result.set(2, 1, d*v.get(2)*v.get(1) + s*v.get(0))
    result.set(2, 2, d*v.get(2)*v.get(2) + c)
    result.set(2, 3, 0)

    result.set(3, 0, 0)
    result.set(3, 1, 0)
    result.set(3, 2, 0)
    result.set(3, 3, 1)

    return result
  }

  
  inverse() {
    let m = new Matrix4();

    let a0 = this.get(0, 0) * this.get(1, 1) - this.get(0, 1) * this.get(1, 0);
    let a1 = this.get(0, 0) * this.get(1, 2) - this.get(0, 2) * this.get(1, 0);
    let a2 = this.get(0, 0) * this.get(1, 3) - this.get(0, 3) * this.get(1, 0);

    let a3 = this.get(0, 1) * this.get(1, 2) - this.get(0, 2) * this.get(1, 1);
    let a4 = this.get(0, 1) * this.get(1, 3) - this.get(0, 3) * this.get(1, 1);
    let a5 = this.get(0, 2) * this.get(1, 3) - this.get(0, 3) * this.get(1, 2);

    let b0 = this.get(2, 0) * this.get(3, 1) - this.get(2, 1) * this.get(3, 0);
    let b1 = this.get(2, 0) * this.get(3, 2) - this.get(2, 2) * this.get(3, 0);
    let b2 = this.get(2, 0) * this.get(3, 3) - this.get(2, 3) * this.get(3, 0);

    let b3 = this.get(2, 1) * this.get(3, 2) - this.get(2, 2) * this.get(3, 1);
    let b4 = this.get(2, 1) * this.get(3, 3) - this.get(2, 3) * this.get(3, 1);
    let b5 = this.get(2, 2) * this.get(3, 3) - this.get(2, 3) * this.get(3, 2);

    let determinant = a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0;

    if (determinant != 0) {
      let inverseDeterminant = 1 / determinant;
      m.set(0, 0, (+this.get(1, 1) * b5 - this.get(1, 2) * b4 + this.get(1, 3) * b3) * inverseDeterminant);
      m.set(0, 1, (-this.get(0, 1) * b5 + this.get(0, 2) * b4 - this.get(0, 3) * b3) * inverseDeterminant);
      m.set(0, 2, (+this.get(3, 1) * a5 - this.get(3, 2) * a4 + this.get(3, 3) * a3) * inverseDeterminant);
      m.set(0, 3, (-this.get(2, 1) * a5 + this.get(2, 2) * a4 - this.get(2, 3) * a3) * inverseDeterminant);
      m.set(1, 0, (-this.get(1, 0) * b5 + this.get(1, 2) * b2 - this.get(1, 3) * b1) * inverseDeterminant);
      m.set(1, 1, (+this.get(0, 0) * b5 - this.get(0, 2) * b2 + this.get(0, 3) * b1) * inverseDeterminant);
      m.set(1, 2, (-this.get(3, 0) * a5 + this.get(3, 2) * a2 - this.get(3, 3) * a1) * inverseDeterminant);
      m.set(1, 3, (+this.get(2, 0) * a5 - this.get(2, 2) * a2 + this.get(2, 3) * a1) * inverseDeterminant);
      m.set(2, 0, (+this.get(1, 0) * b4 - this.get(1, 1) * b2 + this.get(1, 3) * b0) * inverseDeterminant);
      m.set(2, 1, (-this.get(0, 0) * b4 + this.get(0, 1) * b2 - this.get(0, 3) * b0) * inverseDeterminant);
      m.set(2, 2, (+this.get(3, 0) * a4 - this.get(3, 1) * a2 + this.get(3, 3) * a0) * inverseDeterminant);
      m.set(2, 3, (-this.get(2, 0) * a4 + this.get(2, 1) * a2 - this.get(2, 3) * a0) * inverseDeterminant);
      m.set(3, 0, (-this.get(1, 0) * b3 + this.get(1, 1) * b1 - this.get(1, 2) * b0) * inverseDeterminant);
      m.set(3, 1, (+this.get(0, 0) * b3 - this.get(0, 1) * b1 + this.get(0, 2) * b0) * inverseDeterminant);
      m.set(3, 2, (-this.get(3, 0) * a3 + this.get(3, 1) * a1 - this.get(3, 2) * a0) * inverseDeterminant);
      m.set(3, 3, (+this.get(2, 0) * a3 - this.get(2, 1) * a1 + this.get(2, 2) * a0) * inverseDeterminant);
    } else {
      throw Error('Matrix is singular.');
    }

    return m;
  }
}
