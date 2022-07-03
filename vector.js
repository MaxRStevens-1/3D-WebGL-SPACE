export class Vector4 {
  constructor() {
    this.coordinates = [0, 0, 0, 0]
  }
  setall(x, y, z, h) {
    this.coordinates = [x, y, z, h]
  }
  get(index) {
    return this.coordinates[index]
  }
  get x() {
    return this.coordinates[0]
  }
  get y() {
    return this.coordinates[1]
  }
  get z() {
    return this.coordinates[2]
  }
  get xyz () {
    return new Vector3 (this.coordinates[0], this.coordinates[1], this.coordinates[2])
  }
  get magnitude_vec3() {
    return Math.sqrt(
      this.coordinates[0] * this.coordinates[0] +
        this.coordinates[1] * this.coordinates[1] +
        this.coordinates[2] * this.coordinates[2]
    )
  }
  normalize() {
    let magnitude = this.magnitude_vec3
    if (magnitude == 0) return
    if (magnitude == 1) return this
    const normal = new Vector4()
    normal.setall(
      this.coordinates[0] / magnitude,
      this.coordinates[1] / magnitude,
      this.coordinates[2] / magnitude,
      1
    )
    return normal
  }
  set(index, value) {
    this.coordinates[index] = value
  }
  dot(other) {
    return (
      this.get(0) * other.get(0) +
      this.get(1) * other.get(1) +
      this.get(2) * other.get(2) +
      this.get(3) * other.get(3)
    )
  }
  cross(that) {
    const result = new Vector4()
    const x = this.get(1) * that.get(2) - this.get(2) * that.get(1)
    const y = this.get(2) * that.get(0) - this.get(0) * that.get(2)
    const z = this.get(0) * that.get(1) - this.get(1) * that.get(0)
    result.setall(x, y, z, this.get(3))
    return result
  }
}
export class Vector3 {
  constructor(x, y, z) {
    this.coordinates = [x, y, z]
  }
  toString() {
    return `[${this.coordinates[0]}, ${this.coordinates[1]}, ${this.coordinates[2]}]`
  }
  // morphs vec3 to vec4 with homo cord
  toVec4 () {
    let result = new Vector4()
    result.set (0, this.coordinates[0])
    result.set (1, this.coordinates[1])
    result.set (2, this.coordinates[2])
    result.set (3, 1)
    return result
  }

  set(index, value) {
    this.coordinates[index] = value
  }

  inverse() {
    return new Vector3(
      -this.coordinates[0],
      -this.coordinates[1],
      -this.coordinates[2]
    )
  }
  add(that) {
    return new Vector3(
      this.coordinates[0] + that.coordinates[0],
      this.coordinates[1] + that.coordinates[1],
      this.coordinates[2] + that.coordinates[2]
    )
  }
  scalarMultiply(scalar) {
    return new Vector3(
      this.coordinates[0] * scalar,
      this.coordinates[1] * scalar,
      this.coordinates[2] * scalar
    )
  }
  /**
   * caps vector to max value
   * @param {*} max_value maximum value allowed for vector
   * @returns new capped vector
   */
  capVector (max_value) {
    return new Vector3 (
      Math.min (this.coordinates[0], max_value),
      Math.min (this.coordinates[1], max_value),
      Math.min (this.coordinates[2], max_value)
    )
  }
  normalize() {
    let magnitude = this.magnitude
    if (magnitude == 0) return
    if (magnitude == 1) return this
    return new Vector3(
      this.coordinates[0] / magnitude,
      this.coordinates[1] / magnitude,
      this.coordinates[2] / magnitude
    )
  }
  get magnitude() {
    return Math.sqrt(
      this.coordinates[0] * this.coordinates[0] +
        this.coordinates[1] * this.coordinates[1] +
        this.coordinates[2] * this.coordinates[2]
    )
  }
  get x() {
    return this.coordinates[0]
  }
  get y() {
    return this.coordinates[1]
  }
  get z() {
    return this.coordinates[2]
  }
  set x(value) {
    this.coordinates[0] = value
  }
  set y(value) {
    this.coordinates[1] = value
  }
  set z(value) {
    this.coordinates[2] = value
  }
  cross(that) {
    const x = this.y * that.z - this.z * that.y
    const y = this.z * that.x - this.x * that.z
    const z = this.x * that.y - this.y * that.x
    const result = new Vector3(x, y, z)
    return result
  }
  dot(other) {
    return this.x * other.x + this.y * other.y + this.z * other.z
  }
  get(index) {
    if (index > 2) {
      return 1
    }
    return this.coordinates[index]
  }
  sub(that) {
    return new Vector3(
      this.coordinates[0] - that.coordinates[0],
      this.coordinates[1] - that.coordinates[1],
      this.coordinates[2] - that.coordinates[2]
    )
  }
}
