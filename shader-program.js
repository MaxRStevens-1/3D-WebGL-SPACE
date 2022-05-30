export class ShaderProgram {
  constructor(vertexSource, fragmentSource, version = 300, precision = 'mediump') {
    // Compile.
    this.vertexShader = this.compileSource(gl.VERTEX_SHADER, `#version ${version} es\n${vertexSource}`);
    this.fragmentShader = this.compileSource(gl.FRAGMENT_SHADER, `#version ${version} es\nprecision ${precision} float;\n${fragmentSource}`);

    // Link.
    this.program = gl.createProgram();
    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);
    gl.linkProgram(this.program);

    let isOkay = gl.getProgramParameter(this.program, gl.LINK_STATUS);
    if (!isOkay) {
      let message = gl.getProgramInfoLog(this.program);
      gl.deleteProgram(this.program);
      throw message;
    }

    // Query uniforms.
    this.uniforms = {};
    let nuniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nuniforms; ++i) {
      let uniform = gl.getActiveUniform(this.program, i);
      let location = gl.getUniformLocation(this.program, uniform.name);
      this.uniforms[uniform.name] = location;
    }

    this.unbind();
  }

  destroy() {
    gl.deleteShader(this.vertexShader);
    gl.deleteShader(this.fragmentShader);
    gl.deleteProgram(this.program);
  }

  compileSource(type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    let isOkay = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!isOkay) {
      let message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw message;
    }

    return shader;
  }

  getAttributeLocation(name) {
    return gl.getAttribLocation(this.program, name);
  }

  bind() {
    gl.useProgram(this.program);
    this.isBound = true;
  }

  unbind() {
    gl.useProgram(null);
    this.isBound = false;
  }

  assertUniform(name) {
    if (!this.uniforms.hasOwnProperty(name)) {
      console.error(`${name} isn't a valid uniform.`);
    }
  }

  setUniform1i(name, value) {
    this.assertUniform(name);
    gl.uniform1i(this.uniforms[name], value);
  }

  setUniformMatrix4(name, matrix) {
    this.assertUniform(name);
    gl.uniformMatrix4fv(this.uniforms[name], false, matrix.toBuffer());
  }

  setUniform1f(name, value) {
    this.assertUniform(name);
    gl.uniform1f(this.uniforms[name], value);
  }

  setUniform2f(name, a, b) {
    this.assertUniform(name);
    gl.uniform2f(this.uniforms[name], a, b);
  }

  setUniform2fv(name, v) {
    this.assertUniform(name);
    gl.uniform2f(this.uniforms[name], v.x, v.y);
  }

  setUniform3f(name, a, b, c) {
    this.assertUniform(name);
    gl.uniform3f(this.uniforms[name], a, b, c);
  }

  setUniform3fv(name, v) {
    this.assertUniform(name);
    gl.uniform3f(this.uniforms[name], v.x, v.y, v.z);
  }
}
