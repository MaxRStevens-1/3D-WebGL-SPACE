export class VertexAttribute {
  constructor(name, nvertices, ncomponents, floats, usage = gl.STATIC_DRAW) {
    this.name = name;
    this.nvertices = nvertices;
    this.ncomponents = ncomponents;

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floats), usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  update(floats) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(floats));
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  destroy() {
    gl.deleteBuffer(this.buffer);
  }
}

export class VertexAttributes {
  constructor() {
    this.nvertices = -1;
    this.indexBuffer = null;
    this.attributes = [];
  }

  addAttribute(name, nvertices, ncomponents, floats, usage = gl.STATIC_DRAW) {
    if (this.nvertices >= 0 && nvertices != this.nvertices) {
      throw "Attributes must have same number of vertices.";
    }

    this.nvertices = nvertices;
    let attribute = new VertexAttribute(name, nvertices, ncomponents, floats, usage);
    this.attributes.push(attribute);

    return attribute;
  }

  addIndices(ints, usage = gl.STATIC_DRAW) {
    this.indexCount = ints.length;
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(ints), usage);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  destroy() {
    for (let attribute of this.attributes) {
      attribute.destroy();
    }

    if (this.indexBuffer) {
      gl.deleteBuffer(this.indexBuffer);
    }
  }

  [Symbol.iterator]() {
    return this.attributes.values();
  }

  get vertexCount() {
    return this.nvertices;
  }
}