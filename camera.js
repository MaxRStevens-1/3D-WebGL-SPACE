import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'
import {Terrain} from './terrain'
import { Trimesh, TrimeshVao, TrimeshVaoGrouping, getGroupLength } from './trimesh'


export class Camera {
  /**
   * Forward: where forward is currently pointing
   * WorldUp: Where the world up is from the current position
   * right: where right is from the current position
   * @param {*} from vec3
   * @param {*} to vec3
   * @param {*} worldUp vec3 
   */
  constructor(from, to, worldUp) {
    this.position = from
    this.forward = to.add(this.position.inverse()).normalize()
    this.worldup = worldUp
    this.right = null;
    this.eyeFromWorld = null;
    this.degrees = 0;
    this.clamp = (num, min, max) => Math.min(Math.max(num, min), max);
    this.reorient();
  }

  strafe(distance) {
    this.position = this.position.add(this.right.scalarMultiply(distance))
    this.reorient()
  }

  advance(distance) {
    this.position = this.position.add(this.forward.scalarMultiply(distance))
    this.reorient()
  }

  elevate(distance) {
    this.position = this.position.add (this.worldup.scalarMultiply(distance))
    this.reorient()
  }

  yaw(degrees) {
    const forwardVec4 = new Vector4()
    forwardVec4.setall(this.forward.x, this.forward.y, this.forward.z, 1);
    const yawVec4 = Matrix4.rotateAroundAxis(this.worldup, degrees)
                          .multiplyVector(forwardVec4);
    this.forward = new Vector3(yawVec4.get(0), yawVec4.get(1), yawVec4.get(2));
    this.reorient()
  }

  pitch(degrees) {
    // set degrees
    if (degrees + this.degrees > -80 && degrees + this.degrees < 80) {
      // calculate pitch
      const forwardVec4 = new Vector4()
      forwardVec4.setall(this.forward.x, this.forward.y, this.forward.z, 0);
      const pitchVec4 = Matrix4.rotateAroundAxis(this.right, degrees)
                            .multiplyVector(forwardVec4);
      
      this.forward = new Vector3(pitchVec4.get(0), pitchVec4.get(1), pitchVec4.get(2));
      this.forward = this.forward.normalize()
      this.degrees += degrees
      this.reorient()
    }
  }

  reorient() {
    let translater = Matrix4.translate(
      -this.position.x,
      -this.position.y,
      -this.position.z
    )

    let rotaterMatrix = new Matrix4()
    rotaterMatrix.set(2, 0, -this.forward.x)
    rotaterMatrix.set(2, 1, -this.forward.y)
    rotaterMatrix.set(2, 2, -this.forward.z)
    rotaterMatrix.set(2, 3, 0)

    this.right = this.forward.cross(this.worldup).normalize()
    rotaterMatrix.set(0, 0, this.right.x)
    rotaterMatrix.set(0, 1, this.right.y)
    rotaterMatrix.set(0, 2, this.right.z)
    rotaterMatrix.set(0, 3, 0)

    const up = this.right.cross(this.forward).normalize()
    rotaterMatrix.set(1, 0, up.x)
    rotaterMatrix.set(1, 1, up.y)
    rotaterMatrix.set(1, 2, up.z)
    rotaterMatrix.set(1, 3, 0)
    rotaterMatrix.set(3, 0, 0)
    rotaterMatrix.set(3, 1, 0)
    rotaterMatrix.set(3, 2, 0)
    rotaterMatrix.set(3, 3, 1)


    this.eyeFromWorld = rotaterMatrix.multiplyMatrix(translater)
  }
}
export class SlideCamera extends Camera {
  /**  
   * from: where the camera is currently at
   * to:   where the camera is pointing
   * worldUp: where up is
   * time_delta: multipler for slide
   * velocity: current movement for camera
   */
  constructor (from, to, worldUp, time_delta) {
    super (from, to, worldUp);
    this.time_delta = time_delta
    this.end_point = this.position
    this.velocity = new Vector3 (0,0,0)
  }

  /**
   * Adds velocity to velocity vector end_point
   * @param {*} added_velocity 
   */
  adjustVelocityAdvance (added_velocity) {
    this.end_point = this.end_point.add(this.forward.scalarMultiply(added_velocity))
    this.velocity = this.velocity.add(this.forward.scalarMultiply(added_velocity))
   }
   
  /**
   * Adds velocity to velocity vector end_point
   * @param {*} added_velocity 
   */
   adjustVelocityStrafe (added_velocity) {
    this.end_point = this.end_point.add(this.right.scalarMultiply(added_velocity))
    this.velocity = this.velocity.add(this.right.scalarMultiply(added_velocity))

   }
   
  /**
   * Adds velocity to velocity vector end_point
   * @param {*} added_velocity 
   */
   adjustVelocityElevate (added_velocity) {
    this.elvate_move += added_velocity
    this.end_point = this.end_point.add(this.worldup.scalarMultiply(added_velocity))
    this.velocity = this.velocity.add(this.worldup.scalarMultiply(added_velocity))

   }

  /**
   * Resets velocity to 0
   */
  resetVelocity () {
    this.velocity = new Vector3 (0,0,0)
   } 

   /**
    * adds added_velocity to velocity vector.
    * @param {Vector3} added_velocity 
    */
   adjustVelocity (added_velocity) {
    this.velocity = this.velocity.add (added_velocity)
   }
   
