export class VertexArray {
  constructor(program, attributes) {
    this.vertexArray = gl.createVertexArray();
    this.attributes = attributes;

    gl.bindVertexArray(this.vertexArray);
    for (let attribute of attributes) {
      let location = program.getAttributeLocation(attribute.name);
      if (location < 0) {
        console.log(`${attribute.name} is not used in the shader.`);
      } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
        gl.vertexAttribPointer(location, attribute.ncomponents, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(location);
      }
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attributes.indexBuffer);

    this.unbind();
  }

  bind() {
    gl.bindVertexArray(this.vertexArray);
    this.isBound = true;
  }

  destroy() {
    gl.deleteVertexArray(this.vertexArray);
  }

  unbind() {
    gl.bindVertexArray(null);
    this.isBound = false;
  }

  drawSequence(mode) {
    gl.drawArrays(mode, 0, this.attributes.vertexCount);
  }

  drawIndexed(mode) {
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.attributes.indexBuffer);
    gl.drawElements(mode, this.attributes.indexCount, gl.UNSIGNED_INT, 0);
  }
}