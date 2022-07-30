import { Matrix4 } from './matrix'
import { Vector3, Vector4 } from './vector'

export class PlayerObject {
    /**
     * 
     * @param {TrimeshVaoGrouping} trivao 
     * @param {int} index 
     * @param {Vector3} position 
     * @param {float} rotation_theta 
     * @param {float} velocity_theta 
     * @param {Vector3} camera_offset
     */
    constructor (trivao, index, position, rotation_theta, velocity_theta,
         camera_offset) {
        this.trivao = trivao
        this.centroid = trivao.centroid
        this.index = index
        this.position = position
        this.current_rotation = new Vector3 (0,0,0)
        this.rotation_velocity = new Vector3 (0,0,0)
        this.rotation_theta = rotation_theta
        this.velocity = new Vector3 (0,0,0)
        this.velocity_theta = velocity_theta
        this.forward = null
        this.right = null
        this.up = null
        this.worldup  = new Vector3 (0,1,0)
        this.camera_offset = camera_offset
    }


    calculateDirectionVectors () {
        let ship = this.trivao
        let world_pos = ship.buildMatrix (this.index)
        let to = world_pos.multiplyVector(new Vector3 (0,0,1)).xyz
        let center = world_pos.multiplyVector (ship.centroid).xyz
        this.forward = center.sub(to).normalize()
        this.right = this.forward.cross (this.worldup).normalize()
        this.up = this.worldup
    }

    addToPosition (movement) {
        this.position = this.position.add (movement)
    }
    
    setPosition (position) {
        this.position = position
    }

    resetVelocity () {
        this.velocity = new Vector3 (0,0,0)
        this.rotation_velocity = new Vector3 (0,0,0)
    }
    
    addVelocityForward (force) {
        /*
        let world_pos = this.trivao.buildMatrix (this.index)
        let ship = this.trivao
        let temp_forward = ship.centroid.add (new Vector3 (0,0,10))
        this.forward = world_pos.multiplyVector(temp_forward).xyz.normalize()
        */
        this.velocity = this.velocity.add (this.forward.scalarMultiply (force))
    }
    
    addVelocityRight (force) {
        this.velocity = this.velocity.add (this.right.scalarMultiply (force))
    }
    
    addVelocityUp (force) {
        this.velocity = this.velocity.add (this.up.scalarMultiply (force))
    }

    addVelocity (added_velocity) {
        this.velocity = this.velocity.add (added_velocity)
    }

    /**
     * Adjusts position by velocity 
     */
    movePlayerByVelocity () {
        this.position = this.position.add (this.velocity.scalarMultiply(this.velocity_theta))
    }

    /**
     * adjusts rotation by rotational velocity
     */
    moveOrientationByRotation () {
        let current_adjustment = this.rotation_velocity.scalarMultiply (this.rotation_theta)
        this.current_rotation = this.current_rotation.add (current_adjustment)
        if (Math.abs(this.current_rotation.x) > 71.5 && this.current_rotation.x > 0)
            this.maxValueRotationXReached (71.5)
        else if (Math.abs(this.current_rotation.x) > 71.5 && this.current_rotation.x > 0)
            this.maxValueRotationXReached (-71.5)
        this.rotation_velocity = this.rotation_velocity.sub (current_adjustment)
    } 

    addRotation (rotation) {
        this.rotation_velocity = this.rotation_velocity.add (rotation)
    }

    setRotation (rotation) {
        this.current_rotation = rotation
    }

    maxValueRotationXReached (max_val) {
        this.rotation_velocity.set(0, 0)
        this.current_rotation.set (0, max_val)
    } 

    /**
     * Updates player by single frame.
     */
    tickUpdate () {
        this.calculateDirectionVectors ()
        this.movePlayerByVelocity ()
        this.trivao.setTranslation (this.index, new Vector3(this.position.x, this.position.y, this.position.z))
        this.moveOrientationByRotation ()
        let trivao_rot = new Vector4()
        trivao_rot.setall(this.current_rotation.x, this.current_rotation.y, this.current_rotation.z,0)
        this.trivao.setRotation (this.index, trivao_rot)
    }

    calculatePositionMovement () {
        this.calculateDirectionVectors ()
        this.movePlayerByVelocity ()
        this.trivao.setTranslation (this.index, new Vector3(this.position.x, this.position.y, this.position.z))
    }

    calculateOrientationMovement () {
        this.moveOrientationByRotation ()
        let trivao_rot = new Vector4()
        trivao_rot.setall(this.current_rotation.x, this.current_rotation.y, this.current_rotation.z,0)
        this.trivao.setRotation (this.index, trivao_rot)
    }

    adjustCameraOffsetUp () {
       this.camera_offset = this.camera_offset.scalarMultiply (1.1)
    }

    adjustCameraOffsetDown () {
        this.camera_offset = this.camera_offset.scalarMultiply (.9)
    }
} 