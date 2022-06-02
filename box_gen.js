import { VertexAttributes } from './vertex-attributes'
import { ShaderProgram } from './shader-program'
import { VertexArray } from './vertex-array'
import { Vector3, Vector4 } from './vector'
import { RenderObject } from './renderObject.js'
import { Matrix4 } from './matrix'
import { TrimeshVao } from '././trimesh'


export function readBoxen (box_string, shaderProgram, box_size) {
    let box_arr = box_string.split ('\n')
    let box_renders = []
  
    for (let i = 0; i < box_arr.length; i++) {
      if (box_arr[i].length < 9)
        continue
      let inter_arr = box_arr[i].split('   ')
      let c_pos_arr = inter_arr[0].split(' ')
      let c_hwd_arr = inter_arr[1].split(' ')
      let c_color_arr = inter_arr[2].split(' ')
     
     
      let c_color = new Vector3 (Number(c_color_arr[0]), Number(c_color_arr[1]), Number(c_color_arr[2]))
      let x= Number(c_pos_arr[0]),y= Number(c_pos_arr[1]), z=Number(c_pos_arr[2])
      let height=Number(c_hwd_arr[1]), width=Number(c_hwd_arr[0]), depth=Number(c_hwd_arr[2])
      let cube_attr = generateCube(height, width, depth, x, y, z)
      console.log (cube_attr)
      const attributes = new VertexAttributes();
      let positions = cube_attr[0]
      let normals = cube_attr[1]
      let faces = cube_attr[2]
      attributes.addAttribute('position', positions.length / 3, 3, positions);  
      attributes.addAttribute('normal', normals.length/ 3, 3, normals);
      attributes.addIndices(faces);
      let vao = new VertexArray(shaderProgram, attributes)
      box_renders.push (new TrimeshVao (positions, normals, faces, vao))
      //box_renders.push (new RenderObject (vao, position, null, "box", c_color))
    }     
    
    return box_renders
  }

 
  /**
   * takes in a boxes height, width, depth, and its position in space
   * @param {*} height 
   * @param {*} width 
   * @param {*} depth 
   * @param {*} offsetX 
   * @param {*} offsetY 
   * @param {*} offsetZ 
   * @returns an array with [positions, normals, faces]
   */
  export function generateCube(height, width, depth, offsetX, offsetY, offsetZ) {
    let positions = [];
    let normals = [];
    // minimum # of points to construct a cube
    let npoints = 2
    for (let z = 0; z < npoints; z++) {
      let depthProp = z / npoints;
      for (let y = 0; y < npoints; y++) {
        let heightProp = y / npoints;
        for (let x = 0; x < npoints; x++) {
          let widthProp = x / npoints;
          positions.push( width  * x + offsetX, 
                          height * y + offsetY,
                          depth  * z + offsetZ)
        
          normals.push  (widthProp, heightProp, depthProp)
        }
      }
    }
  
    // compute triangles
    let faces = [];
    for (let z = 0; z < npoints - 1; z++) {
      for (let y = 0; y < npoints - 1; y++) {
        for (let x = 0; x < npoints - 1; x++) {
          // yx pane
          if (z == 0) {
            faces.push ((z * npoints*npoints) + ((y + 1) * npoints) + x, 
                        (z * npoints*npoints) + (y       * npoints) + x, 
                        (z * npoints*npoints) + (y       * npoints) + x + 1)
  
            faces.push ((z * npoints*npoints) + ((y + 1) * npoints) + x, 
                        (z * npoints*npoints) + ((y + 1) * npoints) + x + 1,
                        (z * npoints*npoints) + (y       * npoints) + x + 1)
          }
          // zx pane
          if (y == 0) {
            faces.push (((z+1) * npoints*npoints) + (y * npoints) + x, 
                        (z     * npoints*npoints) + (y * npoints) + x, 
                        (z     * npoints*npoints) + (y * npoints) + x + 1)
  
            faces.push (((z+1) * npoints*npoints) + (y * npoints) + x, 
                        ((z+1) * npoints*npoints) + (y * npoints) + x + 1,
                        (z     * npoints*npoints) + (y * npoints) + x + 1)
          }
          
          // z/y pane
          if (x == 0 ) {
            faces.push (((z+1) * npoints*npoints) + (y     * npoints) + x, 
                        (z     * npoints*npoints) + (y     * npoints) + x, 
                        (z     * npoints*npoints) + ((y+1) * npoints) + x)
            
            faces.push (((z+1) * npoints*npoints) + (y     * npoints) + x, 
                        ((z+1) * npoints*npoints) + ((y+1) * npoints) + x,
                        (z     * npoints*npoints) + ((y+1) * npoints) + x)
          }
  
          // x /y/z backface
          if ( x == npoints - 2) {
            faces.push (((z+1) * npoints*npoints) + (y     * npoints) + x + 1, 
                      ((z+1) * npoints*npoints) + ((y+1) * npoints) + x + 1,
                      (z     * npoints*npoints) + ((y+1) * npoints) + x + 1)
            faces.push (((z+1) * npoints*npoints) + (y     * npoints) + x + 1, 
                      (z     * npoints*npoints) + (y     * npoints) + x + 1, 
                      (z     * npoints*npoints) + ((y+1) * npoints) + x + 1)
          }
          // z / y /x
          if (z == npoints - 2) {
            faces.push (((z+1) * npoints*npoints) + ((y + 1) * npoints) + x, 
                      ((z+1) * npoints*npoints) + (y       * npoints) + x, 
                      ((z+1) * npoints*npoints) + (y       * npoints) + x + 1)
  
            faces.push (((z+1) * npoints*npoints) + ((y + 1) * npoints) + x, 
                      ((z+1) * npoints*npoints) + ((y + 1) * npoints) + x + 1,
                      ((z+1) * npoints*npoints) + (y       * npoints) + x + 1)
          }
          //y/z/x pane
          if (y == npoints - 2) {
            faces.push (((z+1) * npoints*npoints) + ((y+1) * npoints) + x, 
                        (z     * npoints*npoints) + ((y+1) * npoints) + x, 
                        (z     * npoints*npoints) + ((y+1) * npoints) + x + 1)
  
            faces.push (((z+1) * npoints*npoints) + ((y+1) * npoints) + x, 
                        ((z+1) * npoints*npoints) + ((y+1) * npoints) + x + 1,
                        (z     * npoints*npoints) + ((y+1) * npoints) + x + 1)
          }
        }
      }
    }
  
    /*const attributes = new VertexAttributes();
    attributes.addAttribute('position', positions.length / 3, 3, positions);  
    attributes.addAttribute('normal', normals.length/ 3, 3, normals);
    attributes.addIndices(faces);*/
    return [positions, normals, faces];
  
  }
  
  