   /**
    *  advances camera in time (by frame? by time?) by decreasing amount with 
    *  time_delta
    */
   timeStepMove () {
    this.position = this.position.add (this.velocity.scalarMultiply(this.time_delta))
    this.reorient()
   }
}

export class BoundCamera {
  constructor (camera, time_delta) {
    this.camera = camera
    this.time_delta = time_delta
    this.bound_position = new Vector3 (0,0,0)
    this.radius = 0
    this.x_heading = 1
    this.z_heading = 1
    this.distance_multiplier = 3
    this.base_distance_offset = 1000
    this.base_scale_amount = 5
    this.vao_group = null
    this.bound_obj_index = -1
    this.obj_radius = -1
  }

  /**
   * @param {float} scale 
   */
  moveCameraCloser (scale) {
    console.log ((this.radius - this.radius * .05))
    console.log ((this.obj_radius * 20))
    if (this.radius - this.radius*.05 > this.obj_radius * 5 / this.radius)  
    {
      this.radius -= this.radius * .05
      this.base_distance_offset -= this.radius * .05
    }
  }

  /**
   * @param {float} scale 
   */
  moveCameraAway (scale) {
    this.radius += this.radius * .05
    this.base_distance_offset += this.radius * .05
  }

  /**
   * Updates bound camera to inputed values
   * @param {TrimeshVaoGrouping} vao_group 
   * @param {int} index 
   * @param {float} radius 
   * @param {float} scale 
   */
  setBoundPosition (vao_group, index, radius, scale) {
    this.vao_group = vao_group
    this.bound_obj_index = index
    this.radius = radius * this.distance_multiplier + this.base_distance_offset * scale
    this.bound_position = new Vector3 (0,0,0)
    this.obj_radius = radius
  }

  /**
   * translates position on movement sphere by x and y movement.
   * @param {float} movement_x 
   * @param {float} movement_y 
   */
  mouseBoundSphereUpdate (movement_x, movement_y) {
    let bound_radius = this.radius
    let scale = bound_radius * .001
    let bound_x = this.bound_position.x
    let bound_y = this.bound_position.y
    let test_scale = .05
    let new_x = bound_x + movement_x * scale * this.x_heading
    let test_y
    if (bound_y >= 0)
      test_y = bound_y + movement_y * scale + (bound_radius * test_scale)
    else
      test_y = bound_y + movement_y * scale - (bound_radius * test_scale)
    
    if (test_y * test_y + bound_x * bound_x < bound_radius*bound_radius) 
      bound_y +=  movement_y * scale

    if (new_x*new_x + bound_y * bound_y >= bound_radius * bound_radius) 
      this.x_heading *= -1
    
    if (new_x * new_x + bound_y*bound_y >= bound_radius * bound_radius) 
      this.z_heading *= -1
    bound_x += movement_x * scale * this.x_heading
    this.bound_position = new Vector3 (bound_x, bound_y, this.bound_position.z)
  }

  /**
   * Updates sphere position.
   * @param {TrimeshVaoGrouping} vao_group 
   * @param {int} index 
   * @returns 
   */
  updateBoundSpherePosition () {
    let bound_x = this.bound_position.x
    let bound_y = this.bound_position.y
    let bound_radius = this.radius
    if (bound_x * bound_x + bound_y * bound_y >= bound_radius*bound_radius)
    {
      bound_x = 0
      bound_y = 0
    }
    let bound_z = Math.sqrt (bound_radius*bound_radius - bound_x*bound_x - bound_y*bound_y)
      * this.z_heading
    this.bound_position =  new Vector3 (bound_x, bound_y, -bound_z)
    let center = this.vao_group.buildMatrix (this.bound_obj_index)
      .multiplyVector (this.vao_group.centroid).xyz
    let p_position = this.bound_position.add (center)
    this.camera = new SlideCamera (p_position, center, new Vector3 (0,1,0), this.time_delta)
    return this.camera
  }

  /**
   * returns local camera
   * @returns camera
   */
  getCamera () {return this.camera}
  /**
   * updates current camera to inputed position / target
   * @param {Vector3} from 
   * @param {Vector3} to 
   */
  updatePosition (from, to) {
    this.camera = new SlideCamera (from, to, new Vector3 (0,1,0), time_delta)
  }
}
export class TerrianCamera extends Camera {
  constructor (from, to, worldUp, terrain, eyeLevel) {
    super (from, to, worldUp);
    this.terrain = terrain;
    this.eyeLevel = eyeLevel;
    this.buoy ()
    this.reorient ()
  }


  buoy () {
    let terrainMaxX = this.terrain.width
    let terrainMaxZ = this.terrain.depth
    this.position.x = this.clamp (this.position.x, 0, terrainMaxX)
    this.position.z = this.clamp (this.position.z, 0, terrainMaxZ)
    this.position.y = this.terrain.blerp (this.position.x, this.position.z) + this.eyeLevel;
  } 


  strafe(distance) {
    this.position = this.position.add(this.right.scalarMultiply(distance))
    this.buoy()
    this.reorient()
  }

  advance(distance) {
    this.position = this.position.add(this.forward.scalarMultiply(distance))
    this.buoy()
    this.reorient()
  }

}